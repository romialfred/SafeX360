/**
 * MobileInspectionDetail — Fiche d'une inspection HSE + constats.
 * Source : GET /hns/inspection/{id} (workflow InspectionService).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileEmptyState, MobileErrorState, MobileSection, MobileStaleBanner, ChipTone, SERIF,
} from '../components/MobileUI';

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    SCHEDULED: { label: 'Planifiée', tone: 'cyan' },
    IN_PROGRESS: { label: 'En cours', tone: 'amber' },
    SUBMITTED: { label: 'Soumise', tone: 'violet' },
    APPROVED: { label: 'Approuvée', tone: 'emerald' },
    REJECTED: { label: 'Rejetée', tone: 'rose' },
    ARCHIVED: { label: 'Archivée', tone: 'slate' },
    PENDING: { label: 'En attente', tone: 'slate' },
    COMPLETED: { label: 'Réalisée', tone: 'emerald' },
    CANCELLED: { label: 'Annulée', tone: 'slate' },
};

const CONFORMITY_META: Record<string, { label: string; tone: ChipTone }> = {
    CONFORM: { label: 'Conforme', tone: 'emerald' },
    WATCH: { label: 'À surveiller', tone: 'amber' },
    NON_CONFORM: { label: 'Non conforme', tone: 'rose' },
    NOT_APPLICABLE: { label: 'N/A', tone: 'slate' },
};

export default function MobileInspectionDetail() {
    useStatusBarColor('#0E7490', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();

    const [inspection, setInspection] = useState<any | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setInspection(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any>({
                    endpoint: `/hns/inspection/${id}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `inspection-detail-${id}`,
                    ttlMs: 3 * 60 * 1000,
                });
                if (!cancelled) {
                    const data = res.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        setInspection(data);
                        setStale(res.stale);
                    } else setError('Inspection introuvable.');
                }
            } catch {
                if (!cancelled) setError('Impossible de charger cette inspection.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const st = STATUS_META[String(inspection?.status ?? '').toUpperCase()]
        ?? { label: inspection?.status || '—', tone: 'slate' as ChipTone };
    const findings: any[] = Array.isArray(inspection?.findings) ? inspection.findings : [];

    return (
        <>
            <MobileTopBar title="Détail inspection" subtitle="Inspections HSE" accent="#0E7490" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!inspection && !error && <CardSkeleton />}

                {inspection && (
                    <>
                        <MobileCard>
                            <div className="mb-1.5"><MobileChip tone={st.tone}>{st.label}</MobileChip></div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {inspection.title ?? inspection.templateName ?? `Inspection #${inspection.id ?? id}`}
                            </h1>
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow label="Zone / équipement" value={inspection.zoneLabel ?? inspection.zone ?? inspection.targetLabel ?? '—'} />
                            {/* InspectionDetailDTO : primaryInspectorName / plannedDate / summaryReport */}
                            <MobileDetailRow label="Inspecteur" value={inspection.primaryInspectorName ?? inspection.inspectorName ?? '—'} />
                            <MobileDetailRow
                                label="Date planifiée"
                                value={inspection.plannedDate ? new Date(inspection.plannedDate).toLocaleDateString('fr-FR') : '—'}
                            />
                            <MobileDetailRow label="Modèle" value={inspection.templateName ?? '—'} />
                        </MobileCard>

                        {(inspection.summaryReport || inspection.summary) && (
                            <MobileSection title="Synthèse">
                                <MobileCard>
                                    <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">{inspection.summaryReport ?? inspection.summary}</p>
                                </MobileCard>
                            </MobileSection>
                        )}

                        <MobileSection title={`Constats (${findings.length})`}>
                            <div className="space-y-2.5">
                                {findings.length === 0 && (
                                    <MobileEmptyState title="Aucun constat" hint="Les points de contrôle apparaîtront ici." />
                                )}
                                {findings.map((f, idx) => {
                                    const conf = CONFORMITY_META[String(f.conformity ?? '').toUpperCase()];
                                    return (
                                        <MobileCard key={f.id ?? idx}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13.5px] font-medium text-slate-900 leading-snug">
                                                        {f.checkpointLabel ?? f.label ?? `Point #${idx + 1}`}
                                                    </p>
                                                    {(f.note ?? f.comment) && (
                                                        <p className="text-[12px] text-slate-600 mt-1 whitespace-pre-wrap">{f.note ?? f.comment}</p>
                                                    )}
                                                </div>
                                                {conf && <MobileChip tone={conf.tone}>{conf.label}</MobileChip>}
                                            </div>
                                        </MobileCard>
                                    );
                                })}
                            </div>
                        </MobileSection>
                    </>
                )}
            </div>
        </>
    );
}
