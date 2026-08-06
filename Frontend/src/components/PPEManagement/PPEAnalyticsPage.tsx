import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '@mantine/charts';
import { IconArrowDownRight, IconArrowUpRight, IconChartBar, IconCoin, IconPackage, IconRefresh } from '@tabler/icons-react';
import PageHeader from '../UtilityComp/PageHeader';
import SegmentedFilter from '../UtilityComp/SegmentedFilter';
import EmptyState from '../UtilityComp/EmptyState';
import { getPpeDashboard } from '../../services/PPEDashboardService';
import { ppeCategoryLabel } from './ppeLabels';

/**
 * Tableau de bord décisionnel EPI (incrément 6) : valorisation du stock, flux
 * valorisés (réceptions / distributions / retours / ajustements) et EPI les plus
 * consommés — le tout dérivé du journal de mouvements, sans donnée fabriquée.
 */
const PERIODS = [
    { value: '30', label: '30 jours' },
    { value: '90', label: '90 jours' },
    { value: '365', label: '12 mois' },
    { value: 'ALL', label: 'Tout' },
];

const MOVEMENT_LABELS: Record<string, { label: string; positive: boolean }> = {
    RECEIPT: { label: 'Réceptions', positive: true },
    ISSUE: { label: 'Distributions', positive: false },
    RETURN: { label: 'Retours', positive: true },
    ADJUSTMENT: { label: 'Ajustements', positive: true },
};

const isoDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    // yyyy-MM-dd en heure locale (évite le décalage UTC de toISOString).
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const PPEAnalyticsPage = () => {
    const [period, setPeriod] = useState('90');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        const from = period === 'ALL' ? undefined : isoDaysAgo(Number(period));
        getPpeDashboard(from)
            .then(setData)
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(load, [period]);

    const fmtMoney = (v: number) => {
        const cur = data?.currency || 'XOF';
        return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v || 0)} ${cur}`;
    };

    const categoryChart = useMemo(
        () =>
            (data?.valueByCategory || []).map((c: any) => ({
                category: ppeCategoryLabel(c.category),
                Valeur: c.value,
            })),
        [data]
    );

    const movementByType = useMemo(() => {
        const map: Record<string, any> = {};
        (data?.movements || []).forEach((m: any) => (map[m.type] = m));
        return map;
    }, [data]);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI', to: '/ppe-management' },
                    { label: 'Analyse & valorisation' },
                ]}
                icon={<IconChartBar size={22} stroke={2} />}
                iconColor="amber"
                title="Analyse & valorisation"
                subtitle="Valeur du stock et flux valorisés — pour arbitrer les réapprovisionnements et le budget EPI."
                actions={
                    <SegmentedFilter
                        value={period}
                        onChange={setPeriod}
                        options={PERIODS.map((p) => ({ value: p.value, label: p.label, color: 'teal' }))}
                    />
                }
            />

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
            ) : !data ? (
                <EmptyState icon={<IconChartBar size={24} />} title="Aucune donnée à analyser" compact />
            ) : (
                <>
                    {/* Valorisation */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard icon={<IconCoin size={18} />} label="Valeur du stock" value={fmtMoney(data.stockValueTotal)} accent="amber" />
                        <KpiCard icon={<IconPackage size={18} />} label="Références" value={String(data.totalReferences)} sub={`${data.totalUnitsInStock} unités`} accent="slate" />
                        <KpiCard icon={<IconArrowDownRight size={18} />} label="Stock bas" value={String(data.lowStockCount)} accent="orange" />
                        <KpiCard icon={<IconArrowDownRight size={18} />} label="Ruptures" value={String(data.outOfStockCount)} accent="rose" />
                    </div>

                    {/* Flux valorisés */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['RECEIPT', 'ISSUE', 'RETURN', 'ADJUSTMENT'].map((type) => {
                            const m = movementByType[type] || { quantity: 0, value: 0 };
                            const cfg = MOVEMENT_LABELS[type];
                            return (
                                <div key={type} className="bg-white rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-1.5 text-slate-500 text-[12px]">
                                        {cfg.positive ? <IconArrowUpRight size={14} className="text-emerald-600" /> : <IconArrowDownRight size={14} className="text-rose-600" />}
                                        {cfg.label}
                                    </div>
                                    <p className="text-[20px] font-semibold text-slate-800 mt-1 tabular-nums">{m.quantity}</p>
                                    <p className="text-[12px] text-slate-500">{fmtMoney(m.value)}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Valeur par catégorie */}
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-slate-200">
                                <h2 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}>
                                    Valeur du stock par catégorie
                                </h2>
                            </header>
                            <div className="p-4">
                                {categoryChart.length ? (
                                    <BarChart
                                        h={260}
                                        data={categoryChart}
                                        dataKey="category"
                                        series={[{ name: 'Valeur', color: 'amber.5' }]}
                                        tickLine="y"
                                        valueFormatter={(v) => fmtMoney(v)}
                                    />
                                ) : (
                                    <p className="text-[12.5px] text-slate-500 py-8 text-center">Aucune valorisation disponible.</p>
                                )}
                            </div>
                        </section>

                        {/* Top consommation */}
                        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}>
                                    EPI les plus distribués
                                </h2>
                                <span className="text-[11.5px] text-slate-400">
                                    Écart d'inventaire net : <span className="tabular-nums">{data.inventoryAdjustmentUnits > 0 ? `+${data.inventoryAdjustmentUnits}` : data.inventoryAdjustmentUnits}</span>
                                </span>
                            </header>
                            <div className="p-2">
                                {data.topConsumed?.length ? (
                                    <table className="w-full text-[13px]">
                                        <thead className="bg-slate-50 text-slate-500 text-[12px]">
                                            <tr>
                                                <th className="text-left p-2 font-medium">EPI</th>
                                                <th className="text-left p-2 font-medium">Catégorie</th>
                                                <th className="text-right p-2 font-medium">Distribué</th>
                                                <th className="text-right p-2 font-medium">Valeur</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topConsumed.map((c: any) => (
                                                <tr key={c.ppeId} className="border-t border-slate-100">
                                                    <td className="p-2 text-slate-800">{c.name}</td>
                                                    <td className="p-2 text-slate-500">{ppeCategoryLabel(c.category)}</td>
                                                    <td className="p-2 text-right tabular-nums">{c.quantity}</td>
                                                    <td className="p-2 text-right tabular-nums">{fmtMoney(c.value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-[12.5px] text-slate-500 py-8 text-center flex items-center justify-center gap-2">
                                        <IconRefresh size={14} /> Aucune distribution sur la période.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

const ACCENTS: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

const KpiCard = ({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${ACCENTS[accent]}`}>{icon}</span>
            <span className="text-[12px] text-slate-500">{label}</span>
        </div>
        <p className="text-[22px] font-semibold text-slate-800 mt-2 tabular-nums leading-none">{value}</p>
        {sub && <p className="text-[11.5px] text-slate-400 mt-1">{sub}</p>}
    </div>
);

export default PPEAnalyticsPage;
