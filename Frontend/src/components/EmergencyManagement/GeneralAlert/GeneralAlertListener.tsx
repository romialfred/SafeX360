import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    IconAlertTriangle,
    IconMapPin,
    IconCheck,
    IconVolume,
    IconVolumeOff,
    IconShieldCheck,
    IconShieldX,
    IconStethoscope,
    IconUrgent,
} from '@tabler/icons-react';
import { useEmergencyWebSocket } from '../Sos/EmergencyWebSocketProvider';
import {
    getActiveAlert,
    checkInToAlert,
    type GeneralAlertDTO,
    type CheckInStatus,
} from '../../../services/GeneralAlertService';
import { listAssemblyPoints, type AssemblyPointDTO } from '../../../services/EmergencyService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';
import { formatReasonCode, hasCheckedIn, markCheckedIn, cleanupOldCheckIns } from './alertHelpers';
import { enqueueCheckIn } from '../../../utility/OfflineCheckInQueue';

/** Nom de l'événement CustomEvent émis par GeneralAlertButton après trigger API réussi. */
export const GENERAL_ALERT_TRIGGERED_EVENT = 'safex:general-alert-triggered';

/**
 * Listener global Alerte Générale (LOT 48 Phase 4).
 *
 * <p>Affiche un popup full-screen à TOUS les utilisateurs connectés (pas
 * seulement les coordinateurs) dès qu'une alerte ACTIVE est détectée :</p>
 * <ul>
 *   <li>Visuel : vagues rouge/orange défilantes + strobes (style alerte
 *       industrielle, distinct du SOS individuel rouge/bleu ambulance)</li>
 *   <li>Audio : sirène mine 2 tons + voix TTS Web Speech qui diffuse le
 *       message en boucle</li>
 *   <li>L'utilisateur peut pointer son statut directement (SAFE / INJURED)
 *       + sélectionner le point de rassemblement où il se trouve</li>
 *   <li>GPS auto-capturé en arrière-plan</li>
 * </ul>
 *
 * <p>Au démarrage, fetch l'alerte active courante pour ne pas rater une
 * alerte déclenchée avant l'ouverture de la page.</p>
 */

/**
 * Sirène industrielle (mine / usine) avec crescendo (LOT 48 Phase 4.b).
 *
 * <p>Caractéristiques :</p>
 * <ul>
 *   <li><strong>ctx.resume()</strong> immédiat après création pour bypass la
 *       politique autoplay des navigateurs (sinon le ctx démarre suspended)</li>
 *   <li><strong>Crescendo progressif</strong> : volume rampe de 0.05 → 0.85 sur
 *       12 secondes via {@code linearRampToValueAtTime} (effet "alerte qui
 *       monte en puissance")</li>
 *   <li><strong>Schedule WebAudio natif</strong> au lieu de {@code setInterval}
 *       pour timing précis (pas de jitter)</li>
 *   <li>Pattern "hee-haw" européen : 800Hz / 600Hz alterné 0.6s chacun</li>
 *   <li>Oscillator type {@code sawtooth} pour richesse harmonique +
 *       BiquadFilter low-pass pour adoucir le metal</li>
 * </ul>
 */
class IndustrialSiren {
    private ctx: AudioContext | null = null;
    private osc: OscillatorNode | null = null;
    private masterGain: GainNode | null = null;
    private filter: BiquadFilterNode | null = null;
    private rafId: number | null = null;
    private keepaliveId: number | null = null;
    private playing = false;
    private startedAt = 0;
    private currentVolume = 0.45;
    private ducked = false;

    async start() {
        if (this.playing) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 2500;
            this.filter.Q.value = 1.0;
            this.filter.connect(this.ctx.destination);

            this.masterGain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            this.masterGain.gain.setValueAtTime(0.03, now);
            this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, now + 12);
            this.masterGain.connect(this.filter);

            this.osc = this.ctx.createOscillator();
            this.osc.type = 'sawtooth';
            this.osc.frequency.value = 800;
            this.osc.connect(this.masterGain);
            this.osc.start();

            this.startedAt = now;
            this.playing = true;
            this.scheduleSweep();
            this.startKeepalive();
        } catch (err) {
            console.error('[IndustrialSiren] Failed to start audio:', err);
        }
    }

    private startKeepalive() {
        if (this.keepaliveId !== null) return;
        this.keepaliveId = window.setInterval(() => {
            const c = this.ctx;
            if (!c) return;
            if (c.state === 'suspended' || (c.state as string) === 'interrupted') {
                c.resume().catch(() => undefined);
            }
            if (!this.osc && this.ctx && this.masterGain) {
                try {
                    const newOsc = this.ctx.createOscillator();
                    newOsc.type = 'sawtooth';
                    newOsc.frequency.value = 800;
                    newOsc.connect(this.masterGain);
                    newOsc.start();
                    this.osc = newOsc;
                    this.startedAt = this.ctx.currentTime;
                    this.scheduleSweep();
                } catch { /* ignore */ }
            }
        }, 2000);
    }

    /**
     * Programme un sweep continu "hee-haw" entre 800Hz et 600Hz, 0.6s par tone.
     * Re-programme tous les 25s pour boucle infinie sans cassure audible.
     */
    private scheduleSweep() {
        if (!this.ctx || !this.osc) return;
        const ctx = this.ctx;
        const freq = this.osc.frequency;
        const toneDuration = 0.6;
        const high = 800;
        const low = 600;
        const now = ctx.currentTime;

        // Schedule 50 alternances (30s d'avance)
        for (let i = 0; i < 50; i++) {
            const start = now + i * toneDuration;
            const fromVal = i % 2 === 0 ? high : low;
            const toVal = i % 2 === 0 ? low : high;
            freq.setValueAtTime(fromVal, start);
            freq.linearRampToValueAtTime(toVal, start + toneDuration);
        }

        // Re-schedule toutes les 25s pour boucle continue
        const tick = () => {
            if (!this.playing) return;
            const elapsed = ctx.currentTime - this.startedAt;
            if (elapsed > 25) {
                this.startedAt = ctx.currentTime;
                this.scheduleSweep();
            }
            this.rafId = window.requestAnimationFrame(tick);
        };
        tick();
    }

    /**
     * Baisse le volume sirène à 0.08 quand la voix TTS parle (audio ducking).
     * Rampe douce 0.2s pour éviter les pops audibles.
     */
    duck() {
        if (!this.ctx || !this.masterGain || this.ducked) return;
        try {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0.08, now + 0.15);
            this.ducked = true;
        } catch { /* ignore */ }
    }

    /**
     * Restaure le volume sirène quand la voix TTS termine.
     */
    unduck() {
        if (!this.ctx || !this.masterGain || !this.ducked) return;
        try {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, now + 0.3);
            this.ducked = false;
        } catch { /* ignore */ }
    }

    stop() {
        try {
            if (this.keepaliveId !== null) {
                clearInterval(this.keepaliveId);
                this.keepaliveId = null;
            }
            if (this.rafId !== null) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            if (this.osc) { try { this.osc.stop(); } catch {} this.osc.disconnect(); this.osc = null; }
            if (this.masterGain) { this.masterGain.disconnect(); this.masterGain = null; }
            if (this.filter) { this.filter.disconnect(); this.filter = null; }
            if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
        } catch { /* ignore */ }
        this.playing = false;
        this.ducked = false;
    }
}

// Nettoyer les vieilles entrées localStorage au boot
cleanupOldCheckIns();

const POLL_INTERVAL_MS = 12_000;
/**
 * Règle des 20 minutes = purement SONORE / VISUELLE.
 *
 * Passé ce délai, on cesse de faire hurler la sirène et de rouvrir le popup
 * plein écran (une évacuation ne se pilote plus au son au bout de 20 min, elle
 * se pilote au centre de commande). MAIS l'alerte elle-même reste ACTIVE : son
 * traitement (appel nominatif, tableau de bord, pointages) continue et survit à
 * un redémarrage — seule la clôture par un COORDINATEUR y met fin. Ces
 * constantes ne touchent donc QUE l'audio et le popup, jamais le cycle de vie.
 */
const MAX_SIREN_AGE_MS = 20 * 60 * 1000;
const SIREN_AUTO_STOP_MS = 20 * 60 * 1000;

const isAlertFresh = (a: GeneralAlertDTO): boolean => {
    if (!a.triggeredAt) return false;
    return Date.now() - new Date(a.triggeredAt).getTime() < MAX_SIREN_AGE_MS;
};

const GeneralAlertListener = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('emergency');
    const { subscribeGeneralAlert, connected: wsConnected } = useEmergencyWebSocket();
    const currentUser = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const user = useAppSelector((state: any) => state.user);
    const effectiveCompanyId = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 0);

    const [activeAlert, setActiveAlert] = useState<GeneralAlertDTO | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPointDTO[]>([]);
    const [pickedApId, setPickedApId] = useState<number | null>(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkedInStatus, setCheckedInStatus] = useState<CheckInStatus | null>(null);
    const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

    const sirenRef = useRef<IndustrialSiren | null>(null);
    if (sirenRef.current === null) sirenRef.current = new IndustrialSiren();

    const tryActivate = useCallback((a: GeneralAlertDTO) => {
        if (a.status === 'ACTIVE' && a.id && currentUser?.id) {
            if (hasCheckedIn(Number(currentUser.id), a.id)) return;
            if (!isAlertFresh(a)) return;
            setActiveAlert((prev) => (prev?.id === a.id ? prev : a));
        }
    }, [currentUser]);

    // ── Fetch alerte active au démarrage + à chaque changement de mine ──
    useEffect(() => {
        if (!effectiveCompanyId) return;
        getActiveAlert(effectiveCompanyId)
            .then((a) => { if (a) tryActivate(a); })
            .catch(() => {});
    }, [effectiveCompanyId, tryActivate]);

    // ── Polling fallback : re-check toutes les 12s (filet de sécurité si WS déconnecté) ──
    useEffect(() => {
        if (!effectiveCompanyId) return;
        const id = window.setInterval(() => {
            if (activeAlert) return;
            getActiveAlert(effectiveCompanyId)
                .then((a) => { if (a) tryActivate(a); })
                .catch(() => {});
        }, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [effectiveCompanyId, activeAlert, tryActivate]);

    // ── CustomEvent bridge : le bouton GeneralAlertButton émet un événement après trigger API ──
    useEffect(() => {
        const handler = (e: Event) => {
            const dto = (e as CustomEvent<GeneralAlertDTO>).detail;
            if (dto) tryActivate(dto);
        };
        window.addEventListener(GENERAL_ALERT_TRIGGERED_EVENT, handler);
        return () => window.removeEventListener(GENERAL_ALERT_TRIGGERED_EVENT, handler);
    }, [tryActivate]);

    // ── Subscribe WebSocket pour push live ──
    useEffect(() => {
        const unsubscribe = subscribeGeneralAlert((alert) => {
            if (alert.status === 'ACTIVE') {
                tryActivate(alert);
            } else if (alert.status === 'ENDED' && activeAlert?.id === alert.id) {
                setActiveAlert(null);
                setCheckedInStatus(null);
                setPickedApId(null);
            }
        });
        return unsubscribe;
    }, [subscribeGeneralAlert, activeAlert, tryActivate]);

    // ── Load assembly points quand alerte active ──
    useEffect(() => {
        if (!activeAlert || !selectedCompanyId) return;
        listAssemblyPoints(selectedCompanyId).then(setAssemblyPoints).catch(() => setAssemblyPoints([]));
    }, [activeAlert, selectedCompanyId]);

    // ── Capture GPS auto ──
    useEffect(() => {
        if (!activeAlert) return;
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
            () => {},
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, [activeAlert]);

    // ── Sirène + lock scroll + auto-stop après 10 min ──
    useEffect(() => {
        if (activeAlert) {
            if (soundEnabled) { void sirenRef.current?.start(); }
            document.body.style.overflow = 'hidden';
        } else {
            sirenRef.current?.stop();
            document.body.style.overflow = '';
        }
        const autoStopTimer = activeAlert && soundEnabled
            ? window.setTimeout(() => {
                sirenRef.current?.stop();
                setSoundEnabled(false);
            }, SIREN_AUTO_STOP_MS)
            : undefined;
        return () => {
            if (autoStopTimer) window.clearTimeout(autoStopTimer);
            sirenRef.current?.stop();
            document.body.style.overflow = '';
        };
    }, [activeAlert, soundEnabled]);

    // ── TTS Web Speech (voix) avec audio ducking — BILINGUE FR/EN ──
    useEffect(() => {
        if (!activeAlert || !soundEnabled || checkedInStatus) return;
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const synth = window.speechSynthesis;
        // Récupère la langue active i18n + clé adaptée (drill vs réel).
        const activeLang = (i18n.language || 'fr').split('-')[0];
        const utteranceLang = activeLang === 'en' ? 'en-US' : 'fr-FR';
        const standardMsg = activeAlert.drillMode
            ? t('audio.generalAlert.drill')
            : t('audio.generalAlert.real');
        const fullMessage = activeAlert.message
            ? `${standardMsg} ${activeAlert.message}`
            : standardMsg;

        const speak = () => {
            try {
                if (!synth.speaking) {
                    const u = new SpeechSynthesisUtterance(fullMessage);
                    u.lang = utteranceLang;
                    u.rate = 0.92;
                    u.pitch = 1.0;
                    u.volume = 1.0;
                    // AUDIO DUCKING : baisse la sirène pendant que la voix parle
                    u.onstart = () => sirenRef.current?.duck();
                    u.onend = () => sirenRef.current?.unduck();
                    u.onerror = () => sirenRef.current?.unduck();
                    synth.speak(u);
                }
            } catch { /* ignore */ }
        };
        const initialTimeout = window.setTimeout(speak, 1500);
        const interval = window.setInterval(speak, 8000);
        return () => {
            window.clearTimeout(initialTimeout);
            window.clearInterval(interval);
            try {
                synth.cancel();
                sirenRef.current?.unduck();
            } catch { /* ignore */ }
        };
    }, [activeAlert, soundEnabled, checkedInStatus, i18n.language, t]);

    // ── Check-in ──
    /**
     * Statuts qu'un employé peut déclarer LUI-MÊME. « Non concerné »
     * (NOT_APPLICABLE) en est volontairement exclu : écarter quelqu'un du
     * décompte d'une évacuation est une décision du centre de contrôle, pas une
     * auto-déclaration. Ce type garantit aussi la compatibilité avec la file
     * d'attente hors-ligne.
     */
    type SelfCheckInStatus = Exclude<CheckInStatus, 'NOT_APPLICABLE'>;

    const doCheckIn = async (status: SelfCheckInStatus) => {
        if (!activeAlert?.id || !currentUser?.id) return;
        setCheckingIn(true);

        const payload = {
            alertId: activeAlert.id,
            employeeId: Number(currentUser.id),
            assemblyPointId: pickedApId,
            status,
            latitude: position?.lat,
            longitude: position?.lng,
            gpsAccuracy: position?.accuracy,
            actorId: Number(currentUser.id),
        };

        // Helper local : si l'envoi réseau échoue (ex : zone sans réseau dans
        // une mine), enqueue dans IndexedDB pour replay automatique.
        const tryPostOrQueue = async () => {
            try {
                await checkInToAlert(payload);
            } catch {
                await enqueueCheckIn({
                    alertId: payload.alertId,
                    employeeId: payload.employeeId,
                    assemblyPointId: payload.assemblyPointId,
                    status: payload.status,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    gpsAccuracy: payload.gpsAccuracy,
                    actorId: payload.actorId,
                });
            }
        };

        try {
            await tryPostOrQueue();

            // ── Arrête la sirène + TTS + persiste le check-in localement ──
            sirenRef.current?.stop();
            try {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
            } catch { /* ignore */ }
            markCheckedIn(Number(currentUser.id), activeAlert.id);

            setCheckedInStatus(status);
            successNotification(
                status === 'SAFE'
                    ? 'Présence enregistrée — en sécurité'
                    : 'Présence enregistrée — blessé, assistance demandée'
            );

            // Ferme automatiquement le popup après 5s (laisse le temps de lire
            // la confirmation, puis libère l UI). Si l utilisateur clique
            // « Voir le suivi évacuation », la navigation aura fermé avant.
            window.setTimeout(() => {
                setActiveAlert(null);
                setCheckedInStatus(null);
                setPickedApId(null);
            }, 5000);
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec du pointage. Réessayez.'));
        } finally {
            setCheckingIn(false);
        }
    };

    if (!activeAlert) return null;

    const reasonLabel = formatReasonCode(activeAlert.reasonCode);
    const isDrill = Boolean(activeAlert.drillMode);

    return (
        // overflow-y-auto : sur écran court, les boutons « JE SUIS EN SÉCURITÉ » /
        // « BLESSÉ » (seul moyen de se signaler en évacuation) étaient clippés.
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto overflow-x-hidden py-4">
            <style>{`
                @keyframes gaRipple {
                    0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.85; }
                    100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
                }
                @keyframes gaRippleSlow {
                    0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.7; }
                    100% { transform: translate(-50%, -50%) scale(24); opacity: 0; }
                }
                @keyframes gaPulse {
                    0%, 100% { background: rgba(20, 8, 0, 0.82); }
                    50%      { background: rgba(35, 14, 0, 0.88); }
                }
                @keyframes gaShake {
                    0%, 100% { transform: translateX(0); }
                    50%      { transform: translateX(2px); }
                }
                @keyframes gaBlink {
                    0%, 100% { background-color: rgb(185, 28, 28); }
                    50%      { background-color: rgb(220, 38, 38); }
                }
            `}</style>

            {/* Background très sombre avec pulse subtil */}
            <div className="absolute inset-0" style={{ animation: 'gaPulse 1.4s ease-in-out infinite', backdropFilter: 'blur(2px)' }} />

            {/*
              EFFET "PIERRE JETÉE DANS L'EAU" — ondes orange/rouge concentriques
              qui se propagent depuis le centre vers l'extérieur.
              Différencie l'Alerte Générale du SOS par la palette orange.
            */}
            {[
                { delay: 0,    color: 'rgba(234, 88, 12, 0.9)',   duration: 3.2 },   // orange-600
                { delay: 0.8,  color: 'rgba(249, 115, 22, 0.75)', duration: 3.2 },   // orange-500
                { delay: 1.6,  color: 'rgba(251, 146, 60, 0.6)',  duration: 3.2 },   // orange-400
                { delay: 2.4,  color: 'rgba(253, 186, 116, 0.5)', duration: 3.2 },   // orange-300
            ].map((ripple, i) => (
                <div
                    key={i}
                    aria-hidden
                    className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                    style={{
                        width: '120px',
                        height: '120px',
                        border: `5px solid ${ripple.color}`,
                        boxShadow: `0 0 30px ${ripple.color}, inset 0 0 25px ${ripple.color}`,
                        animation: `gaRipple ${ripple.duration}s ease-out ${ripple.delay}s infinite`,
                        mixBlendMode: 'screen',
                    }}
                />
            ))}

            {/* Ondes rouges plus lentes en couche de fond */}
            {[0, 1.5].map((delay, i) => (
                <div
                    key={`slow-${i}`}
                    aria-hidden
                    className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                    style={{
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(220,38,38,0.55) 0%, rgba(220,38,38,0.0) 70%)',
                        animation: `gaRippleSlow 4s ease-out ${delay}s infinite`,
                        mixBlendMode: 'screen',
                    }}
                />
            ))}

            {/* Vignette orange centrale — effet d'impact */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(249,115,22,0.35) 0%, rgba(0,0,0,0) 55%)',
                    mixBlendMode: 'screen',
                }}
            />

            {/* Carte centrale */}
            <div
                className="relative z-10 bg-white rounded-2xl max-w-2xl w-[92%] mx-auto overflow-hidden ring-2 ring-orange-400"
                style={{ animation: 'gaShake 0.5s ease-in-out infinite' }}
            >
                <header className="bg-gradient-to-r from-orange-700 via-red-700 to-orange-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <IconAlertTriangle size={36} stroke={2.4} className="text-white drop-shadow-lg" />
                        <div>
                            <p className="text-orange-100 text-[10px] uppercase tracking-[0.2em] font-bold leading-none mb-1">
                                ALERTE GÉNÉRALE — ÉVACUATION
                            </p>
                            <h2 className="text-white text-[22px] leading-tight" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>
                                {reasonLabel}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSoundEnabled((v) => !v)}
                        title={soundEnabled ? 'Couper la sirène' : 'Activer la sirène'}
                        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors ring-1 ring-white/30"
                    >
                        {soundEnabled ? <IconVolume size={20} stroke={1.8} /> : <IconVolumeOff size={20} stroke={1.8} />}
                    </button>
                </header>

                {/* ════ Bannière exercice / non-exercice ════ */}
                {isDrill ? (
                    <div className="bg-sky-100 border-y-2 border-sky-300 px-6 py-2.5 text-center">
                        <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-sky-900 inline-flex items-center justify-center gap-2">
                            <IconShieldCheck size={14} stroke={2.2} />
                            ⓘ Ceci est un EXERCICE — Procédure simulée
                            <IconShieldCheck size={14} stroke={2.2} />
                        </p>
                    </div>
                ) : (
                    <div
                        className="bg-red-700 px-6 py-2.5 text-center"
                        style={{ animation: 'gaBlink 0.9s ease-in-out infinite' }}
                    >
                        <p className="text-[13px] font-black uppercase tracking-[0.18em] text-white drop-shadow-md inline-flex items-center justify-center gap-2">
                            <IconAlertTriangle size={15} stroke={2.4} />
                            CECI N'EST PAS UN EXERCICE — URGENCE RÉELLE
                            <IconAlertTriangle size={15} stroke={2.4} />
                        </p>
                    </div>
                )}

                <div className="p-6 space-y-4">
                    {/* Message d'évacuation */}
                    {activeAlert.message && (
                        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg px-4 py-3.5">
                            <p className="text-[10.5px] uppercase tracking-[0.15em] text-orange-700 font-bold mb-1.5">
                                Message de la direction
                            </p>
                            <p className="text-[15px] text-orange-900 leading-relaxed">
                                « {activeAlert.message} »
                            </p>
                        </div>
                    )}

                    {checkedInStatus ? (
                        // Vue après check-in
                        <div className={`rounded-lg p-5 border-2 ${
                            checkedInStatus === 'SAFE'
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-amber-50 border-amber-300'
                        }`}>
                            <div className="flex items-start gap-3">
                                {checkedInStatus === 'SAFE' ? (
                                    <IconShieldCheck size={32} stroke={1.8} className="text-emerald-600 flex-shrink-0" />
                                ) : (
                                    <IconStethoscope size={32} stroke={1.8} className="text-amber-600 flex-shrink-0" />
                                )}
                                <div>
                                    <p className={`text-[14px] font-bold ${checkedInStatus === 'SAFE' ? 'text-emerald-900' : 'text-amber-900'}`}>
                                        Présence enregistrée — {checkedInStatus === 'SAFE' ? 'En sécurité' : 'Blessé / Assistance demandée'}
                                    </p>
                                    <p className="text-[12px] text-slate-600 mt-1">
                                        Votre position a été transmise aux coordinateurs HSE.
                                        {checkedInStatus === 'INJURED' && ' Une équipe de secours sera dispatchée.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => activeAlert.id && navigate(`/emergency/alerts/general/${activeAlert.id}`)}
                                className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-slate-800 text-white text-[12.5px] font-semibold hover:bg-slate-900"
                            >
                                Voir le suivi évacuation
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Sélection point de rassemblement */}
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                                    Point de rassemblement où vous êtes
                                </label>
                                <select
                                    value={pickedApId ?? ''}
                                    onChange={(e) => setPickedApId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2.5 text-[13px] border-2 border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                                >
                                    <option value="">Sélectionnez votre point</option>
                                    {assemblyPoints.map((ap) => (
                                        <option key={ap.id} value={ap.id}>
                                            P{ap.evacuationPriority} — {ap.name}
                                            {ap.locationText ? ` (${ap.locationText})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* GPS status */}
                            {position && (
                                <p className="text-[11.5px] text-slate-600 inline-flex items-center gap-1">
                                    <IconMapPin size={11} stroke={1.8} className="text-emerald-500" />
                                    Position GPS capturée : <span className="font-mono ml-1">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span> (±{Math.round(position.accuracy)} m)
                                </p>
                            )}

                            {/* Actions check-in */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => doCheckIn('SAFE')}
                                    disabled={checkingIn}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-50"
                                >
                                    <IconShieldCheck size={18} stroke={2.4} />
                                    {checkingIn ? 'Enregistrement…' : 'JE SUIS EN SÉCURITÉ'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => doCheckIn('INJURED')}
                                    disabled={checkingIn}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-amber-600 text-white text-[14px] font-bold hover:bg-amber-700 transition-colors shadow-lg disabled:opacity-50"
                                >
                                    <IconStethoscope size={18} stroke={2} />
                                    BLESSÉ — Assistance
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralAlertListener;
