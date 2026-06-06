import {
    IconCoin,
    IconCheck,
    IconPhoto,
    IconFileDescription,
    IconAlertTriangle,
    IconMessage,
} from '@tabler/icons-react';
import { handlePreview } from '../../../../utility/DocumentUtility';
import SafeHtml from '../../../UtilityComp/SafeHtml';

/**
 * NonConformityTreatment — Onglet « Traitement » professionnel (LOT 43b v4).
 *
 * Sections accentuées :
 *   1. Valorisation (4 lignes coût + total)        — accent orange
 *   2. Détails complémentaires (citation)          — accent teal
 *   3. Documents joints (chips)                    — accent sky
 *   4. Impacts indirects / Bénéfices               — accent violet
 *   5. Commentaires (citation)                     — accent amber
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
    EUR: '€',
    USD: '$',
    XOF: 'CFA',
};

const getCurrencySymbol = (currency?: string): string =>
    (currency && CURRENCY_SYMBOLS[currency]) || currency || '';

const formatMoney = (val: any, currency?: string): string => {
    if (val === undefined || val === null || val === '') return '—';
    const symbol = getCurrencySymbol(currency);
    const n = typeof val === 'number' ? val : Number(val);
    if (Number.isNaN(n)) return `${val} ${symbol}`;
    return `${n.toLocaleString('fr-FR')} ${symbol}`.trim();
};

// Design system aligné Synthèse / Analyse
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

function HtmlQuote({ html, tone = 'teal' }: { html: string; tone?: 'teal' | 'amber' }) {
    const colors = {
        teal:  { bg: 'bg-teal-50/40',  border: 'border-teal-500' },
        amber: { bg: 'bg-amber-50/40', border: 'border-amber-500' },
    }[tone];
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

const NonConformityTreatment = ({ nonConformity }: any) => {
    const totalNCValue =
        (nonConformity.materialCost || 0) +
        (nonConformity.laborCost || 0) +
        (nonConformity.adminFees || 0) +
        (nonConformity.expenses || 0);

    const isNearMiss = nonConformity.type === 'NEAR_MISS';
    const currency = nonConformity.currency;

    const labels = {
        valorisationTitle: isNearMiss ? 'Coût de prévention' : 'Valorisation du constat',
        valorisationDescription: isNearMiss
            ? 'Coûts estimés de mise en œuvre des actions préventives'
            : 'Coûts directs liés à la non-conformité',
        materialCost: isNearMiss ? 'Coût équipement / matériel' : 'Coût matériel / équipement',
        laborCost: isNearMiss ? 'Coût formation / personnel' : "Coût main-d'œuvre",
        adminFees: isNearMiss ? 'Frais de communication' : 'Frais administratifs',
        expenses: 'Dépenses diverses',
        totalLabel: isNearMiss ? 'Total prévention' : 'Valeur totale du constat',
        impactsTitle: isNearMiss ? 'Bénéfices préventifs' : 'Impacts indirects',
        impactsDescription: isNearMiss
            ? 'Bénéfices obtenus grâce à la prévention'
            : 'Conséquences non chiffrables financièrement',
        detailsTitle: 'Détails complémentaires',
        docsTitle: 'Documents joints',
        impactsCommentTitle: isNearMiss
            ? 'Commentaire sur les bénéfices préventifs'
            : 'Commentaire sur les impacts indirects',
    };

    const totalBg = isNearMiss
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-orange-50 border-orange-200 text-orange-800';

    return (
        <div className="space-y-6">
            {/* 1. VALORISATION — accent orange (coût) */}
            <Section
                icon={<IconCoin size={15} stroke={1.6} />}
                label={labels.valorisationTitle}
                description={labels.valorisationDescription}
                accent={isNearMiss ? 'teal' : 'orange'}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {[
                        { label: labels.materialCost, value: nonConformity.materialCost },
                        { label: labels.laborCost, value: nonConformity.laborCost },
                        { label: labels.adminFees, value: nonConformity.adminFees },
                        { label: labels.expenses, value: nonConformity.expenses },
                    ].map((row, i) => (
                        <div
                            key={i}
                            className="flex items-baseline justify-between gap-3 py-2 border-b border-slate-100"
                        >
                            <span className="text-[12.5px] text-slate-600">{row.label}</span>
                            <span className="text-[13px] text-slate-800 font-mono font-medium">
                                {formatMoney(row.value, currency)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Total prominent */}
                <div className={`mt-5 px-5 py-4 rounded-lg border ${totalBg} flex items-baseline justify-between`}>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                        {labels.totalLabel}
                    </span>
                    <span
                        className="font-mono"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '22px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {formatMoney(totalNCValue, currency)}
                    </span>
                </div>
            </Section>

            {/* 2. DÉTAILS — accent teal */}
            {nonConformity.details && (
                <Section
                    icon={<IconFileDescription size={15} stroke={1.6} />}
                    label={labels.detailsTitle}
                    description="Informations narratives sur le traitement"
                    accent="teal"
                >
                    <HtmlQuote html={nonConformity.details} tone="teal" />
                </Section>
            )}

            {/* 3. DOCUMENTS — accent sky */}
            {nonConformity.docs && nonConformity.docs.length > 0 && (
                <Section
                    icon={<IconPhoto size={15} stroke={1.6} />}
                    label={labels.docsTitle}
                    description={`${nonConformity.docs.length} document${nonConformity.docs.length > 1 ? 's' : ''} attaché${nonConformity.docs.length > 1 ? 's' : ''}`}
                    accent="sky"
                >
                    <div className="flex flex-wrap gap-2">
                        {nonConformity.docs.map((doc: any) => (
                            <button
                                key={doc.name}
                                type="button"
                                onClick={() => handlePreview(doc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                            >
                                <IconPhoto size={13} stroke={1.6} />
                                {doc.name}
                            </button>
                        ))}
                    </div>
                </Section>
            )}

            {/* 4. IMPACTS INDIRECTS — accent violet */}
            {nonConformity.indirectImpacts && nonConformity.indirectImpacts.length > 0 && (
                <Section
                    icon={<IconAlertTriangle size={15} stroke={1.6} />}
                    label={labels.impactsTitle}
                    description={labels.impactsDescription}
                    accent="violet"
                >
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {nonConformity.indirectImpacts.map((impact: string, idx: number) => (
                            <li
                                key={idx}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-violet-50/40 border border-violet-100"
                            >
                                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-violet-100 text-violet-700 flex-shrink-0">
                                    <IconCheck size={12} stroke={2.4} />
                                </span>
                                <span className="text-[13px] text-slate-700">{impact}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {/* 5. COMMENTAIRES — accent amber */}
            {nonConformity.comments && (
                <Section
                    icon={<IconMessage size={15} stroke={1.6} />}
                    label={labels.impactsCommentTitle}
                    accent="amber"
                >
                    <HtmlQuote html={nonConformity.comments} tone="amber" />
                </Section>
            )}
        </div>
    );
};

export default NonConformityTreatment;
