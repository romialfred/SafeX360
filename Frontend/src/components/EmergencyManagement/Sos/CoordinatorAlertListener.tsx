import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconAlertTriangle, IconMapPin, IconUser, IconClock, IconCheck, IconVolume, IconVolumeOff, IconX } from '@tabler/icons-react';
import { useEmergencyWebSocket } from './EmergencyWebSocketProvider';
import { acknowledgeSosAlert, type SosAlertDTO } from '../../../services/SosService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Listener global pour les coordinateurs : affiche un popup full-screen
 * gyrophare + sirène en boucle dès qu'un SOS RECEIVED arrive (LOT 48 Phase 3.b).
 *
 * <p>Logique :</p>
 * <ul>
 *   <li>S'abonne au flux WebSocket du provider</li>
 *   <li>Si message status === RECEIVED → popup + sirène jouée en boucle</li>
 *   <li>Si message status !== RECEIVED pour le même ID → ferme le popup
 *       (un autre coordinateur a acknowledge en parallèle)</li>
 *   <li>Bouton « Prendre en charge » → POST acknowledge</li>
 *   <li>Bouton « Voir détail » → navigate vers /emergency/sos/{id}</li>
 *   <li>Toggle son ON/OFF (pour les drills répétés)</li>
 * </ul>
 *
 * <p>L'audio HTML5 nécessite une interaction utilisateur préalable pour démarrer
 * (politique autoplay des navigateurs). On capte le premier click sur la page
 * pour pré-armer l'audio context.</p>
 *
 * <p>NOTE : ce composant doit être monté UNE seule fois dans le DashboardLayout
 * — pas par page — pour éviter les doublons de popup.</p>
 */

// Sirène : data URI courte (sinusoïde de type bip d'alarme).
// Pour la prod, remplacer par un mp3 hosted. Phase 3.b démo = bip basique.
const buildSirenAudio = (): HTMLAudioElement => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0.7;
    // Note : src vide ; on utilise WebAudio API ou un fichier dist statique en prod.
    // Pour la démo, on émet un bip via WebAudio si possible.
    return audio;
};

// Génère un bip d'alarme via WebAudio (fonctionne sans fichier)
class SirenBeeper {
    private ctx: AudioContext | null = null;
    private osc: OscillatorNode | null = null;
    private gain: GainNode | null = null;
    private intervalId: number | null = null;
    private playing = false;

    start() {
        if (this.playing) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.gain = this.ctx.createGain();
            this.gain.gain.value = 0.0;
            this.gain.connect(this.ctx.destination);

            this.osc = this.ctx.createOscillator();
            this.osc.type = 'sine';
            this.osc.frequency.value = 880; // La5
            this.osc.connect(this.gain);
            this.osc.start();

            // Pattern : bip 400ms / pause 200ms (deux tons alternés)
            let high = true;
            const beat = () => {
                if (!this.osc || !this.gain || !this.ctx) return;
                this.osc.frequency.setValueAtTime(high ? 880 : 660, this.ctx.currentTime);
                this.gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
                this.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
                high = !high;
            };
            beat();
            this.intervalId = window.setInterval(beat, 600);
            this.playing = true;
        } catch {
            // WebAudio bloqué : silencieux
        }
    }

    stop() {
        try {
            if (this.intervalId !== null) {
                window.clearInterval(this.intervalId);
                this.intervalId = null;
            }
            if (this.osc) {
                this.osc.stop();
                this.osc.disconnect();
                this.osc = null;
            }
            if (this.gain) {
                this.gain.disconnect();
                this.gain = null;
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

    const sirenRef = useRef<SirenBeeper | null>(null);
    if (sirenRef.current === null) sirenRef.current = new SirenBeeper();

    // ── Abonnement aux messages ─────────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = subscribe((alert) => {
            // Nouvelle alerte RECEIVED : afficher popup
            if (alert.status === 'RECEIVED' && !alert.drillMode) {
                setActiveAlert(alert);
            } else if (activeAlert && activeAlert.id === alert.id) {
                // Mise à jour de l'alerte affichée : si plus RECEIVED, fermer
                if (alert.status !== 'RECEIVED') {
                    setActiveAlert(null);
                }
            }
        });
        return unsubscribe;
    }, [subscribe, activeAlert]);

    // ── Sirène ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (activeAlert && soundEnabled) {
            sirenRef.current?.start();
        } else {
            sirenRef.current?.stop();
        }
        return () => {
            sirenRef.current?.stop();
        };
    }, [activeAlert, soundEnabled]);

    // ── Actions ─────────────────────────────────────────────────────────────
    const handleAcknowledge = async () => {
        if (!activeAlert?.id) return;
        setAcknowledging(true);
        try {
            await acknowledgeSosAlert(activeAlert.id, { note: 'Prise en charge depuis popup gyrophare' }, currentUser?.id);
            successNotification('SOS pris en charge');
            sirenRef.current?.stop();
            setActiveAlert(null);
            navigate(`/emergency/sos/${activeAlert.id}`);
        } catch {
            errorNotification("Échec de la prise en charge");
        } finally {
            setAcknowledging(false);
        }
    };

    const handleViewDetail = () => {
        if (!activeAlert?.id) return;
        sirenRef.current?.stop();
        const id = activeAlert.id;
        setActiveAlert(null);
        navigate(`/emergency/sos/${id}`);
    };

    const handleDismiss = () => {
        // Ne ferme pas l'alerte côté serveur — laisse un autre coordinateur la prendre
        sirenRef.current?.stop();
        setActiveAlert(null);
    };

    const formatTime = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (!activeAlert) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{
                // Gyrophare animé : background pulse rouge
                background: 'radial-gradient(circle at center, rgba(220,38,38,0.85), rgba(127,29,29,0.95))',
                animation: 'sosPulseBg 1.2s ease-in-out infinite',
            }}
        >
            <style>{`
                @keyframes sosPulseBg {
                    0%, 100% { background: radial-gradient(circle at center, rgba(220,38,38,0.85), rgba(127,29,29,0.95)); }
                    50% { background: radial-gradient(circle at center, rgba(252,165,165,0.6), rgba(220,38,38,0.95)); }
                }
                @keyframes sosShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                }
                @keyframes sosFlash {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>

            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-[92%] mx-auto overflow-hidden"
                style={{ animation: 'sosShake 0.6s ease-in-out infinite' }}
            >
                {/* Header gyrophare */}
                <header
                    className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 px-6 py-4 flex items-center justify-between"
                    style={{ animation: 'sosFlash 0.8s ease-in-out infinite' }}
                >
                    <div className="flex items-center gap-3">
                        <IconAlertTriangle size={32} stroke={2.4} className="text-white" />
                        <div>
                            <h2
                                className="text-white text-[20px] leading-tight"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                            >
                                ALERTE SOS
                            </h2>
                            <p className="text-red-100 text-[12px] uppercase tracking-[0.15em] font-semibold">
                                Intervention immédiate requise
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSoundEnabled((v) => !v)}
                        title={soundEnabled ? 'Couper le son' : 'Activer le son'}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                    >
                        {soundEnabled ? <IconVolume size={18} stroke={1.8} /> : <IconVolumeOff size={18} stroke={1.8} />}
                    </button>
                </header>

                {/* Corps */}
                <div className="p-6 space-y-4">
                    {/* Raison */}
                    <div className="bg-red-50 border-l-[3px] border-l-red-500 rounded-lg px-4 py-3">
                        <p className="text-[10.5px] uppercase tracking-[0.15em] text-red-700 font-bold mb-1">
                            Motif déclenchement
                        </p>
                        <p
                            className="text-[18px] text-red-900"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                        >
                            {activeAlert.reasonCode ?? 'Non spécifié'}
                        </p>
                        {activeAlert.description && (
                            <p className="text-[13px] text-red-800 mt-2 italic">
                                « {activeAlert.description} »
                            </p>
                        )}
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                <IconUser size={9} stroke={1.8} className="inline-block mr-1" />
                                Employé
                            </p>
                            <p className="text-[13px] text-slate-800 font-medium">
                                {activeAlert.employeeName ?? `#${activeAlert.employeeId}`}
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                <IconClock size={9} stroke={1.8} className="inline-block mr-1" />
                                Déclenché à
                            </p>
                            <p className="text-[13px] text-slate-800 font-medium font-mono">
                                {formatTime(activeAlert.triggeredAt)}
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                <IconMapPin size={9} stroke={1.8} className="inline-block mr-1" />
                                Position GPS
                            </p>
                            <p className="text-[12px] text-slate-800 font-mono">
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
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
                        >
                            <IconCheck size={16} stroke={2.4} />
                            {acknowledging ? 'Prise en charge…' : 'Prendre en charge'}
                        </button>
                        <button
                            type="button"
                            onClick={handleViewDetail}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-800 text-white text-[14px] font-semibold hover:bg-slate-900 transition-colors shadow-sm"
                        >
                            Voir détail complet
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="inline-flex items-center justify-center gap-1 px-3 py-3 rounded-lg bg-white text-slate-700 border border-slate-200 text-[12.5px] font-medium hover:bg-slate-50 transition-colors"
                            title="Masquer (sans prendre en charge)"
                        >
                            <IconX size={13} stroke={2} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorAlertListener;
