import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(frontendRoot, 'quality', 'eslint-baseline.json');
const updateRequested = process.argv.includes('--update');

function normalizedPath(filePath) {
    return path.relative(frontendRoot, filePath).replaceAll('\\', '/');
}

function sourceLine(result, message) {
    if (!result.source || !message.line) return '';
    return (result.source.split(/\r?\n/u)[message.line - 1] ?? '').trim();
}

function collectFindings(results) {
    const findings = new Map();
    let errors = 0;
    let warnings = 0;

    for (const result of results) {
        const file = normalizedPath(result.filePath);
        errors += result.errorCount;
        warnings += result.warningCount;

        for (const message of result.messages) {
            const entry = {
                file,
                ruleId: message.ruleId ?? 'eslint/fatal',
                severity: message.severity,
                message: message.message,
                source: sourceLine(result, message),
            };
            const fingerprint = createHash('sha256')
                .update(JSON.stringify(entry))
                .digest('hex');
            const existing = findings.get(fingerprint);
            findings.set(fingerprint, {
                fingerprint,
                ...entry,
                count: (existing?.count ?? 0) + 1,
            });
        }
    }

    return {
        totals: { errors, warnings },
        entries: [...findings.values()].sort((left, right) =>
            left.fingerprint.localeCompare(right.fingerprint),
        ),
    };
}

async function readBaseline() {
    try {
        const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
        if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.entries)) {
            throw new Error('schemaVersion ou entries invalide');
        }
        return baseline;
    } catch (error) {
        throw new Error(
            `Baseline ESLint absente ou invalide (${baselinePath}): ${error.message}`,
        );
    }
}

function formatFinding(entry, excess) {
    return `${entry.file} [${entry.ruleId}] +${excess}: ${entry.message}`;
}

const eslint = new ESLint({ cwd: frontendRoot });
const current = collectFindings(await eslint.lintFiles(['.']));

if (updateRequested) {
    const baseline = {
        schemaVersion: 1,
        policy: 'Dette existante gelee; toute nouvelle occurrence fait echouer le controle.',
        totals: current.totals,
        entries: current.entries,
    };
    await mkdir(path.dirname(baselinePath), { recursive: true });
    await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
    console.log(
        `Baseline ESLint mise a jour: ${current.totals.errors} erreurs, ${current.totals.warnings} avertissements.`,
    );
    process.exit(0);
}

const baseline = await readBaseline();
const allowed = new Map(baseline.entries.map((entry) => [entry.fingerprint, entry.count]));
const newFindings = current.entries
    .map((entry) => ({
        ...entry,
        excess: Math.max(0, entry.count - (allowed.get(entry.fingerprint) ?? 0)),
    }))
    .filter((entry) => entry.excess > 0);

if (newFindings.length > 0) {
    console.error(
        `Echec baseline ESLint: ${newFindings.reduce((sum, entry) => sum + entry.excess, 0)} nouvelle(s) occurrence(s).`,
    );
    for (const entry of newFindings.slice(0, 30)) {
        console.error(`- ${formatFinding(entry, entry.excess)}`);
    }
    if (newFindings.length > 30) console.error(`- ... ${newFindings.length - 30} groupe(s) supplementaire(s)`);
    process.exit(1);
}

const currentCount = current.totals.errors + current.totals.warnings;
const baselineCount = baseline.totals.errors + baseline.totals.warnings;
console.log(
    `Baseline ESLint respectee: ${current.totals.errors} erreurs, ${current.totals.warnings} avertissements (${baselineCount - currentCount} occurrence(s) resolue(s)).`,
);
