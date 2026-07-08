/**
 * MobileComplianceMine — Ma conformité réglementaire (lecture seule terrain).
 *
 * Deux appels : les exigences du poste (getRequirementsByEmpId, objet avec
 * identité + requirements[]) et les justificatifs déposés (getByEmployeeId,
 * tableau de documents). KPI calculés côté client : Conformes (emerald),
 * À renouveler (amber, échéance ≤ 30 jours), Manquants (rose).
 * Statut de chaque exigence dérivé du document associé (charte R7) :
 * VALID=emerald Valide, PENDING=violet En attente, INVALID/EXPIRED=rose.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconCalendarStats,
    IconCertificate,
    IconClockExclamation,
    IconFileOff,
    IconShieldCheck,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import {
    MobileChip,
    MobileEmptyState,
    MobileErrorState,
    MobileKpi,
    MobileListItem,
    MobileSection,
    MobileStaleBanner,
} from '../components/MobileUI';
import type { ChipTone } from '../components/MobileUI';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { categoryLabel } from '../../components/ComplianceManagement/complianceLabels';

/* ─── Contrats DTO (/hns/compliance-docs) ───────────────────────────── */

interface ComplianceRequirement {
    requirementId: number | string;
    requirementName?: string;
    category?: string; // Medical | Legal | Training | Regulatory | Safety | Other
    status?: 'Compliance' | 'Non-Compliance' | 'Uploaded' | string;
    updatedAt?: string;
    expiryDate?: string;
    /** Id du document de conformité associé (= ComplianceDoc.id). */
    docId?: number | null;
}

interface ComplianceDoc {
    id: number | string;
    docName?: string;
    requirement?: string;
    status?: 'VALID' | 'PENDING' | 'INVALID' | 'REJECTED' | 'EXPIRED' | string;
    uploadDate?: string;
    expiryDate?: string;
}

interface RequirementsResponse {
    empName?: string;
    position?: string;
    department?: string;
    email?: string;
    requirements?: ComplianceRequirement[];
}

/* ─── Constantes & helpers ──────────────────────────────────────────── */

const ACCENT = '#7C3AED';
const RENEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // échéance proche : 30 jours

const formatDateFr = (value?: string | null): string | null => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('fr-FR');
};

/** Timestamp d'expiration d'une exigence (champ exigence prioritaire, sinon doc). */
const expiryTs = (req: ComplianceRequirement, doc?: ComplianceDoc): number | null => {
    const raw = req.expiryDate ?? doc?.expiryDate;
    if (!raw) return null;
    const ts = new Date(raw).getTime();
    return Number.isNaN(ts) ? null : ts;
};

/** Chip statut : priorité au document associé, repli sur le statut d'exigence. */
const resolveStatusChip = (
    req: ComplianceRequirement,
    doc?: ComplianceDoc,
): { label: string; tone: ChipTone } => {
    if (doc) {
        const raw = String(doc.status ?? '').toUpperCase();
        const ts = doc.expiryDate ? new Date(doc.expiryDate).getTime() : NaN;
        const effective = raw === 'VALID' && !Number.isNaN(ts) && ts < Date.now() ? 'EXPIRED' : raw;
        switch (effective) {
            case 'VALID':
                return { label: 'Valide', tone: 'emerald' };
            case 'PENDING':
                return { label: 'En attente', tone: 'violet' };
            case 'EXPIRED':
                return { label: 'Expiré', tone: 'rose' };
            case 'INVALID':
            case 'REJECTED':
                return { label: 'Rejeté', tone: 'rose' };
            default:
                break; // statut inconnu : repli sur le statut d'exigence
        }
    }
    const status = String(req.status ?? '');
    if (status === 'Compliance') return { label: 'Valide', tone: 'emerald' };
    if (status === 'Uploaded') return { label: 'En attente', tone: 'violet' };
    return { label: 'Manquant', tone: 'rose' };
};

/* ─── Composant ─────────────────────────────────────────────────────── */

export default function MobileComplianceMine() {
    useStatusBarColor(ACCENT, 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((s: any) => s.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);
    const userId = Number(user?.id ?? user?.empId ?? 0);

    const [reqs, setReqs] = useState<ComplianceRequirement[] | null>(null);
    const [docs, setDocs] = useState<ComplianceDoc[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState<boolean>(false);

    const fetchData = useCallback(() => {
        setError(null);
        setReqs(null);
        let cancelled = false;
        (async () => {
            try {
                const [reqRes, docRes] = await Promise.all([
                    getCached<RequirementsResponse>({
                        endpoint: `/hns/compliance-docs/getRequirementsByEmpId/${userId}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `compliance-req-${companyId}-${userId}`,
                        ttlMs: 5 * 60 * 1000,
                    }),
                    // Les justificatifs sont un enrichissement : leur échec ne bloque pas l'écran.
                    getCached<ComplianceDoc[]>({
                        endpoint: `/hns/compliance-docs/getByEmployeeId/${userId}`,
                        cacheStore: 'inspectionCache',
                        cacheKey: `compliance-docs-${companyId}-${userId}`,
                        ttlMs: 5 * 60 * 1000,
                    }).catch(() => null),
                ]);
                if (cancelled) return;
                const payload: RequirementsResponse =
                    reqRes.data && typeof reqRes.data === 'object' ? reqRes.data : {};
                setReqs(Array.isArray(payload.requirements) ? payload.requirements : []);
                setDocs(docRes && Array.isArray(docRes.data) ? docRes.data : []);
                setStale(reqRes.stale || Boolean(docRes?.stale));
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger votre conformité.');
                    setReqs([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId, userId]);

    useEffect(fetchData, [fetchData]);

    const docsById = useMemo(() => {
        const map = new Map<string, ComplianceDoc>();
        for (const doc of docs) map.set(String(doc.id), doc);
        return map;
    }, [docs]);

    const kpis = useMemo(() => {
        let compliant = 0;
        let toRenew = 0;
        let missing = 0;
        const now = Date.now();
        for (const req of reqs ?? []) {
            const status = String(req.status ?? '');
            if (status === 'Non-Compliance') {
                missing += 1;
                continue;
            }
            if (status !== 'Compliance') continue; // 'Uploaded' = en attente de validation, hors KPI
            const doc = req.docId != null ? docsById.get(String(req.docId)) : undefined;
            const ts = expiryTs(req, doc);
            if (ts !== null && ts - now <= RENEW_WINDOW_MS) toRenew += 1;
            else compliant += 1;
        }
        return { compliant, toRenew, missing };
    }, [reqs, docsById]);

    return (
        <>
            <MobileTopBar
                title="Ma conformité"
                subtitle="Exigences et justificatifs du poste"
                accent={ACCENT}
                onBack={() => navigate(-1)}
            />

            <MobileStaleBanner visible={stale} />

            {error && (
                <section className="px-4 pt-3">
                    <MobileErrorState
                        message={error}
                        onRetry={() => { haptic('light'); fetchData(); }}
                    />
                </section>
            )}

            {!reqs && !error && (
                <section className="px-4 pt-3">
                    <ListSkeleton count={5} />
                </section>
            )}

            {reqs && (
                <>
                    <section className="px-4 pt-4">
                        <div className="grid grid-cols-3 gap-2">
                            <MobileKpi
                                label="Conformes"
                                value={kpis.compliant}
                                tone="emerald"
                                icon={<IconShieldCheck size={16} stroke={1.8} className="text-emerald-600" />}
                            />
                            <MobileKpi
                                label="À renouveler"
                                value={kpis.toRenew}
                                tone="amber"
                                icon={<IconClockExclamation size={16} stroke={1.8} className="text-amber-600" />}
                            />
                            <MobileKpi
                                label="Manquants"
                                value={kpis.missing}
                                tone="rose"
                                icon={<IconFileOff size={16} stroke={1.8} className="text-rose-600" />}
                            />
                        </div>
                    </section>

                    <MobileSection
                        title="Mes exigences"
                        action={<MobileChip tone="slate">{reqs.length}</MobileChip>}
                    >
                        <div className="space-y-2.5 pb-6">
                            {/* !error : sur échec réseau reqs=[] — sans le garde on affichait
                                « Aucune exigence » sous la bannière d'erreur (message contradictoire) */}
                            {reqs.length === 0 && !error && (
                                <MobileEmptyState
                                    icon={<IconCertificate size={24} stroke={1.6} className="text-slate-400" />}
                                    title="Aucune exigence affectée"
                                    hint="Aucune exigence réglementaire n'est associée à votre poste."
                                />
                            )}

                            {reqs.map((req) => {
                                const doc = req.docId != null ? docsById.get(String(req.docId)) : undefined;
                                const chip = resolveStatusChip(req, doc);
                                const expiry = formatDateFr(req.expiryDate ?? doc?.expiryDate);
                                return (
                                    <MobileListItem
                                        key={String(req.requirementId)}
                                        title={req.requirementName || 'Exigence'}
                                        subtitle={doc?.docName ?? null}
                                        chips={
                                            <>
                                                <MobileChip tone={chip.tone}>{chip.label}</MobileChip>
                                                {req.category && (
                                                    <MobileChip tone="slate">{categoryLabel(req.category)}</MobileChip>
                                                )}
                                            </>
                                        }
                                        meta={expiry ? (
                                            <span className="inline-flex items-center gap-1">
                                                <IconCalendarStats size={11} stroke={1.7} />
                                                Expire le {expiry}
                                            </span>
                                        ) : undefined}
                                    />
                                );
                            })}
                        </div>
                    </MobileSection>
                </>
            )}
        </>
    );
}
