import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Progress, Textarea, Tooltip } from "@mantine/core";
import { IconChecklist, IconPick, IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import IsoBadge from "../../UtilityComp/IsoBadge";
import EmptyState from "../../UtilityComp/EmptyState";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import {
    getAuditChecklist,
    initAuditChecklist,
    updateChecklistItem,
    AuditChecklistItemDTO,
    ChecklistResult,
} from "../../../services/AuditIsoService";
import {
    auditIsoErrorMessage,
    AUDIT_ISO_ERROR_MESSAGES,
    CHECKLIST_REFERENTIALS,
    CHECKLIST_RESULT_ACTIVE_CHIPS,
    CHECKLIST_RESULT_LABELS,
    isIsoReferential,
    referentialToNorm,
} from "./auditLabels";

/**
 * LOT 53 — badge de référentiel : IsoBadge pour les normes ISO (règle
 * plateforme), badge sectoriel ambre dédié pour le référentiel MINIER.
 */
const ReferentialBadge = ({ referential }: { referential: string }) => {
    const { t } = useTranslation('audits');
    if (isIsoReferential(referential)) {
        return <IsoBadge norm={referentialToNorm(referential)} size="md" withLabel />;
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-[12px] tracking-wide">
            <IconPick size={14} />
            {t('checklist.minierBadge')}
        </span>
    );
};

/**
 * AuditChecklistPanel — LOT 52 Module B : étape « Checklist ISO » de
 * l'exécution d'audit.
 *
 * Checklist vide → sélection des référentiels (badges ISO) + initialisation.
 * Checklist initialisée → questions groupées par référentiel puis clause,
 * réponse par boutons segmentés Conforme / Non conforme / N.A. (A évaluer par
 * défaut), commentaire obligatoire pour une non-conformité (règle backend
 * COMMENT_REQUIRED_FOR_NON_CONFORME relayée en français), progression par
 * référentiel.
 */

interface AuditChecklistPanelProps {
    auditId: string | number | undefined;
}

/** Ordre d'affichage des boutons segmentés ; A_EVALUER reste l'état par défaut. */
const RESULT_BUTTONS: ChecklistResult[] = ['CONFORME', 'NON_CONFORME', 'NON_APPLICABLE', 'A_EVALUER'];

const AuditChecklistPanel = ({ auditId }: AuditChecklistPanelProps) => {
    const { t } = useTranslation('audits');
    // Libellé de résultat de checklist — clé i18n `audits:checklistResult.*`, repli sur le libellé FR centralisé.
    const tResult = (result: ChecklistResult): string =>
        t(`checklistResult.${result}`, { defaultValue: CHECKLIST_RESULT_LABELS[result] });
    const [items, setItems] = useState<AuditChecklistItemDTO[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [selectedReferentials, setSelectedReferentials] = useState<string[]>([]);
    /** Brouillons de commentaire (itemId → texte) avant enregistrement. */
    const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
    /** Erreurs locales par question (itemId → message FR). */
    const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
    const [savingItemId, setSavingItemId] = useState<number | null>(null);

    const fetchChecklist = () => {
        if (!auditId) return;
        getAuditChecklist(auditId)
            .then((res) => {
                setItems(res);
                setCommentDrafts(
                    Object.fromEntries(res.map((item) => [item.id, item.comment ?? '']))
                );
            })
            .catch((_err) => setItems([]))
            .finally(() => setLoaded(true));
    };

    useEffect(() => { fetchChecklist(); }, [auditId]);

    // ─── Initialisation de la checklist ──────────────────────────────────────

    const toggleReferential = (referential: string) => {
        setSelectedReferentials((prev) =>
            prev.includes(referential)
                ? prev.filter((r) => r !== referential)
                : [...prev, referential]
        );
    };

    const handleInit = () => {
        if (!auditId || selectedReferentials.length === 0) return;
        setInitializing(true);
        initAuditChecklist(auditId, selectedReferentials)
            .then((res) => {
                successNotification(res?.message || t('checklist.initializedToast'));
                fetchChecklist();
            })
            .catch((err) => {
                errorNotification(auditIsoErrorMessage(err, t('checklist.initFailed')));
            })
            .finally(() => setInitializing(false));
    };

    // ─── Mise à jour d'une question ──────────────────────────────────────────

    const applyLocalUpdate = (itemId: number, patch: Partial<AuditChecklistItemDTO>) => {
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
    };

    const saveItem = (item: AuditChecklistItemDTO, patch: Partial<AuditChecklistItemDTO>) => {
        setSavingItemId(item.id);
        updateChecklistItem(item.id, patch)
            .then(() => {
                applyLocalUpdate(item.id, patch);
                setItemErrors((prev) => ({ ...prev, [item.id]: '' }));
            })
            .catch((err) => {
                const message = auditIsoErrorMessage(err, t('checklist.saveItemFailed'));
                setItemErrors((prev) => ({ ...prev, [item.id]: message }));
                errorNotification(message);
            })
            .finally(() => setSavingItemId(null));
    };

    const handleResultClick = (item: AuditChecklistItemDTO, result: ChecklistResult) => {
        if (result === item.result) return;
        const draftComment = (commentDrafts[item.id] ?? '').trim();
        // Garde frontend alignée sur la règle backend COMMENT_REQUIRED_FOR_NON_CONFORME.
        if (result === 'NON_CONFORME' && draftComment.length === 0) {
            applyLocalUpdate(item.id, { result });
            setItemErrors((prev) => ({
                ...prev,
                [item.id]: AUDIT_ISO_ERROR_MESSAGES.COMMENT_REQUIRED_FOR_NON_CONFORME,
            }));
            return;
        }
        saveItem(item, { result, comment: draftComment });
    };

    const handleCommentBlur = (item: AuditChecklistItemDTO) => {
        const draftComment = (commentDrafts[item.id] ?? '').trim();
        if (draftComment === (item.comment ?? '').trim()) {
            // Pas de changement de texte — mais une NC en attente de commentaire
            // doit quand même être poussée si le commentaire vient d'être saisi.
            if (!(item.result === 'NON_CONFORME' && itemErrors[item.id] && draftComment.length > 0)) return;
        }
        if (item.result === 'NON_CONFORME' && draftComment.length === 0) {
            setItemErrors((prev) => ({
                ...prev,
                [item.id]: AUDIT_ISO_ERROR_MESSAGES.COMMENT_REQUIRED_FOR_NON_CONFORME,
            }));
            return;
        }
        saveItem(item, { result: item.result, comment: draftComment });
    };

    // ─── Groupements & progression ───────────────────────────────────────────

    const groupedByReferential = useMemo(() => {
        const groups: Record<string, AuditChecklistItemDTO[]> = {};
        items.forEach((item) => {
            (groups[item.referential] = groups[item.referential] ?? []).push(item);
        });
        // Clauses triées naturellement à l'intérieur de chaque référentiel.
        Object.values(groups).forEach((group) =>
            group.sort((a, b) => a.clause.localeCompare(b.clause, 'fr', { numeric: true }))
        );
        return groups;
    }, [items]);

    const progressFor = (group: AuditChecklistItemDTO[]) => {
        const evaluated = group.filter((item) => item.result !== 'A_EVALUER').length;
        return { evaluated, total: group.length, percent: group.length ? Math.round((evaluated / group.length) * 100) : 0 };
    };

    // ─── Rendu : sélecteur de référentiels (checklist vide) ──────────────────

    if (loaded && items.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <EmptyState
                    compact
                    icon={<IconChecklist size={22} />}
                    iconColor="indigo"
                    title={t('checklist.emptyTitle')}
                    description={t('checklist.emptyDescription')}
                />
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {CHECKLIST_REFERENTIALS.map((referential) => {
                        const isSelected = selectedReferentials.includes(referential);
                        return (
                            <button
                                key={referential}
                                type="button"
                                onClick={() => toggleReferential(referential)}
                                aria-pressed={isSelected}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                    isSelected
                                        ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-100 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                }`}
                            >
                                <ReferentialBadge referential={referential} />
                            </button>
                        );
                    })}
                </div>
                <div className="flex justify-center mt-6">
                    <Button
                        color="indigo"
                        leftSection={<IconChecklist size={16} />}
                        disabled={selectedReferentials.length === 0}
                        loading={initializing}
                        onClick={handleInit}
                    >
                        {t('checklist.initButton')}
                    </Button>
                </div>
            </div>
        );
    }

    // ─── Rendu : checklist groupée référentiel → clause ──────────────────────

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-lg text-gray-600 flex items-center gap-2">
                    <IconChecklist size={20} stroke={1.5} /> {t('checklist.title')}
                </p>
                <Button size="xs" variant="default" leftSection={<IconRefresh size={14} />} onClick={fetchChecklist}>
                    {t('checklist.refresh')}
                </Button>
            </div>

            {Object.entries(groupedByReferential).map(([referential, group]) => {
                const progress = progressFor(group);
                const clauses: Record<string, AuditChecklistItemDTO[]> = {};
                group.forEach((item) => {
                    (clauses[item.clause] = clauses[item.clause] ?? []).push(item);
                });
                return (
                    <div key={referential} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* En-tête référentiel + progression */}
                        <div className="flex items-center justify-between gap-4 flex-wrap px-5 py-3 bg-slate-50 border-b border-slate-200">
                            <ReferentialBadge referential={referential} />
                            <div className="flex items-center gap-3 min-w-[220px] flex-1 max-w-xs">
                                <Progress
                                    value={progress.percent}
                                    color={progress.percent === 100 ? 'teal' : 'indigo'}
                                    size="sm"
                                    radius="xl"
                                    className="flex-1"
                                />
                                <span className="text-[12px] text-slate-600 tabular-nums whitespace-nowrap">
                                    {t('checklist.evaluatedCount', { evaluated: progress.evaluated, total: progress.total })}
                                </span>
                            </div>
                        </div>

                        {/* Questions groupées par clause */}
                        <div className="divide-y divide-slate-100">
                            {Object.entries(clauses).map(([clause, clauseItems]) => (
                                <div key={clause} className="px-5 py-4">
                                    <p className="text-[12px] uppercase tracking-wider text-slate-500 mb-3">
                                        {t('checklist.clause', { clause })}
                                    </p>
                                    <div className="space-y-4">
                                        {clauseItems.map((item) => {
                                            const error = itemErrors[item.id];
                                            const isSaving = savingItemId === item.id;
                                            return (
                                                <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                                        <p className="text-sm text-slate-800 flex-1 min-w-[240px]">{item.question}</p>
                                                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg flex-shrink-0">
                                                            {RESULT_BUTTONS.map((result) => {
                                                                const isActive = item.result === result;
                                                                return (
                                                                    <Tooltip key={result} label={tResult(result)} withArrow disabled={isActive}>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isSaving}
                                                                            onClick={() => handleResultClick(item, result)}
                                                                            aria-pressed={isActive}
                                                                            className={`px-2.5 py-1 rounded-md border text-[12px] transition-colors ${
                                                                                isActive
                                                                                    ? CHECKLIST_RESULT_ACTIVE_CHIPS[result]
                                                                                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-200'
                                                                            } ${isSaving ? 'opacity-60 cursor-wait' : ''}`}
                                                                        >
                                                                            {tResult(result)}
                                                                        </button>
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <Textarea
                                                        className="mt-3"
                                                        placeholder={
                                                            item.result === 'NON_CONFORME'
                                                                ? t('checklist.commentRequiredPlaceholder')
                                                                : t('checklist.commentOptionalPlaceholder')
                                                        }
                                                        autosize
                                                        minRows={1}
                                                        withAsterisk={item.result === 'NON_CONFORME'}
                                                        label={item.result === 'NON_CONFORME' ? t('checklist.commentRequiredLabel') : undefined}
                                                        value={commentDrafts[item.id] ?? ''}
                                                        onChange={(e) =>
                                                            setCommentDrafts((prev) => ({ ...prev, [item.id]: e.currentTarget.value }))
                                                        }
                                                        onBlur={() => handleCommentBlur(item)}
                                                        error={error || undefined}
                                                    />

                                                    {item.observationId && (
                                                        <Badge variant="light" color="indigo" radius="sm" className="mt-2">
                                                            {t('checklist.linkedObservation', { id: item.observationId })}
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AuditChecklistPanel;
