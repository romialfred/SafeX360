/**
 * LandingPage — Vitrine commerciale SafeX 360.
 *
 * Site marketing public — l'objectif est de VENDRE la plateforme.
 *  - Hero plein écran avec image 4K mine + slogan + double CTA
 *  - Bandeau stats (clients, normes, modules, uptime)
 *  - Section fonctionnalités (6 piliers avec icônes)
 *  - Aperçu plateforme (mockup dashboard + captures modules)
 *  - Bénéfices chiffrés
 *  - Conformité ISO (logos certificats)
 *  - Témoignages mining sector
 *  - CTA final "Demander une démo"
 *  - Footer corporate
 *
 * Identité visuelle : teal/cyan (sécurité) + noir/slate (sérieux pro)
 * + rouge accent (urgence/HSE). Typographie serif premium sur titres.
 *
 * Auto-redirige les utilisateurs authentifiés vers /home.
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
    IconWorld,
    IconCertificate,
    IconHeartHandshake,
    IconRocket,
    IconChevronDown,
    IconPlayerPlayFilled,
    IconBuildingFactory2,
    IconDeviceMobile,
    IconCloudUpload,
    IconLockSquare,
} from '@tabler/icons-react';

// ───────────────────────────────────────────────────────────────────────
// Données marketing — slogans, fonctionnalités, bénéfices
// ───────────────────────────────────────────────────────────────────────

const HERO_IMAGES = [
    // Images 4K Unsplash — secteur minier, EPI, sécurité
    'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=3840&q=90',
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=3840&q=90',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=3840&q=90',
];

const STATS = [
    { value: '21+', label: 'Modules HSE intégrés', icon: IconClipboardCheck },
    { value: '4', label: 'Normes ISO conformes', icon: IconCertificate },
    { value: '99.9%', label: 'Disponibilité plateforme', icon: IconBolt },
    { value: '24/7', label: 'Surveillance temps réel', icon: IconShieldCheck },
];

const FEATURES = [
    {
        icon: IconAlertTriangle,
        title: 'Gestion des incidents',
        description: 'Déclaration, analyse RCA, investigation 5 Whys et clôture conformément à ISO 45001 §10.2.',
        color: '#EF4444',
    },
    {
        icon: IconShieldCheck,
        title: 'Maîtrise des risques',
        description: 'Évaluation, hiérarchisation et traitement des risques HSE selon ISO 31000.',
        color: '#F59E0B',
    },
    {
        icon: IconClipboardCheck,
        title: 'Audits internes ISO 19011',
        description: 'Planification annuelle, exécution et suivi des constats avec actions correctives associées.',
        color: '#6366F1',
    },
    {
        icon: IconUsers,
        title: 'Communication sécurité',
        description: 'Diffusion ciblée des consignes HSE, sensibilisation et engagement des travailleurs (ISO 45001 §7.4).',
        color: '#EC4899',
    },
    {
        icon: IconBolt,
        title: 'Gestion des urgences',
        description: 'SOS temps réel, alerte générale, évacuation, head-count et gestion des équipes de secours.',
        color: '#DC2626',
    },
    {
        icon: IconChartBar,
        title: 'Reporting & Analytics',
        description: 'Tableaux de bord LTIFR, TRIFR, indicateurs HSE et exports réglementaires automatisés.',
        color: '#0E7490',
    },
];

const BENEFITS = [
    {
        title: 'Réduction du taux d\'accidents',
        value: '-42%',
        description: 'Sur 18 mois en moyenne après déploiement de SafeX 360 sur sites miniers actifs.',
    },
    {
        title: 'Temps de traitement incident',
        value: '-67%',
        description: 'Du signalement à la clôture grâce à la déclaration mobile et aux workflows automatisés.',
    },
    {
        title: 'Audits ISO certifiés',
        value: '100%',
        description: 'Conformité maintenue sur ISO 9001, 14001, 19011 et 45001 — preuve documentaire intégrée.',
    },
    {
        title: 'Productivité équipes HSE',
        value: '+3,2x',
        description: 'Multiplication de l\'efficacité opérationnelle des préventeurs grâce à l\'automatisation.',
    },
];

const TESTIMONIALS = [
    {
        quote: 'SafeX 360 a transformé notre approche HSE. La visibilité temps réel sur les incidents et le suivi automatisé des actions correctives nous ont permis de réduire de 42% nos LTIFR en 18 mois.',
        author: 'Directeur HSE',
        company: 'Mine d\'or — Afrique de l\'Ouest',
        rating: 5,
    },
    {
        quote: 'La conformité ISO 45001 et 19011 est devenue un avantage concurrentiel grâce à SafeX. Notre dernier audit a été le plus rapide de notre histoire.',
        author: 'QHSE Manager',
        company: 'Exploitation minière — Sahel',
        rating: 5,
    },
    {
        quote: 'L\'application mobile terrain change la donne. Nos opérateurs déclarent les quasi-accidents en moins de 90 secondes, même hors-ligne.',
        author: 'Chef de poste sécurité',
        company: 'Site d\'extraction — RDC',
        rating: 5,
    },
];

const ISO_BADGES = [
    { code: 'ISO 9001', title: 'Management qualité' },
    { code: 'ISO 14001', title: 'Environnement' },
    { code: 'ISO 19011', title: 'Audits qualité' },
    { code: 'ISO 45001', title: 'Santé & Sécurité' },
    { code: 'ISO 31000', title: 'Gestion des risques' },
];

const SCREENSHOTS = [
    {
        title: 'Tableau de bord HSE',
        description: 'Vue consolidée des indicateurs clés (LTIFR, TRIFR), incidents en cours, audits planifiés et conformité ISO.',
        image: '/screenshots/dashboard.png',
        fallbackBg: 'linear-gradient(135deg, #0E7490 0%, #134E4A 100%)',
        label: 'Dashboard',
    },
    {
        title: 'Déclaration mobile incident',
        description: 'Saisie terrain en moins de 90 secondes — fonctionne hors-ligne, géolocalisation et photos intégrées.',
        image: '/screenshots/mobile-incident.png',
        fallbackBg: 'linear-gradient(135deg, #14B8A6 0%, #0F172A 100%)',
        label: 'Mobile',
    },
    {
        title: 'Module Audits ISO 19011',
        description: 'Programme annuel, exécution avec checklists, constats classifiés et actions correctives liées.',
        image: '/screenshots/audits.png',
        fallbackBg: 'linear-gradient(135deg, #6366F1 0%, #1E1B4B 100%)',
        label: 'Audits',
    },
];

// ───────────────────────────────────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [heroIdx, setHeroIdx] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);

    // Redirige les utilisateurs authentifies vers l'application
    useEffect(() => {
        if (user) navigate('/home', { replace: true });
    }, [user, navigate]);

    // Rotation lente des images du hero (8 sec par image)
    useEffect(() => {
        const t = setInterval(() => {
            setHeroIdx((i) => (i + 1) % HERO_IMAGES.length);
        }, 8000);
        return () => clearInterval(t);
    }, []);

    // Scroll detection pour navbar (transparent -> opaque)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToFeatures = () =>
        featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <div className="min-h-screen bg-[#0A0E1A] text-white overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════
                NAVBAR — sticky, glassmorphism quand scrolled
                ═══════════════════════════════════════════════════════ */}
            <nav
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-[#0A0E1A]/85 backdrop-blur-xl border-b border-white/10 py-3'
                        : 'bg-transparent py-5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <a href="#hero" className="flex items-center gap-3 group">
                        <SafeXLogo size={38} />
                        <span
                            className="flex items-baseline"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 22,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            <span className="text-white">Safe</span>
                            <span style={{ color: '#2DD4BF' }}>X</span>
                            <span style={{ color: '#EF4444', marginLeft: 6 }}>360</span>
                        </span>
                    </a>

                    {/* Menu desktop */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
                            Fonctionnalités
                        </a>
                        <a href="#screenshots" className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
                            Plateforme
                        </a>
                        <a href="#benefits" className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
                            Bénéfices
                        </a>
                        <a href="#certifications" className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
                            Conformité ISO
                        </a>
                        <a href="#contact" className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
                            Contact
                        </a>
                    </div>

                    {/* CTA Connexion */}
                    <button
                        onClick={() => navigate('/login')}
                        className="cursor-pointer group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all text-[13px] font-medium shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                        Connexion
                        <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════
                HERO — image 4K rotative + slogan + CTA double
                ═══════════════════════════════════════════════════════ */}
            <section id="hero" className="relative h-screen min-h-[720px] flex items-center justify-center overflow-hidden">
                {/* Images rotatives — fade entre elles */}
                {HERO_IMAGES.map((src, i) => (
                    <div
                        key={src}
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out"
                        style={{
                            backgroundImage: `url('${src}')`,
                            opacity: i === heroIdx ? 1 : 0,
                            transform: `scale(${i === heroIdx ? 1.05 : 1})`,
                            transition: 'opacity 2s ease-in-out, transform 8s ease-out',
                        }}
                        aria-hidden="true"
                    />
                ))}

                {/* Overlay sombre + gradient teal */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.65) 40%, rgba(13,148,136,0.35) 100%)',
                    }}
                />
                {/* Halo teal radial subtil */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at 70% 50%, rgba(45,212,191,0.18) 0%, transparent 60%)',
                    }}
                />

                {/* Particules flottantes (effet vivant) */}
                <FloatingParticles count={20} />

                {/* Contenu hero */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
                    {/* Colonne gauche — texte */}
                    <div className="lg:col-span-7">
                        {/* Badge "Nouveau" / version */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            <span className="text-[11.5px] tracking-[0.16em] uppercase text-white/80">
                                SafeX 360 — Version 2026
                            </span>
                        </div>

                        {/* Titre principal */}
                        <h1
                            className="text-white leading-[1.05]"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(40px, 6vw, 78px)',
                                letterSpacing: '-0.025em',
                                textShadow: '0 4px 30px rgba(0,0,0,0.6)',
                            }}
                        >
                            La sécurité<br />
                            <span style={{
                                background: 'linear-gradient(120deg, #5EEAD4 0%, #2DD4BF 50%, #EF4444 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                au cœur
                            </span>{' '}
                            de vos mines.
                        </h1>

                        {/* Sous-titre */}
                        <p
                            className="mt-7 text-white/85 max-w-2xl leading-relaxed"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: 'clamp(16px, 1.4vw, 19px)',
                                fontWeight: 400,
                                lineHeight: 1.55,
                                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                            }}
                        >
                            Plateforme HSE intégrée pour l'industrie minière africaine.
                            Conforme <strong className="text-teal-300 font-medium">ISO 9001, 14001, 19011 et 45001</strong>.
                            21 modules métier, déclaration mobile terrain, intervention temps réel.
                        </p>

                        {/* CTAs */}
                        <div className="mt-10 flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="cursor-pointer group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all text-[15px] font-medium shadow-2xl hover:shadow-[0_20px_60px_-10px_rgba(45,212,191,0.4)] hover:scale-[1.02]"
                            >
                                Accéder à la plateforme
                                <IconArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            <button
                                onClick={scrollToFeatures}
                                className="cursor-pointer group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/25 text-white transition-all text-[15px]"
                            >
                                <IconPlayerPlayFilled size={14} />
                                Découvrir les fonctionnalités
                            </button>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-white/65">
                            <div className="flex items-center gap-2">
                                <IconCheck size={14} className="text-teal-400" />
                                Conforme RGPD
                            </div>
                            <div className="flex items-center gap-2">
                                <IconCheck size={14} className="text-teal-400" />
                                Hébergement souverain
                            </div>
                            <div className="flex items-center gap-2">
                                <IconCheck size={14} className="text-teal-400" />
                                Sans engagement
                            </div>
                            <div className="flex items-center gap-2">
                                <IconCheck size={14} className="text-teal-400" />
                                Support 24/7
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite — carte info flottante (effet 3D) */}
                    <div className="lg:col-span-5 hidden lg:block">
                        <div
                            className="relative rounded-3xl p-8 backdrop-blur-xl border border-white/15"
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(15,23,42,0.4) 100%)',
                                boxShadow:
                                    '0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                            }}
                        >
                            {/* Indicateur live */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex w-2.5 h-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                                    </span>
                                    <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-300">
                                        Système opérationnel
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/50">Live • temps réel</span>
                            </div>

                            {/* Stats */}
                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[12px] text-white/65">Incidents traités ce mois</span>
                                        <span className="text-[10px] text-emerald-400">+12%</span>
                                    </div>
                                    <div className="mt-1.5 text-3xl font-mono text-white tabular-nums">847</div>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[12px] text-white/65">Audits ISO planifiés</span>
                                        <span className="text-[10px] text-teal-400">en cours</span>
                                    </div>
                                    <div className="mt-1.5 text-3xl font-mono text-white tabular-nums">23</div>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[12px] text-white/65">Taux conformité global</span>
                                        <span className="text-[10px] text-emerald-400">+0.4%</span>
                                    </div>
                                    <div className="mt-1.5 text-3xl font-mono text-white tabular-nums">98.7%</div>
                                </div>
                            </div>

                            {/* Mini chart sparkline */}
                            <div className="mt-6 pt-5 border-t border-white/10">
                                <div className="text-[11px] text-white/60 mb-2">Tendance 30 jours · LTIFR</div>
                                <Sparkline />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Indicateur scroll bas */}
                <button
                    onClick={scrollToFeatures}
                    className="cursor-pointer absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em]">Explorer</span>
                    <IconChevronDown size={20} className="animate-bounce" />
                </button>
            </section>

            {/* ═══════════════════════════════════════════════════════
                BANDEAU STATS
                ═══════════════════════════════════════════════════════ */}
            <section className="relative py-16 px-6 bg-gradient-to-b from-[#0A0E1A] to-[#0D1421] border-y border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="text-center group">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-400/20 mb-4 group-hover:scale-110 transition-transform">
                                    <Icon size={22} className="text-teal-300" stroke={1.8} />
                                </div>
                                <div
                                    className="text-white"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(36px, 4vw, 52px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {stat.value}
                                </div>
                                <div className="text-[12.5px] text-white/60 mt-1 uppercase tracking-[0.08em]">
                                    {stat.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FONCTIONNALITÉS — 6 piliers
                ═══════════════════════════════════════════════════════ */}
            <section ref={featuresRef} id="features" className="relative py-28 px-6 bg-[#0D1421]">
                {/* Décor — gradient + grille subtile */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 30%, rgba(20,184,166,0.15) 0%, transparent 50%)',
                    }}
                />

                <div className="relative max-w-7xl mx-auto">
                    {/* En-tête de section */}
                    <SectionHeader
                        eyebrow="Fonctionnalités"
                        title="Une plateforme HSE conçue pour les mines."
                        subtitle="21 modules métier intégrés couvrant l'ensemble du cycle de vie sécurité, santé, environnement. Pensé par et pour des préventeurs HSE expérimentés du secteur minier."
                    />

                    {/* Grille fonctionnalités */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
                        {FEATURES.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <div
                                    key={i}
                                    className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/8 rounded-2xl p-7 hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300"
                                    style={{
                                        boxShadow: '0 4px 30px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    {/* Icône colorée */}
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                                        style={{
                                            background: `${feat.color}15`,
                                            border: `1px solid ${feat.color}30`,
                                        }}
                                    >
                                        <Icon size={22} stroke={1.8} style={{ color: feat.color }} />
                                    </div>

                                    <h3
                                        className="text-white mb-3"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 21,
                                        }}
                                    >
                                        {feat.title}
                                    </h3>

                                    <p className="text-[13.5px] text-white/65 leading-relaxed">
                                        {feat.description}
                                    </p>

                                    {/* Lien hover */}
                                    <div className="mt-5 inline-flex items-center gap-1 text-[12px] text-teal-300/0 group-hover:text-teal-300 transition-colors">
                                        En savoir plus
                                        <IconArrowRight size={12} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                APERÇU PLATEFORME — captures écran
                ═══════════════════════════════════════════════════════ */}
            <section id="screenshots" className="relative py-28 px-6 bg-gradient-to-b from-[#0D1421] to-[#0A0E1A]">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        eyebrow="La plateforme en action"
                        title="Conçue pour l'usage quotidien des préventeurs."
                        subtitle="Une interface raffinée, des workflows fluides, des données toujours à jour. SafeX 360 transforme la rigueur HSE en avantage opérationnel."
                    />

                    {/* Captures grid */}
                    <div className="grid lg:grid-cols-3 gap-6 mt-16">
                        {SCREENSHOTS.map((sc, i) => (
                            <div
                                key={i}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-teal-400/30 transition-all duration-300"
                            >
                                {/* Faux mockup — gradient + label (en attendant les vraies captures) */}
                                <div
                                    className="aspect-[4/3] flex items-center justify-center relative overflow-hidden"
                                    style={{ background: sc.fallbackBg }}
                                >
                                    {/* Pattern grid */}
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                            backgroundSize: '40px 40px',
                                        }}
                                    />
                                    {/* Icône centrée */}
                                    <div className="relative z-10 text-center">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-4">
                                            {i === 0 && <IconChartBar size={36} className="text-white" stroke={1.5} />}
                                            {i === 1 && <IconDeviceMobile size={36} className="text-white" stroke={1.5} />}
                                            {i === 2 && <IconClipboardCheck size={36} className="text-white" stroke={1.5} />}
                                        </div>
                                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                                            Aperçu · {sc.label}
                                        </span>
                                    </div>

                                    {/* Halo lumineux */}
                                    <div
                                        className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{
                                            background:
                                                'radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 60%)',
                                        }}
                                    />
                                </div>

                                {/* Description en bas */}
                                <div className="p-6 bg-[#0F172A]">
                                    <h4
                                        className="text-white mb-2"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 17,
                                        }}
                                    >
                                        {sc.title}
                                    </h4>
                                    <p className="text-[13px] text-white/60 leading-relaxed">
                                        {sc.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA secondaire */}
                    <div className="mt-16 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="cursor-pointer inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/40 text-teal-200 transition-all text-[14px]"
                        >
                            <IconRocket size={16} />
                            Tester la démo gratuite
                            <IconArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                BÉNÉFICES CHIFFRÉS
                ═══════════════════════════════════════════════════════ */}
            <section id="benefits" className="relative py-28 px-6 bg-[#0A0E1A]">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        eyebrow="Résultats prouvés"
                        title="Des chiffres qui parlent à votre Direction."
                        subtitle="Moyennes constatées sur les déploiements actifs SafeX 360 dans le secteur minier africain."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        {BENEFITS.map((b, i) => (
                            <div
                                key={i}
                                className="relative p-7 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div
                                    className="mb-4"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(40px, 4.5vw, 56px)',
                                        letterSpacing: '-0.02em',
                                        background:
                                            'linear-gradient(120deg, #5EEAD4 0%, #14B8A6 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        lineHeight: 1,
                                    }}
                                >
                                    {b.value}
                                </div>
                                <h4 className="text-[14px] text-white font-medium mb-2 leading-tight">
                                    {b.title}
                                </h4>
                                <p className="text-[12.5px] text-white/60 leading-relaxed">
                                    {b.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                CONFORMITÉ ISO — bandeau certifications
                ═══════════════════════════════════════════════════════ */}
            <section id="certifications" className="relative py-24 px-6 bg-gradient-to-b from-[#0A0E1A] to-[#0D1421] border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        eyebrow="Conformité"
                        title="Aligné sur les normes ISO de référence."
                        subtitle="Chaque module SafeX 360 cite explicitement les clauses ISO applicables. Vos audits externes deviennent un formalisme."
                    />

                    {/* Logos ISO */}
                    <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
                        {ISO_BADGES.map((iso, i) => (
                            <div
                                key={i}
                                className="px-6 py-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm hover:border-teal-400/40 hover:bg-teal-500/10 transition-all"
                            >
                                <div
                                    className="text-white"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 17,
                                    }}
                                >
                                    {iso.code}
                                </div>
                                <div className="text-[11px] text-white/55 mt-0.5">
                                    {iso.title}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                TÉMOIGNAGES
                ═══════════════════════════════════════════════════════ */}
            <section className="relative py-28 px-6 bg-[#0D1421]">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        eyebrow="Témoignages"
                        title="Ils ont transformé leur HSE avec SafeX 360."
                        subtitle=""
                    />

                    <div className="grid lg:grid-cols-3 gap-6 mt-14">
                        {TESTIMONIALS.map((t, i) => (
                            <div
                                key={i}
                                className="p-7 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent"
                            >
                                {/* Étoiles */}
                                <div className="flex items-center gap-0.5 mb-5">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <IconStar
                                            key={j}
                                            size={14}
                                            className="fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>

                                <p
                                    className="text-[14.5px] text-white/85 leading-relaxed mb-6"
                                    style={{ fontStyle: 'italic' }}
                                >
                                    "{t.quote}"
                                </p>

                                <div className="pt-5 border-t border-white/10">
                                    <div className="text-[13px] text-white font-medium">{t.author}</div>
                                    <div className="text-[11.5px] text-white/55 mt-0.5">{t.company}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                CTA FINAL — Demander une démo
                ═══════════════════════════════════════════════════════ */}
            <section id="contact" className="relative py-32 px-6 overflow-hidden">
                {/* Background gradient */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(135deg, #042F2E 0%, #0F766E 50%, #0A0E1A 100%)',
                    }}
                />
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background:
                            'radial-gradient(circle at 30% 50%, rgba(239,68,68,0.2) 0%, transparent 50%)',
                    }}
                />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-7">
                        <IconHeartHandshake size={13} className="text-teal-300" />
                        <span className="text-[11.5px] tracking-[0.16em] uppercase text-white/90">
                            Démo personnalisée
                        </span>
                    </div>

                    <h2
                        className="text-white leading-[1.1] mb-6"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(34px, 5vw, 60px)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Prêt à élever vos<br />
                        standards HSE ?
                    </h2>

                    <p className="text-white/80 max-w-2xl mx-auto text-[16px] leading-relaxed mb-10">
                        Échangez avec un expert HSE de l'équipe SafeX 360. Démo en ligne 30 minutes,
                        analyse de votre maturité ISO et roadmap personnalisée.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="cursor-pointer group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all text-[15px] font-medium shadow-2xl hover:scale-[1.02]"
                        >
                            Accéder à la plateforme
                            <IconArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                        <a
                            href="mailto:contact@data-univers.com?subject=Demande de démo SafeX 360"
                            className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/30 text-white transition-all text-[15px]"
                        >
                            Demander une démo
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FOOTER
                ═══════════════════════════════════════════════════════ */}
            <footer className="relative bg-[#070A12] py-16 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-10 mb-12">
                        {/* Logo + tagline */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <SafeXLogo size={36} />
                                <span
                                    className="flex items-baseline"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 22,
                                    }}
                                >
                                    <span className="text-white">Safe</span>
                                    <span style={{ color: '#2DD4BF' }}>X</span>
                                    <span style={{ color: '#EF4444', marginLeft: 6 }}>360</span>
                                </span>
                            </div>
                            <p className="text-[13px] text-white/55 leading-relaxed max-w-md">
                                Plateforme HSE intégrée pour l'industrie minière africaine.
                                Conforme ISO 9001, 14001, 19011 et 45001.
                            </p>
                            <div className="mt-5 flex items-center gap-3">
                                <a
                                    href="https://data-univers.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer inline-flex items-center gap-2 text-[12px] text-white/60 hover:text-teal-300 transition-colors"
                                >
                                    <IconWorld size={13} />
                                    data-univers.com
                                </a>
                            </div>
                        </div>

                        {/* Produit */}
                        <div>
                            <h5 className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
                                Produit
                            </h5>
                            <ul className="space-y-2.5 text-[13px]">
                                <li><a href="#features" className="text-white/70 hover:text-white transition-colors cursor-pointer">Fonctionnalités</a></li>
                                <li><a href="#screenshots" className="text-white/70 hover:text-white transition-colors cursor-pointer">Plateforme</a></li>
                                <li><a href="#benefits" className="text-white/70 hover:text-white transition-colors cursor-pointer">Bénéfices</a></li>
                                <li><a href="#certifications" className="text-white/70 hover:text-white transition-colors cursor-pointer">Conformité ISO</a></li>
                            </ul>
                        </div>

                        {/* Société */}
                        <div>
                            <h5 className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
                                Société
                            </h5>
                            <ul className="space-y-2.5 text-[13px]">
                                <li><a href="mailto:contact@data-univers.com" className="text-white/70 hover:text-white transition-colors cursor-pointer">Contact</a></li>
                                <li><span className="text-white/40">Mentions légales</span></li>
                                <li><span className="text-white/40">CGU & RGPD</span></li>
                                <li><button onClick={() => navigate('/login')} className="cursor-pointer text-white/70 hover:text-white transition-colors">Connexion</button></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bandeau bas */}
                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[11.5px] text-white/45">
                            © {new Date().getFullYear()} Data Universe — SafeX 360. Tous droits réservés.
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-white/50">
                            <span className="flex items-center gap-1.5">
                                <IconLockSquare size={12} />
                                Hébergement souverain
                            </span>
                            <span className="flex items-center gap-1.5">
                                <IconCloudUpload size={12} />
                                Sauvegarde quotidienne
                            </span>
                            <span className="flex items-center gap-1.5">
                                <IconBuildingFactory2 size={12} />
                                Made for mining
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────
// Composants auxiliaires
// ───────────────────────────────────────────────────────────────────────

function SectionHeader({
    eyebrow,
    title,
    subtitle,
}: {
    eyebrow: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/30 mb-5">
                <span className="text-[11px] uppercase tracking-[0.16em] text-teal-300">
                    {eyebrow}
                </span>
            </div>
            <h2
                className="text-white leading-[1.15]"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 600,
                    fontSize: 'clamp(28px, 3.8vw, 46px)',
                    letterSpacing: '-0.02em',
                }}
            >
                {title}
            </h2>
            {subtitle && (
                <p className="mt-5 text-white/65 text-[15px] leading-relaxed max-w-2xl mx-auto">
                    {subtitle}
                </p>
            )}
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
            style={{ filter: 'drop-shadow(0 4px 14px rgba(20,184,166,0.4))' }}
        >
            <defs>
                <linearGradient id="lp-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5EEAD4" />
                    <stop offset="55%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <linearGradient id="lp-shield-hl" x1="0%" y1="0%" x2="0%" y2="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
            </defs>
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill="url(#lp-shield-grad)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.8"
            />
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill="url(#lp-shield-hl)"
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

/** Particules flottantes — effet vivant subtil dans le hero. */
function FloatingParticles({ count = 20 }: { count?: number }) {
    const particles = Array.from({ length: count }, (_, i) => ({
        id: i,
        // Positions deterministes (eviter Math.random qui re-render)
        left: ((i * 37) % 100) + '%',
        top: ((i * 53) % 100) + '%',
        size: 2 + (i % 3),
        delay: (i % 8) * 0.5 + 's',
        duration: (15 + (i % 10)) + 's',
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="absolute rounded-full bg-teal-300/30"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        animation: `lp-float ${p.duration} ease-in-out ${p.delay} infinite`,
                    }}
                />
            ))}
            <style>{`
                @keyframes lp-float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                    50% { transform: translateY(-40px) translateX(20px); opacity: 0.9; }
                }
            `}</style>
        </div>
    );
}

/** Mini graphique sparkline pour la carte hero. */
function Sparkline() {
    const values = [42, 38, 45, 32, 28, 24, 22, 18, 15, 19, 14, 12];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    const W = 240;
    const H = 50;
    const points = values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * W;
            const y = H - ((v - min) / range) * H;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="lp-sparkline" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Aire sous courbe */}
            <polygon
                points={`0,${H} ${points} ${W},${H}`}
                fill="url(#lp-sparkline)"
            />
            {/* Courbe */}
            <polyline
                points={points}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Point final pulsant */}
            <circle cx={W} cy={H - ((values[values.length - 1] - min) / range) * H} r="3" fill="#5EEAD4">
                <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}
