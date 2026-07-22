import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    TextInput,
    Textarea,
    Select,
    NumberInput,
    Checkbox,
    Loader,
    Badge,
    Tooltip,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconRotateClockwise,
    IconListCheck,
    IconClipboardList,
    IconCategory2,
    IconLock,
    IconChevronUp,
    IconChevronDown,
    IconGripVertical,
    IconDeviceFloppy,
    IconX,
    IconAlertTriangle,
} from '@tabler/icons-react';
import {
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deactivateTemplate,
    activateTemplate,
    type InspectionTemplateSummaryDTO,
    type InspectionTemplateDTO,
    type InspectionCheckpointDTO,
    type InspectionTemplateType,
    type CheckpointResponseType,
} from '../../../services/InspectionService';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';

/**
 * Administration des MODÈLES d'inspection (grilles de points de contrôle).
 *
 * Ce sont ces modèles qui s'affichent lors de la planification d'une inspection.
 * L'administrateur les définit ici : en-tête (nom, code, type, durée) + la liste
 * ordonnée des points de contrôle (chacun avec un type de réponse, criticité…).
 *
 * Cloisonnement : un modèle CRÉÉ ici est rattaché à la mine active (le serveur
 * le déduit du header, aucun sélecteur de mine dans le formulaire). Les modèles
 * du CATALOGUE GLOBAL (partagés) sont visibles mais NON éditables depuis une
 * mine (badge « Catalogue global », actions verrouillées) — le serveur le
 * refuserait de toute façon.
 */

const TYPES: { value: InspectionTemplateType; label: string }[] = [
    { value: 'EQUIPMENT', label: 'Équipement' },
    { value: 'LOCATION', label: 'Lieu' },
    { value: 'PROCEDURE', label: 'Procédure' },
];
const TYPE_LABEL: Record<InspectionTemplateType, string> = {
    EQUIPMENT: 'Équipement',
    LOCATION: 'Lieu',
    PROCEDURE: 'Procédure',
};

const RESPONSE_TYPES: { value: CheckpointResponseType; label: string }[] = [
    { value: 'BOOLEAN', label: 'Conforme / Non conforme' },
    { value: 'NUMERIC_RANGE', label: 'Valeur numérique (plage)' },
    { value: 'VISUAL_GRADE', label: 'Note visuelle' },
    { value: 'PHOTO_REQUIRED', label: 'Photo obligatoire' },
    { value: 'FREE_TEXT', label: 'Texte libre' },
];

type EditableCheckpoint = InspectionCheckpointDTO & { _key: string };

/** Brouillon d'édition : remplace checkpoints par leur variante éditable (avec _key). */
type TemplateDraft = Omit<InspectionTemplateDTO, 'checkpoints'> & { checkpoints: EditableCheckpoint[] };

const emptyCheckpoint = (): EditableCheckpoint => ({
    _key: `cp-${Math.random().toString(36).slice(2)}`,
    label: '',
    responseType: 'BOOLEAN',
    critical: false,
    required: true,
});

const emptyDraft = (): TemplateDraft => ({
    code: '',
    name: '',
    description: '',
    type: 'EQUIPMENT',
    scopeRef: '',
    estimatedDurationMin: undefined,
    active: true,
    checkpoints: [emptyCheckpoint()],
});

export default function InspectionTemplates() {
    const [templates, setTemplates] = useState<InspectionTemplateSummaryDTO[]>([]);
    const [loading, setLoading] = useState(false);

    // Éditeur inline (jamais une modale : formulaire à N champs).
    const [editing, setEditing] = useState<null | { id?: number }>(null);
    const [draft, setDraft] = useState<TemplateDraft>(emptyDraft());
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const reload = () => {
        setLoading(true);
        listTemplates(undefined, true)
            .then((list) => setTemplates(Array.isArray(list) ? list : []))
            .catch((e) => errorNotification(extractErrorMessage(e, 'Échec du chargement des modèles.')))
            .finally(() => setLoading(false));
    };
    useEffect(reload, []);

    const grouped = useMemo(() => {
        const g: Record<InspectionTemplateType, InspectionTemplateSummaryDTO[]> = {
            EQUIPMENT: [], LOCATION: [], PROCEDURE: [],
        };
        for (const t of templates) (g[t.type] ??= []).push(t);
        return g;
    }, [templates]);

    const startCreate = () => {
        setErrors([]);
        setDraft(emptyDraft());
        setEditing({});
    };

    const startEdit = async (tpl: InspectionTemplateSummaryDTO) => {
        setErrors([]);
        setEditing({ id: tpl.id });
        setLoadingDetail(true);
        try {
            const detail = await getTemplate(tpl.id);
            setDraft({
                ...detail,
                description: detail.description ?? '',
                scopeRef: detail.scopeRef ?? '',
                checkpoints: (detail.checkpoints ?? [])
                    .slice()
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                    .map((cp) => ({ ...cp, _key: `cp-${cp.id ?? Math.random().toString(36).slice(2)}` })),
            });
        } catch (e) {
            errorNotification(extractErrorMessage(e, 'Échec du chargement du modèle.'));
            setEditing(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cancelEdit = () => {
        setEditing(null);
        setErrors([]);
    };

    // ── Manipulation des points de contrôle ──
    const setCp = (key: string, patch: Partial<EditableCheckpoint>) =>
        setDraft((d) => ({ ...d, checkpoints: d.checkpoints.map((c) => (c._key === key ? { ...c, ...patch } : c)) }));
    const addCp = () => setDraft((d) => ({ ...d, checkpoints: [...d.checkpoints, emptyCheckpoint()] }));
    const removeCp = (key: string) =>
        setDraft((d) => ({ ...d, checkpoints: d.checkpoints.filter((c) => c._key !== key) }));
    const moveCp = (index: number, dir: -1 | 1) =>
        setDraft((d) => {
            const next = d.checkpoints.slice();
            const j = index + dir;
            if (j < 0 || j >= next.length) return d;
            [next[index], next[j]] = [next[j], next[index]];
            return { ...d, checkpoints: next };
        });

    const validate = (): string[] => {
        const e: string[] = [];
        if (!draft.name.trim()) e.push('Le nom du modèle est obligatoire.');
        if (!draft.code.trim()) e.push('Le code du modèle est obligatoire.');
        const cps = draft.checkpoints.filter((c) => c.label.trim());
        if (cps.length === 0) e.push('Ajoutez au moins un point de contrôle avec un intitulé.');
        return e;
    };

    const save = async () => {
        const e = validate();
        if (e.length) { setErrors(e); return; }
        setSaving(true);
        try {
            const payload: InspectionTemplateDTO = {
                code: draft.code.trim(),
                name: draft.name.trim(),
                description: draft.description?.trim() || undefined,
                type: draft.type,
                scopeRef: draft.scopeRef?.trim() || undefined,
                estimatedDurationMin: draft.estimatedDurationMin || undefined,
                active: draft.active ?? true,
                checkpoints: draft.checkpoints
                    .filter((c) => c.label.trim())
                    .map((c, i) => ({
                        id: c.id,
                        label: c.label.trim(),
                        helpText: c.helpText?.trim() || undefined,
                        responseType: c.responseType,
                        minValue: c.responseType === 'NUMERIC_RANGE' ? c.minValue : undefined,
                        maxValue: c.responseType === 'NUMERIC_RANGE' ? c.maxValue : undefined,
                        unit: c.responseType === 'NUMERIC_RANGE' ? (c.unit?.trim() || undefined) : undefined,
                        expectedValue: c.expectedValue?.toString().trim() || undefined,
                        displayOrder: i,
                        critical: c.critical === true,
                        required: c.required !== false,
                    })),
            };
            if (editing?.id) {
                await updateTemplate(editing.id, payload);
                successNotification('Modèle mis à jour.');
            } else {
                await createTemplate(payload);
                successNotification('Modèle créé.');
            }
            setEditing(null);
            reload();
        } catch (err) {
            errorNotification(extractErrorMessage(err, "Échec de l'enregistrement du modèle."));
        } finally {
            setSaving(false);
        }
    };

    const onDeactivate = async (tpl: InspectionTemplateSummaryDTO) => {
        try {
            await deactivateTemplate(tpl.id);
            successNotification('Modèle désactivé.');
            reload();
        } catch (e) {
            errorNotification(extractErrorMessage(e, 'Échec de la désactivation.'));
        }
    };
    const onActivate = async (tpl: InspectionTemplateSummaryDTO) => {
        try {
            await activateTemplate(tpl.id);
            successNotification('Modèle réactivé.');
            reload();
        } catch (e) {
            errorNotification(extractErrorMessage(e, 'Échec de la réactivation.'));
        }
    };

    const totalPoints = templates.reduce((a: number, t: any) => a + (t.checkpointCount ?? 0), 0);
    const catCount = TYPES.filter((t) => (grouped[t.value]?.length ?? 0) > 0).length;
    const STAT_TONE: Record<string, string> = {
        cyan: 'border-cyan-100 bg-cyan-50/60 text-cyan-700',
        violet: 'border-violet-100 bg-violet-50/60 text-violet-700',
        teal: 'border-teal-100 bg-teal-50/60 text-teal-700',
    };

    return (
        <div className="w-full">
            {/* Mini-tableau de bord + action */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                {!editing && !loading && templates.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5 flex-1 min-w-[280px] max-w-[560px]">
                        {[
                            { label: 'Modèles', value: templates.length, tone: 'cyan', Icon: IconClipboardList },
                            { label: 'Catégories', value: catCount, tone: 'violet', Icon: IconCategory2 },
                            { label: 'Points de contrôle', value: totalPoints, tone: 'teal', Icon: IconListCheck },
                        ].map((s, i) => (
                            <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2.5 ${STAT_TONE[s.tone]}`}>
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 border border-white/60 shrink-0">
                                    <s.Icon size={17} stroke={1.7} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[19px] leading-none font-semibold tabular-nums">{s.value}</p>
                                    <p className="text-[10.5px] uppercase tracking-wide text-slate-500 mt-1 truncate">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div />}
                {!editing && (
                    <Button leftSection={<IconPlus size={16} />} color="cyan" onClick={startCreate}>
                        Nouveau modèle
                    </Button>
                )}
            </div>

            {editing ? (
                <TemplateEditor
                    draft={draft}
                    setDraft={setDraft}
                    isEdit={!!editing.id}
                    loadingDetail={loadingDetail}
                    saving={saving}
                    errors={errors}
                    onCp={setCp}
                    onAddCp={addCp}
                    onRemoveCp={removeCp}
                    onMoveCp={moveCp}
                    onSave={save}
                    onCancel={cancelEdit}
                />
            ) : loading ? (
                <div className="flex items-center gap-2 text-slate-500 text-[13px] py-10 justify-center">
                    <Loader size="sm" /> Chargement des modèles…
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl">
                    <IconListCheck size={32} className="mx-auto text-slate-300" />
                    <p className="text-[13px] text-slate-500 mt-2">Aucun modèle défini pour l'instant.</p>
                    <Button variant="light" color="cyan" mt="sm" leftSection={<IconPlus size={15} />} onClick={startCreate}>
                        Créer le premier modèle
                    </Button>
                </div>
            ) : (
                <div className="space-y-5">
                    {TYPES.map(({ value }) => {
                        const list = grouped[value] ?? [];
                        if (list.length === 0) return null;
                        return (
                            <section key={value}>
                                <h2 className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-2">
                                    {TYPE_LABEL[value]} · {list.length}
                                </h2>
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {list.map((tpl) => (
                                        <TemplateCard
                                            key={tpl.id}
                                            tpl={tpl}
                                            onEdit={() => startEdit(tpl)}
                                            onDeactivate={() => onDeactivate(tpl)}
                                            onActivate={() => onActivate(tpl)}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function TemplateCard({
    tpl,
    onEdit,
    onDeactivate,
    onActivate,
}: {
    tpl: InspectionTemplateSummaryDTO;
    onEdit: () => void;
    onDeactivate: () => void;
    onActivate: () => void;
}) {
    const isGlobal = tpl.global === true;
    return (
        <div
            className={`rounded-xl border p-3 bg-white ${
                tpl.active ? 'border-slate-200' : 'border-slate-200 opacity-70'
            }`}
        >
            <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                    <IconListCheck size={18} stroke={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-slate-900 leading-tight">{tpl.name}</div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">{tpl.code}</div>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge size="xs" variant="light" color="cyan">
                    {tpl.checkpointCount} point{tpl.checkpointCount > 1 ? 's' : ''}
                </Badge>
                {tpl.estimatedDurationMin ? (
                    <Badge size="xs" variant="light" color="gray">{tpl.estimatedDurationMin} min</Badge>
                ) : null}
                {!tpl.active && <Badge size="xs" color="orange" variant="light">Désactivé</Badge>}
                {isGlobal && (
                    <Badge size="xs" color="grape" variant="light" leftSection={<IconLock size={9} />}>
                        Catalogue global
                    </Badge>
                )}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5">
                {isGlobal ? (
                    <Tooltip label="Modèle partagé — non modifiable depuis une mine" withArrow>
                        <span className="text-[11.5px] text-slate-400 inline-flex items-center gap-1">
                            <IconLock size={13} /> Lecture seule
                        </span>
                    </Tooltip>
                ) : (
                    <>
                        <Button size="compact-xs" variant="light" color="cyan" leftSection={<IconEdit size={13} />} onClick={onEdit}>
                            Modifier
                        </Button>
                        {tpl.active ? (
                            <Button size="compact-xs" variant="subtle" color="orange" leftSection={<IconTrash size={13} />} onClick={onDeactivate}>
                                Désactiver
                            </Button>
                        ) : (
                            <Button size="compact-xs" variant="subtle" color="teal" leftSection={<IconRotateClockwise size={13} />} onClick={onActivate}>
                                Réactiver
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function TemplateEditor({
    draft,
    setDraft,
    isEdit,
    loadingDetail,
    saving,
    errors,
    onCp,
    onAddCp,
    onRemoveCp,
    onMoveCp,
    onSave,
    onCancel,
}: {
    draft: TemplateDraft;
    setDraft: React.Dispatch<React.SetStateAction<TemplateDraft>>;
    isEdit: boolean;
    loadingDetail: boolean;
    saving: boolean;
    errors: string[];
    onCp: (key: string, patch: Partial<EditableCheckpoint>) => void;
    onAddCp: () => void;
    onRemoveCp: (key: string) => void;
    onMoveCp: (index: number, dir: -1 | 1) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    if (loadingDetail) {
        return (
            <div className="flex items-center gap-2 text-slate-500 text-[13px] py-10 justify-center">
                <Loader size="sm" /> Chargement du modèle…
            </div>
        );
    }
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-slate-900">
                    {isEdit ? 'Modifier le modèle' : 'Nouveau modèle'}
                </h2>
            </div>

            {errors.length > 0 && (
                <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
                    <ul className="list-disc pl-4 space-y-0.5">
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            {/* En-tête du modèle */}
            <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                    label="Nom du modèle"
                    withAsterisk
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.currentTarget.value }))}
                    placeholder="Ex. Atelier de maintenance"
                />
                <TextInput
                    label="Code"
                    withAsterisk
                    value={draft.code}
                    onChange={(e) => setDraft((d) => ({ ...d, code: e.currentTarget.value }))}
                    placeholder="Ex. INS-ATL-01"
                />
                <Select
                    label="Type d'objet inspecté"
                    data={TYPES}
                    value={draft.type}
                    onChange={(v) => v && setDraft((d) => ({ ...d, type: v as InspectionTemplateType }))}
                    allowDeselect={false}
                />
                <NumberInput
                    label="Durée estimée (min)"
                    min={0}
                    value={draft.estimatedDurationMin ?? ''}
                    onChange={(v) =>
                        setDraft((d) => ({ ...d, estimatedDurationMin: typeof v === 'number' ? v : undefined }))
                    }
                    placeholder="Optionnel"
                />
                <TextInput
                    label="Famille / portée (scopeRef)"
                    description="Optionnel — restreint le modèle à une famille d'équipements/lieux"
                    value={draft.scopeRef ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, scopeRef: e.currentTarget.value }))}
                    className="sm:col-span-2"
                />
                <Textarea
                    label="Description"
                    autosize
                    minRows={2}
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.currentTarget.value }))}
                    className="sm:col-span-2"
                />
                <Checkbox
                    label="Modèle actif (proposé à la planification)"
                    checked={draft.active ?? true}
                    onChange={(e) => setDraft((d) => ({ ...d, active: e.currentTarget.checked }))}
                    className="sm:col-span-2"
                />
            </div>

            {/* Points de contrôle */}
            <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-semibold text-slate-800">
                        Points de contrôle ({draft.checkpoints.length})
                    </h3>
                    <Button size="compact-sm" variant="light" color="cyan" leftSection={<IconPlus size={14} />} onClick={onAddCp}>
                        Ajouter un point
                    </Button>
                </div>
                <div className="space-y-2">
                    {draft.checkpoints.map((cp, index) => (
                        <div key={cp._key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                            <div className="flex items-start gap-2">
                                <div className="flex flex-col items-center pt-1 text-slate-300">
                                    <IconGripVertical size={14} />
                                </div>
                                <div className="flex-1 min-w-0 grid gap-2 sm:grid-cols-2">
                                    <TextInput
                                        size="xs"
                                        placeholder="Intitulé du point (ex. Éclairage suffisant au poste)"
                                        value={cp.label}
                                        onChange={(e) => onCp(cp._key, { label: e.currentTarget.value })}
                                        className="sm:col-span-2"
                                    />
                                    <Select
                                        size="xs"
                                        label="Type de réponse"
                                        data={RESPONSE_TYPES}
                                        value={cp.responseType}
                                        onChange={(v) => v && onCp(cp._key, { responseType: v as CheckpointResponseType })}
                                        allowDeselect={false}
                                    />
                                    <TextInput
                                        size="xs"
                                        label="Aide (optionnel)"
                                        value={cp.helpText ?? ''}
                                        onChange={(e) => onCp(cp._key, { helpText: e.currentTarget.value })}
                                    />
                                    {cp.responseType === 'NUMERIC_RANGE' && (
                                        <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                                            <NumberInput
                                                size="xs"
                                                label="Min"
                                                value={cp.minValue ?? ''}
                                                onChange={(v) => onCp(cp._key, { minValue: typeof v === 'number' ? v : undefined })}
                                            />
                                            <NumberInput
                                                size="xs"
                                                label="Max"
                                                value={cp.maxValue ?? ''}
                                                onChange={(v) => onCp(cp._key, { maxValue: typeof v === 'number' ? v : undefined })}
                                            />
                                            <TextInput
                                                size="xs"
                                                label="Unité"
                                                value={cp.unit ?? ''}
                                                onChange={(e) => onCp(cp._key, { unit: e.currentTarget.value })}
                                            />
                                        </div>
                                    )}
                                    <div className="sm:col-span-2 flex items-center gap-4 pt-0.5">
                                        <Checkbox
                                            size="xs"
                                            label={<span className="inline-flex items-center gap-1"><IconAlertTriangle size={12} className="text-amber-600" /> Critique</span>}
                                            checked={cp.critical === true}
                                            onChange={(e) => onCp(cp._key, { critical: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            size="xs"
                                            label="Obligatoire"
                                            checked={cp.required !== false}
                                            onChange={(e) => onCp(cp._key, { required: e.currentTarget.checked })}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <button type="button" onClick={() => onMoveCp(index, -1)} disabled={index === 0}
                                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30">
                                        <IconChevronUp size={14} />
                                    </button>
                                    <button type="button" onClick={() => onMoveCp(index, 1)} disabled={index === draft.checkpoints.length - 1}
                                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30">
                                        <IconChevronDown size={14} />
                                    </button>
                                    <button type="button" onClick={() => onRemoveCp(cp._key)}
                                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
                                        <IconTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                <Button variant="default" leftSection={<IconX size={15} />} onClick={onCancel} disabled={saving}>
                    Annuler
                </Button>
                <Button color="cyan" leftSection={<IconDeviceFloppy size={15} />} loading={saving} onClick={onSave}>
                    {isEdit ? 'Enregistrer' : 'Créer le modèle'}
                </Button>
            </div>
        </div>
    );
}
