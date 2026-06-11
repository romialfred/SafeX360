import { useEffect, useMemo, useState } from "react";
import { Badge, Button, NumberInput, Table, Textarea, TextInput, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDispatch, useSelector } from "react-redux";
import { modals } from "@mantine/modals";
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconCalendarStats,
    IconChartBar,
    IconCircleCheck,
    IconClipboardList,
    IconEdit,
    IconGauge,
    IconListCheck,
    IconPlus,
    IconRosetteDiscountCheck,
    IconScale,
    IconTrash,
} from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import FormSection from "../../UtilityComp/FormSection";
import StatCard from "../../UtilityComp/StatCard";
import EmptyState from "../../UtilityComp/EmptyState";
import SegmentedFilter from "../../UtilityComp/SegmentedFilter";
import IsoBadge from "../../UtilityComp/IsoBadge";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { formatDateShort } from "../../../utility/DateFormats";
import {
    approveAuditProgram,
    createAuditProgram,
    deleteAuditProgram,
    getAllAuditPrograms,
    getProgramKpis,
    getProgramRiskSuggestions,
    updateAuditProgram,
    AuditProgramDTO,
    AuditProgramKpisDTO,
    RiskSuggestionDTO,
} from "../../../services/AuditIsoService";
import {
    auditIsoErrorMessage,
    obsClassificationColor,
    obsClassificationLabel,
    programStatusColor,
    programStatusLabel,
    riskScoreChip,
    SUGGESTED_FREQUENCY_COLORS,
    SUGGESTED_FREQUENCY_LABELS,
} from "./auditLabels";

/**
 * AuditProgramPage — LOT 52 Module B : programme d'audit annuel (ISO 19011 §5).
 *
 * Liste des programmes par année (cartes statut / objectifs / compteurs),
 * création-édition en panneau pleine page (pas de modal), approbation par la
 * direction, et pour le programme sélectionné : priorisation des domaines par
 * les risques (§5.4.2) et indicateurs de surveillance (§5.6).
 */

type PageMode = 'list' | 'create' | 'edit';

const AuditProgramPage = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);

    const [programs, setPrograms] = useState<AuditProgramDTO[]>([]);
    const [kpisMap, setKpisMap] = useState<Record<number, AuditProgramKpisDTO>>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [riskSuggestions, setRiskSuggestions] = useState<RiskSuggestionDTO[]>([]);
    const [mode, setMode] = useState<PageMode>('list');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const selectedProgram = useMemo(
        () => programs.find((p) => p.id === selectedId) ?? null,
        [programs, selectedId],
    );
    const selectedKpis = selectedId != null ? kpisMap[selectedId] : undefined;

    const form = useForm({
        initialValues: {
            id: null as number | null,
            year: new Date().getFullYear() as number | null,
            title: "",
            objectives: "",
            scope: "",
            resources: "",
        },
        validate: {
            year: (value) => (value ? null : "L'année est requise"),
            title: (value) => (value?.trim() ? null : "Le titre est requis"),
            objectives: (value) => (value?.trim() ? null : "Les objectifs sont requis"),
        },
    });

    // ─── Chargements ─────────────────────────────────────────────────────────

    const fetchPrograms = (preserveSelection = false) => {
        dispatch(showOverlay());
        getAllAuditPrograms()
            .then((res) => {
                const sorted = [...res].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
                setPrograms(sorted);
                if (!preserveSelection) {
                    setSelectedId(sorted.length > 0 ? sorted[0].id ?? null : null);
                }
                // Compteurs des cartes : KPI de chaque programme (peu nombreux — 1/an).
                Promise.allSettled(
                    sorted.map((p) =>
                        getProgramKpis(p.id as number).then((kpis) => ({ id: p.id as number, kpis }))
                    )
                ).then((results) => {
                    const map: Record<number, AuditProgramKpisDTO> = {};
                    results.forEach((r) => {
                        if (r.status === 'fulfilled') map[r.value.id] = r.value.kpis;
                    });
                    setKpisMap(map);
                });
            })
            .catch((_err) => setPrograms([]))
            .finally(() => dispatch(hideOverlay()));
    };

    useEffect(() => { fetchPrograms(); }, []);

    useEffect(() => {
        if (selectedId == null) {
            setRiskSuggestions([]);
            return;
        }
        getProgramRiskSuggestions(selectedId)
            .then((res) => setRiskSuggestions(res))
            .catch((_err) => setRiskSuggestions([]));
    }, [selectedId]);

    // ─── Actions ─────────────────────────────────────────────────────────────

    const openCreate = () => {
        form.setValues({
            id: null,
            year: new Date().getFullYear(),
            title: "",
            objectives: "",
            scope: "",
            resources: "",
        });
        form.clearErrors();
        setMode('create');
    };

    const openEdit = (program: AuditProgramDTO) => {
        form.setValues({
            id: program.id ?? null,
            year: program.year ?? new Date().getFullYear(),
            title: program.title ?? "",
            objectives: program.objectives ?? "",
            scope: program.scope ?? "",
            resources: program.resources ?? "",
        });
        form.clearErrors();
        setMode('edit');
    };

    const handleSave = () => {
        form.validate();
        if (!form.isValid()) return;
        const values = form.values;
        const isEdit = mode === 'edit' && values.id != null;
        const original = isEdit ? programs.find((p) => p.id === values.id) : null;
        const payload: AuditProgramDTO = {
            id: values.id,
            year: values.year,
            title: values.title.trim(),
            objectives: values.objectives,
            scope: values.scope,
            resources: values.resources,
            status: original?.status ?? null,
            companyId: original?.companyId ?? null,
        };

        dispatch(showOverlay());
        const call = isEdit ? updateAuditProgram(payload) : createAuditProgram(payload);
        call
            .then((res) => {
                successNotification(isEdit ? "Programme d'audit mis à jour" : "Programme d'audit créé");
                setMode('list');
                if (!isEdit && typeof res === 'number') setSelectedId(res);
                fetchPrograms(true);
            })
            .catch((err) => {
                errorNotification(auditIsoErrorMessage(err, "L'enregistrement du programme a échoué"));
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const handleApprove = (program: AuditProgramDTO) => {
        modals.openConfirmModal({
            title: <span className="text-base">Approuver le programme</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Approuver le programme d'audit {program.year} « {program.title} » ?
                    Cette approbation engage la direction sur les objectifs et ressources du programme.
                </span>
            ),
            labels: { confirm: "Oui, approuver", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            onConfirm: () => {
                const approvedBy = Number(user?.empId ?? user?.id ?? 0) || null;
                dispatch(showOverlay());
                approveAuditProgram(program.id as number, approvedBy)
                    .then(() => {
                        successNotification("Programme d'audit approuvé");
                        fetchPrograms(true);
                    })
                    .catch((err) => {
                        errorNotification(auditIsoErrorMessage(err, "L'approbation a échoué"));
                    })
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    const handleDelete = (program: AuditProgramDTO) => {
        modals.openConfirmModal({
            title: <span className="text-base">Supprimer le programme</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Supprimer définitivement le programme d'audit {program.year} « {program.title} » ?
                </span>
            ),
            labels: { confirm: "Oui, supprimer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "red", variant: "filled" },
            onConfirm: () => {
                dispatch(showOverlay());
                deleteAuditProgram(program.id as number)
                    .then(() => {
                        successNotification("Programme d'audit supprimé");
                        if (selectedId === program.id) setSelectedId(null);
                        fetchPrograms(true);
                    })
                    .catch((err) => {
                        errorNotification(auditIsoErrorMessage(err, "La suppression a échoué"));
                    })
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    // ─── Filtre statut ───────────────────────────────────────────────────────

    const countByStatus = (status: string) =>
        programs.filter((p) => String(p.status) === status).length;

    const filteredPrograms = useMemo(
        () => (statusFilter === 'ALL' ? programs : programs.filter((p) => String(p.status) === statusFilter)),
        [programs, statusFilter],
    );

    // ─── Rendus ──────────────────────────────────────────────────────────────

    const renderProgramCard = (program: AuditProgramDTO) => {
        const isSelected = program.id === selectedId;
        const kpis = program.id != null ? kpisMap[program.id] : undefined;
        return (
            <div
                key={program.id}
                onClick={() => setSelectedId(program.id ?? null)}
                className={`cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
                    isSelected ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md' : 'border-slate-200 shadow-sm'
                }`}
            >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 ring-1 ring-indigo-100 text-indigo-700 tabular-nums"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '15px' }}
                        >
                            {program.year}
                        </span>
                        <div className="min-w-0">
                            <p
                                className="text-slate-800 leading-snug truncate"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: '15.5px' }}
                            >
                                {program.title}
                            </p>
                            <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">
                                {program.objectives || 'Aucun objectif renseigné'}
                            </p>
                        </div>
                    </div>
                    <Badge color={programStatusColor(program.status)} variant="light" radius="sm">
                        {programStatusLabel(program.status)}
                    </Badge>
                </div>

                {/* Compteurs du programme */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[12px] text-slate-600 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                        <IconClipboardList size={14} className="text-indigo-500" />
                        {kpis ? `${kpis.totalAudits} audit${kpis.totalAudits > 1 ? 's' : ''}` : '— audits'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <IconCircleCheck size={14} className="text-emerald-500" />
                        {kpis ? `${kpis.realises} réalisé${kpis.realises > 1 ? 's' : ''} (${kpis.tauxRealisation}%)` : '— réalisés'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <IconAlertTriangle size={14} className="text-rose-500" />
                        {kpis ? `${kpis.actionsEnRetard} action${kpis.actionsEnRetard > 1 ? 's' : ''} en retard` : '— en retard'}
                    </span>
                    {program.status === 'APPROVED' && program.approvedAt && (
                        <span className="text-slate-400">Approuvé le {formatDateShort(program.approvedAt)}</span>
                    )}
                </div>

                {/* Actions de la carte */}
                <div className="flex items-center justify-end gap-2 mt-3">
                    {program.status === 'PROPOSED' && (
                        <>
                            <Button
                                size="xs"
                                color="indigo"
                                leftSection={<IconRosetteDiscountCheck size={14} />}
                                onClick={(e) => { e.stopPropagation(); handleApprove(program); }}
                            >
                                Approuver
                            </Button>
                            <Button
                                size="xs"
                                variant="light"
                                color="indigo"
                                leftSection={<IconEdit size={14} />}
                                onClick={(e) => { e.stopPropagation(); openEdit(program); }}
                            >
                                Modifier
                            </Button>
                            <Button
                                size="xs"
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={(e) => { e.stopPropagation(); handleDelete(program); }}
                            >
                                Supprimer
                            </Button>
                        </>
                    )}
                    {program.status !== 'PROPOSED' && (
                        <Button
                            size="xs"
                            variant="light"
                            color="indigo"
                            leftSection={<IconEdit size={14} />}
                            onClick={(e) => { e.stopPropagation(); openEdit(program); }}
                        >
                            Modifier
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const renderRiskSection = () => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
                <IconScale size={18} className="text-indigo-600" />
                <h3
                    className="text-slate-900"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: '16px' }}
                >
                    Priorisation par les risques
                </h3>
            </div>
            <p className="text-[12.5px] text-slate-500 mb-4">
                Score = non-conformités ouvertes × 2 + mois depuis le dernier audit clôturé (plafonné à 24) — approche ISO 19011 §5.4.2.
            </p>

            {riskSuggestions.length === 0 ? (
                <EmptyState
                    compact
                    icon={<IconScale size={20} />}
                    title="Aucun domaine à prioriser"
                    description="Les suggestions apparaîtront dès que des domaines d'audit seront paramétrés pour cette société."
                />
            ) : (
                <Table verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th className="!text-[12px] !text-slate-500">Domaine d'audit</Table.Th>
                            <Table.Th className="!text-[12px] !text-slate-500 !text-center">NC ouvertes</Table.Th>
                            <Table.Th className="!text-[12px] !text-slate-500 !text-center">Dernier audit (mois)</Table.Th>
                            <Table.Th className="!text-[12px] !text-slate-500 !text-center">Score de risque</Table.Th>
                            <Table.Th className="!text-[12px] !text-slate-500 !text-center">Fréquence suggérée</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {riskSuggestions.map((s) => (
                            <Table.Tr key={s.areaId}>
                                <Table.Td className="text-sm text-slate-800">{s.areaName}</Table.Td>
                                <Table.Td className="text-center text-sm tabular-nums">{s.openNonConformities}</Table.Td>
                                <Table.Td className="text-center text-sm tabular-nums">
                                    {s.monthsSinceLastClosedAudit >= 24 ? '24+' : s.monthsSinceLastClosedAudit}
                                </Table.Td>
                                <Table.Td className="text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[44px] px-2 py-0.5 rounded-md border text-[12.5px] tabular-nums ${riskScoreChip(s.score)}`}>
                                        {s.score}
                                    </span>
                                </Table.Td>
                                <Table.Td className="text-center">
                                    <Badge
                                        color={SUGGESTED_FREQUENCY_COLORS[s.suggestedFrequency] ?? 'gray'}
                                        variant="light"
                                        radius="sm"
                                    >
                                        {SUGGESTED_FREQUENCY_LABELS[s.suggestedFrequency] ?? s.suggestedFrequency}
                                    </Badge>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </div>
    );

    const renderKpiSection = () => {
        const kpis = selectedKpis;
        const classifications = Object.entries(kpis?.constatsParClassification ?? {});
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                    <IconGauge size={18} className="text-indigo-600" />
                    <h3
                        className="text-slate-900"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: '16px' }}
                    >
                        Surveillance du programme
                    </h3>
                </div>
                <p className="text-[12.5px] text-slate-500 mb-4">
                    Indicateurs de pilotage ISO 19011 §5.6 — réalisation, constats, actions et efficacité.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="Taux de réalisation des audits"
                        value={kpis ? kpis.tauxRealisation : null}
                        suffix="%"
                        icon={<IconChartBar size={18} />}
                        color="teal"
                        badge={kpis ? `${kpis.realises}/${kpis.totalAudits}` : undefined}
                        tooltip="Audits clôturés rapportés au total des audits de l'année du programme"
                    />
                    <StatCard
                        label="Actions ouvertes"
                        value={kpis ? kpis.actionsOuvertes : null}
                        icon={<IconListCheck size={18} />}
                        color="indigo"
                    />
                    <StatCard
                        label="Actions en retard"
                        value={kpis ? kpis.actionsEnRetard : null}
                        icon={<IconAlertTriangle size={18} />}
                        color="red"
                        tooltip="Recommandations non terminées dont l'échéance est dépassée"
                    />
                    <StatCard
                        label="Vérifications d'efficacité en attente"
                        value={kpis ? kpis.verificationsEfficacitePendantes : null}
                        icon={<IconCalendarStats size={18} />}
                        color="violet"
                        tooltip="Vérifications planifiées (ISO 19011 §6.6) sans verdict enregistré"
                    />
                </div>

                {/* Constats par classification ISO */}
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-600 mb-3">Constats par classification ISO 19011</p>
                    {classifications.length === 0 ? (
                        <p className="text-[12.5px] text-slate-400 italic">Aucun constat enregistré sur les audits de ce programme.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {classifications.map(([classification, count]) => (
                                <Badge
                                    key={classification}
                                    color={classification === 'NON_CLASSE' ? 'gray' : obsClassificationColor(classification)}
                                    variant="light"
                                    radius="sm"
                                    size="lg"
                                    rightSection={<span className="tabular-nums">{count}</span>}
                                >
                                    {classification === 'NON_CLASSE' ? 'Non classé' : obsClassificationLabel(classification)}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {kpis && Object.keys(kpis.constatsParClause ?? {}).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-600 mb-2">Clauses les plus citées</p>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(kpis.constatsParClause).map(([clause, count]) => (
                                    <Tooltip key={clause} label={`${count} constat${count > 1 ? 's' : ''}`} withArrow>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11.5px]">
                                            {clause}
                                            <span className="text-slate-400 tabular-nums">×{count}</span>
                                        </span>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderForm = () => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <FormSection
                title={mode === 'edit' ? "Modifier le programme d'audit" : "Nouveau programme d'audit"}
                description="Cadre annuel du programme : objectifs de la direction, périmètre couvert et ressources allouées (ISO 19011 §5.2 / §5.3)."
                columns={2}
                noDivider
            >
                <NumberInput
                    label="Année"
                    placeholder="2026"
                    min={2000}
                    max={2100}
                    withAsterisk
                    {...form.getInputProps('year')}
                />
                <TextInput
                    label="Titre du programme"
                    placeholder="Programme d'audits internes SSE 2026"
                    withAsterisk
                    {...form.getInputProps('title')}
                />
                <div className="md:col-span-2">
                    <Textarea
                        label="Objectifs du programme"
                        placeholder="Vérifier la conformité ISO, évaluer l'efficacité du système de management, préparer la certification..."
                        minRows={3}
                        autosize
                        withAsterisk
                        {...form.getInputProps('objectives')}
                    />
                </div>
                <div className="md:col-span-2">
                    <Textarea
                        label="Périmètre"
                        placeholder="Sites, processus et fonctions couverts par le programme"
                        minRows={2}
                        autosize
                        {...form.getInputProps('scope')}
                    />
                </div>
                <div className="md:col-span-2">
                    <Textarea
                        label="Ressources"
                        placeholder="Auditeurs internes mobilisés, budget, outils, temps alloué..."
                        minRows={2}
                        autosize
                        {...form.getInputProps('resources')}
                    />
                </div>
            </FormSection>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="default" onClick={() => setMode('list')}>Annuler</Button>
                <Button color="indigo" onClick={handleSave}>
                    {mode === 'edit' ? 'Enregistrer les modifications' : 'Créer le programme'}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des audits', to: '/audit-management' },
                    { label: "Programme d'audit" },
                ]}
                icon={<IconCalendarStats size={22} stroke={2} />}
                iconColor="indigo"
                title="Programme d'audit annuel"
                subtitle="Planification, approbation et surveillance du programme d'audits internes"
                badge={<IsoBadge norm="ISO 19011" />}
                actions={
                    mode === 'list' ? (
                        <Button
                            size="sm"
                            color="indigo"
                            leftSection={<IconPlus size={15} />}
                            onClick={openCreate}
                        >
                            Nouveau programme
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="default"
                            leftSection={<IconArrowLeft size={15} />}
                            onClick={() => setMode('list')}
                        >
                            Retour à la liste
                        </Button>
                    )
                }
            />

            {mode !== 'list' ? (
                renderForm()
            ) : (
                <>
                    <SegmentedFilter
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: 'ALL', label: 'Tous', count: programs.length, color: 'indigo' },
                            { value: 'PROPOSED', label: 'Proposés', count: countByStatus('PROPOSED'), color: 'violet' },
                            { value: 'APPROVED', label: 'Approuvés', count: countByStatus('APPROVED'), color: 'green' },
                            { value: 'CLOSED', label: 'Clôturés', count: countByStatus('CLOSED'), color: 'slate' },
                        ]}
                    />

                    {filteredPrograms.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                            <EmptyState
                                icon={<IconCalendarStats size={28} />}
                                iconColor="indigo"
                                title="Aucun programme d'audit"
                                description="Créez le programme annuel pour cadrer les objectifs, le périmètre et les ressources des audits internes."
                                action={
                                    <Button color="indigo" leftSection={<IconPlus size={15} />} onClick={openCreate}>
                                        Nouveau programme
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredPrograms.map(renderProgramCard)}
                        </div>
                    )}

                    {selectedProgram && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 pt-2">
                                <span
                                    className="text-slate-800"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: '17px' }}
                                >
                                    Pilotage — {selectedProgram.title} ({selectedProgram.year})
                                </span>
                                <Badge color={programStatusColor(selectedProgram.status)} variant="light" radius="sm">
                                    {programStatusLabel(selectedProgram.status)}
                                </Badge>
                            </div>
                            {renderKpiSection()}
                            {renderRiskSection()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditProgramPage;
