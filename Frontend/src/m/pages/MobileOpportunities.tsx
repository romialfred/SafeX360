/**
 * MobileOpportunities — Opportunités SST (ISO 45001 · 6.1.2.3).
 * Source : GET /hns/risks/opportunities (lecture terrain).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBulb } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileChip, MobileEmptyState, MobileErrorState, MobileListItem, MobileStaleBanner, MobileSection, ChipTone, toPlainText,
} from '../components/MobileUI';

// Statuts réels backend : IDENTIFIED / EVALUATED / PLANNED / IN_PROGRESS /
// REALIZED / CLOSED (+ DISMISSED côté web)
const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    IDENTIFIED: { label: 'Identifiée', tone: 'sky' },
    EVALUATED: { label: 'Évaluée', tone: 'violet' },
    PLANNED: { label: 'Planifiée', tone: 'cyan' },
    IN_PROGRESS: { label: 'En cours', tone: 'amber' },
    REALIZED: { label: 'Réalisée', tone: 'emerald' },
    CLOSED: { label: 'Clôturée', tone: 'emerald' },
    DISMISSED: { label: 'Écartée', tone: 'slate' },
};

export default function MobileOpportunities() {
    useStatusBarColor('#0F766E', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any[]>({
                    endpoint: '/hns/risks/opportunities',
                    cacheStore: 'inspectionCache',
                    cacheKey: `opportunities-${companyId}`,
                    ttlMs: 5 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les opportunités.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchData, [fetchData]);

    return (
        <>
            <MobileTopBar title="Opportunités SST" subtitle="Améliorations ISO 45001" accent="#0F766E" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <MobileSection title="Registre des opportunités">
                <div className="space-y-2.5">
                    {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                    {!items && !error && <ListSkeleton count={5} />}
                    {items && items.length === 0 && !error && (
                        <MobileEmptyState
                            icon={<IconBulb size={24} stroke={1.6} className="text-slate-400" />}
                            title="Aucune opportunité"
                            hint="Les pistes d'amélioration SST apparaîtront ici."
                        />
                    )}
                    {items && items.map((op, idx) => {
                        const st = STATUS_META[String(op.status ?? '').toUpperCase()];
                        return (
                            <MobileListItem
                                key={op.id ?? idx}
                                title={op.title || `Opportunité #${op.id ?? idx + 1}`}
                                subtitle={toPlainText(op.description) || null}
                                chips={st ? <MobileChip tone={st.tone}>{st.label}</MobileChip> : undefined}
                            />
                        );
                    })}
                </div>
            </MobileSection>
        </>
    );
}
