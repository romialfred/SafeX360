/**
 * MobileAuditDetail — Fiche audit ISO 19011 + observations (lecture terrain).
 * Sources : GET /hns/audit/getDetails/{id} et GET /hns/observations/getAllByAuditId/{id}.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton, ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileEmptyState, MobileErrorState, MobileListItem,
    MobileSection, MobileStaleBanner, ChipTone, SERIF,
} from '../components/MobileUI';

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    PLANNING: { label: 'Planification', tone: 'cyan' },
    PREPARATION: { label: 'Préparation', tone: 'violet' },
    EXECUTION: { label: 'Exécution', tone: 'amber' },
    CLOSED: { label: 'Clôturé', tone: 'emerald' },
    CANCELLED: { label: 'Annulé', tone: 'slate' },
};

const OBS_META: Record<string, { label: string; tone: ChipTone }> = {
    NC_MAJEURE: { label: 'NC majeure', tone: 'rose' },
    NC_MINEURE: { label: 'NC mineure', tone: 'orange' },
    OBSERVATION: { label: 'Observation', tone: 'sky' },
    OPPORTUNITE: { label: 'Opportunité', tone: 'teal' },
};

export default function MobileAuditDetail() {
    useStatusBarColor('#0369A1', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();

    const [audit, setAudit] = useState<any | null>(null);
    const [observations, setObservations] = useState<any[] | null>(null);
    const [auditors, setAuditors] = useState<any[]>([]);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setAudit(null);
        setObservations(null);
        let cancelled = false;
        (async () => {
            try {
                const [detailRes, obsRes, auditorsRes] = await Promise.all([
                    getCached<any>({
                        endpoint: `/hns/audit/getDetails/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `audit-detail-${id}`,
                        ttlMs: 5 * 60 * 1000,
                    }),
                    getCached<any[]>({
                        endpoint: `/hns/observations/getAllByAuditId/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `audit-obs-${id}`,
                        ttlMs: 5 * 60 * 1000,
                    }).catch(() => null),
                    // L'équipe (chef + auditeurs) n'est pas dans getDetails
                    getCached<any[]>({
                        endpoint: `/hns/audit/getAuditors/${id}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `audit-auditors-${id}`,
                        ttlMs: 5 * 60 * 1000,
                    }).catch(() => null),
                ]);
                if (!cancelled) {
                    const data = detailRes.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        setAudit(data);
                        setObservations(Array.isArray(obsRes?.data) ? obsRes!.data : []);
                        setAuditors(Array.isArray(auditorsRes?.data) ? auditorsRes!.data : []);
                        setStale(detailRes.stale);
                    } else {
                        setError('Audit introuvable.');
                    }
                }
            } catch {
                if (!cancelled) setError('Impossible de charger cet audit.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const statusUpper = String(audit?.status ?? '').toUpperCase();
    const st = STATUS_META[statusUpper] ?? { label: audit?.status || '—', tone: 'slate' as ChipTone };
    const categoryUpper = String(audit?.category ?? '').toUpperCase();
    // objectives / references sont des tableaux dans le DTO audit
    const joinList = (v: unknown): string =>
        Array.isArray(v) ? v.filter(Boolean).join(' · ') : (typeof v === 'string' && v ? v : '');
    const leadAuditor = auditors.find((a) => /lead|chef/i.test(String(a.role ?? '')))?.name
        ?? audit?.leadAuditorName ?? audit?.leadAuditor;
    const teamNames = auditors.map((a) => a.name).filter(Boolean).join(', ');

    return (
        <>
            <MobileTopBar title="Détail audit" subtitle="Registre ISO 19011" accent="#0369A1" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!audit && !error && <CardSkeleton />}

                {audit && (
                    <>
                        <MobileCard>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <MobileChip tone={st.tone}>{st.label}</MobileChip>
                                {categoryUpper && (
                                    <MobileChip tone={categoryUpper === 'INTERNAL' ? 'cyan' : 'violet'}>
                                        {categoryUpper === 'INTERNAL' ? 'Interne' : 'Externe'}
                                    </MobileChip>
                                )}
                            </div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {audit.title || `Audit #${audit.id ?? id}`}
                            </h1>
                            {audit.refNumber && (
                                <p className="text-[11.5px] font-mono text-slate-500 mt-0.5">{audit.refNumber}</p>
                            )}
                        </MobileCard>

                        <MobileCard>
                            <MobileDetailRow
                                label="Début"
                                value={audit.startDate ? new Date(audit.startDate).toLocaleDateString('fr-FR') : '—'}
                            />
                            <MobileDetailRow
                                label="Fin"
                                value={audit.endDate ? new Date(audit.endDate).toLocaleDateString('fr-FR') : '—'}
                            />
                            <MobileDetailRow label="Auditeur principal" value={leadAuditor ?? '—'} />
                            <MobileDetailRow label="Équipe d'audit" value={teamNames || '—'} />
                            <MobileDetailRow label="Référentiels" value={joinList(audit.references) || audit.referential || audit.standard || '—'} />
                            <MobileDetailRow label="Objectifs" value={joinList(audit.objectives) || audit.objective || audit.scope || '—'} />
                        </MobileCard>

                        <MobileSection title="Observations">
                            <div className="space-y-2.5">
                                {observations === null && <ListSkeleton count={2} />}
                                {observations && observations.length === 0 && (
                                    <MobileEmptyState title="Aucune observation" hint="Les constats de l'audit apparaîtront ici." />
                                )}
                                {observations && observations.map((obs, idx) => {
                                    const cls = OBS_META[String(obs.classification ?? '').toUpperCase()];
                                    return (
                                        <MobileListItem
                                            key={obs.id ?? idx}
                                            title={obs.title || `Observation #${obs.id ?? idx + 1}`}
                                            subtitle={obs.observedFact ?? obs.description ?? null}
                                            chips={cls ? <MobileChip tone={cls.tone}>{cls.label}</MobileChip> : undefined}
                                        />
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
