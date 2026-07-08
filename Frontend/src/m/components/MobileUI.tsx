/**
 * MobileUI — Kit de composants tactiles SafeX 360 Field.
 *
 * Design system mobile dédié (distinct de Mantine/desktop) :
 *   - cibles tactiles >= 44px, retours actifs (scale 0.99)
 *   - fond app #FAF8F3, cards blanches rounded-2xl border-slate-200
 *   - titres Source Serif 4, corps Inter/system
 *   - palette statuts « charte R7 » : violet=attente, cyan=planifié,
 *     amber=en cours, emerald=réalisé, rose=annulé/critique, slate=neutre
 *
 * Tous les écrans mobiles composent EXCLUSIVEMENT ces primitives pour
 * garantir l'homogénéité premium de l'application terrain.
 */

import { ReactNode } from 'react';
import { IconAlertOctagon, IconRefresh, IconChevronRight, IconInbox } from '@tabler/icons-react';

/* ────────────────────────────────────────────────────────────────────
 * Tokens
 * ──────────────────────────────────────────────────────────────────── */

export const SERIF = "'Source Serif 4', Georgia, serif";

/**
 * Aplatit un éventuel HTML riche (éditeur web) en texte sûr pour mobile.
 * DOMParser n'exécute ni script ni handler — pas de risque XSS.
 */
export const toPlainText = (value?: string | null): string => {
    if (!value) return '';
    if (!value.includes('<')) return value;
    return new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '';
};

/**
 * Date ISO (YYYY-MM-DD) en fuseau LOCAL — toISOString() renvoie la date UTC
 * et décale d'un jour les déclarations faites tôt le matin (UTC-5 Canada).
 */
export const toIsoDateLocal = (d: Date = new Date()): string => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
};

/**
 * Datetime ISO locale (YYYY-MM-DDTHH:mm:ss, SANS suffixe Z) pour les champs
 * LocalDateTime du backend — toISOString().slice(0,19) enverrait l'heure UTC
 * qui serait stockée comme heure murale (décalage = offset fuseau).
 */
export const toIsoDateTimeLocal = (d: Date = new Date()): string => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** Tons de chips par famille de statut (charte R7). */
export type ChipTone = 'violet' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'sky' | 'slate' | 'orange' | 'teal';

const CHIP_TONES: Record<ChipTone, string> = {
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

/* ────────────────────────────────────────────────────────────────────
 * MobileButton — bouton principal tactile
 * ──────────────────────────────────────────────────────────────────── */

interface MobileButtonProps {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    /** Couleur d'accent hex pour primary (défaut teal-700). */
    accent?: string;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: ReactNode;
    size?: 'md' | 'lg';
}

export function MobileButton({
    children, onClick, type = 'button', variant = 'primary', accent = '#0F766E',
    loading = false, disabled = false, fullWidth = true, icon, size = 'lg',
}: MobileButtonProps) {
    const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition
        active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
        ${size === 'lg' ? 'text-[14.5px] px-5' : 'text-[13px] px-4'} ${fullWidth ? 'w-full' : ''}`;
    const height = size === 'lg' ? 50 : 42;

    const styles: Record<string, { className: string; style?: React.CSSProperties }> = {
        primary: { className: `${base} text-white shadow-sm`, style: { background: accent, minHeight: height } },
        secondary: { className: `${base} bg-white text-slate-800 border border-slate-300`, style: { minHeight: height } },
        danger: { className: `${base} bg-rose-600 text-white shadow-sm`, style: { minHeight: height } },
        ghost: { className: `${base} bg-transparent text-slate-600`, style: { minHeight: height } },
    };
    const v = styles[variant];

    return (
        <button type={type} onClick={onClick} disabled={disabled || loading} className={v.className} style={v.style}>
            {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />
            ) : icon}
            {children}
        </button>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * MobileChip — étiquette de statut
 * ──────────────────────────────────────────────────────────────────── */

export function MobileChip({ tone = 'slate', children }: { tone?: ChipTone; children: ReactNode }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${CHIP_TONES[tone]}`}>
            {children}
        </span>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * MobileSection — titre de section d'écran
 * ──────────────────────────────────────────────────────────────────── */

export function MobileSection({ title, action, children }: { title: string; action?: ReactNode; children?: ReactNode }) {
    return (
        <section className="px-4 pt-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * MobileCard / MobileListItem — conteneurs de contenu
 * ──────────────────────────────────────────────────────────────────── */

export function MobileCard({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
    const Tag: any = onClick ? 'button' : 'div';
    return (
        <Tag
            {...(onClick ? { type: 'button', onClick } : {})}
            className={`w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm ${onClick ? 'active:scale-[0.99] transition' : ''} ${className}`}
        >
            {children}
        </Tag>
    );
}

interface MobileListItemProps {
    title: string;
    subtitle?: string | null;
    meta?: ReactNode;
    chips?: ReactNode;
    onClick?: () => void;
    leading?: ReactNode;
}

/** Item de liste standard : chips + titre serif + sous-titre + méta, chevron si cliquable. */
export function MobileListItem({ title, subtitle, meta, chips, onClick, leading }: MobileListItemProps) {
    return (
        <MobileCard onClick={onClick}>
            <div className="flex items-start gap-3">
                {leading}
                <div className="min-w-0 flex-1">
                    {chips && <div className="flex items-center gap-1.5 flex-wrap mb-1">{chips}</div>}
                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate" style={{ fontFamily: SERIF }}>
                        {title}
                    </h3>
                    {subtitle && <p className="text-[12.5px] text-slate-600 truncate mt-0.5">{subtitle}</p>}
                    {meta && <div className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-3">{meta}</div>}
                </div>
                {onClick && <IconChevronRight size={18} stroke={1.8} className="text-slate-300 flex-shrink-0 mt-1" />}
            </div>
        </MobileCard>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * MobileKpi — tuile indicateur
 * ──────────────────────────────────────────────────────────────────── */

export function MobileKpi({ label, value, tone = 'teal', icon }: { label: string; value: ReactNode; tone?: ChipTone; icon?: ReactNode }) {
    const toneText: Record<ChipTone, string> = {
        violet: 'text-violet-700', cyan: 'text-cyan-700', amber: 'text-amber-700',
        emerald: 'text-emerald-700', rose: 'text-rose-700', sky: 'text-sky-700',
        orange: 'text-orange-700', teal: 'text-teal-700', slate: 'text-slate-700',
    };
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
            {icon && <div className="flex justify-center mb-1">{icon}</div>}
            <p className={`text-[18px] font-semibold leading-none ${toneText[tone]}`}>{value}</p>
            <p className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * MobileDetailRow — ligne label/valeur des écrans de détail
 * ──────────────────────────────────────────────────────────────────── */

export function MobileDetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
            <span className="text-[12px] text-slate-500 flex-shrink-0 pt-px">{label}</span>
            <span className="text-[13px] text-slate-800 font-medium text-right min-w-0 break-words">{value ?? '—'}</span>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * États : vide / erreur / cache
 * ──────────────────────────────────────────────────────────────────── */

export function MobileEmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                {icon ?? <IconInbox size={24} stroke={1.6} className="text-slate-400" />}
            </div>
            <p className="text-[14px] font-semibold text-slate-800 mb-1">{title}</p>
            {hint && <p className="text-[12px] text-slate-500">{hint}</p>}
        </div>
    );
}

/** Bandeau d'erreur avec bouton Réessayer — pattern standard des listes. */
export function MobileErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3 flex items-center gap-2">
            <span className="flex-1">{message}</span>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[12px] font-medium flex-shrink-0 inline-flex items-center justify-center gap-1"
                    style={{ minHeight: 44, minWidth: 44 }}
                >
                    <IconRefresh size={13} stroke={2} /> Réessayer
                </button>
            )}
        </div>
    );
}

/** Bandeau « données du cache » (mode hors ligne). */
export function MobileStaleBanner({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center gap-1.5">
            <IconAlertOctagon size={12} stroke={1.8} />
            <span>Données du cache local — synchronisation au retour du réseau.</span>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * MobileFilterBar — barre de filtres sticky sous la TopBar
 * ──────────────────────────────────────────────────────────────────── */

interface FilterOption<T extends string> { key: T; label: string }

export function MobileFilterBar<T extends string>({
    options, value, onChange, activeClass = 'bg-teal-700 text-white border-teal-700',
}: {
    options: FilterOption<T>[]; value: T; onChange: (v: T) => void; activeClass?: string;
}) {
    return (
        // top = hauteur TopBar (56px + safe-area) : jamais top-0 (passerait derrière)
        <div className="px-4 pt-3 pb-2 sticky z-10 bg-[#FAF8F3]" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
                {options.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => onChange(f.key)}
                        className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 border transition ${
                            value === f.key ? activeClass : 'bg-white text-slate-700 border-slate-200'
                        }`}
                        style={{ minHeight: 44 }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
