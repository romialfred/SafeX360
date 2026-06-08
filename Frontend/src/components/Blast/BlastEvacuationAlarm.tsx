/**
 * BlastEvacuationAlarm — Alarme automatique d'evacuation declenchee a
 * l'approche du tir.
 *
 * Mecanisme :
 *   - Le composant prend en parametre {@code secondsUntil} (compte a rebours
 *     temps reel du prochain tir confirme, transmis par le Dashboard).
 *   - Quand secondsUntil atteint {@code TRIGGER_SECONDS} (par defaut 0,
 *     c'est-a-dire l'heure du tir), il bascule en mode armed.
 *   - En mode armed : modal plein ecran rouge + sirene crescendo (boucle
 *     audio Web Audio API) + TTS "Ceci n'est pas un exercice. Dynamitage
 *     en cours sur [Zone]. Veuillez evacuer les lieux immediatement."
 *   - L'utilisateur peut acquitter manuellement via un bouton (la sirene
 *     s'arrete). Sans acquittement, la sirene tourne en boucle 5 minutes
 *     puis s'arrete d'elle-meme (tout en laissant le modal visible).
 *
 * Sources reglementaires :
 *   - ISO 45001 §8.2 (preparation et reponse aux situations d'urgence)
 *   - Code minier OHADA art. 87 (signalisation et evacuation lors des tirs)
 *
 * Le composant respecte prefers-reduced-motion : pas de pulse visuel, sirene
 * uniquement (le danger physique justifie la sirene meme avec reduced-motion).
 */

import { useEffect, useRef, useState } from 'react';
import { IconAlertOctagon, IconCheck, IconMapPin, IconClock } from '@tabler/icons-react';
import { speakableZone, formatZoneScope } from './formatZone';

const TRIGGER_SECONDS = 0;       // declenchement = heure exacte du tir
const PRE_WARN_SECONDS = 600;    // 10 min avant : phase pre-alerte visuelle douce
const SIREN_TIMEOUT_MS = 5 * 60 * 1000; // auto-arret de la sirene apres 5 min

interface BlastEvacuationAlarmProps {
    /** Reference du tir (BLT-2026-0143). */
    blastReference?: string | null;
    /** Zone d'alerte au format machine (FOSSE_SUD). */
    zone?: string | null;
    /** Date et heure prevues du tir (ISO 8601). Le compte a rebours
     *  est calcule localement et tick toutes les secondes. */
    scheduledAtIso?: string | null;
    /** Numero d'identification du tir (utilise pour memoriser l'acquittement). */
    blastId?: number | null;
}

export default function BlastEvacuationAlarm({
    blastReference,
    zone,
    scheduledAtIso,
    blastId,
}: BlastEvacuationAlarmProps) {
    // Tick local du compte a rebours (precis a la seconde)
    const [now, setNow] = useState<number>(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const scheduledMs = scheduledAtIso ? new Date(scheduledAtIso).getTime() : NaN;
    const secondsUntil = Number.isFinite(scheduledMs)
        ? Math.floor((scheduledMs - now) / 1000)
        : Number.POSITIVE_INFINITY;
    const [acked, setAcked] = useState<boolean>(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const sirenTimerRef = useRef<number | null>(null);

    // Reset de l'acquittement quand on change de tir
    useEffect(() => {
        setAcked(false);
    }, [blastId]);

    // Recupere l'acquittement depuis sessionStorage pour ne pas re-declencher
    // si l'utilisateur change de page puis revient.
    useEffect(() => {
        if (blastId == null) return;
        const key = `blast-evacuation-ack-${blastId}`;
        try {
            if (sessionStorage.getItem(key) === '1') {
                setAcked(true);
            }
        } catch {
            // sessionStorage indisponible (mode privacy) : ignorer
        }
    }, [blastId]);

    const isArmed = !acked && secondsUntil <= TRIGGER_SECONDS;
    const isPreWarn =
        !acked && secondsUntil > TRIGGER_SECONDS && secondsUntil <= PRE_WARN_SECONDS;

    // Gestion du cycle de vie de la sirene
    useEffect(() => {
        if (!isArmed) {
            stopSiren();
            return;
        }
        startSiren();
        speakEvacuation(zone);
        // Auto-stop apres 5 minutes
        sirenTimerRef.current = window.setTimeout(stopSiren, SIREN_TIMEOUT_MS);
        return () => {
            stopSiren();
            if (sirenTimerRef.current) {
                clearTimeout(sirenTimerRef.current);
                sirenTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isArmed, zone]);

    const startSiren = () => {
        try {
            if (audioCtxRef.current) return; // deja en cours
            const AudioCtor =
                (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtor) return;
            const ctx = new AudioCtor() as AudioContext;
            audioCtxRef.current = ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.connect(gain);
            gain.connect(ctx.destination);
            // Pattern sirene industrielle : 2 tons alternes (650 Hz / 950 Hz),
            // crescendo doux pour ne pas saturer.
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(650, now);
            for (let i = 0; i < 600; i++) {
                osc.frequency.setValueAtTime(i % 2 === 0 ? 650 : 950, now + i * 0.6);
            }
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 1.2);
            osc.start();
            oscillatorRef.current = osc;
            gainRef.current = gain;
        } catch (_e) {
            // ignore — l'utilisateur doit avoir interagi avec la page avant
            // pour que Web Audio fonctionne (politique d'autoplay navigateur).
        }
    };

    const stopSiren = () => {
        try {
            if (gainRef.current && audioCtxRef.current) {
                const now = audioCtxRef.current.currentTime;
                gainRef.current.gain.cancelScheduledValues(now);
                gainRef.current.gain.linearRampToValueAtTime(0, now + 0.3);
            }
            if (oscillatorRef.current) {
                try {
                    oscillatorRef.current.stop();
                } catch {
                    // deja stoppe
                }
                oscillatorRef.current.disconnect();
                oscillatorRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
            gainRef.current = null;
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        } catch {
            // ignore
        }
    };

    const handleAck = () => {
        setAcked(true);
        stopSiren();
        if (blastId != null) {
            try {
                sessionStorage.setItem(`blast-evacuation-ack-${blastId}`, '1');
            } catch {
                // ignorer
            }
        }
    };

    // ── Rendu ─────────────────────────────────────────────────────────
    if (!isArmed && !isPreWarn) return null;

    const humanZone = formatZoneScope(zone);

    // Pre-alerte (T-10 min) : bandeau discret en haut
    if (isPreWarn) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-600 text-white px-4 py-2 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[13px]">
                        <IconAlertOctagon size={16} stroke={2} className="flex-shrink-0" />
                        <span>
                            <b>Pre-alerte tir</b> · {blastReference} sur <b>{humanZone}</b>
                            {' '}— evacuation imminente
                        </span>
                    </div>
                    <span className="text-[12px] tabular-nums font-mono">
                        T - {Math.max(0, Math.floor(secondsUntil / 60))} min
                    </span>
                </div>
            </div>
        );
    }

    // Alerte armee : modal plein ecran rouge + sirene
    return (
        <div
            className="fixed inset-0 z-[9999] bg-red-900/95 flex items-center justify-center px-4"
            role="alertdialog"
            aria-labelledby="blast-evacuation-title"
        >
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-4 ring-red-300/50 overflow-hidden">
                {/* Bandeau rouge */}
                <div className="bg-red-700 text-white px-6 py-4 flex items-center gap-3">
                    <IconAlertOctagon size={28} stroke={2.4} />
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">
                            Ceci n'est pas un exercice
                        </div>
                        <h1
                            id="blast-evacuation-title"
                            className="text-[20px] leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 700,
                            }}
                        >
                            Dynamitage en cours — Evacuation immediate
                        </h1>
                    </div>
                </div>

                {/* Corps */}
                <div className="p-6 space-y-4">
                    <p className="text-[15px] text-slate-800 leading-relaxed">
                        Un tir de mine est en cours d'execution. Toutes les personnes
                        presentes dans la zone d'alerte ou a proximite doivent rejoindre
                        immediatement le point de rassemblement le plus proche et
                        attendre le signal <i>site degage</i>.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-[13.5px]">
                        {blastReference && (
                            <div className="flex items-center gap-2">
                                <IconClock size={14} stroke={1.8} className="text-slate-500" />
                                <span className="text-slate-500">Reference :</span>
                                <span className="font-mono text-slate-900">{blastReference}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <IconMapPin size={14} stroke={1.8} className="text-slate-500" />
                            <span className="text-slate-500">Zone d'alerte :</span>
                            <span className="font-semibold text-slate-900">{humanZone}</span>
                        </div>
                    </div>

                    <ul className="text-[13.5px] text-slate-700 space-y-1.5 list-disc list-inside">
                        <li>Cessez immediatement toute activite en cours.</li>
                        <li>Rejoignez le point de rassemblement le plus proche.</li>
                        <li>Ne revenez dans la zone qu'apres l'annonce <i>site degage</i>.</li>
                        <li>Signalez tout collegue absent au coordinateur HSE.</li>
                    </ul>

                    <button
                        type="button"
                        onClick={handleAck}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-[14px] transition shadow"
                        style={{ minHeight: 56 }}
                    >
                        <IconCheck size={18} stroke={2.4} />
                        J'ai compris — Couper la sirene
                    </button>

                    <p className="text-[11px] text-slate-500 text-center">
                        Reference ISO 45001 §8.2 · Code minier OHADA art. 87 ·
                        Sirene auto-coupee apres 5 minutes
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Lance la synthese vocale du message d'evacuation. Voix FR si possible,
 * fallback sur la voix par defaut.
 */
function speakEvacuation(zone?: string | null) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const phrase = `Ceci n'est pas un exercice. Dynamitage en cours sur ${speakableZone(zone)}. Veuillez evacuer les lieux immediatement.`;
        const speak = () => {
            const u = new SpeechSynthesisUtterance(phrase);
            const voices = synth.getVoices();
            const frVoice = voices.find((v) => v.lang.startsWith('fr'));
            if (frVoice) u.voice = frVoice;
            u.lang = 'fr-FR';
            u.rate = 0.95;
            u.pitch = 1.0;
            u.volume = 1.0;
            synth.speak(u);
            // Repeter 2 fois pour amplifier l'urgence
            window.setTimeout(() => {
                const u2 = new SpeechSynthesisUtterance(phrase);
                if (frVoice) u2.voice = frVoice;
                u2.lang = 'fr-FR';
                u2.rate = 0.95;
                synth.speak(u2);
            }, 7000);
        };
        if (synth.getVoices().length === 0) {
            // Voix pas encore chargees (cas Chrome)
            synth.addEventListener('voiceschanged', speak, { once: true });
        } else {
            speak();
        }
    } catch {
        // ignore
    }
}
