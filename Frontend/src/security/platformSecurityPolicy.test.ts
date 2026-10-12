import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontend = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const repository = (path: string) => readFileSync(resolve(process.cwd(), '..', path), 'utf8');

describe('politique de sécurité de la plateforme', () => {
    it('publie une CSP en enforcement sur toutes les routes web', () => {
        const vercel = JSON.parse(frontend('vercel.json'));
        const headers = vercel.headers[0].headers as Array<{ key: string; value: string }>;
        const csp = headers.find((header) => header.key === 'Content-Security-Policy')?.value;

        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("object-src 'none'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).not.toContain('Content-Security-Policy-Report-Only');
    });

    it('désactive Swagger par défaut et ne le publie plus sans contrôle', () => {
        for (const service of ['Health-Safety', 'MineXpert']) {
            const config = repository(`Backend/${service}/src/main/resources/application.yml`);
            const securityFile = service === 'Health-Safety'
                ? 'Backend/Health-Safety/src/main/java/com/minexpert/hns/config/SecurityConfig.java'
                : 'Backend/MineXpert/src/main/java/com/hrms/config/MyConfig.java';
            const security = repository(securityFile);

            expect(config).toContain('enabled: ${API_DOCS_ENABLED:false}');
            expect(security).not.toMatch(/swagger[\s\S]{0,150}permitAll/);
        }
    });

    it('centralise CORS sans origine ni en-tête générique', () => {
        const cors = repository('Backend/GatewayMS/src/main/java/com/hms/gateway/config/GatewayCorsConfiguration.java');
        const gatewayConfig = repository('Backend/GatewayMS/src/main/resources/application.yml');

        expect(cors).toContain('originPolicy.origins()');
        expect(cors).not.toContain('addAllowedOriginPattern("*")');
        expect(cors).not.toContain('addAllowedHeader("*")');
        expect(gatewayConfig).not.toContain('allowedHeaders:');
    });

    it('utilise POST pour la déconnexion et émet le JWT dans un cookie de session', () => {
        const authApi = repository('Backend/MineXpert/src/main/java/com/hrms/api/AuthAPI.java');
        const mfaController = repository('Backend/MineXpert/src/main/java/com/hrms/api/MfaController.java');
        const loginService = frontend('src/services/LoginService.tsx');

        expect(authApi).toContain('@PostMapping("/logout")');
        expect(loginService).toContain("axiosInstance.post(`/hrms/auth/logout`)");

        // Cookie de SESSION (décision du 2026-07-23) : aucun cookie portant un JWT ne
        // reçoit de maxAge, sinon il redevient persistant et survit à la fermeture du
        // navigateur ; seule la déconnexion l'expire (maxAge(0)).
        const cookies = [...`${authApi}\n${mfaController}`.matchAll(
            /ResponseCookie\.from\("jwt",\s*([^)]*)\)([\s\S]*?)\.build\(\)/g,
        )].map(([, value, chain]) => ({ value: value.trim(), chain }));
        const issued = cookies.filter((cookie) => cookie.value !== '""');
        const expired = cookies.filter((cookie) => cookie.value === '""');

        expect(issued.length).toBeGreaterThanOrEqual(3);
        expect(expired).toHaveLength(1);
        for (const cookie of cookies) {
            expect(cookie.chain).toContain('.httpOnly(true)');
            expect(cookie.chain).toContain('.secure(true)');
        }
        for (const cookie of issued) {
            expect(cookie.chain).not.toContain('.maxAge(');
        }
        expect(expired[0].chain).toContain('.maxAge(0)');
    });
});

