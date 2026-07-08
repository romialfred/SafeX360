/**
 * MobilePpeCatalog — Catalogue des EPI actifs (lecture terrain).
 *
 * Source : GET /hns/ppe/getActive (PpeDTO). Signale les stocks bas
 * (stock <= minStock) pour que le terrain anticipe ses demandes.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconShieldHalf, IconClipboardPlus } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileChip, MobileEmptyState, MobileErrorState, MobileListItem, MobileStaleBanner, MobileSection,
} from '../components/MobileUI';

interface PpeDTO {
    id: number;
    name: string;
    category?: string | null;
    description?: string | null;
    minStock?: number | null;
    stock?: number | null;
    certificationStandard?: string | null;
    status?: string;
}

export default function MobilePpeCatalog() {
    useStatusBarColor('#059669', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<PpeDTO[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<PpeDTO[]>({
                    endpoint: '/hns/ppe/getActive',
                    cacheStore: 'inspectionCache',
                    cacheKey: `ppe-catalog-${companyId}`,
                    ttlMs: 5 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger le catalogue EPI.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchData, [fetchData]);

    return (
        <>
            <MobileTopBar title="Catalogue EPI" subtitle="Équipements de protection" accent="#059669" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <MobileSection
                title="Équipements disponibles"
                action={(
                    <button
                        type="button"
                        onClick={() => { haptic('light'); navigate('/m/ppe/requests'); }}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700"
                        style={{ minHeight: 44 }}
                    >
                        <IconClipboardPlus size={14} stroke={2} /> Mes demandes
                    </button>
                )}
            >
                <div className="space-y-2.5">
                    {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                    {!items && !error && <ListSkeleton count={6} />}
                    {items && items.length === 0 && !error && (
                        <MobileEmptyState
                            icon={<IconShieldHalf size={24} stroke={1.6} className="text-slate-400" />}
                            title="Aucun EPI au catalogue"
                            hint="Les équipements actifs apparaîtront ici."
                        />
                    )}
                    {items && items.map((ppe) => {
                        const low = ppe.minStock != null && ppe.stock != null && ppe.stock <= ppe.minStock;
                        return (
                            <MobileListItem
                                key={ppe.id}
                                title={ppe.name}
                                subtitle={ppe.category ?? ppe.description ?? null}
                                onClick={() => { haptic('light'); navigate('/m/ppe/requests/new'); }}
                                chips={(
                                    <>
                                        {low
                                            ? <MobileChip tone="rose">Stock bas · {ppe.stock}</MobileChip>
                                            : <MobileChip tone="emerald">En stock · {ppe.stock ?? '—'}</MobileChip>}
                                        {ppe.certificationStandard && <MobileChip tone="slate">{ppe.certificationStandard}</MobileChip>}
                                    </>
                                )}
                            />
                        );
                    })}
                </div>
            </MobileSection>
        </>
    );
}
