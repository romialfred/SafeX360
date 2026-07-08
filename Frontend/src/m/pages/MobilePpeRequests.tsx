/**
 * MobilePpeRequests — Mes demandes d'EPI (suivi terrain).
 *
 * Source : GET /hns/ppe-request/getAll, filtré côté client sur les
 * demandes où je figure (empIds) — le backend n'expose pas de
 * variante « by-employee ». Statuts PENDING/APPROVED/REJECTED.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconClipboardPlus, IconCalendarStats } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileButton, MobileChip, MobileEmptyState, MobileErrorState, MobileListItem,
    MobileStaleBanner, MobileSection, ChipTone,
} from '../components/MobileUI';

interface PpeRequestDTO {
    id: number;
    empIds?: Array<number | string>;
    ppeIds?: Array<number | string>;
    desiredDate?: string | null;
    priority?: string | null;
    reason?: string | null;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
}

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    PENDING: { label: 'En attente', tone: 'violet' },
    APPROVED: { label: 'Approuvée', tone: 'emerald' },
    REJECTED: { label: 'Rejetée', tone: 'rose' },
};

const PRIORITY_META: Record<string, { label: string; tone: ChipTone }> = {
    High: { label: 'Priorité élevée', tone: 'rose' },
    Medium: { label: 'Priorité moyenne', tone: 'amber' },
    Low: { label: 'Priorité faible', tone: 'emerald' },
};

export default function MobilePpeRequests() {
    useStatusBarColor('#059669', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.empId ?? user?.id ?? 0);

    const [items, setItems] = useState<PpeRequestDTO[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<PpeRequestDTO[]>({
                    endpoint: '/hns/ppe-request/getAll',
                    cacheStore: 'inspectionCache',
                    cacheKey: `ppe-requests-${userId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) {
                    const all = Array.isArray(res.data) ? res.data : [];
                    const mine = all.filter((r) => (r.empIds ?? []).map(Number).includes(userId));
                    setItems(mine);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger vos demandes d\'EPI.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    useEffect(fetchData, [fetchData]);

    return (
        <>
            <MobileTopBar title="Mes demandes EPI" subtitle="Dotation personnelle" accent="#059669" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-3">
                <MobileButton
                    accent="#059669"
                    icon={<IconClipboardPlus size={16} stroke={2} />}
                    onClick={() => { haptic('light'); navigate('/m/ppe/requests/new'); }}
                >
                    Nouvelle demande
                </MobileButton>
            </div>

            <MobileSection title="Historique de mes demandes">
                <div className="space-y-2.5">
                    {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                    {!items && !error && <ListSkeleton count={4} />}
                    {items && items.length === 0 && !error && (
                        <MobileEmptyState
                            title="Aucune demande"
                            hint="Vos demandes d'équipement apparaîtront ici."
                        />
                    )}
                    {items && items.map((req) => {
                        const st = STATUS_META[String(req.status ?? '').toUpperCase()] ?? { label: req.status || '—', tone: 'slate' as ChipTone };
                        const prio = PRIORITY_META[String(req.priority ?? '')];
                        return (
                            <MobileListItem
                                key={req.id}
                                title={req.reason || `Demande #${req.id}`}
                                subtitle={`${(req.ppeIds ?? []).length} équipement(s) demandé(s)`}
                                chips={(
                                    <>
                                        <MobileChip tone={st.tone}>{st.label}</MobileChip>
                                        {prio && <MobileChip tone={prio.tone}>{prio.label}</MobileChip>}
                                    </>
                                )}
                                meta={req.desiredDate ? (
                                    <span className="flex items-center gap-1.5">
                                        <IconCalendarStats size={11} stroke={1.7} />
                                        Souhaitée le {new Date(req.desiredDate).toLocaleDateString('fr-FR')}
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
