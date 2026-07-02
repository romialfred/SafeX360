import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Select } from '@mantine/core';
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconClock,
    IconMapPin,
    IconUser,
    IconShield,
    IconUrgent,
    IconCheck,
    IconCircleCheck,
    IconUsersGroup,
    IconCircle,
    IconArchive,
    IconPlayerPause,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import ConfirmModal from '../../UtilityComp/ConfirmModal';
import { useAppSelector } from '../../../slices/hooks';
import {
    getSosAlert,
    getSosLifecycle,
    acknowledgeSosAlert,
    dispatchSosAlert,
    onSiteSosAlert,
    closeSosAlert,
    falseAlarmSosAlert,
    type SosAlertDTO,
    type SosLifecycleEventDTO,
    type SosStatus,
} from '../../../services/SosService';
import { listRescueTeams, type RescueTeamDTO } from '../../../services/EmergencyService';
import { useEmergencyWebSocket } from './EmergencyWebSocketProvider';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Page Détail SOS (LOT 48 Phase 3.b).
 *
 * <p>Affiche l'alerte complète avec timeline lifecycle + actions selon état
 * courant. Mise à jour temps réel via WebSocket : si un autre coordinateur
 * change l'état, l'UI se met à jour automatiquement.</p>
 */

const STATUS_META: Record<SosStatus, { bg: string; text: string; label: string; pulse: boolean; iconColor: string }> = {
    RECEIVED:     { bg: 'bg-red-600',     text: 'text-white', label: 'NOUVEAU',         pulse: true,  iconColor: 'text-red-600' },
    ACKNOWLEDGED: { bg: 'bg-orange-500',  text: 'text-white', label: 'PRIS EN CHARGE',  pulse: false, iconColor: 'text-orange-600' },
    DISPATCHED:   { bg: 'bg-amber-500',   text: 'text-white', label: 'DISPATCHÉ',       pulse: false, iconColor: 'text-amber-600' },
    ON_SITE:      { bg: 'bg-sky-600',     text: 'text-white', label: 'SUR PLACE',       pulse: false, iconColor: 'text-sky-600' },
    CLOSED:       { bg: 'bg-emerald-600', text: 'text-white', label: 'CLÔTURÉ',         pulse: false, iconColor: 'text-emerald-600' },
    FALSE_ALARM:  { bg: 'bg-slate-500',   text: 'text-white', label: 'FAUSSE ALERTE',   pulse: false, iconColor: 'text-slate-600' },
};

const REASON_LABELS: Record<string, string> = {
    MEDICAL: 'Urgence médicale',
    ACCIDENT_TRAVAIL: 'Accident du travail',
    INCENDIE: 'Incendie',
    AGRESSION: 'Agression',
    FUITE_CHIMIQUE: 'Fuite chimique',
    EFFONDREMENT: 'Effondrement',
    AUTRE: 'Autre',
};

const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatElapsed = (sec?: number) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${sec % 60}s`;
    if (m > 0) return `${m}m ${sec % 60}s`;
    return `${sec}s`;
};

const SosDetailPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const currentUser = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const { subscribe } = useEmergencyWebSocket();

    const [alert, setAlert] = useState<SosAlertDTO | null>(null);
    const [lifecycle, setLifecycle] = useState<SosLifecycleEventDTO[]>([]);
    const [teams, setTeams] = useState<RescueTeamDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [acting, setActing] = useState(false);

    // Modal dispatch
    const [dispatchOpen, setDispatchOpen] = useState(false);
    const [dispatchTeam, setDispatchTeam] = useState<string | null>(null);
    const [dispatchNote, setDispatchNote] = useState('');

    // Modal false alarm
    const [falseAlarmOpen, setFalseAlarmOpen] = useState(false);
    const [falseAlarmReason, setFalseAlarmReason] = useState<string | null>('TEST');
    const [falseAlarmNote, setFalseAlarmNote] = useState('');

    // Modal confirm close (custom)
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    // ── Chargement ──
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setLoadError(null);
        Promise.all([
            getSosAlert(Number(id)).then(setAlert),
            getSosLifecycle(Number(id)).then(setLifecycle).catch(() => setLifecycle([])),
        ])
            .catch((err: any) => {
                const msg = err?.response?.status === 404
                    ? 'Alerte SOS introuvable.'
                    : "Erreur lors du chargement de l'alerte.";
                setLoadError(msg);
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!selectedCompanyId) return;
        listRescueTeams(selectedCompanyId).then(setTeams).catch(() => setTeams([]));
    }, [selectedCompanyId]);

    // ── Mise à jour live ──
    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribe((upd) => {
            if (upd.id === Number(id)) {
                setAlert(upd);
                getSosLifecycle(Number(id)).then(setLifecycle).catch((err) => console.error(err));
            }
        });
        return unsubscribe;
    }, [id, subscribe]);

    // ── Actions ──
    const refreshLifecycle = () =>
        getSosLifecycle(Number(id)).then(setLifecycle).catch((err) => console.error(err));

    const handleAcknowledge = async () => {
        if (!alert?.id) return;
        setActing(true);
        try {
            const upd = await acknowledgeSosAlert(alert.id, { note: 'Prise en charge depuis la page détail' }, currentUser?.id);
            setAlert(upd);
            await refreshLifecycle();
            successNotification('Alerte prise en charge');
        } catch {
            errorNotification('Échec — vérifiez l\'état actuel');
        } finally {
            setActing(false);
        }
    };

    const handleDispatch = async () => {
        if (!alert?.id || !dispatchTeam) return;
        setActing(true);
        try {
            const upd = await dispatchSosAlert(
                alert.id,
                { rescueTeamId: Number(dispatchTeam), note: dispatchNote || null },
                currentUser?.id
            );
            setAlert(upd);
            await refreshLifecycle();
            successNotification('Équipe dispatchée');
            setDispatchOpen(false);
        } catch {
            errorNotification('Échec du dispatch');
        } finally {
            setActing(false);
        }
    };

    const handleOnSite = async () => {
        if (!alert?.id) return;
        setActing(true);
        try {
            const upd = await onSiteSosAlert(alert.id, { note: "Équipe arrivée sur le lieu d'intervention" }, currentUser?.id);
            setAlert(upd);
            await refreshLifecycle();
            successNotification('Équipe sur place');
        } catch {
            errorNotification('Échec de la transition');
        } finally {
            setActing(false);
        }
    };

    const handleClose = async () => {
        if (!alert?.id) return;
        setActing(true);
        try {
            const upd = await closeSosAlert(alert.id, { note: 'Alerte clôturée — incident résolu' }, currentUser?.id);
            setAlert(upd);
            await refreshLifecycle();
            successNotification('Alerte clôturée');
            setConfirmCloseOpen(false);
        } catch {
            errorNotification('Échec de la clôture');
        } finally {
            setActing(false);
        }
    };

    const handleFalseAlarm = async () => {
        if (!alert?.id) return;
        setActing(true);
        try {
            const upd = await falseAlarmSosAlert(
                alert.id,
                { falseAlarmReason: falseAlarmReason ?? 'TEST', note: falseAlarmNote || null },
                currentUser?.id
            );
            setAlert(upd);
            await refreshLifecycle();
            successNotification('Alerte marquée comme fausse alerte');
            setFalseAlarmOpen(false);
        } catch {
            errorNotification('Échec — vérifiez l\'état actuel');
        } finally {
            setActing(false);
        }
    };

    const availableActions = useMemo(() => {
        if (!alert) return [] as Array<'ACK' | 'DISP' | 'ONSITE' | 'CLOSE' | 'FALSE'>;
        switch (alert.status) {
            case 'RECEIVED':     return ['ACK', 'FALSE'];
            case 'ACKNOWLEDGED': return ['DISP', 'CLOSE', 'FALSE'];
            case 'DISPATCHED':   return ['ONSITE', 'CLOSE', 'FALSE'];
            case 'ON_SITE':      return ['CLOSE', 'FALSE'];
            default: return [];
        }
    }, [alert]);

    // ── Empty / error ──
    if (loading) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <IconUrgent size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                </div>
            </div>
        );
    }
    if (loadError || !alert) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={32} className="text-red-500 mx-auto mb-3" stroke={1.6} />
                    <p className="text-[13px] text-slate-700 mb-4">{loadError ?? 'Données indisponibles.'}</p>
                    <button
                        type="button"
                        onClick={() => navigate('/emergency/sos')}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800"
                    >
                        <IconArrowLeft size={12} stroke={2} />
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    const meta = STATUS_META[alert.status];
    const reasonLabel = alert.reasonCode ? (REASON_LABELS[alert.reasonCode] ?? alert.reasonCode) : 'Non précisé';

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: 'Suivi SOS', to: '/emergency/sos' },
                    { label: `Alerte #${alert.id}` },
                ]}
                useSafeXLogo
                title={`Alerte SOS #${alert.id}`}
                subtitle={reasonLabel}
                actions={
                    <button
                        type="button"
                        onClick={() => navigate('/emergency/sos')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <IconArrowLeft size={12} stroke={2} />
                        Retour
                    </button>
                }
            />

            {/* Bandeau statut large */}
            <div className={`mt-5 ${meta.bg} rounded-xl px-5 py-4 flex items-center justify-between shadow-sm`}>
                <div className="flex items-center gap-3">
                    <IconUrgent size={28} stroke={2.2} className={meta.text} />
                    <div>
                        <p className={`text-[11px] uppercase tracking-[0.15em] font-bold ${meta.text} ${meta.pulse ? 'animate-pulse' : ''}`}>
                            {meta.label}
                        </p>
                        <p className={`text-[18px] ${meta.text} mt-0.5`} style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                            {reasonLabel}
                        </p>
                    </div>
                </div>
                <div className={`text-right ${meta.text}`}>
                    <p className="text-[10.5px] uppercase tracking-wider opacity-80">Temps écoulé</p>
                    <p className="text-[22px] font-mono" style={{ fontWeight: 600 }}>
                        {formatElapsed(alert.elapsedSeconds)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
                {/* Colonne principale */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Détails */}
                    <Card title="Détails de l'alerte" icon={<IconAlertTriangle size={14} stroke={1.7} />}>
                        <div className="space-y-4">
                            {alert.description && (
                                <div>
                                    <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Message</p>
                                    <p className="text-[13px] text-slate-800 italic bg-slate-50 px-3 py-2 rounded-md border-l-2 border-l-red-300">
                                        « {alert.description} »
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <DetailField label="Employé déclencheur" icon={<IconUser size={11} stroke={1.8} />}>
                                    {alert.employeeName ?? `#${alert.employeeId}`}
                                </DetailField>
                                <DetailField label="Coordinateur" icon={<IconShield size={11} stroke={1.8} />}>
                                    {alert.coordinatorName ?? (alert.coordinatorId ? `#${alert.coordinatorId}` : <em className="text-slate-400">Non assigné</em>)}
                                </DetailField>
                                <DetailField label="Équipe dispatchée" icon={<IconUsersGroup size={11} stroke={1.8} />}>
                                    {alert.rescueTeamName ?? <em className="text-slate-400">Aucune</em>}
                                </DetailField>
                                <DetailField label="Mode" icon={<IconCircle size={11} stroke={1.8} />}>
                                    {alert.drillMode ? <span className="text-amber-700">Exercice (drill)</span> : 'Réel'}
                                </DetailField>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1 inline-flex items-center gap-1">
                                    <IconMapPin size={9} stroke={1.8} />
                                    Position GPS
                                </p>
                                <p className="text-[14px] text-slate-800 font-mono">
                                    {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                                </p>
                                {alert.gpsAccuracy && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Précision : ±{Math.round(alert.gpsAccuracy)} m
                                    </p>
                                )}
                            </div>
                            {alert.falseAlarmReason && (
                                <div className="bg-slate-100 border border-slate-200 rounded-md p-3">
                                    <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Raison fausse alerte</p>
                                    <p className="text-[12.5px] text-slate-700">{alert.falseAlarmReason}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Timeline */}
                    <Card title="Chronologie" icon={<IconClock size={14} stroke={1.7} />}>
                        {lifecycle.length === 0 ? (
                            <p className="text-[12px] text-slate-400 italic">Aucun événement.</p>
                        ) : (
                            <ol className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-5 py-2">
                                {lifecycle.map((evt) => {
                                    const stMeta = STATUS_META[evt.statusTo];
                                    return (
                                        <li key={evt.id} className="relative">
                                            <span className={`absolute -left-[33px] inline-flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white shadow-sm ${stMeta.bg}`}>
                                                <IconCircleCheck size={12} stroke={1.8} className="text-white" />
                                            </span>
                                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span className={`text-[11px] uppercase tracking-wider font-semibold ${stMeta.iconColor}`}>
                                                        {stMeta.label}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 font-mono">
                                                        {formatTime(evt.createdAt)}
                                                    </span>
                                                </div>
                                                {evt.note && (
                                                    <p className="text-[12px] text-slate-700">{evt.note}</p>
                                                )}
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                                                    <IconUser size={9} stroke={1.8} />
                                                    {evt.actorName ?? (evt.actorId ? `Acteur #${evt.actorId}` : 'Système')}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </Card>
                </div>

                {/* Colonne actions */}
                <div className="space-y-5">
                    <Card title="Actions disponibles" icon={<IconShield size={14} stroke={1.7} />}>
                        {availableActions.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                                <IconCircleCheck size={24} className="text-slate-300 mx-auto mb-2" stroke={1.5} />
                                <p className="text-[12px] text-slate-500 italic">
                                    Alerte terminée, aucune action possible.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableActions.includes('ACK') && (
                                    <ActionButton
                                        onClick={handleAcknowledge}
                                        disabled={acting}
                                        color="emerald"
                                        icon={<IconCheck size={13} stroke={2.4} />}
                                    >
                                        Prendre en charge
                                    </ActionButton>
                                )}
                                {availableActions.includes('DISP') && (
                                    <ActionButton
                                        onClick={() => setDispatchOpen(true)}
                                        disabled={acting}
                                        color="amber"
                                        icon={<IconUsersGroup size={13} stroke={2} />}
                                    >
                                        Dispatcher une équipe
                                    </ActionButton>
                                )}
                                {availableActions.includes('ONSITE') && (
                                    <ActionButton
                                        onClick={handleOnSite}
                                        disabled={acting}
                                        color="sky"
                                        icon={<IconMapPin size={13} stroke={2} />}
                                    >
                                        Équipe sur place
                                    </ActionButton>
                                )}
                                {availableActions.includes('CLOSE') && (
                                    <ActionButton
                                        onClick={() => setConfirmCloseOpen(true)}
                                        disabled={acting}
                                        color="slate"
                                        icon={<IconArchive size={13} stroke={2} />}
                                    >
                                        Clôturer (résolu)
                                    </ActionButton>
                                )}
                                {availableActions.includes('FALSE') && (
                                    <ActionButton
                                        onClick={() => setFalseAlarmOpen(true)}
                                        disabled={acting}
                                        color="rose"
                                        icon={<IconPlayerPause size={13} stroke={2} />}
                                        outline
                                    >
                                        Marquer fausse alerte
                                    </ActionButton>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Horodatages */}
                    <Card title="Horodatages" icon={<IconClock size={14} stroke={1.7} />}>
                        <ul className="space-y-1.5 text-[12px]">
                            <TimestampRow label="Déclenchement" iso={alert.triggeredAt} bold />
                            <TimestampRow label="Pris en charge" iso={alert.acknowledgedAt} />
                            <TimestampRow label="Dispatché" iso={alert.dispatchedAt} />
                            <TimestampRow label="Sur place" iso={alert.onSiteAt} />
                            <TimestampRow label="Clôturé" iso={alert.closedAt} />
                        </ul>
                    </Card>
                </div>
            </div>

            {/* Modal Dispatch */}
            <Modal
                opened={dispatchOpen}
                onClose={() => !acting && setDispatchOpen(false)}
                title="Dispatcher une équipe de secours"
                centered
                size="sm"
            >
                <div className="space-y-3 mt-2">
                    <Select
                        label="Équipe à dispatcher"
                        data={teams.filter((t) => t.status !== 'INACTIVE').map((t) => ({
                            value: String(t.id),
                            label: `${t.name} (${t.memberCount ?? 0} membres)`,
                        }))}
                        value={dispatchTeam}
                        onChange={setDispatchTeam}
                        searchable
                        placeholder="Choisir une équipe"
                    />
                    <textarea
                        value={dispatchNote}
                        onChange={(e) => setDispatchNote(e.target.value)}
                        rows={2}
                        placeholder="Note pour l'équipe (optionnel)"
                        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setDispatchOpen(false)}
                            disabled={acting}
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleDispatch}
                            disabled={acting || !dispatchTeam}
                            className="px-3.5 py-1.5 rounded-md bg-amber-600 text-white text-[12.5px] font-semibold hover:bg-amber-700 disabled:opacity-40"
                        >
                            {acting ? '…' : 'Dispatcher'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Confirm Close — popup custom */}
            <ConfirmModal
                opened={confirmCloseOpen}
                onClose={() => setConfirmCloseOpen(false)}
                onConfirm={handleClose}
                tone="warning"
                title="Clôturer cette alerte SOS ?"
                message={
                    <>
                        L'alerte sera marquée comme <strong>résolue</strong> et figée dans l'historique.
                        Cette action est tracée dans le journal d'audit (rétention 5 ans, ISO 45001).
                        <br />
                        <br />
                        <span className="text-slate-500 text-[11.5px]">
                            Vous ne pourrez plus modifier l'état après clôture.
                        </span>
                    </>
                }
                confirmLabel="Clôturer définitivement"
                icon={<IconArchive size={20} stroke={1.8} />}
                loading={acting}
            />

            {/* Modal False Alarm */}
            <Modal
                opened={falseAlarmOpen}
                onClose={() => !acting && setFalseAlarmOpen(false)}
                title="Marquer comme fausse alerte"
                centered
                size="sm"
            >
                <div className="space-y-3 mt-2">
                    <Select
                        label="Raison"
                        data={[
                            { value: 'TEST', label: 'Test / Exercice' },
                            { value: 'ERREUR_MANIPULATION', label: 'Erreur de manipulation' },
                            { value: 'INCIDENT_RESOLU_SEUL', label: 'Incident résolu seul' },
                            { value: 'AUTRE', label: 'Autre raison' },
                        ]}
                        value={falseAlarmReason}
                        onChange={setFalseAlarmReason}
                    />
                    <textarea
                        value={falseAlarmNote}
                        onChange={(e) => setFalseAlarmNote(e.target.value)}
                        rows={2}
                        placeholder="Précisions (optionnel)"
                        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    />
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setFalseAlarmOpen(false)}
                            disabled={acting}
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleFalseAlarm}
                            disabled={acting}
                            className="px-3.5 py-1.5 rounded-md bg-rose-600 text-white text-[12.5px] font-semibold hover:bg-rose-700 disabled:opacity-40"
                        >
                            {acting ? '…' : 'Confirmer'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// ── Sous-composants ────────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="text-slate-500">{icon}</span>
                <h3
                    className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                >
                    {title}
                </h3>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function DetailField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-slate-50/40 border border-slate-200 rounded-md p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 inline-flex items-center gap-1">
                {icon}
                {label}
            </p>
            <p className="text-[12.5px] text-slate-800">{children}</p>
        </div>
    );
}

const ACTION_COLORS: Record<string, { bg: string; hover: string; outlineText: string; outlineBorder: string }> = {
    emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', outlineText: 'text-emerald-700', outlineBorder: 'border-emerald-300' },
    amber:   { bg: 'bg-amber-600',   hover: 'hover:bg-amber-700',   outlineText: 'text-amber-700',   outlineBorder: 'border-amber-300' },
    sky:     { bg: 'bg-sky-600',     hover: 'hover:bg-sky-700',     outlineText: 'text-sky-700',     outlineBorder: 'border-sky-300' },
    slate:   { bg: 'bg-slate-700',   hover: 'hover:bg-slate-800',   outlineText: 'text-slate-700',   outlineBorder: 'border-slate-300' },
    rose:    { bg: 'bg-rose-600',    hover: 'hover:bg-rose-700',    outlineText: 'text-rose-700',    outlineBorder: 'border-rose-300' },
};

function ActionButton({
    onClick,
    disabled,
    color,
    icon,
    children,
    outline,
}: {
    onClick: () => void;
    disabled?: boolean;
    color: keyof typeof ACTION_COLORS;
    icon: React.ReactNode;
    children: React.ReactNode;
    outline?: boolean;
}) {
    const c = ACTION_COLORS[color];
    if (outline) {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white border ${c.outlineBorder} ${c.outlineText} text-[12.5px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50`}
            >
                {icon}
                {children}
            </button>
        );
    }
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md ${c.bg} text-white text-[12.5px] font-semibold ${c.hover} transition-colors shadow-sm disabled:opacity-50`}
        >
            {icon}
            {children}
        </button>
    );
}

function TimestampRow({ label, iso, bold }: { label: string; iso?: string | null; bold?: boolean }) {
    return (
        <li className={`flex justify-between gap-2 py-1 border-b border-slate-100 last:border-0 ${bold ? 'font-semibold' : ''}`}>
            <span className="text-slate-600">{label}</span>
            <span className={`font-mono text-[11px] ${iso ? 'text-slate-800' : 'text-slate-400'}`}>
                {formatTime(iso)}
            </span>
        </li>
    );
}

export default SosDetailPage;
