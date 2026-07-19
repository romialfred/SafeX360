#!/usr/bin/env python3
"""Fail a build when a tracked source file contains a high-confidence secret.

The scanner never prints a matched value. Its output is deliberately limited
to a rule identifier and a source location so CI logs cannot disclose secrets.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True, order=True)
class Finding:
    rule: str
    path: str
    line: int


TEXT_SUFFIXES = {
    ".conf", ".env", ".ini", ".java", ".js", ".json", ".jsx", ".md",
    ".properties", ".ps1", ".py", ".sh", ".toml", ".ts", ".tsx",
    ".xml", ".yaml", ".yml",
}
MAX_FILE_SIZE = 2_000_000

PRIVATE_KEY = re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")
URL_CREDENTIALS = re.compile(r"(?i)https?://[^\s/:@]+:[^\s/@]+@")
PROVIDER_TOKENS = (
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(r"sk_(?:live|test)_[A-Za-z0-9]{16,}"),
)
SPRING_DEFAULT = re.compile(r"\$\{(?P<name>[A-Za-z0-9_.-]+):(?P<value>[^}]*)\}")
ARGPARSE_DEFAULT = re.compile(
    r"add_argument\s*\(\s*['\"]--(?P<name>password|passwd|pwd|secret|token|api[_-]?key)['\"]"
    r"[^\n]*?default\s*=\s*(?P<quote>['\"])(?P<value>[^'\"]+)(?P=quote)",
    re.IGNORECASE,
)
JAVA_ASSIGNMENT = re.compile(
    r"\b(?:String|char\[\])\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*"
    r"(?P<quote>['\"])(?P<value>[^'\"]+)(?P=quote)"
)
SCRIPT_ASSIGNMENT = re.compile(
    r"(?m)^\s*(?:export\s+)?\$?(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*"
    r"(?P<quote>['\"])(?P<value>[^'\"]+)(?P=quote)"
)
CONFIG_ASSIGNMENT = re.compile(
    r"(?m)^\s*(?P<name>[A-Za-z_][A-Za-z0-9_.-]*)\s*[:=]\s*"
    r"(?P<quote>['\"]?)(?P<value>[^\s#'\"]+)(?P=quote)\s*$"
)

SENSITIVE_WORDS = {"PASSWORD", "PASSWD", "PWD", "SECRET", "TOKEN"}
PLACEHOLDER = re.compile(
    r"(?i)^(?:<[^>]+>|(?:change|replace|your|example|dummy|placeholder|not[-_]?set|"
    r"test[-_]?only)[-_a-z0-9.<>]*)$"
)
ENV_REFERENCE = re.compile(r"^\$(?:\{[A-Za-z_][A-Za-z0-9_]*\}|[A-Za-z_][A-Za-z0-9_]*)$")


def _identifier_words(name: str) -> set[str]:
    separated = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    return {part.upper() for part in re.split(r"[^A-Za-z0-9]+", separated) if part}


def _is_sensitive_name(name: str) -> bool:
    words = _identifier_words(name)
    if "HEADER" in words or words == {"ID", "TOKEN"}:
        return False
    return bool(words & SENSITIVE_WORDS) or {"API", "KEY"}.issubset(words) or {
        "PRIVATE", "KEY"
    }.issubset(words)


def _is_safe_value(value: str) -> bool:
    normalized = value.strip().strip("'\"")
    return (
        not normalized
        or normalized.startswith("${{")
        or bool(PLACEHOLDER.fullmatch(normalized))
        or bool(ENV_REFERENCE.fullmatch(normalized))
    )


def _line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def scan_text(path: str, text: str) -> list[Finding]:
    findings: set[Finding] = set()
    suffix = Path(path).suffix.lower()

    def add(rule: str, offset: int) -> None:
        findings.add(Finding(rule, path, _line_number(text, offset)))

    for match in PRIVATE_KEY.finditer(text):
        add("private-key", match.start())
    for match in URL_CREDENTIALS.finditer(text):
        add("url-credentials", match.start())
    for pattern in PROVIDER_TOKENS:
        for match in pattern.finditer(text):
            add("provider-token", match.start())

    if suffix in {".java", ".properties", ".yaml", ".yml"}:
        for match in SPRING_DEFAULT.finditer(text):
            if _is_sensitive_name(match.group("name")) and not _is_safe_value(match.group("value")):
                add("spring-secret-default", match.start())
    for match in ARGPARSE_DEFAULT.finditer(text):
        if not _is_safe_value(match.group("value")):
            add("cli-secret-default", match.start())

    assignment_pattern = JAVA_ASSIGNMENT if suffix == ".java" else SCRIPT_ASSIGNMENT
    if suffix in {".java", ".py", ".sh", ".ps1"}:
        for match in assignment_pattern.finditer(text):
            if _is_sensitive_name(match.group("name")) and not _is_safe_value(match.group("value")):
                add("literal-secret-assignment", match.start())
    if suffix in {".env", ".ini", ".properties", ".toml", ".yaml", ".yml"}:
        for match in CONFIG_ASSIGNMENT.finditer(text):
            if _is_sensitive_name(match.group("name")) and not _is_safe_value(match.group("value")):
                add("config-secret-assignment", match.start())

    return sorted(findings)


def tracked_files(root: Path) -> list[Path]:
    completed = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=root,
        check=True,
        stdout=subprocess.PIPE,
    )
    return [root / entry for entry in completed.stdout.decode("utf-8").split("\0") if entry]


def scan_files(root: Path, paths: Iterable[Path]) -> list[Finding]:
    findings: list[Finding] = []
    for path in paths:
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {".env", ".env.example"}:
            continue
        try:
            if path.stat().st_size > MAX_FILE_SIZE:
                continue
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        findings.extend(scan_text(path.relative_to(root).as_posix(), text))
    return sorted(set(findings))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scan des secrets dans les fichiers suivis par Git")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args(argv)
    root = args.root.resolve()

    findings = scan_files(root, tracked_files(root))
    for finding in findings:
        print(f"[secret-scan] {finding.rule} {finding.path}:{finding.line}")
    if findings:
        print(f"[secret-scan] ECHEC: {len(findings)} occurrence(s) potentielle(s); valeurs masquées.")
        return 1
    print("[secret-scan] OK: aucun secret haute confiance dans les fichiers suivis.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
