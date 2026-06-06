import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconMapPin,
    IconUser,
    IconClock,
    IconCheck,
    IconVolume,
    IconVolumeOff,
    IconX,
    IconUrgent,
} from '@tabler/icons-react';
import { useEmergencyWebSocket } from './EmergencyWebSocketProvider';
import { acknowledgeSosAlert, type SosAlertDTO } from '../../../services/SosService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Listener coordinateur SOS avec popup full-screen style sirène ambulance
 * (LOT 48 P3.b.1).
 *
 * <p>Visuel :</p>
 * <ul>
 *   <li>Overlay full-screen avec <strong>vagues de lumière défilantes</strong>
 *       rouge/bleu (3 couches diagonales à vitesses différentes)</li>
 *   <li>Strobes flash périodiques rouge/blanc (style gyrophare réel)</li>
 *   <li>Carte centrale avec bordure rouge animée + shake léger</li>
 * </ul>
 *
 * <p>Audio :</p>
 * <ul>
 *   <li>Sirène 2-tons warble (style ambulance européenne hee-haw)</li>
 *   <li>Sweep continu entre 1000Hz (aigu) et 600Hz (grave) sur 1.5s</li>
 *   <li>Filter low-pass pour adoucir + un peu de gain modulation</li>
 *   <li>Toggle ON/OFF (mute pour les drills répétés)</li>
 * </ul>
 */

/**
 * Sirène 2-tons style ambulance (warble continu).
 *
 * <p>Utilise un seul OscillatorNode dont la fréquence varie via
 * {@code setValueAtTime} et {@code linearRampToValueAtTime} pour produire
 * un effet "hee-haw" caractéristique des sirènes européennes.</p>
 */
class AmbulanceSiren {
    private ctx: AudioContext | null = null;
    private osc: OscillatorNode | null = null;
    private gain: GainNode | null = null;
    private filter: BiquadFilterNode | null = null;
    private rafId: number | null = null;
    private playing = false;
    private startedAt = 0;
    private currentVolume = 0.32; // Volume max plafonné pour priorité à la voix TTS
    private ducked = false;

    async start() {
        if (this.playing) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

            // CRITIQUE : reprend explicitement le ctx pour bypass autoplay policy
            // (sinon le ctx démarre 'suspended' quand le popup vient d'un push WS).
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            // Filter low-pass pour adoucir la sinusoïde
            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 2200;
            this.filter.Q.value = 0.7;
            this.filter.connect(this.ctx.destination);

            // Gain principal — CRESCENDO 0.05 → 0.32 sur 10s.
            // Volume max plafonné à 0.32 pour laisser de la place sonore à la
            // voix TTS qui doit rester clairement audible.
            this.gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            this.gain.gain.setValueAtTime(0.05, now);
            this.gain.gain.linearRampToValueAtTime(this.currentVolume, now + 10);
            this.gain.connect(this.filter);

            // Oscillateur principal
            this.osc = this.ctx.createOscillator();
            this.osc.type = 'sawtooth'; // Plus riche en harmoniques qu'une sinusoïde pure
            this.osc.frequency.value = 1000;
            this.osc.connect(this.gain);
            this.osc.start();

            this.startedAt = now;
            this.playing = true;
            this.scheduleSweep();
        } catch (err) {
            console.error('[AmbulanceSiren] Failed to start audio:', err);
        }
    }

    /**
     * Programme un sweep continu hee-haw via setValueCurveAtTime.
     * Période totale : 1.5s (haut → bas) + 1.5s (bas → haut) = 3s par cycle.
     */
    private scheduleSweep() {
        if (!this.ctx || !this.osc) return;
        const ctx = this.ctx;
        const freq = this.osc.frequency;

        // Programme 8 cycles à l'avance (24s) puis re-programme via RAF
        const cycleDuration = 1.5;
        const high = 1000;
        const low = 600;
        const now = ctx.currentTime;

        for (let i = 0; i < 16; i++) {
            const start = now + i * cycleDuration;
            const fromVal = i % 2 === 0 ? high : low;
            const toVal = i % 2 === 0 ? low : high;
            freq.setValueAtTime(fromVal, start);
            freq.linearRampToValueAtTime(toVal, start + cycleDuration);
        }

        // Re-programme tous les 20s pour boucle infinie
        const tick = () => {
            if (!this.playing) return;
            const elapsed = ctx.currentTime - this.startedAt;
            if (elapsed > 20) {
                this.startedAt = ctx.currentTime;
                this.scheduleSweep();
            }
            this.rafId = window.requestAnimationFrame(tick);
        };
        tick();
    }

    /** Baisse le volume sirène à 0.06 pendant que la voix TTS parle. */
    duck() {
        if (!this.ctx || !this.gain || this.ducked) return;
        try {
            const now = this.ctx.currentTime;
            this.gain.gain.cancelScheduledValues(now);
            this.gain.gain.setValueAtTime(this.gain.gain.value, now);
            this.gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
            this.ducked = true;
        } catch { /* ignore */ }
    }

    /** Restaure le volume sirène quand la voix TTS termine. */
    unduck() {
        if (!this.ctx || !this.gain || !this.ducked) return;
        try {
            const now = this.ctx.currentTime;
            this.gain.gain.cancelScheduledValues(now);
            this.gain.gain.setValueAtTime(this.gain.gain.value, now);
            this.gain.gain.linearRampToValueAtTime(this.currentVolume, now + 0.3);
            this.ducked = false;
        } catch { /* ignore */ }
    }

    stop() {
        try {
            if (this.rafId !== null) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            if (this.osc) {
                try { this.osc.stop(); } catch { /* déjà stop */ }
                this.osc.disconnect();
                this.osc = null;
            }
            if (this.gain) {
                this.gain.disconnect();
                this.gain = null;
            }
            if (this.filter) {
                this.filter.disconnect();
                this.filter = null;
            }
            if (this.ctx) {
                this.ctx.close().catch(() => {});
                this.ctx = null;
            }
        } catch {
            /* ignore */
        }
        this.playing = false;
    }
}

const CoordinatorAlertListener = () => {
    const navigate = useNavigate();
    const { subscribe } = useEmergencyWebSocket();
    const currentUser = useAppSelector((state: any) => state.user);

    const [activeAlert, setActiveAlert] = useState<SosAlertDTO | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [acknowledging, setAcknowledging] = useState(false);

    const sirenRef = useRef<AmbulanceSiren | null>(null);
    if (sirenRef.current === null) sirenRef.current = new AmbulanceSiren();

    // ── Abonnement ──
    useEffect(() => {
        const unsubscribe = subscribe((alert) => {
            if (alert.status === 'RECEIVED' && !alert.drillMode) {
                setActiveAlert(alert);
            } else if (activeAlert && activeAlert.id === alert.id) {
                if (alert.status !== 'RECEIVED') {
                    setActiveAlert(null);
                }
            }
        });
        return unsubscribe;
    }, [subscribe, activeAlert]);

    // ── Sirène + lock scroll ──
    useEffect(() => {
        if (activeAlert) {
            if (soundEnabled) { void sirenRef.current?.start(); }
            document.body.style.overflow = 'hidden';
        } else {
            sirenRef.current?.stop();
            document.body.style.overflow = '';
        }
        return () => {
            sirenRef.current?.stop();
            document.body.style.overflow = '';
        };
    }, [activeAlert, soundEnabled]);

    // Toggle son sans démonter le popup
    useEffect(() => {
        if (!activeAlert) return;
        if (soundEnabled) sirenRef.current?.start();
        else sirenRef.current?.stop();
    }, [soundEnabled, activeAlert]);

    // ── TTS Web Speech avec audio ducking ──
    useEffect(() => {
        if (!activeAlert || !soundEnabled) return;
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const synth = window.speechSynthesis;
        const message =
            "Ceci n'est pas un exercice. Veuillez rejoindre le point de rassemblement le plus proche.";

        const speak = () => {
            try {
                if (!synth.speaking) {
                    const u = new SpeechSynthesisUtterance(message);
                    u.lang = 'fr-FR';
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
    }, [activeAlert, soundEnabled]);

    // ── Note : start() est désormais async ; on ignore la promise via void ──

    // ── Actions ──
    /** Coupe complètement sirène + voix TTS en cours. */
    const stopAllAudio = () => {
        sirenRef.current?.stop();
        try {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        } catch { /* ignore */ }
    };

    const handleAcknowledge = async () => {
        if (!activeAlert?.id) return;
        setAcknowledging(true);
        try {
            await acknowledgeSosAlert(activeAlert.id, { note: 'Prise en charge depuis popup gyrophare' }, currentUser?.id);
            successNotification('SOS pris en charge');
            stopAllAudio();
            const id = activeAlert.id;
            setActiveAlert(null);
            navigate(`/emergency/sos/${id}`);
        } catch {
            errorNotification('Échec de la prise en charge');
        } finally {
            setAcknowledging(false);
        }
    };

    const handleViewDetail = () => {
        if (!activeAlert?.id) return;
        stopAllAudio();
        const id = activeAlert.id;
        setActiveAlert(null);
        navigate(`/emergency/sos/${id}`);
    };

    const handleDismiss = () => {
        stopAllAudio();
        setActiveAlert(null);
    };

    const formatTime = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (!activeAlert) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
            {/* Styles globaux pour l'effet "pierre jetée dans l'eau" + animations */}
            <style>{`
                @keyframes sosRipple {
                    0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.85; }
                    100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
                }
                @keyframes sosRippleSlow {
                    0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.7; }
                    100% { transform: translate(-50%, -50%) scale(24); opacity: 0; }
                }
                @keyframes sosShake {
                    0%, 100% { transform: translateX(0); }
                    20%      { transform: translateX(-4px) rotate(-0.4deg); }
                    40%      { transform: translateX(4px) rotate(0.4deg); }
                    60%      { transform: translateX(-3px); }
                    80%      { transform: translateX(3px); }
                }
                @keyframes sosBorderPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.8), 0 25px 50px -12px rgba(0,0,0,0.5); }
                    50%      { box-shadow: 0 0 40px 14px rgba(220,38,38,0.6), 0 25px 50px -12px rgba(0,0,0,0.5); }
                }
                @keyframes sosBlink {
                    0%, 70%, 100% { opacity: 1; }
                    75%, 85%      { opacity: 0.4; }
                }
                @keyframes sosBgPulse {
                    0%, 100% { background: rgba(10, 0, 0, 0.78); }
                    50%      { background: rgba(35, 5, 5, 0.85); }
                }
            `}</style>

            {/* Background très sombre avec pulse subtil */}
            <div
                className="absolute inset-0"
                style={{ animation: 'sosBgPulse 1.6s ease-in-out infinite', backdropFilter: 'blur(2px)' }}
            />

            {/*
              EFFET "PIERRE JETÉE DANS L'EAU" — ondes concentriques rouges
              qui se propagent depuis le centre de l'écran vers l'extérieur.
              4 ondes décalées dans le temps pour effet continu de propagation.
            */}
            {[
                { delay: 0,    color: 'rgba(220, 38, 38, 0.9)',  duration: 3.2, anim: 'sosRipple' },
                { delay: 0.8,  color: 'rgba(239, 68, 68, 0.7)',  duration: 3.2, anim: 'sosRipple' },
                { delay: 1.6,  color: 'rgba(248, 113, 113, 0.6)', duration: 3.2, anim: 'sosRipple' },
                { delay: 2.4,  color: 'rgba(252, 165, 165, 0.5)', duration: 3.2, anim: 'sosRipple' },
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
                        animation: `${ripple.anim} ${ripple.duration}s ease-out ${ripple.delay}s infinite`,
                        mixBlendMode: 'screen',
                    }}
                />
            ))}

            {/* Onde rouge profonde plus lente en arrière-plan */}
            {[0, 1.5].map((delay, i) => (
                <div
                    key={`slow-${i}`}
                    aria-hidden
                    className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                    style={{
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(220,38,38,0.55) 0%, rgba(220,38,38,0.0) 70%)',
                        animation: `sosRippleSlow 4s ease-out ${delay}s infinite`,
                        mixBlendMode: 'screen',
                    }}
                />
            ))}

            {/* Vignette rouge au centre — effet d'impact */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(220,38,38,0.4) 0%, rgba(0,0,0,0) 55%)',
                    mixBlendMode: 'screen',
                }}
            />

            {/* Carte centrale (au-dessus de toutes les couches) */}
            <div
                className="relative z-10 bg-white rounded-2xl max-w-2xl w-[92%] mx-auto overflow-hidden ring-1 ring-red-300"
                style={{
                    animation: 'sosShake 0.55s ease-in-out infinite, sosBorderPulse 1.4s ease-in-out infinite',
                }}
            >
                {/* Header */}
                <header className="relative bg-gradient-to-r from-red-700 via-red-600 to-red-700 px-6 py-4 overflow-hidden">
                    {/* Sous-couche scintillante dans le header */}
                    <div
                        aria-hidden
                        className="absolute inset-0 opacity-30"
                        style={{
                            background:
                                'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.25) 8px, rgba(255,255,255,0.25) 16px)',
                            animation: 'sosScanWhite 1.2s linear infinite',
                        }}
                    />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <IconUrgent size={36} stroke={2.4} className="text-white drop-shadow-lg" style={{ animation: 'sosBlink 0.8s ease-in-out infinite' }} />
                                <span className="absolute inset-0 rounded-full bg-white/30 blur-md" />
                            </div>
                            <div>
                                <p className="text-red-100 text-[10px] uppercase tracking-[0.2em] font-bold leading-none mb-1">
                                    ALERTE SOS — INTERVENTION IMMÉDIATE
                                </p>
                                <h2
                                    className="text-white text-[24px] leading-tight drop-shadow-lg"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}
                                >
                                    URGENCE EN COURS
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
                    </div>
                </header>

                {/* Corps */}
                <div className="p-6 space-y-4">
                    {/* Motif */}
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3.5 relative overflow-hidden">
                        <div
                            aria-hidden
                            className="absolute inset-0 opacity-15"
                            style={{
                                background:
                                    'repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(220,38,38,0.4) 12px, rgba(220,38,38,0.4) 24px)',
                            }}
                        />
                        <div className="relative">
                            <p className="text-[10.5px] uppercase tracking-[0.15em] text-red-700 font-bold mb-1.5 inline-flex items-center gap-1.5">
                                <IconAlertTriangle size={11} stroke={2} />
                                Motif déclenchement
                            </p>
                            <p
                                className="text-[22px] text-red-900 leading-tight"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                            >
                                {activeAlert.reasonCode ?? 'Non spécifié'}
                            </p>
                            {activeAlert.description && (
                                <p className="text-[13px] text-red-800 mt-2 italic border-l-2 border-l-red-400 pl-3">
                                    « {activeAlert.description} »
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <InfoCard
                            icon={<IconUser size={11} stroke={1.8} />}
                            label="Employé"
                            value={activeAlert.employeeName ?? `#${activeAlert.employeeId}`}
                        />
                        <InfoCard
                            icon={<IconClock size={11} stroke={1.8} />}
                            label="Déclenché à"
                            value={formatTime(activeAlert.triggeredAt)}
                            mono
                        />
                        <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 inline-flex items-center gap-1">
                                <IconMapPin size={9} stroke={1.8} />
                                Position GPS
                            </p>
                            <p className="text-[13px] text-slate-800 font-mono">
                                {activeAlert.latitude.toFixed(6)}, {activeAlert.longitude.toFixed(6)}
                                {activeAlert.gpsAccuracy && (
                                    <span className="ml-2 text-slate-500 text-[10.5px]">
                                        (±{Math.round(activeAlert.gpsAccuracy)} m)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleAcknowledge}
                            disabled={acknowledging}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 transition-colors shadow-lg ring-2 ring-emerald-300 disabled:opacity-60"
                        >
                            <IconCheck size={18} stroke={2.6} />
                            {acknowledging ? 'Prise en charge…' : 'PRENDRE EN CHARGE'}
                        </button>
                        <button
                            type="button"
                            onClick={handleViewDetail}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-slate-800 text-white text-[14px] font-semibold hover:bg-slate-900 transition-colors shadow-md"
                        >
                            Voir détail complet
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            title="Masquer (sans prendre en charge)"
                            className="inline-flex items-center justify-center px-3 py-3.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            <IconX size={15} stroke={2} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
function InfoCard({
    icon,
    label,
    value,
    mono,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 inline-flex items-center gap-1">
                {icon}
                {label}
            </p>
            <p className={`text-[13px] text-slate-800 font-medium ${mono ? 'font-mono' : ''}`}>
                {value}
            </p>
        </div>
    );
}

export default CoordinatorAlertListener;
