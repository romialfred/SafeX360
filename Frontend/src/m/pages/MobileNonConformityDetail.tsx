/**
 * MobileNonConformityDetail — Fiche d'une non-conformité (lecture terrain).
 *
 * Deux DTO backend complémentaires (vérifié dans NonConformityAPI.java) :
 *   - GET /hns/non-conformity/get/{id}    → NonConformityDTO : description,
 *     requirement… mais uniquement des IDs (categoryId, locationId…)
 *   - GET /hns/non-conformity/getInfo/{id} → NcInfo : reporterName, severity…
 *     mais pas de description.
 * On fusionne les deux + résolution des noms via les référentiels getAllActive
 * (mêmes cacheKeys que l'écran de déclaration → cache IndexedDB déjà chaud).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileErrorState, MobileSection, MobileStaleBanner, ChipTone, SERIF, toPlainText,
} from '../components/MobileUI';

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    REPORTED: { label: 'Déclaré', tone: 'cyan' },
    ANALYSIS: { label: 'En analyse', tone: 'amber' },
    AC_IMPLEMENTATION: { label: 'Traitement', tone: 'orange' },
    CLOSED: { label: 'Clôturé', tone: 'emerald' },
    CANCELLED: { label: 'Annulé', tone: 'slate' },
    REJECTED: { label: 'Rejeté', tone: 'rose' },
};

const TYPE_LABEL: Record<string, string> = {
    NON_CONFORMITY: 'Non-conformité',
    NEAR_MISS: 'Quasi-accident',
    HAZARD: 'Danger',
};

export default function MobileNonConformityDetail() {
    useStatusBarColor('#DC2626', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [nc, setNc] = useState<any | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setNc(null);
        let cancelled = false;
        (async () => {
            try {
                const ref = (endpoint: string, cacheKey: string) => getCached<any[]>({
                    endpoint, cacheStore: 'inspectionCache', cacheKey, ttlMs: 10 * 60 * 1000,
                }).catch(() => null);
                const [fullRes, infoRes, locations, processes, categories] = await Promise.all([
                    getCached<any>({
                        endpoint: `/hns/non-conformity/get/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `nc-${id}`,
                        ttlMs: 5 * 60 * 1000,
                    }),
                    getCached<any>({
                        endpoint: `/hns/non-conformity/getInfo/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `nc-info-${id}`,
                        ttlMs: 5 * 60 * 1000,
                    }).catch(() => null),
                    // Mêmes cacheKeys que MobileNonConformityDeclare → cache chaud
                    ref('/hns/locations/getAllActive', `nc-locations-${companyId}`),
                    ref('/hns/work-process/getAllActive', `nc-processes-${companyId}`),
                    ref('/hns/incidents-category/getAllActive', `nc-categories-${companyId}`),
                ]);
                if (cancelled) return;
                const full = fullRes.data;
                if (!full || typeof full !== 'object' || Array.isArray(full)) {
                    setError('Non-conformité introuvable.');
                    return;
                }
                const nameById = (list: any, targetId: unknown): string | undefined => {
                    if (!Array.isArray(list) || targetId == null) return undefined;
                    const hit = list.find((x) => String(x.id) === String(targetId));
                    return hit ? String(hit.name ?? hit.label ?? hit.title ?? '') || undefined : undefined;
                };
                const info = infoRes?.data && typeof infoRes.data === 'object' ? infoRes.data : {};
                setStale(fullRes.stale);
                setNc({
                    ...full,
                    reporterName: info.reporterName,
                    severityLevel: full.severityLevel ?? info.severityLevel,
                    locationName: nameById(locations?.data, full.locationId),
                    workProcessName: nameById(processes?.data, full.workProcessId),
                    categoryName: nameById(categories?.data, full.categoryId),
                });
            } catch {
                if (!cancelled) setError('Impossible de charger cette non-conformité.');
            }
        })();
        return () => { cancelled = true; };
    }, [id, companyId]);

    useEffect(fetchData, [fetchData]);

    const statusUpper = String(nc?.status ?? '').toUpperCase();
    const st = STATUS_META[statusUpper] ?? { label: nc?.status || '—', tone: 'slate' as ChipTone };

    return (
        <>
            <MobileTopBar title="Non-conformité" subtitle="Détail de l'événement" accent="#DC2626" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!nc && !error && <CardSkeleton />}

                {nc && (
                    <>
                        <MobileCard>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <MobileChip tone={st.tone}>{st.label}</MobileChip>
                                {nc.type && <MobileChip tone="sky">{TYPE_LABEL[String(nc.type)] ?? nc.type}</MobileChip>}
                            </div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {nc.title || `Événement #${nc.id ?? id}`}
                            </h1>
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow label="Catégorie" value={nc.categoryName ?? nc.category ?? '—'} />
                            <MobileDetailRow label="Lieu" value={nc.locationName ?? nc.location ?? '—'} />
                            <MobileDetailRow label="Processus" value={nc.workProcessName ?? nc.workProcess ?? '—'} />
                            <MobileDetailRow label="Déclaré par" value={nc.reportedByName ?? nc.reporterName ?? '—'} />
                            <MobileDetailRow
                                label="Date de l'événement"
                                value={nc.date ? new Date(nc.date).toLocaleDateString('fr-FR') : '—'}
                            />
                            <MobileDetailRow label="Exigence" value={nc.requirement ?? '—'} />
                        </MobileCard>

                        <MobileSection title="Description">
                            <MobileCard>
                                <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                                    {toPlainText(nc.description) || '—'}
                                </p>
                            </MobileCard>
                        </MobileSection>
                    </>
                )}
            </div>
        </>
    );
}
