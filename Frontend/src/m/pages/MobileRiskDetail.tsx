/**
 * MobileRiskDetail — Fiche d'un risque du registre ISO 45001 (lecture terrain).
 * Source : GET /hns/risks/get/{id}.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { resolveRiskLevel, RISK_LEVEL_LABEL_FR } from '../utils/riskLevel';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileErrorState, MobileSection, MobileStaleBanner, ChipTone, SERIF, toPlainText,
} from '../components/MobileUI';

// Tons par palier — le palier lui-même est résolu depuis la clé matrice
// « pg » du backend via utils/riskLevel (les libellés ne sont jamais émis).
const LEVEL_TONE: Record<string, ChipTone> = {
    'Low': 'emerald',
    'Low Med': 'emerald',
    'Medium': 'amber',
    'Med High': 'orange',
    'High': 'rose',
};

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    OPEN: { label: 'Ouvert', tone: 'cyan' },
    IN_PROGRESS: { label: 'En traitement', tone: 'amber' },
    CLOSED: { label: 'Clôturé', tone: 'emerald' },
};

export default function MobileRiskDetail() {
    useStatusBarColor('#9333EA', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [risk, setRisk] = useState<any | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setRisk(null);
        let cancelled = false;
        (async () => {
            try {
                // RiskDTO backend ne porte que workProcessId : le nom vient du
                // référentiel (même cacheKey que les écrans NC → cache chaud).
                const [res, processes] = await Promise.all([
                    getCached<any>({
                        endpoint: `/hns/risks/get/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `risk-${id}`,
                        ttlMs: 5 * 60 * 1000,
                    }),
                    getCached<any[]>({
                        endpoint: '/hns/work-process/getAllActive',
                        cacheStore: 'inspectionCache',
                        cacheKey: `nc-processes-${companyId}`,
                        ttlMs: 10 * 60 * 1000,
                    }).catch(() => null),
                ]);
                if (!cancelled) {
                    const data = res.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        const list = Array.isArray(processes?.data) ? processes!.data : [];
                        const wp = list.find((x) => String(x.id) === String(data.workProcessId));
                        setRisk({ ...data, workProcessName: wp ? String(wp.name ?? '') || undefined : undefined });
                        setStale(res.stale);
                    } else setError('Risque introuvable.');
                }
            } catch {
                if (!cancelled) setError('Impossible de charger ce risque.');
            }
        })();
        return () => { cancelled = true; };
    }, [id, companyId]);

    useEffect(fetchData, [fetchData]);

    const levelKey = resolveRiskLevel(risk?.riskLevel);
    const level = levelKey ? { label: RISK_LEVEL_LABEL_FR[levelKey], tone: LEVEL_TONE[levelKey] } : null;
    const st = STATUS_META[String(risk?.status ?? '').toUpperCase()];

    return (
        <>
            <MobileTopBar title="Détail du risque" subtitle="Registre ISO 45001" accent="#9333EA" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!risk && !error && <CardSkeleton />}

                {risk && (
                    <>
                        <MobileCard>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                {level && <MobileChip tone={level.tone}>{level.label}</MobileChip>}
                                {st && <MobileChip tone={st.tone}>{st.label}</MobileChip>}
                            </div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {risk.title || `Risque #${risk.id ?? id}`}
                            </h1>
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow label="Source de danger" value={risk.hazardSource ?? '—'} />
                            <MobileDetailRow label="Département" value={risk.departmentName ?? (risk.departmentId != null ? `Département #${risk.departmentId}` : '—')} />
                            <MobileDetailRow label="Processus" value={risk.workProcessName ?? '—'} />
                            {/* RiskDTO backend : legalRequirements est une String libre */}
                            <MobileDetailRow label="Exigences légales" value={risk.legalRequirements || '—'} />
                            {risk.personsExposed && (
                                <MobileDetailRow
                                    label="Personnes exposées"
                                    value={`${risk.personsExposed}${risk.exposureCount != null ? ` (${risk.exposureCount})` : ''}`}
                                />
                            )}
                            {(risk.probability != null && risk.severity != null) && (
                                <MobileDetailRow label="Cotation P × G" value={`${risk.probability} × ${risk.severity}`} />
                            )}
                        </MobileCard>

                        {/* existingControls n'existe pas dans RiskDTO (les mesures
                            vivent dans risk_control) — bloc retiré, pas de code mort */}
                        {(risk.description || risk.potentialConsequences) && (
                            <MobileSection title="Analyse">
                                <MobileCard>
                                    {risk.description && (
                                        <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">{toPlainText(risk.description)}</p>
                                    )}
                                    {risk.potentialConsequences && (
                                        <p className="text-[12.5px] text-slate-600 mt-2 whitespace-pre-wrap">
                                            Conséquences potentielles : {toPlainText(risk.potentialConsequences)}
                                        </p>
                                    )}
                                </MobileCard>
                            </MobileSection>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
