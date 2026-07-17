/**
 * InspectionExecutePage — Saisie terrain d'une inspection.
 *
 * Mise en page pleine largeur (convention plateforme R1) en deux colonnes :
 *   - Colonne principale : méthode d'exécution (humaine / assistée IA),
 *     panneau IA, cards de points de contrôle avec sélecteurs segmentés.
 *   - Rail droit collant (desktop) : avancement, accès rapide aux points,
 *     synthèse du rapport et actions toujours visibles.
 *   Sur mobile, le rail bascule en fin de colonne + barre d'actions fixe.
 *
 * Chaque point de contrôle s'affiche selon son {@code responseType} :
 *   BOOLEAN, VISUAL_GRADE (segmentés icônes), NUMERIC_RANGE (saisie + plage),
 *   PHOTO_REQUIRED, FREE_TEXT.
 *
 * La conformité est recalculée côté backend à chaque sauvegarde.
 *
 * Workflow :
 *   SCHEDULED / IN_PROGRESS : édition + brouillon + soumission
 *   SUBMITTED  : édition conservée jusqu'au verdict de l'équipe
 *   REJECTED   : bannière « à corriger » + re-soumission possible
 *   APPROVED / ARCHIVED : lecture seule
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconChevronRight,
    IconArrowLeft,
    IconAlertOctagon,
    IconAlertTriangle,
    IconCheck,
    IconX,
    IconEye,
    IconCamera,
    IconDeviceFloppy,
    IconSend,
    IconClock,
    IconClipboardList,
    IconSparkles,
    IconUser,
    IconListCheck,
} from '@tabler/icons-react';

import {
    getInspection,
    startInspection,
    saveFindingsBatch,
    submitInspection,
    updateSummary,
    type InspectionDetailDTO,
    type FindingDTO,
    type FindingConformity,
    type CheckpointResponseType,
} from '../../services/InspectionService';
import { type AICheckpointProposal } from '../../services/AIInspectionService';
import {
    successNotification,
    errorNotification,
    extractErrorMessage,
} from '../../utility/NotificationUtility';
import { formatInspectionDate, isExecutableNow } from './inspectionLabels';
import InspectionStatusBadge from './InspectionStatusBadge';
import AIInspectAssistPanel from './AIInspectAssistPanel';
import CheckpointIllustration from './CheckpointIllustration';

/** Méthode d'exécution choisie par l'inspecteur (LOT 50). */
type ExecutionMethod = 'HUMAN' | 'AI';

interface LocalFinding extends FindingDTO {
    dirty?: boolean;
}

const isAnswered = (f: LocalFinding) =>
    f.rawValue !== undefined && f.rawValue !== null && String(f.rawValue).trim() !== '';

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
    // LOT 50 — méthode d'exécution : humaine (défaut) ou assistée par IA
    const [method, setMethod] = useState<ExecutionMethod>('HUMAN');

    // ── Chargement initial ────────────────────────────────────────────
    //
    // SPEC §2.1 — l'IHM verrouille déjà le bouton « Exécuter » (registre et
    // détail), mais l'URL reste atteignable : lien partagé, favori, retour
    // arrière. On ne réimplémente PAS la règle ici : sur une SCHEDULED datée du
    // futur on interroge le SERVEUR (`start()`), seule autorité, et on relaie
    // SON message métier. Si le serveur accepte (règle assouplie, date du jour
    // franchie entre-temps), l'inspection démarre normalement : aucun faux
    // blocage côté client.
    useEffect(() => {
        if (!id) return;
        let alive = true;

        const guardThenLoad = async () => {
            try {
                let d = await getInspection(Number(id));
                if (!alive) return;

                if (d.status === 'SCHEDULED' && !isExecutableNow(d.plannedDate)) {
                    let refused: unknown = null;
                    try {
                        await startInspection(d.id);
                    } catch (e) {
                        refused = e ?? new Error('start refused');
                    }
                    if (!alive) return;
                    if (refused) {
                        errorNotification(
                            extractErrorMessage(
                                refused,
                                t('execute.notBeforePlannedDate', {
                                    date: formatInspectionDate(d.plannedDate, i18n.language),
                                }),
                            ),
                        );
                        navigate(`/inspections/detail/${d.id}`, { replace: true });
                        return;
                    }
                    // Le serveur a tranché « oui » : la fiche est passée
                    // IN_PROGRESS, on repart de l'état réel.
                    d = await getInspection(Number(id));
                    if (!alive) return;
                }

                if (!alive) return;
                setDetail(d);
                setFindings(
                    [...d.findings].sort(
                        (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999),
                    ),
                );
                setSummary(d.summaryReport ?? '');
            } catch {
                if (alive) setError('Inspection introuvable');
            }
        };

        void guardThenLoad();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const isReadOnly = useMemo(() => {
        if (!detail) return true;
        return detail.status === 'APPROVED' || detail.status === 'ARCHIVED';
    }, [detail]);

    const progress = useMemo(() => {
        const done = findings.filter(isAnswered).length;
        return { done, total: findings.length };
    }, [findings]);

    const conformityStats = useMemo(() => {
        const answered = findings.filter(isAnswered);
        return {
            conform: answered.filter((f) => f.conformity === 'CONFORM').length,
            watch: answered.filter((f) => f.conformity === 'WATCH').length,
            nonConform: answered.filter((f) => f.conformity === 'NON_CONFORM').length,
            remaining: findings.length - answered.length,
        };
    }, [findings]);

    const allRequiredFilled = useMemo(() => {
        return findings.every((f) => {
            if (f.responseType === 'PHOTO_REQUIRED' || f.responseType === 'FREE_TEXT') {
                return true; // optionnel côté front, c'est le backend qui tranche
            }
            return isAnswered(f);
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

    /**
     * LOT 50 — Applique une proposition IA dans le formulaire (pré-remplissage).
     * Pour les types calculables (BOOLEAN, VISUAL_GRADE, NUMERIC_RANGE), seule
     * la valeur est posée : la conformité est recalculée par le backend avec le
     * même algorithme que la saisie humaine. Pour FREE_TEXT et PHOTO_REQUIRED,
     * la conformité IA est posée en surcharge tracée (overrideReason).
     */
    const applyAiProposal = (p: AICheckpointProposal) => {
        const f = findings.find((x) => x.checkpointId === p.checkpointId);
        if (!f) return;
        const computable =
            f.responseType === 'BOOLEAN' ||
            f.responseType === 'VISUAL_GRADE' ||
            f.responseType === 'NUMERIC_RANGE';

        const patch: Partial<FindingDTO> = {};
        if (p.proposedRawValue) {
            patch.rawValue = p.proposedRawValue;
        }
        if (computable) {
            patch.conformity = undefined;
            patch.overrideReason = undefined;
        } else if (
            p.proposedConformity &&
            p.proposedConformity !== 'CONFORM'
        ) {
            patch.conformity = p.proposedConformity as FindingConformity;
            patch.overrideReason = t('ai.overrideReason') as string;
        }
        if (p.observation && !(f.note && f.note.trim())) {
            patch.note = t('ai.notePrefix', { observation: p.observation }) as string;
        }
        updateFinding(p.checkpointId, patch);
    };

    /** LOT 50 — Insère la synthèse IA avec mention de traçabilité. */
    const useAiSummary = (text: string) => {
        setSummary(`${text.trim()}\n\n${t('ai.summaryAttribution')}`);
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
                        overrideReason: f.overrideReason,
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

    const scrollToCheckpoint = (checkpointId?: number) => {
        if (checkpointId === undefined) return;
        document
            .getElementById(`checkpoint-${checkpointId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // ── Rendu ────────────────────────────────────────────────────────
    if (error && !detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 mb-3 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                        {t('execute.backToRegistry')}
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

    const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    /** Carte synthèse — réutilisée dans le rail desktop et la colonne mobile. */
    const summaryCard = (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <h3 className="text-[13px] font-semibold text-slate-800 mb-1">
                {t('execute.summaryHeading')}
            </h3>
            <p className="text-[11.5px] text-slate-500 mb-2 leading-snug">
                {t('execute.summaryHint')}
            </p>
            <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={isReadOnly}
                placeholder={t('execute.summaryPlaceholder')}
                rows={5}
                className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
        </div>
    );

    /** Boutons d'action — rail desktop. */
    const actionButtons = !isReadOnly && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
            <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !allRequiredFilled}
                title={!allRequiredFilled ? (t('execute.footerSubmitDisabled') as string) : undefined}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[13px] rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition font-medium shadow-sm disabled:opacity-50"
                style={{ minHeight: 44 }}
            >
                <IconSend size={15} stroke={1.8} />
                {t('execute.footerSubmit')}
            </button>
            <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || !dirty}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                style={{ minHeight: 40 }}
            >
                <IconDeviceFloppy size={14} stroke={1.8} />
                {t('execute.footerSavedDraft')}
            </button>
            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                <IconClock size={11} stroke={1.8} />
                {savedAt
                    ? t('execute.headerSavedAt', {
                        time: savedAt.toLocaleTimeString(
                            i18n.language === 'fr' ? 'fr-FR' : 'en-GB',
                            { hour: '2-digit', minute: '2-digit' },
                        ),
                    })
                    : '—'}
                {dirty && <span className="text-amber-600 font-semibold">·</span>}
            </div>
        </div>
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] pb-24 xl:pb-8">
            {/* ── En-tête de page ─────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-5 lg:px-6 py-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition flex-shrink-0"
                        aria-label={t('execute.backToRegistry') as string}
                        title={t('execute.backToRegistry') as string}
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                    </button>
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium truncate">
                        {t('execute.breadcrumbCurrent')}
                    </span>
                </div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <h1
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(18px, 1.8vw, 22px)',
                                letterSpacing: '-0.015em',
                            }}
                        >
                            {detail.templateName || `#${detail.id}`}
                        </h1>
                        <p className="text-[12.5px] text-slate-500 mt-0.5">
                            {detail.targetLabel}
                            {detail.siteName && <> · {detail.siteName}</>}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="min-w-[180px]">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span>
                                    {t('execute.progress', { done: progress.done, total: progress.total })}
                                </span>
                                <span className="font-semibold text-slate-700 tabular-nums">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-600 transition-all"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                        <InspectionStatusBadge status={detail.status} size="md" />
                    </div>
                </div>
            </div>

            {/* ── Bannières d'état ────────────────────────────────────── */}
            {(detail.status === 'REJECTED' || isReadOnly) && (
                <div className="px-4 sm:px-5 lg:px-6 pt-3">
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
            )}

            {/* ── Corps : deux colonnes ───────────────────────────────── */}
            <div className="px-4 sm:px-5 lg:px-6 py-4 flex items-start gap-4">
                {/* Colonne principale */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* LOT 50 — Choix de la méthode d'exécution */}
                    {!isReadOnly && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-2.5">
                                <div>
                                    <h3 className="text-[13px] font-semibold text-slate-800">
                                        {t('ai.methodHeading')}
                                    </h3>
                                    <p className="text-[11.5px] text-slate-500 leading-snug">
                                        {t('ai.methodHint')}
                                    </p>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMethod('HUMAN')}
                                    className={`inline-flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition ${
                                        method === 'HUMAN'
                                            ? 'bg-slate-50 border-slate-700'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 ${
                                        method === 'HUMAN' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        <IconUser size={16} stroke={1.8} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-semibold text-slate-800">
                                            {t('ai.methodHuman')}
                                        </span>
                                        <span className="block text-[11.5px] text-slate-500 leading-snug truncate">
                                            {t('ai.methodHumanDesc')}
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMethod('AI')}
                                    className={`inline-flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition ${
                                        method === 'AI'
                                            ? 'bg-indigo-50/60 border-indigo-600'
                                            : 'bg-white border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 ${
                                        method === 'AI' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-500'
                                    }`}>
                                        <IconSparkles size={16} stroke={1.8} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-semibold text-indigo-800">
                                            {t('ai.methodAi')}
                                        </span>
                                        <span className="block text-[11.5px] text-slate-500 leading-snug truncate">
                                            {t('ai.methodAiDesc')}
                                        </span>
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LOT 50 — Panneau d'assistance IA */}
                    {!isReadOnly && method === 'AI' && (
                        <AIInspectAssistPanel
                            inspectionId={detail.id}
                            targetLabel={detail.targetLabel}
                            disabled={isReadOnly}
                            onApplyProposal={applyAiProposal}
                            onUseSummary={useAiSummary}
                        />
                    )}

                    {/* Points de contrôle */}
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

                    {/* Synthèse — visible ici uniquement sous le breakpoint xl */}
                    <div className="xl:hidden">{summaryCard}</div>
                </div>

                {/* Rail droit collant (desktop) */}
                <aside className="hidden xl:flex w-80 flex-shrink-0 flex-col gap-3 sticky top-[140px]">
                    {/* Avancement */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                        <h3 className="text-[13px] font-semibold text-slate-800 mb-2.5">
                            {t('execute.progressHeading')}
                        </h3>
                        <div className="flex items-center justify-between text-[12px] text-slate-600 mb-1.5">
                            <span>{t('execute.progress', { done: progress.done, total: progress.total })}</span>
                            <span className="font-semibold tabular-nums">{progressPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full bg-emerald-600 transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11.5px]">
                            <StatChip color="emerald" label={t('conformity.CONFORM')} value={conformityStats.conform} />
                            <StatChip color="amber" label={t('conformity.WATCH')} value={conformityStats.watch} />
                            <StatChip color="rose" label={t('conformity.NON_CONFORM')} value={conformityStats.nonConform} />
                            <StatChip color="slate" label={t('execute.remaining')} value={conformityStats.remaining} />
                        </div>

                        {/* Accès rapide */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                                <IconListCheck size={12} stroke={1.8} />
                                {t('execute.quickNav')}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {findings.map((f, idx) => {
                                    const answered = isAnswered(f);
                                    return (
                                        <button
                                            key={f.checkpointId ?? idx}
                                            type="button"
                                            onClick={() => scrollToCheckpoint(f.checkpointId)}
                                            title={f.checkpointLabel}
                                            className={`w-8 h-8 rounded-md text-[11.5px] font-semibold tabular-nums border transition ${
                                                answered
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : f.critical
                                                    ? 'bg-white border-rose-300 text-rose-700 hover:bg-rose-50'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {summaryCard}
                    {actionButtons}
                </aside>
            </div>

            {/* ── Barre d'actions fixe (mobile / tablette uniquement) ── */}
            {!isReadOnly && (
                <div className="xl:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 px-4 sm:px-5 py-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
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
                            {dirty && <span className="text-amber-600 font-medium">·</span>}
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
 *  Chip de statistique (rail Avancement)
 * ────────────────────────────────────────────────────────────────────────*/

function StatChip({
    color,
    label,
    value,
}: {
    color: 'emerald' | 'amber' | 'rose' | 'slate';
    label: string;
    value: number;
}) {
    const palette = {
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        amber: 'bg-amber-50 border-amber-200 text-amber-800',
        rose: 'bg-rose-50 border-rose-200 text-rose-800',
        slate: 'bg-slate-50 border-slate-200 text-slate-600',
    }[color];
    return (
        <div className={`flex items-center justify-between px-2 py-1.5 rounded-md border ${palette}`}>
            <span className="truncate">{label}</span>
            <span className="font-semibold tabular-nums ml-1.5">{value}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Card d'un point de contrôle
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
    const answered = isAnswered(finding);

    return (
        <div
            id={finding.checkpointId !== undefined ? `checkpoint-${finding.checkpointId}` : undefined}
            className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden scroll-mt-36 md:flex md:items-stretch"
        >
            <div className="flex-1 min-w-0">
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-semibold flex-shrink-0 mt-0.5 ${
                            answered
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {answered ? <IconCheck size={14} stroke={2.6} /> : index}
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
                            <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                                {finding.helpText}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 py-3.5 space-y-3">
                {/* Éditeur principal selon le type */}
                {rt === 'BOOLEAN' && (
                    <SegmentedChoice
                        value={finding.rawValue}
                        disabled={disabled}
                        onChange={(v) => onPatch({ rawValue: v })}
                        options={[
                            {
                                value: 'true',
                                label: t('execute.booleanYes'),
                                icon: <IconCheck size={15} stroke={2.2} />,
                                activeClasses: 'bg-emerald-600 border-emerald-600 text-white',
                            },
                            {
                                value: 'false',
                                label: t('execute.booleanNo'),
                                icon: <IconX size={15} stroke={2.2} />,
                                activeClasses: 'bg-rose-600 border-rose-600 text-white',
                            },
                        ]}
                    />
                )}
                {rt === 'VISUAL_GRADE' && (
                    <SegmentedChoice
                        value={finding.rawValue}
                        disabled={disabled}
                        onChange={(v) => onPatch({ rawValue: v })}
                        options={[
                            {
                                value: 'GOOD',
                                label: t('execute.visualGood'),
                                icon: <IconCheck size={15} stroke={2.2} />,
                                activeClasses: 'bg-emerald-600 border-emerald-600 text-white',
                            },
                            {
                                value: 'WATCH',
                                label: t('execute.visualWatch'),
                                icon: <IconEye size={15} stroke={2} />,
                                activeClasses: 'bg-amber-500 border-amber-500 text-white',
                            },
                            {
                                value: 'POOR',
                                label: t('execute.visualPoor'),
                                icon: <IconAlertTriangle size={15} stroke={2} />,
                                activeClasses: 'bg-rose-600 border-rose-600 text-white',
                            },
                        ]}
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

                {/* Note libre commune à tous les types */}
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

            {/* Illustration contextuelle de la partie inspectée */}
            <div className="hidden md:flex w-44 flex-shrink-0 flex-col items-center justify-center gap-1 border-l border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4">
                <CheckpointIllustration
                    label={finding.checkpointLabel}
                    className="w-28 h-28"
                />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Sélecteur segmenté (BOOLEAN / VISUAL_GRADE)
 * ────────────────────────────────────────────────────────────────────────*/

interface SegmentedOption {
    value: string;
    label: string;
    icon: React.ReactNode;
    activeClasses: string;
}

function SegmentedChoice({
    value,
    options,
    disabled,
    onChange,
}: {
    value?: string;
    options: SegmentedOption[];
    disabled: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200 max-w-xl">
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 text-[13px] font-medium transition border-y-0 ${
                            active
                                ? opt.activeClasses
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ minHeight: 44 }}
                        aria-pressed={active}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Éditeurs par type
 * ────────────────────────────────────────────────────────────────────────*/

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
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        className={`w-44 pl-3 ${unit ? 'pr-12' : 'pr-3'} text-[15px] bg-white border-2 rounded-md focus:outline-none transition tabular-nums ${borderClass} disabled:bg-slate-50 disabled:text-slate-500`}
                        style={{ minHeight: 44 }}
                    />
                    {unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 pointer-events-none">
                            {unit}
                        </span>
                    )}
                </div>
                <p className="text-[11.5px] text-slate-500">
                    {t('execute.rangeHint', {
                        min: min ?? '—',
                        max: max ?? '—',
                        unit: unit ?? '',
                    })}
                </p>
            </div>
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
        <div className="space-y-1.5 max-w-xl">
            <label className="block text-[11.5px] text-slate-500">
                {t('execute.photoLabel')}
            </label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    // Ouvre le sélecteur natif (caméra arrière sur mobile)
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.setAttribute('capture', 'environment');
                    input.onchange = () => {
                        const f = input.files?.[0];
                        if (f) {
                            onChange(f.name, f.name); // upload réel en Phase 5
                        }
                    };
                    input.click();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 text-[13px] rounded-md border-2 border-dashed border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 transition disabled:opacity-50"
                style={{ minHeight: 48 }}
            >
                <IconCamera size={17} stroke={1.8} />
                {value || rawValue ? value || rawValue : t('execute.photoAttach')}
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
