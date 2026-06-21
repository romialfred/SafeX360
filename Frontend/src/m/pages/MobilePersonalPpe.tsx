/**
 * MobilePersonalPpe — Vue lecture seule de la dotation EPI personnelle.
 * Permet la consultation et la demande de remplacement.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconShield, IconArrowLeft, IconCalendarStats, IconCircleCheck, IconAlertOctagon } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

interface PpeItem {
    id: number;
    name: string;
    type: string;
    assignedAt?: string;
    expiresAt?: string;
    status?: 'OK' | 'EXPIRING' | 'EXPIRED' | 'REQUESTED';
}

export default function MobilePersonalPpe() {
    useStatusBarColor('#047857', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [items, setItems] = useState<PpeItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<PpeItem[]>({
                    endpoint: `/hns/mobile/ppe/personal/${userId}`,
                    cacheStore: 'userProfileCache',
                    cacheKey: `ppe-${userId}`,
                    ttlMs: 24 * 60 * 60 * 1000,
                });
                if (!cancelled) setItems(res.data);
            } catch (_e) {
                if (!cancelled) {
                    setError("Données EPI indisponibles. Vérifiez votre connexion.");
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const requestReplacement = (ppe: PpeItem) => {
        haptic('medium');
        navigate('/m/incident/new');
    };

    return (
        <>
            <MobileTopBar
                title="Mes EPI"
                subtitle="Dotation personnelle"
                accent="#047857"
                onBack={() => navigate('/m/profile')}
            />
            <section className="px-4 pt-4">
                {error && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px] rounded-xl p-3 mb-3 flex items-start gap-2">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {!items && !error && (
                    <ListSkeleton count={4} />
                )}
                {items && items.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <IconShield size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucun EPI enregistré
                        </p>
                        <p className="text-[12.5px] text-slate-500">
                            Contactez votre coordinateur HSE pour la première dotation.
                        </p>
                    </div>
                )}
                {items && items.length > 0 && (
                    <ul className="space-y-2.5">
                        {items.map((p) => {
                            const tone =
                                p.status === 'EXPIRED' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                p.status === 'EXPIRING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                'bg-emerald-50 border-emerald-200 text-emerald-800';
                            return (
                                <li key={p.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                                            <IconShield size={20} stroke={1.8} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-[14px] font-semibold text-slate-900 truncate">{p.name}</h3>
                                                {p.status && (
                                                    <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-full border ${tone}`}>
                                                        {p.status === 'OK' && 'En cours'}
                                                        {p.status === 'EXPIRING' && 'Renouvellement proche'}
                                                        {p.status === 'EXPIRED' && 'À renouveler'}
                                                        {p.status === 'REQUESTED' && 'Demandé'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-slate-500 mt-0.5">{p.type}</p>
                                            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 mt-1">
                                                {p.assignedAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconCalendarStats size={11} stroke={1.7} />
                                                        Attribué {new Date(p.assignedAt).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                                {p.expiresAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconCircleCheck size={11} stroke={1.7} />
                                                        Validité {new Date(p.expiresAt).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                            </div>
                                            {(p.status === 'EXPIRED' || p.status === 'EXPIRING') && (
                                                <button
                                                    type="button"
                                                    onClick={() => requestReplacement(p)}
                                                    className="mt-2 text-[12.5px] font-medium text-emerald-700"
                                                >
                                                    Demander un remplacement →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <button
                    type="button"
                    onClick={() => navigate('/m/profile')}
                    className="w-full mt-5 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-[13px]"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Retour
                </button>
            </section>
        </>
    );
}
