/**
 * NotificationTabs — Préférences de notification (alertes in-app).
 *
 * UN SEUL réglage, mais RÉEL : pour chaque type d'événement diffusé par la
 * plateforme, l'utilisateur décide s'il veut voir l'alerte dans l'application.
 * Le choix est persisté côté serveur (table `notification_preference`) et
 * consommé par `EmergencyWebSocketProvider`, qui filtre les messages STOMP
 * avant de les remettre aux listeners (popups, sirène, toasts).
 *
 * POURQUOI SEULEMENT L'IN-APP : le dispatch d'alerte backend n'émet que par
 * WebSocket. Il n'existe aucun émetteur email, SMS ou push. Afficher des
 * interrupteurs « Email » / « SMS » (comme le faisait la maquette précédente)
 * laisserait croire qu'un coordinateur HSE sera joint par SMS pour un SOS —
 * une fausse promesse inacceptable sur un outil de sécurité.
 *
 * Style aligné sur EquipmentRegistryPage : fond crème, cartes blanches, titre
 * Source Serif 4, accent cyan/teal.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LoadingOverlay, Switch } from '@mantine/core';
import {
    IconAlertTriangle,
    IconBell,
    IconBolt,
    IconChevronRight,
    IconDeviceMobileOff,
    IconInfoCircle,
    IconRefresh,
    IconSos,
    IconUrgent,
} from '@tabler/icons-react';

import {
    getMyPreferences,
    updatePreference,
    NOTIFICATION_EVENT_TYPES,
    NOTIFICATION_EVENT_LABELS,
    NOTIFICATION_EVENT_DESCRIPTIONS,
    type NotificationEventType,
} from '../../../services/NotificationPreferenceService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/* Icône par type d'événement — repère visuel, pas d'information nouvelle. */
const EVENT_ICON: Record<NotificationEventType, React.ReactNode> = {
    SOS: <IconSos size={17} stroke={1.8} />,
    GENERAL_ALERT: <IconUrgent size={17} stroke={1.8} />,
    BLAST: <IconBolt size={17} stroke={1.8} />,
    ESCALATION: <IconAlertTriangle size={17} stroke={1.8} />,
    MISFIRE: <IconAlertTriangle size={17} stroke={1.8} />,
};

const NotificationTabs = () => {
    const navigate = useNavigate();
    const user = useSelector((state: any) => state.user);
    const userId = Number(user?.empId ?? user?.id ?? 0) || null;

    /** État courant des 5 interrupteurs. Défaut « tout actif » (opt-out serveur). */
    const [prefs, setPrefs] = useState<Record<NotificationEventType, boolean>>({
        SOS: true,
        GENERAL_ALERT: true,
        BLAST: true,
        ESCALATION: true,
        MISFIRE: true,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<NotificationEventType | null>(null);
    const [loadError, setLoadError] = useState(false);

    const fetchPrefs = useCallback(() => {
        if (!userId) {
            setLoadError(true);
            return;
        }
        setLoading(true);
        getMyPreferences(userId)
            .then((rows) => {
                // Absence de ligne = actif (opt-out serveur) : on ne coupe jamais par défaut.
                setPrefs({
                    SOS: true,
                    GENERAL_ALERT: true,
                    BLAST: true,
                    ESCALATION: true,
                    MISFIRE: true,
                    ...Object.fromEntries(
                        NOTIFICATION_EVENT_TYPES.map((type) => {
                            const row = rows.find((r) => r.eventType === type);
                            return [type, row ? row.enabled !== false : true];
                        })
                    ),
                });
                setLoadError(false);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        fetchPrefs();
    }, [fetchPrefs]);

    const handleToggle = (type: NotificationEventType, enabled: boolean) => {
        if (!userId) {
            errorNotification("Utilisateur inconnu : impossible d'enregistrer la préférence.");
            return;
        }
        const previous = prefs[type];
        setPrefs((p) => ({ ...p, [type]: enabled })); // optimiste
        setSaving(type);
        updatePreference(userId, type, enabled)
            .then(() => {
                successNotification(
                    enabled
                        ? `« ${NOTIFICATION_EVENT_LABELS[type]} » — vous recevrez ces alertes dans l'application.`
                        : `« ${NOTIFICATION_EVENT_LABELS[type]} » — ces alertes ne s'afficheront plus.`
                );
                setLoadError(false);
            })
            .catch(() => {
                setPrefs((p) => ({ ...p, [type]: previous })); // rollback
                errorNotification("Enregistrement impossible. La préférence n'a pas été modifiée.");
            })
            .finally(() => setSaving(null));
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full max-w-4xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span
                        className="uppercase tracking-[0.16em] font-medium cursor-pointer hover:text-slate-700"
                        onClick={() => navigate('/settings')}
                    >
                        Paramètres
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        Préférences de notification
                    </span>
                </div>

                {/* Hero */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                <IconBell size={18} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight truncate"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(17px, 1.6vw, 20px)',
                                        letterSpacing: '-0.015em',
                                    }}
                                >
                                    Préférences de notification
                                </h1>
                                <p className="text-[12px] text-slate-500 truncate">
                                    Choisissez les alertes que vous souhaitez voir apparaître dans
                                    l&apos;application
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={fetchPrefs}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 flex-shrink-0"
                        >
                            <IconRefresh size={13} stroke={1.8} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Actualiser</span>
                        </button>
                    </div>
                </div>

                {/* Encart honnêteté des canaux — NE JAMAIS laisser croire à un canal inexistant. */}
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <IconDeviceMobileOff
                        size={17}
                        stroke={1.8}
                        className="text-amber-700 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-[12.5px] leading-relaxed text-amber-900">
                        Seules les alertes <strong>dans l&apos;application</strong> sont concernées.
                        L&apos;envoi par email, SMS ou push n&apos;est pas encore disponible sur cette
                        plateforme.
                    </p>
                </div>

                {loadError && (
                    <div className="mb-4 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                        <IconInfoCircle
                            size={17}
                            stroke={1.8}
                            className="text-slate-600 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-[12.5px] leading-relaxed text-slate-700">
                            Vos préférences n&apos;ont pas pu être chargées. Par sécurité,{' '}
                            <strong>toutes les alertes continuent de s&apos;afficher</strong> tant que
                            le réglage n&apos;est pas disponible.
                        </p>
                    </div>
                )}

                {/* Liste des types d'événement */}
                <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <LoadingOverlay visible={loading} zIndex={5} overlayProps={{ blur: 1 }} />
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em]">
                            Alertes dans l&apos;application
                        </h2>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {NOTIFICATION_EVENT_TYPES.map((type) => (
                            <li
                                key={type}
                                className="px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-lg bg-cyan-50 ring-1 ring-cyan-100 flex items-center justify-center text-cyan-700 flex-shrink-0">
                                    {EVENT_ICON[type]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[13.5px] text-slate-900 font-medium">
                                        {NOTIFICATION_EVENT_LABELS[type]}
                                    </div>
                                    <div className="text-[12px] text-slate-500">
                                        {NOTIFICATION_EVENT_DESCRIPTIONS[type]}
                                    </div>
                                </div>
                                <Switch
                                    checked={prefs[type]}
                                    disabled={saving === type || loading || !userId}
                                    onChange={(e) => handleToggle(type, e.currentTarget.checked)}
                                    color="teal"
                                    size="md"
                                    label="Recevoir dans l'application"
                                    labelPosition="left"
                                    classNames={{
                                        label: '!text-[12px] !text-slate-600 whitespace-nowrap',
                                    }}
                                    className="flex-shrink-0"
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">
                    Les préférences s&apos;appliquent à la mine active et sont enregistrées
                    immédiatement — il n&apos;y a rien de plus à valider.
                </p>
            </div>
        </div>
    );
};

export default NotificationTabs;
