/**
 * MobileBlastNext — Prochain tir confirme avec compte a rebours +
 * acces direct a l'alarme d'evacuation (composant existant reutilise).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconBolt,
    IconMapPin,
    IconClock,
    IconArrowLeft,
    IconCalendarStats,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { getCached } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import BlastEvacuationAlarm from '../../components/Blast/BlastEvacuationAlarm';
import { formatZoneScope } from '../../components/Blast/formatZone';

interface NextBlastSummary {
    id: number;
    reference: string;
    scheduledAt: string;
    zone: string;
    secondsUntil: number;
    status: string;
}

interface DashboardSummary {
    nextConfirmedBlast: NextBlastSummary | null;
    upcomingThisWeekCount: number;
    upcomingThisWeek: Array<{ id: number; reference: string; scheduledAt: string; pit?: string }>;
}

function formatCountdown(secondsUntil: number): string {
    if (secondsUntil <= 0) return 'En cours';
    const h = Math.floor(secondsUntil / 3600);
    const m = Math.floor((secondsUntil % 3600) / 60);
    const s = secondsUntil % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
    if (m > 0) return `${m}min ${s.toString().padStart(2, '0')}s`;
    return `${s}s`;
}

export default function MobileBlastNext() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    // Le backend exige mineId en query param (@RequestParam obligatoire) —
    // sans lui la requête renvoyait 400.
    const mineId = Number(user?.mineId ?? user?.companyId ?? 1);
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [now, setNow] = useState<number>(() => Date.now());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<DashboardSummary>({
                    endpoint: `/hns/blast/dashboard/summary?mineId=${mineId}`,
                    cacheStore: 'blastCache',
                    // Clé par mine : une clé constante servait le tir de
                    // l'ancienne mine après changement de site (repli hors ligne)
                    cacheKey: `dashboard-${mineId}`,
                    ttlMs: 30 * 1000,
                });
                if (!cancelled) setData(res.data);
            } catch (e) {
                if (!cancelled) setError('Aucun tir programmé ou serveur indisponible.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [mineId]);

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const next = data?.nextConfirmedBlast ?? null;
    const secondsUntil = next
        ? Math.floor((new Date(next.scheduledAt).getTime() - now) / 1000)
        : 0;

    return (
        <>
            <MobileTopBar
                title="Prochain tir"
                subtitle="Compte à rebours et alarme"
                accent="#B45309"
                onBack={() => navigate('/m/home')}
            />

            {/* Alarme integree (T-10 + T-0) */}
            {next && (
                <BlastEvacuationAlarm
                    blastReference={next.reference}
                    zone={next.zone}
                    scheduledAtIso={next.scheduledAt}
                    blastId={next.id}
                />
            )}

            <section className="px-4 pt-4">
                {!data && !error && (
                    <div className="space-y-3">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                )}

                {error && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                        <IconBolt size={28} stroke={1.6} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">
                            Aucun tir confirmé
                        </p>
                        <p className="text-[12.5px] text-slate-500">{error}</p>
                    </div>
                )}

                {next && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <IconBolt size={20} stroke={1.8} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10.5px] uppercase tracking-[0.16em] text-amber-700">
                                    Référence
                                </p>
                                <p className="text-[14px] font-mono text-slate-900">{next.reference}</p>
                            </div>
                        </div>

                        <p
                            className="text-amber-900 tabular-nums mb-3"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '38px',
                                lineHeight: 1,
                            }}
                        >
                            {formatCountdown(secondsUntil)}
                        </p>

                        <div className="space-y-1.5 text-[13px] text-slate-700">
                            <div className="flex items-center gap-1.5">
                                <IconClock size={14} stroke={1.7} className="text-slate-400" />
                                <span className="font-mono">{new Date(next.scheduledAt).toLocaleString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <IconMapPin size={14} stroke={1.7} className="text-slate-400" />
                                <span className="font-medium text-slate-900">{formatZoneScope(next.zone)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {data && Array.isArray(data.upcomingThisWeek) && data.upcomingThisWeek.length > 1 && (
                    <div className="mt-5">
                        <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                            Cette semaine
                        </h3>
                        <ul className="space-y-2">
                            {data.upcomingThisWeek.slice(0, 5).map((b) => (
                                <li
                                    key={b.id}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2.5"
                                >
                                    <IconCalendarStats size={16} stroke={1.6} className="text-slate-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[12.5px] font-medium text-slate-900 truncate font-mono">{b.reference}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {new Date(b.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                            {b.pit && ` · ${b.pit}`}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/m/home')}
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
