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

    it('utilise POST pour la déconnexion et aligne le cookie sur le JWT', () => {
        const authApi = repository('Backend/MineXpert/src/main/java/com/hrms/api/AuthAPI.java');
        const loginService = frontend('src/services/LoginService.tsx');

        expect(authApi).toContain('@PostMapping("/logout")');
        expect(authApi).toContain('Duration.ofMillis(helper.getExpirationMillis())');
        expect(loginService).toContain("axiosInstance.post(`/hrms/auth/logout`)");
    });
});

