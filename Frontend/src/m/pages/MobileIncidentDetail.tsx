/**
 * MobileIncidentDetail — Vue détail d'un incident déclaré.
 *
 * Affiche le type, la gravité, la description, la photo (si présente),
 * le déclarant, la date, le statut de traitement. Accessible depuis
 * MobileIncidentsHistory ou par deep link depuis une notification push.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconArrowLeft,
    IconAlertOctagon,
    IconCalendarStats,
    IconUser,
    IconMapPin,
    IconCircleCheck,
    IconClockHour4,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

interface IncidentDetail {
    id: number;
    reference?: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    declaredAt: string;
    declarantName?: string;
    location?: string;
    photoUrl?: string;
    status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
    investigatorName?: string;
    resolutionNotes?: string;
    resolvedAt?: string;
}

const TYPE_LABELS: Record<string, string> = {
    NEAR_MISS: 'Presqu\'accident',
    INJURY: 'Blessure',
    PROPERTY: 'Dommage matériel',
    ENVIRONMENTAL: 'Environnement',
};

const SEVERITY_TONES: Record<IncidentDetail['severity'], string> = {
    LOW: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    MEDIUM: 'bg-amber-50 border-amber-200 text-amber-800',
    HIGH: 'bg-orange-50 border-orange-200 text-orange-800',
    CRITICAL: 'bg-rose-50 border-rose-300 text-rose-800',
};

const STATUS_LABELS: Record<NonNullable<IncidentDetail['status']>, { txt: string; tone: string }> = {
    OPEN: { txt: 'Ouvert', tone: 'bg-rose-50 border-rose-200 text-rose-800' },
    IN_REVIEW: { txt: 'En analyse', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
    RESOLVED: { txt: 'Résolu', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    CLOSED: { txt: 'Clôturé', tone: 'bg-slate-50 border-slate-200 text-slate-700' },
};

export default function MobileIncidentDetail() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [incident, setIncident] = useState<IncidentDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<IncidentDetail>({
                    endpoint: `/hns/incidents/findbyid/${id}`,
                    cacheStore: 'inspectionCache', // partage le store cache
                    cacheKey: Number(id),
                    ttlMs: 60 * 60 * 1000,
                });
                if (!cancelled) setIncident(res.data);
            } catch (_e) {
                if (!cancelled) {
                    setError('Détail indisponible. Vérifiez votre connexion.');
                }
            }
        })();
        return () => { cancelled = true; };
    }, [id, userId]);

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

    const sevTone = SEVERITY_TONES[incident.severity];
    const statusLabel = incident.status ? STATUS_LABELS[incident.status] : null;

    return (
        <>
            <MobileTopBar
                title={incident.reference ?? `Incident #${incident.id}`}
                subtitle={TYPE_LABELS[incident.type] ?? incident.type}
                accent="#B45309"
                onBack={() => navigate(-1)}
            />
            <section className="px-4 pt-4 space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${sevTone}`}>
                            Gravité {incident.severity === 'LOW' && 'faible'}
                            {incident.severity === 'MEDIUM' && 'moyenne'}
                            {incident.severity === 'HIGH' && 'élevée'}
                            {incident.severity === 'CRITICAL' && 'critique'}
                        </span>
                        {statusLabel && (
                            <span className={`text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${statusLabel.tone}`}>
                                {statusLabel.txt}
                            </span>
                        )}
                    </div>
                    <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {incident.description}
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                    <h3 className="text-[11px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                        Informations
                    </h3>
                    <dl className="space-y-2 text-[12.5px]">
                        <div className="flex items-start gap-2">
                            <IconCalendarStats size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <dt className="text-slate-500">Déclaration</dt>
                                <dd className="text-slate-800">
                                    {new Date(incident.declaredAt).toLocaleString('fr-FR', {
                                        dateStyle: 'long',
                                        timeStyle: 'short',
                                    })}
                                </dd>
                            </div>
                        </div>
                        {incident.declarantName && (
                            <div className="flex items-start gap-2">
                                <IconUser size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Déclarant</dt>
                                    <dd className="text-slate-800">{incident.declarantName}</dd>
                                </div>
                            </div>
                        )}
                        {incident.location && (
                            <div className="flex items-start gap-2">
                                <IconMapPin size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Lieu</dt>
                                    <dd className="text-slate-800">{incident.location}</dd>
                                </div>
                            </div>
                        )}
                    </dl>
                </div>

                {incident.photoUrl && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                        <h3 className="text-[11px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                            Photo preuve
                        </h3>
                        <img
                            src={incident.photoUrl}
                            alt="Preuve photo"
                            className="w-full rounded-lg border border-slate-200"
                            loading="lazy"
                        />
                    </div>
                )}

                {(incident.investigatorName || incident.resolutionNotes) && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                        <h3 className="text-[11px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                            Traitement
                        </h3>
                        {incident.investigatorName && (
                            <div className="flex items-start gap-2 text-[12.5px] mb-2">
                                <IconUser size={14} stroke={1.7} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <dt className="text-slate-500">Enquêteur</dt>
                                    <dd className="text-slate-800">{incident.investigatorName}</dd>
                                </div>
                            </div>
                        )}
                        {incident.resolutionNotes && (
                            <div className="text-[12.5px] text-slate-700 whitespace-pre-wrap">
                                {incident.resolutionNotes}
                            </div>
                        )}
                        {incident.resolvedAt && (
                            <div className="flex items-center gap-1.5 text-[11.5px] text-emerald-700 mt-2">
                                <IconCircleCheck size={12} stroke={1.8} />
                                Résolu le {new Date(incident.resolvedAt).toLocaleDateString('fr-FR')}
                            </div>
                        )}
                    </div>
                )}

                {!incident.status && (
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
