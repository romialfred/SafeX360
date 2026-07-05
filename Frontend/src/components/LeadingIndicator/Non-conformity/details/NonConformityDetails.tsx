import { useEffect, useState } from 'react';
import {
    Button,
    Text,
    Tabs,
    Modal,
    Select,
    Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconEdit,
    IconTool,
    IconClock,
    IconFileText,
    IconTarget,
    IconSettings,
    IconLock,
    IconHistory,
    IconChevronRight,
    IconHome,
} from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eventStatuses } from '../../../../Data/DropdownData';
import { useForm } from '@mantine/form';
import { getEmployeeDropdown } from '../../../../services/EmployeeService';
import { useDisclosure } from '@mantine/hooks';
import NonConformityHistory from './NonConformityHistory';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { createNCHistory, getNCHistorybyNonConformityID } from '../../../../services/NonConFormityHistoryService';
import NonConformityTreatment from './NonConformityTreatment';
import NonConformityAnalysis from './NonConformityAnalysis';
import NonConformityOverview from './NonConformityOverview';
import { getEventAnalysisByNonConformityId, getNonConformity } from '../../../../services/NonConformityService';
import { getActionsByNonConformityId } from '../../../../services/CorrectiveActionService';
import { mapIdToName } from '../../../../utility/OtherUtilities';
import ActionPlansTab from './ActionPlanTab';
import { getAllLocations } from '../../../../services/LocationService';
import { GetAllWorkProcess } from '../../../../services/WorkProcessService';
import LifecycleTimeline from './LifecycleTimeline';
import { formatDateShort } from '../../../../utility/DateFormats';
import { useTranslation } from 'react-i18next';

/**
 * NonConformityDetails — Page détail premium d'un constat central (LOT 43b).
 *
 * Architecture senior :
 *   ┌─ Breadcrumb sobre ─────────────────────────────────────┐
 *   │ ┌─ HERO (severity border-L) ───────────────────────┐ │
 *   │ │  ● STATUS PILL                                    │ │
 *   │ │  NC-2025-002          (serif 28px)                │ │
 *   │ │  Titre du constat     (serif 20px)                │ │
 *   │ │  Détecté le X · par Y · Sévérité | Priorité       │ │
 *   │ │  ─── Timeline cycle de vie ──────────             │ │
 *   │ │                     [Gérer] [Éditer] [PDF]        │ │
 *   │ └───────────────────────────────────────────────────┘ │
 *   │  Synthèse · Analyse · Traitement · Actions⓷ · Journal │
 *   │  ──────                                                │
 *   │  [contenu de l'onglet actif]                           │
 *   └────────────────────────────────────────────────────────┘
 */

// ─── Mappings FR + palette HSE ───────────────────────────────────────────────

const STATUS_FR: Record<string, string> = {
    REPORTED: 'Déclaré',
    ANALYSIS: 'Analyse',
    AC_IMPLEMENTATION: 'Traitement',
    CLOSED: 'Clôturé',
    CANCELLED: 'Annulé',
    REJECTED: 'Rejeté',
};

const STATUS_TONE: Record<string, { dot: string; bg: string; text: string; borderL: string }> = {
    REPORTED:           { dot: 'bg-sky-500',     bg: 'bg-sky-50',     text: 'text-sky-700',     borderL: 'border-l-sky-500' },
    ANALYSIS:           { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   borderL: 'border-l-amber-500' },
    AC_IMPLEMENTATION:  { dot: 'bg-orange-500',  bg: 'bg-orange-50',  text: 'text-orange-700',  borderL: 'border-l-orange-500' },
    CLOSED:             { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', borderL: 'border-l-emerald-500' },
    CANCELLED:          { dot: 'bg-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-600',   borderL: 'border-l-slate-400' },
    REJECTED:           { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-700',     borderL: 'border-l-red-500' },
};

// LOT 43b — supporte FR (canon) + variantes EN renvoyées par certains endpoints.
// Toujours afficher la version FR dans l'UI via SEVERITY_LABEL_FR.
const SEVERITY_LABEL_FR: Record<string, string> = {
    'Insignifiante': 'Insignifiante', 'Insignificant': 'Insignifiante',
    'Mineure': 'Mineure',             'Minor': 'Mineure',
    'Modérée': 'Modérée',             'Moderate': 'Modérée',
    'Majeure': 'Majeure',             'Major': 'Majeure',
    'Catastrophique': 'Catastrophique', 'Catastrophic': 'Catastrophique',
};

const SEVERITY_TONE: Record<string, { bg: string; text: string; border: string; borderL: string }> = {
    'Insignifiante':  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', borderL: 'border-l-emerald-400' },
    'Mineure':        { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    borderL: 'border-l-teal-400' },
    'Modérée':        { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   borderL: 'border-l-amber-400' },
    'Majeure':        { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  borderL: 'border-l-orange-500' },
    'Catastrophique': { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     borderL: 'border-l-red-600' },
};

const PRIORITY_LABEL_FR: Record<string, string> = {
    'Urgente': 'Urgente', 'Urgent': 'Urgente', 'URGENT': 'Urgente',
    'Élevée': 'Élevée',   'High': 'Élevée',    'HIGH': 'Élevée',
    'Normale': 'Normale', 'Medium': 'Normale', 'MEDIUM': 'Normale', 'Normal': 'Normale',
    'Faible': 'Faible',   'Low': 'Faible',     'LOW': 'Faible',
};

const PRIORITY_TONE: Record<string, { bg: string; text: string; border: string }> = {
    'Urgente': { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
    'Élevée':  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
    'Normale': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
    'Faible':  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const STATUS_FR_OPTIONS = eventStatuses.map((opt) => ({
    value: opt.value,
    label: STATUS_FR[opt.value] || opt.label,
}));

// ─── Composant principal ─────────────────────────────────────────────────────

const NonConformityDetails = () => {
    const { t } = useTranslation(['nonConformity', 'common', 'navigation']);
    const [opened, { open, close }] = useDisclosure(false);
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<any>({});
    const dispatch = useDispatch();
    const [history, setHistory] = useState<any[]>([]);
    const { id } = useParams();
    const nonConformityId = Number(id);
    const [nonConformity, setNonConformity] = useState<any | null>({});
    const [analysis, setAnalysis] = useState<any | null>({});
    const [actions, setActions] = useState<any[]>([]);
    const [locationMap, setLocationMap] = useState<any>({});
    const [processMap, setProcessMap] = useState<any>({});
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(showOverlay());
        getNonConformity(id)
            .then((res) => {
                setNonConformity(res);
                form.setValues({
                    ...form.values,
                    status: res.status || '',
                    nonConformityId,
                });
            })
            .catch((err) => console.error(err))
            .finally(() => {
                dispatch(hideOverlay());
            });

        getEventAnalysisByNonConformityId(id).then((res) => setAnalysis(res)).catch((err) => console.error(err));
        getActionsByNonConformityId(Number(id)).then((res) => setActions(res)).catch((err) => console.error(err));

        getEmployeeDropdown()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id),
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));
            })
            .catch((err) => console.error(err));

        getAllLocations({}).then((res) => setLocationMap(mapIdToName(res))).catch((err) => console.error(err));
        GetAllWorkProcess({}).then((res) => setProcessMap(mapIdToName(res))).catch((err) => console.error(err));
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Form modal Gérer ────────────────────────────────────────────────────
    const form = useForm({
        initialValues: {
            ownerId: '',
            date: null as Date | null,
            status: '',
            comment: '',
            nonConformityId: nonConformityId,
        },
        validate: {
            ownerId: (value) => (value ? null : 'Le responsable est obligatoire'),
            date: (value) => (value ? null : 'La date est obligatoire'),
            status: (value) => (value ? null : 'Le statut est obligatoire'),
        },
    });

    // ─── Calculs statut ─────────────────────────────────────────────────────
    const normalizedStatus = String(nonConformity?.status || '').toUpperCase();
    const statusSequence = ['REPORTED', 'ANALYSIS', 'AC_IMPLEMENTATION', 'CLOSED'];
    const currentStatusIndex = statusSequence.indexOf(normalizedStatus);
    const isFinalStatus = normalizedStatus === 'CLOSED' || normalizedStatus === 'CANCELLED';

    const progressionStatuses = currentStatusIndex >= 0
        ? statusSequence.slice(currentStatusIndex)
        : statusSequence;

    const allowedStatusSet = new Set(progressionStatuses);
    if (!isFinalStatus && normalizedStatus !== 'CANCELLED') {
        allowedStatusSet.add('CANCELLED');
    }

    const allowedStatusOptions = STATUS_FR_OPTIONS.filter((option) => allowedStatusSet.has(option.value));
    const statusSelectOptions = allowedStatusOptions.length > 0 ? allowedStatusOptions : STATUS_FR_OPTIONS;

    const handleStatusChange = () => {
        if (isFinalStatus) return;

        const defaultStatus =
            statusSelectOptions.find((option) => option.value === normalizedStatus)?.value ||
            statusSelectOptions[0]?.value ||
            '';

        form.setValues((prev) => ({
            ...prev,
            status: defaultStatus,
            nonConformityId,
            date: prev.date || new Date(),
        }));

        open();
    };

    const fetchHistory = () => {
        getNCHistorybyNonConformityID(id)
            .then((res) => setHistory(res))
            .catch((err) => console.error(err));
    };

    const handleSubmit = async (values: any) => {
        dispatch(showOverlay());
        createNCHistory(values)
            .then(() => {
                successNotification('Statut mis à jour avec succès');
                close();
                setNonConformity((prev: any) => ({ ...prev, status: values.status }));
                fetchHistory();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Une erreur est survenue');
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    // ─── Données dérivées pour le rendu ─────────────────────────────────────
    const statusKey = normalizedStatus in STATUS_TONE ? normalizedStatus : 'REPORTED';
    const statusTone = STATUS_TONE[statusKey];
    const statusLabel = STATUS_FR[statusKey] || nonConformity?.status || '—';

    const severityRaw = nonConformity?.severityLevel || analysis?.severityLevel || '';
    const severityFr = SEVERITY_LABEL_FR[severityRaw] || severityRaw;
    const severityTone = SEVERITY_TONE[severityFr];

    const priorityRaw = analysis?.priority || '';
    const priorityFr = PRIORITY_LABEL_FR[priorityRaw] || priorityRaw;
    const priorityTone = PRIORITY_TONE[priorityFr];

    // Couleur de la bordure L du hero — basée sur sévérité si dispo, sinon statut
    const heroBorderL = severityTone?.borderL || statusTone.borderL;

    // Acteur de la déclaration (pour timeline)
    const detectionActor = nonConformity?.reportedBy
        ? empMap?.[nonConformity.reportedBy]?.name
        : undefined;

    const actionsCount = Array.isArray(actions) ? actions.length : 0;
    const historyCount = Array.isArray(history) ? history.length : 0;

    // Localisation pour la méta inline
    const detectionLocation = nonConformity?.locationId
        ? locationMap?.[nonConformity.locationId]?.name
        : undefined;

    return (
        <div className="px-5 py-4">
            {/* ─── Breadcrumb + actions (ligne unique, au-dessus du hero) ─── */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <nav className="flex items-center gap-1.5 text-[12px] text-slate-500" aria-label="Fil d'Ariane">
                    <Link to="/" className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors">
                        <IconHome size={12} stroke={1.6} />
                        <span>{t('navigation:breadcrumbs.home')}</span>
                    </Link>
                    <IconChevronRight size={11} className="text-slate-300" />
                    <Link to="/non-conformity" className="hover:text-slate-800 transition-colors">
                        {t('nonConformity:details.breadcrumb')}
                    </Link>
                    <IconChevronRight size={11} className="text-slate-300" />
                    <span className="text-slate-700 font-medium font-mono text-[11.5px]">
                        {nonConformity?.number || '—'}
                    </span>
                </nav>

                {/* Actions compactes — en haut à droite, sortie du hero */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => navigate('/non-conformity/edit/' + nonConformity.id)}
                        disabled={isFinalStatus}
                        title={isFinalStatus ? t('nonConformity:details.actions.editDisabled') : t('nonConformity:details.actions.edit')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                            isFinalStatus
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <IconEdit size={12} stroke={1.7} />
                        {t('nonConformity:details.actions.edit')}
                    </button>
                    <button
                        type="button"
                        onClick={handleStatusChange}
                        disabled={isFinalStatus}
                        title={isFinalStatus ? t('nonConformity:details.actions.manageDisabled') : t('nonConformity:details.actions.manage')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                            isFinalStatus
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                        <IconSettings size={12} stroke={1.8} />
                        {t('nonConformity:details.actions.manage')}
                    </button>
                </div>
            </div>

            {/* ─── HERO fond gris dégradé (bien visible) ────────────────── */}
            <header
                className={`bg-gradient-to-br from-slate-100 via-slate-50 to-white border border-slate-200 border-l-[3px] ${heroBorderL} rounded-xl px-5 py-4 mb-5 shadow-sm`}
            >
                {/* Ligne 1 : status pill + sévérité + priorité (tout en ligne) */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.10em] ${statusTone.bg} ${statusTone.text}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusTone.dot}`} />
                        {statusLabel}
                    </span>

                    {severityFr && (
                        <>
                            <span className="text-slate-300 text-[11px]">·</span>
                            <span className="text-[11px] text-slate-500">{t('nonConformity:details.severityLabel')}</span>
                            <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium ${
                                    severityTone?.bg || 'bg-slate-50'
                                } ${severityTone?.text || 'text-slate-700'}`}
                            >
                                {severityFr}
                            </span>
                        </>
                    )}
                    {priorityFr && (
                        <>
                            <span className="text-slate-300 text-[11px]">·</span>
                            <span className="text-[11px] text-slate-500">{t('nonConformity:details.priorityLabel')}</span>
                            <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium ${
                                    priorityTone?.bg || 'bg-slate-50'
                                } ${priorityTone?.text || 'text-slate-700'}`}
                            >
                                {priorityFr}
                            </span>
                        </>
                    )}
                </div>

                {/* Ligne 2 : référence + titre métier sur la MÊME ligne, séparés par · */}
                <h1
                    className="text-slate-900 leading-tight"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '21px',
                        fontWeight: 500,
                        letterSpacing: '-0.015em',
                    }}
                >
                    <span className="font-semibold tracking-tight">{nonConformity?.number || '—'}</span>
                    {nonConformity?.title && (
                        <>
                            <span className="mx-2 text-slate-300 font-normal">·</span>
                            <span className="text-slate-700 italic font-normal">{nonConformity.title}</span>
                        </>
                    )}
                </h1>

                {/* Ligne 3 : méta inline — date · personne · lieu */}
                <p className="mt-1 text-[11.5px] text-slate-500">
                    {nonConformity?.detectionDate && (
                        <>
                            {t('nonConformity:details.detectedOn')}{' '}
                            <span className="text-slate-700 font-medium">
                                {formatDateShort(nonConformity.detectionDate)}
                            </span>
                        </>
                    )}
                    {detectionActor && (
                        <>
                            <span className="mx-1.5 text-slate-300">·</span>
                            {t('nonConformity:details.by')} <span className="text-slate-700 font-medium">{detectionActor}</span>
                        </>
                    )}
                    {detectionLocation && (
                        <>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span className="text-slate-700 font-medium">{detectionLocation}</span>
                        </>
                    )}
                </p>

                {/* Timeline cycle de vie — sobre, sans border-top */}
                <div className="mt-3">
                    <LifecycleTimeline
                        currentStatus={normalizedStatus}
                        detectionDate={nonConformity?.detectionDate}
                        detectionActor={detectionActor}
                        history={history}
                        empMap={empMap}
                    />
                </div>
            </header>

            {/* ─── Onglets pill design — actif sombre très distinct ─────── */}
            <Tabs
                defaultValue="overview"
                classNames={{
                    list: '!inline-flex !flex-nowrap !gap-0.5 !p-1 !rounded-lg !bg-white !border !border-slate-200 !shadow-sm overflow-x-auto',
                    tab: 'data-[active]:!bg-slate-100 data-[active]:!text-slate-800 data-[active]:!shadow-sm data-[active]:!border data-[active]:!border-slate-300 !text-slate-500 hover:!text-slate-700 hover:!bg-slate-50 !border-0 !rounded-md !px-3.5 !py-1.5 !text-[12px] !font-medium !transition-colors',
                }}
            >
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconFileText size={14} stroke={1.6} />}>
                        {t('nonConformity:details.tabs.overview')}
                    </Tabs.Tab>
                    <Tabs.Tab value="analysis" leftSection={<IconTarget size={14} stroke={1.6} />}>
                        {t('nonConformity:details.tabs.analysis')}
                    </Tabs.Tab>
                    <Tabs.Tab value="treatment" leftSection={<IconTool size={14} stroke={1.6} />}>
                        {t('nonConformity:details.tabs.treatment')}
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="actions"
                        leftSection={<IconClock size={14} stroke={1.6} />}
                        rightSection={
                            actionsCount > 0 ? (
                                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                    {actionsCount}
                                </span>
                            ) : null
                        }
                    >
                        {t('nonConformity:details.tabs.actions')}
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="history"
                        leftSection={<IconHistory size={14} stroke={1.6} />}
                        rightSection={
                            historyCount > 0 ? (
                                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                    {historyCount}
                                </span>
                            ) : null
                        }
                    >
                        {t('nonConformity:details.tabs.history')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" className="pt-4">
                    {nonConformity && Object.keys(nonConformity).length > 0 ? (
                        <NonConformityOverview
                            nonConformity={nonConformity}
                            empMap={empMap}
                            analysis={analysis}
                            locationMap={locationMap}
                            processMap={processMap}
                        />
                    ) : (
                        <EmptyPanel message="Données indisponibles" />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="analysis" className="pt-4">
                    {analysis && Object.keys(analysis).length > 0 ? (
                        <NonConformityAnalysis analysis={analysis} />
                    ) : (
                        <EmptyPanel message="Aucune donnée d'analyse" subtitle="L'analyse de cause racine n'a pas encore été menée." />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="treatment" className="pt-4">
                    {nonConformity && Object.keys(nonConformity).length > 0 ? (
                        <NonConformityTreatment nonConformity={nonConformity} actions={actions} />
                    ) : (
                        <EmptyPanel message="Aucune donnée de traitement" />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="actions" className="pt-4">
                    {actions && actions.length > 0 ? (
                        <ActionPlansTab actions={actions} />
                    ) : (
                        <EmptyPanel
                            icon={<IconClock size={32} stroke={1.4} className="text-slate-300" />}
                            message="Aucune action corrective"
                            subtitle="Aucune action corrective n'a encore été planifiée pour ce constat."
                        />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="history" className="pt-4">
                    {history && history.length > 0 ? (
                        <NonConformityHistory history={history} empMap={empMap} />
                    ) : (
                        <EmptyPanel
                            icon={<IconHistory size={32} stroke={1.4} className="text-slate-300" />}
                            message="Journal vide"
                            subtitle="Aucun changement de statut n'a encore été enregistré."
                        />
                    )}
                </Tabs.Panel>
            </Tabs>

            {/* ─── Modal Gérer (FR) ──────────────────────────────────────── */}
            <Modal
                opened={opened}
                onClose={close}
                title={
                    <div className="flex items-center gap-2.5">
                        <span className="bg-teal-50 text-teal-700 rounded-full p-2 flex items-center justify-center">
                            <IconLock size={16} stroke={1.8} />
                        </span>
                        <span
                            className="text-slate-800"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '17px', fontWeight: 500 }}
                        >
                            Gérer le constat
                        </span>
                    </div>
                }
                centered
                size="lg"
                classNames={{
                    body: 'p-6 pt-4',
                    header: 'border-b border-slate-100 px-6 py-4',
                    title: '!m-0',
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-2">
                    <Select
                        size="sm"
                        label="Responsable du changement"
                        placeholder="Sélectionner un employé"
                        data={emps}
                        {...form.getInputProps('ownerId')}
                        withAsterisk
                        searchable
                    />

                    <DateInput
                        size="sm"
                        label="Date d'effet"
                        placeholder="Sélectionner la date"
                        {...form.getInputProps('date')}
                        withAsterisk
                    />

                    <Select
                        size="sm"
                        label="Nouveau statut"
                        placeholder="Sélectionner un statut"
                        data={statusSelectOptions}
                        {...form.getInputProps('status')}
                        withAsterisk
                    />

                    <Textarea
                        size="sm"
                        label="Commentaire"
                        placeholder="Justifier le changement de statut (recommandé)"
                        {...form.getInputProps('comment')}
                        minRows={3}
                        autosize
                    />

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={close}
                            className="!border-slate-200 !text-slate-700 hover:!bg-slate-50"
                        >
                            Annuler
                        </Button>
                        <Button
                            size="sm"
                            type="submit"
                            className="!bg-slate-900 hover:!bg-slate-800 !text-white"
                        >
                            Valider
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// ─── Empty state premium ────────────────────────────────────────────────────

function EmptyPanel({
    icon,
    message,
    subtitle,
}: {
    icon?: React.ReactNode;
    message: string;
    subtitle?: string;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center">
            {icon && <div className="mb-3">{icon}</div>}
            <Text
                className="text-slate-700"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', fontWeight: 500 }}
            >
                {message}
            </Text>
            {subtitle && <p className="mt-1.5 text-[12.5px] text-slate-500 max-w-md">{subtitle}</p>}
        </div>
    );
}

export default NonConformityDetails;
