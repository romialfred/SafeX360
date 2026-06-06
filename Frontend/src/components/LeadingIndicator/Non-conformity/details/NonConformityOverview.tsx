import {
    IconMapPin,
    IconSettings2,
    IconUser,
    IconCalendarEvent,
    IconRadar,
    IconUsers,
    IconCategory,
} from '@tabler/icons-react';
import { formatDateShort } from '../../../../utility/DateFormats';
import SafeHtml from '../../../UtilityComp/SafeHtml';

/**
 * NonConformityOverview — Synthèse premium d'un constat central (LOT 43b).
 *
 * Architecture :
 *   ┌─────── 2/3 ────────────────────┐ ┌────── 1/3 ──────────┐
 *   │ IDENTIFICATION                  │ │ ÉQUIPE D'ANALYSE     │
 *   │   - Référence | Date détection  │ │   • avatar initiales │
 *   │   - Source    | Localisation    │ │   • nom + rôle       │
 *   │   - Processus | Déclarant       │ │                      │
 *   │                                  │ │ CLASSIFICATION       │
 *   │ DESCRIPTION                      │ │   - Origine          │
 *   │   « ... » (citation serif)       │ │   - Niveau sévérité  │
 *   │                                  │ │                      │
 *   │ IMPACT(S) CONSTATÉS              │ │                      │
 *   │   - liste sobre                  │ │                      │
 *   └─────────────────────────────────┘ └─────────────────────┘
 */

type Member = { id?: number; role?: string; name?: string };

interface Props {
    nonConformity: any;
    empMap: Record<number, { name?: string }>;
    analysis: any;
    locationMap: Record<number, { name?: string }>;
    processMap: Record<number, { name?: string }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers visuels
// ────────────────────────────────────────────────────────────────────────────

const fallback = (val: any): string => (val ? String(val) : '—');

/** Initiales 2 lettres depuis un nom (« Alfred Traoré » → « AT »). */
const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Hash déterministe nom → palette teal/sky/violet/amber pour avatar. */
const AVATAR_TONES = [
    { bg: 'bg-teal-100',    text: 'text-teal-700' },
    { bg: 'bg-sky-100',     text: 'text-sky-700' },
    { bg: 'bg-violet-100',  text: 'text-violet-700' },
    { bg: 'bg-amber-100',   text: 'text-amber-700' },
    { bg: 'bg-rose-100',    text: 'text-rose-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
];

const getAvatarTone = (key: string) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % AVATAR_TONES.length;
    return AVATAR_TONES[Math.abs(h)];
};

// Sévérité — palette HSE (normalisation EN → FR + tone)
const SEVERITY_LABEL_FR: Record<string, string> = {
    'Insignifiante': 'Insignifiante', 'Insignificant': 'Insignifiante',
    'Mineure': 'Mineure',             'Minor': 'Mineure',
    'Modérée': 'Modérée',             'Moderate': 'Modérée',
    'Majeure': 'Majeure',             'Major': 'Majeure',
    'Catastrophique': 'Catastrophique', 'Catastrophic': 'Catastrophique',
};

const SEVERITY_TONE: Record<string, { bg: string; text: string; border: string; level: number }> = {
    'Insignifiante':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', level: 1 },
    'Mineure':         { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    level: 2 },
    'Modérée':         { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   level: 3 },
    'Majeure':         { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  level: 4 },
    'Catastrophique':  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     level: 5 },
};

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

// Palette d'accents par type de section (différenciation visuelle forte)
type Accent = 'sky' | 'teal' | 'orange' | 'violet' | 'amber';

const ACCENT: Record<Accent, { icon: string; iconBg: string }> = {
    sky:     { icon: 'text-sky-600',     iconBg: 'bg-sky-50' },
    teal:    { icon: 'text-teal-600',    iconBg: 'bg-teal-50' },
    orange:  { icon: 'text-orange-600',  iconBg: 'bg-orange-50' },
    violet:  { icon: 'text-violet-600',  iconBg: 'bg-violet-50' },
    amber:   { icon: 'text-amber-600',   iconBg: 'bg-amber-50' },
};

/** En-tête de section avec accent coloré (chaque section a son tone) */
function SectionHeader({
    icon,
    label,
    accent = 'sky',
}: {
    icon: React.ReactNode;
    label: string;
    accent?: Accent;
}) {
    const tone = ACCENT[accent];
    return (
        <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-slate-100">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tone.iconBg} ${tone.icon}`} aria-hidden="true">
                {icon}
            </span>
            <h3
                className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
                {label}
            </h3>
        </div>
    );
}

/**
 * Champ inline : « Label : Valeur » sur la MÊME ligne.
 *
 *   RÉFÉRENCE          NC-2025-002
 *   ────────────────   ─────────────────
 *   DATE DE DÉTECTION  24 juil. 2025
 */
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
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-slate-500 w-[120px] flex-shrink-0">
                {label}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-slate-800 min-w-0 flex-1">
                {icon && <span className="text-slate-400 flex-shrink-0" aria-hidden="true">{icon}</span>}
                <span className="truncate">{value}</span>
            </span>
        </div>
    );
}

/** Membre de l'équipe avec avatar */
function TeamMember({ member, empMap }: { member: Member; empMap: Record<number, { name?: string }> }) {
    const name = member?.id ? empMap[member.id]?.name : member?.name;
    const role = member?.role || 'Membre';
    const tone = getAvatarTone(name || role);
    const initials = getInitials(name);

    return (
        <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-9 h-9 rounded-full ${tone.bg} ${tone.text} flex items-center justify-center text-[12px] font-semibold`}
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {initials}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] text-slate-800 truncate leading-tight">
                    {name || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {role}
                </p>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────

export default function NonConformityOverview({
    nonConformity,
    empMap,
    analysis,
    locationMap,
    processMap,
}: Props) {
    const team: Member[] = Array.isArray(analysis?.team) ? analysis.team : [];

    const severityRaw = nonConformity?.severityLevel || analysis?.severityLevel || '';
    const severityFr = SEVERITY_LABEL_FR[severityRaw] || severityRaw;
    const severityTone = SEVERITY_TONE[severityFr] || {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        level: 0,
    };

    const description: string = nonConformity?.description || '';
    const indirectImpacts: any[] = Array.isArray(nonConformity?.indirectImpacts)
        ? nonConformity.indirectImpacts
        : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── COLONNE PRINCIPALE (2/3) ─────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
                {/* IDENTIFICATION — accent sky (informationnel) */}
                <section className="bg-white border border-slate-200 border-l-[3px] border-l-sky-400 rounded-xl p-5 shadow-sm">
                    <SectionHeader
                        icon={<IconCategory size={15} stroke={1.6} />}
                        label="Identification"
                        accent="sky"
                    />

                    {/* Grille 2 colonnes desktop, 1 colonne mobile — chaque champ inline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <div>
                            <Field
                                label="Référence"
                                value={
                                    <span className="font-mono text-[13px] tracking-tight text-slate-900 font-semibold">
                                        {fallback(nonConformity?.number)}
                                    </span>
                                }
                            />
                            <Field
                                label="Source"
                                value={fallback(nonConformity?.detectionSource)}
                                icon={<IconRadar size={14} stroke={1.6} />}
                            />
                            <Field
                                label="Processus métier"
                                value={fallback(processMap?.[nonConformity?.workProcessId]?.name)}
                                icon={<IconSettings2 size={14} stroke={1.6} />}
                            />
                        </div>
                        <div>
                            <Field
                                label="Date de détection"
                                value={nonConformity?.detectionDate ? formatDateShort(nonConformity.detectionDate) : '—'}
                                icon={<IconCalendarEvent size={14} stroke={1.6} />}
                            />
                            <Field
                                label="Localisation"
                                value={fallback(locationMap?.[nonConformity?.locationId]?.name)}
                                icon={<IconMapPin size={14} stroke={1.6} />}
                            />
                            <Field
                                label="Déclaré par"
                                value={fallback(empMap?.[nonConformity?.reportedBy]?.name)}
                                icon={<IconUser size={14} stroke={1.6} />}
                            />
                        </div>
                    </div>
                </section>

                {/* DESCRIPTION — accent teal (lecture / contenu) */}
                <section className="bg-white border border-slate-200 border-l-[3px] border-l-teal-400 rounded-xl p-5 shadow-sm">
                    <SectionHeader
                        icon={
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M3 12h12M3 18h18" />
                            </svg>
                        }
                        label="Description du constat"
                        accent="teal"
                    />

                    {description ? (
                        <blockquote
                            className="bg-teal-50/40 border-l-2 border-teal-500 rounded-r-md px-5 py-4 text-slate-700 leading-relaxed"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '15px',
                                fontStyle: 'italic',
                            }}
                        >
                            <SafeHtml html={description} />
                        </blockquote>
                    ) : (
                        <p className="text-[13px] text-slate-400 italic">Aucune description renseignée.</p>
                    )}
                </section>

                {/* IMPACT(S) — accent orange (alerte / conséquence) */}
                <section className="bg-white border border-slate-200 border-l-[3px] border-l-orange-400 rounded-xl p-5 shadow-sm">
                    <SectionHeader
                        icon={
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 9v3.75M12 21h.008v.008H12V21zM2.697 16.126c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                            </svg>
                        }
                        label="Impacts constatés"
                        accent="orange"
                    />

                    {indirectImpacts.length > 0 ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {indirectImpacts.map((impact, idx) => {
                                const label = typeof impact === 'string' ? impact : impact?.name || impact?.label || '—';
                                return (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50/70 border border-slate-100"
                                    >
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" aria-hidden="true" />
                                        <span className="text-[13px] text-slate-700">{label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-[13px] text-slate-400 italic">Aucun impact indirect renseigné.</p>
                    )}
                </section>
            </div>

            {/* ─── SIDEBAR (1/3) ────────────────────────────────────────── */}
            <aside className="space-y-6">
                {/* ÉQUIPE D'ANALYSE — accent violet (collaboration) */}
                <section className="bg-white border border-slate-200 border-l-[3px] border-l-violet-400 rounded-xl p-5 shadow-sm">
                    <SectionHeader
                        icon={<IconUsers size={15} stroke={1.6} />}
                        label="Équipe d'analyse"
                        accent="violet"
                    />

                    {team.length > 0 ? (
                        <div className="space-y-4">
                            {team.map((member, idx) => (
                                <TeamMember key={idx} member={member} empMap={empMap} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[12.5px] text-slate-400 italic">Aucun membre désigné.</p>
                    )}
                </section>

                {/* CLASSIFICATION — accent amber (catégorisation) */}
                <section className="bg-white border border-slate-200 border-l-[3px] border-l-amber-400 rounded-xl p-5 shadow-sm">
                    <SectionHeader
                        icon={
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                <path d="M6 6h.008v.008H6V6z" />
                            </svg>
                        }
                        label="Classification"
                        accent="amber"
                    />

                    {/* Fields inline pour cohérence avec Identification */}
                    <div>
                        <Field label="Origine" value={fallback(analysis?.origin)} />

                        <div className="flex items-baseline gap-3 py-2 border-b border-slate-100">
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-slate-500 w-[120px] flex-shrink-0">
                                Sévérité
                            </span>
                            <span className="flex items-center gap-2 text-[13px] flex-1">
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium border ${severityTone.bg} ${severityTone.text} ${severityTone.border}`}
                                >
                                    {severityFr || '—'}
                                </span>
                                {severityTone.level > 0 && (
                                    <div className="flex items-end gap-[3px]" aria-hidden="true">
                                        {[1, 2, 3, 4, 5].map((step) => {
                                            const filled = step <= severityTone.level;
                                            const heights = ['h-1', 'h-1.5', 'h-2', 'h-2.5', 'h-3'];
                                            const colors = ['bg-emerald-400', 'bg-teal-400', 'bg-amber-400', 'bg-orange-500', 'bg-red-500'];
                                            return (
                                                <span
                                                    key={step}
                                                    className={`w-1 rounded-sm ${heights[step - 1]} ${
                                                        filled ? colors[severityTone.level - 1] : 'bg-slate-200'
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </span>
                        </div>

                        {analysis?.priority && (
                            <Field label="Priorité de traitement" value={analysis.priority} />
                        )}
                    </div>
                </section>
            </aside>
        </div>
    );
}
