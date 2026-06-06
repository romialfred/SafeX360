import { IconCheck, IconX } from '@tabler/icons-react';
import { formatDateShort } from '../../../../utility/DateFormats';

/**
 * LifecycleTimeline — Timeline horizontale du cycle de vie d'un constat central.
 *
 *   ┌──────────────┐  ─────  ┌──────────────┐  ─────  ┌──────────────┐  ─────  ┌──────────────┐
 *   │   ✓  Décl.   │         │   ✓  Anal.   │         │   ●  Trait.  │         │   ○  Clôt.   │
 *   │  21 mai 2026 │         │  23 mai 2026 │         │  28 mai 2026 │         │      —       │
 *   │  A. Traoré   │         │  M. Kouraogo │         │  M. Kouraogo │         │      —       │
 *   └──────────────┘         └──────────────┘         └──────────────┘         └──────────────┘
 *
 *   - Étape complétée  : dot rempli couleur + IconCheck
 *   - Étape courante   : dot rempli couleur + halo ring
 *   - Étape à venir    : dot creux border-slate-300
 *   - Annulé / Rejeté  : 5e étape rouge / slate avec IconX
 *
 * Aligné design system HSE (sky → amber → orange → emerald).
 */

type HistoryEntry = {
    id?: number;
    status?: string;
    ownerId?: number;
    date?: string;
    createdAt?: string;
    creationDate?: string;
};

interface Props {
    currentStatus: string;
    detectionDate?: string;
    detectionActor?: string;
    history?: HistoryEntry[];
    empMap?: Record<number, { name?: string }>;
}

interface StepDef {
    key: string;
    label: string;
    tone: 'sky' | 'amber' | 'orange' | 'emerald';
}

const STEPS: StepDef[] = [
    { key: 'REPORTED',          label: 'Déclaration', tone: 'sky' },
    { key: 'ANALYSIS',          label: 'Analyse',     tone: 'amber' },
    { key: 'AC_IMPLEMENTATION', label: 'Traitement',  tone: 'orange' },
    { key: 'CLOSED',            label: 'Clôture',     tone: 'emerald' },
];

const TONE_CLASS: Record<StepDef['tone'], {
    dotActive: string;
    ring: string;
    label: string;
    connector: string;
}> = {
    sky:     { dotActive: 'bg-sky-500',     ring: 'ring-sky-100',     label: 'text-sky-700',     connector: 'bg-sky-300' },
    amber:   { dotActive: 'bg-amber-500',   ring: 'ring-amber-100',   label: 'text-amber-700',   connector: 'bg-amber-300' },
    orange:  { dotActive: 'bg-orange-500',  ring: 'ring-orange-100',  label: 'text-orange-700',  connector: 'bg-orange-300' },
    emerald: { dotActive: 'bg-emerald-500', ring: 'ring-emerald-100', label: 'text-emerald-700', connector: 'bg-emerald-300' },
};

export default function LifecycleTimeline({
    currentStatus,
    detectionDate,
    detectionActor,
    history = [],
    empMap = {},
}: Props) {
    const status = String(currentStatus || '').toUpperCase();
    const isCancelled = status === 'CANCELLED';
    const isRejected = status === 'REJECTED';

    // Index de l'étape courante dans STATUS_FLOW (-1 si annulé/rejeté/inconnu)
    const currentIndex = STEPS.findIndex(s => s.key === status);
    // Si CLOSED, currentIndex = 3 → toutes étapes complétées
    // Si annulé, on garde l'index de la dernière étape historique connue

    // Résout date + acteur d'une étape (depuis history pour les étapes ≥ ANALYSIS)
    const resolveStep = (key: string): { date?: string; actor?: string } | null => {
        if (key === 'REPORTED') {
            return { date: detectionDate, actor: detectionActor };
        }
        // On cherche dans history une entrée dont le statut correspond
        const found = history.find(h => String(h.status || '').toUpperCase() === key);
        if (!found) return null;
        const date = found.date || found.creationDate || found.createdAt;
        const actor = found.ownerId ? empMap[found.ownerId]?.name : undefined;
        return { date, actor };
    };

    // Pour annulé / rejeté : on cherche la dernière étape qui a effectivement eu lieu
    const lastCompletedIndex = (() => {
        if (currentIndex >= 0) return currentIndex;
        // Annulé / rejeté → on cherche le plus haut statut atteint dans history
        for (let i = STEPS.length - 1; i >= 0; i--) {
            if (history.some(h => String(h.status || '').toUpperCase() === STEPS[i].key)) {
                return i;
            }
        }
        return 0; // au moins déclaration faite
    })();

    return (
        <div className="flex items-start w-full">
            {STEPS.map((step, i) => {
                const tone = TONE_CLASS[step.tone];
                const resolved = resolveStep(step.key);

                // État
                const isComplete = i < lastCompletedIndex || (i === lastCompletedIndex && status === 'CLOSED');
                const isCurrent = i === currentIndex && !isCancelled && !isRejected;
                const isReached = i <= lastCompletedIndex;

                // Connecteur vers la prochaine étape
                const showConnector = i < STEPS.length - 1 || isCancelled || isRejected;
                const nextReached = i + 1 <= lastCompletedIndex;

                return (
                    <div key={step.key} className="flex-1 relative min-w-0">
                        {/* Connecteur horizontal */}
                        {showConnector && (
                            <div
                                className={`absolute top-[10px] left-1/2 right-0 h-px ${
                                    nextReached ? tone.connector : 'bg-slate-200'
                                }`}
                                style={{ width: '100%' }}
                                aria-hidden="true"
                            />
                        )}

                        {/* Dot + meta (ultra compact — label + date sur 2 lignes max) */}
                        <div className="relative flex flex-col items-center text-center px-1">
                            <div
                                className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                    isReached
                                        ? `${tone.dotActive} text-white`
                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                } ${isCurrent ? `ring-[3px] ${tone.ring}` : ''}`}
                                title={resolved?.actor || undefined}
                            >
                                {isComplete || (isReached && i < lastCompletedIndex) ? (
                                    <IconCheck size={10} stroke={3} />
                                ) : isReached ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                ) : (
                                    <span className="text-[9px] font-semibold">{i + 1}</span>
                                )}
                            </div>

                            <p
                                className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.10em] ${
                                    isReached ? tone.label : 'text-slate-400'
                                }`}
                            >
                                {step.label}
                            </p>

                            {resolved?.date ? (
                                <p className="text-[9px] text-slate-500 leading-tight">
                                    {formatDateShort(resolved.date)}
                                </p>
                            ) : (
                                <p className="text-[9px] text-slate-300 leading-tight">—</p>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Étape terminale Annulé / Rejeté */}
            {(isCancelled || isRejected) && (
                <div className="flex-1 relative min-w-0">
                    <div className="relative flex flex-col items-center text-center px-1">
                        <div
                            className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                                isCancelled ? 'bg-slate-400 ring-[3px] ring-slate-100' : 'bg-red-500 ring-[3px] ring-red-100'
                            }`}
                        >
                            <IconX size={10} stroke={3} />
                        </div>
                        <p
                            className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.10em] ${
                                isCancelled ? 'text-slate-500' : 'text-red-600'
                            }`}
                        >
                            {isCancelled ? 'Annulé' : 'Rejeté'}
                        </p>
                        {history.length > 0 && (() => {
                            const last = [...history].sort((a, b) =>
                                new Date(b.date || b.createdAt || 0).getTime() -
                                new Date(a.date || a.createdAt || 0).getTime()
                            )[0];
                            return last?.date ? (
                                <p className="text-[9px] text-slate-500 leading-tight">
                                    {formatDateShort(last.date)}
                                </p>
                            ) : null;
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
