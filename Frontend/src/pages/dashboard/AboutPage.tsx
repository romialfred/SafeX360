import {
    IconShieldCheck,
    IconCertificate,
    IconBook,
    IconHeartHandshake,
    IconExternalLink,
    IconCopyright,
    IconMail,
    IconMapPin,
    IconCode,
    IconHistory,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import SafeXBrandMark from '../../components/UtilityComp/SafeXBrandMark';

/**
 * AboutPage — Présentation factuelle de SafeX 360.
 *
 * Le ton est volontairement sobre :
 *   - aucun superlatif marketing
 *   - aucune tagline générée
 *   - faits, normes, contacts
 *
 * Sections :
 *   1. Identité plateforme (marque + version + tagline factuelle)
 *   2. Conformité réglementaire (normes ISO couvertes)
 *   3. Périmètre opérationnel (pays + secteur)
 *   4. Édition technique (stack, version, build)
 *   5. Contacts & mentions
 */

const VERSION = 'v2.4.0';
const RELEASE_DATE = '2026-06-03';
const BUILD_HASH = '979d2f7'; // dernier commit LOT 34

const ISO_STANDARDS = [
    { code: 'ISO 45001', title: 'Systèmes de management de la santé et de la sécurité au travail' },
    { code: 'ISO 14001', title: 'Systèmes de management environnemental' },
    { code: 'ISO 9001',  title: 'Systèmes de management de la qualité' },
    { code: 'ISO 19011', title: "Lignes directrices pour l'audit des systèmes de management" },
    { code: 'ISO 31000', title: 'Management du risque — principes et lignes directrices' },
    { code: 'ICMM',      title: 'International Council on Mining and Metals — principes 5 & 6' },
];

const COUNTRIES = ['Burkina Faso', 'Mali', 'Guinée', 'Sénégal', "Côte d'Ivoire", 'Liberia'];

const STACK = [
    { label: 'Frontend', value: 'React 19 · Vite · TypeScript · Mantine 7 · Tailwind 4' },
    { label: 'Backend',  value: 'Spring Boot 3.4 · Eureka · Gateway · Microservices' },
    { label: 'Base de données', value: 'MySQL 8 · Aiven Cloud' },
    { label: 'Infrastructure', value: 'Render (backend) · Vercel (frontend)' },
];

export default function AboutPage() {
    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-10 py-6">
            <div className="max-w-4xl mx-auto">

                {/* ═══ En-tête ═══ */}
                <div className="mb-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        SafeX 360 · À propos
                    </p>
                    <h1
                        className="text-slate-900 mt-1.5"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 500,
                            fontSize: '30px',
                            letterSpacing: '-0.018em',
                        }}
                    >
                        À propos de la plateforme
                    </h1>
                </div>

                {/* ═══ Section 1 — Identité ═══ */}
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="text-teal-700">
                            <SafeXBrandMark variant="icon" tone="teal" size={64} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '24px',
                                    letterSpacing: '-0.015em',
                                }}
                            >
                                SafeX 360
                            </h2>
                            <p className="text-[13.5px] text-slate-600 mt-1 leading-relaxed max-w-xl">
                                Plateforme intégrée de management de la santé,
                                de la sécurité et de l'environnement (HSE)
                                pour l'industrie minière ouest-africaine.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-50 border border-slate-200 text-slate-700">
                                    <IconCode size={11} /> {VERSION}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-50 border border-slate-200 text-slate-700">
                                    <IconHistory size={11} /> {RELEASE_DATE}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-50 border border-slate-200 text-slate-700 font-mono">
                                    {BUILD_HASH}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ Section 2 — Conformité ═══ */}
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 mb-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center">
                            <IconShieldCheck size={17} className="text-teal-700" />
                        </div>
                        <div>
                            <h3
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '18px',
                                }}
                            >
                                Référentiels de conformité
                            </h3>
                            <p className="text-[12.5px] text-slate-500 mt-0.5">
                                Normes internationales utilisées comme socle fonctionnel
                                des modules SafeX 360.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ISO_STANDARDS.map((iso) => (
                            <div
                                key={iso.code}
                                className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/30"
                            >
                                <IconCertificate size={16} className="text-teal-700 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[13px] text-slate-900 tracking-tight">
                                        {iso.code}
                                    </p>
                                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                                        {iso.title}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══ Section 3 — Périmètre ═══ */}
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 mb-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <IconMapPin size={17} className="text-amber-700" />
                        </div>
                        <div>
                            <h3
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '18px',
                                }}
                            >
                                Périmètre opérationnel
                            </h3>
                            <p className="text-[12.5px] text-slate-500 mt-0.5">
                                Pays couverts par la plateforme.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {COUNTRIES.map((c) => (
                            <span
                                key={c}
                                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-[12.5px] text-slate-700"
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ═══ Section 4 — Technique ═══ */}
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 mb-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <IconBook size={17} className="text-indigo-700" />
                        </div>
                        <div>
                            <h3
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '18px',
                                }}
                            >
                                Édition technique
                            </h3>
                            <p className="text-[12.5px] text-slate-500 mt-0.5">
                                Stack et infrastructure.
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {STACK.map((row) => (
                            <div key={row.label} className="flex flex-col sm:flex-row sm:items-baseline py-3 gap-1 sm:gap-4">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 w-40 flex-shrink-0">
                                    {row.label}
                                </p>
                                <p className="text-[13px] text-slate-800">
                                    {row.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══ Section 5 — Contacts ═══ */}
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 mb-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <IconHeartHandshake size={17} className="text-rose-700" />
                        </div>
                        <div>
                            <h3
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '18px',
                                }}
                            >
                                Contacts &amp; assistance
                            </h3>
                            <p className="text-[12.5px] text-slate-500 mt-0.5">
                                Pour toute question, signalement de bug ou demande d'évolution.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <a
                            href="mailto:support@safex360.com"
                            className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
                        >
                            <IconMail size={16} className="text-teal-700" />
                            <div className="flex-1">
                                <p className="text-[13px] text-slate-900">Support technique</p>
                                <p className="text-[12px] text-slate-500">support@safex360.com</p>
                            </div>
                            <IconExternalLink size={14} className="text-slate-400" />
                        </a>
                        <Link
                            to="/how-to"
                            className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
                        >
                            <IconBook size={16} className="text-teal-700" />
                            <div className="flex-1">
                                <p className="text-[13px] text-slate-900">Centre d'aide</p>
                                <p className="text-[12px] text-slate-500">Guides, FAQ, tutoriels</p>
                            </div>
                            <IconExternalLink size={14} className="text-slate-400" />
                        </Link>
                    </div>
                </section>

                {/* ═══ Pied — copyright ═══ */}
                <footer className="text-center py-6">
                    <p className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                        <IconCopyright size={12} />
                        2026 SafeX 360 · Tous droits réservés
                    </p>
                </footer>
            </div>
        </div>
    );
}
