/**
 * MobilePersonalTrainings — Vue lecture seule des formations + habilitations.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCertificate, IconArrowLeft, IconCalendarStats, IconAlertOctagon } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { ListSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';

interface Training {
    id: number;
    title: string;
    type?: string;
    obtainedAt?: string;
    expiresAt?: string;
    issuer?: string;
    status?: 'VALID' | 'EXPIRING' | 'EXPIRED';
}

export default function MobilePersonalTrainings() {
    useStatusBarColor('#6D28D9', 'LIGHT');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 0);

    const [items, setItems] = useState<Training[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<Training[]>({
                    endpoint: `/hns/mobile/trainings/personal/${userId}`,
                    cacheStore: 'userProfileCache',
                    cacheKey: `trainings-${userId}`,
                    ttlMs: 24 * 60 * 60 * 1000,
                });
                if (!cancelled) setItems(Array.isArray(res.data) ? res.data : []);
            } catch (_e) {
                if (!cancelled) {
                    setError('Formations indisponibles. Vérifiez votre connexion.');
                    setItems([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    return (
        <>
            <MobileTopBar
                title="Mes formations"
                subtitle="Habilitations et certifications"
                accent="#6D28D9"
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
                        <IconCertificate size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">Aucune formation enregistrée</p>
                        <p className="text-[12.5px] text-slate-500">
                            Demandez l'inscription à une formation HSE auprès de votre responsable.
                        </p>
                    </div>
                )}
                {items && items.length > 0 && (
                    <ul className="space-y-2.5">
                        {items.map((t) => {
                            const tone =
                                t.status === 'EXPIRED' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                t.status === 'EXPIRING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                'bg-violet-50 border-violet-200 text-violet-800';
                            return (
                                <li key={t.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                                            <IconCertificate size={20} stroke={1.8} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-[14px] font-semibold text-slate-900">{t.title}</h3>
                                                {t.status && (
                                                    <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-full border ${tone}`}>
                                                        {t.status === 'VALID' && 'Valide'}
                                                        {t.status === 'EXPIRING' && 'À renouveler bientôt'}
                                                        {t.status === 'EXPIRED' && 'Expirée'}
                                                    </span>
                                                )}
                                            </div>
                                            {t.type && <p className="text-[12px] text-slate-500 mt-0.5">{t.type}</p>}
                                            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 mt-1 flex-wrap">
                                                {t.obtainedAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconCalendarStats size={11} stroke={1.7} />
                                                        Obtenue {new Date(t.obtainedAt).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                                {t.expiresAt && (
                                                    <span>Validité {new Date(t.expiresAt).toLocaleDateString('fr-FR')}</span>
                                                )}
                                                {t.issuer && <span>{t.issuer}</span>}
                                            </div>
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
