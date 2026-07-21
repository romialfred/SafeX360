import { useEffect, useMemo, useRef, useState } from 'react';
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
    IconArchive,
    IconPlayerPause,
    IconPhone,
    IconMessage,
    IconMessages,
    IconSend,
    IconSearch,
    IconRun,
    IconHeartHandshake,
    IconShieldCheck,
    IconInfoCircle,
    IconActivity,
    IconPhoneCall,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import ConfirmModal from '../../UtilityComp/ConfirmModal';
import { useAppSelector } from '../../../slices/hooks';
import { useCanCloseEmergency } from '../useEmergencyCoordinator';
import {
    getSosAlert,
    getSosLifecycle,
    acknowledgeSosAlert,
    dispatchSosAlert,
    onSiteSosAlert,
    closeSosAlert,
    falseAlarmSosAlert,
    listSosMessages,
    postSosMessage,
    type SosAlertDTO,
    type SosLifecycleEventDTO,
    type SosMessageDTO,
    type SosStatus,
} from '../../../services/SosService';
import { listRescueTeams, type RescueTeamDTO } from '../../../services/EmergencyService';
import { useEmergencyWebSocket } from './EmergencyWebSocketProvider';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';
import { SOS_REASON_LABELS } from './sosLabels';

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

const REASON_LABELS = SOS_REASON_LABELS;

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

/** Heure courte HH:MM d'un message du fil. */
const formatClock = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

/** États terminaux : le SOS n'est plus « en cours ». */
const isTerminalStatus = (s?: SosStatus) => s === 'CLOSED' || s === 'FALSE_ALARM';

/**
 * Journal d'intervention : boutons rapides qui tracent une étape dans le fil
 * SANS changer le statut de la machine à états.
 */
const JOURNAL_STEPS: Array<{ label: string; body: string; Icon: typeof IconRun }> = [
    { label: 'Équipe sur place',    body: '➡️ Étape : Équipe sur place',    Icon: IconMapPin },
    { label: 'Recherche en cours',  body: '➡️ Étape : Recherche en cours',  Icon: IconSearch },
    { label: 'Évacuation en cours', body: '➡️ Étape : Évacuation en cours', Icon: IconRun },
    { label: 'Personne sauvée',     body: '➡️ Étape : Personne sauvée',     Icon: IconHeartHandshake },
    { label: 'Zone sécurisée',      body: '➡️ Étape : Zone sécurisée',      Icon: IconShieldCheck },
];

const SosDetailPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const currentUser = useAppSelector((state: any) => state.user);
    // Seul un coordinateur (ou un admin) peut clore un SOS (fermeture / fausse alerte).
    const { canClose } = useCanCloseEmergency(currentUser?.id, currentUser?.role);
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

    // Chrono live (tic seconde) tant que le SOS n'est pas clos.
    const [nowTs, setNowTs] = useState<number>(() => Date.now());

    // Fil de communication (chat) avec le concerné.
    const [messages, setMessages] = useState<SosMessageDTO[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);

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

    // ── Chrono live : tic chaque seconde tant que le SOS est actif ──
    useEffect(() => {
        if (!alert || isTerminalStatus(alert.status)) return;
        const t = setInterval(() => setNowTs(Date.now()), 1000);
        return () => clearInterval(t);
    }, [alert?.status]);

    // ── Fil de communication : chargement + polling 4 s ──
    //
    // Le provider WebSocket n'expose qu'un abonnement au niveau ALERTE
    // (changements d'état), pas un canal générique par message. On rafraîchit
    // donc le fil par polling léger toutes les 4 s : simple et robuste, sans
    // toucher au provider WS partagé.
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        const load = () =>
            listSosMessages(Number(id))
                .then((rows) => {
                    if (cancelled) return;
                    // Préserver les bulles optimistes (id négatif) encore en vol
                    // le temps que le POST correspondant réponde : évite qu'un tic
                    // de polling ne fasse « clignoter » un message qu'on vient
                    // d'envoyer.
                    setMessages((prev) => {
                        const pending = prev.filter((m) => m.id < 0);
                        return pending.length ? [...rows, ...pending] : rows;
                    });
                })
                .catch(() => {
                    /* le polling réessaiera au prochain tic */
                });
        load();
        const t = setInterval(load, 4000);
        return () => {
            cancelled = true;
            clearInterval(t);
        };
    }, [id]);

    // Auto-scroll du fil vers le bas à chaque nouveau message.
    useEffect(() => {
        const el = messagesScrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    // ── Actions ──
    const refreshLifecycle = () =>
        getSosLifecycle(Number(id)).then(setLifecycle).catch((err) => console.error(err));

    /**
     * Envoi d'un message dans le fil avec ajout optimiste puis réconciliation
     * sur la réponse serveur. En cas d'échec, on retire la bulle optimiste.
     */
    const sendMessage = async (rawBody: string) => {
        const body = rawBody.trim();
        if (!body || !id) return;
        setSending(true);
        const tempId = -Date.now();
        const optimistic: SosMessageDTO = {
            id: tempId,
            sosAlertId: Number(id),
            senderType: 'COORDINATOR',
            senderId: currentUser?.id ?? null,
            senderName: currentUser?.name ?? null,
            body,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        try {
            const created = await postSosMessage(Number(id), body, currentUser?.id, currentUser?.name);
            setMessages((prev) => {
                if (prev.some((m) => m.id === tempId)) {
                    return prev.map((m) => (m.id === tempId ? created : m));
                }
                // La bulle optimiste a pu être retirée par un tic de polling :
                // on réinsère le message confirmé s'il n'est pas déjà présent.
                if (prev.some((m) => m.id === created.id)) return prev;
                return [...prev, created];
            });
        } catch (err) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            errorNotification(extractErrorMessage(err, "Échec de l'envoi du message"));
        } finally {
            setSending(false);
        }
    };

    const handleSendDraft = () => {
        if (!draft.trim() || sending) return;
        const text = draft;
        setDraft('');
        void sendMessage(text);
    };

    const handleAcknowledge = async () => {
        if (!alert?.id) return;
        setActing(true);
        try {
            const upd = await acknowledgeSosAlert(alert.id, { note: 'Prise en charge depuis la page détail' }, currentUser?.id);
            setAlert(upd);
            await refreshLifecycle();
            successNotification('Alerte prise en charge');
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec de la prise en charge'));
            getSosAlert(alert.id).then(setAlert).catch(() => {});
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
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec du dispatch'));
            getSosAlert(alert.id).then(setAlert).catch(() => {});
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
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec de la transition'));
            getSosAlert(alert.id).then(setAlert).catch(() => {});
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
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec de la clôture'));
            getSosAlert(alert.id).then(setAlert).catch(() => {});
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
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec du marquage fausse alerte'));
            getSosAlert(alert.id).then(setAlert).catch(() => {});
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
    const active = !isTerminalStatus(alert.status);
    // Chrono live : durée depuis le déclenchement tant que le SOS est actif ;
    // sinon on fige sur la durée renvoyée par le serveur.
    const liveElapsed = active && alert.triggeredAt
        ? Math.max(0, Math.floor((nowTs - new Date(alert.triggeredAt).getTime()) / 1000))
        : alert.elapsedSeconds;
    const phone = (alert.employeePhone ?? '').trim() || null;
    const displayName = alert.employeeName ?? `#${alert.employeeId}`;

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

            {/* EN-TÊTE CRITIQUE */}
            <div className={`mt-5 ${meta.bg} rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm`}>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/15 ${active ? 'animate-pulse' : ''}`}>
                        <IconUrgent size={26} stroke={2.2} className={meta.text} />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className={`text-[12px] uppercase tracking-[0.18em] font-extrabold ${meta.text} ${active ? 'animate-pulse' : ''}`}>
                                {active ? 'SOS EN COURS' : meta.label}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${alert.drillMode ? 'bg-amber-200 text-amber-900' : 'bg-white/20 text-white'}`}>
                                {alert.drillMode ? 'Exercice' : 'Réel'}
                            </span>
                        </div>
                        <p className={`text-[18px] ${meta.text} mt-0.5`} style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                            {reasonLabel}
                        </p>
                    </div>
                </div>
                <div className={`text-right ${meta.text}`}>
                    <p className="text-[10.5px] uppercase tracking-wider opacity-80">
                        {active ? 'Durée depuis le déclenchement' : 'Durée totale'}
                    </p>
                    <p className="text-[24px] font-mono" style={{ fontWeight: 600 }}>
                        {formatElapsed(liveElapsed)}
                    </p>
                </div>
            </div>

            {/* CONSOLE D'INTERVENTION — 2 colonnes sur xl */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mt-5">
                {/* ─── Colonne gauche : le concerné + localisation + étapes ─── */}
                <div className="xl:col-span-3 space-y-5">
                    {/* Le concerné + outils d'appel */}
                    <Card title="Le concerné" icon={<IconUser size={14} stroke={1.7} />}>
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Personne en urgence</p>
                                    <p className="text-[19px] text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                                        {displayName}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`inline-block w-2 h-2 rounded-full ${meta.bg} ${meta.pulse ? 'animate-pulse' : ''}`} />
                                        <span className="text-[11.5px] font-semibold text-slate-600">{meta.label}</span>
                                    </div>
                                </div>
                                {alert.drillMode ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-bold uppercase tracking-wider">Exercice</span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10.5px] font-bold uppercase tracking-wider">Réel</span>
                                )}
                            </div>

                            {/* Outils d'appel */}
                            <div className="flex flex-wrap items-center gap-2">
                                {phone ? (
                                    <>
                                        <a
                                            href={`tel:${phone}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            <IconPhoneCall size={16} stroke={2} />
                                            APPELER
                                            <span className="font-mono font-semibold opacity-90">{phone}</span>
                                        </a>
                                        <a
                                            href={`sms:${phone}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-[12.5px] font-semibold hover:bg-emerald-50 transition-colors"
                                        >
                                            <IconMessage size={15} stroke={2} />
                                            SMS
                                        </a>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-[12.5px] font-semibold cursor-not-allowed"
                                    >
                                        <IconPhone size={15} stroke={2} />
                                        Numéro non renseigné
                                    </button>
                                )}
                            </div>

                            {alert.description && (
                                <div>
                                    <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Message initial</p>
                                    <p className="text-[13px] text-slate-800 italic bg-slate-50 px-3 py-2 rounded-md border-l-2 border-l-red-300">
                                        « {alert.description} »
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <DetailField label="Coordinateur" icon={<IconShield size={11} stroke={1.8} />}>
                                    {alert.coordinatorName ?? (alert.coordinatorId ? `#${alert.coordinatorId}` : <em className="text-slate-400">Non assigné</em>)}
                                </DetailField>
                                <DetailField label="Équipe dépêchée" icon={<IconUsersGroup size={11} stroke={1.8} />}>
                                    {alert.rescueTeamName ?? <em className="text-slate-400">Aucune</em>}
                                </DetailField>
                            </div>

                            {alert.falseAlarmReason && (
                                <div className="bg-slate-100 border border-slate-200 rounded-md p-3">
                                    <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Raison fausse alerte</p>
                                    <p className="text-[12.5px] text-slate-700">{alert.falseAlarmReason}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Localisation GPS */}
                    <Card title="Localisation GPS" icon={<IconMapPin size={14} stroke={1.7} />}>
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                            <p className="text-[14px] text-slate-800 font-mono">
                                {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                            </p>
                            {alert.gpsAccuracy && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Précision : ±{Math.round(alert.gpsAccuracy)} m
                                </p>
                            )}
                            <a
                                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-sky-700 hover:text-sky-800"
                            >
                                <IconMapPin size={12} stroke={2} />
                                Ouvrir dans la cartographie
                            </a>
                        </div>
                    </Card>

                    {/* Étapes de l'intervention */}
                    <Card title="Étapes de l'intervention" icon={<IconShield size={14} stroke={1.7} />}>
                        {availableActions.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                                <IconCircleCheck size={24} className="text-slate-300 mx-auto mb-2" stroke={1.5} />
                                <p className="text-[12px] text-slate-500 italic">
                                    Alerte terminée, aucune transition possible.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold">Faire progresser l'intervention</p>
                                {availableActions.includes('ACK') && (
                                    <ActionButton onClick={handleAcknowledge} disabled={acting} color="emerald" icon={<IconCheck size={13} stroke={2.4} />}>
                                        Prendre en charge
                                    </ActionButton>
                                )}
                                {availableActions.includes('DISP') && (
                                    <ActionButton onClick={() => setDispatchOpen(true)} disabled={acting} color="amber" icon={<IconUsersGroup size={13} stroke={2} />}>
                                        Équipe dépêchée
                                    </ActionButton>
                                )}
                                {availableActions.includes('ONSITE') && (
                                    <ActionButton onClick={handleOnSite} disabled={acting} color="sky" icon={<IconMapPin size={13} stroke={2} />}>
                                        Équipe sur place
                                    </ActionButton>
                                )}
                                {availableActions.includes('CLOSE') && canClose && (
                                    <ActionButton onClick={() => setConfirmCloseOpen(true)} disabled={acting} color="slate" icon={<IconArchive size={13} stroke={2} />}>
                                        Clôturer (résolu)
                                    </ActionButton>
                                )}
                                {availableActions.includes('FALSE') && canClose && (
                                    <ActionButton onClick={() => setFalseAlarmOpen(true)} disabled={acting} color="rose" icon={<IconPlayerPause size={13} stroke={2} />} outline>
                                        Marquer fausse alerte
                                    </ActionButton>
                                )}
                                {(availableActions.includes('CLOSE') || availableActions.includes('FALSE')) && !canClose && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[12px] font-medium">
                                        La clôture d'un SOS est réservée à un coordinateur.
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Journal d'intervention — trace une étape sans changer le statut */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1 inline-flex items-center gap-1">
                                <IconActivity size={11} stroke={1.9} />
                                Journal d'intervention
                            </p>
                            <p className="text-[11px] text-slate-400 mb-2">Trace une étape dans le fil sans changer le statut.</p>
                            <div className="flex flex-wrap gap-1.5">
                                {JOURNAL_STEPS.map((step) => (
                                    <button
                                        key={step.label}
                                        type="button"
                                        onClick={() => void sendMessage(step.body)}
                                        disabled={sending}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11.5px] font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                                    >
                                        <step.Icon size={13} stroke={1.9} className="text-slate-500" />
                                        {step.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Chronologie */}
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

                {/* ─── Colonne droite : conversation avec le concerné ─── */}
                <div className="xl:col-span-2">
                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col xl:sticky xl:top-5 h-[620px] xl:h-[calc(100vh-7rem)] xl:max-h-[780px]">
                        <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
                            <span className="text-teal-600"><IconMessages size={15} stroke={1.7} /></span>
                            <h3
                                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                Communication avec le concerné
                            </h3>
                        </header>

                        {/* Fil de messages */}
                        <div
                            ref={messagesScrollRef}
                            className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-slate-50/40"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <IconMessages size={26} className="text-slate-300 mb-2" stroke={1.4} />
                                    <p className="text-[12px] text-slate-400 italic">
                                        Aucun message pour l'instant.
                                        <br />
                                        Ouvrez le contact avec la personne en urgence.
                                    </p>
                                </div>
                            ) : (
                                messages.map((m) => {
                                    if (m.senderType === 'SYSTEM') {
                                        return (
                                            <div key={m.id} className="flex justify-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10.5px]">
                                                    <IconInfoCircle size={11} stroke={1.8} />
                                                    <span>{m.body}</span>
                                                    <span className="font-mono opacity-70">{formatClock(m.createdAt)}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    const isCoord = m.senderType === 'COORDINATOR';
                                    return (
                                        <div key={m.id} className={`flex ${isCoord ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm ${
                                                    isCoord
                                                        ? 'bg-teal-600 text-white rounded-br-sm'
                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                                }`}
                                            >
                                                <div className={`flex items-center gap-2 mb-0.5 ${isCoord ? 'text-teal-50' : 'text-slate-500'}`}>
                                                    <span className="text-[10px] font-semibold">
                                                        {m.senderName ?? (isCoord ? 'Coordination' : 'Le concerné')}
                                                    </span>
                                                    <span className="text-[9.5px] font-mono opacity-80">{formatClock(m.createdAt)}</span>
                                                </div>
                                                <p className="text-[12.5px] whitespace-pre-wrap break-words">{m.body}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Zone de saisie */}
                        <div className="border-t border-slate-100 p-3 shrink-0">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendDraft();
                                        }
                                    }}
                                    rows={2}
                                    placeholder="Message au concerné — Entrée pour envoyer, Maj+Entrée pour un saut de ligne"
                                    className="flex-1 resize-none px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendDraft}
                                    disabled={sending || !draft.trim()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-teal-600 text-white text-[12.5px] font-semibold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-40"
                                    title="Envoyer"
                                >
                                    <IconSend size={15} stroke={2} />
                                    Envoyer
                                </button>
                            </div>
                        </div>
                    </section>
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
