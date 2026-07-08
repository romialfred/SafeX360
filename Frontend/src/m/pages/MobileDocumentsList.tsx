/**
 * MobileDocumentsList — Documents HSE approuvés (consultation terrain).
 *
 * Source : GET /hns/documents/approved (DocumentSummary). Lecture seule :
 * le terrain consulte les procédures/consignes en vigueur ; la gestion
 * documentaire (versions, workflow) reste sur le web.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconFileText, IconCalendarStats } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileChip, MobileEmptyState, MobileErrorState, MobileListItem, MobileStaleBanner, MobileSection,
} from '../components/MobileUI';
import type { DocumentSummary } from '../../types/documents';

export default function MobileDocumentsList() {
    useStatusBarColor('#0369A1', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<DocumentSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<DocumentSummary[]>({
                    endpoint: '/hns/documents/approved',
                    cacheStore: 'inspectionCache',
                    cacheKey: `documents-approved-${companyId}`,
                    ttlMs: 10 * 60 * 1000,
                });
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger les documents.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchData, [fetchData]);

    return (
        <>
            <MobileTopBar title="Documents HSE" subtitle="Procédures et consignes en vigueur" accent="#0369A1" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <MobileSection title="Documents approuvés">
                <div className="space-y-2.5">
                    {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                    {!items && !error && <ListSkeleton count={6} />}
                    {items && items.length === 0 && !error && (
                        <MobileEmptyState
                            icon={<IconFileText size={24} stroke={1.6} className="text-slate-400" />}
                            title="Aucun document approuvé"
                            hint="Les documents publiés apparaîtront ici."
                        />
                    )}
                    {items && items.map((doc) => (
                        <MobileListItem
                            key={doc.id}
                            title={doc.documentName}
                            subtitle={doc.description ?? doc.category ?? null}
                            chips={(
                                <>
                                    <MobileChip tone="emerald">Approuvé</MobileChip>
                                    {doc.category && <MobileChip tone="sky">{doc.category}</MobileChip>}
                                    {doc.extension && <MobileChip tone="slate">{String(doc.extension).toUpperCase()}</MobileChip>}
                                </>
                            )}
                            meta={doc.updatedAt || doc.createdAt ? (
                                <span className="flex items-center gap-1.5">
                                    <IconCalendarStats size={11} stroke={1.7} />
                                    Mis à jour le {new Date(doc.updatedAt ?? doc.createdAt ?? '').toLocaleDateString('fr-FR')}
                                </span>
                            ) : undefined}
                        />
                    ))}
                </div>
            </MobileSection>
        </>
    );
}
