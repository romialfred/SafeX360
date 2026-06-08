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
    const sirenIntervalRef = useRef<number | null>(null);
    const ttsIntervalRef = useRef<number | null>(null);
    const ttsPhraseRef = useRef<string>('');

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

    // Gestion du cycle de vie de la sirene + TTS en boucle infinie.
    // La sirene oscille entre 650 et 950 Hz via un setInterval qui modifie
    // frequency.value en direct (au lieu de planifier 600 valueAt qui finissait
    // par s'epuiser silencieusement). Le TTS est replanifie toutes les 8s tant
    // que l'utilisateur n'a pas acquitte. Une coupure proprement gardee dure
    // jusqu'au clic "J'ai compris" OU jusqu'au timeout de securite (5 min).
    useEffect(() => {
        if (!isArmed) {
            stopAlarm();
            return;
        }
        startSiren();
        ttsPhraseRef.current = `Ceci n'est pas un exercice. Dynamitage en cours sur ${speakableZone(zone)}. Veuillez evacuer les lieux immediatement.`;
        startTtsLoop();
        // Auto-stop apres 5 minutes (securite : si l'utilisateur oublie d'acquitter,
        // on n'inonde pas indefiniment le poste de travail).
        const safetyTimeout = window.setTimeout(stopAlarm, SIREN_TIMEOUT_MS);
        return () => {
            window.clearTimeout(safetyTimeout);
            stopAlarm();
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
            const now = ctx.currentTime;
            osc.frequency.value = 650;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.8);
            osc.start();
            oscillatorRef.current = osc;
            gainRef.current = gain;
            // Boucle infinie : alterne 650 Hz / 950 Hz toutes les 700 ms.
            // C'est un vrai setInterval cote JS, donc rien ne s'epuise jamais
            // tant que la page reste ouverte et que stopAlarm() n'a pas tourne.
            let phase = 0;
            sirenIntervalRef.current = window.setInterval(() => {
                if (!oscillatorRef.current || !audioCtxRef.current) return;
                phase = 1 - phase;
                try {
                    oscillatorRef.current.frequency.setValueAtTime(
                        phase === 0 ? 650 : 950,
                        audioCtxRef.current.currentTime,
                    );
                } catch {
                    // AudioContext ferme entre-temps
                }
            }, 700);
        } catch (_e) {
            // ignore — l'utilisateur doit avoir interagi avec la page avant
            // pour que Web Audio fonctionne (politique d'autoplay navigateur).
        }
    };

    const startTtsLoop = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        const speakOnce = () => {
            try {
                const synth = window.speechSynthesis;
                // Si on est encore en train de parler, on ne re-empile pas
                if (synth.speaking || synth.pending) return;
                const u = new SpeechSynthesisUtterance(ttsPhraseRef.current);
                const voices = synth.getVoices();
                const frVoice = voices.find((v) => v.lang.startsWith('fr'));
                if (frVoice) u.voice = frVoice;
                u.lang = 'fr-FR';
                u.rate = 0.95;
                u.pitch = 1.0;
                u.volume = 1.0;
                synth.speak(u);
            } catch {
                // ignore
            }
        };
        // Lance immediatement (avec gestion voiceschanged si voix pas chargees)
        const synth = window.speechSynthesis;
        if (synth.getVoices().length === 0) {
            const onVoices = () => {
                speakOnce();
                synth.removeEventListener('voiceschanged', onVoices);
            };
            synth.addEventListener('voiceschanged', onVoices, { once: true });
        } else {
            speakOnce();
        }
        // Replante l'annonce toutes les 9 s (duree typique de la phrase ~7 s +
        // marge). Le check synth.speaking dans speakOnce evite tout chevauchement.
        ttsIntervalRef.current = window.setInterval(speakOnce, 9000);
    };

    const stopAlarm = () => {
        try {
            // Coupe la boucle d'alternance sirene
            if (sirenIntervalRef.current) {
                clearInterval(sirenIntervalRef.current);
                sirenIntervalRef.current = null;
            }
            // Coupe la boucle TTS
            if (ttsIntervalRef.current) {
                clearInterval(ttsIntervalRef.current);
                ttsIntervalRef.current = null;
            }
            // Fade-out propre du gain
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
        stopAlarm();
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

// Note : l'ancien helper speakEvacuation() a ete supprime au profit de la
// boucle TTS infinie integree au composant (cf. startTtsLoop). Le TTS est
// maintenant re-emis toutes les 9 s tant que l'alarme est active.
