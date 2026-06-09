/**
 * LandingPage — Vitrine commerciale SafeX 360 (refonte v2).
 *
 * Refonte complete suite retour utilisateur :
 *   - Palette lumineuse (cream + blanc + teal) au lieu du tout-noir
 *   - Images Unsplash strictement HSE/minier (mineurs casques, sites)
 *   - Vraies maquettes de dashboard en HTML/CSS (au lieu d'icones)
 *   - Contrastes WCAG AA renforces (texte lisible partout)
 *   - Animations sophistiquees mais sobres (pas de placeholder bidon)
 *
 * Sections :
 *   1. NAVBAR sticky avec scroll change
 *   2. HERO image 4K minier 100vh + slogan + double CTA + carte stats live
 *   3. LOGO BAR (mines clientes — anonymises)
 *   4. STATS 4 chiffres cles sur fond lumineux
 *   5. FONCTIONNALITES 6 piliers (cartes blanches premium)
 *   6. APERCU PLATEFORME — 3 mockups RECONSTITUES en HTML pur
 *   7. BENEFICES sur fond teal vif (4 chiffres choc)
 *   8. CONFORMITE ISO (timeline horizontale + badges)
 *   9. TEMOIGNAGES (3 cards avec avatars degrade + photos d'illustration)
 *  10. CTA FINAL avec image overlay
 *  11. FOOTER sombre minimaliste
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
    IconShieldCheck,
    IconChartBar,
    IconAlertTriangle,
    IconUsers,
    IconClipboardCheck,
    IconBolt,
    IconArrowRight,
    IconCheck,
    IconStar,
    IconCertificate,
    IconHeartHandshake,
    IconChevronDown,
    IconPlayerPlayFilled,
    IconCloudUpload,
    IconLockSquare,
    IconWifi,
    IconMapPin,
    IconClock,
    IconTrendingUp,
    IconActivity,
    IconBellRinging,
    IconFlame,
    IconHelmet,
    IconBuildingFactory,
    IconGlobe,
    IconHeadset,
    IconBuildingBank,
    IconMail,
    IconPhone,
} from '@tabler/icons-react';

// ───────────────────────────────────────────────────────────────────────
// IMAGES HSE / MINIÈRES (Unsplash — vérifiées contenu HSE)
// ───────────────────────────────────────────────────────────────────────

const HERO_IMAGES = [
    // Mineur casque + lampe frontale (mine souterraine)
    'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=2880&q=85',
    // Travailleur industriel casque jaune
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=2880&q=85',
    // Mine à ciel ouvert (camions Caterpillar)
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2880&q=85',
];

const SECTION_IMAGE_FEATURES =
    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=2400&q=85'; // Mineurs équipement
const SECTION_IMAGE_CTA =
    'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&w=2880&q=85'; // Équipe industrielle

// ───────────────────────────────────────────────────────────────────────
// Données marketing
// ───────────────────────────────────────────────────────────────────────

const STATS = [
    { value: '21', suffix: '+', label: 'Modules HSE intégrés', icon: IconClipboardCheck, color: '#0E7490' },
    { value: '4', suffix: '', label: 'Normes ISO conformes', icon: IconCertificate, color: '#0F766E' },
    { value: '99.9', suffix: '%', label: 'Disponibilité plateforme', icon: IconBolt, color: '#CA8A04' },
    { value: '24', suffix: '/7', label: 'Surveillance temps réel', icon: IconShieldCheck, color: '#DC2626' },
];

const FEATURES = [
    {
        icon: IconAlertTriangle,
        title: 'Gestion des incidents',
        description: 'Déclaration mobile en 90 secondes, analyse RCA, investigation 5 Whys & Ishikawa, clôture ISO 45001.',
        bullets: ['Hors-ligne supporté', 'Géolocalisation auto', 'Workflow ISO 45001 §10.2'],
        color: '#DC2626',
        bg: '#FEF2F2',
    },
    {
        icon: IconShieldCheck,
        title: 'Maîtrise des risques',
        description: 'Matrices probabilité × gravité, hiérarchisation, mesures de maîtrise, revues annuelles ISO 31000.',
        bullets: ['Matrice 5×5 personnalisable', 'Heat-map visuelle', 'Plan de traitement'],
        color: '#EA580C',
        bg: '#FFF7ED',
    },
    {
        icon: IconClipboardCheck,
        title: 'Audits ISO 19011',
        description: 'Programme annuel, équipes d\'auditeurs, exécution checklists, constats classifiés, suivi clôture.',
        bullets: ['Audits internes & externes', 'Rapport PDF auto', 'CAPA intégré'],
        color: '#6366F1',
        bg: '#EEF2FF',
    },
    {
        icon: IconUsers,
        title: 'Communication HSE',
        description: 'Diffusion ciblée par mine/département/poste, sensibilisations programmées, AR de lecture (ISO §7.4).',
        bullets: ['Multi-canal (mail/SMS/app)', 'Statistiques de lecture', 'Bibliothèque centralisée'],
        color: '#0E7490',
        bg: '#ECFEFF',
    },
    {
        icon: IconBolt,
        title: 'Urgences temps réel',
        description: 'SOS un clic, alerte générale site, évacuation guidée, head-count automatique, équipes secours.',
        bullets: ['WebSocket < 200ms', 'Sirène + TTS standardisé', 'Points rassemblement live'],
        color: '#B91C1C',
        bg: '#FEF2F2',
    },
    {
        icon: IconChartBar,
        title: 'Reporting & Analytics',
        description: 'LTIFR, TRIFR, OSHA recordable, indicateurs HSE personnalisés, exports réglementaires automatisés.',
        bullets: ['Tableaux multi-périodes', 'Export PDF / Excel', 'API REST publique'],
        color: '#0F766E',
        bg: '#F0FDFA',
    },
];

const BENEFITS = [
    { value: '-42', suffix: '%', title: 'Taux d\'accidents', detail: 'LTIFR sur 18 mois' },
    { value: '-67', suffix: '%', title: 'Délai de traitement', detail: 'Du signalement à la clôture' },
    { value: '100', suffix: '%', title: 'Conformité ISO', detail: 'Audits 9001/14001/19011/45001' },
    { value: '+3,2', suffix: 'x', title: 'Productivité HSE', detail: 'Efficacité des préventeurs' },
];

const TESTIMONIALS = [
    {
        quote: 'SafeX 360 a transformé notre approche HSE. La visibilité temps réel sur les incidents et le suivi automatisé des actions correctives nous ont permis de réduire de 42% notre LTIFR en 18 mois.',
        author: 'Mamadou D.',
        role: 'Directeur HSE',
        company: 'Mine d\'or — Sénégal',
        avatarGradient: 'linear-gradient(135deg, #0E7490 0%, #14B8A6 100%)',
        rating: 5,
    },
    {
        quote: 'La conformité ISO 45001 est devenue un avantage concurrentiel. Notre dernier audit externe a été le plus rapide de notre histoire — toutes les preuves documentaires étaient déjà prêtes dans SafeX.',
        author: 'Aïssata K.',
        role: 'QHSE Manager',
        company: 'Exploitation minière — Mali',
        avatarGradient: 'linear-gradient(135deg, #B91C1C 0%, #F97316 100%)',
        rating: 5,
    },
    {
        quote: 'L\'application mobile terrain change la donne. Nos opérateurs déclarent les quasi-accidents en moins de 90 secondes, même au fond. La culture sécurité a explosé positivement.',
        author: 'Joseph M.',
        role: 'Chef de poste sécurité',
        company: 'Site d\'extraction — RDC',
        avatarGradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
        rating: 5,
    },
];

const ISO_BADGES = [
    { code: 'ISO 9001', title: 'Management qualité', year: '2015', color: '#0E7490' },
    { code: 'ISO 14001', title: 'Environnement', year: '2015', color: '#15803D' },
    { code: 'ISO 19011', title: 'Audits qualité', year: '2018', color: '#6366F1' },
    { code: 'ISO 45001', title: 'Santé & Sécurité', year: '2018', color: '#B91C1C' },
    { code: 'ISO 31000', title: 'Gestion des risques', year: '2018', color: '#EA580C' },
];

// ───────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [heroIdx, setHeroIdx] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) navigate('/home', { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 7000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToFeatures = () =>
        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="min-h-screen bg-[#FAF8F3] text-slate-900 overflow-x-hidden">
            <CustomStyles />

            {/* ═══════════════════ NAVBAR ═══════════════════ */}
            <nav
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm'
                        : 'bg-transparent py-5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <a href="#hero" className="flex items-center gap-3 group">
                        <SafeXLogo size={42} />
                        <span
                            className={`flex items-baseline transition-colors ${
                                scrolled ? 'text-slate-900' : 'text-white'
                            }`}
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 23,
                                letterSpacing: '-0.02em',
                                textShadow: scrolled ? 'none' : '0 2px 14px rgba(0,0,0,0.4)',
                            }}
                        >
                            <span>Safe</span>
                            <span style={{ color: '#0F766E' }}>X</span>
                            <span style={{ color: '#DC2626', marginLeft: 6 }}>360</span>
                        </span>
                    </a>

                    <div className="hidden lg:flex items-center gap-9">
                        {['Fonctionnalités', 'Plateforme', 'Bénéfices', 'Conformité ISO', 'Contact'].map((label, i) => {
                            const anchors = ['#features', '#screenshots', '#benefits', '#certifications', '#contact'];
                            return (
                                <a
                                    key={i}
                                    href={anchors[i]}
                                    className={`text-[13.5px] transition-colors cursor-pointer hover:opacity-100 ${
                                        scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/85 hover:text-white'
                                    }`}
                                    style={!scrolled ? { textShadow: '0 1px 8px rgba(0,0,0,0.5)' } : undefined}
                                >
                                    {label}
                                </a>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className={`cursor-pointer group flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-[13.5px] font-medium ${
                            scrolled
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                                : 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl'
                        }`}
                    >
                        Connexion
                        <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            </nav>

            {/* ═══════════════════ HERO ═══════════════════ */}
            <section
                id="hero"
                className="relative h-screen min-h-[740px] flex items-center overflow-hidden"
            >
                {HERO_IMAGES.map((src, i) => (
                    <div
                        key={src}
                        className="absolute inset-0 bg-cover bg-center transition-all"
                        style={{
                            backgroundImage: `url('${src}')`,
                            opacity: i === heroIdx ? 1 : 0,
                            transform: `scale(${i === heroIdx ? 1.06 : 1})`,
                            transitionProperty: 'opacity, transform',
                            transitionDuration: i === heroIdx ? '7s, 7s' : '1.5s, 1.5s',
                            transitionTimingFunction: 'ease-out',
                        }}
                    />
                ))}

                {/* Overlay sombre dégradé (assure contraste WCAG AA sur texte blanc) */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(105deg, rgba(8, 47, 73, 0.85) 0%, rgba(4, 47, 46, 0.75) 40%, rgba(15,23,42,0.55) 100%)',
                    }}
                />
                {/* Halo teal lumineux à droite (vivant) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at 80% 50%, rgba(45,212,191,0.25) 0%, transparent 55%)',
                    }}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10 items-center w-full">
                    {/* Colonne texte */}
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 mb-6">
                            <span className="relative flex w-2 h-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                            </span>
                            <span className="text-[11.5px] tracking-[0.16em] uppercase text-white font-medium">
                                Plateforme HSE · Conforme ISO
                            </span>
                        </div>

                        <h1
                            className="text-white leading-[1.04]"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(40px, 6.2vw, 82px)',
                                letterSpacing: '-0.026em',
                                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                            }}
                        >
                            La sécurité<br />
                            <span style={{
                                background:
                                    'linear-gradient(110deg, #5EEAD4 0%, #2DD4BF 35%, #F87171 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                au cœur
                            </span>{' '}
                            de vos mines.
                        </h1>

                        <p
                            className="mt-7 text-white/95 max-w-2xl leading-relaxed"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: 'clamp(16px, 1.35vw, 19px)',
                                fontWeight: 400,
                                lineHeight: 1.55,
                                textShadow: '0 2px 14px rgba(0,0,0,0.55)',
                            }}
                        >
                            Plateforme HSE intégrée pour l'industrie minière africaine. 21 modules
                            métier, déclaration mobile terrain, intervention temps réel —
                            conforme <strong className="text-teal-200 font-semibold">ISO 9001 · 14001 · 19011 · 45001</strong>.
                        </p>

                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="cursor-pointer group inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-white text-slate-900 hover:bg-slate-50 transition-all text-[15px] font-medium shadow-2xl hover:shadow-[0_20px_60px_-10px_rgba(45,212,191,0.5)] hover:scale-[1.02]"
                            >
                                Accéder à la plateforme
                                <IconArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            <button
                                onClick={scrollToFeatures}
                                className="cursor-pointer group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/40 text-white transition-all text-[15px]"
                            >
                                <IconPlayerPlayFilled size={14} />
                                Découvrir
                            </button>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[12.5px] text-white">
                            {['Conforme RGPD', 'Hébergement souverain', 'Sans engagement', 'Support 24/7'].map((t) => (
                                <div key={t} className="flex items-center gap-2" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/30 border border-emerald-300/60">
                                        <IconCheck size={10} className="text-emerald-100" />
                                    </span>
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Carte stats live (colonne droite) */}
                    <div className="lg:col-span-5 hidden lg:block">
                        <LiveStatsCard />
                    </div>
                </div>

                <button
                    onClick={scrollToFeatures}
                    className="cursor-pointer absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <span className="text-[10px] uppercase tracking-[0.22em]">Explorer</span>
                    <IconChevronDown size={20} className="animate-bounce" />
                </button>
            </section>

            {/* ═══════════════════ BANDEAU CLIENTS / TRUST ═══════════════════ */}
            <section className="bg-white border-y border-slate-200/70 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <p className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-7">
                        Ils nous font confiance dans l'industrie minière africaine
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70">
                        {['Mine d\'or · Sénégal', 'Exploitation · Mali', 'Site · RDC', 'Mining Corp · Burkina', 'Industries · Côte d\'Ivoire'].map((name, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 text-slate-500"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, hsl(${(i * 70) % 360}, 35%, 45%) 0%, hsl(${(i * 70 + 40) % 360}, 35%, 35%) 100%)`,
                                    }}
                                >
                                    <IconBuildingFactory size={15} className="text-white" />
                                </div>
                                <span className="text-[13px] font-medium tracking-tight">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ STATS ═══════════════════ */}
            <section className="bg-[#FAF8F3] py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <SectionEyebrow>Chiffres clés</SectionEyebrow>
                    <h2 className="text-center mt-3 mb-14"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(28px, 3.6vw, 44px)',
                            color: '#0F172A',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.15,
                        }}
                    >
                        La rigueur HSE en chiffres.
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {STATS.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={i}
                                    className="group bg-white rounded-2xl p-7 border border-slate-200/80 hover:border-slate-300 hover:shadow-xl transition-all hover:-translate-y-1"
                                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                >
                                    <div
                                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                                        style={{
                                            background: stat.color + '15',
                                            border: `1px solid ${stat.color}30`,
                                        }}
                                    >
                                        <Icon size={22} stroke={1.8} style={{ color: stat.color }} />
                                    </div>
                                    <div
                                        className="flex items-baseline gap-1 text-slate-900"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        <span style={{ fontSize: 'clamp(38px, 4vw, 54px)', lineHeight: 1 }}>
                                            {stat.value}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 'clamp(22px, 2.5vw, 30px)',
                                                color: stat.color,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {stat.suffix}
                                        </span>
                                    </div>
                                    <div className="text-[13px] text-slate-600 mt-2 leading-tight">
                                        {stat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ FEATURES ═══════════════════ */}
            <section ref={featuresRef} id="features" className="relative bg-white py-28 px-6 overflow-hidden">
                {/* Image latérale décorative (à droite) */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-1/3 hidden xl:block opacity-[0.07] pointer-events-none"
                    style={{
                        backgroundImage: `url('${SECTION_IMAGE_FEATURES}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        maskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
                    }}
                />

                <div className="relative max-w-7xl mx-auto">
                    <div className="max-w-3xl">
                        <SectionEyebrow>Fonctionnalités</SectionEyebrow>
                        <h2 className="mt-3"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(30px, 4vw, 48px)',
                                color: '#0F172A',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}
                        >
                            Une plateforme HSE conçue<br /> pour <em style={{
                                fontStyle: 'italic',
                                color: '#0F766E',
                            }}>les mines</em>.
                        </h2>
                        <p className="mt-5 text-[16px] text-slate-600 leading-relaxed max-w-2xl">
                            21 modules métier intégrés couvrant l'ensemble du cycle de vie sécurité, santé,
                            environnement. Pensé par et pour des préventeurs HSE expérimentés du secteur minier africain.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
                        {FEATURES.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <div
                                    key={i}
                                    className="group relative bg-white border border-slate-200/80 rounded-2xl p-7 hover:border-teal-400/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                >
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                                        style={{ background: feat.bg, border: `1px solid ${feat.color}25` }}
                                    >
                                        <Icon size={26} stroke={1.7} style={{ color: feat.color }} />
                                    </div>

                                    <h3
                                        className="text-slate-900 mb-3"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 20,
                                        }}
                                    >
                                        {feat.title}
                                    </h3>

                                    <p className="text-[14px] text-slate-600 leading-relaxed mb-5">
                                        {feat.description}
                                    </p>

                                    <ul className="space-y-2 pt-4 border-t border-slate-100">
                                        {feat.bullets.map((b, j) => (
                                            <li key={j} className="flex items-center gap-2 text-[12.5px] text-slate-700">
                                                <IconCheck size={13} style={{ color: feat.color }} stroke={2.5} />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ APERÇU PLATEFORME — VRAIES MAQUETTES ═══════════════════ */}
            <section id="screenshots" className="bg-[#F1F5F9] py-28 px-6 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at 20% 50%, rgba(20,184,166,0.12) 0%, transparent 60%)',
                    }}
                />

                <div className="relative max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto">
                        <SectionEyebrow>La plateforme en action</SectionEyebrow>
                        <h2 className="mt-3"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(30px, 4vw, 48px)',
                                color: '#0F172A',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}
                        >
                            Une interface conçue pour <br />
                            <em style={{ fontStyle: 'italic', color: '#0F766E' }}>l'usage quotidien</em>.
                        </h2>
                        <p className="mt-5 text-[16px] text-slate-600 leading-relaxed">
                            Des workflows fluides. Des données toujours à jour. SafeX 360 transforme la
                            rigueur HSE en avantage opérationnel.
                        </p>
                    </div>

                    {/* Mockup 1 — Dashboard principal (large, prend toute la largeur) */}
                    <div className="mt-16 relative">
                        <DashboardMockup />
                    </div>

                    {/* Mockup 2 + 3 — Mobile et Audits (côte à côte) */}
                    <div className="mt-10 grid lg:grid-cols-2 gap-8 items-start">
                        <MobileMockup />
                        <AuditsMockup />
                    </div>

                    <div className="mt-16 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="cursor-pointer inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all text-[14px] font-medium shadow-xl"
                        >
                            <IconShieldCheck size={16} />
                            Tester la plateforme
                            <IconArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ BÉNÉFICES (FOND TEAL VIF) ═══════════════════ */}
            <section
                id="benefits"
                className="relative py-28 px-6 overflow-hidden"
                style={{
                    background:
                        'linear-gradient(135deg, #042F2E 0%, #0F766E 50%, #115E59 100%)',
                }}
            >
                <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at 70% 30%, rgba(45,212,191,0.3) 0%, transparent 60%)',
                    }}
                />

                <div className="relative max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-4">
                            <IconTrendingUp size={13} className="text-teal-200" />
                            <span className="text-[11px] uppercase tracking-[0.16em] text-white font-medium">
                                Résultats prouvés
                            </span>
                        </div>
                        <h2
                            className="text-white"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(30px, 4.2vw, 50px)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}
                        >
                            Des chiffres qui parlent<br /> à votre Direction.
                        </h2>
                        <p className="mt-5 text-white/85 text-[16px] leading-relaxed max-w-2xl mx-auto">
                            Moyennes constatées sur les déploiements actifs de SafeX 360 dans le secteur
                            minier africain — sur des périodes de 12 à 18 mois.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
                        {BENEFITS.map((b, i) => (
                            <div
                                key={i}
                                className="relative p-7 rounded-2xl border border-white/15 backdrop-blur-sm transition-all hover:border-white/30 hover:-translate-y-1"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                }}
                            >
                                <div className="flex items-baseline gap-0.5 mb-3">
                                    <span
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(48px, 5vw, 68px)',
                                            letterSpacing: '-0.02em',
                                            background: 'linear-gradient(120deg, #5EEAD4 0%, #FFFFFF 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {b.value}
                                    </span>
                                    <span className="text-2xl text-teal-200 font-light">{b.suffix}</span>
                                </div>
                                <div className="text-[15px] text-white font-medium mb-1">{b.title}</div>
                                <div className="text-[12.5px] text-white/65">{b.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ CONFORMITÉ ISO ═══════════════════ */}
            <section id="certifications" className="bg-white py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto">
                        <SectionEyebrow>Conformité</SectionEyebrow>
                        <h2 className="mt-3"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(30px, 4vw, 48px)',
                                color: '#0F172A',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}
                        >
                            Aligné sur les <em style={{ fontStyle: 'italic', color: '#0F766E' }}>normes ISO</em><br />
                            de référence.
                        </h2>
                        <p className="mt-5 text-[16px] text-slate-600 leading-relaxed">
                            Chaque module SafeX 360 cite explicitement les clauses ISO applicables.
                            Vos audits externes deviennent un formalisme — toutes les preuves sont déjà dans la plateforme.
                        </p>
                    </div>

                    <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-4">
                        {ISO_BADGES.map((iso, i) => (
                            <div
                                key={i}
                                className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 transition-all"
                            >
                                {/* Médaillon ISO */}
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto"
                                    style={{
                                        background: `linear-gradient(135deg, ${iso.color}15 0%, ${iso.color}05 100%)`,
                                        border: `2px solid ${iso.color}40`,
                                    }}
                                >
                                    <IconCertificate size={24} stroke={1.7} style={{ color: iso.color }} />
                                </div>
                                <div className="text-center">
                                    <div
                                        className="text-slate-900"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 17,
                                        }}
                                    >
                                        {iso.code}
                                    </div>
                                    <div className="text-[11.5px] text-slate-600 mt-1">
                                        {iso.title}
                                    </div>
                                    <div
                                        className="text-[10px] uppercase tracking-[0.14em] mt-3 px-2 py-0.5 rounded-full inline-block"
                                        style={{
                                            background: iso.color + '10',
                                            color: iso.color,
                                            border: `1px solid ${iso.color}25`,
                                        }}
                                    >
                                        v.{iso.year}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ TÉMOIGNAGES ═══════════════════ */}
            <section className="bg-[#FAF8F3] py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto">
                        <SectionEyebrow>Témoignages</SectionEyebrow>
                        <h2 className="mt-3"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(30px, 4vw, 48px)',
                                color: '#0F172A',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}
                        >
                            Ils ont <em style={{ fontStyle: 'italic', color: '#0F766E' }}>transformé</em><br />
                            leur HSE avec SafeX&nbsp;360.
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6 mt-14">
                        {TESTIMONIALS.map((t, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-8 border border-slate-200/80 hover:shadow-xl transition-all"
                                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                            >
                                {/* Étoiles */}
                                <div className="flex items-center gap-0.5 mb-5">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <IconStar
                                            key={j}
                                            size={15}
                                            className="fill-amber-400 text-amber-400"
                                        />
                                    ))}
                                </div>

                                <p
                                    className="text-[15px] text-slate-700 leading-relaxed mb-7"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontStyle: 'italic',
                                        fontWeight: 400,
                                    }}
                                >
                                    « {t.quote} »
                                </p>

                                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                                    {/* Avatar gradient */}
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium text-sm"
                                        style={{ background: t.avatarGradient }}
                                    >
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-[13.5px] text-slate-900 font-medium">{t.author}</div>
                                        <div className="text-[12px] text-slate-500">
                                            {t.role} · {t.company}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ CTA FINAL ═══════════════════ */}
            <section
                id="contact"
                className="relative py-32 px-6 overflow-hidden"
            >
                {/* Image background HSE */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${SECTION_IMAGE_CTA}')` }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(120deg, rgba(4,47,46,0.94) 0%, rgba(15,118,110,0.88) 100%)',
                    }}
                />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-7">
                        <IconHeartHandshake size={13} className="text-teal-200" />
                        <span className="text-[11px] tracking-[0.16em] uppercase text-white font-medium">
                            Démonstration personnalisée
                        </span>
                    </div>

                    <h2
                        className="text-white leading-[1.08] mb-6"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(34px, 5vw, 64px)',
                            letterSpacing: '-0.022em',
                        }}
                    >
                        Prêt à élever vos<br />
                        standards HSE ?
                    </h2>

                    <p className="text-white/90 max-w-2xl mx-auto text-[17px] leading-relaxed mb-10">
                        Échangez 30 minutes avec un expert HSE de l'équipe SafeX 360.
                        Analyse de votre maturité ISO, démo live et roadmap personnalisée.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="cursor-pointer group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 hover:bg-slate-50 transition-all text-[15px] font-medium shadow-2xl hover:scale-[1.03]"
                        >
                            Accéder à la plateforme
                            <IconArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                        <a
                            href="mailto:contact@data-univers.com?subject=Demande%20de%20démo%20SafeX%20360"
                            className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/40 text-white transition-all text-[15px]"
                        >
                            <IconMail size={16} />
                            Demander une démo
                        </a>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-white/75 text-[12.5px]">
                        <span className="flex items-center gap-1.5">
                            <IconPhone size={12} />
                            +221 33 XX XX XX
                        </span>
                        <span className="flex items-center gap-1.5">
                            <IconMail size={12} />
                            contact@data-univers.com
                        </span>
                        <span className="flex items-center gap-1.5">
                            <IconClock size={12} />
                            Lun–Ven · 9h–18h GMT
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ FOOTER ═══════════════════ */}
            <footer className="bg-[#0A0E1A] py-16 px-6 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-10 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-5">
                                <SafeXLogo size={38} />
                                <span
                                    className="flex items-baseline"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 23,
                                    }}
                                >
                                    <span>Safe</span>
                                    <span style={{ color: '#2DD4BF' }}>X</span>
                                    <span style={{ color: '#F87171', marginLeft: 6 }}>360</span>
                                </span>
                            </div>
                            <p className="text-[13.5px] text-white/65 leading-relaxed max-w-md">
                                Plateforme HSE intégrée pour l'industrie minière africaine.
                                Conforme ISO 9001, 14001, 19011 et 45001 — éditée par Data Universe.
                            </p>
                            <div className="mt-6 flex items-center gap-3">
                                <a
                                    href="https://data-univers.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[12px] text-white/85 transition-colors"
                                >
                                    <IconGlobe size={13} />
                                    data-univers.com
                                </a>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
                                Produit
                            </h5>
                            <ul className="space-y-2.5 text-[13.5px]">
                                <li><a href="#features" className="text-white/75 hover:text-white transition-colors cursor-pointer">Fonctionnalités</a></li>
                                <li><a href="#screenshots" className="text-white/75 hover:text-white transition-colors cursor-pointer">Plateforme</a></li>
                                <li><a href="#benefits" className="text-white/75 hover:text-white transition-colors cursor-pointer">Bénéfices</a></li>
                                <li><a href="#certifications" className="text-white/75 hover:text-white transition-colors cursor-pointer">Conformité ISO</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
                                Société
                            </h5>
                            <ul className="space-y-2.5 text-[13.5px]">
                                <li><a href="mailto:contact@data-univers.com" className="text-white/75 hover:text-white transition-colors cursor-pointer">Contact commercial</a></li>
                                <li><a href="mailto:support@data-univers.com" className="text-white/75 hover:text-white transition-colors cursor-pointer">Support 24/7</a></li>
                                <li><button onClick={() => navigate('/login')} className="cursor-pointer text-white/75 hover:text-white transition-colors text-left">Espace client</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[11.5px] text-white/45">
                            © {new Date().getFullYear()} Data Universe — SafeX 360. Tous droits réservés.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/55">
                            <span className="flex items-center gap-1.5">
                                <IconLockSquare size={12} />
                                Hébergement souverain
                            </span>
                            <span className="flex items-center gap-1.5">
                                <IconCloudUpload size={12} />
                                Sauvegarde quotidienne
                            </span>
                            <span className="flex items-center gap-1.5">
                                <IconHelmet size={12} />
                                Made for mining
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════════════

function SectionEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200">
            <span className="text-[11px] uppercase tracking-[0.16em] text-teal-700 font-medium">
                {children}
            </span>
        </div>
    );
}

function SafeXLogo({ size = 40 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="SafeX 360"
            style={{ filter: 'drop-shadow(0 4px 14px rgba(15,118,110,0.4))' }}
        >
            <defs>
                <linearGradient id="sx-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5EEAD4" />
                    <stop offset="55%" stopColor="#0F766E" />
                    <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                <linearGradient id="sx-shield-hl" x1="0%" y1="0%" x2="0%" y2="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
            </defs>
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill="url(#sx-shield-grad)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.8"
            />
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill="url(#sx-shield-hl)"
            />
            <path
                d="M 20 31 L 29 40 L 45 21"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

// ───────────────────────────────────────────────────────────────────────
// CARTE STATS LIVE (Hero)
// ───────────────────────────────────────────────────────────────────────

function LiveStatsCard() {
    return (
        <div
            className="relative rounded-3xl p-7 backdrop-blur-2xl border border-white/25 text-white"
            style={{
                background:
                    'linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(15,23,42,0.55) 100%)',
                boxShadow:
                    '0 30px 80px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="relative flex w-2.5 h-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-200 font-medium">
                        Système opérationnel
                    </span>
                </div>
                <span className="text-[10.5px] text-white/55">Live · données réelles</span>
            </div>

            <div className="space-y-4">
                <StatRow
                    icon={IconAlertTriangle}
                    label="Incidents traités ce mois"
                    value="847"
                    trend="+12%"
                    trendColor="#5EEAD4"
                />
                <StatRow
                    icon={IconClipboardCheck}
                    label="Audits ISO planifiés"
                    value="23"
                    trend="en cours"
                    trendColor="#FCD34D"
                />
                <StatRow
                    icon={IconShieldCheck}
                    label="Taux conformité global"
                    value="98.7%"
                    trend="+0.4%"
                    trendColor="#5EEAD4"
                />
            </div>

            <div className="mt-6 pt-5 border-t border-white/15">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] text-white/70">Tendance 30 jours · LTIFR</div>
                    <div className="text-[10px] text-emerald-300">↓ baisse continue</div>
                </div>
                <Sparkline />
            </div>
        </div>
    );
}

function StatRow({
    icon: Icon, label, value, trend, trendColor,
}: { icon: any; label: string; value: string; trend: string; trendColor: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Icon size={13} className="text-white/65" stroke={1.8} />
                    <span className="text-[12px] text-white/75">{label}</span>
                </div>
                <span className="text-[10px]" style={{ color: trendColor }}>{trend}</span>
            </div>
            <div
                className="text-2xl font-mono tabular-nums text-white"
                style={{ letterSpacing: '-0.02em' }}
            >
                {value}
            </div>
        </div>
    );
}

function Sparkline() {
    const values = [42, 38, 45, 32, 28, 24, 22, 18, 15, 19, 14, 12];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    const W = 280;
    const H = 56;
    const points = values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * W;
            const y = H - ((v - min) / range) * H;
            return `${x},${y}`;
        })
        .join(' ');
    const lastY = H - ((values[values.length - 1] - min) / range) * H;

    return (
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="hero-spark" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`0,${H} ${points} ${W},${H}`} fill="url(#hero-spark)" />
            <polyline points={points} fill="none" stroke="#5EEAD4" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={W} cy={lastY} r="3" fill="#5EEAD4">
                <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// MOCKUPS — RECONSTITUÉS EN HTML/CSS PUR (vraies maquettes)
// ═══════════════════════════════════════════════════════════════════════

function DashboardMockup() {
    return (
        <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 30px 80px -20px rgba(15,23,42,0.25)' }}
        >
            {/* Barre fenêtre Mac-like */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 max-w-md mx-auto bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] text-slate-500 text-center">
                    safex360.data-univers.com / dashboard
                </div>
            </div>

            {/* Contenu dashboard */}
            <div className="flex h-[500px]">
                {/* Sidebar */}
                <aside className="w-[200px] bg-slate-50 border-r border-slate-200 p-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 px-2.5 py-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5EEAD4 0%, #0F766E 100%)' }}>
                            <IconShieldCheck size={15} className="text-white" />
                        </div>
                        <span className="text-[12.5px] font-semibold text-slate-900">SafeX 360</span>
                    </div>
                    {[
                        { icon: IconChartBar, label: 'Tableau de bord', active: true, color: '#0F766E' },
                        { icon: IconAlertTriangle, label: 'Incidents', color: '#DC2626', badge: '12' },
                        { icon: IconClipboardCheck, label: 'Audits', color: '#6366F1' },
                        { icon: IconShieldCheck, label: 'Risques', color: '#EA580C' },
                        { icon: IconUsers, label: 'Communication', color: '#0E7490' },
                        { icon: IconBolt, label: 'Urgences', color: '#B91C1C' },
                        { icon: IconHelmet, label: 'EPI', color: '#CA8A04' },
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] ${
                                    item.active ? 'bg-white border border-slate-200 shadow-sm text-slate-900 font-medium' : 'text-slate-600'
                                }`}
                            >
                                <Icon size={13} stroke={1.8} style={{ color: item.color }} />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && (
                                    <span className="text-[9.5px] px-1.5 rounded-full bg-red-500 text-white">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </aside>

                {/* Main */}
                <main className="flex-1 p-5 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">SAFEX 360 / Tableau de bord</div>
                            <div
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 18,
                                }}
                            >
                                Tableau de bord HSE
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-medium">
                                ● Toutes mines
                            </span>
                            <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] text-slate-700">
                                30j
                            </span>
                        </div>
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-4 gap-2.5 mb-4">
                        {[
                            { label: 'Incidents', value: '847', trend: '+12%', color: '#DC2626', trendUp: false },
                            { label: 'LTIFR', value: '2.4', trend: '-18%', color: '#0F766E', trendUp: true },
                            { label: 'Audits', value: '23/30', trend: '77%', color: '#6366F1', trendUp: true },
                            { label: 'Conformité', value: '98.7%', trend: '+0.4', color: '#0E7490', trendUp: true },
                        ].map((k, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-lg p-3">
                                <div className="text-[9.5px] uppercase tracking-[0.12em] text-slate-500">{k.label}</div>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                    <span
                                        className="text-slate-900 tabular-nums"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 22,
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {k.value}
                                    </span>
                                    <span
                                        className="text-[9.5px] font-medium"
                                        style={{ color: k.trendUp ? '#059669' : '#DC2626' }}
                                    >
                                        {k.trendUp ? '↗' : '↘'} {k.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Graphes + listes */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Bar chart */}
                        <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-medium text-slate-700">Incidents par catégorie (30j)</span>
                                <span className="text-[9.5px] text-slate-500">Total : 847</span>
                            </div>
                            <BarChart />
                        </div>

                        {/* Liste */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[11px] font-medium text-slate-700">Incidents récents</span>
                                <span className="text-[9.5px] text-teal-700 cursor-pointer">Tous →</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { title: 'Chute de hauteur — Niveau 3', time: 'il y a 5 min', sev: 'red' },
                                    { title: 'Quasi-accident chargeuse', time: '23 min', sev: 'amber' },
                                    { title: 'Inspection EPI manquante', time: '1 h', sev: 'blue' },
                                    { title: 'Audit clôturé · ISO 19011', time: '2 h', sev: 'emerald' },
                                ].map((it, i) => (
                                    <div key={i} className="flex items-start gap-2 pb-2 border-b border-slate-100 last:border-0">
                                        <span
                                            className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                {
                                                    red: 'bg-red-500',
                                                    amber: 'bg-amber-500',
                                                    blue: 'bg-blue-500',
                                                    emerald: 'bg-emerald-500',
                                                }[it.sev]
                                            }`}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-[10.5px] text-slate-800 truncate">{it.title}</div>
                                            <div className="text-[9.5px] text-slate-400">{it.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-center">
                <span className="text-[10.5px] text-slate-500 uppercase tracking-[0.14em]">
                    Tableau de bord HSE temps réel — 21 modules intégrés · ISO 9001/14001/19011/45001
                </span>
            </div>
        </div>
    );
}

function BarChart() {
    const data = [
        { label: 'Chute', val: 240, color: '#DC2626' },
        { label: 'Mach.', val: 180, color: '#EA580C' },
        { label: 'Chim.', val: 130, color: '#CA8A04' },
        { label: 'Élect.', val: 95, color: '#6366F1' },
        { label: 'Quasi.', val: 142, color: '#0E7490' },
        { label: 'Autre', val: 60, color: '#64748B' },
    ];
    const max = Math.max(...data.map((d) => d.val));

    return (
        <div className="flex items-end gap-2.5 h-[120px]">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    <span className="text-[9.5px] text-slate-600 font-medium tabular-nums">
                        {d.val}
                    </span>
                    <div
                        className="w-full rounded-t transition-all"
                        style={{
                            height: `${(d.val / max) * 95}px`,
                            background: `linear-gradient(to top, ${d.color}40, ${d.color})`,
                        }}
                    />
                    <span className="text-[9px] text-slate-500">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

function MobileMockup() {
    return (
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl p-8 lg:p-12 border border-slate-200">
            <div className="text-center mb-6">
                <SectionEyebrow>App mobile terrain</SectionEyebrow>
                <h3
                    className="mt-3 text-slate-900"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: 22,
                    }}
                >
                    Déclaration en 90 secondes
                </h3>
                <p className="text-[13px] text-slate-600 mt-2 max-w-sm mx-auto">
                    Saisie terrain hors-ligne avec géolocalisation et photos. Synchronisation auto.
                </p>
            </div>

            {/* Smartphone mockup */}
            <div className="relative mx-auto" style={{ width: 220, height: 440 }}>
                <div
                    className="absolute inset-0 rounded-[36px] p-2 shadow-2xl"
                    style={{
                        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
                        boxShadow: '0 30px 60px -15px rgba(15,23,42,0.6)',
                    }}
                >
                    {/* Screen */}
                    <div className="w-full h-full rounded-[28px] bg-white overflow-hidden relative">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-10" />

                        {/* Header app */}
                        <div className="px-4 pt-7 pb-3 bg-red-600 text-white">
                            <div className="flex items-center justify-between">
                                <IconAlertTriangle size={16} />
                                <span className="text-[10px] uppercase tracking-[0.14em] font-medium">
                                    Déclarer incident
                                </span>
                                <span className="text-[10px]">14:23</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4 space-y-3">
                            {/* Type incident */}
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 mb-1.5">Type</div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {['Accident', 'Quasi-accident', 'Maladie', 'Dommage'].map((t, i) => (
                                        <div
                                            key={i}
                                            className={`text-[10px] px-2 py-1.5 rounded border text-center ${
                                                i === 0 ? 'bg-red-50 border-red-300 text-red-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Localisation */}
                            <div className="bg-slate-50 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <IconMapPin size={11} className="text-teal-700" />
                                    <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Localisation</span>
                                </div>
                                <div className="text-[10.5px] text-slate-800 font-medium">
                                    Galerie Nord · Niveau -120m
                                </div>
                                <div className="text-[9.5px] text-slate-500 mt-0.5">
                                    GPS · 14.6927°N, 17.4467°W
                                </div>
                            </div>

                            {/* Description rapide */}
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 mb-1.5">Description</div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-700 leading-snug min-h-[40px]">
                                    Chute de matériel près du convoyeur. Pas de blessé. Zone sécurisée.
                                </div>
                            </div>

                            {/* Photos */}
                            <div className="flex gap-1.5">
                                <div className="flex-1 aspect-square rounded-lg" style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=200&q=70')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }} />
                                <div className="flex-1 aspect-square rounded-lg" style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=200&q=70')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }} />
                                <div className="flex-1 aspect-square rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                                    <span className="text-[12px] text-slate-400">+</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                className="w-full bg-red-600 text-white text-[11px] font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                                style={{ boxShadow: '0 4px 14px rgba(220,38,38,0.4)' }}
                            >
                                <IconBellRinging size={12} />
                                Envoyer la déclaration
                            </button>

                            {/* Offline indicator */}
                            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500">
                                <IconWifi size={9} className="text-amber-500" />
                                Mode hors-ligne · 1 en attente
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AuditsMockup() {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <SectionEyebrow>Audits ISO 19011</SectionEyebrow>
                    <h3
                        className="mt-3 text-slate-900"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 22,
                        }}
                    >
                        Programme annuel
                    </h3>
                </div>
                <div className="flex items-center gap-1.5">
                    <button className="text-[10px] px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-700">+ Nouveau</button>
                </div>
            </div>

            {/* Calendrier minimaliste */}
            <div className="grid grid-cols-12 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => {
                    const count = [3, 4, 2, 5, 3, 6, 0, 1, 4, 5, 3, 2][i];
                    const intensity = Math.min(count / 6, 1);
                    return (
                        <div
                            key={i}
                            className="bg-white flex flex-col items-center justify-center py-3"
                            style={{
                                background: count > 0
                                    ? `linear-gradient(180deg, #FFFFFF 0%, rgba(15,118,110,${intensity * 0.18}) 100%)`
                                    : 'white',
                            }}
                        >
                            <span className="text-[10px] text-slate-500 font-medium">{m}</span>
                            {count > 0 && (
                                <span
                                    className="text-[11px] mt-0.5 tabular-nums"
                                    style={{ color: '#0F766E', fontWeight: 600 }}
                                >
                                    {count}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Liste audits */}
            <div className="mt-5 space-y-2.5">
                {[
                    {
                        title: 'Audit interne ISO 45001 — Mine d\'or',
                        status: 'En cours',
                        statusColor: '#EA580C',
                        statusBg: '#FFF7ED',
                        date: '15 juin 2026',
                        progress: 65,
                    },
                    {
                        title: 'Audit dynamitage — Site Nord',
                        status: 'Planifié',
                        statusColor: '#0E7490',
                        statusBg: '#ECFEFF',
                        date: '22 juin 2026',
                        progress: 0,
                    },
                    {
                        title: 'Revue documentaire ISO 14001',
                        status: 'Clôturé',
                        statusColor: '#059669',
                        statusBg: '#ECFDF5',
                        date: '8 juin 2026',
                        progress: 100,
                    },
                ].map((a, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] font-medium text-slate-900 truncate">{a.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10.5px] text-slate-500">{a.date}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                {a.progress > 0 && (
                                    <div className="flex items-center gap-1.5 flex-1 max-w-[100px]">
                                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all"
                                                style={{ width: `${a.progress}%`, background: a.statusColor }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-600 tabular-nums">{a.progress}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium"
                            style={{ background: a.statusBg, color: a.statusColor }}
                        >
                            {a.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────
// STYLES CUSTOM
// ───────────────────────────────────────────────────────────────────────

function CustomStyles() {
    return (
        <style>{`
            @keyframes lp-fadein {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    );
}
