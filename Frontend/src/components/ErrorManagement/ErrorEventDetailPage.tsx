/**
 * ErrorEventDetailPage — Fiche détaillée d'un événement (Gestion des Erreurs).
 *
 * Route : /error-management/:id
 *
 * Sections :
 *   - En-tête : référence, titre, statut, criticité, HiPo, anonymat.
 *   - Workflow : stepper visuel du cycle de vie + avancement / réouverture.
 *   - Classification : taxonomie de Reason (nature, sous-type, latente/active).
 *   - Assistant RCA : analyse causale (5 Pourquoi / Ishikawa / Arbre / ICAM).
 *   - Culture juste : décision + test de substitution + notes (analyse apprenante).
 *   - CAPA & REX : liens vers les modules existants (errorEventId).
 *   - Historique : journal des transitions de statut.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Loader, Modal, Select, Tabs, Textarea } from '@mantine/core';
import {
    IconArrowBackUp,
    IconArrowLeft,
    IconArrowRight,
    IconCategory2,
    IconChevronRight,
    IconClipboardList,
    IconClockHour4,
    IconExternalLink,
    IconHistory,
    IconListCheck,
    IconScale,
    IconSitemap,
    IconUserShield,
} from '@tabler/icons-react';
import {
    getClassification,
    getEvent,
    getHistory,
    getJustCulture,
    listCriticalityMatrix,
    listEventTypes,
    updateStatus,
    upsertClassification,
    upsertJustCulture,
    type CriticalityLevel,
    type ErrorClassificationDTO,
    type ErrorCriticalityMatrixCell,
    type ErrorEventDTO,
    type ErrorEventHistoryDTO,
    type ErrorEventStatus,
    type ErrorEventType,
    type ErrorNature,
    type JustCultureAssessmentDTO,
    type JustCultureOutcome,
    type ViolationSubtype,
} from '../../services/ErrorManagementService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    AMBER,
    CRITICALITY_LABELS,
    ERROR_NATURE_HELP,
    ERROR_NATURE_LABELS,
    JUST_CULTURE_HELP,
    JUST_CULTURE_LABELS,
    JUST_CULTURE_TONE,
    NAVY,
    NAVY_DEEP,
    SOURCE_MODULE_LABELS,
    STATUS_DESCRIPTIONS,
    STATUS_FLOW,
    STATUS_LABELS,
    TEAL,
    VIOLATION_SUBTYPE_LABELS,
    formatDateTime,
} from './errorManagementLabels';
import { AnonymousBadge, CriticalityChip, EventTypeChip, HipoBadge, StatusChip } from './ErrorChips';
import RcaAssistant from './RcaAssistant';

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1.5 border-b border-slate-100 last:border-0">
        <div className="text-[12px] text-slate-500 font-medium">{label}</div>
        <div className="text-[12.5px] text-slate-800">{value}</div>
    </div>
);

const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
    actions,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DEEP})` }}
                >
                    {icon}
                </div>
                <div>
                    <h2
                        className="text-[15px] font-semibold text-slate-800 leading-tight"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {title}
                    </h2>
                    {subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {actions}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const ErrorEventDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = Number(id);
    const navigate = useNavigate();

    const [event, setEvent] = useState<ErrorEventDTO | null>(null);
    const [eventTypes, setEventTypes] = useState<ErrorEventType[]>([]);
    const [matrix, setMatrix] = useState<ErrorCriticalityMatrixCell[]>([]);
    const [history, setHistory] = useState<ErrorEventHistoryDTO[]>([]);
    const [classification, setClassification] = useState<ErrorClassificationDTO | null>(null);
    const [justCulture, setJustCulture] = useState<JustCultureAssessmentDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [notFound, setNotFound] = useState<boolean>(false);

    // Workflow modal
    const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
    const [targetStatus, setTargetStatus] = useState<ErrorEventStatus | null>(null);
    const [statusComment, setStatusComment] = useState<string>('');
    const [statusSubmitting, setStatusSubmitting] = useState<boolean>(false);

    // Édition autorisée : l'API renvoie 403 si non-admin. On laisse l'UI ouverte
    // et on gère le 403 au moment de l'écriture (message clair).
    const canEdit = true;

    const loadAll = useCallback(async () => {
        try {
            const evt = await getEvent(eventId);
            setEvent(evt);
            const [types, mtx, hist, cls, jc] = await Promise.allSettled([
                listEventTypes(),
                listCriticalityMatrix(),
                getHistory(eventId),
                getClassification(eventId),
                getJustCulture(eventId),
            ]);
            if (types.status === 'fulfilled') setEventTypes(types.value);
            if (mtx.status === 'fulfilled') setMatrix(mtx.value);
            if (hist.status === 'fulfilled') setHistory(hist.value);
            if (cls.status === 'fulfilled') setClassification(cls.value);
            if (jc.status === 'fulfilled') setJustCulture(jc.value);
        } catch (e: any) {
            if (e?.response?.status === 404) setNotFound(true);
            else errorNotification("Impossible de charger l'événement.");
        }
    }, [eventId]);

    useEffect(() => {
        if (!Number.isFinite(eventId)) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        setLoading(true);
        loadAll().finally(() => setLoading(false));
    }, [loadAll, eventId]);

    const eventType = useMemo(
        () => (event?.eventTypeId ? eventTypes.find((t) => t.id === event.eventTypeId) : undefined),
        [event, eventTypes],
    );

    const criticalityColor = useCallback(
        (level?: CriticalityLevel | null): string | null => {
            if (!level) return null;
            return matrix.find((c) => c.criticalityLevel === level)?.colorHex ?? null;
        },
        [matrix],
    );

    // Statut suivant dans le flux (progression non-régressive).
    const currentStatus = event?.status ?? 'DECLARED';
    const currentIndex = STATUS_FLOW.indexOf(currentStatus as ErrorEventStatus);
    const nextStatus: ErrorEventStatus | null =
        currentStatus === 'REOPENED'
            ? 'ANALYZING'
            : currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
              ? STATUS_FLOW[currentIndex + 1]
              : null;
    const isTerminal = currentStatus === 'CLOSED' || currentStatus === 'CAPITALIZED';

    const openStatusModal = (to: ErrorEventStatus) => {
        setTargetStatus(to);
        setStatusComment('');
        setStatusModalOpen(true);
    };

    const handleStatusSubmit = useCallback(async () => {
        if (!targetStatus) return;
        setStatusSubmitting(true);
        try {
            const updated = await updateStatus(eventId, {
                toStatus: targetStatus,
                comment: statusComment.trim() || null,
            });
            setEvent(updated);
            const hist = await getHistory(eventId);
            setHistory(hist);
            successNotification(`Statut mis à jour : ${STATUS_LABELS[targetStatus]}.`);
            setStatusModalOpen(false);
        } catch (e: any) {
            const code = e?.response?.status;
            errorNotification(
                code === 403
                    ? 'Accès refusé : la transition de statut est réservée aux administrateurs.'
                    : code === 400 || code === 409
                      ? 'Transition de statut non autorisée (régression interdite).'
                      : 'La mise à jour du statut a échoué.',
            );
        } finally {
            setStatusSubmitting(false);
        }
    }, [targetStatus, eventId, statusComment]);

    if (loading) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6 flex flex-col items-center justify-center">
                <Loader color={NAVY} size="sm" />
                <p className="text-[12.5px] text-slate-500 mt-3">Chargement de l'événement…</p>
            </div>
        );
    }

    if (notFound || !event) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
                    <p className="text-[15px] font-semibold text-slate-800 mb-1">Événement introuvable</p>
                    <p className="text-[12.5px] text-slate-500 mb-4">
                        L'événement demandé n'existe pas ou n'est pas accessible.
                    </p>
                    <Button
                        variant="default"
                        leftSection={<IconArrowLeft size={15} />}
                        onClick={() => navigate('/error-management')}
                    >
                        Retour au registre
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full max-w-6xl mx-auto">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/error-management')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-slate-800 transition"
                    >
                        Registre des erreurs
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {event.reference ?? `#${event.id}`}
                    </span>
                </div>

                {/* ─── En-tête ─── */}
                <div
                    className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden border-l-[3px]"
                    style={{ borderLeftColor: NAVY }}
                >
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ background: `linear-gradient(90deg, ${NAVY}, ${TEAL}, ${AMBER})` }}
                            aria-hidden="true"
                        />
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <StatusChip status={event.status} />
                            <CriticalityChip
                                level={event.criticalityLevel}
                                colorHex={criticalityColor(event.criticalityLevel)}
                            />
                            <EventTypeChip label={eventType?.label} colorHex={eventType?.colorHex} />
                            {event.isHipo && <HipoBadge />}
                            {event.isAnonymous && <AnonymousBadge />}
                        </div>
                        <h1
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(20px, 2.2vw, 26px)',
                                letterSpacing: '-0.018em',
                            }}
                        >
                            <span className="font-mono text-slate-500 text-[0.7em] mr-2">{event.reference}</span>
                            {event.title}
                        </h1>
                        <p className="mt-1.5 text-[11.5px] text-slate-500">
                            Survenu le{' '}
                            <span className="text-slate-700 font-medium">{formatDateTime(event.occurredAt)}</span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            Déclaré le{' '}
                            <span className="text-slate-700 font-medium">{formatDateTime(event.declaredAt)}</span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            Source :{' '}
                            <span className="text-slate-700 font-medium">
                                {event.sourceModule ? SOURCE_MODULE_LABELS[event.sourceModule] : 'n/d'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* ─── Workflow ─── */}
                <div className="mb-5">
                    <WorkflowStepper currentStatus={currentStatus as ErrorEventStatus} />
                    <div className="bg-white border border-slate-200 rounded-b-xl border-t-0 shadow-sm px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[12px] text-slate-500">
                            {STATUS_DESCRIPTIONS[currentStatus as ErrorEventStatus]}
                        </p>
                        <div className="flex items-center gap-2">
                            {isTerminal && (
                                <Button
                                    variant="default"
                                    size="xs"
                                    leftSection={<IconArrowBackUp size={14} />}
                                    onClick={() => openStatusModal('REOPENED')}
                                >
                                    Réouvrir le dossier
                                </Button>
                            )}
                            {nextStatus && (
                                <Button
                                    size="xs"
                                    rightSection={<IconArrowRight size={14} />}
                                    onClick={() => openStatusModal(nextStatus)}
                                    styles={{ root: { backgroundColor: NAVY } }}
                                >
                                    Avancer vers « {STATUS_LABELS[nextStatus]} »
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Onglets ─── */}
                <Tabs
                    defaultValue="overview"
                    classNames={{
                        list: '!inline-flex !flex-nowrap !gap-0.5 !p-1 !rounded-lg !bg-white !border !border-slate-200 !shadow-sm overflow-x-auto mb-4',
                        tab: 'data-[active]:!bg-[#1E3A5F] data-[active]:!text-white data-[active]:!shadow-sm data-[active]:!border-0 !text-slate-600 hover:!text-slate-900 hover:!bg-slate-100 !border-0 !rounded-md !px-3.5 !py-1.5 !text-[12px] !font-medium !transition-colors',
                    }}
                >
                    <Tabs.List>
                        <Tabs.Tab value="overview" leftSection={<IconClipboardList size={14} stroke={1.6} />}>
                            Synthèse
                        </Tabs.Tab>
                        <Tabs.Tab value="classification" leftSection={<IconCategory2 size={14} stroke={1.6} />}>
                            Classification
                        </Tabs.Tab>
                        <Tabs.Tab value="rca" leftSection={<IconSitemap size={14} stroke={1.6} />}>
                            Analyse causale
                        </Tabs.Tab>
                        <Tabs.Tab value="justculture" leftSection={<IconScale size={14} stroke={1.6} />}>
                            Culture juste
                        </Tabs.Tab>
                        <Tabs.Tab value="capa" leftSection={<IconListCheck size={14} stroke={1.6} />}>
                            CAPA & REX
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={14} stroke={1.6} />}>
                            Historique
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* — Synthèse — */}
                    <Tabs.Panel value="overview">
                        <SectionCard
                            icon={<IconClipboardList size={16} stroke={1.8} />}
                            title="Synthèse de l'événement"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                                <div>
                                    <DetailRow label="Référence" value={event.reference ?? 'n/d'} />
                                    <DetailRow
                                        label="Type"
                                        value={<EventTypeChip label={eventType?.label} colorHex={eventType?.colorHex} />}
                                    />
                                    <DetailRow
                                        label="Statut"
                                        value={<StatusChip status={event.status} />}
                                    />
                                    <DetailRow
                                        label="Criticité"
                                        value={
                                            <CriticalityChip
                                                level={event.criticalityLevel}
                                                colorHex={criticalityColor(event.criticalityLevel)}
                                            />
                                        }
                                    />
                                </div>
                                <div>
                                    <DetailRow label="Survenu le" value={formatDateTime(event.occurredAt)} />
                                    <DetailRow label="Déclaré le" value={formatDateTime(event.declaredAt)} />
                                    <DetailRow
                                        label="Déclarant"
                                        value={
                                            event.isAnonymous ? (
                                                <span className="italic text-slate-500">Déclarant anonyme</span>
                                            ) : event.declaredBy != null ? (
                                                `Utilisateur #${event.declaredBy}`
                                            ) : (
                                                'n/d'
                                            )
                                        }
                                    />
                                    <DetailRow
                                        label="Source"
                                        value={
                                            event.sourceModule ? SOURCE_MODULE_LABELS[event.sourceModule] : 'n/d'
                                        }
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-[12px] text-slate-500 font-medium mb-1">Description</p>
                                <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-line">
                                    {event.description || <span className="text-slate-400">Aucune description.</span>}
                                </p>
                            </div>
                        </SectionCard>
                    </Tabs.Panel>

                    {/* — Classification — */}
                    <Tabs.Panel value="classification">
                        <ClassificationPanel
                            eventId={eventId}
                            initial={classification}
                            canEdit={canEdit}
                            onSaved={setClassification}
                        />
                    </Tabs.Panel>

                    {/* — Analyse causale — */}
                    <Tabs.Panel value="rca">
                        <SectionCard
                            icon={<IconSitemap size={16} stroke={1.8} />}
                            title="Assistant d'analyse causale"
                            subtitle="Remontez des causes immédiates aux causes systémiques (4 méthodes au choix)."
                        >
                            <RcaAssistant eventId={eventId} canEdit={canEdit} />
                        </SectionCard>
                    </Tabs.Panel>

                    {/* — Culture juste — */}
                    <Tabs.Panel value="justculture">
                        <JustCulturePanel
                            eventId={eventId}
                            initial={justCulture}
                            canEdit={canEdit}
                            onSaved={setJustCulture}
                        />
                    </Tabs.Panel>

                    {/* — CAPA & REX — */}
                    <Tabs.Panel value="capa">
                        <CapaRexPanel eventId={eventId} />
                    </Tabs.Panel>

                    {/* — Historique — */}
                    <Tabs.Panel value="history">
                        <SectionCard
                            icon={<IconHistory size={16} stroke={1.8} />}
                            title="Journal du cycle de vie"
                            subtitle="Traçabilité des transitions de statut et des intervenants."
                        >
                            <AuditTrail history={history} />
                        </SectionCard>
                    </Tabs.Panel>
                </Tabs>
            </div>

            {/* ─── Modal de transition de statut ─── */}
            <Modal
                opened={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                centered
                title={
                    <span
                        className="text-slate-800"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '16px', fontWeight: 600 }}
                    >
                        {targetStatus === 'REOPENED' ? 'Réouvrir le dossier' : 'Faire avancer le dossier'}
                    </span>
                }
            >
                <p className="text-[13px] text-slate-600 mb-3">
                    {targetStatus === 'REOPENED'
                        ? 'Le dossier sera réouvert pour reprise du traitement.'
                        : targetStatus && (
                              <>
                                  Le statut passera de{' '}
                                  <span className="font-semibold">{STATUS_LABELS[currentStatus as ErrorEventStatus]}</span>{' '}
                                  à <span className="font-semibold">{STATUS_LABELS[targetStatus]}</span>.
                              </>
                          )}
                </p>
                <Textarea
                    label="Commentaire (optionnel)"
                    placeholder="Justification ou note pour le journal…"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.currentTarget.value)}
                    autosize
                    minRows={3}
                    mb="md"
                />
                <div className="flex justify-end gap-2">
                    <Button variant="default" onClick={() => setStatusModalOpen(false)}>
                        Annuler
                    </Button>
                    <Button
                        loading={statusSubmitting}
                        onClick={handleStatusSubmit}
                        styles={{ root: { backgroundColor: NAVY } }}
                    >
                        Confirmer
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
//  Workflow stepper
// ─────────────────────────────────────────────────────────────────────────

const WorkflowStepper = ({ currentStatus }: { currentStatus: ErrorEventStatus }) => {
    const reopened = currentStatus === 'REOPENED';
    const currentIndex = reopened ? 2 : STATUS_FLOW.indexOf(currentStatus);
    return (
        <div className="bg-white border border-slate-200 rounded-t-xl shadow-sm px-5 pt-4 pb-3">
            {reopened && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-orange-50 text-orange-800 px-2 py-0.5 text-[11px] font-medium">
                    <IconArrowBackUp size={12} stroke={1.8} />
                    Dossier réouvert : traitement repris
                </div>
            )}
            <div className="flex items-start gap-0 overflow-x-auto pb-1">
                {STATUS_FLOW.map((s, i) => {
                    const done = i < currentIndex;
                    const active = i === currentIndex && !reopened;
                    const isLast = i === STATUS_FLOW.length - 1;
                    return (
                        <div key={s} className="flex items-start flex-1 min-w-[80px]">
                            <div className="flex flex-col items-center flex-1">
                                <span
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors"
                                    style={
                                        done || active
                                            ? { backgroundColor: NAVY, borderColor: NAVY, color: '#fff' }
                                            : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#94a3b8' }
                                    }
                                >
                                    {done ? '✓' : i + 1}
                                </span>
                                <span
                                    className={`mt-1.5 text-[10px] text-center leading-tight ${
                                        active ? 'font-semibold' : ''
                                    }`}
                                    style={{ color: done || active ? NAVY : '#94a3b8' }}
                                >
                                    {STATUS_LABELS[s]}
                                </span>
                            </div>
                            {!isLast && (
                                <div
                                    className="h-[2px] flex-1 mt-3.5 -mx-1"
                                    style={{ backgroundColor: i < currentIndex ? NAVY : '#e2e8f0' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
//  Classification (taxonomie de Reason)
// ─────────────────────────────────────────────────────────────────────────

const NATURES: ErrorNature[] = ['SLIP_LAPSE', 'MISTAKE', 'VIOLATION'];
const SUBTYPES: ViolationSubtype[] = ['ROUTINE', 'EXCEPTIONAL'];

const ClassificationPanel = ({
    eventId,
    initial,
    canEdit,
    onSaved,
}: {
    eventId: number;
    initial: ErrorClassificationDTO | null;
    canEdit: boolean;
    onSaved: (c: ErrorClassificationDTO) => void;
}) => {
    const [nature, setNature] = useState<ErrorNature | ''>(initial?.errorNature ?? '');
    const [subtype, setSubtype] = useState<ViolationSubtype | ''>(initial?.violationSubtype ?? '');
    const [isLatent, setIsLatent] = useState<boolean>(initial?.isLatent ?? false);
    const [notes, setNotes] = useState<string>(initial?.notes ?? '');
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        setNature(initial?.errorNature ?? '');
        setSubtype(initial?.violationSubtype ?? '');
        setIsLatent(initial?.isLatent ?? false);
        setNotes(initial?.notes ?? '');
    }, [initial]);

    const save = useCallback(async () => {
        setSaving(true);
        try {
            const saved = await upsertClassification(eventId, {
                errorNature: nature || null,
                violationSubtype: nature === 'VIOLATION' ? subtype || null : null,
                isLatent,
                notes: notes.trim() || null,
            });
            onSaved(saved);
            successNotification('Classification enregistrée.');
        } catch (e: any) {
            errorNotification(
                e?.response?.status === 403
                    ? 'Accès refusé : action réservée aux administrateurs.'
                    : "L'enregistrement de la classification a échoué.",
            );
        } finally {
            setSaving(false);
        }
    }, [eventId, nature, subtype, isLatent, notes, onSaved]);

    return (
        <SectionCard
            icon={<IconCategory2 size={16} stroke={1.8} />}
            title="Classification : taxonomie de Reason"
            subtitle="Qualifiez la nature de la défaillance humaine ou organisationnelle."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {NATURES.map((n) => {
                    const selected = nature === n;
                    return (
                        <button
                            key={n}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setNature(n)}
                            className={`text-left rounded-lg border px-3.5 py-3 transition ${
                                selected ? 'shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                            style={selected ? { borderColor: NAVY, backgroundColor: `${NAVY}0C` } : undefined}
                        >
                            <p
                                className="text-[13px] font-semibold mb-0.5"
                                style={{ color: selected ? NAVY : '#1e293b' }}
                            >
                                {ERROR_NATURE_LABELS[n]}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-snug">{ERROR_NATURE_HELP[n]}</p>
                        </button>
                    );
                })}
            </div>

            {nature === 'VIOLATION' && (
                <div className="mb-3">
                    <Select
                        label="Sous-type de transgression"
                        placeholder="Sélectionner…"
                        value={subtype || null}
                        onChange={(v) => setSubtype((v as ViolationSubtype) ?? '')}
                        data={SUBTYPES.map((s) => ({ value: s, label: VIOLATION_SUBTYPE_LABELS[s] }))}
                        disabled={!canEdit}
                        w={280}
                        clearable
                    />
                </div>
            )}

            <label className="flex items-center gap-2 mb-3 cursor-pointer w-fit">
                <input
                    type="checkbox"
                    checked={isLatent}
                    onChange={(e) => setIsLatent(e.target.checked)}
                    disabled={!canEdit}
                    className="w-4 h-4 accent-[#1E3A5F]"
                />
                <span className="text-[13px] text-slate-700">
                    Erreur <strong>latente</strong> (condition organisationnelle préexistante) ; sinon erreur{' '}
                    <strong>active</strong> (au contact direct du danger)
                </span>
            </label>

            <Textarea
                label="Notes de classification"
                placeholder="Précisions sur la qualification…"
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                disabled={!canEdit}
                autosize
                minRows={2}
                mb="md"
            />

            {canEdit && (
                <div className="flex justify-end">
                    <Button loading={saving} onClick={save} styles={{ root: { backgroundColor: NAVY } }}>
                        Enregistrer la classification
                    </Button>
                </div>
            )}
        </SectionCard>
    );
};

// ─────────────────────────────────────────────────────────────────────────
//  Culture juste (Just Culture)
// ─────────────────────────────────────────────────────────────────────────

const OUTCOMES: JustCultureOutcome[] = ['HONEST_ERROR', 'AT_RISK', 'RECKLESS'];

const JustCulturePanel = ({
    eventId,
    initial,
    canEdit,
    onSaved,
}: {
    eventId: number;
    initial: JustCultureAssessmentDTO | null;
    canEdit: boolean;
    onSaved: (j: JustCultureAssessmentDTO) => void;
}) => {
    const [outcome, setOutcome] = useState<JustCultureOutcome | ''>(initial?.outcome ?? '');
    const [substitution, setSubstitution] = useState<string>(initial?.substitutionTest ?? '');
    const [notes, setNotes] = useState<string>(initial?.decisionNotes ?? '');
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        setOutcome(initial?.outcome ?? '');
        setSubstitution(initial?.substitutionTest ?? '');
        setNotes(initial?.decisionNotes ?? '');
    }, [initial]);

    const save = useCallback(async () => {
        setSaving(true);
        try {
            const saved = await upsertJustCulture(eventId, {
                outcome: outcome || null,
                substitutionTest: substitution.trim() || null,
                decisionNotes: notes.trim() || null,
            });
            onSaved(saved);
            successNotification('Évaluation Culture juste enregistrée.');
        } catch (e: any) {
            errorNotification(
                e?.response?.status === 403
                    ? 'Accès refusé : action réservée aux administrateurs.'
                    : "L'enregistrement de l'évaluation a échoué.",
            );
        } finally {
            setSaving(false);
        }
    }, [eventId, outcome, substitution, notes, onSaved]);

    return (
        <SectionCard
            icon={<IconScale size={16} stroke={1.8} />}
            title="Culture juste (Just Culture)"
            subtitle="Évaluation apprenante de la conduite, distincte de toute dimension disciplinaire."
        >
            <div className="flex items-start gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2.5 mb-4 text-[12px] text-cyan-900">
                <IconUserShield size={15} className="mt-0.5 flex-shrink-0 text-cyan-700" />
                <span>
                    Cette analyse vise à comprendre la conduite et à améliorer le système. Elle ne constitue pas une
                    décision disciplinaire : seule une imprudence caractérisée pourrait relever d'une suite RH, traitée
                    hors de cet outil.
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {OUTCOMES.map((o) => {
                    const selected = outcome === o;
                    const tone = JUST_CULTURE_TONE[o];
                    return (
                        <button
                            key={o}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setOutcome(o)}
                            className={`text-left rounded-lg border px-3.5 py-3 transition ${
                                selected ? `${tone.bg} ${tone.border} shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <p className={`text-[13px] font-semibold mb-0.5 ${selected ? tone.text : 'text-slate-800'}`}>
                                {JUST_CULTURE_LABELS[o]}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-snug">{JUST_CULTURE_HELP[o]}</p>
                        </button>
                    );
                })}
            </div>

            <Textarea
                label="Test de substitution"
                description="Un collègue compétent, dans les mêmes conditions, aurait-il pu agir de même ?"
                placeholder="Conclusion du test de substitution…"
                value={substitution}
                onChange={(e) => setSubstitution(e.currentTarget.value)}
                disabled={!canEdit}
                autosize
                minRows={2}
                mb="sm"
            />
            <Textarea
                label="Notes de décision"
                placeholder="Justification de l'évaluation et mesures d'accompagnement retenues…"
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                disabled={!canEdit}
                autosize
                minRows={2}
                mb="md"
            />

            {canEdit && (
                <div className="flex justify-end">
                    <Button loading={saving} onClick={save} styles={{ root: { backgroundColor: NAVY } }}>
                        Enregistrer l'évaluation
                    </Button>
                </div>
            )}
        </SectionCard>
    );
};

// ─────────────────────────────────────────────────────────────────────────
//  CAPA & REX (liens vers modules existants)
// ─────────────────────────────────────────────────────────────────────────

const CapaRexPanel = ({ eventId }: { eventId: number }) => {
    const navigate = useNavigate();
    return (
        <SectionCard
            icon={<IconListCheck size={16} stroke={1.8} />}
            title="Mesures correctives (CAPA) & retour d'expérience (REX)"
            subtitle="Les actions et les leçons apprises sont gérées dans leurs modules dédiés, rattachées à cet événement."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[13px] font-semibold text-slate-800 mb-1">Actions correctives & préventives</p>
                    <p className="text-[12px] text-slate-500 leading-snug mb-3">
                        Les CAPA liées à cet événement (référence interne #{eventId}) se créent et se suivent dans le
                        module Actions correctives. Le rattachement s'effectue via l'identifiant de l'événement.
                    </p>
                    <Button
                        variant="default"
                        size="xs"
                        rightSection={<IconExternalLink size={14} />}
                        onClick={() => navigate('/corrective')}
                    >
                        Ouvrir le module Actions correctives
                    </Button>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[13px] font-semibold text-slate-800 mb-1">Leçons apprises (REX)</p>
                    <p className="text-[12px] text-slate-500 leading-snug mb-3">
                        Une fois le dossier capitalisé, les enseignements sont diffusés via le module Leçons apprises
                        pour prévenir la récurrence sur l'ensemble des sites.
                    </p>
                    <Button
                        variant="default"
                        size="xs"
                        rightSection={<IconExternalLink size={14} />}
                        onClick={() => navigate('/lesson-learn')}
                    >
                        Ouvrir le module Leçons apprises
                    </Button>
                </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
                Note : l'API ne fournit pas encore de liste filtrée des CAPA/REX par événement ; ces sections renvoient
                vers les modules existants où le rattachement par identifiant d'événement est pris en charge.
            </p>
        </SectionCard>
    );
};

// ─────────────────────────────────────────────────────────────────────────
//  Audit trail (historique)
// ─────────────────────────────────────────────────────────────────────────

const AuditTrail = ({ history }: { history: ErrorEventHistoryDTO[] }) => {
    if (history.length === 0) {
        return (
            <div className="flex items-center gap-2 text-[12.5px] text-slate-500 py-4">
                <IconClockHour4 size={15} className="text-slate-400" />
                Aucun mouvement enregistré pour l'instant.
            </div>
        );
    }
    // Tri du plus récent au plus ancien.
    const sorted = [...history].sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
    });
    return (
        <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
            {sorted.map((h, i) => (
                <li key={h.id ?? i} className="ml-5">
                    <span
                        className="absolute -left-[7px] w-3 h-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: NAVY }}
                        aria-hidden="true"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        {h.fromStatus && (
                            <span className="text-[11px] text-slate-500">
                                {STATUS_LABELS[h.fromStatus] ?? h.fromStatus}
                            </span>
                        )}
                        {h.fromStatus && h.toStatus && (
                            <IconArrowRight size={12} className="text-slate-400" />
                        )}
                        {h.toStatus && (
                            <StatusChip status={h.toStatus} />
                        )}
                        {h.action && !h.toStatus && (
                            <span className="text-[12px] font-medium text-slate-700">{h.action}</span>
                        )}
                    </div>
                    <p className="text-[11.5px] text-slate-500">
                        {formatDateTime(h.timestamp)}
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="text-slate-700">
                            {h.actorLabel || (h.actorId != null ? `Utilisateur #${h.actorId}` : 'Déclarant anonyme')}
                        </span>
                    </p>
                    {h.comment && (
                        <p className="mt-1 text-[12px] text-slate-700 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5">
                            {h.comment}
                        </p>
                    )}
                </li>
            ))}
        </ol>
    );
};

export default ErrorEventDetailPage;
