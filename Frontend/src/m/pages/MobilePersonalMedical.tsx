/**
 * MobilePersonalMedical — Suivi medical personnel (visites, aptitudes).
 * Donnees sensibles : exige une re-authentification biometrique
 * conformement au RGPD / HSE confidentialite donnees de sante.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconStethoscope, IconArrowLeft, IconLockOpen, IconAlertOctagon, IconCalendarStats } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { requireBiometric } from '../services/biometricService';

interface MedicalVisit {
    id: number;
    type: string;
    visitedAt: string;
    nextDueAt?: string;
    fitness?: 'FIT' | 'FIT_WITH_RESTRICTIONS' | 'UNFIT' | 'PENDING';
    practitioner?: string;
    restrictions?: string[];
}

export default function MobilePersonalMedical() {
    useStatusBarColor('#0EA5E9', 'LIGHT');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [unlocked, setUnlocked] = useState(false);
    const [items, setItems] = useState<MedicalVisit[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await requireBiometric('Acces dossier medical');
            if (cancelled) return;
            if (!res.granted) {
                setAuthError(res.error ?? 'Authentification refusee');
                return;
            }
            setUnlocked(true);
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!unlocked || !userId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<MedicalVisit[]>({
                    endpoint: `/hns/mobile/medical/personal/${userId}`,
                    cacheStore: 'userProfileCache',
                    cacheKey: `medical-${userId}`,
                    ttlMs: 6 * 60 * 60 * 1000,
                });
                if (!cancelled) setItems(Array.isArray(res.data) ? res.data : []);
            } catch (_e) {
                if (!cancelled) {
                    setError('Dossier medical indisponible. Verifiez votre connexion.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [unlocked, userId]);

    if (authError) {
        return (
            <>
                <MobileTopBar title="Dossier medical" accent="#0EA5E9" onBack={() => navigate('/m/profile')} />
                <section className="px-4 pt-8 text-center">
                    <IconLockOpen size={32} stroke={1.6} className="text-sky-500 mx-auto mb-2" />
                    <p className="text-[14px] font-semibold text-slate-800 mb-1">Acces verrouille</p>
                    <p className="text-[12.5px] text-slate-500 mb-4">{authError}</p>
                    <button
                        type="button"
                        onClick={() => { setAuthError(null); window.location.reload(); }}
                        className="px-4 py-2 rounded-lg bg-sky-600 text-white text-[13px] font-medium"
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
                <MobileTopBar title="Dossier medical" accent="#0EA5E9" />
                <section className="px-4 pt-12 text-center text-slate-400 text-[13px]">
                    Authentification en cours…
                </section>
            </>
        );
    }

    const fitnessLabel = (f?: MedicalVisit['fitness']) => {
        switch (f) {
            case 'FIT': return { txt: 'Apte', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
            case 'FIT_WITH_RESTRICTIONS': return { txt: 'Apte avec restrictions', tone: 'bg-amber-50 border-amber-200 text-amber-800' };
            case 'UNFIT': return { txt: 'Inapte', tone: 'bg-rose-50 border-rose-200 text-rose-800' };
            case 'PENDING': return { txt: 'En attente', tone: 'bg-slate-50 border-slate-200 text-slate-700' };
            default: return null;
        }
    };

    return (
        <>
            <MobileTopBar
                title="Mon suivi medical"
                subtitle="Donnees confidentielles RGPD"
                accent="#0EA5E9"
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
                        <IconStethoscope size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">Aucune visite medicale enregistree</p>
                        <p className="text-[12.5px] text-slate-500">
                            La premiere visite d'embauche n'a pas encore ete consignee.
                        </p>
                    </div>
                )}
                {items && items.length > 0 && (
                    <ul className="space-y-2.5">
                        {items.map((m) => {
                            const fit = fitnessLabel(m.fitness);
                            return (
                                <li key={m.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                                            <IconStethoscope size={20} stroke={1.8} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-[14px] font-semibold text-slate-900">{m.type}</h3>
                                                {fit && (
                                                    <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-full border ${fit.tone}`}>
                                                        {fit.txt}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 mt-1 flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <IconCalendarStats size={11} stroke={1.7} />
                                                    Visite {new Date(m.visitedAt).toLocaleDateString('fr-FR')}
                                                </span>
                                                {m.nextDueAt && (
                                                    <span>Prochaine {new Date(m.nextDueAt).toLocaleDateString('fr-FR')}</span>
                                                )}
                                                {m.practitioner && <span>Dr {m.practitioner}</span>}
                                            </div>
                                            {m.restrictions && m.restrictions.length > 0 && (
                                                <ul className="mt-1.5 text-[11.5px] text-amber-800 list-disc list-inside space-y-0.5">
                                                    {m.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                                                </ul>
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
