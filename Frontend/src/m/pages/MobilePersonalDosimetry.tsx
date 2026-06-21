/**
 * MobilePersonalDosimetry — Vue lecture seule de la dosimetrie personnelle.
 * Donnees sensibles : exige une re-authentification biometrique avant
 * affichage (Phase M3 — securite renforcee pour donnees de sante).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconRadioactive, IconArrowLeft, IconLockOpen, IconAlertOctagon } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { requireBiometric } from '../services/biometricService';

interface DosimetryRecord {
    id: number;
    period: string; // "2026-Q1"
    cumulativeDoseMSv: number;
    annualLimitMSv: number;
    measuredAt?: string;
    badge?: string;
    status?: 'NORMAL' | 'WARNING' | 'ALERT';
}

export default function MobilePersonalDosimetry() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [unlocked, setUnlocked] = useState(false);
    const [items, setItems] = useState<DosimetryRecord[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    // Etape 1 : demande biometrique avant tout
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await requireBiometric('Acces dosimetrie personnelle');
            if (cancelled) return;
            if (!res.granted) {
                setAuthError(res.error ?? 'Authentification refusee');
                return;
            }
            setUnlocked(true);
        })();
        return () => { cancelled = true; };
    }, []);

    // Etape 2 : fetch apres unlock
    useEffect(() => {
        if (!unlocked || !userId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<DosimetryRecord[]>({
                    endpoint: `/hns/mobile/dosimetry/personal/${userId}`,
                    cacheStore: 'userProfileCache',
                    cacheKey: `dosimetry-${userId}`,
                    ttlMs: 12 * 60 * 60 * 1000, // 12h car donnees sensibles
                });
                if (!cancelled) setItems(res.data);
            } catch (_e) {
                if (!cancelled) {
                    setError('Dosimetrie indisponible. Verifiez votre connexion.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [unlocked, userId]);

    if (authError) {
        return (
            <>
                <MobileTopBar title="Dosimetrie" accent="#B45309" onBack={() => navigate('/m/profile')} />
                <section className="px-4 pt-8 text-center">
                    <IconLockOpen size={32} stroke={1.6} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-[14px] font-semibold text-slate-800 mb-1">Acces verrouille</p>
                    <p className="text-[12.5px] text-slate-500 mb-4">{authError}</p>
                    <button
                        type="button"
                        onClick={() => { setAuthError(null); window.location.reload(); }}
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[13px] font-medium"
                        style={{ minHeight: 44 }}
                    >
                        Reessayer
                    </button>
                </section>
            </>
        );
    }

    if (!unlocked) {
        return (
            <>
                <MobileTopBar title="Dosimetrie" accent="#B45309" />
                <section className="px-4 pt-12 text-center text-slate-400 text-[13px]">
                    Authentification en cours…
                </section>
            </>
        );
    }

    return (
        <>
            <MobileTopBar
                title="Ma dosimetrie"
                subtitle="Donnees confidentielles ISO 45001"
                accent="#B45309"
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
                    <ListSkeleton count={3} />
                )}
                {items && items.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <IconRadioactive size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">Aucune mesure enregistree</p>
                        <p className="text-[12.5px] text-slate-500">
                            Vous n'etes pas affecte a une zone surveillee.
                        </p>
                    </div>
                )}
                {items && items.length > 0 && (
                    <ul className="space-y-2.5">
                        {items.map((d) => {
                            const ratio = d.annualLimitMSv > 0 ? Math.min(1, d.cumulativeDoseMSv / d.annualLimitMSv) : 0;
                            const tone =
                                d.status === 'ALERT' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                d.status === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                'bg-emerald-50 border-emerald-200 text-emerald-800';
                            const bar =
                                d.status === 'ALERT' ? 'bg-rose-600' :
                                d.status === 'WARNING' ? 'bg-amber-500' :
                                'bg-emerald-500';
                            return (
                                <li key={d.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                            <IconRadioactive size={20} stroke={1.8} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-[14px] font-semibold text-slate-900">{d.period}</h3>
                                                {d.status && (
                                                    <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-full border ${tone}`}>
                                                        {d.status === 'NORMAL' && 'Normal'}
                                                        {d.status === 'WARNING' && 'Surveillance'}
                                                        {d.status === 'ALERT' && 'Seuil atteint'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-baseline gap-2 mt-1.5">
                                                <span className="text-[18px] font-semibold text-slate-900">
                                                    {d.cumulativeDoseMSv.toFixed(2)}
                                                </span>
                                                <span className="text-[11.5px] text-slate-500">
                                                    / {d.annualLimitMSv} mSv annuel
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
                                                <div
                                                    className={`${bar} h-full rounded-full transition-all`}
                                                    style={{ width: `${ratio * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 mt-1.5">
                                                {d.measuredAt && (
                                                    <span>Mesure {new Date(d.measuredAt).toLocaleDateString('fr-FR')}</span>
                                                )}
                                                {d.badge && <span>Badge {d.badge}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <p className="text-[11px] text-slate-400 mt-4 text-center px-2">
                    Reference ISO 45001 — limite reglementaire 20 mSv/an personnel expose
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/m/profile')}
                    className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-[13px]"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Retour
                </button>
            </section>
        </>
    );
}
