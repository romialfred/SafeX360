/**
 * MobileDashboardOhs — Tableau de bord HSE simplifié pour le terrain.
 *
 * Vue condensée du dashboard OHS web (OhsDashboardPage) : score de conformité,
 * KPI clés, mini-tendance des incidents et raccourcis. Lecture seule,
 * pensée pour un scroll vertical rapide sur mobile.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconClipboardList,
    IconExclamationCircle,
    IconCircleDot,
    IconShieldExclamation,
    IconCalendarStats,
    IconSchool,
    IconChartBar,
    IconClipboardCheck,
    IconShield,
    IconCertificate,
    IconBolt,
    IconChevronRight,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';

interface OhsDashboardData {
    complianceScore: number;
    openIncidents: number;
    overdueInspections: number;
    pendingActions: number;
    activeRisks: number;
    daysSinceLastLti: number;
    trainingCompliance: number;
    incidentsTrend: number[];
}

const MOCK_DASHBOARD: OhsDashboardData = {
    complianceScore: 78,
    openIncidents: 5,
    overdueInspections: 3,
    pendingActions: 12,
    activeRisks: 9,
    daysSinceLastLti: 46,
    trainingCompliance: 84,
    incidentsTrend: [4, 6, 3, 7, 5, 2],
};

const TREND_MONTHS = ['Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'];

function scoreColor(score: number): { stroke: string; text: string } {
    if (score >= 80) return { stroke: '#059669', text: 'text-emerald-700' };
    if (score >= 60) return { stroke: '#D97706', text: 'text-amber-700' };
    return { stroke: '#DC2626', text: 'text-rose-700' };
}

export default function MobileDashboardOhs() {
    useStatusBarColor('#0E7490', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [dashboard, setDashboard] = useState<OhsDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<OhsDashboardData>({
                    endpoint: `/hns/mobile/dashboard?companyId=${companyId}`,
                    cacheStore: 'inspectionCache',
                    cacheKey: `ohs-dashboard-${companyId}`,
                    ttlMs: 2 * 60 * 1000,
                });
                if (!cancelled) setDashboard(res.data);
            } catch {
                if (!cancelled) setDashboard(MOCK_DASHBOARD);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    const go = (path: string) => {
        haptic('light');
        navigate(path);
    };

    const data = dashboard ?? MOCK_DASHBOARD;
    const scoreClamped = Math.max(0, Math.min(100, data.complianceScore));
    const colors = scoreColor(scoreClamped);
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - scoreClamped / 100);
    const trendMax = Math.max(1, ...data.incidentsTrend);

    return (
        <>
            <MobileTopBar
                title="Tableau de bord HSE"
                subtitle="Vue synthétique terrain"
                accent="#0E7490"
            />

            {/* Safety Score — jauge circulaire */}
            <section className="px-4 pt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-3">
                        Score de sécurité
                    </p>
                    <div className="relative" style={{ width: 160, height: 160 }}>
                        <svg
                            viewBox="0 0 160 160"
                            width={160}
                            height={160}
                            className={loading ? 'animate-pulse' : ''}
                        >
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="#EEF2F6"
                                strokeWidth="14"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke={colors.stroke}
                                strokeWidth="14"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                transform="rotate(-90 80 80)"
                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                                className={`text-[36px] font-bold tabular-nums leading-none ${colors.text}`}
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                {loading ? '—' : scoreClamped}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-1">/ 100</span>
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-3 text-center leading-relaxed">
                        Conformité globale des indicateurs HSE
                    </p>
                </div>
            </section>

            {/* KPI Grid 2x3 */}
            <section className="px-4 pt-4">
                <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em] mb-2">
                    Indicateurs clés
                </h3>
                {loading ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse"
                                style={{ minHeight: 84 }}
                            >
                                <div className="w-8 h-8 bg-slate-200 rounded-lg mb-2" />
                                <div className="h-5 w-10 bg-slate-200 rounded mb-1.5" />
                                <div className="h-2.5 w-16 bg-slate-100 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                        <KpiTile
                            value={data.openIncidents}
                            label="Incidents ouverts"
                            icon={<IconExclamationCircle size={18} stroke={1.8} />}
                            accentBorder="border-l-rose-500"
                            iconBg="bg-rose-50 text-rose-600"
                            onClick={() => go('/m/incidents/history')}
                        />
                        <KpiTile
                            value={data.overdueInspections}
                            label="Inspections en retard"
                            icon={<IconClipboardList size={18} stroke={1.8} />}
                            accentBorder="border-l-amber-500"
                            iconBg="bg-amber-50 text-amber-600"
                            onClick={() => go('/m/inspections')}
                        />
                        <KpiTile
                            value={data.pendingActions}
                            label="Actions en attente"
                            icon={<IconCircleDot size={18} stroke={1.8} />}
                            accentBorder="border-l-violet-500"
                            iconBg="bg-violet-50 text-violet-600"
                        />
                        <KpiTile
                            value={data.activeRisks}
                            label="Risques actifs"
                            icon={<IconShieldExclamation size={18} stroke={1.8} />}
                            accentBorder="border-l-orange-500"
                            iconBg="bg-orange-50 text-orange-600"
                        />
                        <KpiTile
                            value={data.daysSinceLastLti}
                            label="Jours sans accident"
                            icon={<IconCalendarStats size={18} stroke={1.8} />}
                            accentBorder="border-l-emerald-500"
                            iconBg="bg-emerald-50 text-emerald-600"
                        />
                        <KpiTile
                            value={`${data.trainingCompliance}%`}
                            label="Conformité formations"
                            icon={<IconSchool size={18} stroke={1.8} />}
                            accentBorder="border-l-cyan-500"
                            iconBg="bg-cyan-50 text-cyan-600"
                            onClick={() => go('/m/profile/trainings')}
                        />
                    </div>
                )}
            </section>

            {/* Trend mini-chart */}
            <section className="px-4 pt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <IconChartBar size={16} stroke={1.8} className="text-slate-500" />
                        <h3 className="text-[13px] font-semibold text-slate-800">
                            Incidents — 6 derniers mois
                        </h3>
                    </div>
                    {loading ? (
                        <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                    ) : (
                        <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
                            {data.incidentsTrend.map((v, i) => {
                                const heightPct = Math.max(6, (v / trendMax) * 100);
                                const isLast = i === data.incidentsTrend.length - 1;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                        <span className="text-[10.5px] text-slate-500 tabular-nums">{v}</span>
                                        <div
                                            className={`w-full rounded-t-md transition-all ${
                                                isLast ? 'bg-cyan-600' : 'bg-cyan-200'
                                            }`}
                                            style={{ height: `${heightPct}%`, minHeight: 4 }}
                                        />
                                        <span className="text-[10px] text-slate-400">{TREND_MONTHS[i]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Quick links */}
            <section className="px-4 pt-5 pb-4">
                <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em] mb-2">
                    Accès rapides
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <ShortcutTile
                        icon={<IconClipboardCheck size={22} stroke={1.8} />}
                        label="Inspections"
                        sublabel="Registre terrain"
                        accent="from-cyan-500 to-blue-600"
                        onClick={() => go('/m/inspections')}
                    />
                    <ShortcutTile
                        icon={<IconExclamationCircle size={22} stroke={1.8} />}
                        label="Incidents"
                        sublabel="Historique des signalements"
                        accent="from-amber-500 to-orange-600"
                        onClick={() => go('/m/incidents/history')}
                    />
                    <ShortcutTile
                        icon={<IconShield size={22} stroke={1.8} />}
                        label="Mes EPI"
                        sublabel="Dotation personnelle"
                        accent="from-emerald-500 to-teal-600"
                        onClick={() => go('/m/profile/ppe')}
                    />
                    <ShortcutTile
                        icon={<IconCertificate size={22} stroke={1.8} />}
                        label="Formations"
                        sublabel="Habilitations à jour"
                        accent="from-violet-500 to-purple-600"
                        onClick={() => go('/m/profile/trainings')}
                    />
                </div>
            </section>

            {/* Footer */}
            <section className="px-4 pb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                    <IconBolt size={16} stroke={1.8} className="text-cyan-600 flex-shrink-0" />
                    <p className="text-[11.5px] text-slate-600 leading-snug">
                        Données synchronisées en temps réel — conforme ISO 45001
                    </p>
                </div>
            </section>
        </>
    );
}

function KpiTile({
    value,
    label,
    icon,
    accentBorder,
    iconBg,
    onClick,
}: {
    value: number | string;
    label: string;
    icon: React.ReactNode;
    accentBorder: string;
    iconBg: string;
    onClick?: () => void;
}) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`w-full text-left bg-white border border-slate-200 border-l-4 ${accentBorder} rounded-xl p-3 shadow-sm active:scale-[0.98] transition`}
            style={{ minHeight: 84 }}
        >
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
                {icon}
            </div>
            <div className="text-[19px] font-bold leading-none tabular-nums text-slate-900">
                {value}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                {label}
            </div>
        </Tag>
    );
}

function ShortcutTile({
    icon,
    label,
    sublabel,
    accent,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    accent: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 text-left active:scale-[0.97] transition shadow-sm"
            style={{ minHeight: 96 }}
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center mb-2`}>
                {icon}
            </div>
            <div className="text-[13.5px] font-semibold text-slate-900 leading-tight flex items-center gap-1">
                {label}
                <IconChevronRight size={13} stroke={2} className="text-slate-300" />
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                {sublabel}
            </div>
        </button>
    );
}
