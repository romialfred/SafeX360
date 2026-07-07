import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Textarea, Tooltip, Loader, Alert } from '@mantine/core';
import {
    IconUrgent,
    IconMapPin,
    IconClock,
    IconCheck,
    IconPhone,
    IconAlertOctagon,
    IconHeartbeat,
    IconFlame,
    IconMountain,
    IconBiohazard,
    IconShieldX,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';
import { createSosAlert } from '../../../services/SosService';
import { enqueueSos } from '../../../utility/OfflineSosQueue';

/**
 * Bouton SOS : signal d'urgence direct au coordinateur HSE.
 *
 * <p>Refonte v2 (LOT 49 — UX urgence) :</p>
 * <ul>
 *   <li>5 tuiles tactiles (touch-friendly &ge; 56px) au lieu d'une liste
 *       déroulante : impossible de scroller / cliquer une option en panique</li>
 *   <li>Tuile « URGENCE GÉNÉRALE » pré-sélectionnée par défaut</li>
 *   <li>Compte à rebours automatique : 30 s sans action → overlay rouge
 *       15 s avant envoi automatique (description suffix dédié)</li>
 *   <li>Localisation FR/EN complète via {@code emergency.sos.*}</li>
 * </ul>
 */

type ReasonCode = 'GENERAL' | 'MEDICAL' | 'FIRE' | 'COLLAPSE' | 'CHEMICAL' | 'ARMED_ATTACK';

interface Tile {
    code: ReasonCode;
    /** Couleur Tailwind racine — base pour border + bg + text */
    color: 'slate' | 'red' | 'orange' | 'amber' | 'emerald' | 'fuchsia';
    Icon: typeof IconAlertOctagon;
}

const TILES: Tile[] = [
    { code: 'GENERAL',      color: 'slate',   Icon: IconAlertOctagon },
    { code: 'MEDICAL',      color: 'red',     Icon: IconHeartbeat },
    { code: 'FIRE',         color: 'orange',  Icon: IconFlame },
    { code: 'COLLAPSE',     color: 'amber',   Icon: IconMountain },
    { code: 'CHEMICAL',     color: 'emerald', Icon: IconBiohazard },
    { code: 'ARMED_ATTACK', color: 'fuchsia', Icon: IconShieldX },
];

/** Délais (en ms) du système d'auto-transmission. Centralisés pour relecture. */
const AUTO_PROMPT_DELAY_MS = 30_000; // Délai avant affichage du compte à rebours
const AUTO_COUNTDOWN_SECONDS = 15;   // Durée du compte à rebours visible

/**
 * Classes Tailwind dérivées par couleur — déclarées en clair pour ne pas
 * casser le purge JIT (chaînes complètes).
 *
 * <p>v3 : background coloré semi-transparent (chaque tuile a un léger fond teinté
 * de sa couleur thématique même non-sélectionnée), icônes colorées à 100% du temps
 * (jamais grises), tuile sélectionnée renforce intensité bg + ring + scale.</p>
 */
const COLOR_CLASSES: Record<Tile['color'], {
    borderSelected: string;
    borderIdle: string;
    bgSelected: string;
    bgIdle: string;
    iconColor: string;
    textSelected: string;
}> = {
    slate: {
        borderSelected: 'border-slate-600 ring-2 ring-slate-300',
        borderIdle: 'border-slate-200',
        bgSelected: 'bg-slate-100/80',
        bgIdle: 'bg-slate-50/40',
        iconColor: 'text-slate-700',
        textSelected: 'text-slate-900',
    },
    red: {
        borderSelected: 'border-red-600 ring-2 ring-red-200',
        borderIdle: 'border-red-100',
        bgSelected: 'bg-red-100/70',
        bgIdle: 'bg-red-50/30',
        iconColor: 'text-red-600',
        textSelected: 'text-red-900',
    },
    orange: {
        borderSelected: 'border-orange-600 ring-2 ring-orange-200',
        borderIdle: 'border-orange-100',
        bgSelected: 'bg-orange-100/70',
        bgIdle: 'bg-orange-50/30',
        iconColor: 'text-orange-600',
        textSelected: 'text-orange-900',
    },
    amber: {
        borderSelected: 'border-amber-700 ring-2 ring-amber-200',
        borderIdle: 'border-amber-100',
        bgSelected: 'bg-amber-100/70',
        bgIdle: 'bg-amber-50/30',
        iconColor: 'text-amber-700',
        textSelected: 'text-amber-900',
    },
    emerald: {
        borderSelected: 'border-emerald-700 ring-2 ring-emerald-200',
        borderIdle: 'border-emerald-100',
        bgSelected: 'bg-emerald-100/70',
        bgIdle: 'bg-emerald-50/30',
        iconColor: 'text-emerald-700',
        textSelected: 'text-emerald-900',
    },
    fuchsia: {
        borderSelected: 'border-fuchsia-700 ring-2 ring-fuchsia-200',
        borderIdle: 'border-fuchsia-100',
        bgSelected: 'bg-fuchsia-100/70',
        bgIdle: 'bg-fuchsia-50/30',
        iconColor: 'text-fuchsia-700',
        textSelected: 'text-fuchsia-900',
    },
};

const SosButton = () => {
    // Namespaces : 'navigation' pour le bouton header, 'emergency' pour le formulaire.
    const { t } = useTranslation(['navigation', 'emergency']);
    const navigate = useNavigate();
    const [opened, { open, close }] = useDisclosure(false);
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);

    const [message, setMessage] = useState('');
    const [reasonCode, setReasonCode] = useState<ReasonCode>('GENERAL');
    const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // ── Auto-transmission state ──
    // null = aucun overlay actif. 15..1 = countdown en cours.
    const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
    const promptTimerRef = useRef<number | null>(null);   // setTimeout(30s) → affiche overlay
    const tickTimerRef = useRef<number | null>(null);     // setInterval(1s)  → décrémente
    const autoTriggeredRef = useRef(false);               // garde anti-double-envoi

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            return;
        }
        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setLocationStatus('granted');
            },
            () => setLocationStatus('denied'),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    /** Nettoie tous les timers liés à l'auto-transmission. Idempotent. */
    const clearAutoTimers = () => {
        if (promptTimerRef.current !== null) {
            window.clearTimeout(promptTimerRef.current);
            promptTimerRef.current = null;
        }
        if (tickTimerRef.current !== null) {
            window.clearInterval(tickTimerRef.current);
            tickTimerRef.current = null;
        }
    };

    const handleOpen = () => {
        open();
        setSent(false);
        setReasonCode('GENERAL');
        autoTriggeredRef.current = false;
        requestLocation();
    };

    const handleClose = () => {
        close();
        clearAutoTimers();
        setAutoCountdown(null);
        setMessage('');
        setPosition(null);
        setLocationStatus('idle');
        setSent(false);
        setReasonCode('GENERAL');
        autoTriggeredRef.current = false;
    };

    /**
     * Construit le payload SOS commun.
     * @param autoTransmitted true si déclenché par le countdown (suffix dédié)
     */
    /**
     * Résout l'identifiant de la mine pour le SOS.
     * Priorité : sélecteur header > mine d'attache du user > fallback 1.
     * Le SOS NE DOIT JAMAIS bloquer pour absence de contexte mine —
     * une vie est en jeu : on transmet même en mode "Vue consolidée".
     */
    const resolveCompanyId = (): number => {
        return Number(
            selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
        );
    };

    /**
     * Resolution tolerante de l'identifiant utilisateur. Le JWT decode peut
     * exposer le claim sous {id}, {empId}, {userId} ou {sub} selon le
     * backend emetteur. Fallback final 14 (compte Romuald TIEGNAN seede)
     * pour ne JAMAIS bloquer un SOS — une vie est en jeu.
     */
    const resolveUserId = (): number => {
        return Number(
            user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 14,
        );
    };

    const buildPayload = (autoTransmitted: boolean) => {
        const base = (message || '').trim();
        const suffix = autoTransmitted ? t('emergency:sos.autoTransmit.descriptionSuffix') : '';
        const description = autoTransmitted
            ? (base ? `${base}${suffix}` : suffix.trim())
            : (base || null);
        return {
            companyId: resolveCompanyId(),
            employeeId: resolveUserId(),
            reasonCode,
            description,
            latitude: position?.lat ?? 0,
            longitude: position?.lng ?? 0,
            gpsAccuracy: position?.accuracy ?? null,
            status: 'RECEIVED' as const,
            drillMode: false,
        };
    };

    const handleSend = async (autoTransmitted = false) => {
        // Le SOS NE BLOQUE JAMAIS : meme sans contexte mine et meme sans
        // claim id explicite, on transmet (fallback 1 / 14). Une vie peut
        // etre en jeu, on accepte un audit imparfait plutot qu'un silence.
        // Annule l'auto-transmit dès qu'on commence l'envoi
        clearAutoTimers();
        setAutoCountdown(null);
        setSending(true);
        const payload = buildPayload(autoTransmitted);
        try {
            const saved = await createSosAlert(payload, resolveUserId());
            setSent(true);
            successNotification(t('emergency:sos.notifications.success'));
            setTimeout(() => {
                handleClose();
                if (saved.id) navigate(`/emergency/sos/${saved.id}`);
            }, 2000);
        } catch {
            // ── Fallback hors-ligne : enqueue dans IndexedDB ──
            try {
                await enqueueSos(payload, Number(user.id));
                setSent(true);
                successNotification(t('emergency:sos.notifications.offlineQueued'));
                setTimeout(handleClose, 2500);
            } catch (err) {
                errorNotification(extractErrorMessage(err, t('emergency:sos.notifications.criticalFailure')));
            }
        } finally {
            setSending(false);
        }
    };

    // ─── Auto-transmission : arme le timer 30 s à l'ouverture du modal ───
    useEffect(() => {
        if (!opened || sent) return;
        // Reset garde + arme la prompt
        autoTriggeredRef.current = false;
        clearAutoTimers();
        promptTimerRef.current = window.setTimeout(() => {
            // Démarre le countdown visible
            setAutoCountdown(AUTO_COUNTDOWN_SECONDS);
            tickTimerRef.current = window.setInterval(() => {
                setAutoCountdown((prev) => {
                    if (prev === null) return null;
                    const next = prev - 1;
                    if (next <= 0) {
                        // Stop le tick, déclenche l'envoi auto une seule fois
                        if (tickTimerRef.current !== null) {
                            window.clearInterval(tickTimerRef.current);
                            tickTimerRef.current = null;
                        }
                        if (!autoTriggeredRef.current) {
                            autoTriggeredRef.current = true;
                            // Différé pour laisser React réconcilier avant l'await
                            window.setTimeout(() => { void handleSend(true); }, 0);
                        }
                        return 0;
                    }
                    return next;
                });
            }, 1000);
        }, AUTO_PROMPT_DELAY_MS);

        return () => {
            clearAutoTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, sent]);

    // Nettoyage final à l'unmount du composant
    useEffect(() => () => clearAutoTimers(), []);

    /** Annule le countdown automatique et ferme le modal sans envoyer. */
    const handleCancelAuto = () => {
        clearAutoTimers();
        setAutoCountdown(null);
        handleClose();
    };

    /** Force l'envoi manuel depuis l'overlay countdown. */
    const handleManualSendFromCountdown = () => {
        void handleSend(false);
    };

    const reasonLabel = useMemo(
        () => t(`emergency:sos.reasons.${reasonCode.toLowerCase()}`),
        [reasonCode, t]
    );

    return (
        <>
            <Tooltip label={t('navigation:header.sosTooltip')} position="bottom">
                <button
                    onClick={handleOpen}
                    className="safex-gyrophare-sos group relative inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white text-[12px] font-bold uppercase tracking-[0.15em] shadow-[0_4px_14px_rgba(239,68,68,0.45)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.6)] ring-1 ring-red-400/60 hover:brightness-110 transition-[filter,box-shadow,background-color] duration-200 overflow-visible flex-shrink-0"
                >
                    {/* Halos gyrophare — 3 anneaux pulsés décalés */}
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--red"></span>
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--red safex-gyrophare-ring--delay-1"></span>
                    {/* Glow intérieur */}
                    <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none"></span>
                    {/* Icône dans cercle blanc semi-transparent (effet boîte d'alarme) */}
                    <span aria-hidden className="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30 group-hover:ring-white/50 transition-all">
                        <IconUrgent size={13} stroke={2.4} className="drop-shadow-sm" />
                    </span>
                    <span className="relative z-10 drop-shadow-sm">{t('navigation:header.sos')}</span>
                </button>
            </Tooltip>

            <Modal
                opened={opened}
                onClose={handleClose}
                centered
                size="lg"
                radius="md"
                withCloseButton={!sending && autoCountdown === null}
                closeOnClickOutside={autoCountdown === null && !sending}
                closeOnEscape={autoCountdown === null && !sending}
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <IconUrgent size={18} className="text-red-700" />
                        </div>
                        <div>
                            <p className="text-base text-slate-900">{t('emergency:sos.title')}</p>
                            <p className="text-[11px] text-slate-500">{t('emergency:sos.tagline')}</p>
                        </div>
                    </div>
                }
            >
                {sent ? (
                    <Alert color="green" icon={<IconCheck size={18} />} variant="light">
                        <p className="font-medium">{t('emergency:sos.success.title')}</p>
                        <p className="text-xs mt-1">{t('emergency:sos.success.body')}</p>
                    </Alert>
                ) : (
                    <div className="space-y-3">
                        {/* Identité utilisateur */}
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm">
                                {(typeof user?.name === 'string' && user.name.trim()) ? user.name.trim().split(' ').filter((w: string) => w).map((n: string) => n[0]).join('').slice(0, 2) : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 truncate">{user?.name || t('emergency:sos.user.fallbackName')}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user?.role || t('emergency:sos.user.fallbackRole')}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <IconClock size={12} />
                                <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        {/* Localisation */}
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-start gap-3">
                            <IconMapPin size={18} className="text-slate-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-xs">
                                <p className="text-slate-900">{t('emergency:sos.location.label')}</p>
                                {locationStatus === 'requesting' && (
                                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                                        <Loader size="xs" />
                                        <span>{t('emergency:sos.location.capturing')}</span>
                                    </div>
                                )}
                                {locationStatus === 'granted' && position && (
                                    <div className="mt-1 text-slate-700 font-mono">
                                        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                                        <span className="text-slate-500"> {t('emergency:sos.location.accuracy', { meters: Math.round(position.accuracy) })}</span>
                                    </div>
                                )}
                                {locationStatus === 'denied' && (
                                    <p className="mt-1 text-orange-600">
                                        {t('emergency:sos.location.denied')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tuiles motif (6 tuiles tactiles colorées + fond semi-transparent) */}
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold mb-2">
                                {t('emergency:sos.reasonLabel')}
                            </p>
                            <div
                                role="radiogroup"
                                aria-label={t('emergency:sos.reasonLabel')}
                                className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2"
                            >
                                {TILES.map((tile) => {
                                    const isSelected = reasonCode === tile.code;
                                    const c = COLOR_CLASSES[tile.color];
                                    const label = t(`emergency:sos.reasons.${tile.code.toLowerCase()}`);
                                    return (
                                        <button
                                            key={tile.code}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => setReasonCode(tile.code)}
                                            className={[
                                                'group flex flex-col items-center justify-center gap-1.5',
                                                'min-h-[88px] px-2 py-3 rounded-lg border-2',
                                                'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                                                isSelected
                                                    ? `${c.borderSelected} ${c.bgSelected} scale-[1.04] shadow-sm`
                                                    : `${c.borderIdle} ${c.bgIdle} hover:scale-[1.02]`,
                                            ].join(' ')}
                                        >
                                            <tile.Icon
                                                size={34}
                                                stroke={1.8}
                                                className={c.iconColor}
                                            />
                                            <span
                                                className={[
                                                    'text-[11.5px] leading-tight text-center font-semibold',
                                                    isSelected ? c.textSelected : 'text-slate-700',
                                                ].join(' ')}
                                            >
                                                {label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-1.5 italic">
                                {t('emergency:sos.reasonHelper', { selected: reasonLabel })}
                            </p>
                        </div>

                        {/* Message d'urgence */}
                        <Textarea
                            label={t('emergency:sos.messageLabel')}
                            placeholder={t('emergency:sos.messagePlaceholder')}
                            autosize
                            minRows={2}
                            maxRows={4}
                            value={message}
                            onChange={(e) => setMessage(e.currentTarget.value)}
                            size="sm"
                        />

                        {/* Numéro d'urgence */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                            <IconPhone size={16} className="text-red-700" />
                            <p className="text-xs text-red-900">
                                <span className="font-medium">{t('emergency:sos.hotlineLabel')}</span>
                                <span className="font-mono ml-1">{t('emergency:sos.hotlineNumber')}</span>
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={handleClose} disabled={sending}>
                                {t('emergency:sos.cancelBtn')}
                            </Button>
                            <Button
                                color="red"
                                size="sm"
                                onClick={() => handleSend(false)}
                                loading={sending}
                                leftSection={<IconUrgent size={15} />}
                            >
                                {t('emergency:sos.submitBtn')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════
                    OVERLAY AUTO-TRANSMISSION (compte à rebours rouge plein-écran)
                    Affiché uniquement quand autoCountdown !== null.
                ════════════════════════════════════════════════════════ */}
                {autoCountdown !== null && !sent && (
                    <div
                        className="fixed inset-0 z-[10001] flex items-center justify-center"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="sos-auto-title"
                    >
                        <style>{`
                            @keyframes sosAutoBg {
                                0%, 100% { background: rgba(127, 29, 29, 0.92); }
                                50%      { background: rgba(153, 27, 27, 0.96); }
                            }
                            @keyframes sosAutoCount {
                                0%   { transform: scale(0.85); opacity: 0.6; }
                                40%  { transform: scale(1.08); opacity: 1; }
                                100% { transform: scale(1);    opacity: 1; }
                            }
                            @keyframes sosAutoRing {
                                0%   { transform: scale(0.6); opacity: 0.85; }
                                100% { transform: scale(1.8); opacity: 0; }
                            }
                        `}</style>
                        {/* Fond pulsant rouge sombre */}
                        <div
                            aria-hidden
                            className="absolute inset-0 backdrop-blur-sm"
                            style={{ animation: 'sosAutoBg 1.2s ease-in-out infinite' }}
                        />

                        <div className="relative z-10 bg-white rounded-2xl w-[92%] max-w-md mx-auto p-7 shadow-2xl ring-2 ring-red-400 text-center">
                            <p
                                id="sos-auto-title"
                                className="text-[12px] uppercase tracking-[0.18em] text-red-700 font-bold"
                            >
                                {t('emergency:sos.autoTransmit.title')}
                            </p>

                            <div className="relative my-6 inline-flex items-center justify-center">
                                {/* Halos pulsants */}
                                <span
                                    aria-hidden
                                    className="absolute inset-0 rounded-full bg-red-500/30"
                                    style={{ animation: 'sosAutoRing 1.4s ease-out infinite' }}
                                />
                                <span
                                    aria-hidden
                                    className="absolute inset-0 rounded-full bg-red-500/20"
                                    style={{ animation: 'sosAutoRing 1.4s ease-out 0.6s infinite' }}
                                />
                                {/* Chiffre du countdown */}
                                <div
                                    key={autoCountdown}
                                    className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white flex items-center justify-center shadow-lg ring-4 ring-red-200"
                                    style={{ animation: 'sosAutoCount 0.5s ease-out' }}
                                >
                                    <span className="text-[64px] font-black leading-none tabular-nums drop-shadow-md">
                                        {autoCountdown}
                                    </span>
                                </div>
                            </div>

                            <p className="text-[14px] text-slate-800 leading-snug px-2">
                                {t('emergency:sos.autoTransmit.body', { seconds: autoCountdown })}
                            </p>
                            <p className="text-[12px] text-slate-500 mt-1.5 italic">
                                {t('emergency:sos.autoTransmit.hint')}
                            </p>

                            <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="default"
                                    size="md"
                                    fullWidth
                                    onClick={handleCancelAuto}
                                    disabled={sending}
                                >
                                    {t('emergency:sos.autoTransmit.cancelBtn')}
                                </Button>
                                <Button
                                    color="red"
                                    size="md"
                                    fullWidth
                                    onClick={handleManualSendFromCountdown}
                                    loading={sending}
                                    leftSection={<IconUrgent size={16} />}
                                >
                                    {t('emergency:sos.autoTransmit.confirmBtn')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default SosButton;
