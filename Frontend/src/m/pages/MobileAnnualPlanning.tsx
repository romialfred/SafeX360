/**
 * MobileAnnualPlanning — Activités HSE planifiées de l'année.
 * Source : GET /hns/activity/get/year/{année} (lecture terrain).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCalendarStats } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import {
    MobileChip, MobileEmptyState, MobileErrorState, MobileFilterBar, MobileListItem, MobileStaleBanner, ChipTone,
} from '../components/MobileUI';

type Filter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'PENDING', label: 'À venir' },
    { key: 'IN_PROGRESS', label: 'En cours' },
    { key: 'COMPLETED', label: 'Réalisées' },
];

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    PENDING: { label: 'À venir', tone: 'cyan' },
    IN_PROGRESS: { label: 'En cours', tone: 'amber' },
    COMPLETED: { label: 'Réalisée', tone: 'emerald' },
    CANCELLED: { label: 'Annulée', tone: 'rose' },
};

const CATEGORY_META: Record<string, { label: string; tone: ChipTone }> = {
    IGP: { label: 'Inspection planifiée', tone: 'cyan' },
    HSE: { label: 'Activité HSE', tone: 'teal' },
    TDM: { label: 'Tournée du management', tone: 'violet' },
};

export default function MobileAnnualPlanning() {
    useStatusBarColor('#4F46E5', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const year = new Date().getFullYear();

    const [items, setItems] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);
    const [filter, setFilter] = useState<Filter>('ALL');

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any[]>({
                    endpoint: `/hns/activity/get/year/${year}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `planning-${year}`,
                    ttlMs: 10 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger la planification.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [year]);

    useEffect(fetchData, [fetchData]);

    const filtered = useMemo(() => {
        if (!items) return [];
        if (filter === 'ALL') return items;
        return items.filter((a) => String(a.status ?? '').toUpperCase() === filter);
    }, [items, filter]);

    return (
        <>
            <MobileTopBar title={`Planification ${year}`} subtitle="Activités HSE de l'année" accent="#4F46E5" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <MobileFilterBar
                options={FILTERS}
                value={filter}
                onChange={(v) => { haptic('light'); setFilter(v); }}
                activeClass="bg-indigo-700 text-white border-indigo-700"
            />

            <section className="px-4 pt-2 space-y-2.5 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!items && !error && <ListSkeleton count={6} />}
                {items && filtered.length === 0 && !error && (
                    <MobileEmptyState
                        icon={<IconCalendarStats size={24} stroke={1.6} className="text-slate-400" />}
                        title="Aucune activité"
                        hint={filter === 'ALL' ? `Aucune activité planifiée en ${year}.` : 'Aucune activité dans cette catégorie.'}
                    />
                )}
                {items && filtered.map((act, idx) => {
                    const st = STATUS_META[String(act.status ?? '').toUpperCase()];
                    const cat = CATEGORY_META[String(act.category ?? '').toUpperCase()];
                    // ActivityDTO backend : dateTime (LocalDateTime) OU month
                    // (LocalDate « 2026-03-01 » = mois planifié). Parse en LOCAL :
                    // new Date('2026-03-01') = minuit UTC → « février » en UTC-5.
                    const when = act.dateTime ?? null;
                    let monthLabel: string | null = null;
                    if (!when && act.month) {
                        const [y, mo] = String(act.month).split('-').map(Number);
                        if (Number.isFinite(y) && mo >= 1 && mo <= 12) {
                            monthLabel = new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                        }
                    }
                    return (
                        <MobileListItem
                            key={act.id ?? idx}
                            title={act.title ?? act.name ?? act.label ?? `Activité #${act.id ?? idx + 1}`}
                            subtitle={null}
                            chips={(
                                <>
                                    {cat && <MobileChip tone={cat.tone}>{cat.label}</MobileChip>}
                                    {st && <MobileChip tone={st.tone}>{st.label}</MobileChip>}
                                </>
                            )}
                            meta={(when || monthLabel) ? (
                                <span className="flex items-center gap-1.5">
                                    <IconCalendarStats size={11} stroke={1.7} />
                                    {when ? new Date(when).toLocaleDateString('fr-FR') : monthLabel}
                                </span>
                            ) : undefined}
                        />
                    );
                })}
            </section>
        </>
    );
}
