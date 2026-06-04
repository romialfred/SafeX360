import DocsShell, {
    DocSection,
    CodeBlock,
    Callout,
} from '../../UtilityComp/DocsShell';
import { DOCS_NAVIGATION } from '../../../Data/DocsNavigation';

/**
 * TechnicalDocumentation — Documentation technique SafeX 360.
 *
 * LOT 41 : refonte avec DocsShell — architecture, API, modèle de données,
 * authentification, intégrations. Style GitBook/Stripe Docs.
 *
 * Cette page est destinée aux développeurs intégrateurs et administrateurs
 * techniques. Pour la documentation utilisateur, voir /how-to.
 */

const TOC = [
    { id: 'architecture',  label: 'Architecture' },
    { id: 'stack',         label: 'Stack technique', level: 2 as const },
    { id: 'services',      label: 'Microservices',   level: 2 as const },
    { id: 'api-reference', label: 'Référence API' },
    { id: 'auth-endpoints',label: 'Endpoints d\'authentification', level: 2 as const },
    { id: 'business-endpoints', label: 'Endpoints métier', level: 2 as const },
    { id: 'data-model',    label: 'Modèle de données' },
    { id: 'auth-security', label: 'Authentification & sécurité' },
    { id: 'integrations',  label: 'Intégrations' },
    { id: 'observability', label: 'Observabilité' },
];

const TechnicalDocumentation = () => {
    return (
        <DocsShell
            navigation={DOCS_NAVIGATION}
            activeId="architecture"
            breadcrumbs={[
                { label: 'Accueil', to: '/' },
                { label: 'Centre de connaissances', to: '/how-to' },
                { label: 'Documentation technique' },
            ]}
            title="Documentation technique"
            description="Architecture microservices, API REST, modèle de données et intégrations de la plateforme SafeX 360. Destinée aux développeurs intégrateurs et administrateurs techniques."
            difficulty="advanced"
            toc={TOC}
            prevPage={{
                label: 'Vue d\'ensemble fonctionnelle',
                to: '/features-overview',
                description: 'Cartographie des modules métier',
            }}
            nextPage={{
                label: 'Cartographie ISO',
                to: '/iso-mapping',
                description: 'Modules ↔ clauses ISO',
            }}
        >
            {/* ═══ Architecture ═══ */}
            <DocSection id="architecture" title="Architecture">
                <p>
                    SafeX 360 repose sur une architecture <strong>microservices</strong> autour
                    d'une passerelle API unique et de deux services métier indépendants,
                    coordonnés par un service discovery Eureka.
                </p>

                <DocSection id="stack" title="Stack technique" level={2}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Frontend</p>
                            <p className="text-[13.5px] text-slate-800 mt-1">
                                React 19 · TypeScript 5.7 · Vite 6 · Mantine 7 · Tailwind 4 · Redux Toolkit · React Router 7
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Backend</p>
                            <p className="text-[13.5px] text-slate-800 mt-1">
                                Java 17 · Spring Boot 3.4 · Spring Cloud Gateway · Spring Security · JPA / Hibernate
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Base de données</p>
                            <p className="text-[13.5px] text-slate-800 mt-1">
                                MySQL 8 — base unique <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">safex</code>, partagée entre les 2 services métier
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Infrastructure</p>
                            <p className="text-[13.5px] text-slate-800 mt-1">
                                Render (backend Spring) · Vercel (frontend Vite) · Aiven (MySQL prod) · Docker local (dev)
                            </p>
                        </div>
                    </div>
                </DocSection>

                <DocSection id="services" title="Microservices" level={2}>
                    <ul className="space-y-2 my-3">
                        <li>
                            <strong>Eureka Server</strong> (port 8761) — service discovery
                        </li>
                        <li>
                            <strong>Gateway</strong> (port 9000) — Spring Cloud Gateway, valide JWT et route :
                            <ul className="list-disc pl-6 mt-1.5 space-y-1 text-[14px]">
                                <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/hrms/**</code> → MineXpert (8080)</li>
                                <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/hns/**</code> → Health-Safety (8081)</li>
                            </ul>
                        </li>
                        <li>
                            <strong>MineXpert</strong> (port 8080, context <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/hrms</code>) — comptes, employés, sociétés, départements, authentification
                        </li>
                        <li>
                            <strong>Health-Safety</strong> (port 8081, context <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/hns</code>) — modules HSE : incidents, audits, risques, EPI, conformité, communications
                        </li>
                    </ul>
                </DocSection>
            </DocSection>

            {/* ═══ Référence API ═══ */}
            <DocSection id="api-reference" title="Référence API">
                <p>
                    Toutes les API sont REST + JSON. L'authentification se fait via un cookie httpOnly <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">jwt</code> validé par le Gateway.
                </p>

                <Callout tone="info" title="Convention de versionnement">
                    Pas de versionning d'URL pour le moment. Les changements breaking sont notifiés
                    par email à 30 jours d'avance. Les anciens endpoints restent disponibles 6 mois
                    après dépréciation.
                </Callout>

                <DocSection id="auth-endpoints" title="Endpoints d'authentification" level={2}>
                    <CodeBlock
                        language="HTTP"
                        title="POST /hrms/auth/login"
                        code={`POST /hrms/auth/login
Content-Type: application/json

{
  "login": "KMINATA",
  "password": "Admin123456&"
}

→ 200 OK
Set-Cookie: jwt=eyJhbGc...; HttpOnly; SameSite=Lax
{ "message": "Login successful" }`}
                    />
                    <CodeBlock
                        language="HTTP"
                        title="POST /hrms/account/update-password"
                        code={`POST /hrms/account/update-password
Cookie: jwt=eyJhbGc...
Content-Type: application/json

{
  "login": "KMINATA",
  "oldPassword": "Admin123456&",
  "password": "NewPassword2026!"
}

→ 200 OK
{ "message": "Password updated successfully" }`}
                    />
                </DocSection>

                <DocSection id="business-endpoints" title="Endpoints métier (extraits)" level={2}>
                    <CodeBlock
                        language="HTTP"
                        title="POST /hns/incidents/report"
                        code={`POST /hns/incidents/report
Cookie: jwt=eyJhbGc...
Content-Type: application/json

{
  "title": "Chute d'un objet",
  "categoryId": 1,
  "typeId": 2,
  "severityId": 3,
  "locationId": 4,
  "dateOccurred": "2026-06-04T10:30:00",
  "description": "<p>Description riche en HTML…</p>",
  "witnessIds": [101, 102]
}

→ 201 Created
{ "id": 5421, "refNumber": "INC-2026-001234" }`}
                    />
                    <CodeBlock
                        language="HTTP"
                        title="GET /hns/risks/search"
                        code={`GET /hns/risks/search?status=ACTIVE&dept=12&dateFrom=2026-01-01
Cookie: jwt=eyJhbGc...

→ 200 OK
[
  { "id": 12, "title": "...", "category": "...", "riskLevel": 8, ... },
  ...
]`}
                    />
                </DocSection>
            </DocSection>

            {/* ═══ Modèle de données ═══ */}
            <DocSection id="data-model" title="Modèle de données">
                <p>
                    La base <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">safex</code> comprend
                    une quarantaine de tables principales. Les schémas Hibernate sont auto-générés
                    via <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">spring.jpa.hibernate.ddl-auto=update</code>.
                </p>

                <p>Tables clés :</p>
                <ul className="list-disc pl-6 my-3 space-y-1.5 text-[14px]">
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">account</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">employee</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">company</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">department</code> — identité & RH</li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">incident</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">incident_category</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">incident_type</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">severity_level</code></li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">audit</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">audit_area</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">recommendation</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">corrective_action</code></li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">risk</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">risk_analysis</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">chemical_risk</code></li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">ppe</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">ppe_emp</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">ppe_request</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">ppe_stock</code></li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">requirement</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">document</code>, <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">document_version</code></li>
                </ul>
            </DocSection>

            {/* ═══ Auth & sécurité ═══ */}
            <DocSection id="auth-security" title="Authentification & sécurité">
                <p>L'authentification s'effectue via <strong>JWT</strong> (HS512), stocké dans un cookie <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">jwt</code> httpOnly avec SameSite=Lax.</p>

                <CodeBlock
                    language="JSON"
                    title="JWT payload (claims)"
                    code={`{
  "id": 12,
  "sub": "KMINATA",
  "role": "ADMIN",
  "exp": 1717545600
}`}
                />

                <p>Le Gateway valide le JWT et injecte un header interne <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">X-Secret-Key</code> (rotaté via env var <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">INTERNAL_GATEWAY_SECRET</code>) pour les microservices downstream.</p>

                <Callout tone="warning" title="Bonnes pratiques">
                    Les microservices ne doivent jamais être exposés publiquement. Ils n'acceptent
                    de requêtes que via le Gateway. Toute exposition directe est une faille de
                    sécurité (le X-Secret-Key n'est pas un mécanisme d'authentification fort).
                </Callout>

                <p>Politique mot de passe (enforced server-side) :</p>
                <ul className="list-disc pl-6 my-3 space-y-1.5 text-[14px]">
                    <li>≥10 caractères</li>
                    <li>au moins une lettre majuscule</li>
                    <li>au moins une lettre minuscule</li>
                    <li>au moins un chiffre</li>
                    <li>au moins un caractère spécial</li>
                </ul>
            </DocSection>

            {/* ═══ Intégrations ═══ */}
            <DocSection id="integrations" title="Intégrations">
                <p>Modes d'intégration disponibles ou prévus :</p>

                <ul className="space-y-3 my-4">
                    <li className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-[14px] text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            REST API (actuel)
                        </p>
                        <p className="text-[13px] text-slate-600 mt-1">
                            Tous les modules sont accessibles via l'API REST documentée par OpenAPI/Swagger
                            (endpoint <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/v3/api-docs</code> sur chaque service).
                        </p>
                    </li>
                    <li className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-[14px] text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            Webhooks (LOT 42)
                        </p>
                        <p className="text-[13px] text-slate-600 mt-1">
                            Notifications sortantes vers des systèmes tiers (Slack, Teams, ERP) lors
                            d'événements clés (nouvel incident critique, audit clôturé, etc.).
                        </p>
                    </li>
                    <li className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-[14px] text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            SSO SAML / Azure AD (LOT 42)
                        </p>
                        <p className="text-[13px] text-slate-600 mt-1">
                            Authentification unique via Active Directory (planifié).
                        </p>
                    </li>
                </ul>
            </DocSection>

            {/* ═══ Observabilité ═══ */}
            <DocSection id="observability" title="Observabilité">
                <p>Endpoints d'observation disponibles :</p>

                <ul className="list-disc pl-6 my-3 space-y-1.5 text-[14px]">
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/actuator/health</code> — état du service (public)</li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/actuator/info</code> — métadonnées de build</li>
                    <li><code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/v3/api-docs</code> + <code className="text-[12px] px-1 py-0.5 rounded bg-slate-100">/swagger-ui.html</code> — documentation OpenAPI</li>
                </ul>

                <p className="text-[13.5px] text-slate-600 mt-3">
                    Les logs structurés sont écrits sur stdout (compatible avec un agrégateur tiers type Loki ou CloudWatch).
                </p>
            </DocSection>
        </DocsShell>
    );
};

export default TechnicalDocumentation;
