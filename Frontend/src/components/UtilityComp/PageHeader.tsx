import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight, IconHome } from '@tabler/icons-react';
import SafeXLogoColor from './SafeXLogoColor';

/**
 * PageHeader — En-tête de page unifié SafeX 360 (LOT 43 v7 raffinement).
 *
 *   • Titre serif raffiné (Source Serif 4), taille réduite, color slate-800
 *   • Icône module dans un cube à gradient subtle + ring + shadow
 *   • Option useSafeXLogo : remplace l'icône module par le bouclier officiel
 *   • Breadcrumb compact avec chevron + IconHome
 *
 * Usage :
 *   <PageHeader
 *     breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Module', to: '/x' }]}
 *     icon={<IconShield />}
 *     iconColor="green"
 *     title="Titre principal"
 *     subtitle="Description fonctionnelle de la page"
 *     actions={<Button>Action</Button>}
 *   />
 */

interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface PageHeaderProps {
    breadcrumbs: BreadcrumbItem[];
    icon?: ReactNode;
    iconColor?: 'teal' | 'green' | 'red' | 'orange' | 'yellow' | 'blue' | 'indigo' | 'slate' | 'cyan' | 'pink' | 'amber' | 'violet';
    title: string;
    subtitle?: string;
    badge?: ReactNode;
    actions?: ReactNode;
    /** Si vrai, affiche le bouclier officiel SafeX 360 à la place de l'icône custom. */
    useSafeXLogo?: boolean;
}

// Palette raffinée — gradient subtle + border-l accent + text saturé
const iconColorMap = {
    teal:   { bg: 'bg-gradient-to-br from-teal-50 to-teal-100/40',     border: 'ring-teal-200/70',   text: 'text-teal-700',   accent: 'border-l-teal-500' },
    green:  { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40', border: 'ring-emerald-200/70', text: 'text-emerald-700', accent: 'border-l-emerald-500' },
    red:    { bg: 'bg-gradient-to-br from-red-50 to-red-100/40',       border: 'ring-red-200/70',    text: 'text-red-700',    accent: 'border-l-red-500' },
    orange: { bg: 'bg-gradient-to-br from-orange-50 to-orange-100/40', border: 'ring-orange-200/70', text: 'text-orange-700', accent: 'border-l-orange-500' },
    yellow: { bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100/40', border: 'ring-yellow-200/70', text: 'text-yellow-700', accent: 'border-l-yellow-500' },
    blue:   { bg: 'bg-gradient-to-br from-sky-50 to-sky-100/40',       border: 'ring-sky-200/70',    text: 'text-sky-700',    accent: 'border-l-sky-500' },
    indigo: { bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/40', border: 'ring-indigo-200/70', text: 'text-indigo-700', accent: 'border-l-indigo-500' },
    slate:  { bg: 'bg-gradient-to-br from-slate-50 to-slate-100/40',   border: 'ring-slate-200/70',  text: 'text-slate-700',  accent: 'border-l-slate-500' },
    cyan:   { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/40',     border: 'ring-cyan-200/70',   text: 'text-cyan-700',   accent: 'border-l-cyan-500' },
    pink:   { bg: 'bg-gradient-to-br from-pink-50 to-pink-100/40',     border: 'ring-pink-200/70',   text: 'text-pink-700',   accent: 'border-l-pink-500' },
    amber:  { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/40',   border: 'ring-amber-200/70',  text: 'text-amber-700',  accent: 'border-l-amber-500' },
    violet: { bg: 'bg-gradient-to-br from-violet-50 to-violet-100/40', border: 'ring-violet-200/70', text: 'text-violet-700', accent: 'border-l-violet-500' },
};

const PageHeader = ({
    breadcrumbs,
    icon,
    iconColor = 'teal',
    title,
    subtitle,
    badge,
    actions,
    useSafeXLogo = false,
}: PageHeaderProps) => {
    const colors = iconColorMap[iconColor] || iconColorMap.teal;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-slate-200">
            <div className="flex-1 min-w-0">
                {/* Breadcrumb compact raffiné */}
                <nav className="flex items-center gap-1 text-[11.5px] text-slate-500 mb-2" aria-label="Fil d'Ariane">
                    {breadcrumbs.map((b, i) => {
                        const isLast = i === breadcrumbs.length - 1;
                        const isFirst = i === 0;
                        return (
                            <span key={i} className="inline-flex items-center gap-1">
                                {!isFirst && <IconChevronRight size={11} className="text-slate-300" aria-hidden="true" />}
                                {!isLast && b.to ? (
                                    <Link
                                        to={b.to}
                                        className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
                                    >
                                        {isFirst && <IconHome size={11} stroke={1.6} aria-hidden="true" />}
                                        <span>{b.label}</span>
                                    </Link>
                                ) : (
                                    <span className={isLast ? 'text-teal-700 font-medium' : 'text-slate-500'}>
                                        {isFirst && <IconHome size={11} stroke={1.6} className="inline mr-0.5" aria-hidden="true" />}
                                        {b.label}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </nav>

                {/* Bloc titre : logo/icône + titre serif + subtitle */}
                <div className="flex items-center gap-3">
                    {/* Logo SafeX officiel ou icône module */}
                    {useSafeXLogo ? (
                        <div className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
                            <SafeXLogoColor variant="icon" size={28} />
                        </div>
                    ) : icon ? (
                        <div
                            className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg} ring-1 ${colors.border} shadow-sm border-l-[3px] ${colors.accent}`}
                        >
                            <span className={colors.text}>{icon}</span>
                        </div>
                    ) : null}

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1
                                className="text-slate-800 leading-tight"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontSize: 'clamp(17px, 2vw, 20px)',
                                    fontWeight: 600,
                                    letterSpacing: '-0.015em',
                                }}
                            >
                                {title}
                            </h1>
                            {badge}
                        </div>
                        {subtitle && (
                            <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
