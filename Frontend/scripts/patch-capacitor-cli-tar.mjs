/**
 * Correctif de @capacitor/cli 6 face à tar 7.
 *
 * package.json impose tar 7 à @capacitor/cli (`overrides`) pour écarter les
 * avis de sécurité de tar 6. Or la CLI 6 appelle `tar.default.extract(...)`,
 * et tar 7 n'a plus d'export par défaut : `cap add android` et `cap sync android`
 * plantaient sur « Cannot read properties of undefined (reading 'extract') ».
 *
 * Le correctif remplace l'appel par l'export nommé `extract`, présent en v6
 * comme en v7. Idempotent ; à lancer après `npm ci` et avant toute commande
 * `cap` (workflow Android et scripts android:*). Sans objet après un passage
 * à Capacitor 7, qui importe tar correctement : le script le signale alors.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const TAG = '[patch-capacitor-cli-tar]';

let cliDir;
try {
    cliDir = dirname(require.resolve('@capacitor/cli/package.json'));
} catch {
    console.log(`${TAG} @capacitor/cli absent, rien à faire.`);
    process.exit(0);
}

const file = join(cliDir, 'dist', 'util', 'template.js');
const BROKEN = 'await tar_1.default.extract({ file: src, cwd: dir });';
const FIXED = 'await (tar_1.default || tar_1).extract({ file: src, cwd: dir });';

const source = readFileSync(file, 'utf8');
if (source.includes(FIXED)) {
    console.log(`${TAG} déjà appliqué.`);
} else if (source.includes(BROKEN)) {
    writeFileSync(file, source.replace(BROKEN, FIXED));
    console.log(`${TAG} appliqué à ${file}.`);
} else {
    console.log(`${TAG} motif introuvable (CLI mise à jour ?), aucun changement.`);
}
