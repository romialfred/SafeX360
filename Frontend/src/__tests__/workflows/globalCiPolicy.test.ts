import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd(), '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');
const workflow = read('.github/workflows/ci.yml');
const packageJson = JSON.parse(read('Frontend/package.json'));
const baseline = JSON.parse(read('Frontend/quality/eslint-baseline.json'));

describe('AUD-QA-001/002 - garde-fous qualite reproductibles', () => {
    it('rend lint, tests, build et E2E bloquants', () => {
        expect(workflow).toContain('npm run lint:baseline');
        expect(workflow).toContain('npm run design:baseline');
        expect(workflow).toContain('npm run audit:security');
        expect(workflow).toContain('npm test');
        expect(workflow).toContain('npm run build');
        expect(workflow).toContain('npm run performance:budget');
        expect(workflow).toContain('npm run test:e2e:smoke');
        expect(workflow).toContain('-Dspring.profiles.active=test verify');
        expect(workflow).not.toContain('continue-on-error');
        expect(workflow).not.toMatch(/\|\|\s*true/);
        expect(workflow.match(/persist-credentials: false/g)).toHaveLength(3);
        expect(workflow).toContain('needs: [frontend-quality, backend-quality, e2e-smoke]');
    });

    it('teste les quatre services backend sans infrastructure externe', () => {
        for (const path of [
            'Backend/GatewayMS',
            'Backend/MineXpert',
            'Backend/Eureka-Server',
            'Backend/Health-Safety',
        ]) {
            expect(workflow).toContain(`path: ${path}`);
            expect(read(`${path}/src/test/resources/application-test.yml`)).toContain('port: 0');
        }

        expect(read('Backend/MineXpert/src/test/resources/application-test.yml')).toContain('jdbc:h2:mem:');
        expect(read('Backend/Health-Safety/src/test/resources/application-test.yml')).toContain('jdbc:h2:mem:');
        expect(read('Backend/GatewayMS/src/test/resources/application-test.yml')).toContain('register-with-eureka: false');
        expect(read('Backend/Eureka-Server/src/test/resources/application-test.yml')).toContain('register-with-eureka: false');
    });

    it('declare Playwright et un serveur web autonome', () => {
        expect(packageJson.devDependencies['@playwright/test']).toBe('1.61.1');
        expect(packageJson.scripts['test:e2e']).toContain('playwright test');
        expect(packageJson.scripts['test:e2e:smoke']).toContain('e2e/smoke');

        const config = read('Frontend/playwright.config.ts');
        expect(config).toContain("retries: ci ? 2 : 0");
        expect(config).toContain("trace: 'on-first-retry'");
        expect(config).toContain('npm run preview');
    });

    it('gele explicitement la dette ESLint sans masquer une nouvelle violation', () => {
        expect(baseline.schemaVersion).toBe(1);
        expect(baseline.totals.errors).toBeGreaterThan(0);
        expect(baseline.entries.length).toBeGreaterThan(0);
        expect(packageJson.scripts['lint:baseline']).not.toContain('--update');
        expect(packageJson.scripts['design:baseline']).not.toContain('--update');
        expect(packageJson.scripts['performance:budget']).toContain('check-performance-budgets.mjs');
    });

    it('epingle toutes les actions tierces a un SHA complet', () => {
        const actions = workflow.match(/^\s*uses:\s*[^\s#]+/gm) ?? [];
        expect(actions.length).toBeGreaterThanOrEqual(7);
        for (const action of actions) expect(action).toMatch(/@[0-9a-f]{40}$/);
    });
});
