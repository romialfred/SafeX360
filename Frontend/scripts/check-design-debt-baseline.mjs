import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(frontendRoot, 'src');
const baselinePath = path.join(frontendRoot, 'quality', 'design-debt-baseline.json');
const updateRequested = process.argv.includes('--update');
const extensions = new Set(['.ts', '.tsx', '.css']);

async function files(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) return files(candidate);
        return extensions.has(path.extname(candidate)) ? [candidate] : [];
    }));
    return nested.flat();
}

const patterns = {
    hexColors: /#[\da-f]{3,8}\b/giu,
    inlineStyles: /\bstyle\s*=\s*\{\{/gu,
    pixelValues: /\b\d+(?:\.\d+)?px\b|\[\d+(?:\.\d+)?px\]/gu,
    maxWidthUtilities: /\bmax-w-(?:\[[^\]]+\]|[\w.-]+)/gu,
    transitionAll: /\btransition-all\b/gu,
};

const totals = Object.fromEntries(Object.keys(patterns).map((key) => [key, 0]));
for (const file of await files(sourceRoot)) {
    const source = await readFile(file, 'utf8');
    for (const [key, pattern] of Object.entries(patterns)) {
        totals[key] += source.match(pattern)?.length ?? 0;
    }
}

if (updateRequested) {
    await writeFile(baselinePath, `${JSON.stringify({
        schemaVersion: 1,
        policy: 'La dette existante est gelee; aucun compteur ne peut augmenter.',
        totals,
    }, null, 2)}\n`, 'utf8');
    console.log(`Baseline design mise à jour: ${JSON.stringify(totals)}.`);
    process.exit(0);
}

const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
const regressions = Object.entries(totals)
    .filter(([key, value]) => value > (baseline.totals?.[key] ?? -1))
    .map(([key, value]) => `${key}: ${baseline.totals?.[key] ?? 'absent'} -> ${value}`);

if (regressions.length > 0) {
    console.error(`Régression du design system:\n- ${regressions.join('\n- ')}`);
    process.exit(1);
}

console.log(`Baseline design respectée: ${JSON.stringify(totals)}.`);
