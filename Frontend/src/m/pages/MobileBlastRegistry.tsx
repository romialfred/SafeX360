/**
 * MobileBlastRegistry — Registre des tirs de mine (consultation terrain).
 *
 * Source : POST /hns/blast/search { mineId } via searchBlasts (BlastService).
 * Filtres par statut du cycle de vie, tap = détail du tir.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBomb, IconCalendarStats, IconMapPin } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useAppSelector } from '../../slices/hooks';
import { searchBlasts, BlastListItemDTO, BlastStatus } from '../../services/BlastService';
import { cacheGet, cachePut } from '../offline/db';
import {
    MobileChip, MobileEmptyState, MobileErrorState, MobileFilterBar, MobileListItem, MobileStaleBanner, ChipTone,
} from '../components/MobileUI';

type Filter = 'ALL' | 'PLANNED' | 'CONFIRMED' | 'FIRED' | 'ALL_CLEAR';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'PLANNED', label: 'Planifiés' },
    { key: 'CONFIRMED', label: 'Confirmés' },
    { key: 'FIRED', label: 'Tirés' },
    { key: 'ALL_CLEAR', label: 'Fin d\'alerte' },
];

const STATUS_META: Record<BlastStatus, { label: string; tone: ChipTone }> = {
    DRAFT: { label: 'Brouillon', tone: 'slate' },
    PLANNED: { label: 'Planifié', tone: 'cyan' },
    CONFIRMED: { label: 'Confirmé', tone: 'amber' },
    IMMINENT: { label: 'Imminent', tone: 'orange' },
    FIRED: { label: 'Tiré', tone: 'slate' },
    ALL_CLEAR: { label: 'Fin d\'alerte', tone: 'emerald' },
    MISFIRE: { label: 'Raté : verrouillé', tone: 'rose' },
    CANCELLED: { label: 'Annulé', tone: 'slate' },
    POSTPONED: { label: 'Reporté', tone: 'slate' },
};

export default function MobileBlastRegistry() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const mineId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<BlastListItemDTO[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);
    const [filter, setFilter] = useState<Filter>('ALL');

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        setStale(false);
        let cancelled = false;
        (async () => {
            // /hns/blast/search est un POST : getCached (GET only) ne s'applique
            // pas — on réplique sa stratégie réseau-d'abord + repli IndexedDB.
            const cacheKey = `registry-${mineId}`;
            try {
                const res = await searchBlasts({ mineId });
                if (!cancelled) {
                    const list = Array.isArray(res) ? res : [];
                    setItems(list);
                    void cachePut('blastCache', cacheKey, list, 10 * 60 * 1000);
                }
            } catch {
                if (cancelled) return;
                const cached = await cacheGet<BlastListItemDTO[]>('blastCache', cacheKey).catch(() => null);
                if (cancelled) return; // re-vérifié : l'await ci-dessus peut résoudre après démontage
                if (cached) {
                    setItems(cached);
                    setStale(true);
                } else {
                    setError('Impossible de charger le registre des tirs.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [mineId]);

    useEffect(fetchData, [fetchData]);

    const filtered = useMemo(() => {
        if (!items) return [];
        if (filter === 'ALL') return items;
        return items.filter((b) => b.status === filter);
    }, [items, filter]);

    return (
        <>
            <MobileTopBar title="Registre des tirs" subtitle="Dynamitage" accent="#B45309" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <MobileFilterBar
                options={FILTERS}
                value={filter}
                onChange={(v) => { haptic('light'); setFilter(v); }}
                activeClass="bg-amber-700 text-white border-amber-700"
            />

            <section className="px-4 pt-2 space-y-2.5 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!items && !error && <ListSkeleton count={5} />}
                {items && filtered.length === 0 && !error && (
                    <MobileEmptyState
                        icon={<IconBomb size={24} stroke={1.6} className="text-slate-400" />}
                        title="Aucun tir à afficher"
                        hint={filter === 'ALL' ? 'Le registre est vide.' : 'Aucun tir dans cette catégorie.'}
                    />
                )}
                {items && filtered.map((blast) => {
                    const st = STATUS_META[blast.status] ?? { label: blast.status, tone: 'slate' as ChipTone };
                    const zone = [blast.pit, blast.bench].filter(Boolean).join(' · ');
                    return (
                        <MobileListItem
                            key={blast.id}
                            title={blast.reference}
                            subtitle={blast.type ? `Type : ${blast.type}` : null}
                            onClick={() => { haptic('light'); navigate(`/m/blast/${blast.id}`); }}
                            chips={<MobileChip tone={st.tone}>{st.label}</MobileChip>}
                            meta={(
                                <>
                                    <span className="flex items-center gap-1.5">
                                        <IconCalendarStats size={11} stroke={1.7} />
                                        {blast.scheduledAt ? new Date(blast.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                    </span>
                                    {zone && (
                                        <span className="flex items-center gap-1.5">
                                            <IconMapPin size={11} stroke={1.7} />
                                            {zone}
                                        </span>
                                    )}
                                </>
                            )}
                        />
                    );
                })}
            </section>
        </>
    );
}
