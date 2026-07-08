/**
 * MobileCorrectiveActionDetail — Fiche d'une action corrective + clôture terrain.
 *
 * Source : GET /hns/corrective-action/get/{id}.
 * Action terrain : « Marquer réalisée » = PUT /hns/corrective-action/update
 * avec le DTO complet (le backend valide la transition de la machine à
 * états — un statut illégal est rejeté côté serveur).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconCheck } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useRedirectTimer } from '../hooks/useRedirectTimer';
import { getCached, mutateOffline } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import {
    MobileButton, MobileCard, MobileChip, MobileDetailRow, MobileErrorState, MobileSection, MobileStaleBanner, ChipTone, SERIF,
} from '../components/MobileUI';

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    PENDING: { label: 'En attente', tone: 'violet' },
    IN_PROGRESS: { label: 'En cours', tone: 'amber' },
    COMPLETED: { label: 'Réalisée', tone: 'emerald' },
    CANCELLED: { label: 'Annulée', tone: 'rose' },
};

const SOURCE_LABEL: Record<string, string> = {
    INCIDENT: 'Incident',
    GENERAL_INSPECTION: 'Inspection',
    HS_ACTIVITY: 'Activité HSE',
    NON_CONFORMITY: 'Non-conformité',
    NEAR_MISS: 'Quasi-accident',
    HAZARD: 'Danger',
    ADHOC: "Idée d'amélioration",
};

export default function MobileCorrectiveActionDetail() {
    useStatusBarColor('#EA580C', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const redirectAfter = useRedirectTimer();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.empId ?? user?.id ?? 0);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [action, setAction] = useState<any | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setAction(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any>({
                    endpoint: `/hns/corrective-action/get/${id}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `action-${id}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) {
                    const data = res.data;
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        setAction(data);
                        setStale(res.stale);
                    } else setError('Action corrective introuvable.');
                }
            } catch {
                if (!cancelled) setError('Impossible de charger cette action.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const statusUpper = String(action?.status ?? '').toUpperCase();
    const st = STATUS_META[statusUpper] ?? { label: action?.status || '—', tone: 'slate' as ChipTone };
    // Garde NaN : progress non numérique affichait « NaN% » et cassait la barre
    const progressRaw = Number(action?.progress);
    const progress = Number.isFinite(progressRaw) ? Math.max(0, Math.min(100, progressRaw)) : 0;
    // La machine à états backend n'autorise COMPLETED que depuis IN_PROGRESS
    // (PENDING→COMPLETED = INVALID_STATUS_TRANSITION → 500 → mutation
    // empoisonnée dans la file hors ligne).
    const canComplete = action && statusUpper === 'IN_PROGRESS';

    const markCompleted = async () => {
        if (!action || completing) return;
        setCompleting(true);
        setCompleteError(null);
        haptic('medium');
        try {
            const payload = { ...action, status: 'COMPLETED' };
            // companyId en query param : @RequestParam obligatoire côté backend.
            const result = await mutateOffline({
                endpoint: `/hns/corrective-action/update?companyId=${companyId}`,
                method: 'PUT',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'action.update',
                fingerprint: `action-complete:${action.id ?? id}`,
            });
            haptic('success');
            setDone(result.online
                ? 'Action marquée réalisée.'
                : 'Clôture sauvegardée hors ligne — sera synchronisée.');
            redirectAfter(() => navigate(-1), 1800);
        } catch {
            haptic('error');
            setCompleteError('Échec de la clôture (transition refusée ou réseau).');
        } finally {
            setCompleting(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg ring-2 ring-emerald-200 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                        <IconCheck size={28} stroke={2.4} className="text-emerald-700" />
                    </div>
                    <p className="text-[15px] font-semibold text-slate-900">{done}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <MobileTopBar title="Action corrective" subtitle="Plan d'action HSE" accent="#EA580C" onBack={() => navigate(-1)} />
            <MobileStaleBanner visible={stale} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!action && !error && <CardSkeleton />}

                {action && (
                    <>
                        <MobileCard>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <MobileChip tone={st.tone}>{st.label}</MobileChip>
                                {action.type && (
                                    <MobileChip tone="sky">{SOURCE_LABEL[String(action.type).toUpperCase()] ?? action.type}</MobileChip>
                                )}
                            </div>
                            <h1 className="text-[17px] font-semibold text-slate-900 leading-snug" style={{ fontFamily: SERIF }}>
                                {action.actionName || `Action #${action.id ?? id}`}
                            </h1>
                            {/* Barre de progression */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                    <span>Avancement</span>
                                    <span className="font-semibold text-slate-700">{progress}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </MobileCard>

                        <MobileCard>
                            {/* CorrectiveActionResponse backend : assignedEmployeeName */}
                            <MobileDetailRow label="Responsable" value={action.assignedEmployeeName ?? action.responsibleName ?? '—'} />
                            <MobileDetailRow
                                label="Échéance"
                                value={action.deadline ? new Date(action.deadline).toLocaleDateString('fr-FR') : '—'}
                            />
                            <MobileDetailRow label="Source" value={action.incidentTitle ?? action.sourceTitle ?? '—'} />
                        </MobileCard>

                        {action.description && (
                            <MobileSection title="Description">
                                <MobileCard>
                                    <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {action.description}
                                    </p>
                                </MobileCard>
                            </MobileSection>
                        )}

                        {completeError && <MobileErrorState message={completeError} />}

                        {canComplete && (
                            <MobileButton
                                accent="#059669"
                                loading={completing}
                                onClick={markCompleted}
                                icon={<IconCheck size={16} stroke={2.4} />}
                            >
                                Marquer réalisée
                            </MobileButton>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
