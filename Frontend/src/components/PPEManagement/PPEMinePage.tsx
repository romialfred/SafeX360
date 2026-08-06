import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select } from '@mantine/core';
import {
    IconChartBar, IconClipboardList, IconCoin, IconHelmet, IconPlus, IconUser, IconUsers,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { getAllPPE } from '../../services/PPEService';
import { getPpeByEmp } from '../../services/PpeEmpService';
import { getPpeConsumption } from '../../services/PPEMineService';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';
import { ppeCategoryLabel } from './ppeLabels';

/**
 * « Mes EPI » — page personnelle liée au profil de l'utilisateur connecté.
 * Historique des dotations, valorisation, et comparaison de la consommation / du
 * coût par rapport au département, aux postes similaires et à l'ensemble des
 * employés. L'utilisateur peut faire une demande pour lui-même ou un autre employé.
 */

const fmtFcfa = (v?: number) => {
    if (v == null) return '—';
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M FCFA`;
    if (a >= 1e3) return `${Math.round(v / 1e3).toLocaleString('fr-FR')} k FCFA`;
    return `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
};
const fmtInt = (v?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));
const norm = (s?: string) => (s || '').trim().toLowerCase();

const fmtDate = (d?: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR');
};

type Emp = { id: number; name: string; department?: string; position?: string; email?: string };

const PPEMinePage = () => {
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);

    const [employees, setEmployees] = useState<Emp[]>([]);
    const [consumption, setConsumption] = useState<Record<number, { quantity: number; cost: number }>>({});
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [attributions, setAttributions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getEmployeesWithDepartment().catch(() => []),
            getPpeConsumption().catch(() => []),
            getAllPPE().catch(() => []),
        ]).then(([emps, cons, ppes]: any[]) => {
            const list: Emp[] = (emps || []).map((e: any) => ({
                id: e.id,
                name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || `Employé #${e.id}`,
                department: e.department,
                position: e.position,
                email: e.email || e.professionalEmail,
            }));
            setEmployees(list);
            const cmap: Record<number, { quantity: number; cost: number }> = {};
            (cons || []).forEach((c: any) => { if (c.empId != null) cmap[c.empId] = { quantity: c.quantity, cost: c.cost }; });
            setConsumption(cmap);
            const pm: Record<string, any> = {};
            (ppes || []).forEach((p: any) => { pm[p.id] = p; });
            setPpeMap(pm);

            // Résolution de l'employé courant : email puis nom complet.
            const uEmail = norm(user?.email || user?.professionalEmail);
            const uName = norm([user?.firstName, user?.familyName ?? user?.lastName].filter(Boolean).join(' ') || user?.name);
            let me = uEmail ? list.find((e) => norm(e.email) === uEmail) : undefined;
            if (!me && uName) me = list.find((e) => norm(e.name) === uName);
            setSelectedId(me ? me.id : (list[0]?.id ?? null));
            setLoading(false);
        });
    }, [user]);

    useEffect(() => {
        if (selectedId == null) { setAttributions([]); return; }
        getPpeByEmp(selectedId).then((rows: any[]) => setAttributions(Array.isArray(rows) ? rows : [])).catch(() => setAttributions([]));
    }, [selectedId]);

    const selected = employees.find((e) => e.id === selectedId) || null;
    const isSelf = useMemo(() => {
        if (!selected) return false;
        const uEmail = norm(user?.email);
        const uName = norm([user?.firstName, user?.familyName ?? user?.lastName].filter(Boolean).join(' ') || user?.name);
        return (uEmail && norm(selected.email) === uEmail) || (uName && norm(selected.name) === uName);
    }, [selected, user]);

    const myCons = (selectedId != null && consumption[selectedId]) || { quantity: 0, cost: 0 };

    // Historique valorisé.
    const history = useMemo(() => attributions
        .filter((a) => (a.quantityIssued ?? 0) > 0 || (a.quantityApproved ?? 0) > 0)
        .map((a) => {
            const p = ppeMap[a.ppeId];
            const qty = a.quantityIssued ?? a.quantityApproved ?? 0;
            const price = p?.referencePrice ?? 0;
            return { id: a.id, name: p?.name || `EPI #${a.ppeId}`, category: p?.category, qty, cost: qty * price, date: a.date || a.createdAt };
        })
        .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()), [attributions, ppeMap]);

    // Comparaisons entre pairs (coût & quantité).
    const groups = useMemo(() => {
        const withCons = (ids: number[]) => ids.map((id) => consumption[id]).filter(Boolean) as { quantity: number; cost: number }[];
        const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
        const rank = (ids: number[], key: 'cost' | 'quantity') => {
            const vals = ids.map((id) => ({ id, v: consumption[id]?.[key] ?? 0 })).sort((a, b) => b.v - a.v);
            const pos = vals.findIndex((x) => x.id === selectedId);
            return { rank: pos >= 0 ? pos + 1 : null, total: vals.length };
        };
        const build = (label: string, ids: number[]) => {
            const cons = withCons(ids);
            return {
                label,
                count: ids.length,
                avgCost: avg(cons.map((c) => c.cost)),
                avgQty: avg(cons.map((c) => c.quantity)),
                rankCost: rank(ids, 'cost'),
            };
        };
        if (!selected) return [];
        const deptIds = employees.filter((e) => norm(e.department) === norm(selected.department)).map((e) => e.id);
        const posIds = employees.filter((e) => e.position && norm(e.position) === norm(selected.position)).map((e) => e.id);
        const allIds = employees.map((e) => e.id);
        return [
            build(`Département · ${selected.department || 'Sans département'}`, deptIds),
            build(`Poste · ${selected.position || 'Non précisé'}`, posIds),
            build('Tous les employés', allIds),
        ];
    }, [employees, consumption, selected, selectedId]);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Gestion des EPI', to: '/ppe-management' }, { label: 'Mes EPI' }]}
                icon={<IconHelmet size={22} stroke={2} />}
                iconColor="amber"
                title="Mes EPI"
                subtitle="Vos dotations, leur valorisation et votre situation par rapport à vos pairs."
                actions={
                    <Button color="teal" size="sm" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/request-matrix')}>
                        Faire une demande
                    </Button>
                }
            />

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
            ) : (
                <>
                    {/* Sélecteur employé (soi ou un autre) + profil */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <section className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700"><IconUser size={22} /></span>
                                    <div>
                                        <div className="text-[15px] font-semibold text-slate-800">{selected?.name || '—'} {isSelf && <span className="text-[11px] text-emerald-600 font-bold">(vous)</span>}</div>
                                        <div className="text-[12.5px] text-slate-500">{selected?.position || 'Poste non précisé'} · {selected?.department || 'Sans département'}</div>
                                    </div>
                                </div>
                                <Select
                                    label="Consulter un employé"
                                    placeholder="Choisir…"
                                    searchable
                                    size="xs"
                                    w={260}
                                    value={selectedId != null ? String(selectedId) : null}
                                    onChange={(v) => setSelectedId(v ? Number(v) : null)}
                                    data={employees.map((e) => ({ value: String(e.id), label: e.name }))}
                                />
                            </div>
                        </section>
                        <section className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 gap-3">
                            <div>
                                <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><IconClipboardList size={14} /> Dotations reçues</div>
                                <div className="text-[22px] font-black text-slate-800 tabular-nums mt-1">{fmtInt(myCons.quantity)}</div>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><IconCoin size={14} /> Valorisation</div>
                                <div className="text-[18px] font-black text-slate-800 tabular-nums mt-1">{fmtFcfa(myCons.cost)}</div>
                            </div>
                        </section>
                    </div>

                    {/* Comparaisons entre pairs */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {groups.map((g) => {
                            const ratio = g.avgCost > 0 ? myCons.cost / g.avgCost : 1;
                            const above = ratio > 1.05, below = ratio < 0.95;
                            return (
                                <section key={g.label} className="bg-white rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700 mb-3">
                                        <IconUsers size={15} className="text-slate-400" /> <span className="truncate">{g.label}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <CompareBar label="Votre coût" mine={myCons.cost} avg={g.avgCost} fmt={fmtFcfa} />
                                        <CompareBar label="Votre volume" mine={myCons.quantity} avg={g.avgQty} fmt={fmtInt} />
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[12px]">
                                        <span className="text-slate-500">{g.count} employé(s)</span>
                                        {g.rankCost.rank && (
                                            <span className={`font-semibold ${above ? 'text-rose-600' : below ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                {above ? 'Au-dessus' : below ? 'En dessous' : 'Dans la moyenne'} · {g.rankCost.rank}ᵉ/{g.rankCost.total} en coût
                                            </span>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                        {groups.length === 0 && <div className="lg:col-span-3"><EmptyState icon={<IconChartBar size={24} />} title="Sélectionnez un employé pour la comparaison" compact /></div>}
                    </div>

                    {/* Historique des dotations */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <header className="px-4 py-2.5 border-b border-slate-100">
                            <h2 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}>
                                Historique des dotations &amp; attributions
                            </h2>
                        </header>
                        <div className="p-2">
                            {history.length === 0 ? (
                                <EmptyState icon={<IconHelmet size={24} />} title="Aucune dotation pour cet employé" compact />
                            ) : (
                                <table className="w-full text-[13px]">
                                    <thead className="text-slate-400 text-[11.5px] tracking-wide">
                                        <tr>
                                            <th className="text-left font-semibold py-1.5 px-2">EPI</th>
                                            <th className="text-left font-semibold py-1.5 px-2">Catégorie</th>
                                            <th className="text-right font-semibold py-1.5 px-2">Quantité</th>
                                            <th className="text-right font-semibold py-1.5 px-2">Valeur</th>
                                            <th className="text-right font-semibold py-1.5 px-2">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.slice(0, 40).map((h) => (
                                            <tr key={h.id} className="border-t border-slate-100">
                                                <td className="py-2 px-2 text-slate-800 font-medium">{h.name}</td>
                                                <td className="py-2 px-2 text-slate-500">{ppeCategoryLabel(h.category)}</td>
                                                <td className="py-2 px-2 text-right tabular-nums text-slate-700">{fmtInt(h.qty)}</td>
                                                <td className="py-2 px-2 text-right tabular-nums text-slate-700">{fmtFcfa(h.cost)}</td>
                                                <td className="py-2 px-2 text-right tabular-nums text-slate-500">{fmtDate(h.date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

const CompareBar = ({ label, mine, avg, fmt }: { label: string; mine: number; avg: number; fmt: (v: number) => string }) => {
    const max = Math.max(mine, avg, 1);
    return (
        <div>
            <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-slate-600">{label}</span>
                <span className="tabular-nums text-slate-800 font-semibold">{fmt(mine)}</span>
            </div>
            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-teal-500" style={{ width: `${(mine / max) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] mt-0.5 text-slate-400">
                <span>Moyenne du groupe</span>
                <span className="tabular-nums">{fmt(avg)}</span>
            </div>
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300" style={{ width: `${(avg / max) * 100}%` }} />
            </div>
        </div>
    );
};

export default PPEMinePage;
