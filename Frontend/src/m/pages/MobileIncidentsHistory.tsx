/**
 * MobileIncidentsHistory — Historique des incidents déclarés par
 * l'utilisateur courant. Liste compacte avec filtre par statut + tap
 * pour ouvrir le détail.
 *
 * Aligné sur la projection réduite renvoyée par GET /hns/incidents/getAll
 * (IncidentRepository.findAllIncidentsWithMaxSeverity) : id, title,
 * departmentId, incidentDate, reporterId, source, aiConfidence, status,
 * maxSeverityLevel, severityLevelName, incidentCategoryName.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconArrowLeft,
    IconAlertOctagon,
    IconChevronRight,
    IconCalendarStats,
    IconRefresh,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

/** Statuts réels de l'enum backend IncidentStatus (Health-Safety). */
type IncidentStatusKey =
    | 'PENDING'
    | 'REPORTED'
    | 'INVESTIGATION'
    | 'INVESTIGATION_COMPLETED'
    | 'CORRECTIVE_ACTIONS'
    | 'CLOSED'
    | 'REJECTED';

/** Projection réduite de /hns/incidents/getAll. Certains champs peuvent être null. */
interface IncidentSummary {
    id: number;
    title?: string | null;
    departmentId?: number | null;
    incidentDate?: string | null;
    reporterId?: number | null;
    /** "EMPLOYEE" (saisie directe) ou "AI" (wizard Déclaration par IA). */
    source?: string | null;
    aiConfidence?: number | null;
    status?: IncidentStatusKey | string | null;
    maxSeverityLevel?: number | null;
    severityLevelName?: string | null;
    incidentCategoryName?: string | null;
}

/** Filtres alignés sur les statuts réels du backend (libellés FR).
 *  'UNKNOWN' = statut NULL en base (anciennes déclarations mobiles sans status),
 *  rangé avec les « Déclarés ». */
const FILTERS: { key: string; label: string; statuses: (IncidentStatusKey | 'UNKNOWN')[] | null }[] = [
    { key: 'ALL', label: 'Tous', statuses: null },
    { key: 'PENDING', label: 'En attente', statuses: ['PENDING'] },
    { key: 'REPORTED', label: 'Déclarés', statuses: ['REPORTED', 'UNKNOWN'] },
    { key: 'IN_PROGRESS', label: 'En cours', statuses: ['INVESTIGATION', 'INVESTIGATION_COMPLETED', 'CORRECTIVE_ACTIONS'] },
    { key: 'CLOSED', label: 'Clôturés', statuses: ['CLOSED'] },
    { key: 'REJECTED', label: 'Rejetés', statuses: ['REJECTED'] },
];

/** Charte statuts R7 : violet=attente, cyan=étape franchie, amber=en cours, emerald=clôturé, rose=rejeté. */
const STATUS_BADGES: Record<string, { txt: string; tone: string }> = {
    PENDING: { txt: 'En attente', tone: 'bg-violet-50 border-violet-200 text-violet-800' },
    REPORTED: { txt: 'Déclaré', tone: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    /** Repli statut NULL/inconnu : l'incident existe donc il a été déclaré. */
    UNKNOWN: { txt: 'Déclaré', tone: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    INVESTIGATION: { txt: 'Enquête', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
    INVESTIGATION_COMPLETED: { txt: 'Enquête terminée', tone: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    CORRECTIVE_ACTIONS: { txt: 'Actions correctives', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
    CLOSED: { txt: 'Clôturé', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    REJECTED: { txt: 'Rejeté', tone: 'bg-rose-50 border-rose-200 text-rose-800' },
};

/** Pastille gravité selon maxSeverityLevel (1=faible … 5=critique) ; gris si inconnue. */
function severityDot(level?: number | null): string {
    if (level == null) return 'bg-slate-300';
    if (level >= 4) return 'bg-rose-600';
    if (level === 3) return 'bg-orange-500';
    if (level === 2) return 'bg-amber-500';
    return 'bg-emerald-500';
}

/** Formate une date ISO backend ; '—' si absente ou invalide. */
function formatIncidentDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Timestamp de tri robuste (0 si date absente ou invalide). */
function toTime(value?: string | null): number {
    if (!value) return 0;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
}

export default function MobileIncidentsHistory() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    // Priorité empId : l'identifiant employé est celui stocké dans reporter_id côté HNS.
    const userId = Number(user?.empId ?? user?.id ?? user?.userId ?? user?.sub ?? 0);

    const [items, setItems] = useState<IncidentSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('ALL');

    const fetchHistory = useCallback(() => {
        setError(null);
        if (!userId) {
            // Pas de skeleton infini : sans identité, état d'erreur actionnable.
            setItems([]);
            setError('Utilisateur non identifié. Reconnectez-vous puis réessayez.');
            return;
        }
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                // « /findbyreporter » n'existe pas côté backend (404) : on liste tout
                // puis on filtre localement sur le déclarant (reporterId).
                const res = await getCached<IncidentSummary[]>({
                    endpoint: '/hns/incidents/getAll',
                    cacheStore: 'inspectionCache',
                    cacheKey: `incidents-${userId}`,
                    ttlMs: 30 * 60 * 1000,
                });
                if (!cancelled) {
                    const mine = (Array.isArray(res.data) ? res.data : []).filter(
                        (i) => Number(i.reporterId ?? -1) === userId
                    );
                    const sorted = mine.slice().sort(
                        (a, b) => toTime(b.incidentDate) - toTime(a.incidentDate)
                    );
                    setItems(sorted);
                }
            } catch (_e) {
                if (!cancelled) {
                    setError('Historique indisponible. Vérifiez votre connexion.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    useEffect(fetchHistory, [fetchHistory]);

    const filtered = useMemo(() => {
        if (!items) return [];
        const statuses = FILTERS.find((f) => f.key === filter)?.statuses;
        if (!statuses) return items;
        return items.filter((i) => (statuses as string[]).includes(i.status ?? ''));
    }, [items, filter]);

    return (
        <>
            <MobileTopBar
                title="Mes signalements"
                subtitle="Historique de mes déclarations"
                accent="#B45309"
                onBack={() => navigate(-1)}
            />
            <section className="px-4 pt-3">
                {/* Filtre segmenté */}
                <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-1 px-1 pb-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            aria-pressed={filter === f.key}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 border transition ${
                                filter === f.key
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                            style={{ minHeight: 44 }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px] rounded-xl p-3 mb-3 flex items-center gap-2">
                        <IconAlertOctagon size={14} stroke={1.8} className="flex-shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={fetchHistory}
                            aria-label="Réessayer le chargement"
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-medium flex-shrink-0 inline-flex items-center justify-center gap-1"
                            style={{ minHeight: 44 }}
                        >
                            <IconRefresh size={12} stroke={2} /> Réessayer
                        </button>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {items && !error && filtered.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <IconAlertOctagon size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            {filter === 'ALL'
                                ? 'Aucun signalement enregistré'
                                : 'Aucun signalement dans cette catégorie'}
                        </p>
                        <p className="text-[12.5px] text-slate-500 mb-4">
                            Une situation HSE inhabituelle ? Signalez-la depuis l'accueil.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/m/incident/new')}
                            className="px-4 py-2 rounded-lg bg-amber-700 text-white text-[13px] font-medium"
                            style={{ minHeight: 44 }}
                        >
                            Nouveau signalement
                        </button>
                    </div>
                )}

                {items && filtered.length > 0 && (
                    <ul className="space-y-2">
                        {filtered.map((inc) => {
                            // Repli 'UNKNOWN' : statut NULL ou hors enum → badge « Déclaré ».
                            const badge = STATUS_BADGES[inc.status ?? 'UNKNOWN'] ?? STATUS_BADGES.UNKNOWN;
                            return (
                                <li key={inc.id}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/m/incident/${inc.id}`)}
                                        aria-label={`Ouvrir le détail de l'incident ${inc.title ?? inc.id}`}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-left active:bg-slate-50"
                                        style={{ minHeight: 64 }}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${severityDot(inc.maxSeverityLevel)}`}
                                                aria-label={`Gravité ${inc.severityLevelName
                                                    ?? (inc.maxSeverityLevel != null ? `niveau ${inc.maxSeverityLevel}` : 'inconnue')}`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                                                        {inc.title ?? 'Incident sans titre'}
                                                    </span>
                                                    {badge && (
                                                        <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-full border ${badge.tone}`}>
                                                            {badge.txt}
                                                        </span>
                                                    )}
                                                </div>
                                                {(inc.incidentCategoryName || inc.severityLevelName) && (
                                                    <p className="text-[12px] text-slate-600 line-clamp-1 mt-0.5">
                                                        {[inc.incidentCategoryName, inc.severityLevelName]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                                    <IconCalendarStats size={11} stroke={1.7} />
                                                    {formatIncidentDate(inc.incidentDate)}
                                                </div>
                                            </div>
                                            <IconChevronRight size={14} stroke={1.8} className="text-slate-300 mt-1.5 flex-shrink-0" />
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/m/profile')}
                    className="w-full mt-5 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-[13px]"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Retour
                </button>
            </section>
        </>
    );
}
