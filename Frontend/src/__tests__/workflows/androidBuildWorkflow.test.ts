import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '../.github/workflows/android-build.yml');
const workflow = readFileSync(workflowPath, 'utf8');

describe('AUD-REL-001 — politique de livraison Android', () => {
    it('interdit toute mutation Git et limite les permissions par defaut', () => {
        expect(workflow).toMatch(/^permissions:\s*\n\s+contents: read$/m);
        expect(workflow).not.toMatch(/\bcontents:\s*write\b/);
        expect(workflow).not.toMatch(/\bgit\s+(?:add|commit|push)\b/);
        expect(workflow).not.toContain('Mobile/SafexMobile.apk');
        expect(workflow).not.toContain('Frontend/public/downloads/SafexMobile.apk');
        expect(workflow).toContain('persist-credentials: false');
        expect(workflow).toContain('runs-on: ubuntu-24.04');
    });

    it('bloque une release non signee ou fondee sur un keystore invalide', () => {
        for (const secret of [
            'ANDROID_KEYSTORE_BASE64',
            'ANDROID_KEYSTORE_PASSWORD',
            'ANDROID_KEY_ALIAS',
            'ANDROID_KEY_PASSWORD',
        ]) {
            expect(workflow).toContain(secret);
        }

        expect(workflow).toContain('keytool -list');
        expect(workflow).not.toContain('key.properties');
        expect(workflow).toContain('zipalign" -f -v 4');
        expect(workflow).toContain('apksigner" sign');
        expect(workflow).toContain('apksigner" verify --verbose --print-certs');
        expect(workflow).not.toMatch(/apksigner[\s\S]{0,240}\|\|\s*echo/);
        expect(workflow).toContain('Remove release signing material');
    });

    it('reapplique le durcissement Android immediatement apres cap sync', () => {
        const syncIndex = workflow.indexOf('run: npx cap sync android');
        const hardenIndex = workflow.indexOf('run: npm run android:harden');
        const gradleIndex = workflow.indexOf('run: ./gradlew assembleDebug');

        expect(syncIndex).toBeGreaterThan(-1);
        expect(hardenIndex).toBeGreaterThan(syncIndex);
        expect(gradleIndex).toBeGreaterThan(hardenIndex);
    });

    it('produit checksum, SBOM CycloneDX et attestations liees au commit', () => {
        expect(workflow).toContain('sha256sum --check SHA256SUMS.txt');
        expect(workflow).toContain('format: cyclonedx-json');
        // `artifact-metadata` n'est PAS un scope de permissions GitHub Actions
        // documente : une cle inconnue invalide le workflow entier des le
        // parsing. Le test verrouillait donc un defaut — il verifie desormais
        // que la cle n'y est PLUS.
        expect(workflow).not.toContain('artifact-metadata:');
        expect(workflow).toContain('attestations: write');
        expect(workflow.match(/uses: actions\/attest@/g)).toHaveLength(2);
        expect(workflow).toContain('sbom-path: ${{ steps.package.outputs.sbom_path }}');
        expect(workflow).toContain('name: safex360-field-${{ env.BUILD_TYPE }}-${{ github.sha }}');
        expect(workflow).toContain('overwrite: false');
        expect(workflow).toContain('--arg commit "$GITHUB_SHA"');
    });

    it('epingle chaque action tierce a un SHA complet', () => {
        const actionUses = workflow.match(/^\s*uses:\s*[^\s#]+/gm) ?? [];

        expect(actionUses.length).toBeGreaterThanOrEqual(8);
        for (const useStatement of actionUses) {
            expect(useStatement).toMatch(/@[0-9a-f]{40}$/);
        }
    });
});
