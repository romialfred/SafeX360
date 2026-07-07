/**
 * MobileErrorEventList — Registre tactile du module « Gestion des Erreurs ».
 *
 * Liste compacte des événements déclarés (signaux faibles toutes sources
 * confondues). Tap = ouvre le détail web (déjà mobile-first). FAB rose pour
 * démarrer une nouvelle déclaration.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconShieldExclamation,
    IconChevronRight,
    IconCalendarStats,
    IconPlus,
    IconAlertOctagon,
    IconRefresh,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

type ErrorEventTypeCode =
    | 'HUMAN_ERROR'
    | 'PROCEDURAL'
    | 'ORGANIZATIONAL'
    | 'TECHNICAL'
    | 'ENVIRONMENTAL';

type ErrorEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type ErrorEventStatus =
    | 'DECLARED'
    | 'TRIAGED'
    | 'ANALYZING'
    | 'ACTION_PLAN'
    | 'IMPLEMENTING'
    | 'VERIFYING'
    | 'CLOSED'
    | 'CAPITALIZED'
    | 'REOPENED';

interface ErrorEventSummary {
    id: number;
    reference?: string;
    type: ErrorEventTypeCode;
    severity: ErrorEventSeverity;
    occurredAt: string;
    status: ErrorEventStatus;
    title?: string;
}

const TYPE_LABELS: Record<ErrorEventTypeCode, string> = {
    HUMAN_ERROR: 'Erreur humaine',
    PROCEDURAL: 'Procédural',
    ORGANIZATIONAL: 'Organisationnel',
    TECHNICAL: 'Technique',
    ENVIRONMENTAL: 'Environnemental',
};

const TYPE_BADGE: Record<ErrorEventTypeCode, string> = {
    HUMAN_ERROR: 'bg-amber-50 text-amber-800 border-amber-200',
    PROCEDURAL: 'bg-blue-50 text-blue-800 border-blue-200',
    ORGANIZATIONAL: 'bg-violet-50 text-violet-800 border-violet-200',
    TECHNICAL: 'bg-slate-100 text-slate-700 border-slate-300',
    ENVIRONMENTAL: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const SEVERITY_LABELS: Record<ErrorEventSeverity, string> = {
    LOW: 'Faible',
    MEDIUM: 'Modérée',
    HIGH: 'Élevée',
    CRITICAL: 'Critique',
};

const SEVERITY_DOTS: Record<ErrorEventSeverity, string> = {
    LOW: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-rose-600',
};

const STATUS_LABELS: Record<ErrorEventStatus, string> = {
    DECLARED: 'Déclaré',
    TRIAGED: 'Trié',
    ANALYZING: 'En analyse',
    ACTION_PLAN: "Plan d'action",
    IMPLEMENTING: 'En traitement',
    VERIFYING: 'Vérification',
    CLOSED: 'Clôturé',
    CAPITALIZED: 'Capitalisé',
    REOPENED: 'Réouvert',
};

const STATUS_TONE: Record<ErrorEventStatus, string> = {
    DECLARED: 'bg-slate-50 text-slate-700',
    TRIAGED: 'bg-sky-50 text-sky-800',
    ANALYZING: 'bg-indigo-50 text-indigo-800',
    ACTION_PLAN: 'bg-cyan-50 text-cyan-800',
    IMPLEMENTING: 'bg-amber-50 text-amber-800',
    VERIFYING: 'bg-violet-50 text-violet-800',
    CLOSED: 'bg-emerald-50 text-emerald-800',
    CAPITALIZED: 'bg-teal-50 text-teal-800',
    REOPENED: 'bg-orange-50 text-orange-800',
};

function formatEventDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function MobileErrorEventList() {
    useStatusBarColor('#BE185D', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<ErrorEventSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchEvents = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<ErrorEventSummary[]>({
                    endpoint: `/hns/error/events?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `error-events-${companyId}`,
                    ttlMs: 10 * 60 * 1000,
                });
                if (!cancelled) {
                    const sorted = (Array.isArray(res.data) ? res.data : []).slice().sort((a, b) =>
                        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
                    );
                    setItems(sorted);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setItems([]);
                    setError('Impossible de charger les événements. Vérifiez votre connexion.');
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchEvents, [fetchEvents]);

    const openDetail = (id: number) => {
        haptic('light');
        navigate(`/error-management/${id}`);
    };

    const openDeclare = () => {
        haptic('medium');
        navigate('/m/error-event/new');
    };

    return (
        <>
            <MobileTopBar
                title="Gestion des erreurs"
                subtitle="Registre des événements"
                accent="#BE185D"
                onBack={() => navigate('/m/home')}
            />

            {stale && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={1.8} />
                    <span>Données du cache local — synchronisation au retour du réseau.</span>
                </div>
            )}

            <section className="px-4 pt-3 pb-2">
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3 mb-3 flex items-center gap-2">
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={fetchEvents} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium flex-shrink-0 inline-flex items-center gap-1">
                            <IconRefresh size={12} stroke={2} /> Réessayer
                        </button>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {items && items.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                            <IconShieldExclamation size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucun événement déclaré
                        </p>
                        <p className="text-[12.5px] text-slate-500 mb-4 leading-relaxed">
                            Signalez une situation dangereuse, un presqu'accident ou une non-conformité.
                        </p>
                        <button
                            type="button"
                            onClick={openDeclare}
                            className="px-4 py-2 rounded-lg bg-pink-700 text-white text-[13px] font-medium"
                            style={{ minHeight: 44 }}
                        >
                            Nouvelle déclaration
                        </button>
                    </div>
                )}

                {items && items.length > 0 && (
                    <ul className="space-y-2 mt-1">
                        {items.map((ev) => (
                            <li key={ev.id}>
                                <button
                                    type="button"
                                    onClick={() => openDetail(ev.id)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-left active:scale-[0.99] transition shadow-sm"
                                    style={{ minHeight: 92 }}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOTS[ev.severity]}`}
                                            aria-label={`Gravité ${SEVERITY_LABELS[ev.severity]}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                {ev.reference && (
                                                    <span className="text-[11px] font-mono font-semibold text-slate-700">
                                                        {ev.reference}
                                                    </span>
                                                )}
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${TYPE_BADGE[ev.type]}`}
                                                >
                                                    {TYPE_LABELS[ev.type] ?? ev.type}
                                                </span>
                                            </div>
                                            {ev.title && (
                                                <h3
                                                    className="text-[13.5px] font-semibold text-slate-900 leading-tight truncate"
                                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                                >
                                                    {ev.title}
                                                </h3>
                                            )}
                                            <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                                <span className="text-[11px] text-slate-600">
                                                    {SEVERITY_LABELS[ev.severity]}
                                                </span>
                                                <span className="text-slate-300">·</span>
                                                <span
                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-medium ${STATUS_TONE[ev.status]}`}
                                                >
                                                    {STATUS_LABELS[ev.status] ?? ev.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5">
                                                <IconCalendarStats size={11} stroke={1.7} />
                                                {formatEventDate(ev.occurredAt)}
                                            </div>
                                        </div>
                                        <IconChevronRight size={16} stroke={1.8} className="text-slate-300 mt-1.5 flex-shrink-0" />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* FAB — nouvelle déclaration (positionné au-dessus de la bottom nav) */}
            <button
                type="button"
                onClick={openDeclare}
                aria-label="Déclarer un nouvel événement"
                className="fixed right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-pink-600 to-rose-700 text-white shadow-lg active:scale-95 transition flex items-center justify-center"
                style={{
                    bottom: 'calc(env(safe-area-inset-bottom, 0) + 80px)',
                }}
            >
                <IconPlus size={26} stroke={2.2} />
            </button>
        </>
    );
}
