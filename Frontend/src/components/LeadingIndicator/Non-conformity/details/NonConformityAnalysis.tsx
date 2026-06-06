import {
    IconTarget,
    IconCalendarEvent,
    IconCalendarTime,
    IconRoute,
    IconArrowGuide,
    IconBulb,
    IconCheck,
} from '@tabler/icons-react';
import { analysisMethodsMap } from '../../../../Data/DropdownData';
import { formatDateShort } from '../../../../utility/DateFormats';
import SafeHtml from '../../../UtilityComp/SafeHtml';

/**
 * NonConformityAnalysis — Onglet « Analyse » professionnel (LOT 43b v4).
 *
 * 5 sections accentuées différemment :
 *   1. Méthodologie         (accent sky)
 *   2. Description          (accent teal)
 *   3. Facteurs contributifs (accent violet — 3 cards colorées)
 *   4. Causes racines       (accent orange)
 *   5. Synthèse exécutive   (accent rose)
 */

// ────────────────────────────────────────────────────────────────────────────
// Helpers + design system
// ────────────────────────────────────────────────────────────────────────────

const fallback = (val: any): string => (val ? String(val) : '—');

type Accent = 'sky' | 'teal' | 'orange' | 'violet' | 'amber' | 'rose';

const ACCENT: Record<Accent, { icon: string; iconBg: string; borderL: string }> = {
    sky:    { icon: 'text-sky-600',    iconBg: 'bg-sky-50',    borderL: 'border-l-sky-400' },
    teal:   { icon: 'text-teal-600',   iconBg: 'bg-teal-50',   borderL: 'border-l-teal-400' },
    orange: { icon: 'text-orange-600', iconBg: 'bg-orange-50', borderL: 'border-l-orange-400' },
    violet: { icon: 'text-violet-600', iconBg: 'bg-violet-50', borderL: 'border-l-violet-400' },
    amber:  { icon: 'text-amber-600',  iconBg: 'bg-amber-50',  borderL: 'border-l-amber-400' },
    rose:   { icon: 'text-rose-600',   iconBg: 'bg-rose-50',   borderL: 'border-l-rose-400' },
};

function Section({
    icon,
    label,
    description,
    accent,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    description?: string;
    accent: Accent;
    children: React.ReactNode;
}) {
    const tone = ACCENT[accent];
    return (
        <section className={`bg-white border border-slate-200 border-l-[3px] ${tone.borderL} rounded-xl p-5 shadow-sm`}>
            <header className="flex items-start gap-2.5 mb-4 pb-2.5 border-b border-slate-100">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tone.iconBg} ${tone.icon} flex-shrink-0`} aria-hidden="true">
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {label}
                    </h3>
                    {description && (
                        <p className="text-[11.5px] text-slate-500 mt-0.5">{description}</p>
                    )}
                </div>
            </header>
            {children}
        </section>
    );
}

/** Champ « Label : Valeur » inline sur la même ligne. */
function Field({
    label,
    value,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-baseline gap-3 py-2 border-b border-slate-100 last:border-0">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-slate-500 w-[140px] flex-shrink-0">
                {label}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-slate-800 min-w-0 flex-1">
                {icon && <span className="text-slate-400 flex-shrink-0" aria-hidden="true">{icon}</span>}
                <span className="truncate">{value}</span>
            </span>
        </div>
    );
}

/** Bloc citation pour contenu HTML (description, résumé, conclusion). */
function Quote({ html, emptyLabel, tone = 'teal' }: { html?: string; emptyLabel: string; tone?: 'teal' | 'rose' | 'amber' }) {
    const colors = {
        teal:  { bg: 'bg-teal-50/40',  border: 'border-teal-500' },
        rose:  { bg: 'bg-rose-50/40',  border: 'border-rose-500' },
        amber: { bg: 'bg-amber-50/40', border: 'border-amber-500' },
    }[tone];

    if (!html || html === '-') {
        return <p className="text-[13px] text-slate-400 italic">{emptyLabel}</p>;
    }
    return (
        <blockquote
            className={`${colors.bg} border-l-2 ${colors.border} rounded-r-md px-5 py-4 text-slate-700 leading-relaxed`}
            style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: '14.5px',
                fontStyle: 'italic',
            }}
        >
            <SafeHtml html={html} />
        </blockquote>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────

const NonConformityAnalysis = ({ analysis }: any) => {
    return (
        <div className="space-y-6">
            {/* 1. MÉTHODOLOGIE — accent sky (cadre, processus) */}
            <Section
                icon={<IconTarget size={15} stroke={1.6} />}
                label="Méthodologie d'analyse"
                description="Démarche utilisée et fenêtre temporelle"
                accent="sky"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                        <Field
                            label="Méthode"
                            value={
                                analysis?.method ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[11.5px] font-medium">
                                        {analysisMethodsMap[analysis.method] || analysis.method}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                )
                            }
                            icon={<IconRoute size={14} stroke={1.6} />}
                        />
                        <Field
                            label="Origine"
                            value={
                                analysis?.origin ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11.5px] font-medium">
                                        {analysis.origin}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                )
                            }
                        />
                    </div>
                    <div>
                        <Field
                            label="Date de début"
                            value={analysis?.startDate ? formatDateShort(analysis.startDate) : '—'}
                            icon={<IconCalendarEvent size={14} stroke={1.6} />}
                        />
                        <Field
                            label="Échéance"
                            value={analysis?.deadline ? formatDateShort(analysis.deadline) : '—'}
                            icon={<IconCalendarTime size={14} stroke={1.6} />}
                        />
                    </div>
                </div>
            </Section>

            {/* 2. DESCRIPTION — accent teal */}
            <Section
                icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M3 12h12M3 18h18" />
                    </svg>
                }
                label="Description analytique"
                accent="teal"
            >
                <Quote html={analysis?.description} emptyLabel="Aucune description fournie." tone="teal" />
            </Section>

            {/* 3. FACTEURS CONTRIBUTIFS — accent violet (3 cards) */}
            <Section
                icon={<IconArrowGuide size={15} stroke={1.6} />}
                label="Facteurs contributifs"
                description="Décomposition selon la triade individuel / technique / organisationnel"
                accent="violet"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Individuels',     value: analysis?.individualFactors,     tone: 'violet' },
                        { label: 'Techniques',      value: analysis?.technicalFactors,      tone: 'sky' },
                        { label: 'Organisationnels', value: analysis?.organizationalFactors, tone: 'amber' },
                    ].map((f, i) => {
                        const colors = {
                            violet: { bg: 'bg-violet-50/60', border: 'border-violet-100', text: 'text-violet-700' },
                            sky:    { bg: 'bg-sky-50/60',    border: 'border-sky-100',    text: 'text-sky-700' },
                            amber:  { bg: 'bg-amber-50/60',  border: 'border-amber-100',  text: 'text-amber-700' },
                        }[f.tone as 'violet' | 'sky' | 'amber'];
                        return (
                            <div key={i} className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                                <p className={`text-[10.5px] font-semibold uppercase tracking-[0.10em] ${colors.text} mb-2`}>
                                    Facteurs {f.label.toLowerCase()}
                                </p>
                                <p className="text-[12.5px] text-slate-700 leading-relaxed">
                                    {fallback(f.value)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* 4. CAUSES RACINES — accent orange */}
            <Section
                icon={<IconBulb size={15} stroke={1.6} />}
                label="Causes racines identifiées"
                description="Causes profondes ayant déclenché le constat"
                accent="orange"
            >
                {Array.isArray(analysis?.rootCauses) && analysis.rootCauses.length > 0 ? (
                    <ul className="space-y-2">
                        {analysis.rootCauses.map((cause: string, idx: number) => (
                            <li
                                key={idx}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-orange-50/30 border border-orange-100"
                            >
                                <span
                                    className="mt-0.5 w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10.5px] font-semibold flex items-center justify-center flex-shrink-0"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                >
                                    {idx + 1}
                                </span>
                                <span className="text-[13px] text-slate-700 leading-relaxed">{cause}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[13px] text-slate-400 italic">Aucune cause racine identifiée.</p>
                )}
            </Section>

            {/* 5. SYNTHÈSE EXÉCUTIVE — accent rose (résumé + conclusion) */}
            <Section
                icon={<IconCheck size={15} stroke={1.8} />}
                label="Synthèse exécutive"
                description="Résumé et conclusion finale de l'analyse"
                accent="rose"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-slate-500 mb-2">
                            Résumé
                        </p>
                        <Quote html={analysis?.summary} emptyLabel="Aucun résumé fourni." tone="rose" />
                    </div>
                    <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-slate-500 mb-2">
                            Conclusion
                        </p>
                        <Quote html={analysis?.conclusion} emptyLabel="Aucune conclusion fournie." tone="rose" />
                    </div>
                </div>
            </Section>
        </div>
    );
};

export default NonConformityAnalysis;
