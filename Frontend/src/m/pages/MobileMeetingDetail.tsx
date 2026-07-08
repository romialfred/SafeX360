/**
 * MobileMeetingDetail — Fiche d'une réunion sécurité / tournée leadership.
 * Source : GET /hns/hs-activity/get/{id} — DTO complet, même endpoint que le
 * détail web (getInfo/{id} ne renvoie qu'un résumé pour les actions correctives).
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
    PENDING: { label: 'Planifiée', tone: 'cyan' },
    IN_PROGRESS: { label: 'En cours', tone: 'amber' },
    COMPLETED: { label: 'Réalisée', tone: 'emerald' },
    CANCELLED: { label: 'Annulée', tone: 'rose' },
};

const TYPE_LABEL: Record<string, string> = {
    HSM: 'Réunion santé-sécurité',
    ST: 'Tournée leadership',
};

export default function MobileMeetingDetail() {
    useStatusBarColor('#059669', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();

    const [meeting, setMeeting] = useState<any | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setMeeting(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any>({
                    endpoint: `/hns/hs-activity/get/${id}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `meeting-${id}`,
                    ttlMs: 5 * 60 * 1000,
                });
                if (!cancelled) {
                    const data = res.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        setMeeting(data);
                        setStale(res.stale);
                    } else setError('Réunion introuvable.');
                }
            } catch {
                if (!cancelled) setError('Impossible de charger cette réunion.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const statusUpper = String(meeting?.status ?? '').toUpperCase();
    const st = STATUS_META[statusUpper] ?? { label: meeting?.status || '—', tone: 'slate' as ChipTone };
    const participants = Array.isArray(meeting?.participants) ? meeting.participants.length : (meeting?.participantsCount ?? null);

    return (
        <>
            <MobileTopBar title="Réunion sécurité" subtitle="Activités HSE" accent="#059669" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!meeting && !error && <CardSkeleton />}

                {meeting && (
                    <>
                        <MobileCard>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <MobileChip tone={st.tone}>{st.label}</MobileChip>
                                {meeting.type && <MobileChip tone="teal">{TYPE_LABEL[String(meeting.type)] ?? meeting.type}</MobileChip>}
                            </div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {meeting.title || `Réunion #${meeting.id ?? id}`}
                            </h1>
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow
                                label="Date"
                                value={meeting.plannedDate ? new Date(meeting.plannedDate).toLocaleDateString('fr-FR') : '—'}
                            />
                            <MobileDetailRow
                                label="Horaires"
                                value={[meeting.startTime, meeting.endTime].filter(Boolean).join(' → ') || '—'}
                            />
                            {/* HsActivityDetails backend : location (string), pas d'animateur dans le DTO */}
                            <MobileDetailRow label="Lieu" value={meeting.location ?? meeting.locationName ?? '—'} />
                            <MobileDetailRow label="Participants" value={participants != null ? `${participants}` : '—'} />
                            {Array.isArray(meeting.ppe) && meeting.ppe.length > 0 && (
                                <MobileDetailRow label="EPI requis" value={meeting.ppe.join(' · ')} />
                            )}
                        </MobileCard>

                        {(meeting.objectives || meeting.description || meeting.agenda) && (
                            <MobileSection title="Ordre du jour">
                                <MobileCard>
                                    <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {toPlainText(meeting.objectives ?? meeting.description ?? meeting.agenda)}
                                    </p>
                                </MobileCard>
                            </MobileSection>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
