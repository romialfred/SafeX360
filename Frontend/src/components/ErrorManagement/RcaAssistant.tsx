/**
 * RcaAssistant — Assistant d'analyse causale (RCA) du module Gestion des Erreurs.
 *
 * Gère les 4 méthodes du backend :
 *   - 5 Pourquoi    : chaîne séquentielle de « pourquoi » (niveau = profondeur).
 *   - Ishikawa (6M) : causes regroupées par familles (catégories 6M).
 *   - Arbre / ICAM  : liste hiérarchique (parentCauseId), regroupée par niveau.
 *
 * Une analyse causale (CausalAnalysisDTO) porte une méthode + des causes
 * (CauseDTO). On peut créer plusieurs analyses (méthodes) sur un même événement.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Loader, Select, Textarea, TextInput } from '@mantine/core';
import {
    IconBinaryTree2,
    IconChevronRight,
    IconFishHook,
    IconHelpCircle,
    IconPlus,
    IconSitemap,
    IconTrash,
} from '@tabler/icons-react';
import {
    addCausalAnalysis,
    addCause,
    deleteCause,
    listCausalAnalyses,
    listCauses,
    type CausalAnalysisDTO,
    type CausalMethod,
    type CauseDTO,
    type CauseLevel,
} from '../../services/ErrorManagementService';
import { errorNotification, successNotification, extractErrorMessage } from '../../utility/NotificationUtility';
import {
    CAUSAL_METHOD_HELP,
    CAUSAL_METHOD_LABELS,
    CAUSE_LEVEL_LABELS,
    CAUSE_LEVEL_ORDER,
    ISHIKAWA_6M,
    NAVY,
} from './errorManagementLabels';
import { CauseLevelChip } from './ErrorChips';

const METHOD_ICON: Record<CausalMethod, React.ReactNode> = {
    FIVE_WHYS: <IconHelpCircle size={15} stroke={1.8} />,
    ISHIKAWA: <IconFishHook size={15} stroke={1.8} />,
    CAUSE_TREE: <IconBinaryTree2 size={15} stroke={1.8} />,
    ICAM: <IconSitemap size={15} stroke={1.8} />,
};

const ALL_METHODS: CausalMethod[] = ['FIVE_WHYS', 'ISHIKAWA', 'CAUSE_TREE', 'ICAM'];

interface RcaAssistantProps {
    eventId: number;
    /** false si l'utilisateur n'a pas le droit de modifier (ex. lecture seule). */
    canEdit: boolean;
}

const RcaAssistant = ({ eventId, canEdit }: RcaAssistantProps) => {
    const [analyses, setAnalyses] = useState<CausalAnalysisDTO[]>([]);
    const [causesByAnalysis, setCausesByAnalysis] = useState<Record<number, CauseDTO[]>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [activeId, setActiveId] = useState<number | null>(null);

    // Création d'une nouvelle analyse
    const [newMethod, setNewMethod] = useState<CausalMethod>('FIVE_WHYS');
    const [newSummary, setNewSummary] = useState<string>('');
    const [creating, setCreating] = useState<boolean>(false);

    const loadAll = useCallback(async () => {
        try {
            const list = await listCausalAnalyses(eventId);
            setAnalyses(list);
            const entries = await Promise.all(
                list
                    .filter((a) => a.id != null)
                    .map(async (a) => {
                        const causes = await listCauses(a.id as number);
                        return [a.id as number, causes] as const;
                    }),
            );
            const map: Record<number, CauseDTO[]> = {};
            entries.forEach(([id, causes]) => {
                map[id] = causes;
            });
            setCausesByAnalysis(map);
            if (list.length > 0 && list[0].id != null) {
                setActiveId((prev) => prev ?? (list[0].id as number));
            }
        } catch (err) {
            errorNotification(extractErrorMessage(err, "Impossible de charger l'analyse causale."));
        }
    }, [eventId]);

    useEffect(() => {
        setLoading(true);
        loadAll().finally(() => setLoading(false));
    }, [loadAll]);

    const handleCreateAnalysis = useCallback(async () => {
        setCreating(true);
        try {
            const created = await addCausalAnalysis(eventId, {
                method: newMethod,
                summary: newSummary.trim() || null,
            });
            successNotification(`Analyse « ${CAUSAL_METHOD_LABELS[newMethod]} » créée.`);
            setNewSummary('');
            if (created.id != null) {
                setActiveId(created.id);
                setCausesByAnalysis((prev) => ({ ...prev, [created.id as number]: [] }));
            }
            await loadAll();
        } catch (e: any) {
            errorNotification(
                e?.response?.status === 403
                    ? 'Accès refusé : action réservée aux administrateurs.'
                    : "La création de l'analyse a échoué.",
            );
        } finally {
            setCreating(false);
        }
    }, [eventId, newMethod, newSummary, loadAll]);

    const handleAddCause = useCallback(
        async (analysisId: number, payload: CauseDTO) => {
            try {
                await addCause(analysisId, payload);
                const causes = await listCauses(analysisId);
                setCausesByAnalysis((prev) => ({ ...prev, [analysisId]: causes }));
            } catch (e: any) {
                errorNotification(
                    e?.response?.status === 403
                        ? 'Accès refusé : action réservée aux administrateurs.'
                        : "L'ajout de la cause a échoué.",
                );
            }
        },
        [],
    );

    const handleDeleteCause = useCallback(
        async (analysisId: number, causeId: number) => {
            try {
                await deleteCause(causeId);
                setCausesByAnalysis((prev) => ({
                    ...prev,
                    [analysisId]: (prev[analysisId] ?? []).filter((c) => c.id !== causeId),
                }));
            } catch (err) {
                errorNotification(extractErrorMessage(err, 'La suppression de la cause a échoué.'));
            }
        },
        [],
    );

    const activeAnalysis = useMemo(
        () => analyses.find((a) => a.id === activeId) ?? null,
        [analyses, activeId],
    );
    const activeCauses = activeId != null ? causesByAnalysis[activeId] ?? [] : [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <Loader color={NAVY} size="sm" />
                <p className="text-[12.5px] text-slate-500 mt-3">Chargement de l'analyse causale…</p>
            </div>
        );
    }

    return (
        <div>
            {/* Création d'une analyse */}
            {canEdit && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                    <p className="text-[13px] font-semibold text-slate-800 mb-2">Lancer une analyse causale</p>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select
                            label="Méthode"
                            value={newMethod}
                            onChange={(v) => v && setNewMethod(v as CausalMethod)}
                            data={ALL_METHODS.map((m) => ({ value: m, label: CAUSAL_METHOD_LABELS[m] }))}
                            w={200}
                            allowDeselect={false}
                        />
                        <TextInput
                            label="Synthèse (optionnel)"
                            placeholder="Objet ou périmètre de l'analyse"
                            value={newSummary}
                            onChange={(e) => setNewSummary(e.currentTarget.value)}
                            className="flex-1 min-w-[200px]"
                        />
                        <Button
                            leftSection={<IconPlus size={15} />}
                            loading={creating}
                            onClick={handleCreateAnalysis}
                            styles={{ root: { backgroundColor: NAVY } }}
                        >
                            Créer l'analyse
                        </Button>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-2 leading-snug">{CAUSAL_METHOD_HELP[newMethod]}</p>
                </div>
            )}

            {analyses.length === 0 ? (
                <div className="text-center py-8 text-[12.5px] text-slate-500">
                    Aucune analyse causale pour l'instant.
                    {canEdit && ' Choisissez une méthode ci-dessus pour démarrer.'}
                </div>
            ) : (
                <>
                    {/* Onglets d'analyses */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {analyses.map((a) => {
                            const isActive = a.id === activeId;
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => a.id != null && setActiveId(a.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-[12px] font-medium border transition ${
                                        isActive
                                            ? 'text-white border-transparent shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                    style={isActive ? { backgroundColor: NAVY } : undefined}
                                >
                                    {METHOD_ICON[a.method]}
                                    {CAUSAL_METHOD_LABELS[a.method]}
                                    <span
                                        className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded text-[10px] ${
                                            isActive ? 'bg-white/25' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {a.id != null ? (causesByAnalysis[a.id]?.length ?? 0) : 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {activeAnalysis && activeId != null && (
                        <div>
                            {activeAnalysis.summary && (
                                <p className="text-[12.5px] text-slate-600 italic mb-3 border-l-2 border-slate-200 pl-3">
                                    {activeAnalysis.summary}
                                </p>
                            )}
                            <MethodCanvas
                                method={activeAnalysis.method}
                                analysisId={activeId}
                                causes={activeCauses}
                                canEdit={canEdit}
                                onAdd={handleAddCause}
                                onDelete={handleDeleteCause}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
//  Rendu spécifique par méthode
// ─────────────────────────────────────────────────────────────────────────

interface MethodCanvasProps {
    method: CausalMethod;
    analysisId: number;
    causes: CauseDTO[];
    canEdit: boolean;
    onAdd: (analysisId: number, payload: CauseDTO) => Promise<void>;
    onDelete: (analysisId: number, causeId: number) => Promise<void>;
}

const CauseRow = ({
    cause,
    canEdit,
    onDelete,
    showLevel = true,
    showCategory = false,
}: {
    cause: CauseDTO;
    canEdit: boolean;
    onDelete: () => void;
    showLevel?: boolean;
    showCategory?: boolean;
}) => (
    <div className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
        <div className="min-w-0 flex-1">
            <p className="text-[12.5px] text-slate-800">{cause.label}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {showLevel && cause.level && <CauseLevelChip level={cause.level} />}
                {showCategory && cause.category && (
                    <span className="text-[10.5px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                        {cause.category}
                    </span>
                )}
            </div>
        </div>
        {canEdit && (
            <button
                type="button"
                onClick={onDelete}
                className="text-slate-400 hover:text-red-600 transition flex-shrink-0 p-1"
                aria-label="Supprimer la cause"
            >
                <IconTrash size={15} stroke={1.7} />
            </button>
        )}
    </div>
);

const MethodCanvas = ({ method, analysisId, causes, canEdit, onAdd, onDelete }: MethodCanvasProps) => {
    // État partagé pour l'ajout
    const [label, setLabel] = useState<string>('');
    const [level, setLevel] = useState<CauseLevel>('IMMEDIATE');
    const [category, setCategory] = useState<string>(ISHIKAWA_6M[0]);
    const [parentId, setParentId] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    const submit = useCallback(
        async (payload: CauseDTO) => {
            if (!payload.label.trim()) {
                errorNotification('Le libellé de la cause est requis.');
                return;
            }
            setSubmitting(true);
            await onAdd(analysisId, payload);
            setLabel('');
            setParentId('');
            setSubmitting(false);
        },
        [analysisId, onAdd],
    );

    // ─── 5 POURQUOI : chaîne séquentielle ───
    if (method === 'FIVE_WHYS') {
        const ordered = causes; // ordre d'insertion (id croissant)
        return (
            <div>
                <div className="space-y-2">
                    {ordered.length === 0 && (
                        <p className="text-[12.5px] text-slate-500 py-2">
                            Aucun « pourquoi » saisi. Posez la première question pour démarrer la chaîne.
                        </p>
                    )}
                    {ordered.map((c, i) => (
                        <div key={c.id} className="flex items-start gap-2">
                            <span
                                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold mt-0.5"
                                style={{ backgroundColor: NAVY }}
                            >
                                {i + 1}
                            </span>
                            <div className="flex-1">
                                <p className="text-[10.5px] uppercase tracking-wide text-slate-400 font-semibold">
                                    Pourquoi ? Niveau {c.level ? CAUSE_LEVEL_LABELS[c.level] : 'à évaluer'}
                                </p>
                                <CauseRow
                                    cause={c}
                                    canEdit={canEdit}
                                    onDelete={() => c.id != null && onDelete(analysisId, c.id)}
                                    showLevel={false}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {canEdit && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-end gap-2">
                            <TextInput
                                label={`Pourquoi n°${causes.length + 1}`}
                                placeholder="Parce que…"
                                value={label}
                                onChange={(e) => setLabel(e.currentTarget.value)}
                                className="flex-1 min-w-[220px]"
                            />
                            <Select
                                label="Niveau"
                                value={level}
                                onChange={(v) => v && setLevel(v as CauseLevel)}
                                data={CAUSE_LEVEL_ORDER.map((l) => ({ value: l, label: CAUSE_LEVEL_LABELS[l] }))}
                                w={170}
                                allowDeselect={false}
                            />
                            <Button
                                leftSection={<IconChevronRight size={15} />}
                                loading={submitting}
                                onClick={() => submit({ label, level })}
                                styles={{ root: { backgroundColor: NAVY } }}
                            >
                                Ajouter
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── ISHIKAWA 6M : causes par famille ───
    if (method === 'ISHIKAWA') {
        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ISHIKAWA_6M.map((fam) => {
                        const inFam = causes.filter((c) => (c.category ?? '') === fam);
                        return (
                            <div key={fam} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                <div
                                    className="px-3 py-2 text-[12px] font-semibold text-white"
                                    style={{ backgroundColor: NAVY }}
                                >
                                    {fam}
                                    <span className="ml-1.5 text-white/70 font-normal">({inFam.length})</span>
                                </div>
                                <div className="p-2 space-y-1.5">
                                    {inFam.length === 0 ? (
                                        <p className="text-[11.5px] text-slate-400 px-1 py-1">Aucune cause.</p>
                                    ) : (
                                        inFam.map((c) => (
                                            <CauseRow
                                                key={c.id}
                                                cause={c}
                                                canEdit={canEdit}
                                                onDelete={() => c.id != null && onDelete(analysisId, c.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {canEdit && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-end gap-2">
                            <Select
                                label="Famille (6M)"
                                value={category}
                                onChange={(v) => v && setCategory(v)}
                                data={ISHIKAWA_6M.map((f) => ({ value: f, label: f }))}
                                w={180}
                                allowDeselect={false}
                            />
                            <Select
                                label="Niveau"
                                value={level}
                                onChange={(v) => v && setLevel(v as CauseLevel)}
                                data={CAUSE_LEVEL_ORDER.map((l) => ({ value: l, label: CAUSE_LEVEL_LABELS[l] }))}
                                w={170}
                                allowDeselect={false}
                            />
                            <TextInput
                                label="Cause"
                                placeholder="Décrire la cause"
                                value={label}
                                onChange={(e) => setLabel(e.currentTarget.value)}
                                className="flex-1 min-w-[200px]"
                            />
                            <Button
                                leftSection={<IconPlus size={15} />}
                                loading={submitting}
                                onClick={() => submit({ label, level, category })}
                                styles={{ root: { backgroundColor: NAVY } }}
                            >
                                Ajouter
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── ARBRE / ICAM : liste hiérarchique regroupée par niveau ───
    return (
        <div>
            <div className="space-y-4">
                {CAUSE_LEVEL_ORDER.map((lvl) => {
                    const inLevel = causes.filter((c) => c.level === lvl);
                    return (
                        <div key={lvl}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <CauseLevelChip level={lvl} />
                                <span className="text-[11px] text-slate-400">{inLevel.length} cause(s)</span>
                            </div>
                            {inLevel.length === 0 ? (
                                <p className="text-[11.5px] text-slate-400 pl-1">Aucune cause à ce niveau.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {inLevel.map((c) => {
                                        const parent = c.parentCauseId
                                            ? causes.find((p) => p.id === c.parentCauseId)
                                            : null;
                                        return (
                                            <div key={c.id} className={parent ? 'ml-5 border-l-2 border-slate-200 pl-3' : ''}>
                                                {parent && (
                                                    <p className="text-[10.5px] text-slate-400 mb-0.5">
                                                        ↳ rattachée à « {parent.label} »
                                                    </p>
                                                )}
                                                <CauseRow
                                                    cause={c}
                                                    canEdit={canEdit}
                                                    onDelete={() => c.id != null && onDelete(analysisId, c.id)}
                                                    showCategory
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {canEdit && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-end gap-2">
                        <TextInput
                            label="Cause / facteur"
                            placeholder="Décrire la cause ou le facteur"
                            value={label}
                            onChange={(e) => setLabel(e.currentTarget.value)}
                            className="flex-1 min-w-[220px]"
                        />
                        <Select
                            label="Niveau"
                            value={level}
                            onChange={(v) => v && setLevel(v as CauseLevel)}
                            data={CAUSE_LEVEL_ORDER.map((l) => ({ value: l, label: CAUSE_LEVEL_LABELS[l] }))}
                            w={170}
                            allowDeselect={false}
                        />
                        <TextInput
                            label="Catégorie (optionnel)"
                            placeholder="Ex. : barrière, défense…"
                            value={category}
                            onChange={(e) => setCategory(e.currentTarget.value)}
                            w={180}
                        />
                        <Select
                            label="Cause parente (optionnel)"
                            value={parentId}
                            onChange={(v) => setParentId(v ?? '')}
                            data={causes
                                .filter((c) => c.id != null)
                                .map((c) => ({ value: String(c.id), label: c.label }))}
                            w={200}
                            clearable
                            searchable
                            nothingFoundMessage="Aucune cause"
                        />
                        <Button
                            leftSection={<IconPlus size={15} />}
                            loading={submitting}
                            onClick={() =>
                                submit({
                                    label,
                                    level,
                                    category: category.trim() || null,
                                    parentCauseId: parentId ? Number(parentId) : null,
                                })
                            }
                            styles={{ root: { backgroundColor: NAVY } }}
                        >
                            Ajouter
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RcaAssistant;
