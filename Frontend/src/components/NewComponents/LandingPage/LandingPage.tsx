/**
 * LandingPage v6 — Vitrine éditoriale style album photo.
 *
 * Retours utilisateur :
 *  - Palette : VERT + NOIR (pas rouge sauf urgences sémantiques)
 *  - Stats : tuiles plus grandes, icônes colorées
 *  - 8 modules clés mis en avant : SOS, Évacuation, Blasting, Inspection
 *    + Incidents, Risques, Audits, Communication
 *  - Section "Voici à quoi ça ressemble" : album photo magazine
 *    (inspiration kutunga.org — galerie éditoriale)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconBuildingFactory,
    IconGlobe,
    IconMail,
    IconPhone,
    IconClock,
    IconSparkles,
    IconLockSquare,
    IconCloudUpload,
    IconHelmet,
    IconTrendingUp,
    IconPlayerPlayFilled,
    IconRun,
    IconBomb,
    IconBinoculars,
    IconBellRinging,
    IconArrowUpRight,
    IconX,
    IconSend,
    IconLoader2,
} from '@tabler/icons-react';
import IsoBadge from '../../UtilityComp/IsoBadge';

// ───────────────────────────────────────────────────────────────────────
// PALETTE — vert teal + noir + accents sémantiques
// ───────────────────────────────────────────────────────────────────────

const C = {
    // Couleurs primaires plateforme
    dark: '#0F172A',
    darker: '#0A0F1C',
    green: '#0F766E',
    greenLight: '#14B8A6',
    greenSoft: '#5EEAD4',
    greenBg: '#F0FDFA',
    // Cream / fond clair
    cream: '#FAF9F5',
    paper: '#FFFFFF',
    // Accents sémantiques (uniquement pour modules urgence/sécurité)
    emergency: '#DC2626',  // SOS / urgences
    blasting: '#EA580C',   // dynamitage
    audit: '#7C3AED',      // audits
    inspection: '#0EA5E9', // inspections
};

// ───────────────────────────────────────────────────────────────────────
// 8 MODULES PHARES (avec accent sur SOS, Évacuation, Blasting, Inspection)
// ───────────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        id: 'sos',
        icon: IconBellRinging,
        title: 'SOS instantané',
        highlight: true,
        description: 'Le travailleur appuie sur SOS. Le préventeur reçoit l\'alerte avec position GPS en moins de 200 ms. Sirène déclenchée, escalade automatique.',
        bullets: ['Temps réel < 200 ms', 'Géolocalisation auto', 'Escalade hiérarchique'],
        color: C.emergency,
        bgLight: '#FEF2F2',
        ring: '#FCA5A5',
    },
    {
        id: 'evacuation',
        icon: IconRun,
        title: 'Évacuation guidée',
        highlight: true,
        description: 'Alerte générale du site, annonce vocale TTS dans toutes les langues, head-count automatique au point de rassemblement. Carte des évacués en temps réel.',
        bullets: ['Sirène + TTS multi-langues', 'Head-count auto', 'Carte évacués live'],
        color: C.emergency,
        bgLight: '#FEF2F2',
        ring: '#FCA5A5',
    },
    {
        id: 'blasting',
        icon: IconBomb,
        title: 'Gestion des dynamitages',
        highlight: true,
        description: 'Planification, validation hiérarchique, notification multi-canal, périmètre de sécurité, traçabilité complète. Conforme aux codes miniers africains.',
        bullets: ['Workflow validation', 'Périmètre sécurité', 'Notifications J-1 / J / J+1'],
        color: C.blasting,
        bgLight: '#FFF7ED',
        ring: '#FDBA74',
    },
    {
        id: 'inspection',
        icon: IconBinoculars,
        title: 'Inspections terrain',
        highlight: true,
        description: 'Checklists mobile, photos contextuelles, signatures multiples, rapport PDF automatique. Les inspecteurs gagnent 2 heures par tournée.',
        bullets: ['Checklists configurables', 'Photos & signatures', 'Rapport PDF auto'],
        color: C.inspection,
        bgLight: '#F0F9FF',
        ring: '#7DD3FC',
    },
    {
        id: 'incidents',
        icon: IconAlertTriangle,
        title: 'Incidents en 90 secondes',
        description: 'Le chef de poste sort son téléphone, choisit le type, prend une photo. C\'est tout. Le préventeur reçoit l\'info en temps réel.',
        bullets: ['Marche hors-réseau au fond', 'GPS automatique', 'Photos & témoins'],
        color: C.green,
        bgLight: C.greenBg,
        ring: C.greenSoft,
    },
    {
        id: 'risks',
        icon: IconShieldCheck,
        title: 'Risques avant l\'accident',
        description: 'Matrice probabilité × gravité visuelle. Heat-map par zone. Plus de tableur Excel à mettre à jour le vendredi.',
        bullets: ['Matrice 5×5 ajustable', 'Heat-map par site', 'Plans d\'action liés'],
        color: C.green,
        bgLight: C.greenBg,
        ring: C.greenSoft,
    },
    {
        id: 'audits',
        icon: IconClipboardCheck,
        title: 'Audits ISO sans la corvée',
        description: 'L\'auditeur externe trouve ses preuves tout seul. Vos équipes dorment la veille de l\'audit.',
        bullets: ['Conforme ISO 19011', 'Rapport PDF auto', 'CAPA intégré'],
        color: C.audit,
        bgLight: '#F3E8FF',
        ring: '#C4B5FD',
    },
    {
        id: 'comm',
        icon: IconUsers,
        title: 'Communication HSE',
        description: 'Diffusion ciblée par mine, département, poste. Lecture vérifiée. Plus rien ne se perd dans WhatsApp.',
        bullets: ['Mail / SMS / app mobile', 'Statistiques de lecture', 'Bibliothèque centralisée'],
        color: C.green,
        bgLight: C.greenBg,
        ring: C.greenSoft,
    },
];

// ───────────────────────────────────────────────────────────────────────
// STATS — cards larges avec icônes
// ───────────────────────────────────────────────────────────────────────

const STATS = [
    { value: '21+', label: 'modules métier', icon: IconClipboardCheck, color: C.green, bg: C.greenBg, ring: C.greenSoft },
    { value: '4', label: 'normes ISO conformes', icon: IconCertificate, color: C.audit, bg: '#F3E8FF', ring: '#C4B5FD' },
    { value: '< 200 ms', label: 'temps réponse SOS', icon: IconBolt, color: C.emergency, bg: '#FEF2F2', ring: '#FCA5A5' },
    { value: '6', label: 'sites déployés', icon: IconBuildingFactory, color: C.inspection, bg: '#F0F9FF', ring: '#7DD3FC' },
];

const BENEFITS = [
    { value: '−42%', title: 'd\'accidents en moins', detail: 'LTIFR moyen sur 18 mois, mesuré sur 6 sites' },
    { value: '−67%', title: 'de délai entre signalement et clôture', detail: 'Workflows mobiles automatisés' },
    { value: '100%', title: 'd\'audits ISO certifiés', detail: 'Toutes les preuves documentaires sont déjà là' },
    { value: '×3,2', title: 'd\'efficacité côté préventeurs', detail: 'Plus de terrain, beaucoup moins d\'admin' },
];

const TESTIMONIALS = [
    {
        quote: 'Avant SafeX, on perdait deux jours par incident en paperasse. Aujourd\'hui le constat est clos en quatre heures, et l\'action corrective se suit toute seule.',
        author: 'Mamadou Diallo',
        role: 'Directeur HSE',
        company: 'Mine d\'or au Sénégal',
        avatarBg: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
    },
    {
        quote: 'Notre dernier audit ISO 45001 a duré deux jours au lieu de cinq. L\'auditeur a trouvé toutes ses preuves dans la plateforme, sans rien nous demander.',
        author: 'Aïssata Konaté',
        role: 'QHSE Manager',
        company: 'Exploitation minière au Mali',
        avatarBg: `linear-gradient(135deg, ${C.audit} 0%, #A855F7 100%)`,
    },
    {
        quote: 'Le SOS a sauvé une équipe coincée au fond après un éboulement. Sans SafeX, on ne les aurait jamais localisés à temps.',
        author: 'Joseph Mbeki',
        role: 'Chef de poste sécurité',
        company: 'Site d\'extraction en RDC',
        avatarBg: `linear-gradient(135deg, ${C.emergency} 0%, ${C.blasting} 100%)`,
    },
];

// LOT — Vrais logos de certification ISO en couleurs officielles reconnaissables
// Chaque norme a son code couleur identitaire (utilise par les certificateurs)
const ISO_BADGES = [
    { code: '9001', title: 'Management qualité', year: '2015', color: '#1D4ED8', colorDeep: '#1E40AF', bg: '#EFF6FF' },     // Bleu royal qualite
    { code: '14001', title: 'Environnement', year: '2015', color: '#15803D', colorDeep: '#166534', bg: '#F0FDF4' },         // Vert foret environnement
    { code: '19011', title: 'Audits qualité', year: '2018', color: '#6D28D9', colorDeep: '#5B21B6', bg: '#F5F3FF' },        // Violet indigo audits
    { code: '45001', title: 'Santé & Sécurité', year: '2018', color: '#0F766E', colorDeep: '#115E59', bg: '#F0FDFA' },      // Teal sante/securite
    { code: '31000', title: 'Gestion des risques', year: '2018', color: '#C2410C', colorDeep: '#9A3412', bg: '#FFF7ED' },   // Orange risques
];

// Identités visuelles des clients du ruban : chaque marque a son monogramme,
// sa forme d'emblème et son dégradé propre — comme de vrais logos d'entreprise.
interface ClientLogo {
    name: string;
    sub: string;
    initials: string;
    from: string;
    to: string;
    shape: 'circle' | 'squircle' | 'hexagon' | 'diamond' | 'shield';
}

const CLIENTS: ClientLogo[] = [
    { name: 'Sahelor', sub: "Mine d'or · Sénégal", initials: 'S', from: '#F59E0B', to: '#B45309', shape: 'hexagon' },
    { name: 'Kéniéba Mining', sub: 'Exploitation · Mali', initials: 'KM', from: '#38BDF8', to: '#0369A1', shape: 'circle' },
    { name: 'Katanga Ressources', sub: 'Site · RDC', initials: 'KR', from: '#34D399', to: '#047857', shape: 'squircle' },
    { name: 'Faso Minerals', sub: 'Mining · Burkina', initials: 'FM', from: '#FB7185', to: '#BE123C', shape: 'diamond' },
    { name: 'Ébrié Industries', sub: "Côte d'Ivoire", initials: 'ÉI', from: '#A78BFA', to: '#6D28D9', shape: 'squircle' },
    { name: 'Nimba Société Minière', sub: 'Guinée', initials: 'N', from: '#FB923C', to: '#C2410C', shape: 'circle' },
    { name: 'Ténéré Compagnie', sub: 'Niger', initials: 'TC', from: '#22D3EE', to: '#0E7490', shape: 'hexagon' },
    { name: 'Tasiast Holding', sub: 'Mauritanie', initials: 'TH', from: '#818CF8', to: '#4338CA', shape: 'shield' },
];

// ───────────────────────────────────────────────────────────────────────
// HOOKS
// ───────────────────────────────────────────────────────────────────────

function useReveal<T extends HTMLElement>(options?: IntersectionObserverInit) {
    const ref = useRef<T | null>(null);
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setRevealed(true); obs.unobserve(e.target); } },
            { threshold: 0.15, rootMargin: '0px 0px -80px 0px', ...options },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, revealed };
}

function Reveal({
    children, delay = 0, className = '', as: As = 'div',
}: { children: React.ReactNode; delay?: number; className?: string; as?: any }) {
    const { ref, revealed } = useReveal<HTMLDivElement>();
    return (
        <As
            ref={ref as any}
            className={className}
            style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            }}
        >
            {children}
        </As>
    );
}

function useCountUp(target: number, duration = 1600, decimals = 0) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [val, setVal] = useState(0);
    const started = useRef(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = performance.now();
                const tick = (now: number) => {
                    const elapsed = now - start;
                    const t = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - t, 3);
                    setVal(target * eased);
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.4 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [target, duration]);
    return { ref, val: decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString() };
}

// ═══════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    // LOT — Lightbox album photo pour la galerie : index ou null si ferme
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    useEffect(() => {
        if (user) navigate('/home', { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden antialiased">
            <GlobalStyles />
            <ContactModal opened={contactOpen} onClose={() => setContactOpen(false)} />

            {/* LOT — Lightbox plein ecran pour parcourir la galerie comme un album */}
            <GalleryLightbox
                index={lightboxIdx}
                onClose={() => setLightboxIdx(null)}
                onNext={() => setLightboxIdx((i) => (i === null ? 0 : (i + 1) % GALLERY.length))}
                onPrev={() => setLightboxIdx((i) => (i === null ? 0 : (i - 1 + GALLERY.length) % GALLERY.length))}
                onSelect={(i) => setLightboxIdx(i)}
            />

            {/* ═══ NAVBAR ═══ */}
            <nav
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm'
                        : 'bg-white/80 backdrop-blur-sm py-4'
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <a href="#hero" className="flex items-center gap-3 cursor-pointer">
                        <SafeXLogo size={40} />
                        <span
                            className="flex items-baseline"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 22,
                                letterSpacing: '-0.02em',
                                color: C.dark,
                            }}
                        >
                            <span>Safe</span>
                            <span style={{ color: C.green }}>X</span>
                            <span style={{ color: C.dark, marginLeft: 6 }}>360</span>
                        </span>
                    </a>

                    <div className="hidden lg:flex items-center gap-9">
                        {[
                            { label: 'Produit', href: '#features' },
                            { label: 'Plateforme', href: '#gallery' },
                            { label: 'Résultats', href: '#benefits' },
                            { label: 'ISO', href: '#certifications' },
                            { label: 'Contact', href: '#contact' },
                        ].map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="text-[14px] text-slate-700 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="cursor-pointer group flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-[14px] font-semibold"
                        style={{
                            background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
                            color: 'white',
                            boxShadow: `0 4px 14px ${C.green}55`,
                        }}
                    >
                        Connexion
                        <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            </nav>

            {/* ═══ HERO CINEMATIC — Carousel premium avec effets Ken Burns, sweep, parallax ═══ */}
            <CinematicHero onLogin={() => navigate('/login')} />

            {/* ═══ HERO LEGACY (desactive — conserve pour rollback rapide si besoin) ═══ */}
            <section
                id="hero-legacy"
                className="hidden"
                style={{
                    background:
                        `linear-gradient(135deg, ${C.paper} 0%, ${C.cream} 60%, ${C.greenBg} 100%)`,
                }}
            >
                <div
                    className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${C.greenLight}50 0%, transparent 70%)`,
                        transform: 'translate(20%, -30%)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] opacity-25 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${C.green}40 0%, transparent 70%)`,
                        transform: 'translate(-30%, 30%)',
                    }}
                />

                <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7">
                        <Reveal>
                            <div className="inline-flex items-center gap-3 mb-7">
                                <span aria-hidden="true" className="block h-px w-10" style={{ background: C.green, opacity: 0.55 }} />
                                <span className="text-[11.5px] tracking-[0.24em] uppercase font-semibold" style={{ color: C.green }}>
                                    Fait pour les mines d'Afrique de l'Ouest
                                </span>
                            </div>
                        </Reveal>

                        <Reveal delay={100}>
                            <h1
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(40px, 6vw, 84px)',
                                    letterSpacing: '-0.028em',
                                    lineHeight: 1.01,
                                    color: C.dark,
                                }}
                            >
                                Chaque équipe<br />
                                rentre chez elle{' '}
                                <span style={{
                                    background: `linear-gradient(110deg, ${C.green} 0%, ${C.greenLight} 60%, ${C.dark} 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontStyle: 'italic',
                                    display: 'inline-block',
                                }}>
                                    entière.
                                </span>
                            </h1>
                        </Reveal>

                        <Reveal delay={200}>
                            <p
                                className="mt-7 max-w-2xl"
                                style={{ fontSize: 'clamp(16px, 1.35vw, 19px)', lineHeight: 1.6, color: '#475569' }}
                            >
                                SafeX 360 outille les préventeurs HSE des mines africaines.{' '}
                                <strong style={{ color: C.dark, fontWeight: 700 }}>21 modules métier</strong>,
                                une app mobile qui marche au fond, et la conformité ISO qui se construit
                                au fil des jours.
                            </p>
                        </Reveal>

                        <Reveal delay={300}>
                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="cursor-pointer group inline-flex items-center gap-2.5 px-7 py-4 rounded-full transition-all text-[15px] font-semibold hover:scale-[1.02]"
                                    style={{
                                        background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
                                        color: 'white',
                                        boxShadow: `0 12px 30px -8px ${C.green}80`,
                                    }}
                                >
                                    J'accède à la plateforme
                                    <IconArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                                </button>
                                <a
                                    href="#features"
                                    className="cursor-pointer group inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white hover:bg-slate-50 transition-all text-[14.5px] font-semibold"
                                    style={{ border: `2px solid ${C.dark}`, color: C.dark }}
                                >
                                    <IconPlayerPlayFilled size={13} />
                                    Voir comment ça marche
                                </a>
                            </div>
                        </Reveal>

                        <Reveal delay={400}>
                            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                                {['Conforme RGPD', 'Souverain', 'Sans engagement', 'Support 24/7'].map((t) => (
                                    <div key={t} className="flex items-center gap-1.5 text-[13px] text-slate-700 font-medium">
                                        <span
                                            className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                                            style={{ background: C.greenBg, border: `1px solid ${C.greenSoft}` }}
                                        >
                                            <IconCheck size={11} style={{ color: C.green }} stroke={3} />
                                        </span>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>

                    <div className="lg:col-span-5 hidden lg:block">
                        <Reveal delay={300}><HeroVisual /></Reveal>
                    </div>
                </div>

                <a
                    href="#features"
                    className="cursor-pointer absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <span className="text-[10px] uppercase tracking-[0.22em] font-bold">Explorer</span>
                    <IconChevronDown size={18} className="animate-bounce" />
                </a>
            </section>

            {/* ═══ CLIENTS ═══ */}
            <section className="bg-[#FAF9F5] border-y border-slate-100 py-12 overflow-hidden">
                <p className="text-center text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-7 font-bold">
                    Ils utilisent SafeX 360 au quotidien
                </p>
                <ClientsMarquee />
            </section>

            {/* ═══ STATS — cards XL avec icônes en couleur ═══ */}
            <section className="bg-white py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center max-w-3xl mx-auto mb-14">
                            <SectionEyebrow color={C.green}>En chiffres</SectionEyebrow>
                            <h2
                                className="mt-4"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(30px, 4vw, 50px)',
                                    letterSpacing: '-0.025em',
                                    lineHeight: 1.08,
                                    color: C.dark,
                                }}
                            >
                                Robuste, mesuré,{' '}
                                <span style={{
                                    background: `linear-gradient(120deg, ${C.green} 0%, ${C.greenLight} 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontStyle: 'italic',
                                }}>en production.</span>
                            </h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STATS.map((s, i) => (
                            <Reveal key={i} delay={i * 80}>
                                <StatCard {...s} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FEATURES — 8 modules, grid responsive ═══ */}
            <section id="features" className="bg-[#FAF9F5] py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="max-w-3xl mb-14">
                            <SectionEyebrow color={C.dark}>Modules</SectionEyebrow>
                            <h2
                                className="mt-4"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(32px, 4.5vw, 56px)',
                                    letterSpacing: '-0.025em',
                                    lineHeight: 1.06,
                                    color: C.dark,
                                }}
                            >
                                8 modules métier{' '}
                                <span style={{
                                    background: `linear-gradient(120deg, ${C.green} 0%, ${C.dark} 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontStyle: 'italic',
                                }}>opérationnels.</span>
                            </h2>
                            <p className="mt-5 text-[16.5px] leading-relaxed max-w-2xl" style={{ color: '#475569' }}>
                                Quatre modules font tourner la sécurité au quotidien sur un site minier :
                                <strong style={{ color: C.dark }}> SOS, Évacuation, Dynamitages et Inspections.</strong> Tout autour, on retrouve les fondamentaux ISO 45001 : Incidents, Risques, Audits, Communication.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {FEATURES.map((f, i) => (
                            <Reveal key={f.id} delay={i * 60}>
                                <FeatureCard feature={f} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ GALERIE PLATEFORME — style album photo magazine ═══ */}
            <section id="gallery" className="bg-white py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <SectionEyebrow color={C.green}>Plateforme</SectionEyebrow>
                            <h2
                                className="mt-4"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(32px, 4.5vw, 60px)',
                                    letterSpacing: '-0.028em',
                                    lineHeight: 1.04,
                                    color: C.dark,
                                }}
                            >
                                Six écrans,<br />
                                <span style={{ fontStyle: 'italic', color: C.green }}>six moments HSE.</span>
                            </h2>
                            <p className="mt-5 text-[16.5px] leading-relaxed" style={{ color: '#475569' }}>
                                Du tableau de bord du matin jusqu'au SOS terrain, voici à quoi ressemble la journée d'un préventeur HSE sur SafeX 360.
                            </p>
                        </div>
                    </Reveal>

                    <GalleryAlbum onOpen={setLightboxIdx} />

                    {/* Indication album navigable */}
                    <div className="mt-10 text-center">
                        <span
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] uppercase tracking-[0.16em] font-semibold"
                            style={{ background: C.greenBg, color: C.green, border: `1.5px solid ${C.greenSoft}` }}
                        >
                            <IconSparkles size={12} />
                            Cliquez sur un écran pour l'ouvrir en grand et naviguer dans l'album
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══ AI SHOWCASE — Innovation IA mise en avant (3 piliers) ═══ */}
            <AIShowcase />

            {/* ═══ BÉNÉFICES — DYNAMIQUE ÉCLATANT ═══ */}
            <BenefitsDynamic />

            {/* ═══ ROI CALCULATOR ═══ */}
            <ROICalculator onContact={() => setContactOpen(true)} onLogin={() => navigate('/login')} />

            {/* ═══ ISO ═══ */}
            <section id="certifications" className="bg-white py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center max-w-3xl mx-auto mb-14">
                            <SectionEyebrow color={C.green}>Conformité</SectionEyebrow>
                            <h2
                                className="mt-4"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(32px, 4.5vw, 56px)',
                                    letterSpacing: '-0.025em',
                                    lineHeight: 1.06,
                                    color: C.dark,
                                }}
                            >
                                Vos audits ISO,<br />
                                <span style={{ fontStyle: 'italic', color: C.green }}>sans la corvée.</span>
                            </h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {ISO_BADGES.map((iso, i) => (
                            <Reveal key={i} delay={i * 80}>
                                <ISOMedallion iso={iso} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section className="bg-[#FAF9F5] py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center max-w-3xl mx-auto mb-14">
                            <SectionEyebrow color={C.green}>Ils en parlent</SectionEyebrow>
                            <h2
                                className="mt-4"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(32px, 4.5vw, 56px)',
                                    letterSpacing: '-0.025em',
                                    lineHeight: 1.06,
                                    color: C.dark,
                                }}
                            >
                                Des préventeurs HSE,<br />
                                <span style={{ fontStyle: 'italic', color: C.green }}>sur le terrain.</span>
                            </h2>
                        </div>
                    </Reveal>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <Reveal key={i} delay={i * 120}>
                                <div className="p-8 rounded-2xl bg-white border-2 border-slate-200 hover:shadow-2xl hover:border-slate-300 hover:-translate-y-1 transition-all h-full">
                                    <div className="flex items-center gap-0.5 mb-5">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <IconStar key={j} size={16} className="fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p
                                        className="text-[15.5px] leading-relaxed mb-7"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontStyle: 'italic',
                                            color: '#1E293B',
                                        }}
                                    >
                                        « {t.quote} »
                                    </p>
                                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                                            style={{ background: t.avatarBg }}
                                        >
                                            {t.author.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-[14px] text-slate-900 font-bold">{t.author}</div>
                                            <div className="text-[12px] text-slate-600">{t.role} · {t.company}</div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA FINAL ═══ */}
            <section
                id="contact"
                className="relative py-32 px-6 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 50%, ${C.dark} 100%)` }}
            >
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)' }}
                />

                <div className="relative max-w-4xl mx-auto text-center">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 bg-white/25 backdrop-blur-sm border border-white/40">
                            <IconSparkles size={13} className="text-white" />
                            <span className="text-[11.5px] uppercase tracking-[0.18em] text-white font-bold">
                                Démo gratuite · 30 min
                            </span>
                        </div>

                        <h2
                            className="mb-7"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(34px, 5.5vw, 72px)',
                                letterSpacing: '-0.028em',
                                lineHeight: 1.02,
                                color: '#FFFFFF',
                            }}
                        >
                            Parlez à un<br />
                            <span style={{ fontStyle: 'italic' }}>vrai préventeur HSE.</span>
                        </h2>

                        <p className="max-w-2xl mx-auto text-[17px] leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.95)' }}>
                            Pas de commercial. Un HSE qui a fait du terrain. On regarde votre situation,
                            on vous montre la plateforme, on vous dit franchement si ça vous convient.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                            <button
                                onClick={() => navigate('/login')}
                                className="cursor-pointer group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-slate-50 transition-all text-[15px] font-bold shadow-2xl hover:scale-[1.03]"
                                style={{ color: C.dark }}
                            >
                                Accéder à la plateforme
                                <IconArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            <button
                                onClick={() => setContactOpen(true)}
                                className="cursor-pointer inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border-2 border-white text-white transition-all text-[14.5px] font-semibold"
                            >
                                <IconMail size={15} />
                                Demander une démo
                            </button>
                        </div>

                        <div
                            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[12.5px] font-semibold"
                            style={{ color: 'rgba(255,255,255,0.95)' }}
                        >
                            <span className="flex items-center gap-1.5"><IconPhone size={12} /> +226 77 96 35 25</span>
                            <span className="flex items-center gap-1.5"><IconClock size={12} /> Lun–Ven · 9h–18h GMT</span>
                            <button
                                onClick={() => setContactOpen(true)}
                                className="cursor-pointer flex items-center gap-1.5 hover:text-white/100 transition-colors underline-offset-4 hover:underline"
                            >
                                <IconMail size={12} /> Formulaire de contact
                            </button>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="bg-[#FAF9F5] py-14 px-6 border-t border-slate-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-10 mb-10">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <SafeXLogo size={38} />
                                <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 22, color: C.dark }}>
                                    Safe<span style={{ color: C.green }}>X</span> <span style={{ color: C.dark, marginLeft: 4 }}>360</span>
                                </span>
                            </div>
                            <p className="text-[13.5px] leading-relaxed max-w-md" style={{ color: '#475569' }}>
                                Plateforme HSE intégrée pour l'industrie minière ouest-africaine.
                                Conçue et éditée au Burkina Faso par Data Universe.
                            </p>
                            <a
                                href="https://data-univers.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-[12px] text-slate-700 transition-colors"
                            >
                                <IconGlobe size={13} />
                                data-univers.com
                            </a>
                        </div>

                        <div>
                            <h5 className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-4 font-bold">Produit</h5>
                            <ul className="space-y-2.5 text-[13.5px]">
                                <li><a href="#features" className="text-slate-700 hover:text-slate-900 cursor-pointer">Modules</a></li>
                                <li><a href="#gallery" className="text-slate-700 hover:text-slate-900 cursor-pointer">Plateforme</a></li>
                                <li><a href="#benefits" className="text-slate-700 hover:text-slate-900 cursor-pointer">Résultats</a></li>
                                <li><a href="#certifications" className="text-slate-700 hover:text-slate-900 cursor-pointer">ISO</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-4 font-bold">Contact</h5>
                            <ul className="space-y-2.5 text-[13.5px]">
                                <li><button onClick={() => setContactOpen(true)} className="cursor-pointer text-slate-700 hover:text-slate-900 text-left">Demander une démo</button></li>
                                <li><button onClick={() => setContactOpen(true)} className="cursor-pointer text-slate-700 hover:text-slate-900 text-left">Nous écrire</button></li>
                                <li className="flex items-center gap-1.5 text-slate-700"><IconPhone size={12} /> +226 77 96 35 25</li>
                                <li><button onClick={() => navigate('/login')} className="cursor-pointer text-slate-700 hover:text-slate-900 text-left">Espace client</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-7 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[11.5px] text-slate-500">
                            © {new Date().getFullYear()} Data Universe · Tous droits réservés
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5"><IconLockSquare size={12} /> Hébergement souverain</span>
                            <span className="flex items-center gap-1.5"><IconCloudUpload size={12} /> Sauvegarde quotidienne</span>
                            <span className="flex items-center gap-1.5"><IconHelmet size={12} /> Conçu au Burkina Faso</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Kicker de section éditorial : filet fin + petites capitales espacées,
 * sans pastille ni puce — façon revue imprimée.
 */
function SectionEyebrow({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <div className="inline-flex items-center gap-3">
            <span aria-hidden="true" className="block h-px w-8" style={{ background: color, opacity: 0.5 }} />
            <span className="text-[11.5px] uppercase tracking-[0.26em] font-semibold" style={{ color }}>
                {children}
            </span>
            <span aria-hidden="true" className="block h-px w-8" style={{ background: color, opacity: 0.5 }} />
        </div>
    );
}

function SafeXLogo({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label="SafeX 360"
            style={{ filter: `drop-shadow(0 4px 14px ${C.green}50)` }}
        >
            <defs>
                <linearGradient id="sx-grad-v6" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={C.greenSoft} />
                    <stop offset="55%" stopColor={C.green} />
                    <stop offset="100%" stopColor={C.dark} />
                </linearGradient>
            </defs>
            <path d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill="url(#sx-grad-v6)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
            <path d="M 20 31 L 29 40 L 45 21" stroke="white" strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// STAT CARD — large + icône colorée
// ═══════════════════════════════════════════════════════════════════════

function StatCard({ value, label, icon: Icon, color, bg, ring }: {
    value: string; label: string; icon: any; color: string; bg: string; ring: string;
}) {
    return (
        <div
            className="bg-white rounded-2xl px-6 py-5 transition-[box-shadow] hover:shadow-lg"
            style={{
                border: `1.5px solid ${ring}`,
                boxShadow: `0 6px 22px -12px ${color}25`,
            }}
        >
            {/* Icône et valeur sur la même ligne : tuile compacte */}
            <div className="flex items-center gap-4">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, border: `1px solid ${ring}` }}
                >
                    <Icon size={21} stroke={1.8} style={{ color }} />
                </div>
                <div
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: 'clamp(30px, 2.8vw, 40px)',
                        letterSpacing: '-0.025em',
                        lineHeight: 1,
                        color,
                    }}
                >
                    {value}
                </div>
            </div>

            {/* Label */}
            <div className="mt-3 text-[11.5px] uppercase tracking-[0.16em] font-semibold" style={{ color: '#475569' }}>
                {label}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// FEATURE CARD — 8 modules, accent sur 4 signatures
// ═══════════════════════════════════════════════════════════════════════

function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
    const Icon = feature.icon;
    return (
        <div
            className={`group relative bg-white rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-2xl h-full flex flex-col ${
                feature.highlight ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
                border: `2px solid ${feature.highlight ? feature.color : '#E2E8F0'}`,
                boxShadow: feature.highlight
                    ? `0 12px 30px -10px ${feature.color}40`
                    : '0 1px 3px rgba(0,0,0,0.05)',
                ...(feature.highlight ? { ['--tw-ring-color' as any]: feature.color + '20' } : {}),
            }}
        >
            {/* Badge "Signature" pour les modules en couleur */}
            {feature.highlight && (
                <div
                    className="absolute -top-2 right-4 text-[9.5px] uppercase tracking-[0.16em] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: feature.color, color: 'white', letterSpacing: '0.12em' }}
                >
                    Signature
                </div>
            )}

            {/* Icône en pastille de couleur */}
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{
                    background: feature.bgLight,
                    border: `1.5px solid ${feature.ring}`,
                }}
            >
                <Icon size={26} stroke={1.8} style={{ color: feature.color }} />
            </div>

            <h3
                className="mb-3"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: '-0.015em',
                    color: C.dark,
                    lineHeight: 1.2,
                }}
            >
                {feature.title}
            </h3>

            <p className="text-[13px] leading-relaxed mb-5 flex-1" style={{ color: '#475569' }}>
                {feature.description}
            </p>

            <ul className="space-y-1.5 pt-4 border-t border-slate-100">
                {feature.bullets.map((b, j) => (
                    <li key={j} className="flex items-center gap-2 text-[12px] font-medium" style={{ color: '#334155' }}>
                        <IconCheck size={12} style={{ color: feature.color }} stroke={3} />
                        {b}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// GALLERY LIGHTBOX — Album photo plein écran navigable
// ═══════════════════════════════════════════════════════════════════════

interface GalleryLightboxProps {
    index: number | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSelect: (i: number) => void;
}

function GalleryLightbox({ index, onClose, onNext, onPrev, onSelect }: GalleryLightboxProps) {
    // Gestion clavier : Esc / ← / →
    useEffect(() => {
        if (index === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowRight') onNext();
            else if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', onKey);
        // Lock body scroll
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [index, onClose, onNext, onPrev]);

    if (index === null) return null;
    const item = GALLERY[index];
    const isRealCapture = item.label !== 'App mobile terrain'; // PreviewMobile reste un mockup

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            style={{
                background: 'rgba(8, 14, 26, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                animation: 'hero-caption-slide 250ms ease-out',
            }}
            onClick={onClose}
        >
            {/* Bouton fermer */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="cursor-pointer fixed top-5 right-5 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <IconX size={20} stroke={2.2} color="white" />
            </button>

            {/* Compteur + label */}
            <div className="fixed top-5 left-5 z-10 flex items-center gap-3">
                <div
                    className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em] font-bold"
                    style={{
                        background: 'rgba(255,255,255,0.10)',
                        border: '1.5px solid rgba(255,255,255,0.30)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {String(index + 1).padStart(2, '0')} / {String(GALLERY.length).padStart(2, '0')}
                </div>
                <div
                    className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.16em] font-bold"
                    style={{
                        background: `${item.color}30`,
                        border: `1.5px solid ${item.color}80`,
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {item.label}
                </div>
            </div>

            {/* Navigation gauche */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                aria-label="Précédent"
                className="cursor-pointer hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full items-center justify-center transition-all hover:scale-110 hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.30)' }}
            >
                <IconChevronLeft size={22} color="white" />
            </button>

            {/* Navigation droite */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                aria-label="Suivant"
                className="cursor-pointer hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full items-center justify-center transition-all hover:scale-110 hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.30)' }}
            >
                <IconChevronRight size={22} color="white" />
            </button>

            {/* Contenu principal — Image + caption */}
            <div
                className="relative max-w-6xl w-full flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '85vh' }}
            >
                {/* Image */}
                <div
                    key={`lb-img-${index}`}
                    className="relative rounded-2xl overflow-hidden w-full"
                    style={{
                        background: item.bg,
                        boxShadow: `0 30px 80px -20px ${item.color}60, 0 0 0 1px rgba(255,255,255,0.10) inset`,
                        maxHeight: '70vh',
                        aspectRatio: '16/9',
                        animation: 'hero-reveal-up 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {isRealCapture ? (
                        <img
                            src={(() => {
                                // Mapping label → fichier (sync avec GALLERY[].Preview)
                                const map: Record<string, string> = {
                                    'Tableau de bord': '/screenshots/dashboard.png',
                                    'SOS déclenché': '/screenshots/alerte-declenchee.png',
                                    'Alerte générale': '/screenshots/alerte-generale.png',
                                    'Déclaration incident': '/screenshots/formulaire-incident.png',
                                    'Non-conformité & Near-miss': '/screenshots/non-conformite.png',
                                };
                                return map[item.label] || '';
                            })()}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ background: '#0F172A' }}
                        />
                    ) : (
                        <item.Preview />
                    )}
                </div>

                {/* Caption sous l'image */}
                <div
                    key={`lb-cap-${index}`}
                    className="text-center px-4 max-w-3xl"
                    style={{ animation: 'hero-reveal-up 500ms 100ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
                >
                    <h3
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(22px, 2.5vw, 32px)',
                            letterSpacing: '-0.020em',
                            color: 'white',
                            marginBottom: 8,
                        }}
                    >
                        {item.title}
                    </h3>
                    <p className="text-[14.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                        {item.description}
                    </p>
                </div>

                {/* Strip de thumbnails — navigation rapide */}
                <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                    {GALLERY.map((g, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onSelect(i)}
                            aria-label={`Voir ${g.label}`}
                            className="cursor-pointer relative rounded-md overflow-hidden transition-all"
                            style={{
                                width: i === index ? 56 : 44,
                                height: i === index ? 40 : 32,
                                border: i === index ? `2px solid ${g.color}` : '1.5px solid rgba(255,255,255,0.25)',
                                boxShadow: i === index ? `0 0 0 3px ${g.color}30` : 'none',
                                background: g.bg,
                                opacity: i === index ? 1 : 0.65,
                            }}
                        >
                            <span
                                className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-wider font-bold text-center px-1"
                                style={{ color: i === index ? 'white' : g.color }}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// AI SHOWCASE — Section dédiée à l'innovation IA (3 piliers)
// ═══════════════════════════════════════════════════════════════════════

interface AIPillar {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    accent: string;
    image?: string;
    mockTag: string;
}

const AI_PILLARS: AIPillar[] = [
    {
        icon: <IconSparkles size={26} stroke={1.8} />,
        eyebrow: '01 · Vision',
        title: 'Déclaration assistée par IA',
        description: 'Le chef de poste prend la scène en photo. Claude Vision repère le type d\'incident, en évalue la gravité, suggère les causes possibles et même un premier plan d\'actions correctives. Tout ça en moins de huit secondes.',
        highlights: [
            'Reconnaît EPI manquants, dangers électriques, chutes',
            'Classifie selon ISO 45001 §10.2 automatiquement',
            'Pré-rédige le plan d\'actions correctives',
        ],
        accent: '#8B5CF6',
        image: '/screenshots/formulaire-incident.png',
        mockTag: 'Claude Sonnet 4.5 · Vision',
    },
    {
        icon: <IconClipboardCheck size={26} stroke={1.8} />,
        eyebrow: '02 · Terrain',
        title: 'Inspections assistées par IA',
        description: 'Au fil des tournées, les checklists s\'affinent. L\'IA détecte les non-conformités sur les photos, propose les actions adaptées et programme les vérifications de suivi sans qu\'on ait à y penser.',
        highlights: [
            'Détection automatique des EPI sur les photos terrain',
            'Suggestions contextuelles selon le type d\'inspection',
            'Apprentissage continu par site (méthodes ICAM, MORT, TapRoot)',
        ],
        accent: '#06B6D4',
        image: '/screenshots/non-conformite.png',
        mockTag: 'Apprentissage continu',
    },
    {
        icon: <IconBolt size={26} stroke={1.8} />,
        eyebrow: '03 · Copilote',
        title: 'Assistant IA pour la plateforme',
        description: 'Posez votre question comme à un collègue : « Quels sont les cinq risques majeurs ce mois-ci ? » ou « Génère le rapport mensuel ISO 45001 ». Le copilote SafeX exécute, cite ses sources, garde une trace de chaque action.',
        highlights: [
            'Recherche sémantique sur les 21 modules',
            'Génération de rapports avec sources citées',
            'Traçabilité complète des actions admin via audit log',
        ],
        accent: '#0EA5E9',
        image: '/screenshots/dashboard.png',
        mockTag: 'Copilote SafeX · Bientôt',
    },
];

function AIShowcase() {
    const [activePillar, setActivePillar] = useState(0);

    return (
        <section
            id="ai"
            className="relative py-32 px-6 overflow-hidden"
            style={{
                background: `
                    radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.20) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.18) 0%, transparent 55%),
                    linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #1E1B4B 100%)
                `,
            }}
        >
            {/* Grille décorative */}
            <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(6,182,212,0.5) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Halo lumineux animé */}
            <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%)',
                    animation: 'blob-1 18s ease-in-out infinite',
                    filter: 'blur(60px)',
                }}
            />

            <div className="relative max-w-7xl mx-auto">
                {/* Header */}
                <Reveal>
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        {/* Eyebrow IA — filet éditorial violet */}
                        <div className="inline-flex items-center gap-3 mb-7">
                            <span aria-hidden="true" className="block h-px w-10 bg-violet-400/70" />
                            <IconSparkles size={14} className="text-violet-300" />
                            <span className="text-[11.5px] uppercase tracking-[0.24em] font-bold text-white">
                                Innovation 2026 · Première mondiale HSE
                            </span>
                            <span aria-hidden="true" className="block h-px w-10 bg-violet-400/70" />
                        </div>

                        <h2
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(36px, 5.5vw, 68px)',
                                letterSpacing: '-0.028em',
                                lineHeight: 1.02,
                                color: 'white',
                            }}
                        >
                            L'intelligence artificielle{' '}
                            <span
                                style={{
                                    background: 'linear-gradient(110deg, #C4B5FD 0%, #67E8F9 50%, #FFFFFF 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontStyle: 'italic',
                                    display: 'inline-block',
                                }}
                            >
                                au service de la sécurité.
                            </span>
                        </h2>

                        <p
                            className="mt-7"
                            style={{
                                fontSize: 'clamp(16px, 1.4vw, 19px)',
                                lineHeight: 1.6,
                                color: 'rgba(248, 250, 252, 0.78)',
                            }}
                        >
                            SafeX 360 est la première plateforme HSE à utiliser Claude Sonnet 4.5 sur trois axes concrets du métier. Vos préventeurs gagnent en précision sur le terrain, en vitesse au quotidien, et finissent par peser dans les arbitrages stratégiques.
                        </p>
                    </div>
                </Reveal>

                {/* 3 piliers en cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {AI_PILLARS.map((pillar, i) => {
                        const isActive = i === activePillar;
                        return (
                            <Reveal key={i} delay={i * 120}>
                                <button
                                    type="button"
                                    onClick={() => setActivePillar(i)}
                                    onMouseEnter={() => setActivePillar(i)}
                                    className="cursor-pointer group relative h-full w-full text-left rounded-3xl p-7 overflow-hidden transition-all"
                                    style={{
                                        background: isActive
                                            ? `linear-gradient(155deg, ${pillar.accent}22 0%, ${pillar.accent}08 100%)`
                                            : 'rgba(255, 255, 255, 0.03)',
                                        border: `1.5px solid ${isActive ? pillar.accent + '80' : 'rgba(255,255,255,0.10)'}`,
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
                                        boxShadow: isActive ? `0 25px 60px -15px ${pillar.accent}50` : 'none',
                                    }}
                                >
                                    {/* Glow halo derriere icone */}
                                    <div
                                        className="absolute top-0 left-0 w-40 h-40 pointer-events-none opacity-60"
                                        style={{
                                            background: `radial-gradient(circle, ${pillar.accent}50 0%, transparent 70%)`,
                                            filter: 'blur(40px)',
                                            transform: 'translate(-30%, -30%)',
                                        }}
                                    />

                                    {/* Header card */}
                                    <div className="relative flex items-start justify-between mb-5">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                                            style={{
                                                background: `linear-gradient(135deg, ${pillar.accent} 0%, ${pillar.accent}80 100%)`,
                                                color: 'white',
                                                boxShadow: `0 12px 30px -8px ${pillar.accent}80`,
                                            }}
                                        >
                                            {pillar.icon}
                                        </div>
                                        <span
                                            className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] font-bold"
                                            style={{ color: pillar.accent }}
                                        >
                                            <span aria-hidden="true" className="block h-px w-6" style={{ background: pillar.accent, opacity: 0.6 }} />
                                            {pillar.eyebrow}
                                        </span>
                                    </div>

                                    {/* Titre */}
                                    <h3
                                        className="relative mb-3"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(22px, 2vw, 28px)',
                                            letterSpacing: '-0.020em',
                                            color: 'white',
                                            lineHeight: 1.15,
                                        }}
                                    >
                                        {pillar.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="relative text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(248, 250, 252, 0.74)' }}>
                                        {pillar.description}
                                    </p>

                                    {/* Highlights */}
                                    <ul className="relative space-y-2 mb-6">
                                        {pillar.highlights.map((h, j) => (
                                            <li key={j} className="flex items-start gap-2 text-[13px]" style={{ color: 'rgba(248, 250, 252, 0.82)' }}>
                                                <span
                                                    className="mt-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full flex-shrink-0"
                                                    style={{ background: `${pillar.accent}40`, border: `1px solid ${pillar.accent}80` }}
                                                >
                                                    <IconCheck size={9} stroke={3.5} style={{ color: pillar.accent }} />
                                                </span>
                                                <span>{h}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Footer card */}
                                    <div
                                        className="relative pt-4 flex items-center justify-between"
                                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                                    >
                                        <span
                                            className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider font-bold"
                                            style={{ color: pillar.accent }}
                                        >
                                            <IconSparkles size={12} />
                                            {pillar.mockTag}
                                        </span>
                                        <span
                                            className="text-[11px] font-semibold opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                            style={{ color: 'white' }}
                                        >
                                            Voir
                                            <IconArrowUpRight size={12} stroke={2.5} />
                                        </span>
                                    </div>
                                </button>
                            </Reveal>
                        );
                    })}
                </div>

                {/* Bandeau stats IA en bas */}
                <Reveal delay={400}>
                    <div
                        className="mt-14 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4"
                        style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.10)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {[
                            { value: '8 s', label: 'pour analyser une photo' },
                            { value: '96 %', label: 'précision détection EPI' },
                            { value: '−45 %', label: 'temps de saisie HSE' },
                            { value: '21', label: 'modules connectés à l\'IA' },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                <span
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: 'clamp(28px, 3.2vw, 42px)',
                                        fontWeight: 600,
                                        background: 'linear-gradient(110deg, #C4B5FD 0%, #67E8F9 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        letterSpacing: '-0.020em',
                                    }}
                                >
                                    {s.value}
                                </span>
                                <span className="text-[11.5px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// CINEMATIC HERO — Carousel premium avec Ken Burns, sweep, parallax
// ═══════════════════════════════════════════════════════════════════════

interface HeroSlide {
    src: string;
    eyebrow: string;
    title: React.ReactNode;
    subtitle: string;
    keyword: string;
    accent: string;
    burnsClass: string;
    /**
     * Focal point CSS pour `object-position` : controle quel point de l'image
     * reste centre meme avec le Ken Burns. Ex: '50% 30%' garde le visage haut
     * du sujet visible. Important : sans ca, `object-cover` coupe les visages
     * sur certaines photos verticales.
     */
    focal: string;
}

const HERO_SLIDES: HeroSlide[] = [
    {
        src: '/hero/mine-aerial.jpg',
        eyebrow: "Mines à ciel ouvert · Afrique de l'Ouest",
        title: <>Chaque équipe<br />rentre chez elle{' '}<em>entière.</em></>,
        subtitle: 'On a construit SafeX 360 avec les préventeurs HSE des plus grandes mines du continent.',
        keyword: 'Vision 360°',
        accent: '#0F766E',
        burnsClass: 'ken-burns-1',
        // Vue aerienne : focal centre-haut pour garder les terrasses visibles
        focal: '50% 35%',
    },
    {
        src: '/hero/mine-excavator.jpg',
        eyebrow: 'Opérations minières · Engins lourds',
        title: <>La sécurité<br /><em>au cœur des opérations.</em></>,
        subtitle: 'Engins en mouvement, piétons qui croisent, énergies dangereuses partout. Tout se trace en temps réel.',
        keyword: 'Vue opérations',
        accent: '#C2410C',
        burnsClass: 'ken-burns-2',
        // Excavatrice centrale a gauche de l'image
        focal: '40% 50%',
    },
    {
        src: '/hero/blast-detonation.png',
        eyebrow: 'Dynamitages · Tir contrôlé',
        title: <>Aucun tir<br /><em>sans validation.</em></>,
        subtitle: 'Plan de tir, périmètre tracé, panneaux installés, signaux sonores prêts, rubans de sécurité en place. Le boutefeu donne le feu vert à chaque étape, et pas avant.',
        keyword: 'Workflow Blasting',
        accent: '#EF4444',
        burnsClass: 'ken-burns-1',
        // Boutefeu a gauche + explosion centrale → focal a 45% horizontal
        focal: '45% 50%',
    },
    {
        src: '/hero/training-team.png',
        eyebrow: 'Culture HSE · Formations terrain',
        title: <>La culture<br /><em>qui se construit.</em></>,
        subtitle: 'Règles d\'or, exercices réguliers, communications de proximité. Petit à petit, le préventeur HSE prend sa place de coach sur le terrain.',
        keyword: 'Zéro accident',
        accent: '#0F766E',
        burnsClass: 'ken-burns-3',
        // Preventeur debout au centre : focal a 50% 25% pour garder le visage visible
        // meme avec le Ken Burns zoom + texte a gauche
        focal: '70% 30%',
    },
    {
        src: '/hero/workers-loto.png',
        eyebrow: 'Énergies dangereuses · Consignation LOTO',
        title: <>Verrouillage,<br /><em>vies sauvées.</em></>,
        subtitle: 'Chaque étape LOTO laisse une trace, les EPI sont vérifiés, le registre des consignations reste à jour en permanence.',
        keyword: 'LOTO certifié',
        accent: '#0F766E',
        burnsClass: 'ken-burns-1',
        // 3 travailleurs : focal centre pour les garder ensemble
        focal: '55% 45%',
    },
    {
        src: '/hero/incident-scene.png',
        eyebrow: 'Investigation · Apprentissage continu',
        title: <>Chaque incident,<br /><em>une leçon apprise.</em></>,
        subtitle: 'Une déclaration tient en 90 secondes. L\'investigation se fait pas à pas, le plan d\'actions sort dans la foulée. Quelques mois plus tard, la récurrence a vraiment baissé.',
        keyword: '−67 % récurrence',
        accent: '#C2410C',
        burnsClass: 'ken-burns-2',
        // Scene action complexe : focal centre-bas pour cadrer le chariot
        focal: '50% 55%',
    },
    {
        src: '/hero/first-aid.png',
        eyebrow: 'Secourisme · Premiers gestes',
        title: <>Quand chaque<br /><em>seconde compte.</em></>,
        subtitle: 'Les SST sont identifiés, la mallette de premiers secours est géolocalisée, le point de rassemblement est balisé. Personne ne cherche, tout le monde sait où aller.',
        keyword: 'Réponse SST',
        accent: '#0F766E',
        burnsClass: 'ken-burns-3',
        // Secouriste agenouille au centre + victime au sol : focal centre-bas
        focal: '50% 55%',
    },
];

interface CinematicHeroProps {
    onLogin: () => void;
}

function CinematicHero({ onLogin }: CinematicHeroProps) {
    const [active, setActive] = useState(0);
    const [scrollY, setScrollY] = useState(0);
    const [paused, setPaused] = useState(false);

    // Auto-advance toutes les 7 secondes
    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => {
            setActive((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 7000);
        return () => clearInterval(id);
    }, [paused]);

    // Parallax leger au scroll
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const slide = HERO_SLIDES[active];
    const parallaxOffset = Math.min(scrollY * 0.35, 200);

    return (
        <section
            id="hero"
            className="relative overflow-hidden w-full"
            style={{
                // LOT — Hero a 2/3 de l'ecran + 75px : la marge supplementaire
                // garantit que les CTA et le badge restent au-dessus du bandeau
                // de statistiques sans jamais etre rognes.
                height: 'calc(66vh + 75px)',
                minHeight: '600px',
                background: '#0F172A',
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ─── COUCHE 1 : Images carousel avec Ken Burns ─── */}
            <div className="absolute inset-0 z-0">
                {HERO_SLIDES.map((s, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 transition-opacity"
                        style={{
                            opacity: i === active ? 1 : 0,
                            transitionDuration: '1800ms',
                            transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
                            transform: `translateY(${parallaxOffset}px)`,
                        }}
                    >
                        <img
                            src={s.src}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                // Focal point par slide pour eviter de couper visages/sujets
                                objectPosition: s.focal,
                                animation: i === active ? `${s.burnsClass} 9s ease-out forwards` : 'none',
                                transformOrigin: s.focal,
                            }}
                            loading={i === 0 ? 'eager' : 'lazy'}
                        />
                    </div>
                ))}
            </div>

            {/* ─── COUCHE 2 : Voile dark gradient pour lisibilite ─── */}
            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background: `
                        linear-gradient(105deg,
                            rgba(15, 23, 42, 0.92) 0%,
                            rgba(15, 23, 42, 0.75) 35%,
                            rgba(15, 118, 110, 0.35) 70%,
                            rgba(15, 23, 42, 0.55) 100%
                        )
                    `,
                }}
            />

            {/* ─── COUCHE 3 : Effet sweep diagonal (relance a chaque slide change) ─── */}
            <div
                key={`sweep-${active}`}
                className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
            >
                <div
                    className="absolute top-0 bottom-0 w-1/3"
                    style={{
                        background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)',
                        animation: 'hero-sweep 2s ease-out',
                        animationDelay: '0.3s',
                    }}
                />
            </div>

            {/* ─── COUCHE 4 : Grille decorative subtile ─── */}
            <div
                className="absolute inset-0 z-20 pointer-events-none opacity-[0.08]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                }}
            />

            {/* ─── COUCHE 5 : Contenu principal ─── */}
            <div className="relative z-30 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col justify-center h-full">
                {/* Eyebrow dynamique — filet éditorial à l'accent du slide */}
                <div
                    key={`eb-${active}`}
                    className="inline-flex items-center gap-3 mb-7 self-start"
                    style={{ animation: 'hero-caption-slide 700ms ease-out' }}
                >
                    <span aria-hidden="true" className="block h-px w-10" style={{ background: slide.accent }} />
                    <span className="text-[11px] tracking-[0.24em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        {slide.eyebrow}
                    </span>
                </div>

                {/* Titre principal — change avec le slide */}
                <h1
                    key={`title-${active}`}
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: 'clamp(36px, 5.5vw, 72px)',
                        letterSpacing: '-0.028em',
                        lineHeight: 1.0,
                        color: 'white',
                        maxWidth: '900px',
                        animation: 'hero-reveal-up 900ms cubic-bezier(0.16, 1, 0.3, 1)',
                        textShadow: '0 4px 30px rgba(0,0,0,0.4)',
                    }}
                >
                    {(() => {
                        // Extract em-italic from JSX title for accent styling
                        return slide.title;
                    })()}
                </h1>

                <style>{`
                    #hero h1 em {
                        background: linear-gradient(110deg, #5EEAD4 0%, #99F6E4 60%, #FFFFFF 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        font-style: italic;
                        display: inline-block;
                    }
                `}</style>

                {/* Description */}
                <p
                    key={`desc-${active}`}
                    className="mt-5 max-w-2xl"
                    style={{
                        fontSize: 'clamp(14.5px, 1.2vw, 18px)',
                        lineHeight: 1.55,
                        color: 'rgba(248, 250, 252, 0.92)',
                        animation: 'hero-reveal-up 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
                        animationDelay: '150ms',
                        animationFillMode: 'backwards',
                        textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    }}
                >
                    {slide.subtitle}{' '}
                    <strong style={{ color: 'white', fontWeight: 700 }}>21 modules métier</strong>,
                    une app mobile qui marche au fond, et la conformité ISO qui se construit au fil des jours.
                </p>

                {/* CTAs */}
                <div
                    className="mt-7 flex flex-wrap items-center gap-3"
                    style={{
                        animation: 'hero-reveal-up 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
                        animationDelay: '300ms',
                        animationFillMode: 'backwards',
                    }}
                >
                    <button
                        onClick={onLogin}
                        className="cursor-pointer group inline-flex items-center justify-center gap-2.5 h-[52px] px-8 rounded-full transition-[box-shadow,filter] text-[15px] font-semibold hover:brightness-110"
                        style={{
                            background: `linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)`,
                            color: 'white',
                            boxShadow: `0 14px 36px -10px rgba(15, 118, 110, 0.6), 0 0 0 1px rgba(255,255,255,0.12) inset`,
                        }}
                    >
                        J'accède à la plateforme
                        <IconArrowRight size={17} className="transition-transform group-hover:translate-x-1.5" />
                    </button>
                    <a
                        href="#features"
                        className="cursor-pointer group inline-flex items-center justify-center gap-2.5 h-[52px] px-7 rounded-full transition-[background-color,border-color] text-[14.5px] font-semibold hover:bg-white/15"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.4)',
                            color: 'white',
                        }}
                    >
                        <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)' }}
                        >
                            <IconPlayerPlayFilled size={11} />
                        </span>
                        Voir comment ça marche
                    </a>

                    {/* Badge keyword dynamique */}
                    <div
                        key={`kw-${active}`}
                        className="inline-flex items-center justify-center gap-1.5 h-[40px] px-4 rounded-full"
                        style={{
                            background: `${slide.accent}28`,
                            border: `1px solid ${slide.accent}70`,
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            animation: 'hero-caption-slide 800ms ease-out',
                        }}
                    >
                        <IconSparkles size={13} style={{ color: slide.accent }} />
                        <span className="text-[11.5px] font-bold uppercase tracking-wider">
                            {slide.keyword}
                        </span>
                    </div>
                </div>

                {/* Trust signals */}
                <div
                    className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
                    style={{
                        animation: 'hero-reveal-up 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
                        animationDelay: '450ms',
                        animationFillMode: 'backwards',
                    }}
                >
                    {['Conforme RGPD', 'Souverain · Hébergé en Afrique', 'Sans engagement', 'Support 24/7'].map((t) => (
                        <div key={t} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'rgba(248, 250, 252, 0.85)' }}>
                            <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                                style={{ background: 'rgba(94, 234, 212, 0.18)', border: '1px solid rgba(94, 234, 212, 0.5)' }}
                            >
                                <IconCheck size={11} style={{ color: '#5EEAD4' }} stroke={3} />
                            </span>
                            {t}
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── COUCHE 6 : Dots verticaux + progress bar a droite ─── */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3">
                {HERO_SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        aria-label={`Voir slide ${i + 1}`}
                        className="cursor-pointer group relative flex items-center gap-3"
                    >
                        <span
                            className="text-[10px] uppercase tracking-[0.18em] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'white' }}
                        >
                            0{i + 1}
                        </span>
                        <span
                            className="relative block rounded-full transition-all"
                            style={{
                                width: i === active ? 4 : 2,
                                height: i === active ? 36 : 22,
                                background: i === active ? 'white' : 'rgba(255,255,255,0.35)',
                            }}
                        >
                            {i === active && !paused && (
                                <span
                                    className="absolute inset-0 origin-top rounded-full"
                                    style={{
                                        background: slide.accent,
                                        animation: 'hero-progress 7s linear forwards',
                                        transformOrigin: 'top',
                                    }}
                                />
                            )}
                        </span>
                    </button>
                ))}
            </div>

            {/* ─── COUCHE 7 : Marquee bandeau statistiques HSE en bas ─── */}
            <div
                className="absolute bottom-0 left-0 right-0 z-30 py-4 overflow-hidden"
                style={{
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.4) 70%, transparent 100%)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                }}
            >
                <div className="flex" style={{ animation: 'marquee 45s linear infinite', width: 'fit-content' }}>
                    {[...HERO_MARQUEE, ...HERO_MARQUEE].map((stat, i) => (
                        <div key={i} className="flex items-center gap-3 px-8 whitespace-nowrap">
                            {/* Règle plateforme : une norme ISO s'affiche avec son badge, pas en texte */}
                            {stat.value.startsWith('ISO') ? (
                                <IsoBadge norm={stat.value} theme="dark" size="md" />
                            ) : (
                                <span
                                    className="text-[26px] font-bold"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        background: 'linear-gradient(110deg, #5EEAD4 0%, #99F6E4 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    {stat.value}
                                </span>
                            )}
                            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                {stat.label}
                            </span>
                            <span className="text-white/30 text-xl">·</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator en bas centre (au-dessus du marquee, masque sur mobile
                pour ne jamais chevaucher les CTA) */}
            <a
                href="#features"
                className="cursor-pointer absolute bottom-16 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
                style={{ animation: 'float-y 2.5s ease-in-out infinite' }}
            >
                <span className="text-[9.5px] uppercase tracking-[0.28em] font-bold">Explorer</span>
                <IconChevronDown size={18} stroke={2} />
            </a>
        </section>
    );
}

const HERO_MARQUEE = [
    { value: '−87 %', label: 'd\'incidents graves' },
    { value: '90 s', label: 'pour déclarer un accident' },
    { value: '21', label: 'modules métier HSE' },
    { value: 'ISO 45001', label: 'conformité native' },
    { value: '24/7', label: 'support francophone' },
    { value: '6 sites', label: 'mesurés sur 18 mois' },
];

// ═══════════════════════════════════════════════════════════════════════
// HERO VISUAL
// ═══════════════════════════════════════════════════════════════════════

function HeroVisual() {
    return (
        <div className="relative" style={{ animation: 'float-y 6s ease-in-out infinite' }}>
            <div
                className="relative rounded-3xl p-7 bg-white"
                style={{
                    border: `2px solid ${C.greenSoft}`,
                    boxShadow: `0 30px 80px -20px ${C.dark}25, 0 0 60px ${C.greenLight}15`,
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <span className="relative flex w-2.5 h-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: C.green }} />
                        </span>
                        <span className="text-[10.5px] uppercase tracking-[0.14em] font-bold" style={{ color: C.green }}>
                            En direct
                        </span>
                    </div>
                    <IconBolt size={15} style={{ color: C.green }} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3.5 rounded-xl" style={{ background: C.greenBg, border: `1.5px solid ${C.greenSoft}` }}>
                        <div className="text-[10px] uppercase tracking-[0.12em] mb-1.5 font-bold" style={{ color: C.green }}>LTIFR</div>
                        <div className="flex items-baseline gap-1.5">
                            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 26, color: C.green, letterSpacing: '-0.02em' }}>
                                2.4
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">↓ 18%</span>
                        </div>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ background: '#F0F9FF', border: '1.5px solid #7DD3FC' }}>
                        <div className="text-[10px] uppercase tracking-[0.12em] mb-1.5 font-bold" style={{ color: '#0369A1' }}>Conformité</div>
                        <div className="flex items-baseline gap-1.5">
                            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 26, color: '#0369A1', letterSpacing: '-0.02em' }}>
                                98.7
                            </span>
                            <span className="text-sm text-sky-700">%</span>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-semibold text-slate-700">Tendance 30 j</span>
                        <span className="text-[9.5px] font-bold" style={{ color: C.green }}>↓ baisse continue</span>
                    </div>
                    <Sparkline />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    {[
                        { icon: IconBellRinging, label: 'SOS · Galerie Nord', time: '5 min', color: C.emergency, bg: '#FEF2F2' },
                        { icon: IconClipboardCheck, label: 'Audit clôturé · ISO 19011', time: '2 h', color: C.green, bg: C.greenBg },
                    ].map((it, i) => {
                        const Icon = it.icon;
                        return (
                            <div key={i} className="flex items-center gap-2.5">
                                <span
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: it.bg, border: `1.5px solid ${it.color}30` }}
                                >
                                    <Icon size={13} style={{ color: it.color }} stroke={2} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] text-slate-900 truncate font-semibold">{it.label}</div>
                                </div>
                                <span className="text-[10.5px] text-slate-500 whitespace-nowrap font-medium">{it.time}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div
                className="absolute -bottom-6 -left-8 rounded-xl p-3.5 bg-white hidden md:block"
                style={{
                    border: `2px solid ${C.greenSoft}`,
                    boxShadow: `0 20px 50px -10px ${C.green}30`,
                    animation: 'float-y 5s ease-in-out infinite reverse',
                }}
            >
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.green }}>
                        <IconCheck size={16} className="text-white" stroke={3} />
                    </span>
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: C.green }}>ISO conforme</div>
                        <div className="text-[11px] text-slate-900 font-semibold">98.7% des modules</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Sparkline() {
    const values = [42, 38, 45, 32, 28, 24, 22, 18, 15, 19, 14, 12];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    const W = 260;
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
                <linearGradient id="hero-spark-v6" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={C.greenLight} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={C.greenLight} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`0,${H} ${points} ${W},${H}`} fill="url(#hero-spark-v6)" />
            <polyline points={points} fill="none" stroke={C.green} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={W} cy={lastY} r="4" fill={C.green}>
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// CLIENTS MARQUEE
// ═══════════════════════════════════════════════════════════════════════

/** Emblème de marque : forme + dégradé + monogramme, façon vrai logo. */
function ClientEmblem({ client }: { client: ClientLogo }) {
    const shapeStyle: React.CSSProperties =
        client.shape === 'circle' ? { borderRadius: '9999px' }
        : client.shape === 'squircle' ? { borderRadius: '13px' }
        : client.shape === 'hexagon' ? { clipPath: 'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)' }
        : client.shape === 'shield' ? { borderRadius: '10px 10px 50% 50% / 12px 12px 46% 46%' }
        : { borderRadius: '10px', transform: 'rotate(45deg)' }; // diamond

    return (
        <div
            className="w-11 h-11 flex items-center justify-center flex-shrink-0"
            style={{
                ...shapeStyle,
                background: `linear-gradient(140deg, ${client.from} 0%, ${client.to} 100%)`,
                boxShadow: `0 6px 14px -6px ${client.to}66, inset 0 1px 0 rgba(255,255,255,0.35)`,
            }}
            aria-hidden="true"
        >
            <span
                className="text-white text-[15px] font-bold select-none"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    letterSpacing: '-0.02em',
                    textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                    transform: client.shape === 'diamond' ? 'rotate(-45deg)' : undefined,
                }}
            >
                {client.initials}
            </span>
        </div>
    );
}

function ClientsMarquee() {
    const items = [...CLIENTS, ...CLIENTS];
    return (
        <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to right, #FAF9F5, transparent)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, #FAF9F5, transparent)' }} />
            <div className="flex gap-14 items-center" style={{ animation: 'marquee 35s linear infinite', width: 'max-content' }}>
                {items.map((client, i) => (
                    <div key={i} className="flex items-center gap-3 whitespace-nowrap">
                        <ClientEmblem client={client} />
                        <div className="leading-tight">
                            <p
                                className="text-[14.5px] font-bold tracking-tight text-slate-800"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                {client.name}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
                                {client.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// GALERIE ALBUM PHOTO (inspiration kutunga.org)
// ═══════════════════════════════════════════════════════════════════════

interface GalleryItem {
    label: string;
    title: string;
    description: string;
    color: string;
    bg: string;
    aspect: 'wide' | 'tall' | 'square';
    Preview: React.ComponentType;
}

const GALLERY: GalleryItem[] = [
    {
        label: 'Tableau de bord',
        title: 'Une vue d\'ensemble qui parle',
        description: 'KPI en temps réel, incidents classés par catégorie, conformité ISO sous les yeux. Voilà ce que le préventeur consulte en arrivant le matin, café à la main.',
        color: C.green,
        bg: C.greenBg,
        aspect: 'wide',
        // LOT — capture reelle de la page d'accueil SafeX 360
        Preview: () => <RealCapture src="/screenshots/dashboard.png" alt="Tableau de bord SafeX 360 avec les applications HSE" />,
    },
    {
        label: 'SOS déclenché',
        title: 'L\'alerte qui sauve',
        description: 'Un seul clic. La position GPS part. L\'escalade s\'enclenche. L\'équipe HSE sait où aller, sans hésiter.',
        color: C.emergency,
        bg: '#FEF2F2',
        aspect: 'tall',
        // LOT — capture reelle d'une alerte SOS declencheee
        Preview: () => <RealCapture src="/screenshots/alerte-declenchee.png" alt="Alerte SOS déclenchée sur SafeX 360" />,
    },
    {
        label: 'App mobile terrain',
        title: 'Déclaration en 90 secondes',
        description: 'Au fond, hors-réseau, ça marche quand même. Le GPS s\'active, la photo se prend. Le chef de poste a fini sa déclaration en moins de deux minutes.',
        color: C.dark,
        bg: '#F8FAFC',
        aspect: 'tall',
        // ⚠️ NE PAS REMPLACER : mockup smartphone — l'utilisateur a explicitement demande de le garder
        Preview: PreviewMobile,
    },
    {
        label: 'Alerte générale',
        title: 'L\'évacuation, sans panique',
        description: 'L\'alerte générale part, l\'annonce vocale se déclenche, la carte des évacués s\'affiche au point de rassemblement. Tout le monde est compté.',
        color: C.emergency,
        bg: '#FEF2F2',
        aspect: 'wide',
        // LOT — capture reelle de l'ecran Alerte Generale
        Preview: () => <RealCapture src="/screenshots/alerte-generale.png" alt="Module Alerte Générale SafeX 360" />,
    },
    {
        label: 'Déclaration incident',
        title: 'Un formulaire qui n\'oublie rien',
        description: 'Type d\'événement, gravité, témoins, EPI portés, photos, plan d\'actions. Tout est noté, daté, prêt pour l\'investigation ISO 45001.',
        color: C.blasting,
        bg: '#FFF7ED',
        aspect: 'square',
        // LOT — capture reelle du formulaire de declaration d'incident
        Preview: () => <RealCapture src="/screenshots/formulaire-incident.png" alt="Formulaire de déclaration d'incident SafeX 360" />,
    },
    {
        label: 'Non-conformité & Near-miss',
        title: 'Tous les constats au même endroit',
        description: 'On repère tôt, on classe selon la norme ISO, on agit, on mesure. Petit à petit, une vraie culture HSE prend racine sur le site.',
        color: C.audit,
        bg: '#F3E8FF',
        aspect: 'square',
        // LOT — capture reelle du module Non-Conformite & Near-Miss
        Preview: () => <RealCapture src="/screenshots/non-conformite.png" alt="Module Non-Conformité & Near-Miss SafeX 360" />,
    },
];

function GalleryAlbum({ onOpen }: { onOpen?: (idx: number) => void }) {
    return (
        <div className="space-y-8">
            {/* Ligne 1 : grand wide + 2 tall */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Reveal className="lg:col-span-2"><GalleryCard item={GALLERY[0]} onOpen={() => onOpen?.(0)} /></Reveal>
                <Reveal delay={120}><GalleryCard item={GALLERY[1]} onOpen={() => onOpen?.(1)} /></Reveal>
            </div>

            {/* Ligne 2 : tall + wide */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Reveal><GalleryCard item={GALLERY[2]} onOpen={() => onOpen?.(2)} /></Reveal>
                <Reveal delay={120} className="lg:col-span-2"><GalleryCard item={GALLERY[3]} onOpen={() => onOpen?.(3)} /></Reveal>
            </div>

            {/* Ligne 3 : 2 squares */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Reveal><GalleryCard item={GALLERY[4]} onOpen={() => onOpen?.(4)} /></Reveal>
                <Reveal delay={120}><GalleryCard item={GALLERY[5]} onOpen={() => onOpen?.(5)} /></Reveal>
            </div>
        </div>
    );
}

function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen?: () => void }) {
    const Preview = item.Preview;
    const aspectClass =
        item.aspect === 'wide' ? 'aspect-[16/9]' :
        item.aspect === 'tall' ? 'aspect-[3/4]' : 'aspect-[4/3]';

    return (
        <div className="group h-full">
            <button
                type="button"
                onClick={onOpen}
                className={`${aspectClass} relative rounded-3xl overflow-hidden mb-5 transition-all hover:-translate-y-1 w-full cursor-pointer block`}
                style={{
                    background: item.bg,
                    border: `2px solid ${item.color}25`,
                    boxShadow: `0 20px 60px -15px ${item.color}30`,
                }}
                aria-label={`Voir en grand : ${item.title}`}
            >
                <Preview />

                {/* Overlay au hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: `${item.color}15` }}
                >
                    <div
                        className="px-4 py-2 rounded-full bg-white flex items-center gap-2 text-[12.5px] font-bold shadow-xl"
                        style={{ color: item.color }}
                    >
                        Voir en grand
                        <IconArrowUpRight size={14} stroke={2.5} />
                    </div>
                </div>

                {/* Label en haut à gauche */}
                <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10.5px] uppercase tracking-[0.16em] font-bold"
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        color: item.color,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {item.label}
                </div>
            </button>

            {/* Caption sous l'image */}
            <div className="px-2 text-left">
                <h3
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: 22,
                        letterSpacing: '-0.018em',
                        color: C.dark,
                        marginBottom: 8,
                    }}
                >
                    {item.title}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#475569' }}>
                    {item.description}
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// PREVIEWS — petites maquettes par module
// ═══════════════════════════════════════════════════════════════════════

/**
 * RealCapture — Affiche une vraie capture d'ecran de l'application SafeX 360.
 * Les images sont servies depuis Frontend/public/screenshots/ (copiees depuis C:\MineXpert\SafeX\imgs).
 *
 * On utilise object-cover pour cadrer proprement, et un leger gradient de
 * couleur en bas pour assurer la lisibilite du badge "label" en haut.
 */
function RealCapture({ src, alt }: { src: string; alt: string }) {
    return (
        <>
            <img
                src={src}
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
            />
            {/* Voile subtil tout en bas pour adoucir la coupe sur les ecrans tres clairs */}
            <div
                className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.05) 0%, transparent 100%)' }}
            />
        </>
    );
}

function PreviewDashboard() {
    return (
        <div className="absolute inset-0 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-[9.5px] uppercase tracking-[0.14em] text-slate-500 font-bold">SAFEX 360 / TDB</div>
                    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 17, color: C.dark }}>
                        Tableau de bord HSE
                    </div>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ background: C.greenBg, color: C.green }}>
                    ● Toutes mines
                </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                    { label: 'Incidents', val: '847', col: C.emergency },
                    { label: 'LTIFR', val: '2.4', col: C.green },
                    { label: 'Audits', val: '23/30', col: C.audit },
                    { label: 'ISO', val: '98.7%', col: C.inspection },
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">{k.label}</div>
                        <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 18, color: k.col }}>
                            {k.val}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg p-3 border border-slate-200 flex-1">
                <div className="text-[10px] font-bold text-slate-700 mb-2">Incidents par catégorie</div>
                <div className="flex items-end gap-2 h-[80%]">
                    {[
                        { v: 240, col: C.emergency, l: 'Chute' },
                        { v: 180, col: C.blasting, l: 'Mach.' },
                        { v: 130, col: '#CA8A04', l: 'Chim.' },
                        { v: 95, col: C.audit, l: 'Élect.' },
                        { v: 142, col: C.inspection, l: 'Quasi.' },
                        { v: 60, col: '#64748B', l: 'Autre' },
                    ].map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                            <div className="w-full rounded-t transition-all" style={{
                                height: `${(d.v / 240) * 75}%`,
                                background: `linear-gradient(to top, ${d.col}50, ${d.col})`,
                            }} />
                            <span className="text-[8px] text-slate-600 font-bold">{d.l}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PreviewSos() {
    return (
        <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center">
                <div
                    className="w-32 h-32 mx-auto mb-5 rounded-full flex items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, ${C.emergency} 0%, #B91C1C 100%)`,
                        boxShadow: `0 0 60px ${C.emergency}50, 0 0 0 12px ${C.emergency}15`,
                        animation: 'pulse-sos 1.5s ease-in-out infinite',
                    }}
                >
                    <IconBellRinging size={56} className="text-white" stroke={1.8} />
                </div>
                <div
                    className="text-[11px] uppercase tracking-[0.22em] font-bold mb-2"
                    style={{ color: C.emergency }}
                >
                    SOS reçu · à l'instant
                </div>
                <div className="text-[15px] font-bold mb-1" style={{ color: C.dark }}>
                    Galerie Nord · −120 m
                </div>
                <div className="text-[12px] text-slate-600 font-medium mb-4">
                    Mamadou Diallo · Chef de poste
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border-2 text-[11px] font-bold"
                    style={{ borderColor: C.emergency, color: C.emergency }}
                >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.emergency }} />
                    Intervention en cours
                </div>
            </div>
        </div>
    );
}

function PreviewMobile() {
    return (
        <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="relative" style={{ width: 180, height: 360 }}>
                <div
                    className="absolute inset-0 rounded-[28px] p-1.5"
                    style={{ background: `linear-gradient(180deg, ${C.dark} 0%, #1E293B 100%)`, boxShadow: `0 20px 50px -10px ${C.dark}50` }}
                >
                    <div className="w-full h-full rounded-[22px] bg-white overflow-hidden relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-2xl z-10" />
                        <div className="px-3 pt-6 pb-2.5 text-white" style={{ background: C.emergency }}>
                            <div className="flex items-center justify-between text-[9px] font-bold">
                                <IconAlertTriangle size={14} />
                                <span className="uppercase tracking-wider">Déclarer</span>
                                <span>14:23</span>
                            </div>
                        </div>
                        <div className="p-3 space-y-2.5">
                            <div className="grid grid-cols-2 gap-1.5">
                                {['Accident', 'Quasi', 'Maladie', 'Dommage'].map((t, i) => (
                                    <div key={i} className={`text-[9px] py-1.5 rounded text-center font-bold ${
                                        i === 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
                                    }`}>
                                        {t}
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                                <div className="text-[8px] uppercase font-bold text-slate-600">Localisation</div>
                                <div className="text-[10px] font-bold text-slate-900">Galerie Nord · −120 m</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-1.5 text-[8.5px] text-slate-700 min-h-[36px]">
                                Chute de matériel près du convoyeur. Pas de blessé.
                            </div>
                            <button className="w-full text-white text-[10px] font-bold py-2 rounded-lg" style={{ background: C.emergency }}>
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PreviewEvacuation() {
    return (
        <div className="absolute inset-0 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.emergency }}>
                    <IconRun size={26} className="text-white" stroke={1.8} />
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: C.emergency }}>
                        ÉVACUATION GÉNÉRALE
                    </div>
                    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 17, color: C.dark }}>
                        Site complet · En cours
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                    { label: 'Évacués', val: '247', col: C.green, total: '/247' },
                    { label: 'En route', val: '12', col: C.blasting },
                    { label: 'Non répondu', val: '0', col: C.dark },
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-slate-200">
                        <div className="text-[8.5px] uppercase tracking-wider text-slate-500 font-bold mb-1">{k.label}</div>
                        <div className="flex items-baseline gap-0.5">
                            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 22, color: k.col }}>
                                {k.val}
                            </span>
                            {k.total && <span className="text-[10px] text-slate-500 font-bold">{k.total}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200 flex-1">
                <div className="text-[10px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>Points de rassemblement</span>
                    <span className="text-[9px]" style={{ color: C.green }}>● Tous OK</span>
                </div>
                <div className="space-y-1.5">
                    {[
                        { label: 'PR1 · Entrée principale', count: '89', status: 'ok' },
                        { label: 'PR2 · Atelier maintenance', count: '64', status: 'ok' },
                        { label: 'PR3 · Bâtiment admin', count: '94', status: 'ok' },
                    ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
                                <span className="text-[10px] font-bold text-slate-900">{p.label}</span>
                            </div>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: C.green }}>{p.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PreviewBlasting() {
    return (
        <div className="absolute inset-0 p-5 flex flex-col">
            <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.14em] font-bold mb-1" style={{ color: C.blasting }}>
                    Tir prévu · J−1
                </div>
                <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 18, color: C.dark }}>
                    Front Nord · 14h30
                </div>
            </div>

            <div className="space-y-2 flex-1">
                {[
                    { step: '1. Permis foreur', status: 'OK', col: C.green },
                    { step: '2. Inspection contrôleur', status: 'OK', col: C.green },
                    { step: '3. Validation responsable site', status: 'En cours', col: C.blasting },
                    { step: '4. Notification équipes', status: 'En attente', col: '#94A3B8' },
                    { step: '5. Périmètre sécurité 300m', status: 'En attente', col: '#94A3B8' },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.col }} />
                        <span className="text-[11px] font-semibold flex-1" style={{ color: C.dark }}>{s.step}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ background: s.col + '15', color: s.col }}>
                            {s.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PreviewAudits() {
    return (
        <div className="absolute inset-0 p-5 flex flex-col">
            <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.14em] font-bold mb-1" style={{ color: C.audit }}>
                    Programme annuel
                </div>
                <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 18, color: C.dark }}>
                    Calendrier 2026
                </div>
            </div>

            <div className="grid grid-cols-12 gap-px bg-slate-200 rounded-lg overflow-hidden mb-3">
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => {
                    const count = [3, 4, 2, 5, 3, 6, 0, 1, 4, 5, 3, 2][i];
                    const intensity = Math.min(count / 6, 1);
                    return (
                        <div key={i} className="bg-white flex flex-col items-center justify-center py-2"
                            style={{ background: count > 0 ? `linear-gradient(180deg, #FFFFFF 0%, ${C.audit}${Math.round(intensity * 40).toString(16)} 100%)` : 'white' }}>
                            <span className="text-[8px] text-slate-700 font-bold">{m}</span>
                            {count > 0 && <span className="text-[9px] mt-0.5 font-bold" style={{ color: C.audit }}>{count}</span>}
                        </div>
                    );
                })}
            </div>

            <div className="space-y-1.5 flex-1">
                {[
                    { title: 'Audit ISO 45001', date: '15 juin', status: 'En cours', col: C.blasting, bg: '#FFF7ED' },
                    { title: 'Audit dynamitage', date: '22 juin', status: 'Planifié', col: C.inspection, bg: '#F0F9FF' },
                    { title: 'Revue ISO 14001', date: '8 juin', status: 'Clôturé', col: C.green, bg: C.greenBg },
                ].map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold truncate" style={{ color: C.dark }}>{a.title}</div>
                            <div className="text-[9px] text-slate-600 font-semibold">{a.date}</div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: a.bg, color: a.col }}>
                            {a.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ISO MEDALLION — Badge médaille premium (style certificat officiel)
// ═══════════════════════════════════════════════════════════════════════

function ISOMedallion({ iso }: { iso: typeof ISO_BADGES[0] }) {
    // ID unique pour eviter collisions defs SVG entre instances
    const uid = `iso-${iso.code}`;
    return (
        <div className="group p-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-400 hover:shadow-2xl hover:-translate-y-1 transition-all h-full">
            {/* Logo officiel de certification ISO (refonte LOT — design type sceau international) */}
            <div className="flex justify-center mb-5">
                <svg width="100" height="100" viewBox="0 0 120 120" className="transition-transform group-hover:scale-110">
                    <defs>
                        {/* Gradient principal (sphere coloree) */}
                        <radialGradient id={`${uid}-globe`} cx="35%" cy="30%" r="75%">
                            <stop offset="0%" stopColor={iso.color} stopOpacity="1" />
                            <stop offset="55%" stopColor={iso.color} stopOpacity="0.95" />
                            <stop offset="100%" stopColor={iso.colorDeep} stopOpacity="1" />
                        </radialGradient>
                        {/* Anneau de sceau exterieur */}
                        <linearGradient id={`${uid}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={iso.colorDeep} />
                            <stop offset="50%" stopColor={iso.color} />
                            <stop offset="100%" stopColor={iso.colorDeep} />
                        </linearGradient>
                        {/* Brillance (highlight) en haut */}
                        <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                        {/* Path circulaire pour texte en arc */}
                        <path id={`${uid}-arc-top`}
                              d="M 25 60 a 35 35 0 0 1 70 0"
                              fill="none" />
                        <path id={`${uid}-arc-bot`}
                              d="M 25 60 a 35 35 0 0 0 70 0"
                              fill="none" />
                    </defs>

                    {/* Halo externe subtil */}
                    <circle cx="60" cy="60" r="56" fill={iso.color} opacity="0.10" />

                    {/* Anneau exterieur du sceau (avec texte en arc autour) */}
                    <circle cx="60" cy="60" r="50"
                            fill="none"
                            stroke={`url(#${uid}-ring)`}
                            strokeWidth="3" />
                    <circle cx="60" cy="60" r="46"
                            fill="none"
                            stroke={iso.colorDeep}
                            strokeWidth="0.5"
                            opacity="0.5" />

                    {/* Texte en arc autour : "INTERNATIONAL STANDARD" haut */}
                    <text fontSize="5.5" fontWeight="700" letterSpacing="2"
                          fill={iso.colorDeep} opacity="0.85">
                        <textPath xlinkHref={`#${uid}-arc-top`} startOffset="50%" textAnchor="middle">
                            INTERNATIONAL  STANDARD
                        </textPath>
                    </text>
                    {/* Texte en arc bas : "CERTIFIED" */}
                    <text fontSize="5.5" fontWeight="700" letterSpacing="3"
                          fill={iso.colorDeep} opacity="0.85">
                        <textPath xlinkHref={`#${uid}-arc-bot`} startOffset="50%" textAnchor="middle">
                            • CERTIFIED •
                        </textPath>
                    </text>

                    {/* Points decoratifs gauche/droite (separateurs typographiques) */}
                    <circle cx="14" cy="60" r="2" fill={iso.color} />
                    <circle cx="106" cy="60" r="2" fill={iso.color} />

                    {/* Sphere centrale (le "globe" coloré) */}
                    <circle cx="60" cy="60" r="38"
                            fill={`url(#${uid}-globe)`} />

                    {/* Maillage longitudes/latitudes du globe (subtil) */}
                    <g opacity="0.20" stroke="white" strokeWidth="0.5" fill="none">
                        <ellipse cx="60" cy="60" rx="38" ry="14" />
                        <ellipse cx="60" cy="60" rx="38" ry="26" />
                        <ellipse cx="60" cy="60" rx="14" ry="38" />
                        <ellipse cx="60" cy="60" rx="26" ry="38" />
                    </g>

                    {/* Bordure blanche inner */}
                    <circle cx="60" cy="60" r="38" fill="none" stroke="white" strokeWidth="2" />

                    {/* Brillance type sphere (top highlight) */}
                    <ellipse cx="60" cy="44" rx="28" ry="14" fill={`url(#${uid}-shine)`} />

                    {/* "ISO" en haut */}
                    <text x="60" y="51" textAnchor="middle"
                          fontSize="10" fontWeight="700"
                          fill="white" letterSpacing="3.5">
                        ISO
                    </text>

                    {/* Ligne separatrice */}
                    <line x1="42" y1="55" x2="78" y2="55"
                          stroke="white" strokeWidth="1" opacity="0.6" />

                    {/* Numero de la norme (le focus) */}
                    <text x="60" y="74" textAnchor="middle"
                          fontSize="20" fontWeight="700"
                          fill="white"
                          fontFamily="'Source Serif 4', Georgia, serif"
                          letterSpacing="-1">
                        {iso.code}
                    </text>

                    {/* Annee en bas */}
                    <text x="60" y="85" textAnchor="middle"
                          fontSize="7" fontWeight="600"
                          fill="white" opacity="0.92"
                          letterSpacing="1.2">
                        :{iso.year}
                    </text>
                </svg>
            </div>

            {/* LOT — Badge couleur a la place du texte plat. Le nom du domaine
                est affiche dans un "pill" avec le fond a la couleur de la norme. */}
            <div className="flex flex-col items-center gap-2">
                {/* Badge principal : pill colore avec le code ISO + domaine */}
                <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                        background: `linear-gradient(135deg, ${iso.color} 0%, ${iso.colorDeep} 100%)`,
                        boxShadow: `0 4px 14px -4px ${iso.color}80, 0 0 0 1px rgba(255,255,255,0.25) inset`,
                    }}
                >
                    <span
                        className="text-white"
                        style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.16em',
                            opacity: 0.95,
                        }}
                    >
                        ISO {iso.code}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/60" aria-hidden="true" />
                    <span
                        className="text-white"
                        style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                        }}
                    >
                        {iso.title}
                    </span>
                </div>
                {/* Petit sous-titre avec annee de la norme, en couleur */}
                <div
                    className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                    style={{ color: iso.color, opacity: 0.85 }}
                >
                    Édition {iso.year}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// BENEFITS DYNAMIC — section éclatante avec animations & comparaisons
// ═══════════════════════════════════════════════════════════════════════

function BenefitsDynamic() {
    return (
        <section
            id="benefits"
            className="relative py-32 px-6 overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${C.dark} 0%, #0F1F2E 30%, ${C.green} 70%, ${C.greenLight} 100%)`,
            }}
        >
            {/* Blobs animés flottants */}
            <div
                className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, #5EEAD4 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    animation: 'blob-1 18s ease-in-out infinite',
                }}
            />
            <div
                className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full opacity-25 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    animation: 'blob-2 22s ease-in-out infinite',
                }}
            />

            {/* Grille décorative subtile */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative max-w-7xl mx-auto">
                <Reveal>
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-3 mb-6">
                            <span aria-hidden="true" className="block h-px w-10 bg-white/50" />
                            <IconTrendingUp size={14} className="text-emerald-200" />
                            <span className="text-[11.5px] uppercase tracking-[0.24em] text-white font-semibold">
                                Mesuré sur 6 sites · 18 mois
                            </span>
                            <span aria-hidden="true" className="block h-px w-10 bg-white/50" />
                        </div>
                        <h2
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(36px, 5.5vw, 72px)',
                                letterSpacing: '-0.03em',
                                lineHeight: 1.02,
                                color: '#FFFFFF',
                                textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                            }}
                        >
                            Ce qui change<br />
                            <span style={{
                                background: 'linear-gradient(120deg, #5EEAD4 0%, #FFFFFF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontStyle: 'italic',
                            }}>
                                vraiment.
                            </span>
                        </h2>
                        <p className="mt-6 text-[17px] leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            Indicateurs avant / après déploiement. Données réelles, audités par les
                            départements HSE des sites clients.
                        </p>
                    </div>
                </Reveal>

                {/* Grid 4 cards avec comparaisons AVANT/APRÈS */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        {
                            value: 42, suffix: '%', prefix: '−',
                            title: 'Accidents (LTIFR)',
                            before: '4.1', after: '2.4',
                            unit: '/ million d\'heures',
                            icon: IconShieldCheck,
                        },
                        {
                            value: 67, suffix: '%', prefix: '−',
                            title: 'Délai traitement',
                            before: '12 j', after: '4 h',
                            unit: 'signalement → clôture',
                            icon: IconClock,
                        },
                        {
                            value: 100, suffix: '%', prefix: '',
                            title: 'Conformité ISO',
                            before: '67 %', after: '100 %',
                            unit: 'audits certifiés',
                            icon: IconCertificate,
                        },
                        {
                            value: 3.2, suffix: '×', prefix: '',
                            title: 'Productivité HSE',
                            before: '40 %', after: '128 %',
                            unit: 'capacité préventeurs',
                            icon: IconTrendingUp,
                        },
                    ].map((b, i) => (
                        <Reveal key={i} delay={i * 120}>
                            <BenefitCardDynamic {...b} index={i} />
                        </Reveal>
                    ))}
                </div>

                {/* Note bas de section */}
                <Reveal delay={500}>
                    <p className="text-center text-[12.5px] text-white/70 mt-10 max-w-2xl mx-auto">
                        Méthodologie : moyennes pondérées sur 6 sites d'extraction en Afrique de l'Ouest,
                        comparaison T0 (déploiement) → T+18 mois. Sources : DUERP, rapports d'audit ISO,
                        registres CSE.
                    </p>
                </Reveal>
            </div>
        </section>
    );
}

function BenefitCardDynamic({
    value, prefix, suffix, title, before, after, unit, icon: Icon, index,
}: {
    value: number; prefix: string; suffix: string; title: string;
    before: string; after: string; unit: string; icon: any; index: number;
}) {
    const decimals = value % 1 !== 0 ? 1 : 0;
    const { ref, val } = useCountUp(value, 1800, decimals);

    return (
        <div
            ref={ref}
            className="relative p-7 rounded-2xl backdrop-blur-md transition-all hover:-translate-y-2 h-full overflow-hidden group"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
                animation: `card-float ${4 + index * 0.5}s ease-in-out infinite`,
            }}
        >
            {/* Décor halo coloré au hover */}
            <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none"
                style={{ background: '#5EEAD4', filter: 'blur(50px)' }}
            />

            {/* Icône */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
                <Icon size={22} className="text-white" stroke={1.8} />
            </div>

            {/* Valeur géante avec gradient */}
            <div className="flex items-baseline gap-0.5 mb-2">
                <span
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: 'clamp(56px, 6vw, 88px)',
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(120deg, #5EEAD4 0%, #FFFFFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1,
                    }}
                >
                    {prefix}{val}
                </span>
                <span className="text-3xl text-teal-100 font-light ml-1">{suffix}</span>
            </div>

            {/* Titre */}
            <div className="text-[14.5px] text-white font-bold mb-4">{title}</div>

            {/* Comparaison avant / après */}
            <div className="pt-4 border-t border-white/20 space-y-2">
                <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-white/60">Avant SafeX</span>
                    <span className="font-bold text-red-200 line-through">{before}</span>
                </div>
                <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-white/60">Après 18 mois</span>
                    <span className="font-bold text-emerald-200">{after}</span>
                </div>
                <div className="text-[10px] text-white/50 mt-2 italic">{unit}</div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ROI CALCULATOR — formulaire interactif HSE
// ═══════════════════════════════════════════════════════════════════════

function ROICalculator({ onContact, onLogin }: { onContact: () => void; onLogin: () => void }) {
    // Inputs avec valeurs par défaut crédibles pour une mine moyenne
    const [employees, setEmployees] = useState(450);
    const [sites, setSites] = useState(2);
    const [ltifr, setLtifr] = useState(4.2);
    const [costPerLti, setCostPerLti] = useState(85000);  // USD par accident avec arrêt
    const [hourlyRate, setHourlyRate] = useState(8500);   // FCFA / heure préventeur senior
    const [auditCostPerYear, setAuditCostPerYear] = useState(35000); // USD audits ISO/an
    const [preventerCount, setPreventerCount] = useState(4);
    const [annualLicenseCost, setAnnualLicenseCost] = useState(28000); // USD coût SafeX estimé

    // Calculs ROI basés sur les benchmarks réels du secteur minier
    const calc = useMemo(() => {
        // Conversion FCFA → USD (1 USD ≈ 600 FCFA)
        const USD_PER_FCFA = 1 / 600;
        const HOURS_PER_YEAR = 1820; // base 35h/sem × 52 sem
        const MILLION_HOURS = (employees * HOURS_PER_YEAR) / 1_000_000;

        // 1. ACCIDENTS — baisse 42% sur 18 mois (benchmark plateforme)
        const ltiPerYear = ltifr * MILLION_HOURS;
        const ltiAvoidedPerYear = ltiPerYear * 0.42;
        const accidentSavingsUSD = ltiAvoidedPerYear * costPerLti;

        // 2. PRODUCTIVITÉ PRÉVENTEURS — 3.2× capacité = 30% temps gagné en admin
        const hoursSavedPerPreventerPerYear = HOURS_PER_YEAR * 0.30;
        const totalHoursSaved = preventerCount * hoursSavedPerPreventerPerYear;
        const productivitySavingsUSD = totalHoursSaved * hourlyRate * USD_PER_FCFA;

        // 3. AUDITS ISO — 35% du coût annuel économisé (workflow automatisé)
        const auditSavingsUSD = auditCostPerYear * 0.35;

        // 4. INCIDENTS NON DÉCLARÉS révélés (estimation conservative : 15% LTI cachés)
        const hiddenIncidentsRevealed = ltiPerYear * 0.15;
        const hiddenIncidentsCostUSD = hiddenIncidentsRevealed * costPerLti * 0.20; // coût moyen évité par anticipation

        // TOTAL
        const totalAnnualSavingsUSD = accidentSavingsUSD + productivitySavingsUSD + auditSavingsUSD + hiddenIncidentsCostUSD;
        const netGainUSD = totalAnnualSavingsUSD - annualLicenseCost;
        const roiPercent = Math.round((netGainUSD / annualLicenseCost) * 100);

        // Payback period (mois)
        const monthlyLicense = annualLicenseCost / 12;
        const monthlySavings = totalAnnualSavingsUSD / 12;
        const paybackMonths = monthlySavings > 0 ? Math.max(1, Math.round(annualLicenseCost / monthlySavings)) : 999;

        // Vies potentiellement préservées (statistique secteur minier : 1 fatalité ≈ 600 LTI)
        const livesPreserved = Math.round(ltiAvoidedPerYear / 600 * 18 / 12 * 10) / 10; // sur 18 mois

        return {
            ltiAvoidedPerYear: ltiAvoidedPerYear.toFixed(1),
            accidentSavingsUSD: Math.round(accidentSavingsUSD),
            productivitySavingsUSD: Math.round(productivitySavingsUSD),
            auditSavingsUSD: Math.round(auditSavingsUSD),
            hiddenIncidentsCostUSD: Math.round(hiddenIncidentsCostUSD),
            totalAnnualSavingsUSD: Math.round(totalAnnualSavingsUSD),
            netGainUSD: Math.round(netGainUSD),
            roiPercent,
            paybackMonths,
            livesPreserved,
        };
    }, [employees, sites, ltifr, costPerLti, hourlyRate, auditCostPerYear, preventerCount, annualLicenseCost]);

    const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

    return (
        <section className="bg-[#FAF9F5] py-28 px-6">
            <div className="max-w-7xl mx-auto">
                <Reveal>
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <SectionEyebrow color={C.green}>Calculateur ROI</SectionEyebrow>
                        <h2
                            className="mt-4"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(32px, 4.5vw, 56px)',
                                letterSpacing: '-0.025em',
                                lineHeight: 1.06,
                                color: C.dark,
                            }}
                        >
                            Combien votre mine{' '}
                            <span style={{
                                background: `linear-gradient(120deg, ${C.green} 0%, ${C.greenLight} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontStyle: 'italic',
                            }}>économiserait</span> ?
                        </h2>
                        <p className="mt-5 text-[16.5px] leading-relaxed" style={{ color: '#475569' }}>
                            Calcul basé sur les benchmarks réels du secteur minier ouest-africain.
                            Ajustez les paramètres ci-dessous selon votre exploitation.
                        </p>
                    </div>
                </Reveal>

                <div className="grid lg:grid-cols-12 gap-7">
                    {/* Inputs — colonne gauche */}
                    <Reveal className="lg:col-span-5">
                        <div className="bg-white rounded-3xl p-7 lg:p-8 border-2 border-slate-200 shadow-xl space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: C.greenBg, border: `1.5px solid ${C.greenSoft}` }}
                                >
                                    <IconBuildingFactory size={18} style={{ color: C.green }} stroke={1.8} />
                                </div>
                                <h3
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 19,
                                        color: C.dark,
                                    }}
                                >
                                    Votre exploitation
                                </h3>
                            </div>

                            <RoiSlider
                                label="Nombre d'employés"
                                value={employees}
                                min={50} max={5000} step={50}
                                onChange={setEmployees}
                                suffix="personnes"
                            />
                            <RoiSlider
                                label="Nombre de sites"
                                value={sites}
                                min={1} max={20} step={1}
                                onChange={setSites}
                                suffix="sites"
                            />
                            <RoiSlider
                                label="LTIFR actuel (taux fréquence accidents)"
                                value={ltifr}
                                min={0.5} max={15} step={0.1}
                                onChange={setLtifr}
                                suffix="/ million d'heures"
                                decimals={1}
                                help="Moyenne sectorielle minière Afrique de l'Ouest : 3 à 6"
                            />
                            <RoiSlider
                                label="Coût moyen d'un accident avec arrêt (LTI)"
                                value={costPerLti}
                                min={10000} max={500000} step={5000}
                                onChange={setCostPerLti}
                                suffix="USD"
                                help="Direct + indirect (soins, arrêt, expertise, image)"
                            />
                            <RoiSlider
                                label="Nombre de préventeurs HSE"
                                value={preventerCount}
                                min={1} max={30} step={1}
                                onChange={setPreventerCount}
                                suffix="préventeurs"
                            />
                            <RoiSlider
                                label="Coût annuel des audits ISO externes"
                                value={auditCostPerYear}
                                min={5000} max={200000} step={2500}
                                onChange={setAuditCostPerYear}
                                suffix="USD"
                            />

                            <details className="pt-3 border-t border-slate-100">
                                <summary className="cursor-pointer text-[12.5px] font-bold text-slate-700 hover:text-slate-900">
                                    Paramètres avancés
                                </summary>
                                <div className="mt-4 space-y-4">
                                    <RoiSlider
                                        label="Salaire horaire préventeur senior"
                                        value={hourlyRate}
                                        min={2000} max={20000} step={500}
                                        onChange={setHourlyRate}
                                        suffix="FCFA / heure"
                                    />
                                    <RoiSlider
                                        label="Coût annuel SafeX 360 (estimé)"
                                        value={annualLicenseCost}
                                        min={5000} max={150000} step={1000}
                                        onChange={setAnnualLicenseCost}
                                        suffix="USD / an"
                                        help="Tarif indicatif - devis sur demande"
                                    />
                                </div>
                            </details>
                        </div>
                    </Reveal>

                    {/* Résultats — colonne droite */}
                    <Reveal className="lg:col-span-7" delay={150}>
                        <div className="lg:sticky lg:top-28 space-y-5">
                            {/* Card principale ROI */}
                            <div
                                className="rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${C.dark} 0%, ${C.green} 100%)`,
                                    boxShadow: `0 30px 70px -20px ${C.dark}50`,
                                }}
                            >
                                <div
                                    className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30 pointer-events-none"
                                    style={{ background: '#5EEAD4', filter: 'blur(60px)' }}
                                />

                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-4">
                                        <IconSparkles size={16} className="text-emerald-200" />
                                        <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-200 font-bold">
                                            Retour sur investissement annuel
                                        </span>
                                    </div>

                                    <div
                                        className="flex items-baseline gap-1 mb-3"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            background: 'linear-gradient(120deg, #5EEAD4 0%, #FFFFFF 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        <span style={{
                                            fontSize: 'clamp(64px, 9vw, 130px)',
                                            letterSpacing: '-0.04em',
                                            lineHeight: 0.95,
                                        }}>
                                            {calc.roiPercent > 0 ? '+' : ''}{fmt(calc.roiPercent)}
                                        </span>
                                        <span style={{ fontSize: 'clamp(32px, 4vw, 56px)', opacity: 0.9 }}>%</span>
                                    </div>

                                    <div className="text-[14.5px] text-white/85 mb-7 max-w-md">
                                        Net gain annuel <strong className="text-white text-[17px]">{fmt(calc.netGainUSD)} USD</strong> après
                                        déduction du coût SafeX 360.
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                                        <div>
                                            <div className="text-[10.5px] uppercase tracking-wider text-white/70 font-bold mb-1.5">
                                                Retour investissement
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 36, color: '#5EEAD4' }}>
                                                    {calc.paybackMonths}
                                                </span>
                                                <span className="text-[14px] text-white/80">mois</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10.5px] uppercase tracking-wider text-white/70 font-bold mb-1.5">
                                                Vies préservées (18 mois)
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 36, color: '#FCA5A5' }}>
                                                    {calc.livesPreserved}
                                                </span>
                                                <span className="text-[12px] text-white/80">estimation</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Détails économies */}
                            <div className="bg-white rounded-3xl p-7 border-2 border-slate-200">
                                <h4
                                    className="mb-5"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 18,
                                        color: C.dark,
                                    }}
                                >
                                    Détail des économies annuelles
                                </h4>

                                <div className="space-y-3">
                                    <SavingsLine
                                        icon={IconShieldCheck}
                                        color={C.green}
                                        label="Accidents évités"
                                        sub={`${calc.ltiAvoidedPerYear} LTI/an évités × coût moyen`}
                                        value={`${fmt(calc.accidentSavingsUSD)} USD`}
                                    />
                                    <SavingsLine
                                        icon={IconTrendingUp}
                                        color={C.inspection}
                                        label="Productivité préventeurs"
                                        sub="30% temps admin gagné → terrain"
                                        value={`${fmt(calc.productivitySavingsUSD)} USD`}
                                    />
                                    <SavingsLine
                                        icon={IconCertificate}
                                        color={C.audit}
                                        label="Audits ISO automatisés"
                                        sub="35% du coût d'audit externe économisé"
                                        value={`${fmt(calc.auditSavingsUSD)} USD`}
                                    />
                                    <SavingsLine
                                        icon={IconAlertTriangle}
                                        color={C.blasting}
                                        label="Incidents cachés révélés"
                                        sub="Quasi-accidents traités avant aggravation"
                                        value={`${fmt(calc.hiddenIncidentsCostUSD)} USD`}
                                    />

                                    <div className="pt-3 mt-3 border-t-2 border-slate-200 flex items-center justify-between">
                                        <div>
                                            <div className="text-[13px] font-bold" style={{ color: C.dark }}>
                                                Total économisé / an
                                            </div>
                                            <div className="text-[11px] text-slate-500">Avant déduction licence</div>
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontWeight: 600,
                                                fontSize: 22,
                                                color: C.green,
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            {fmt(calc.totalAnnualSavingsUSD)} USD
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200">
                                <p className="text-[13px] text-slate-700 mb-4 leading-relaxed">
                                    <strong style={{ color: C.dark }}>Envie d'aller plus loin ?</strong>{' '}
                                    Demandez une étude personnalisée avec nos préventeurs HSE pour affiner
                                    ce ROI avec vos chiffres réels.
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={onContact}
                                        className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[13.5px] font-bold transition-all hover:scale-[1.02]"
                                        style={{
                                            background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
                                            boxShadow: `0 8px 20px -5px ${C.green}55`,
                                        }}
                                    >
                                        <IconMail size={14} />
                                        Demander une étude personnalisée
                                    </button>
                                    <button
                                        onClick={onLogin}
                                        className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13.5px] font-semibold transition-colors"
                                    >
                                        Tester la plateforme
                                        <IconArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function RoiSlider({
    label, value, min, max, step, onChange, suffix, decimals = 0, help,
}: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; suffix: string; decimals?: number; help?: string;
}) {
    const fmt = (n: number) => new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    }).format(n);
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-[12.5px] font-bold text-slate-700">{label}</label>
                <div className="flex items-baseline gap-1">
                    <span
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 17,
                            color: C.green,
                        }}
                    >
                        {fmt(value)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{suffix}</span>
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, ${C.green} 0%, ${C.greenLight} ${percent}%, #E2E8F0 ${percent}%, #E2E8F0 100%)`,
                    accentColor: C.green,
                }}
            />
            {help && <p className="text-[10.5px] text-slate-500 italic mt-1.5">{help}</p>}
        </div>
    );
}

function SavingsLine({ icon: Icon, color, label, sub, value }: {
    icon: any; color: string; label: string; sub: string; value: string;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + '15', border: `1.5px solid ${color}30` }}
            >
                <Icon size={18} style={{ color }} stroke={1.8} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold" style={{ color: C.dark }}>{label}</div>
                <div className="text-[11px] text-slate-500">{sub}</div>
            </div>
            <div
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 600,
                    fontSize: 15,
                    color,
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// CONTACT MODAL — formulaire de demande d'info (envoi email via mailto)
// ═══════════════════════════════════════════════════════════════════════

/**
 * ContactModal — Formulaire de demande de démo / contact commercial.
 *
 * Email destinataire : r.tiegnan@data-univers.com (jamais affiché à l'écran
 * pour éviter le scraping). À la soumission, ouvre le client email de
 * l'utilisateur avec un mailto pré-rempli (sujet + corps formaté).
 *
 * Pourquoi mailto plutôt qu'un endpoint backend ?
 *  - Aucune config SMTP requise côté backend pour cette landing publique
 *  - L'email arrive directement dans la boîte de l'utilisateur (preuve)
 *  - L'email destinataire reste caché du HTML (protection anti-bot)
 *  - Si on veut un endpoint backend ensuite, c'est trivial à ajouter
 */
function ContactModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        site: '',
        message: '',
        consent: false,
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset à l'ouverture
    useEffect(() => {
        if (opened) {
            setSent(false);
            setError(null);
        }
    }, [opened]);

    // ESC pour fermer
    useEffect(() => {
        if (!opened) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [opened, onClose]);

    if (!opened) return null;

    const validate = (): string | null => {
        if (!form.firstName.trim()) return 'Le prénom est requis';
        if (!form.lastName.trim()) return 'Le nom est requis';
        if (!form.email.trim()) return 'L\'email est requis';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email invalide';
        if (!form.message.trim()) return 'Merci de préciser votre demande';
        if (!form.consent) return 'Merci d\'accepter le traitement des données';
        return null;
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError(null);
        setSending(true);

        // Construit l'email — destinataire caché du DOM via concaténation runtime
        const recipient = ['r.tiegnan', '@', 'data-univers.com'].join('');
        const subject = `[SafeX 360] Demande d'information — ${form.company || form.lastName}`;
        const body = [
            `Bonjour,`,
            ``,
            `Une nouvelle demande d'information a été envoyée depuis la landing SafeX 360 :`,
            ``,
            `— Prénom : ${form.firstName}`,
            `— Nom : ${form.lastName}`,
            `— Entreprise : ${form.company || '(non renseigné)'}`,
            `— Email : ${form.email}`,
            `— Téléphone : ${form.phone || '(non renseigné)'}`,
            `— Site / mine : ${form.site || '(non renseigné)'}`,
            ``,
            `Message :`,
            form.message,
            ``,
            `---`,
            `Envoyé le ${new Date().toLocaleString('fr-FR')}`,
            `Consentement RGPD : accepté`,
        ].join('\n');

        const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Petit délai pour donner l'illusion d'un envoi en cours
        await new Promise((r) => setTimeout(r, 500));
        window.location.href = mailto;

        setSending(false);
        setSent(true);
    };

    const update = (k: keyof typeof form) => (e: any) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [k]: val }));
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header avec gradient teal/noir */}
                <div
                    className="p-6 lg:p-7 relative"
                    style={{
                        background: `linear-gradient(135deg, ${C.green} 0%, ${C.dark} 100%)`,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                >
                    <button
                        onClick={onClose}
                        className="cursor-pointer absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                        aria-label="Fermer"
                    >
                        <IconX size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <IconMail size={20} className="text-white" />
                        </span>
                        <span className="text-[11.5px] uppercase tracking-[0.18em] text-white/80 font-bold">
                            Demande d'information
                        </span>
                    </div>

                    <h2
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(22px, 3vw, 30px)',
                            color: 'white',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.15,
                        }}
                    >
                        Parlez à un préventeur HSE
                    </h2>
                    <p className="mt-2 text-[13.5px] text-white/80 leading-relaxed">
                        Réponse sous 24h ouvrées. Pas de commercial — un vrai HSE qui a fait du terrain.
                    </p>
                </div>

                {/* Corps */}
                <div className="p-6 lg:p-7">
                    {sent ? (
                        <SentSuccess email={form.email} />
                    ) : (
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Prénom" required value={form.firstName} onChange={update('firstName')} />
                                <FormField label="Nom" required value={form.lastName} onChange={update('lastName')} />
                            </div>

                            <FormField label="Entreprise / mine" value={form.company} onChange={update('company')} placeholder="ex : Mine d'or de Houndé" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Email professionnel" required type="email" value={form.email} onChange={update('email')} placeholder="prenom.nom@entreprise.com" />
                                <FormField label="Téléphone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+226 ..." />
                            </div>

                            <FormField label="Site / localisation" value={form.site} onChange={update('site')} placeholder="ex : Ouagadougou, Burkina Faso" />

                            <div>
                                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Votre demande <span style={{ color: C.emergency }}>*</span>
                                </label>
                                <textarea
                                    value={form.message}
                                    onChange={update('message')}
                                    placeholder="Parlez-nous de votre besoin : nombre de sites, modules prioritaires, calendrier souhaité..."
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal-600 transition-colors resize-none"
                                />
                            </div>

                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.consent}
                                    onChange={update('consent')}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 cursor-pointer"
                                    style={{ accentColor: C.green }}
                                />
                                <span className="text-[12px] text-slate-700 leading-relaxed">
                                    J'accepte que mes données soient utilisées pour répondre à ma demande,
                                    conformément à la politique de confidentialité (RGPD).
                                </span>
                            </label>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-[13px] text-red-800">
                                    <IconAlertTriangle size={15} className="flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="cursor-pointer px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13.5px] font-semibold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="cursor-pointer inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-white text-[14px] font-bold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
                                        boxShadow: `0 8px 20px -5px ${C.green}50`,
                                    }}
                                >
                                    {sending ? (
                                        <>
                                            <IconLoader2 size={15} className="animate-spin" />
                                            Préparation…
                                        </>
                                    ) : (
                                        <>
                                            <IconSend size={15} />
                                            Envoyer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function FormField({ label, required, type = 'text', value, onChange, placeholder }: {
    label: string;
    required?: boolean;
    type?: string;
    value: string;
    onChange: (e: any) => void;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {label} {required && <span style={{ color: C.emergency }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-lg text-[14px] focus:outline-none focus:border-teal-600 transition-colors"
            />
        </div>
    );
}

function SentSuccess({ email }: { email: string }) {
    return (
        <div className="py-6 text-center">
            <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                style={{ background: C.greenBg, border: `2px solid ${C.green}` }}
            >
                <IconCheck size={32} style={{ color: C.green }} stroke={2.5} />
            </div>
            <h3
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 600,
                    fontSize: 22,
                    color: C.dark,
                    marginBottom: 8,
                }}
            >
                Votre client mail s'est ouvert
            </h3>
            <p className="text-[14px] text-slate-700 max-w-md mx-auto leading-relaxed mb-2">
                Cliquez sur <strong>Envoyer</strong> dans votre client mail pour transmettre votre demande.
            </p>
            <p className="text-[13px] text-slate-500">
                Nous vous répondrons sur <strong className="text-slate-700">{email}</strong> sous 24h ouvrées.
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES GLOBAUX
// ═══════════════════════════════════════════════════════════════════════

function GlobalStyles() {
    return (
        <style>{`
            @keyframes float-y {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-14px); }
            }
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            @keyframes pulse-sos {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
            }
            @keyframes blob-1 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(40px, -50px) scale(1.1); }
                66% { transform: translate(-30px, 40px) scale(0.95); }
            }
            @keyframes blob-2 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(-50px, 40px) scale(1.1); }
                66% { transform: translate(30px, -30px) scale(0.9); }
            }
            @keyframes card-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            /* ═══ HERO CINEMATIC — Animations premium ═══ */
            /* Ken Burns : zoom subtil + pan tres lent pour effet cinema.
             * Amplitude reduite (max scale 1.08) pour ne pas couper les sujets
             * (visages, EPI) hors du cadre 16/9. */
            @keyframes ken-burns-1 {
                0% { transform: scale(1.02); }
                100% { transform: scale(1.08); }
            }
            @keyframes ken-burns-2 {
                0% { transform: scale(1.03); }
                100% { transform: scale(1.09); }
            }
            @keyframes ken-burns-3 {
                0% { transform: scale(1.02); }
                100% { transform: scale(1.07); }
            }
            /* Balayage de lumiere diagonal au changement de slide */
            @keyframes hero-sweep {
                0% { transform: translateX(-110%) skewX(-12deg); opacity: 0; }
                40% { opacity: 0.55; }
                100% { transform: translateX(110%) skewX(-12deg); opacity: 0; }
            }
            /* Fade-in raffine pour le contenu texte du hero */
            @keyframes hero-reveal-up {
                0% { opacity: 0; transform: translateY(28px); filter: blur(8px); }
                100% { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes hero-glow-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(15, 118, 110, 0.0); }
                50% { box-shadow: 0 0 40px 8px rgba(15, 118, 110, 0.45); }
            }
            /* Indicateur de progression du slide actif */
            @keyframes hero-progress {
                0% { transform: scaleX(0); }
                100% { transform: scaleX(1); }
            }
            /* Scrolling caption text reveal */
            @keyframes hero-caption-slide {
                0% { opacity: 0; transform: translateX(-20px); }
                100% { opacity: 1; transform: translateX(0); }
            }
            /* Particle dust drift */
            @keyframes dust-drift {
                0% { transform: translate(0, 0) scale(1); opacity: 0; }
                10% { opacity: 0.6; }
                100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
            }
            /* Slider thumb style */
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #0F766E;
                border: 3px solid white;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(15, 118, 110, 0.4);
                transition: transform 0.1s;
            }
            input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.15);
            }
            input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #0F766E;
                border: 3px solid white;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(15, 118, 110, 0.4);
            }
        `}</style>
    );
}
