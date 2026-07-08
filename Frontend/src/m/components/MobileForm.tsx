/**
 * MobileForm — Kit de saisie tactile SafeX 360 Field.
 *
 * Champs conçus pour le terrain (gants, soleil, 3G) :
 *   - hauteur >= 48px, focus ring teal, labels majuscules espacés
 *   - MSelectSheet : sélection par bottom-sheet plein pouce (PAS de
 *     dropdown desktop, injouable au doigt)
 *   - MDateField : input date natif (clavier système Android)
 *
 * Toute nouvelle saisie mobile passe par ces primitives — jamais par
 * Mantine (dimensionné souris/desktop).
 */

import { ReactNode, useState } from 'react';
import { IconChevronDown, IconX, IconCheck } from '@tabler/icons-react';

const LABEL_CLS = 'block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5';
const FIELD_CLS = `w-full bg-white border border-slate-300 rounded-xl px-3.5 text-[14px] text-slate-900
    placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition`;

function FieldShell({ label, required, error, children }: { label: string; required?: boolean; error?: string | null; children: ReactNode }) {
    return (
        <div>
            <label className={LABEL_CLS}>
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-[11.5px] text-rose-600 mt-1">{error}</p>}
        </div>
    );
}

/* ── Texte ─────────────────────────────────────────────────────────── */

interface MTextFieldProps {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; required?: boolean; error?: string | null;
    type?: 'text' | 'number' | 'email' | 'tel';
}

export function MTextField({ label, value, onChange, placeholder, required, error, type = 'text' }: MTextFieldProps) {
    return (
        <FieldShell label={label} required={required} error={error}>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={FIELD_CLS}
                style={{ minHeight: 48 }}
            />
        </FieldShell>
    );
}

export function MTextArea({ label, value, onChange, placeholder, required, error, rows = 4 }: MTextFieldProps & { rows?: number }) {
    return (
        <FieldShell label={label} required={required} error={error}>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`${FIELD_CLS} py-3 resize-none`}
            />
        </FieldShell>
    );
}

/* ── Date ──────────────────────────────────────────────────────────── */

export function MDateField({ label, value, onChange, required, error }: {
    label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: string | null;
}) {
    return (
        <FieldShell label={label} required={required} error={error}>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={FIELD_CLS}
                style={{ minHeight: 48 }}
            />
        </FieldShell>
    );
}

/* ── Bottom sheet générique ────────────────────────────────────────── */

export function MobileBottomSheet({ open, title, onClose, children }: {
    open: boolean; title: string; onClose: () => void; children: ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" aria-label="Fermer" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
            <div
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col"
                style={{ maxHeight: '78vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
                    <h3 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {title}
                    </h3>
                    <button type="button" onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 text-slate-400 inline-flex items-center justify-center" style={{ minHeight: 44, minWidth: 44 }}>
                        <IconX size={18} stroke={2} />
                    </button>
                </div>
                <div className="overflow-y-auto px-3 pb-4 min-h-0">{children}</div>
            </div>
        </div>
    );
}

/* ── Sélecteur par bottom-sheet ────────────────────────────────────── */

export interface MSelectOption { value: string; label: string; hint?: string }

interface MSelectSheetProps {
    label: string; value: string | null; onChange: (v: string) => void;
    options: MSelectOption[]; placeholder?: string; required?: boolean; error?: string | null;
}

export function MSelectSheet({ label, value, onChange, options, placeholder = 'Sélectionner…', required, error }: MSelectSheetProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);
    return (
        <FieldShell label={label} required={required} error={error}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`${FIELD_CLS} flex items-center justify-between text-left ${selected ? '' : 'text-slate-400'}`}
                style={{ minHeight: 48 }}
            >
                <span className="truncate">{selected?.label ?? placeholder}</span>
                <IconChevronDown size={16} stroke={2} className="text-slate-400 flex-shrink-0 ml-2" />
            </button>
            <MobileBottomSheet open={open} title={label} onClose={() => setOpen(false)}>
                <ul>
                    {options.length === 0 && (
                        <li className="px-3 py-4 text-[13px] text-slate-500 text-center">Aucune option disponible</li>
                    )}
                    {options.map((o) => (
                        <li key={o.value}>
                            <button
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left text-[14px] active:bg-slate-50 ${
                                    o.value === value ? 'text-teal-700 font-semibold bg-teal-50/60' : 'text-slate-800'
                                }`}
                                style={{ minHeight: 48 }}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate">{o.label}</span>
                                    {o.hint && <span className="block text-[11.5px] text-slate-500 truncate">{o.hint}</span>}
                                </span>
                                {o.value === value && <IconCheck size={16} stroke={2.4} className="flex-shrink-0" />}
                            </button>
                        </li>
                    ))}
                </ul>
            </MobileBottomSheet>
        </FieldShell>
    );
}

/* ── Segmenté (choix courts 2-4 valeurs) ───────────────────────────── */

export function MSegment({ label, value, onChange, options, required, error }: {
    label: string; value: string | null; onChange: (v: string) => void;
    options: MSelectOption[]; required?: boolean; error?: string | null;
}) {
    return (
        <FieldShell label={label} required={required} error={error}>
            <div className="grid gap-1.5 bg-white border border-slate-200 rounded-xl p-1"
                style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, minmax(0, 1fr))` }}>
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={`px-2 py-2 rounded-lg text-[12.5px] font-medium transition ${
                            value === o.value ? 'bg-teal-700 text-white' : 'text-slate-600'
                        }`}
                        style={{ minHeight: 44 }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </FieldShell>
    );
}
