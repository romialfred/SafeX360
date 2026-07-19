import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (relativePath: string): string =>
    readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('configuration locale de securite', () => {
    it('ne conserve aucun runtime cache generique pour les API authentifiees', () => {
        const viteConfig = readProjectFile('vite.config.ts');

        expect(viteConfig).not.toContain("cacheName: 'safex-api-get'");
        expect(viteConfig).not.toContain("url.pathname.startsWith('/hns/')");
        expect(viteConfig).not.toContain("url.pathname.startsWith('/api/')");
    });

    it('desactive les sauvegardes Android et exclut chaque domaine applicatif', () => {
        // android/ est généré et ignoré : le contrôle doit donc être porté par
        // un script versionné, exécuté après chaque `cap sync`.
        const hardeningScript = readProjectFile('scripts/harden-android-backup.mjs');

        expect(hardeningScript).toContain("'allowBackup', 'false'");
        expect(hardeningScript).toContain("'fullBackupContent', '@xml/backup_rules'");
        expect(hardeningScript).toContain("'dataExtractionRules'");
        expect(hardeningScript).toContain("'@xml/data_extraction_rules'");

        for (const domain of ['root', 'file', 'database', 'sharedpref', 'external']) {
            expect(hardeningScript).toContain(`<exclude domain="${domain}" path="." />`);
            expect(hardeningScript.match(new RegExp(`<exclude domain="${domain}" path="\\." />`, 'g')))
                .toHaveLength(3);
        }
    });
});
