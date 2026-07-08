/**
 * MobileCommunicationDetail — Lecture d'une communication sécurité.
 *
 * Source : GET /hns/communications/get/{id}. Le contenu peut être du HTML
 * (éditeur riche web) : on l'aplatit en texte via DOMParser — jamais de
 * dangerouslySetInnerHTML côté mobile.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileErrorState, MobileSection, MobileStaleBanner, ChipTone, SERIF,
} from '../components/MobileUI';

interface CommunicationDetail {
    id: number;
    title?: string | null;
    content?: string | null;
    urgency?: string | null;
    status?: string | null;
    senderName?: string | null;
    sender?: string | null;
    departmentName?: string | null;
    createdAt?: string | null;
    scheduledAt?: string | null;
}

const URGENCY_META: Record<string, { label: string; tone: ChipTone }> = {
    URGENT: { label: 'Urgent', tone: 'rose' },
    CRITICAL: { label: 'Critique', tone: 'rose' },
    HIGH: { label: 'Priorité haute', tone: 'orange' },
    MEDIUM: { label: 'Priorité moyenne', tone: 'amber' },
    NORMAL: { label: 'Normal', tone: 'slate' },
    LOW: { label: 'Information', tone: 'slate' },
};

/** Aplatis un éventuel HTML riche en texte lisible (aucune exécution). */
const toPlainText = (value?: string | null): string => {
    if (!value) return '';
    if (!value.includes('<')) return value;
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return doc.body.textContent ?? '';
};

export default function MobileCommunicationDetail() {
    useStatusBarColor('#0369A1', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();

    const [comm, setComm] = useState<CommunicationDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setComm(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<CommunicationDetail>({
                    endpoint: `/hns/communications/get/${id}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `communication-${id}`,
                    ttlMs: 10 * 60 * 1000,
                });
                if (!cancelled) {
                    const data: any = res.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        setComm(data);
                        setStale(res.stale);
                    } else {
                        setError('Communication introuvable.');
                    }
                }
            } catch {
                if (!cancelled) setError('Impossible de charger cette communication.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const urg = comm ? URGENCY_META[String(comm.urgency ?? '').toUpperCase()] : undefined;
    const body = toPlainText(comm?.content);

    return (
        <>
            <MobileTopBar title="Communication" subtitle="Message sécurité" accent="#0369A1" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!comm && !error && <CardSkeleton />}

                {comm && (
                    <>
                        <MobileCard>
                            {urg && <div className="mb-1.5"><MobileChip tone={urg.tone}>{urg.label}</MobileChip></div>}
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {comm.title || `Message #${comm.id}`}
                            </h1>
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow label="Émetteur" value={comm.senderName ?? comm.sender ?? '—'} />
                            <MobileDetailRow label="Département" value={comm.departmentName ?? 'Tous'} />
                            <MobileDetailRow
                                label="Date"
                                value={(comm.scheduledAt ?? comm.createdAt)
                                    ? new Date(comm.scheduledAt ?? comm.createdAt ?? '').toLocaleDateString('fr-FR')
                                    : '—'}
                            />
                        </MobileCard>

                        <MobileSection title="Message">
                            <MobileCard>
                                <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                                    {body || '—'}
                                </p>
                            </MobileCard>
                        </MobileSection>
                    </>
                )}
            </div>
        </>
    );
}
