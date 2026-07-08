/**
 * MobileErrorEventDetail — Fiche d'un événement erreur (Just Culture).
 * Sources : GET /hns/error/events/{id} et GET /hns/error/events/{id}/history.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileErrorState, MobileSection, MobileStaleBanner, ChipTone, SERIF, toPlainText,
} from '../components/MobileUI';

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    DECLARED: { label: 'Déclaré', tone: 'slate' },
    TRIAGED: { label: 'Trié', tone: 'sky' },
    ANALYZING: { label: 'En analyse', tone: 'violet' },
    ACTION_PLAN: { label: 'Plan d\'action', tone: 'cyan' },
    IMPLEMENTING: { label: 'Mise en œuvre', tone: 'amber' },
    VERIFYING: { label: 'Vérification', tone: 'violet' },
    CLOSED: { label: 'Clôturé', tone: 'emerald' },
    CAPITALIZED: { label: 'Capitalisé', tone: 'teal' },
    REOPENED: { label: 'Réouvert', tone: 'orange' },
};

const CRITICALITY_META: Record<string, { label: string; tone: ChipTone }> = {
    LOW: { label: 'Faible', tone: 'emerald' },
    MEDIUM: { label: 'Modérée', tone: 'amber' },
    HIGH: { label: 'Élevée', tone: 'orange' },
    CRITICAL: { label: 'Critique', tone: 'rose' },
};

const MODULE_LABEL: Record<string, string> = {
    MANUAL: 'Déclaration manuelle',
    EMERGENCY: 'Urgences',
    BLAST: 'Dynamitage',
    DOSIMETRY: 'Dosimétrie',
};

export default function MobileErrorEventDetail() {
    useStatusBarColor('#BE185D', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();

    const [event, setEvent] = useState<any | null>(null);
    const [history, setHistory] = useState<any[] | null>(null);
    const [eventTypes, setEventTypes] = useState<any[]>([]);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setEvent(null);
        setHistory(null);
        let cancelled = false;
        (async () => {
            try {
                const [evRes, histRes, typesRes] = await Promise.all([
                    getCached<any>({
                        endpoint: `/hns/error/events/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `error-event-${id}`,
                        ttlMs: 3 * 60 * 1000,
                    }),
                    getCached<any[]>({
                        endpoint: `/hns/error/events/${id}/history`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `error-history-${id}`,
                        ttlMs: 3 * 60 * 1000,
                    }).catch(() => null),
                    // Référentiel des types : le DTO événement ne porte qu'un eventTypeId
                    getCached<any[]>({
                        endpoint: '/hns/error/referentials/event-types',
                        cacheStore: 'inspectionCache',
                        cacheKey: 'error-event-types',
                        ttlMs: 30 * 60 * 1000,
                    }).catch(() => null),
                ]);
                if (!cancelled) {
                    const data = evRes.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        setEvent(data);
                        setHistory(Array.isArray(histRes?.data) ? histRes!.data : []);
                        setEventTypes(Array.isArray(typesRes?.data) ? typesRes!.data : []);
                        setStale(evRes.stale);
                    } else {
                        setError('Événement introuvable.');
                    }
                }
            } catch {
                if (!cancelled) setError('Impossible de charger cet événement.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const st = STATUS_META[String(event?.status ?? '').toUpperCase()] ?? { label: event?.status || '—', tone: 'slate' as ChipTone };
    const crit = CRITICALITY_META[String(event?.criticality ?? event?.criticalityLevel ?? '').toUpperCase()];
    const eventTypeLabel = event?.eventTypeId != null
        ? (eventTypes.find((t) => t.id === event.eventTypeId)?.label ?? `Type #${event.eventTypeId}`)
        : '—';

    return (
        <>
            <MobileTopBar title="Événement erreur" subtitle="Just Culture" accent="#BE185D" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!event && !error && <CardSkeleton />}

                {event && (
                    <>
                        <MobileCard>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <MobileChip tone={st.tone}>{st.label}</MobileChip>
                                {crit && <MobileChip tone={crit.tone}>Criticité {crit.label.toLowerCase()}</MobileChip>}
                            </div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {event.title || `Événement #${event.id ?? id}`}
                            </h1>
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow label="Module source" value={MODULE_LABEL[String(event.sourceModule ?? '').toUpperCase()] ?? event.sourceModule ?? '—'} />
                            <MobileDetailRow label="Type d'événement" value={eventTypeLabel} />
                            <MobileDetailRow
                                label="Survenu le"
                                value={event.occurredAt ? new Date(event.occurredAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            />
                        </MobileCard>

                        {event.description && (
                            <MobileSection title="Description">
                                <MobileCard>
                                    <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">{toPlainText(event.description)}</p>
                                </MobileCard>
                            </MobileSection>
                        )}

                        <MobileSection title="Historique du workflow">
                            <MobileCard>
                                {(history ?? []).length === 0 && (
                                    <p className="text-[12.5px] text-slate-500">Aucune transition enregistrée.</p>
                                )}
                                <ul className="space-y-2">
                                    {(history ?? []).map((h, idx) => {
                                        const from = STATUS_META[String(h.fromStatus ?? '').toUpperCase()]?.label ?? h.fromStatus ?? '—';
                                        const to = STATUS_META[String(h.toStatus ?? '').toUpperCase()]?.label ?? h.toStatus ?? '—';
                                        return (
                                            <li key={h.id ?? idx} className="flex items-start gap-2.5">
                                                <span className="w-2 h-2 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] text-slate-800">{from} → <span className="font-semibold">{to}</span></p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {h.timestamp ? new Date(h.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                        {h.actorLabel ? ` · ${h.actorLabel}` : (h.actorId != null ? ` · Utilisateur #${h.actorId}` : '')}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </MobileCard>
                        </MobileSection>
                    </>
                )}
            </div>
        </>
    );
}
