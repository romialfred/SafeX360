/**
 * BlastEvacuationAlarm — Alarme d'evacuation declenchee a l'heure du tir.
 *
 * Mecanisme audio (corrige 2026-06-08) :
 *   - Sirene : un AudioBuffer (1.4 s = 0.7 s a 650 Hz + 0.7 s a 950 Hz, fade-in)
 *     joue en boucle infinie via AudioBufferSourceNode.loop = true. Le
 *     bouclage est gere par le moteur audio natif du navigateur, totalement
 *     independant du thread JS (tab throttling sans effet).
 *   - Keepalive : un setInterval(2 s) verifie audioCtx.state ; si "suspended"
 *     (Chrome peut suspendre apres inactivite), on appelle resume().
 *   - TTS : SpeechSynthesisUtterance reemis toutes les 9 s avec garde
 *     anti-chevauchement. Si speechSynthesis se met en pause inattendue
 *     (Chrome bug connu), on appelle synth.resume() au passage.
 *
 * Le composant ne lit PLUS sessionStorage automatiquement : un utilisateur
 * qui revient sur la page apres avoir acquitte verra de nouveau le modal,
 * et c'est volontaire (l'evacuation est une situation critique, le rappel
 * doit etre actif a chaque chargement de page).
 *
 * Refs : ISO 45001 §8.2 (preparation et reponse aux situations d'urgence),
 *        Code minier OHADA art. 87 (signalisation et evacuation lors des tirs).
 */

import { useEffect, useRef, useState } from 'react';
import { IconAlertOctagon, IconCheck, IconMapPin, IconClock } from '@tabler/icons-react';
import { speakableZone, formatZoneScope } from './formatZone';

const TRIGGER_SECONDS = 0;
const PRE_WARN_SECONDS = 600;
const SIREN_TIMEOUT_MS = 5 * 60 * 1000;
const KEEPALIVE_MS = 2000;
const TTS_REPEAT_MS = 9000;

interface BlastEvacuationAlarmProps {
    blastReference?: string | null;
    zone?: string | null;
    scheduledAtIso?: string | null;
    blastId?: number | null;
}

export default function BlastEvacuationAlarm({
    blastReference,
    zone,
    scheduledAtIso,
    blastId,
}: BlastEvacuationAlarmProps) {
    const [acked, setAcked] = useState<boolean>(false);
    const [now, setNow] = useState<number>(() => Date.now());

    // Tick du compte a rebours (precis a la seconde)
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const scheduledMs = scheduledAtIso ? new Date(scheduledAtIso).getTime() : NaN;
    const secondsUntil = Number.isFinite(scheduledMs)
        ? Math.floor((scheduledMs - now) / 1000)
        : Number.POSITIVE_INFINITY;

    // Reset de l'acquittement quand on change de tir
    useEffect(() => {
        setAcked(false);
    }, [blastId]);

    const isArmed = !acked && secondsUntil <= TRIGGER_SECONDS;
    const isPreWarn =
        !acked && secondsUntil > TRIGGER_SECONDS && secondsUntil <= PRE_WARN_SECONDS;

    // ── Refs audio (persistent across renders) ─────────────────────────
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const keepaliveRef = useRef<number | null>(null);
    const ttsIntervalRef = useRef<number | null>(null);
    const ttsPhraseRef = useRef<string>('');

    // Construit la phrase TTS chaque fois que la zone change (sans reset audio)
    useEffect(() => {
        ttsPhraseRef.current = `Ceci n'est pas un exercice. Dynamitage en cours sur ${speakableZone(zone)}. Veuillez evacuer les lieux immediatement.`;
    }, [zone]);

    // ── Cycle de vie alarme : un seul gate sur isArmed ─────────────────
    useEffect(() => {
        if (!isArmed) {
            stopAlarm();
            return;
        }
        // Demarrage : sirene en boucle native + TTS + safety timeout
        startSiren();
        startTtsLoop();
        const safetyTimer = window.setTimeout(() => {
            // Apres 5 min : on coupe la sirene mais le modal reste visible
            // L'utilisateur garde le choix d'acquitter manuellement.
            stopAudioOnly();
        }, SIREN_TIMEOUT_MS);
        return () => {
            window.clearTimeout(safetyTimer);
            stopAlarm();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isArmed]);

    /**
     * Genere un AudioBuffer contenant une sequence sirene 2 tons (650 Hz puis
     * 950 Hz, 0.7 s chacun, sawtooth +/- 30% gain) qui sera jouee en boucle
     * native par AudioBufferSourceNode. Ne renvoie rien si l'API n'est pas
     * disponible.
     */
    function buildSirenBuffer(ctx: AudioContext): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const halfPeriod = 0.7; // 0.7 s par ton
        const totalDuration = halfPeriod * 2;
        const totalSamples = Math.floor(sampleRate * totalDuration);
        const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
        const data = buffer.getChannelData(0);
        const halfSamples = totalSamples / 2;
        const f1 = 650;
        const f2 = 950;
        // Genere un sawtooth simple (somme des harmoniques approximee par tan
        // -> on prend juste 2*((t*f)%1)-1 pour rester leger)
        for (let i = 0; i < totalSamples; i++) {
            const t = i / sampleRate;
            const freq = i < halfSamples ? f1 : f2;
            const phase = (t * freq) % 1;
            const sawtooth = 2 * phase - 1;
            // Gain global 0.28 (audible sans saturer). Petit fade aux jonctions
            // (5 ms) pour eviter les clicks audibles a la transition de ton.
            const fadeMs = 0.005 * sampleRate;
            let env = 1;
            if (i < fadeMs) env = i / fadeMs;
            else if (Math.abs(i - halfSamples) < fadeMs)
                env = Math.abs(i - halfSamples) / fadeMs;
            else if (i > totalSamples - fadeMs) env = (totalSamples - i) / fadeMs;
            data[i] = sawtooth * 0.28 * env;
        }
        return buffer;
    }

    function startSiren() {
        try {
            if (audioCtxRef.current) {
                // Deja en cours : juste s'assurer qu'on n'est pas suspendu
                audioCtxRef.current.resume().catch(() => undefined);
                return;
            }
            const Ctor =
                (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!Ctor) {
                console.warn('[BlastEvacuationAlarm] Web Audio API indisponible');
                return;
            }
            const ctx: AudioContext = new Ctor();
            audioCtxRef.current = ctx;
            // Au cas ou Chrome aurait suspendu d'office (pas de gesture)
            ctx.resume().catch(() => undefined);

            const buffer = buildSirenBuffer(ctx);
            const source = ctx.createBufferSource();
            const gain = ctx.createGain();
            source.buffer = buffer;
            source.loop = true; // boucle native, indefinie
            source.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.4);
            source.start();
            sourceRef.current = source;
            gainRef.current = gain;

            // Keepalive : surveille l'etat du context toutes les 2 s.
            // Si "suspended" (politique d'autoplay Chrome), tente un resume().
            keepaliveRef.current = window.setInterval(() => {
                const c = audioCtxRef.current;
                if (!c) return;
                if (c.state === 'suspended' || (c.state as string) === 'interrupted') {
                    c.resume().catch(() => undefined);
                }
                // Si on a perdu la source pour une raison quelconque, recree
                if (!sourceRef.current && audioCtxRef.current) {
                    try {
                        const newSrc = c.createBufferSource();
                        newSrc.buffer = buildSirenBuffer(c);
                        newSrc.loop = true;
                        const g = gainRef.current ?? c.createGain();
                        newSrc.connect(g);
                        if (!gainRef.current) {
                            g.connect(c.destination);
                            g.gain.setValueAtTime(0.9, c.currentTime);
                            gainRef.current = g;
                        }
                        newSrc.start();
                        sourceRef.current = newSrc;
                    } catch {
                        // ignorer
                    }
                }
            }, KEEPALIVE_MS);
        } catch (e) {
            console.warn('[BlastEvacuationAlarm] startSiren failed', e);
        }
    }

    function startTtsLoop() {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        const synth = window.speechSynthesis;
        const speakOnce = () => {
            try {
                // Reveille speechSynthesis si suspendu (bug Chrome connu)
                if (synth.paused) synth.resume();
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
                // ignorer
            }
        };
        // Premier passage immediat (en attendant voiceschanged si necessaire)
        if (synth.getVoices().length === 0) {
            const onVoices = () => {
                speakOnce();
                synth.removeEventListener('voiceschanged', onVoices);
            };
            synth.addEventListener('voiceschanged', onVoices, { once: true });
        } else {
            speakOnce();
        }
        ttsIntervalRef.current = window.setInterval(speakOnce, TTS_REPEAT_MS);
    }

    /** Coupe uniquement la sirene + le TTS, garde le modal visible. */
    function stopAudioOnly() {
        try {
            if (keepaliveRef.current) {
                clearInterval(keepaliveRef.current);
                keepaliveRef.current = null;
            }
            if (ttsIntervalRef.current) {
                clearInterval(ttsIntervalRef.current);
                ttsIntervalRef.current = null;
            }
            if (gainRef.current && audioCtxRef.current) {
                const t = audioCtxRef.current.currentTime;
                gainRef.current.gain.cancelScheduledValues(t);
                gainRef.current.gain.linearRampToValueAtTime(0, t + 0.4);
            }
            if (sourceRef.current) {
                try {
                    sourceRef.current.stop(
                        audioCtxRef.current ? audioCtxRef.current.currentTime + 0.5 : 0,
                    );
                } catch {
                    // deja stoppe
                }
                sourceRef.current = null;
            }
            if (audioCtxRef.current) {
                // Ferme apres le fade-out (500 ms)
                const ctx = audioCtxRef.current;
                audioCtxRef.current = null;
                window.setTimeout(() => {
                    try {
                        ctx.close();
                    } catch {
                        // ignore
                    }
                }, 600);
            }
            gainRef.current = null;
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        } catch {
            // ignorer
        }
    }

    function stopAlarm() {
        stopAudioOnly();
    }

    const handleAck = () => {
        setAcked(true);
        stopAlarm();
        // Marquage sessionStorage pour info uniquement (pas lu au mount,
        // l'evacuation est trop critique pour s'auto-acquitter)
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

    return (
        <div
            className="fixed inset-0 z-[9999] bg-red-900/95 flex items-center justify-center px-4"
            role="alertdialog"
            aria-labelledby="blast-evacuation-title"
        >
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-4 ring-red-300/50 overflow-hidden">
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
                        Sirene auto-coupee apres 5 minutes (modal reste visible)
                    </p>
                </div>
            </div>
        </div>
    );
}
