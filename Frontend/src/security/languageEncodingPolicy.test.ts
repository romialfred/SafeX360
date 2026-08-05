import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd(), 'src');
const sourceExtensions = new Set(['.ts', '.tsx', '.json', '.css']);

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : sourceExtensions.has(extname(path)) ? [path] : [];
});

describe('langue et encodage des sources UI', () => {
    it('refuse les séquences usuelles de mojibake et le caractère de remplacement', () => {
        const mojibake = /\u00c3|\u00c2|\u00e2\u20ac\u2122|\u00e2\u20ac\u201c|\u00e2\u20ac\u201d|\u00e2\u20ac\u00a6|\ufffd/;
        const corrupted = sourceFiles(root)
            .filter((path) => mojibake.test(readFileSync(path, 'utf8')))
            .map((path) => relative(root, path));

        expect(corrupted).toEqual([]);
        // Délai explicite : ce test lit la TOTALITÉ des sources de src/. Sur une
        // machine chargée (build concurrent, suite complète en séquentiel) la
        // lecture dépasse le délai par défaut de 5 s de Vitest, et l'échec se
        // présente alors comme une violation d'encodage — un faux positif
        // coûteux à diagnostiquer, constaté le 2026-08-05. Le budget ci-dessous
        // ne masque rien : une vraie séquence de mojibake échoue immédiatement.
    }, 60_000);

    it('empêche le retour des libellés anglais génériques corrigés', () => {
        const files = [
            'components/SettingFolder/SeverityLevel/SeverityLevelData.tsx',
            'components/HomePage/Polcies.tsx',
            'components/NewDashboard/RiskAssessments.tsx',
            'components/NewDashboard/ActivityTask.tsx',
            'components/Landing/Navbar/Navbar.tsx',
            'components/NewComponents/UsersManagement/UsersManagement.tsx',
            'components/NewComponents/UsersManagement/AddUserForm.tsx',
        ];
        const visibleEnglish = />\s*(Update|View|Dashboard|Status|Details|Delete|Edit)\s*</;

        expect(files.filter((path) => visibleEnglish.test(readFileSync(join(root, path), 'utf8')))).toEqual([]);
    });
});
