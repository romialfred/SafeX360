/**
 * InspectionExecutePage — Saisie terrain d'une inspection (mobile-first).
 *
 * Page tactile concue pour smartphone et tablette : cards verticales empilees,
 * boutons gros (min-h 56px), pas d'animation gratuite. Aucune section EPI.
 *
 * Chaque point de controle s'affiche selon son {@code responseType} :
 *   - BOOLEAN        : 2 tuiles Conforme / Non conforme
 *   - VISUAL_GRADE   : 3 tuiles Bon / A surveiller / Mauvais
 *   - NUMERIC_RANGE  : input numerique + indicateur de plage + auto-couleur
 *   - PHOTO_REQUIRED : nom de la photo + futur upload (Phase ulterieure)
 *   - FREE_TEXT      : textarea
 *
 * La conformite est recalculee cote backend a chaque sauvegarde, donc on
 * envoie simplement {@code rawValue} et on n'essaie pas de la prejuger
 * lourdement cote front (mais on affiche un retour visuel apres save).
 *
 * Workflow :
 *   IN_PROGRESS / SCHEDULED : edition libre + sauvegarde brouillon + submit
 *   SUBMITTED  : edition autorisee jusqu'au retour de l'equipe (les saisies
 *                ne se perdent pas avant le verdict, mais la submit est
 *                bloquee tant qu'on n'a pas eu de rejet ou d'approbation)
 *   REJECTED   : banner "a corriger" + permission de re-soumettre
 *   APPROVED / ARCHIVED : lecture seule (banner + readonly)
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconChevronRight,
    IconArrowLeft,
    IconAlertOctagon,
    IconCheck,
    IconX,
    IconCamera,
    IconDeviceFloppy,
    IconSend,
    IconClock,
    IconClipboardList,
} from '@tabler/icons-react';

import {
    getInspection,
    saveFindingsBatch,
    submitInspection,
    updateSummary,
    type InspectionDetailDTO,
    type FindingDTO,
    type FindingConformity,
    type CheckpointResponseType,
} from '../../services/InspectionService';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import InspectionStatusBadge from './InspectionStatusBadge';

interface LocalFinding extends FindingDTO {
    dirty?: boolean;
}

export default function InspectionExecutePage() {
    const { t, i18n } = useTranslation('inspection');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [detail, setDetail] = useState<InspectionDetailDTO | null>(null);
    const [findings, setFindings] = useState<LocalFinding[]>([]);
    const [summary, setSummary] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    // ── Chargement initial ────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        getInspection(Number(id))
            .then((d) => {
                setDetail(d);
                setFindings(
                    [...d.findings].sort(
                        (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999),
                    ),
                );
                setSummary(d.summaryReport ?? '');
            })
            .catch(() => setError('Inspection introuvable'));
    }, [id]);

    const isReadOnly = useMemo(() => {
        if (!detail) return true;
        return detail.status === 'APPROVED' || detail.status === 'ARCHIVED';
    }, [detail]);

    const progress = useMemo(() => {
        const done = findings.filter(
            (f) => f.rawValue !== undefined && f.rawValue !== null && String(f.rawValue).trim() !== '',
        ).length;
        return { done, total: findings.length };
    }, [findings]);

    const allRequiredFilled = useMemo(() => {
        return findings.every((f) => {
            if (f.responseType === 'PHOTO_REQUIRED' || f.responseType === 'FREE_TEXT') {
                return true; // optionnel cote front, c'est le backend qui tranche
            }
            return f.rawValue !== undefined && f.rawValue !== null && String(f.rawValue).trim() !== '';
        });
    }, [findings]);

    const dirty = findings.some((f) => f.dirty) || summary !== (detail?.summaryReport ?? '');

    // ── Mutations ────────────────────────────────────────────────────
    const updateFinding = (checkpointId: number, patch: Partial<FindingDTO>) => {
        setFindings((prev) =>
            prev.map((f) =>
                f.checkpointId === checkpointId ? { ...f, ...patch, dirty: true } : f,
            ),
        );
    };

    const handleSaveDraft = async () => {
        if (!detail || saving) return;
        setSaving(true);
        setError(null);
        try {
            const dirtyList = findings.filter((f) => f.dirty);
            if (dirtyList.length > 0) {
                await saveFindingsBatch(
                    detail.id,
                    dirtyList.map((f) => ({
                        id: f.id,
                        checkpointId: f.checkpointId,
                        rawValue: f.rawValue,
                        note: f.note,
                        photoIds: f.photoIds,
                        conformity: f.conformity,
                    })),
                );
            }
            if (summary !== (detail.summaryReport ?? '')) {
                await updateSummary(detail.id, summary);
            }
            // Reset dirty flags
            setFindings((prev) => prev.map((f) => ({ ...f, dirty: false })));
            setSavedAt(new Date());
            successNotification(t('execute.savedDraft'));
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                t('execute.saveError');
            setError(msg);
            errorNotification(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!detail || submitting) return;
        // D'abord on sauvegarde le brouillon courant pour ne rien perdre
        await handleSaveDraft();
        setSubmitting(true);
        setError(null);
        try {
            await submitInspection(detail.id);
            successNotification(t('execute.submitted'));
            navigate('/inspections');
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                t('execute.submitError');
            setError(msg);
            errorNotification(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Rendu ────────────────────────────────────────────────────────
    if (error && !detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 py-6">
                <div className="w-full max-w-5xl mx-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 mb-3 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                        {t('registry.breadcrumbCurrent')}
                    </button>
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12.5px]">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }
    if (!detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] flex items-center justify-center">
                <div className="text-slate-500 text-[13px]">…</div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] pb-28">
            {/* Header sticky */}
            <div className="sticky top-0 z-20 bg-[#FAF8F3]/95 backdrop-blur border-b border-slate-200 px-4 sm:px-5 py-3">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                        <span className="uppercase tracking-[0.16em] font-medium">
                            {t('registry.breadcrumbRoot')}
                        </span>
                        <IconChevronRight size={10} className="text-slate-400" />
                        <span className="uppercase tracking-[0.16em] text-slate-700 font-medium truncate">
                            {t('execute.breadcrumbCurrent')}
                        </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h1
                                className="text-slate-900 leading-tight truncate"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(17px, 1.6vw, 20px)',
                                    letterSpacing: '-0.015em',
                                }}
                            >
                                {detail.templateName || `#${detail.id}`}
                            </h1>
                            <p className="text-[12px] text-slate-500 truncate">
                                {detail.targetLabel}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {t('execute.progress', {
                                    done: progress.done,
                                    total: progress.total,
                                })}
                            </p>
                        </div>
                        <InspectionStatusBadge status={detail.status} size="md" />
                    </div>
                </div>
            </div>

            {/* Bannieres etat */}
            {(detail.status === 'REJECTED' || isReadOnly) && (
                <div className="px-4 sm:px-5 pt-3">
                    <div className="w-full max-w-5xl mx-auto">
                        {detail.status === 'REJECTED' && (
                            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12.5px] flex items-start gap-2">
                                <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                <span>{t('execute.rejectedBanner')}</span>
                            </div>
                        )}
                        {isReadOnly && (
                            <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[12.5px] flex items-start gap-2">
                                <IconClipboardList size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                <span>{t('execute.readonlyBanner')}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Liste des findings */}
            <div className="px-4 sm:px-5 py-4">
                <div className="w-full max-w-5xl mx-auto space-y-3">
                    {findings.map((f, idx) => (
                        <CheckpointCard
                            key={f.id ?? f.checkpointId ?? idx}
                            index={idx + 1}
                            finding={f}
                            disabled={isReadOnly}
                            onPatch={(patch) =>
                                f.checkpointId !== undefined &&
                                updateFinding(f.checkpointId, patch)
                            }
                        />
                    ))}

                    {/* Synthese */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                        <h3 className="text-[13.5px] font-semibold text-slate-800 mb-1">
                            {t('execute.summaryHeading')}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mb-2">
                            {t('execute.summaryHint')}
                        </p>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            disabled={isReadOnly}
                            placeholder={t('execute.summaryPlaceholder')}
                            rows={4}
                            className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>
                </div>
            </div>

            {/* Footer fixe */}
            {!isReadOnly && (
                <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 px-4 sm:px-5 py-3">
                    <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <IconClock size={12} stroke={1.8} />
                            {savedAt
                                ? t('execute.headerSavedAt', {
                                    time: savedAt.toLocaleTimeString(
                                        i18n.language === 'fr' ? 'fr-FR' : 'en-GB',
                                        { hour: '2-digit', minute: '2-digit' },
                                    ),
                                })
                                : '—'}
                            {dirty && (
                                <span className="text-amber-600 font-medium">·</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={saving || !dirty}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                                style={{ minHeight: 44 }}
                            >
                                <IconDeviceFloppy size={14} stroke={1.8} />
                                <span className="hidden sm:inline">{t('execute.footerSavedDraft')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || !allRequiredFilled}
                                title={
                                    !allRequiredFilled
                                        ? (t('execute.footerSubmitDisabled') as string)
                                        : undefined
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition font-medium shadow-sm disabled:opacity-50"
                                style={{ minHeight: 44 }}
                            >
                                <IconSend size={14} stroke={1.8} />
                                {t('execute.footerSubmit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Card d'un point de controle
 * ────────────────────────────────────────────────────────────────────────*/

interface CheckpointCardProps {
    index: number;
    finding: LocalFinding;
    disabled: boolean;
    onPatch: (patch: Partial<FindingDTO>) => void;
}

function CheckpointCard({ index, finding, disabled, onPatch }: CheckpointCardProps) {
    const { t } = useTranslation('inspection');
    const rt: CheckpointResponseType = (finding.responseType as CheckpointResponseType) ?? 'FREE_TEXT';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[12.5px] font-semibold flex-shrink-0">
                        {index}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[14px] font-semibold text-slate-900 leading-tight">
                                {finding.checkpointLabel}
                            </h3>
                            {finding.critical && (
                                <span className="text-[10px] uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                    {t('execute.criticalChip')}
                                </span>
                            )}
                            {finding.conformity && finding.conformity !== 'NOT_APPLICABLE' && (
                                <ConformityChip conformity={finding.conformity} />
                            )}
                        </div>
                        {finding.helpText && (
                            <p className="text-[12px] text-slate-500 mt-1 leading-snug">
                                {finding.helpText}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Editeur principal selon le type */}
                {rt === 'BOOLEAN' && (
                    <BooleanInput
                        value={finding.rawValue}
                        disabled={disabled}
                        onChange={(v) => onPatch({ rawValue: v })}
                    />
                )}
                {rt === 'VISUAL_GRADE' && (
                    <VisualGradeInput
                        value={finding.rawValue}
                        disabled={disabled}
                        onChange={(v) => onPatch({ rawValue: v })}
                    />
                )}
                {rt === 'NUMERIC_RANGE' && (
                    <NumericRangeInput
                        value={finding.rawValue}
                        min={finding.minValue}
                        max={finding.maxValue}
                        unit={finding.unit}
                        disabled={disabled}
                        onChange={(v) => onPatch({ rawValue: v })}
                    />
                )}
                {rt === 'PHOTO_REQUIRED' && (
                    <PhotoInput
                        value={finding.photoIds}
                        rawValue={finding.rawValue}
                        disabled={disabled}
                        onChange={(name, raw) => onPatch({ photoIds: name, rawValue: raw })}
                    />
                )}
                {rt === 'FREE_TEXT' && (
                    <FreeTextInput
                        value={finding.rawValue}
                        disabled={disabled}
                        onChange={(v) => onPatch({ rawValue: v })}
                    />
                )}

                {/* Note libre commune a tous les types */}
                <div>
                    <label className="block text-[11.5px] text-slate-500 mb-1">
                        {t('execute.noteLabel')}
                    </label>
                    <textarea
                        value={finding.note ?? ''}
                        onChange={(e) => onPatch({ note: e.target.value })}
                        disabled={disabled}
                        placeholder={t('execute.notePlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Editeurs par type
 * ────────────────────────────────────────────────────────────────────────*/

function BooleanInput({
    value,
    disabled,
    onChange,
}: {
    value?: string;
    disabled: boolean;
    onChange: (v: string) => void;
}) {
    const { t } = useTranslation('inspection');
    const isTrue = value === 'true';
    const isFalse = value === 'false';
    return (
        <div className="grid grid-cols-2 gap-2">
            <TouchTile
                active={isTrue}
                activeClasses="bg-emerald-50 border-emerald-600 text-emerald-800"
                disabled={disabled}
                onClick={() => onChange('true')}
                icon={<IconCheck size={20} stroke={2.4} />}
                label={t('execute.booleanYes')}
            />
            <TouchTile
                active={isFalse}
                activeClasses="bg-rose-50 border-rose-600 text-rose-800"
                disabled={disabled}
                onClick={() => onChange('false')}
                icon={<IconX size={20} stroke={2.4} />}
                label={t('execute.booleanNo')}
            />
        </div>
    );
}

function VisualGradeInput({
    value,
    disabled,
    onChange,
}: {
    value?: string;
    disabled: boolean;
    onChange: (v: string) => void;
}) {
    const { t } = useTranslation('inspection');
    return (
        <div className="grid grid-cols-3 gap-2">
            <TouchTile
                active={value === 'GOOD'}
                activeClasses="bg-emerald-50 border-emerald-600 text-emerald-800"
                disabled={disabled}
                onClick={() => onChange('GOOD')}
                label={t('execute.visualGood')}
            />
            <TouchTile
                active={value === 'WATCH'}
                activeClasses="bg-amber-50 border-amber-600 text-amber-800"
                disabled={disabled}
                onClick={() => onChange('WATCH')}
                label={t('execute.visualWatch')}
            />
            <TouchTile
                active={value === 'POOR'}
                activeClasses="bg-rose-50 border-rose-600 text-rose-800"
                disabled={disabled}
                onClick={() => onChange('POOR')}
                label={t('execute.visualPoor')}
            />
        </div>
    );
}

function NumericRangeInput({
    value,
    min,
    max,
    unit,
    disabled,
    onChange,
}: {
    value?: string;
    min?: number;
    max?: number;
    unit?: string;
    disabled: boolean;
    onChange: (v: string) => void;
}) {
    const { t } = useTranslation('inspection');
    const numeric = value !== undefined && value !== '' ? Number(value) : null;
    let status: 'ok' | 'warn' | 'bad' | null = null;
    if (numeric !== null && !isNaN(numeric)) {
        if (min !== undefined && numeric < min) status = 'bad';
        else if (max !== undefined && numeric > max) status = 'bad';
        else if (min !== undefined && max !== undefined) {
            const range = max - min;
            const margin = range * 0.1;
            if (numeric < min + margin || numeric > max - margin) status = 'warn';
            else status = 'ok';
        } else status = 'ok';
    }

    const borderClass =
        status === 'bad'
            ? 'border-rose-500 ring-2 ring-rose-100'
            : status === 'warn'
            ? 'border-amber-500 ring-2 ring-amber-100'
            : status === 'ok'
            ? 'border-emerald-500 ring-2 ring-emerald-100'
            : 'border-slate-200';

    return (
        <div>
            <label className="block text-[11.5px] text-slate-500 mb-1">
                {t('execute.rangeLabel')}
                {unit && <span className="ml-1 text-slate-400">({unit})</span>}
            </label>
            <input
                type="number"
                inputMode="decimal"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`w-full px-3 text-[16px] bg-white border-2 rounded-md focus:outline-none transition ${borderClass} disabled:bg-slate-50 disabled:text-slate-500`}
                style={{ minHeight: 52 }}
            />
            <p className="text-[11px] text-slate-500 mt-1">
                {t('execute.rangeHint', {
                    min: min ?? '—',
                    max: max ?? '—',
                    unit: unit ?? '',
                })}
            </p>
            {status === 'bad' && (
                <p className="text-[11.5px] text-rose-700 mt-1 font-medium">
                    {t('execute.rangeOutOfRange')}
                </p>
            )}
            {status === 'warn' && (
                <p className="text-[11.5px] text-amber-700 mt-1 font-medium">
                    {t('execute.rangeInWatch')}
                </p>
            )}
        </div>
    );
}

function PhotoInput({
    value,
    rawValue,
    disabled,
    onChange,
}: {
    value?: string;
    rawValue?: string;
    disabled: boolean;
    onChange: (filename: string, rawValue: string) => void;
}) {
    const { t } = useTranslation('inspection');
    return (
        <div className="space-y-2">
            <label className="block text-[11.5px] text-slate-500">
                {t('execute.photoLabel')}
            </label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    // Ouvre le selecteur natif (camera arriere sur mobile)
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.setAttribute('capture', 'environment');
                    input.onchange = () => {
                        const f = input.files?.[0];
                        if (f) {
                            onChange(f.name, f.name); // upload reel en Phase 5
                        }
                    };
                    input.click();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 text-[13px] rounded-md border-2 border-dashed border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 transition disabled:opacity-50"
                style={{ minHeight: 56 }}
            >
                <IconCamera size={18} stroke={1.8} />
                {value || rawValue
                    ? value || rawValue
                    : 'Joindre une photo'}
            </button>
            <p className="text-[11px] text-slate-500">{t('execute.photoHint')}</p>
        </div>
    );
}

function FreeTextInput({
    value,
    disabled,
    onChange,
}: {
    value?: string;
    disabled: boolean;
    onChange: (v: string) => void;
}) {
    const { t } = useTranslation('inspection');
    return (
        <div>
            <label className="block text-[11.5px] text-slate-500 mb-1">
                {t('execute.freeTextLabel')}
            </label>
            <textarea
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={t('execute.freeTextPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
        </div>
    );
}

function TouchTile({
    active,
    activeClasses,
    disabled,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    activeClasses: string;
    disabled: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 text-[13px] font-medium transition px-3 py-3 ${
                active
                    ? activeClasses
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ minHeight: 56 }}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function ConformityChip({ conformity }: { conformity: FindingConformity }) {
    const { t } = useTranslation('inspection');
    const cfg: Record<FindingConformity, string> = {
        CONFORM: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        WATCH: 'bg-amber-50 border-amber-200 text-amber-800',
        NON_CONFORM: 'bg-rose-50 border-rose-200 text-rose-800',
        NOT_APPLICABLE: 'bg-slate-50 border-slate-200 text-slate-500',
    };
    return (
        <span
            className={`inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border ${cfg[conformity]}`}
        >
            {t(`conformity.${conformity}`)}
        </span>
    );
}
