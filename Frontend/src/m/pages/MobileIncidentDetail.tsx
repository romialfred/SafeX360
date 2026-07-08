/**
 * MobileIncidentDetail — Vue détail d'un incident déclaré.
 *
 * Consomme GET /hns/incidents/getDetails/{id} (projection IncidentResponse
 * enrichie : titre, numéro, lieu, dates, statut, gravité max, catégorie,
 * source/aiConfidence — champs affichés conditionnellement si null).
 * Accessible depuis MobileIncidentsHistory ou par deep link depuis
 * une notification push.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconArrowLeft,
    IconAlertOctagon,
    IconCalendarStats,
    IconCategory,
    IconClockHour4,
    IconHash,
    IconMapPin,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';

/** Statuts réels de l'enum backend IncidentStatus (Health-Safety). */
type IncidentStatusKey =
    | 'PENDING'
    | 'REPORTED'
    | 'INVESTIGATION'
    | 'INVESTIGATION_COMPLETED'
    | 'CORRECTIVE_ACTIONS'
    | 'CLOSED'
    | 'REJECTED';

/** Projection IncidentResponse (backend HNS). Certains champs peuvent être null. */
interface IncidentDetail {
    id: number;
    title?: string | null;
    location?: string | null;
    incidentDate?: string | null;
    discoveryDate?: string | null;
    status?: IncidentStatusKey | string | null;
    maxSeverityLevel?: number | null;
    severityLevelName?: string | null;
    incidentCategoryName?: string | null;
    number?: string | null;
    reporterId?: number | null;
    departmentId?: number | null;
    /** "EMPLOYEE" (saisie directe) ou "AI" (wizard Déclaration par IA). */
    source?: string | null;
    aiConfidence?: number | null;
}

/** Charte statuts R7 : violet=attente, cyan=étape franchie, amber=en cours, emerald=clôturé, rose=rejeté. */
const STATUS_LABELS: Record<string, { txt: string; tone: string }> = {
    PENDING: { txt: 'En attente', tone: 'bg-violet-50 border-violet-200 text-violet-800' },
    REPORTED: { txt: 'Déclaré', tone: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    /** Repli statut NULL/'UNKNOWN' : l'incident existe donc il a été déclaré. */
    UNKNOWN: { txt: 'Déclaré', tone: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    INVESTIGATION: { txt: 'Enquête en cours', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
    INVESTIGATION_COMPLETED: { txt: 'Enquête terminée', tone: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    CORRECTIVE_ACTIONS: { txt: 'Actions correctives', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
    CLOSED: { txt: 'Clôturé', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    REJECTED: { txt: 'Rejeté', tone: 'bg-rose-50 border-rose-200 text-rose-800' },
};

/** Ton du badge gravité selon le niveau (1=faible … 5=critique). */
function severityTone(level?: number | null): string {
    if (level == null) return 'bg-slate-50 border-slate-200 text-slate-700';
    if (level >= 4) return 'bg-rose-50 border-rose-300 text-rose-800';
    if (level === 3) return 'bg-orange-50 border-orange-200 text-orange-800';
    if (level === 2) return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-emerald-50 border-emerald-200 text-emerald-800';
}

/** Formate une date ISO backend ; '—' si absente ou invalide. */
function formatDateTime(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
}

export default function MobileIncidentDetail() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [incident, setIncident] = useState<IncidentDetail | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                // Endpoint réel : /hns/incidents/getDetails/{id} — « findbyid » n'existe pas (404).
                const res = await getCached<IncidentDetail>({
                    endpoint: `/hns/incidents/getDetails/${id}`,
                    cacheStore: 'inspectionCache', // partage le store cache
                    // Clé préfixée : Number(id) nu entrait en collision avec les
                    // autres entrées numériques du même store (inspections).
                    cacheKey: `incident-${id}`,
                    ttlMs: 60 * 60 * 1000,
                });
                if (!cancelled) {
                    setIncident(res.data);
                    setStale(res.stale);
                }
            } catch (_e) {
                if (!cancelled) {
                    setError('Détail indisponible. Vérifiez votre connexion.');
                }
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    if (error) {
        return (
            <>
                <MobileTopBar
                    title="Détail incident"
                    accent="#B45309"
                    onBack={() => navigate(-1)}
                />
                <section className="px-4 pt-8 text-center">
                    <IconAlertOctagon size={32} stroke={1.6} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-[13px] text-slate-700">{error}</p>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-[13px]"
                        style={{ minHeight: 44 }}
                    >
                        Retour
                    </button>
                </section>
            </>
        );
    }

    if (!incident) {
        return (
            <>
                <MobileTopBar
                    title="Détail incident"
                    accent="#B45309"
                    onBack={() => navigate(-1)}
                />
                <section className="px-4 pt-4 space-y-3">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </section>
            </>
        );
    }

    // Repli 'UNKNOWN' : statut NULL ou hors enum → badge « Déclaré ».
    const statusLabel = STATUS_LABELS[incident.status ?? 'UNKNOWN'] ?? STATUS_LABELS.UNKNOWN;
    const severityText = incident.severityLevelName
        ?? (incident.maxSeverityLevel != null ? `Niveau ${incident.maxSeverityLevel}` : null);

    return (
        <>
            <MobileTopBar
                title={incident.number ? `Incident ${incident.number}` : `Incident #${incident.id}`}
                subtitle={incident.incidentCategoryName ?? undefined}
                accent="#B45309"
                onBack={() => navigate(-1)}
            />
            {stale && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5">
                    Données du cache local — synchronisation au retour du réseau.
                </div>
            )}
            <section className="px-4 pt-4 space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        {statusLabel && (
                            <span className={`text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${statusLabel.tone}`}>
                                {statusLabel.txt}
                            </span>
                        )}
                        {severityText && (
                            <span className={`text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${severityTone(incident.maxSeverityLevel)}`}>
                                Gravité : {severityText}
                            </span>
                        )}
                        {incident.source === 'AI' && (
                            <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full border bg-indigo-50 border-indigo-200 text-indigo-800">
                                Déclaré via IA
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {incident.title ?? 'Incident sans titre'}
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                    <h3 className="text-[11px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                        Informations
                    </h3>
                    <dl className="space-y-2 text-[12.5px]">
                        <div className="flex items-start gap-2">
                            <IconHash size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <dt className="text-slate-500">N° incident</dt>
                                <dd className="text-slate-800">{incident.number ?? '—'}</dd>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <IconCalendarStats size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <dt className="text-slate-500">Date de l'incident</dt>
                                <dd className="text-slate-800">{formatDateTime(incident.incidentDate)}</dd>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <IconClockHour4 size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <dt className="text-slate-500">Date de découverte</dt>
                                <dd className="text-slate-800">{formatDateTime(incident.discoveryDate)}</dd>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <IconMapPin size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <dt className="text-slate-500">Lieu</dt>
                                <dd className="text-slate-800">{incident.location ?? '—'}</dd>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <IconCategory size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <dt className="text-slate-500">Catégorie</dt>
                                <dd className="text-slate-800">{incident.incidentCategoryName ?? '—'}</dd>
                            </div>
                        </div>
                    </dl>
                </div>

                {incident.status === 'PENDING' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-900 flex items-start gap-2">
                        <IconClockHour4 size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        En attente de prise en charge par le coordinateur HSE.
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-[13px]"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Retour
                </button>
            </section>
        </>
    );
}
