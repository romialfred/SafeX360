/**
 * MobileCommunicationsList — Communications & consignes sécurité.
 *
 * Source : GET /hns/communications/recent?limit=30. Le terrain lit les
 * messages diffusés (consignes, sensibilisation) ; tap = détail complet.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSpeakerphone, IconCalendarStats } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileChip, MobileEmptyState, MobileErrorState, MobileListItem, MobileStaleBanner, MobileSection, ChipTone,
} from '../components/MobileUI';

interface CommunicationDTO {
    id: number;
    title?: string | null;
    content?: string | null;
    urgency?: string | null;
    status?: string | null;
    senderName?: string | null;
    sender?: string | null;
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

export default function MobileCommunicationsList() {
    useStatusBarColor('#0369A1', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<CommunicationDTO[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<CommunicationDTO[]>({
                    endpoint: '/hns/communications/recent?limit=30',
                    cacheStore: 'inspectionCache',
                    cacheKey: `communications-${companyId}`,
                    ttlMs: 3 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les communications.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchData, [fetchData]);

    const openDetail = (comm: CommunicationDTO) => {
        haptic('light');
        navigate(`/m/communications/${comm.id}`);
    };

    return (
        <>
            <MobileTopBar title="Communications" subtitle="Consignes et messages sécurité" accent="#0369A1" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <MobileSection title="Messages récents">
                <div className="space-y-2.5">
                    {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                    {!items && !error && <ListSkeleton count={6} />}
                    {items && items.length === 0 && !error && (
                        <MobileEmptyState
                            icon={<IconSpeakerphone size={24} stroke={1.6} className="text-slate-400" />}
                            title="Aucune communication"
                            hint="Les messages diffusés apparaîtront ici."
                        />
                    )}
                    {items && items.map((comm) => {
                        const urg = URGENCY_META[String(comm.urgency ?? '').toUpperCase()];
                        const when = comm.scheduledAt ?? comm.createdAt;
                        return (
                            <MobileListItem
                                key={comm.id}
                                title={comm.title || `Message #${comm.id}`}
                                subtitle={comm.senderName ?? comm.sender ?? null}
                                onClick={() => openDetail(comm)}
                                chips={urg ? <MobileChip tone={urg.tone}>{urg.label}</MobileChip> : undefined}
                                meta={when ? (
                                    <span className="flex items-center gap-1.5">
                                        <IconCalendarStats size={11} stroke={1.7} />
                                        {new Date(when).toLocaleDateString('fr-FR')}
                                    </span>
                                ) : undefined}
                            />
                        );
                    })}
                </div>
            </MobileSection>
        </>
    );
}
