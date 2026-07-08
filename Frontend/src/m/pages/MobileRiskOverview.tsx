/**
 * MobileRiskOverview — Vue d'ensemble tactile du registre des risques.
 *
 * Lecture seule (pas de bouton créer) : chips de synthèse par niveau en
 * haut (Faible/Modéré/Élevé/Critique — palette charte R7), puis la liste
 * des risques. Tap = ouvrir la Gestion des Risques web (pas de détail par
 * risque dédié côté mobile pour l'instant).
 *
 * Le backend encode le niveau sous les paliers historiques Low / Low Med /
 * Medium / Med High / High (voir riskLabels.ts côté web) — on les regroupe
 * ici en 3 familles Faible / Modéré / Élevé-Critique pour les chips de tête.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconShieldExclamation,
    IconChevronRight,
    IconMapPin,
    IconAlertOctagon,
    IconRefresh,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { resolveRiskLevel, riskLevelFamily, RISK_LEVEL_LABEL_FR } from '../utils/riskLevel';

interface RiskSummary {
    id: number | string;
    title: string;
    riskLevel?: string | null;
    hazardSource?: string | null;
    departmentId?: number | string | null;
    departmentName?: string | null;
    workProcessId?: number | string | null;
}

// Le backend émet riskLevel comme CLÉ MATRICE « pg » (« 11 »…« 55 ») : la
// résolution en palier passe par la matrice 5×5 partagée (utils/riskLevel).
const LEVEL_CHIP: Record<string, string> = {
    Low: 'bg-emerald-50 text-emerald-700',
    'Low Med': 'bg-emerald-50 text-emerald-700',
    Medium: 'bg-amber-50 text-amber-700',
    'Med High': 'bg-orange-50 text-orange-700',
    High: 'bg-rose-50 text-rose-700',
};

export default function MobileRiskOverview() {
    useStatusBarColor('#9333EA', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [items, setItems] = useState<RiskSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState<boolean>(false);

    const fetchData = useCallback(() => {
        setError(null);
        setItems(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<RiskSummary[]>({
                    endpoint: `/hns/risks/overview?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `risks-overview-${companyId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                const raw: any = res.data;
                // raw.risks peut être absent ou non-tableau selon la version du DTO
                let data: RiskSummary[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.risks) ? raw.risks : []);
                if (!cancelled && data.length === 0) {
                    try {
                        const fallback = await getCached<RiskSummary[]>({
                            endpoint: `/hns/risks/getAll?companyId=${companyId}`,
                            cacheStore: 'inspectionCache',
                            cacheKey: `risks-getall-${companyId}`,
                            ttlMs: 2 * 60 * 1000,
                        });
                        data = Array.isArray(fallback.data) ? fallback.data : [];
                    } catch {
                        // pas de repli disponible
                    }
                }
                if (!cancelled) {
                    setItems(data);
                    setStale(res.stale);
                }
            } catch {
                if (!cancelled) {
                    setError('Impossible de charger le registre des risques.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(fetchData, [fetchData]);

    const counts = useMemo(() => {
        const c = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        (items ?? []).forEach((r) => {
            // Pas de repli silencieux : un niveau irrésoluble n'est compté nulle part
            const family = riskLevelFamily(resolveRiskLevel(r.riskLevel));
            if (family) c[family] += 1;
        });
        return c;
    }, [items]);

    const openRisk = (riskId: number | string) => {
        haptic('light');
        navigate(`/m/risk/${riskId}`);
    };

    return (
        <>
            <MobileTopBar title="Registre des risques" subtitle="Vue d'ensemble HSE" accent="#9333EA" onBack={() => navigate(-1)} />

            {stale && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={1.8} />
                    <span>Données du cache local — synchronisation au retour du réseau.</span>
                </div>
            )}

            {/* Synthèse par niveau */}
            {/* top = hauteur TopBar (56px + safe-area) : avec top-0 la barre glissait DERRIÈRE la TopBar (z-40) au scroll et devenait incliquable */}
            <div className="px-4 pt-3 pb-2 sticky z-10 bg-[#FAF8F3]" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                        <p className="text-[18px] font-semibold text-emerald-700 leading-none">{counts.LOW}</p>
                        <p className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wide">Faible</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                        <p className="text-[18px] font-semibold text-amber-700 leading-none">{counts.MEDIUM}</p>
                        <p className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wide">Modéré</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                        <p className="text-[18px] font-semibold text-rose-700 leading-none">{counts.HIGH}</p>
                        <p className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wide">Élevé</p>
                    </div>
                </div>
            </div>

            <section className="px-4 pt-2 space-y-2.5">
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3 flex items-center gap-2">
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={fetchData} className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[12px] font-medium flex-shrink-0 inline-flex items-center justify-center gap-1" style={{ minHeight: 44 }}>
                            <IconRefresh size={13} stroke={2} /> Réessayer
                        </button>
                    </div>
                )}

                {!items && !error && (
                    <ListSkeleton count={5} />
                )}

                {items && items.length === 0 && !error && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                            <IconShieldExclamation size={24} stroke={1.6} className="text-slate-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucun risque enregistré
                        </p>
                        <p className="text-[12px] text-slate-500">
                            Le registre des risques est vide pour le moment.
                        </p>
                    </div>
                )}

                {items && items.map((risk) => {
                    const level = resolveRiskLevel(risk.riskLevel);
                    const chip = level ? LEVEL_CHIP[level] : 'bg-slate-100 text-slate-600';
                    const levelLabel = level ? RISK_LEVEL_LABEL_FR[level] : 'Non coté';
                    const location = risk.departmentName ?? (risk.departmentId != null ? `Département #${risk.departmentId}` : '—');
                    return (
                        <button
                            key={risk.id}
                            type="button"
                            onClick={() => openRisk(risk.id)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm"
                            style={{ minHeight: 88 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${chip} text-[11px] font-medium mb-1`}>
                                        {levelLabel}
                                    </div>
                                    <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {risk.title}
                                    </h3>
                                    <p className="text-[12.5px] text-slate-600 truncate mt-0.5">
                                        {risk.hazardSource ?? 'Source de danger non précisée'}
                                    </p>
                                    <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-1.5">
                                        <IconMapPin size={11} stroke={1.7} />
                                        {location}
                                    </p>
                                </div>
                                <IconChevronRight size={18} stroke={1.8} className="text-slate-300 flex-shrink-0 mt-1" />
                            </div>
                        </button>
                    );
                })}
            </section>
        </>
    );
}
