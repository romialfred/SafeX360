import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, RingProgress, Select } from '@mantine/core';
import {
    IconAward, IconCalendar, IconChevronRight, IconClipboardList, IconCoin, IconEyeglass2, IconHandStop,
    IconHeadphones, IconHelmet, IconMask, IconParachute, IconPlus, IconShieldCheck, IconShirt, IconShoe,
    IconTrendingUp, IconTrophy, IconUser, IconUsers,
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
 * « Mes EPI » — dotations, valorisation et positionnement de l'employé par rapport
 * à ses pairs (département / poste / entreprise). Rangs, moyennes et percentiles
 * calculés à partir des données réelles (aucune valeur en dur). L'utilisateur peut
 * consulter un autre employé et faire une demande.
 */

// ── Utilitaires ──────────────────────────────────────────────────────────────
const fmtFcfa = (v?: number) => {
    if (v == null) return '—';
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M FCFA`;
    if (a >= 1e3) return `${Math.round(v / 1e3).toLocaleString('fr-FR')} k FCFA`;
    return `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
};
const fmtInt = (v?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));
const norm = (s?: string) => (s || '').trim().toLowerCase();
const pctSafe = (v: number) => Math.min(100, Math.max(0, v));
const fmtDate = (d?: string) => { if (!d) return '—'; const dt = new Date(d); return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR'); };
const AV = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#6366f1', '#ec4899', '#f43f5e'];
const initials = (n: string) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
const avColor = (k: string) => AV[Math.abs([...(k || '?')].reduce((a, c) => a + c.charCodeAt(0), 0)) % AV.length];
const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

const CAT_ICON: Record<string, any> = {
    'Head protection': IconHelmet, 'Eye protection': IconEyeglass2, 'Hand protection': IconHandStop,
    'Foot protection': IconShoe, 'Hearing protection': IconHeadphones, 'Respiratory protection': IconMask,
    'Protective clothing': IconShirt, 'Fall protection': IconParachute,
};
const catIcon = (code?: string) => CAT_ICON[code || ''] || IconShieldCheck;

// Niveau qualitatif selon le percentile (position relative dans le groupe).
const posLevel = (percentile: number) => {
    if (percentile >= 90) return { label: 'Excellent', color: '#059669', ring: '#10b981' };
    if (percentile >= 75) return { label: 'Très bon', color: '#0d9488', ring: '#14b8a6' };
    if (percentile >= 50) return { label: 'Bon', color: '#2563eb', ring: '#3b82f6' };
    if (percentile >= 25) return { label: 'Correct', color: '#d97706', ring: '#f59e0b' };
    return { label: 'À surveiller', color: '#e11d48', ring: '#f43f5e' };
};

type Emp = { id: number; name: string; department?: string; position?: string; email?: string; matricule?: string; photo?: string; status?: string };

const PPEMinePage = () => {
    const navigate = useNavigate();
    const user = useAppSelector((s: any) => s.user);
    const [employees, setEmployees] = useState<Emp[]>([]);
    const [consumption, setConsumption] = useState<Record<number, { quantity: number; cost: number }>>({});
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [attributions, setAttributions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchBase = () => {
        setLoading(true); setError(false);
        Promise.all([getEmployeesWithDepartment(), getPpeConsumption().catch(() => []), getAllPPE().catch(() => [])])
            .then(([emps, cons, ppes]: any[]) => {
                const list: Emp[] = (emps || []).map((e: any) => ({
                    id: e.id, name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || `Employé #${e.id}`,
                    department: e.department, position: e.position, email: e.email || e.professionalEmail,
                    matricule: e.matricule || e.uniqueNumber || e.employeeNumber, photo: e.profilePicture || e.photoUrl,
                    status: e.status,
                }));
                setEmployees(list);
                const cmap: Record<number, { quantity: number; cost: number }> = {};
                (cons || []).forEach((c: any) => { if (c.empId != null) cmap[c.empId] = { quantity: c.quantity, cost: c.cost }; });
                setConsumption(cmap);
                const pm: Record<string, any> = {}; (ppes || []).forEach((p: any) => { pm[p.id] = p; }); setPpeMap(pm);
                const uEmail = norm(user?.email || user?.professionalEmail);
                const uName = norm([user?.firstName, user?.familyName ?? user?.lastName].filter(Boolean).join(' ') || user?.name);
                let me = uEmail ? list.find((e) => norm(e.email) === uEmail) : undefined;
                if (!me && uName) me = list.find((e) => norm(e.name) === uName);
                setSelectedId((prev) => prev ?? (me ? me!.id : list[0]?.id ?? null));
            })
            .catch(() => setError(true)).finally(() => setLoading(false));
    };
    useEffect(fetchBase, [user]);

    useEffect(() => {
        if (selectedId == null) { setAttributions([]); return; }
        let alive = true;
        getPpeByEmp(selectedId).then((rows: any[]) => { if (alive) setAttributions(Array.isArray(rows) ? rows : []); }).catch(() => { if (alive) setAttributions([]); });
        return () => { alive = false; };
    }, [selectedId]);

    const selected = employees.find((e) => e.id === selectedId) || null;
    const isSelf = useMemo(() => {
        if (!selected) return false;
        const uEmail = norm(user?.email); const uName = norm([user?.firstName, user?.familyName ?? user?.lastName].filter(Boolean).join(' ') || user?.name);
        return (!!uEmail && norm(selected.email) === uEmail) || (!!uName && norm(selected.name) === uName);
    }, [selected, user]);
    const myCons = (selectedId != null && consumption[selectedId]) || { quantity: 0, cost: 0 };

    // Rang dans un ensemble d'employés selon une clé (coût/quantité).
    const rankIn = (ids: number[], key: 'cost' | 'quantity') => {
        const vals = ids.map((id) => ({ id, v: consumption[id]?.[key] ?? 0 })).sort((a, b) => b.v - a.v);
        const pos = vals.findIndex((x) => x.id === selectedId);
        const rank = pos >= 0 ? pos + 1 : vals.length;
        const total = vals.length || 1;
        const percentile = Math.round(((total - rank) / total) * 100);
        return { rank, total, percentile };
    };

    const groups = useMemo(() => {
        if (!selected) return [];
        const withV = (ids: number[]) => ids.map((id) => consumption[id]).filter(Boolean) as { quantity: number; cost: number }[];
        const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
        const build = (type: string, label: string, ids: number[]) => {
            const v = withV(ids);
            return {
                type, label, count: ids.length,
                avgCost: avg(v.map((c) => c.cost)), avgQty: avg(v.map((c) => c.quantity)),
                cost: rankIn(ids, 'cost'), vol: rankIn(ids, 'quantity'),
            };
        };
        const deptIds = employees.filter((e) => norm(e.department) === norm(selected.department)).map((e) => e.id);
        const posIds = employees.filter((e) => e.position && norm(e.position) === norm(selected.position)).map((e) => e.id);
        const allIds = employees.map((e) => e.id);
        return [
            build('DEPARTMENT', `Comparaison · Département`, deptIds),
            build('JOB', `Comparaison · Poste`, posIds),
            build('COMPANY', `Comparaison · Tous les employés`, allIds),
        ];
    }, [employees, consumption, selected, selectedId]);

    const companyRank = groups.find((g) => g.type === 'COMPANY')?.cost || { rank: 0, total: 0, percentile: 0 };

    // Score de positionnement global (percentiles pondérés dépt/poste/entreprise).
    const global = useMemo(() => {
        if (!groups.length) return { score: 0, valuePct: 0, volumePct: 0 };
        const g = (t: string) => groups.find((x) => x.type === t);
        const dpt = g('DEPARTMENT'), job = g('JOB'), comp = g('COMPANY');
        const valuePct = comp?.cost.percentile ?? 0;
        const volumePct = comp?.vol.percentile ?? 0;
        const score = Math.round((dpt?.cost.percentile ?? valuePct) * 0.3 + (job?.cost.percentile ?? valuePct) * 0.3 + valuePct * 0.4);
        return { score: pctSafe(score), valuePct, volumePct };
    }, [groups]);
    const level = posLevel(global.score);

    const history = useMemo(() => attributions
        .filter((a) => (a.quantityIssued ?? 0) > 0 || (a.quantityApproved ?? 0) > 0)
        .map((a) => { const p = ppeMap[a.ppeId]; const qty = a.quantityIssued ?? a.quantityApproved ?? 0; return { id: a.id, name: p?.name || `EPI #${a.ppeId}`, category: p?.category, qty, cost: qty * (p?.referencePrice ?? 0), date: a.date || a.createdAt }; })
        .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()), [attributions, ppeMap]);

    if (error) return (
        <div className="p-5"><EmptyState icon={<IconShieldCheck size={26} />} title="Impossible de charger les informations EPI." description="Veuillez réessayer." compact
            action={<Button size="xs" color="teal" onClick={fetchBase}>Réessayer</Button>} /></div>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Gestion des EPI', to: '/ppe-management' }, { label: 'Mes EPI' }]}
                icon={<IconClipboardList size={22} stroke={2} />} iconColor="teal"
                title="Mes EPI" subtitle="Vos dotations, leur valorisation et votre situation par rapport à vos pairs."
                actions={<Button color="teal" size="sm" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/request-matrix')}>Faire une demande</Button>}
            />

            {loading && !selected ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">{[6, 2, 2, 2].map((c, i) => <div key={i} className={`xl:col-span-${c} h-28 rounded-xl bg-slate-100 animate-pulse`} />)}</div>
            ) : (
                <>
                    {/* Rangée identité / classement / sélecteur / KPI */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                        {/* Identité + classement */}
                        <section className="xl:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {selected?.photo ? (
                                    <Avatar src={selected.photo} radius="xl" size={64} alt={selected.name} />
                                ) : (
                                    <Avatar radius="xl" size={64} styles={{ placeholder: { background: avColor(selected?.name || ''), color: '#fff', fontSize: 22, fontWeight: 700 } }}>{initials(selected?.name || '')}</Avatar>
                                )}
                                <div className="min-w-0">
                                    <div className="text-[19px] font-bold text-slate-900 leading-tight truncate">{selected?.name || '—'}{isSelf && <span className="ml-2 text-[11px] text-emerald-600 font-bold align-middle">(vous)</span>}</div>
                                    <div className="text-[13px] text-slate-500 truncate">{selected?.position || 'Poste non précisé'} · {selected?.department || 'Sans département'}</div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{selected?.status && norm(selected.status) !== 'active' ? selected.status : 'Employé actif'}</span>
                                        <span className="text-[11.5px] text-slate-400">ID : {selected?.matricule || `EMP-${selected?.id ?? '—'}`}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Classement mis en avant */}
                            <RankBadge rank={companyRank.rank} total={companyRank.total} percentile={companyRank.percentile} />
                        </section>

                        {/* Sélecteur */}
                        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-center">
                            <div className="text-[12px] text-slate-500 font-semibold mb-1.5">Consulter un employé</div>
                            <Select value={selectedId != null ? String(selectedId) : null} onChange={(v) => setSelectedId(v ? Number(v) : null)} data={employees.map((e) => ({ value: String(e.id), label: e.name }))} searchable size="sm" aria-label="Sélectionner un employé" />
                        </section>

                        {/* Dotations */}
                        <KpiCard className="xl:col-span-2" icon={<IconUsers size={18} />} color="#14b8a6" label="Dotations reçues" value={fmtInt(myCons.quantity)} sub="EPI" />
                        {/* Valorisation */}
                        <KpiCard className="xl:col-span-2" icon={<IconCoin size={18} />} color="#0d9488" label="Valorisation totale" value={fmtFcfa(myCons.cost)} />
                    </div>

                    {/* Comparaisons */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                        {groups.length === 0 ? (
                            <div className="lg:col-span-3"><EmptyState icon={<IconUsers size={24} />} title="Comparaison indisponible" description="Sélectionnez un employé." compact /></div>
                        ) : groups.map((g) => <ComparisonCard key={g.type} g={g} me={myCons} />)}
                    </div>

                    {/* Historique + positionnement global */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                        <section className="xl:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <header className="px-4 py-3 border-b border-slate-100"><h2 className="text-slate-800 text-[15px] font-semibold" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Historique des dotations &amp; attributions</h2></header>
                            <div className="p-2">
                                {history.length === 0 ? (
                                    <EmptyState icon={<IconShieldCheck size={24} />} title="Aucune dotation EPI n'a encore été enregistrée pour cet employé." compact />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[13px]">
                                            <thead className="text-slate-400 text-[11px] tracking-wide">
                                                <tr>
                                                    <th className="text-left font-semibold py-2 px-2">EPI</th>
                                                    <th className="text-left font-semibold py-2 px-2">Catégorie</th>
                                                    <th className="text-right font-semibold py-2 px-2">Quantité</th>
                                                    <th className="text-right font-semibold py-2 px-2">Valeur</th>
                                                    <th className="text-right font-semibold py-2 px-2">Date</th>
                                                    <th className="w-8 py-2" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.slice(0, 5).map((h) => { const Icon = catIcon(h.category); return (
                                                    <tr key={h.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/ppe-management/ppe-details/${selectedId}`)}>
                                                        <td className="py-2.5 px-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0" aria-hidden="true"><Icon size={17} className="text-slate-500" /></span>
                                                                <span className="text-slate-800 font-medium">{h.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-slate-500">{ppeCategoryLabel(h.category)}</td>
                                                        <td className="py-2.5 px-2 text-right"><span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tabular-nums text-[12px] font-semibold">{fmtInt(h.qty)}</span></td>
                                                        <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">{fmtFcfa(h.cost)}</td>
                                                        <td className="py-2.5 px-2 text-right text-slate-500 tabular-nums"><span className="inline-flex items-center gap-1"><IconCalendar size={13} className="text-slate-400" aria-hidden="true" />{fmtDate(h.date)}</span></td>
                                                        <td className="py-2.5 text-right"><IconChevronRight size={16} className="text-slate-300" aria-hidden="true" /></td>
                                                    </tr>
                                                ); })}
                                            </tbody>
                                        </table>
                                        {history.length > 5 && (
                                            <div className="flex justify-center py-3">
                                                <Button variant="default" size="xs" leftSection={<IconClipboardList size={14} />} onClick={() => navigate(`/ppe-management/ppe-details/${selectedId}`)}>Voir tout l'historique</Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Positionnement global */}
                        <section className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                            <h2 className="text-[14px] font-bold text-slate-800 text-center mb-2">Votre positionnement global</h2>
                            <div className="flex justify-center">
                                <RingProgress size={130} thickness={10} roundCaps sections={[{ value: global.score, color: level.ring }]}
                                    label={<div className="text-center"><div className="text-[26px] font-black tabular-nums" style={{ color: level.color }}>{global.score}%</div></div>} />
                            </div>
                            <div className="text-center mt-1">
                                <div className="text-[14px] font-bold" style={{ color: level.color }}>Niveau {level.label}</div>
                                <p className="text-[11.5px] text-slate-500 mt-1">Position calculée à partir de vos rangs par département, poste et entreprise.</p>
                            </div>
                            <div className="space-y-2 mt-3">
                                <Distinction icon={<IconAward size={16} />} color="#059669" pct={global.valuePct} label="En termes de valorisation" />
                                <Distinction icon={<IconTrendingUp size={16} />} color="#0d9488" pct={global.volumePct} label="En termes de volume" />
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

// ── Sous-composants ──────────────────────────────────────────────────────────
const RankBadge = ({ rank, total, percentile }: { rank: number; total: number; percentile: number }) => {
    const lv = posLevel(percentile);
    return (
        <div className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: `${lv.ring}12`, border: `1px solid ${lv.ring}33` }}>
            <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${lv.ring}22`, color: lv.color }}><IconTrophy size={24} /></span>
            <div>
                <div className="text-[11.5px] text-slate-500 font-semibold">Votre classement</div>
                <div className="flex items-baseline gap-1"><span className="text-[34px] font-black leading-none tabular-nums" style={{ color: lv.color }}>{ordinal(rank || 1)}</span><span className="text-[13px] text-slate-400">/ {total || 1}</span></div>
                <div className="text-[11px]" style={{ color: lv.color }}>dans votre groupe</div>
            </div>
        </div>
    );
};

const KpiCard = ({ className = '', icon, color, label, value, sub }: { className?: string; icon: React.ReactNode; color: string; label: string; value: string; sub?: string }) => (
    <section className={`${className} bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3`}>
        <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>{icon}</span>
        <div className="min-w-0">
            <div className="text-[12px] text-slate-500 font-semibold">{label}</div>
            <div className="text-[22px] font-black text-slate-800 tabular-nums leading-none mt-0.5 truncate">{value}</div>
            {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
        </div>
    </section>
);

const CompareBar = ({ label, mine, avg, fmt }: { label: string; mine: number; avg: number; fmt: (v: number) => string }) => {
    const max = Math.max(mine, avg, 1);
    return (
        <div>
            <div className="flex items-center justify-between text-[12.5px] mb-1"><span className="text-slate-600">{label}</span><span className="tabular-nums text-slate-800 font-semibold">{fmt(mine)}</span></div>
            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(pctSafe((mine / max) * 100))} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} : ${fmt(mine)}`}><div className="absolute inset-y-0 left-0 rounded-full bg-teal-500" style={{ width: `${pctSafe((mine / max) * 100)}%` }} /></div>
            <div className="flex items-center justify-between text-[11px] mt-1 text-slate-400"><span>Moyenne du groupe</span><span className="tabular-nums">{fmt(avg)}</span></div>
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5"><div className="absolute inset-y-0 left-0 rounded-full bg-slate-300" style={{ width: `${pctSafe((avg / max) * 100)}%` }} /></div>
        </div>
    );
};

const ComparisonCard = ({ g, me }: { g: any; me: { quantity: number; cost: number } }) => {
    const above = Math.max(0, g.cost.rank - 1);
    const lv = posLevel(g.cost.percentile);
    return (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-700 mb-3"><IconUsers size={15} className="text-slate-400" aria-hidden="true" /><span className="truncate">{g.label}</span></div>
            <div className="space-y-3 flex-1">
                <CompareBar label="Votre coût" mine={me.cost} avg={g.avgCost} fmt={fmtFcfa} />
                <CompareBar label="Votre volume" mine={me.quantity} avg={g.avgQty} fmt={fmtInt} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[12px]">
                <span className="text-slate-500">{g.count} employé(s)</span>
                <span className="font-semibold" style={{ color: lv.color }}>{ordinal(g.cost.rank)} sur {g.cost.total} en coût</span>
            </div>
            <div className="mt-2 rounded-lg px-3 py-2 flex items-center gap-2 text-[12px]" style={{ background: `${lv.ring}12` }}>
                <IconAward size={15} style={{ color: lv.color }} aria-hidden="true" />
                <div>
                    <div className="font-semibold" style={{ color: lv.color }}>{g.cost.percentile >= 75 ? 'Positionnement élevé' : g.cost.percentile >= 50 ? 'Au-dessus de la moyenne' : 'Proche de la moyenne'}</div>
                    <div className="text-slate-500 text-[11px]">{above === 0 ? 'En tête du groupe' : `${above} employé(s) au-dessus de vous`} · dotation {me.cost >= g.avgCost ? 'supérieure' : 'inférieure'} à la moyenne</div>
                </div>
            </div>
        </section>
    );
};

const Distinction = ({ icon, color, pct, label }: { icon: React.ReactNode; color: string; pct: number; label: string }) => {
    const tier = pct >= 95 ? 'TOP 5 %' : pct >= 90 ? 'TOP 10 %' : pct >= 75 ? 'TOP 25 %' : pct >= 50 ? 'TOP 50 %' : `${100 - pct} % au-dessus`;
    return (
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }} aria-hidden="true">{icon}</span>
            <div><div className="text-[13px] font-bold text-slate-800">{tier}</div><div className="text-[11px] text-slate-500">{label}</div></div>
        </div>
    );
};

export default PPEMinePage;
