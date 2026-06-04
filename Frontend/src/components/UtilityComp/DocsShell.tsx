import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    IconSearch,
    IconChevronRight,
    IconChevronDown,
    IconBook2,
    IconCircleCheck,
    IconList,
    IconArrowLeft,
    IconArrowRight,
    IconMenu2,
    IconX,
} from '@tabler/icons-react';
import { TextInput, Badge } from '@mantine/core';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * DocsShell — Layout unifié pour la documentation SafeX 360.
 *
 * Inspiré de GitBook / Stripe Docs / Vercel Docs.
 *
 * Structure :
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │                       Header (breadcrumbs)                   │
 *   ├──────────────┬───────────────────────────────────┬───────────┤
 *   │              │                                   │           │
 *   │   Sidebar    │           Main content            │    TOC    │
 *   │   nav        │           (children)              │  (sticky) │
 *   │ hiérarchique │                                   │           │
 *   │              │                                   │           │
 *   ├──────────────┴───────────────────────────────────┴───────────┤
 *   │                Navigation prev / next                        │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Sur mobile (<lg) :
 *   - Sidebar repliée en drawer ouvrable via icon menu
 *   - TOC cachée (ou collapsible en haut)
 *
 * Usage :
 *   <DocsShell
 *     navigation={NAVIGATION_TREE}
 *     activeId="incidents-declaration"
 *     toc={[{ id: 'intro', label: 'Introduction' }, ...]}
 *     prevPage={{ id: '...', label: '...', to: '...' }}
 *     nextPage={...}
 *   >
 *     <DocSection id="intro" title="Introduction"> ... </DocSection>
 *     ...
 *   </DocsShell>
 */

export interface DocNavSection {
    id: string;
    label: string;
    /** Sous-articles (hiérarchie de 2 niveaux max) */
    items: Array<{
        id: string;
        label: string;
        to: string;
        badge?: string; // ex "Nouveau", "★★★"
    }>;
}

export interface DocTocItem {
    id: string;
    label: string;
    /** Profondeur 1 ou 2 pour les sous-sections */
    level?: 1 | 2;
}

export interface DocPageLink {
    label: string;
    to: string;
    description?: string;
}

interface DocsShellProps {
    navigation: DocNavSection[];
    activeId: string;
    toc?: DocTocItem[];
    /** Breadcrumbs : Accueil > Centre de connaissances > Module > Article */
    breadcrumbs: Array<{ label: string; to?: string }>;
    /** Titre de la page courante (h1) */
    title: string;
    /** Sous-titre / description */
    description?: string;
    /** Badge difficulté */
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    /** Article suivant pour navigation */
    nextPage?: DocPageLink;
    /** Article précédent */
    prevPage?: DocPageLink;
    children: ReactNode;
}

const DIFFICULTY_CONFIG = {
    beginner:     { label: 'Débutant',     stars: '★',   color: 'green'  as const },
    intermediate: { label: 'Intermédiaire', stars: '★★',  color: 'yellow' as const },
    advanced:     { label: 'Avancé',       stars: '★★★', color: 'red'    as const },
};

export default function DocsShell({
    navigation,
    activeId,
    toc,
    breadcrumbs,
    title,
    description,
    difficulty,
    nextPage,
    prevPage,
    children,
}: DocsShellProps) {
    const bp = useBreakpoint();
    const isMobile = bp.isMobile || bp.isTablet;

    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTocId, setActiveTocId] = useState<string | null>(toc?.[0]?.id ?? null);

    // Sections ouvertes par défaut : celle qui contient activeId
    const [openSections, setOpenSections] = useState<Set<string>>(() => {
        const open = new Set<string>();
        for (const sec of navigation) {
            if (sec.items.some((it) => it.id === activeId)) {
                open.add(sec.id);
            }
        }
        // Si aucune match, ouvrir la première section
        if (open.size === 0 && navigation.length > 0) open.add(navigation[0].id);
        return open;
    });

    const toggleSection = (id: string) => {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filtrage recherche (fait sur le client, simple match du label)
    const filteredNavigation = useMemo(() => {
        if (!searchQuery.trim()) return navigation;
        const q = searchQuery.toLowerCase();
        return navigation
            .map((sec) => ({
                ...sec,
                items: sec.items.filter((it) => it.label.toLowerCase().includes(q)),
            }))
            .filter((sec) => sec.items.length > 0 || sec.label.toLowerCase().includes(q));
    }, [navigation, searchQuery]);

    // Scrollspy : observe les sections (id) pour mettre à jour TOC active
    useEffect(() => {
        if (!toc || toc.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveTocId(visible[0].target.id);
                }
            },
            { rootMargin: '-15% 0px -70% 0px' },
        );
        toc.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [toc]);

    // Fermer le drawer mobile quand on change de page
    useEffect(() => {
        setMobileNavOpen(false);
    }, [activeId]);

    return (
        <div className="min-h-screen bg-[#FAF8F3]">

            {/* ═══ Header sticky : breadcrumbs + mobile menu trigger ═══ */}
            <div className="sticky top-0 z-30 bg-[#FAF8F3]/85 backdrop-blur-md border-b border-slate-200">
                <div className="w-full px-4 sm:px-6 lg:px-10 h-12 flex items-center gap-3">

                    {isMobile && (
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(true)}
                            aria-label="Ouvrir la navigation documentation"
                            className="p-1.5 -ml-1.5 rounded-md hover:bg-slate-200/60 transition-colors flex-shrink-0"
                        >
                            <IconMenu2 size={18} className="text-slate-700" aria-hidden="true" />
                        </button>
                    )}

                    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-[12.5px] text-slate-500 min-w-0">
                        {breadcrumbs.map((b, i) => {
                            const isLast = i === breadcrumbs.length - 1;
                            const node = b.to && !isLast ? (
                                <Link to={b.to} className="hover:text-slate-900 transition-colors truncate">{b.label}</Link>
                            ) : (
                                <span className={isLast ? 'text-slate-900 truncate' : 'truncate'}>{b.label}</span>
                            );
                            return (
                                <span key={i} className="inline-flex items-center gap-1.5 min-w-0">
                                    {i > 0 && <IconChevronRight size={11} className="text-slate-400 flex-shrink-0" aria-hidden="true" />}
                                    {node}
                                </span>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_220px] xl:grid-cols-[280px_minmax(0,1fr)_240px] gap-6 lg:gap-8 py-6">

                    {/* ═══ Sidebar gauche : navigation hiérarchique ═══ */}
                    {!isMobile && (
                        <aside className="lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto pr-2">
                            <SidebarContent
                                navigation={filteredNavigation}
                                activeId={activeId}
                                openSections={openSections}
                                toggleSection={toggleSection}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                            />
                        </aside>
                    )}

                    {/* ═══ Contenu principal ═══ */}
                    <main className="min-w-0">
                        {/* Titre + métadonnées */}
                        <header className="mb-8">
                            <h1
                                className="text-slate-900 tracking-tight"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: 'clamp(28px, 3.8vw, 42px)',
                                    letterSpacing: '-0.018em',
                                    lineHeight: 1.1,
                                }}
                            >
                                {title}
                            </h1>
                            {description && (
                                <p className="text-[15px] text-slate-600 mt-3 leading-relaxed max-w-3xl">
                                    {description}
                                </p>
                            )}
                            {difficulty && (
                                <div className="mt-4">
                                    <Badge
                                        size="sm"
                                        variant="light"
                                        color={DIFFICULTY_CONFIG[difficulty].color}
                                        radius="sm"
                                    >
                                        <span className="mr-1">{DIFFICULTY_CONFIG[difficulty].stars}</span>
                                        {DIFFICULTY_CONFIG[difficulty].label}
                                    </Badge>
                                </div>
                            )}
                        </header>

                        {/* Contenu */}
                        <div className="docs-prose">
                            {children}
                        </div>

                        {/* Navigation prev / next */}
                        {(prevPage || nextPage) && (
                            <nav className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Pagination article">
                                {prevPage ? (
                                    <Link
                                        to={prevPage.to}
                                        className="group rounded-lg border border-slate-200 bg-white hover:border-slate-300 p-4 transition-colors"
                                    >
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                                            <IconArrowLeft size={11} aria-hidden="true" />
                                            Précédent
                                        </p>
                                        <p
                                            className="text-slate-900 mt-1.5 group-hover:text-teal-700 transition-colors"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontWeight: 500,
                                                fontSize: '15px',
                                            }}
                                        >
                                            {prevPage.label}
                                        </p>
                                        {prevPage.description && (
                                            <p className="text-[12.5px] text-slate-500 mt-1">{prevPage.description}</p>
                                        )}
                                    </Link>
                                ) : (
                                    <span />
                                )}
                                {nextPage ? (
                                    <Link
                                        to={nextPage.to}
                                        className="group rounded-lg border border-slate-200 bg-white hover:border-slate-300 p-4 transition-colors text-right"
                                    >
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 flex items-center justify-end gap-1.5">
                                            Suivant
                                            <IconArrowRight size={11} aria-hidden="true" />
                                        </p>
                                        <p
                                            className="text-slate-900 mt-1.5 group-hover:text-teal-700 transition-colors"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontWeight: 500,
                                                fontSize: '15px',
                                            }}
                                        >
                                            {nextPage.label}
                                        </p>
                                        {nextPage.description && (
                                            <p className="text-[12.5px] text-slate-500 mt-1">{nextPage.description}</p>
                                        )}
                                    </Link>
                                ) : (
                                    <span />
                                )}
                            </nav>
                        )}
                    </main>

                    {/* ═══ Sidebar droite : TOC sticky ═══ */}
                    {!isMobile && toc && toc.length > 0 && (
                        <aside className="lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-3 flex items-center gap-1.5">
                                <IconList size={11} aria-hidden="true" />
                                Sur cette page
                            </div>
                            <ul className="space-y-1.5 border-l border-slate-200 pl-3">
                                {toc.map((item) => {
                                    const isActive = item.id === activeTocId;
                                    return (
                                        <li key={item.id}>
                                            <a
                                                href={`#${item.id}`}
                                                className={`block text-[12.5px] leading-relaxed transition-colors ${
                                                    item.level === 2 ? 'pl-3 text-slate-500' : 'text-slate-600'
                                                } ${isActive ? 'text-teal-700' : 'hover:text-slate-900'}`}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </aside>
                    )}
                </div>
            </div>

            {/* ═══ Drawer mobile pour la sidebar ═══ */}
            {isMobile && mobileNavOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        aria-label="Fermer la navigation"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <div className="relative w-72 max-w-[80vw] h-full bg-white shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                            <span className="text-[12px] uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                                <IconBook2 size={13} aria-hidden="true" />
                                Documentation
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(false)}
                                aria-label="Fermer la navigation documentation"
                                className="p-1 -mr-1 rounded-md hover:bg-slate-100"
                            >
                                <IconX size={16} className="text-slate-600" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="p-4">
                            <SidebarContent
                                navigation={filteredNavigation}
                                activeId={activeId}
                                openSections={openSections}
                                toggleSection={toggleSection}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SidebarContent — partagé entre desktop sticky et drawer mobile
// ─────────────────────────────────────────────────────────────────────────────
function SidebarContent({
    navigation,
    activeId,
    openSections,
    toggleSection,
    searchQuery,
    setSearchQuery,
}: {
    navigation: DocNavSection[];
    activeId: string;
    openSections: Set<string>;
    toggleSection: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}) {
    return (
        <div className="space-y-3">
            <TextInput
                placeholder="Rechercher…"
                size="sm"
                radius="md"
                leftSection={<IconSearch size={13} className="text-slate-400" aria-hidden="true" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                aria-label="Rechercher dans la documentation"
                styles={{ input: { fontSize: '13px' } }}
            />

            {navigation.length === 0 ? (
                <p className="text-[12.5px] text-slate-500 italic px-2 py-3">
                    Aucun résultat pour « {searchQuery} ».
                </p>
            ) : (
                <nav aria-label="Navigation documentation">
                    {navigation.map((section) => {
                        const isOpen = openSections.has(section.id);
                        return (
                            <div key={section.id} className="mb-1">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.id)}
                                    aria-expanded={isOpen}
                                    aria-controls={`docs-section-${section.id}`}
                                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] uppercase tracking-[0.13em] text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    {isOpen
                                        ? <IconChevronDown size={11} className="text-slate-500" aria-hidden="true" />
                                        : <IconChevronRight size={11} className="text-slate-500" aria-hidden="true" />}
                                    <span className="flex-1 text-left">{section.label}</span>
                                </button>
                                {isOpen && (
                                    <ul id={`docs-section-${section.id}`} className="mt-1 mb-2 space-y-0.5 pl-4">
                                        {section.items.map((item) => {
                                            const isActive = item.id === activeId;
                                            return (
                                                <li key={item.id}>
                                                    <Link
                                                        to={item.to}
                                                        aria-current={isActive ? 'page' : undefined}
                                                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors ${
                                                            isActive
                                                                ? 'bg-teal-50 text-teal-800 border-l-2 border-teal-600'
                                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-transparent'
                                                        }`}
                                                    >
                                                        <span className="flex-1 min-w-0 truncate">{item.label}</span>
                                                        {item.badge && (
                                                            <Badge size="xs" variant="light" color="teal" radius="sm">
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                        {isActive && (
                                                            <IconCircleCheck size={12} className="text-teal-700 flex-shrink-0" aria-hidden="true" />
                                                        )}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DocSection — composant utilitaire pour ancrer les sections (TOC scrollspy)
// ─────────────────────────────────────────────────────────────────────────────
export function DocSection({
    id,
    title,
    children,
    level = 1,
}: {
    id: string;
    title: string;
    children: ReactNode;
    /** 1 = h2 (section), 2 = h3 (sous-section) */
    level?: 1 | 2;
}) {
    // LOT 41 hotfix : remplacer `keyof JSX.IntrinsicElements` (déprécié TS 5.7+
    // qui requiert explicit JSX import) par un rendu conditionnel direct des
    // 2 cas possibles (h2 / h3). Plus simple et zéro dépendance JSX namespace.
    const fontSize = level === 2 ? '20px' : '26px';
    const headingStyle = {
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontWeight: 500,
        fontSize,
        letterSpacing: '-0.012em',
        lineHeight: 1.2,
    } as const;

    return (
        <section id={id} className={level === 2 ? 'mt-8 scroll-mt-20' : 'mt-12 first:mt-0 scroll-mt-20'}>
            {level === 2 ? (
                <h3 className="text-slate-900 group" style={headingStyle}>
                    <a href={`#${id}`} className="hover:text-teal-700 transition-colors no-underline">
                        {title}
                    </a>
                </h3>
            ) : (
                <h2 className="text-slate-900 group" style={headingStyle}>
                    <a href={`#${id}`} className="hover:text-teal-700 transition-colors no-underline">
                        {title}
                    </a>
                </h2>
            )}
            <div className="mt-4 space-y-4 text-[15px] text-slate-700 leading-relaxed">
                {children}
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CodeBlock — composant pour les blocs de code avec copie
// ─────────────────────────────────────────────────────────────────────────────
export function CodeBlock({
    code,
    language,
    title,
}: {
    code: string;
    language?: string;
    title?: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard may be unavailable in some contexts — silent */
        }
    };

    return (
        <div className="my-4 rounded-lg border border-slate-200 overflow-hidden bg-slate-900">
            {(title || language) && (
                <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
                    <span className="text-[11.5px] uppercase tracking-[0.14em] text-slate-300">
                        {title ?? language}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label="Copier le code"
                        className="text-[11.5px] text-slate-300 hover:text-white px-2 py-0.5 rounded transition-colors"
                    >
                        {copied ? 'Copié ✓' : 'Copier'}
                    </button>
                </div>
            )}
            <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-100 font-mono">
                <code>{code}</code>
            </pre>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Callout — encarts d'information (note, warning, tip, danger)
// ─────────────────────────────────────────────────────────────────────────────
export function Callout({
    tone = 'info',
    title,
    children,
}: {
    tone?: 'info' | 'warning' | 'success' | 'danger';
    title?: string;
    children: ReactNode;
}) {
    const config = {
        info:    { bg: 'bg-sky-50',     border: 'border-sky-200',     icon: '💡', text: 'text-sky-900' },
        warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '⚠️', text: 'text-amber-900' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓',  text: 'text-emerald-900' },
        danger:  { bg: 'bg-red-50',     border: 'border-red-200',     icon: '⛔', text: 'text-red-900' },
    }[tone];

    return (
        <aside
            className={`my-5 p-4 rounded-lg border ${config.bg} ${config.border} flex gap-3`}
            role="note"
        >
            <span className="flex-shrink-0 text-base leading-none mt-0.5" aria-hidden="true">{config.icon}</span>
            <div className="min-w-0 flex-1">
                {title && (
                    <p className={`${config.text} mb-1`} style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 500,
                        fontSize: '14px',
                    }}>
                        {title}
                    </p>
                )}
                <div className={`text-[13.5px] ${config.text}/90 leading-relaxed`}>
                    {children}
                </div>
            </div>
        </aside>
    );
}
