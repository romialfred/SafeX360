import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Avatar, Button, Checkbox, Drawer, Menu, Pagination, RingProgress, ScrollArea, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconAlertTriangle, IconChevronDown, IconClipboardCheck, IconDownload, IconExternalLink, IconEye, IconEyeglass2,
    IconHandStop, IconHeadphones, IconHelmet, IconHistory, IconLayoutGrid, IconList, IconMask, IconParachute,
    IconPlus, IconRefresh, IconSearch, IconShieldCheck, IconShieldX, IconShirt, IconShoe, IconUsers, IconDots,
} from '@tabler/icons-react';
import { getDotationSummary, getDotationEmployees, getDotationDetail, exportDotations, type DotationEmployee } from '../../services/PPEDotationService';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';

/**
 * Suivi des dotations EPI — conformité, renouvellements et historique par employé.
 * Toutes les données (conformité, statuts, KPI) sont calculées côté serveur
 * (/hns/ppe-dotation), cloisonnées sur la mine active. Aucune donnée fabriquée.
 */

const TABS = [
    { id: '', label: 'Tous' },
    { id: 'CONFORME', label: 'Conformes' },
    { id: 'A_COMPLETER', label: 'Incomplets' },
    { id: 'A_RENOUVELER', label: 'À renouveler' },
    { id: 'CRITIQUE', label: 'Expirés' },
];

const STATUS_CFG: Record<string, { label: string; chip: string; dot: string }> = {
    CONFORME: { label: 'Conforme', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981' },
    A_COMPLETER: { label: 'À compléter', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: '#f59e0b' },
    A_RENOUVELER: { label: 'À renouveler', chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: '#8b5cf6' },
    CRITIQUE: { label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: '#f43f5e' },
    NON_EVALUE: { label: 'Non évalué', chip: 'bg-slate-100 text-slate-600 border-slate-200', dot: '#94a3b8' },
};

const CAT_ICON: Record<string, any> = {
    'Head protection': IconHelmet,
    'Eye protection': IconEyeglass2,
    'Hand protection': IconHandStop,
    'Foot protection': IconShoe,
    'Hearing protection': IconHeadphones,
    'Respiratory protection': IconMask,
    'Protective clothing': IconShirt,
    'Fall protection': IconParachute,
};

// État d'une exigence → couleur de l'icône EPI.
const catStateColor = (state: string) =>
    state === 'MISSING' ? { color: '#f97316', ring: 'border-orange-300 bg-orange-50' }
        : state === 'EXPIRED' ? { color: '#f43f5e', ring: 'border-rose-300 bg-rose-50' }
            : state === 'DUE' ? { color: '#f59e0b', ring: 'border-amber-200 bg-amber-50' }
                : { color: '#0f766e', ring: 'border-slate-200 bg-slate-50' };

const AVATAR_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#6366f1', '#ec4899'];
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
const avatarColor = (key: string) => AVATAR_COLORS[Math.abs([...key].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];

const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ringColor = (pct: number, status: string) =>
    status === 'CRITIQUE' ? '#f43f5e' : pct >= 100 ? '#10b981' : pct >= 80 ? '#14b8a6' : pct >= 50 ? '#f59e0b' : '#f43f5e';

function renewalCell(days?: number | null, date?: string | null) {
    if (days == null) return <span className="text-[12.5px] text-slate-400">Non planifié</span>;
    if (days < 0) return <span className="text-[12.5px] font-semibold text-rose-600">Expiré depuis {Math.abs(days)} j</span>;
    const cls = days <= 7 ? 'text-orange-600 font-semibold' : days <= 30 ? 'text-amber-600' : 'text-slate-600';
    return (
        <div className="leading-tight">
            <div className="text-[12.5px] text-slate-700">{fmtDate(date)}</div>
            <div className={`text-[11px] ${cls}`}>{days <= 30 ? `Dans ${days} j` : `${days} j`}</div>
        </div>
    );
}

const PPEDotationPage = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [list, setList] = useState<{ content: DotationEmployee[]; total: number; departments: string[]; functions: string[] }>({ content: [], total: 0, departments: [], functions: [] });
    const [loading, setLoading] = useState(true);
    const [refreshedAt, setRefreshedAt] = useState('');

    const [tab, setTab] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState<string | null>(null);
    const [functionFilter, setFunctionFilter] = useState<string | null>(null);
    const [sort, setSort] = useState('name');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState('10');
    const [view, setView] = useState<'list' | 'grid'>('list');

    const [selected, setSelected] = useState<number | null>(null);
    const [detail, setDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Debounce recherche.
    const debounceRef = useRef<any>(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [searchInput]);

    const params = useMemo(() => ({
        search: search || undefined, status: tab || undefined,
        department: department || undefined, function: functionFilter || undefined,
        sort, page: page - 1, size: Number(size),
    }), [search, tab, department, functionFilter, sort, page, size]);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([getDotationEmployees(params), getDotationSummary()])
            .then(([l, s]) => {
                setList({ content: l.content || [], total: l.total || 0, departments: l.departments || [], functions: l.functions || [] });
                setSummary(s);
                setRefreshedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [params]);
    useEffect(load, [load]);

    const openEmployee = (empId: number) => {
        setSelected(empId); setDetailLoading(true); setDetail(null);
        getDotationDetail(empId).then(setDetail).catch(() => setDetail(null)).finally(() => setDetailLoading(false));
    };

    const totalPages = Math.max(1, Math.ceil(list.total / Number(size)));
    const kpiPct = summary && summary.totalEmployees ? Math.round((summary.compliant / summary.totalEmployees) * 1000) / 10 : 0;

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Gestion des EPI', to: '/ppe-management' }, { label: 'Suivi des dotations' }]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="teal"
                title="Suivi des dotations EPI"
                subtitle="Conformité, renouvellements et historique des équipements par employé"
                actions={
                    <div className="flex items-center gap-2">
                        <span className="text-[11.5px] text-slate-400 hidden md:flex items-center gap-1">
                            Dernière actualisation : {refreshedAt || '—'}
                            <button onClick={load} className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><IconRefresh size={13} className={loading ? 'animate-spin text-teal-500' : 'text-slate-500'} /></button>
                        </span>
                        <Button variant="default" size="sm" leftSection={<IconDownload size={14} />} onClick={() => exportDotations(params)}>Exporter</Button>
                        <Button color="teal" size="sm" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/request-matrix')}>Nouvelle dotation</Button>
                    </div>
                }
            />

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <KpiCard icon={<IconUsers size={18} />} color="#0ea5e9" label="Employés suivis" value={summary?.totalEmployees ?? '—'} sub="Total des employés" />
                <KpiCard icon={<IconShieldCheck size={18} />} color="#10b981" label="Conformes" value={summary?.compliant ?? '—'} sub={`${kpiPct} % · Employés conformes`} />
                <KpiCard icon={<IconAlertTriangle size={18} />} color="#f59e0b" label="Dotations incomplètes" value={summary?.incomplete ?? '—'} sub="À compléter" />
                <KpiCard icon={<IconExternalLink size={18} />} color="#8b5cf6" label="Renouvellements à prévoir" value={summary?.renewalDue ?? '—'} sub="Sous 30 jours" />
                <KpiCard icon={<IconShieldX size={18} />} color="#f43f5e" label="EPI expirés" value={summary?.critical ?? '—'} sub="Attention critique" />
            </div>

            {/* Onglets */}
            <div className="flex flex-wrap items-center gap-2">
                {TABS.map((t) => {
                    const on = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors ${on ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Recherche + filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
                <TextInput className="flex-1 min-w-[220px]" leftSection={<IconSearch size={15} />} placeholder="Rechercher un employé, matricule ou EPI…"
                    value={searchInput} onChange={(e) => setSearchInput(e.currentTarget.value)} size="sm" />
                <Select placeholder="Tous les sites" data={['Mine active']} size="sm" w={150} disabled />
                <Select placeholder="Tous les départements" data={list.departments} value={department} onChange={(v) => { setDepartment(v); setPage(1); }} clearable searchable size="sm" w={190} />
                <Select placeholder="Toutes les fonctions" data={list.functions} value={functionFilter} onChange={(v) => { setFunctionFilter(v); setPage(1); }} clearable searchable size="sm" w={185} />
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => setView('list')} className={`w-8 h-8 flex items-center justify-center ${view === 'list' ? 'bg-teal-50 text-teal-700' : 'text-slate-400'}`}><IconList size={16} /></button>
                    <button onClick={() => setView('grid')} className={`w-8 h-8 flex items-center justify-center ${view === 'grid' ? 'bg-teal-50 text-teal-700' : 'text-slate-400'}`}><IconLayoutGrid size={16} /></button>
                </div>
                <span className="text-[12.5px] text-slate-500 tabular-nums ml-auto">{list.total} employés</span>
            </div>

            {/* Tableau / grille */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-3 space-y-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}</div>
                ) : list.content.length === 0 ? (
                    <EmptyState icon={<IconClipboardCheck size={26} />} title="Aucun employé" description="Aucun résultat pour ces filtres." compact />
                ) : view === 'grid' ? (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {list.content.map((e) => <EmployeeCard key={e.empId} e={e} onOpen={() => openEmployee(e.empId)} selected={selected === e.empId} />)}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-400 text-[11.5px] uppercase tracking-wider">
                                <tr>
                                    <th className="w-9 p-2.5"><Checkbox size="xs" disabled /></th>
                                    <th className="text-left font-semibold p-2.5">Employé</th>
                                    <th className="text-left font-semibold p-2.5">Département</th>
                                    <th className="text-left font-semibold p-2.5">Poste</th>
                                    <th className="text-left font-semibold p-2.5">Conformité</th>
                                    <th className="text-left font-semibold p-2.5">EPI attribués</th>
                                    <th className="text-left font-semibold p-2.5">Prochain renouvellement</th>
                                    <th className="text-left font-semibold p-2.5">Dernière dotation</th>
                                    <th className="text-left font-semibold p-2.5">Statut</th>
                                    <th className="text-center font-semibold p-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.content.map((e) => {
                                    const cfg = STATUS_CFG[e.status] || STATUS_CFG.NON_EVALUE;
                                    const on = selected === e.empId;
                                    return (
                                        <tr key={e.empId} onClick={() => openEmployee(e.empId)}
                                            className={`border-t border-slate-100 cursor-pointer transition-colors ${on ? 'bg-teal-50/60' : 'hover:bg-slate-50'}`}
                                            style={on ? { boxShadow: 'inset 3px 0 0 #14b8a6' } : undefined}>
                                            <td className="p-2.5" onClick={(ev) => ev.stopPropagation()}><Checkbox size="xs" /></td>
                                            <td className="p-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar radius="xl" size={32} color="white" styles={{ placeholder: { background: avatarColor(e.name), color: '#fff', fontSize: 12, fontWeight: 700 } }}>{initials(e.name)}</Avatar>
                                                    <div className="min-w-0">
                                                        <div className="text-[13px] font-semibold text-slate-800 truncate">{e.name}</div>
                                                        <div className="text-[11px] text-slate-400">{e.matricule}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-slate-600">{e.department}</td>
                                            <td className="p-2.5 text-slate-600">{e.position}</td>
                                            <td className="p-2.5"><ComplianceRing pct={e.compliancePct} status={e.status} /></td>
                                            <td className="p-2.5"><EpiIcons e={e} /></td>
                                            <td className="p-2.5">{renewalCell(e.nextRenewalDays, e.nextRenewalDate)}</td>
                                            <td className="p-2.5 text-slate-600 tabular-nums">{fmtDate(e.lastDotationDate)}</td>
                                            <td className="p-2.5"><span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[11.5px] font-semibold ${cfg.chip}`}>{cfg.label}</span></td>
                                            <td className="p-2.5" onClick={(ev) => ev.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Tooltip label="Consulter" withArrow><ActionIcon variant="subtle" color="gray" onClick={() => openEmployee(e.empId)}><IconEye size={16} /></ActionIcon></Tooltip>
                                                    <Menu position="bottom-end" withArrow>
                                                        <Menu.Target><ActionIcon variant="subtle" color="gray"><IconDots size={16} /></ActionIcon></Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => openEmployee(e.empId)}>Consulter</Menu.Item>
                                                            <Menu.Item leftSection={<IconHistory size={14} />} onClick={() => navigate(`/ppe-management/ppe-details/${e.empId}`)}>Voir l'historique</Menu.Item>
                                                            <Menu.Item leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/request-matrix')}>Compléter la dotation</Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Répartition + pagination */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[280px]">
                    {summary && (
                        <>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] mb-1.5">
                                {(summary.distribution || []).map((d: any) => {
                                    const c = STATUS_CFG[d.status] || STATUS_CFG.NON_EVALUE;
                                    return <span key={d.status} className="inline-flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />{c.label} {d.count} ({d.pct}%)</span>;
                                })}
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                                {(summary.distribution || []).map((d: any) => {
                                    const c = STATUS_CFG[d.status] || STATUS_CFG.NON_EVALUE;
                                    return <div key={d.status} style={{ width: `${d.pct}%`, background: c.dot }} title={`${c.label}: ${d.count}`} />;
                                })}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[12px] text-slate-500 tabular-nums">
                        {list.total === 0 ? '0' : `${(page - 1) * Number(size) + 1}–${Math.min(page * Number(size), list.total)}`} sur {list.total}
                    </span>
                    <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="teal" />
                    <Select data={['10', '25', '50']} value={size} onChange={(v) => { setSize(v || '10'); setPage(1); }} size="xs" w={90} rightSection={<IconChevronDown size={14} />} allowDeselect={false} />
                </div>
            </div>

            {/* Volet détail */}
            <Drawer opened={selected != null} onClose={() => setSelected(null)} position="right" size={460}
                withCloseButton title={<span className="text-[15px] font-bold text-slate-900">Fiche employé</span>}
                overlayProps={{ opacity: 0.35 }}>
                {detailLoading ? (
                    <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />)}</div>
                ) : detail ? (
                    <DetailPanel d={detail} onComplete={() => navigate('/ppe-management/request-matrix')} onHistory={() => navigate(`/ppe-management/ppe-details/${detail.empId}`)} />
                ) : (
                    <p className="text-[13px] text-slate-500 text-center py-8">Détail indisponible.</p>
                )}
            </Drawer>
        </div>
    );
};

// ── Sous-composants ──────────────────────────────────────────────────────────

const KpiCard = ({ icon, color, label, value, sub }: { icon: React.ReactNode; color: string; label: string; value: any; sub: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm" style={{ borderTop: `2px solid ${color}` }}>
        <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>{icon}</span>
            <span className="text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 leading-tight">{label}</span>
        </div>
        <div className="text-[26px] font-black text-slate-800 tabular-nums mt-2 leading-none">{value}</div>
        <div className="text-[11.5px] text-slate-400 mt-1">{sub}</div>
    </div>
);

const ComplianceRing = ({ pct, status }: { pct: number; status: string }) => (
    <div className="flex items-center gap-2">
        <RingProgress size={38} thickness={4} roundCaps sections={[{ value: pct, color: ringColor(pct, status) }]}
            label={<div className="text-[9.5px] font-bold text-center tabular-nums" style={{ color: ringColor(pct, status) }}>{pct}%</div>} />
    </div>
);

const EpiIcons = ({ e }: { e: DotationEmployee }) => (
    <div className="flex items-center gap-1.5">
        {(e.categories || []).map((c) => {
            const Icon = CAT_ICON[c.category] || IconShieldCheck;
            const st = catStateColor(c.state);
            return (
                <Tooltip key={c.category} withArrow label={`${c.categoryLabel} — ${c.state === 'MISSING' ? 'Manquant' : c.state === 'EXPIRED' ? 'Expiré' : c.state === 'DUE' ? 'À renouveler' : 'OK'}`}>
                    <span className={`w-6 h-6 rounded-md border flex items-center justify-center ${st.ring} ${c.state === 'MISSING' ? 'border-dashed' : ''}`}>
                        <Icon size={13} style={{ color: st.color }} />
                    </span>
                </Tooltip>
            );
        })}
        <span className="text-[11.5px] text-slate-500 tabular-nums ml-1">{e.satisfiedCount}/{e.requiredCount}</span>
    </div>
);

const EmployeeCard = ({ e, onOpen, selected }: { e: DotationEmployee; onOpen: () => void; selected: boolean }) => {
    const cfg = STATUS_CFG[e.status] || STATUS_CFG.NON_EVALUE;
    return (
        <button onClick={onOpen} className={`text-left bg-white rounded-xl border p-3 transition-colors ${selected ? 'border-teal-400 bg-teal-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-2.5">
                <Avatar radius="xl" size={38} styles={{ placeholder: { background: avatarColor(e.name), color: '#fff', fontSize: 13, fontWeight: 700 } }}>{initials(e.name)}</Avatar>
                <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-slate-800 truncate">{e.name}</div>
                    <div className="text-[11px] text-slate-400">{e.matricule} · {e.position}</div>
                </div>
                <ComplianceRing pct={e.compliancePct} status={e.status} />
            </div>
            <div className="flex items-center justify-between mt-2.5">
                <EpiIcons e={e} />
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.chip}`}>{cfg.label}</span>
            </div>
        </button>
    );
};

const EQ_STATE: Record<string, { label: string; chip: string }> = {
    BON: { label: 'Bon', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    A_RENOUVELER: { label: 'À renouveler', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    EXPIRE: { label: 'Expiré', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    RETOURNE: { label: 'Retourné', chip: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const DetailPanel = ({ d, onComplete, onHistory }: { d: any; onComplete: () => void; onHistory: () => void }) => {
    const cfg = STATUS_CFG[d.status] || STATUS_CFG.NON_EVALUE;
    return (
        <div className="flex flex-col h-full">
            {/* En-tête */}
            <div className="flex items-start gap-3">
                <Avatar radius="xl" size={46} styles={{ placeholder: { background: avatarColor(d.name), color: '#fff', fontSize: 15, fontWeight: 700 } }}>{initials(d.name)}</Avatar>
                <div className="min-w-0">
                    <div className="text-[16px] font-bold text-slate-900 leading-tight">{d.name}</div>
                    <div className="text-[12px] text-slate-500">{d.matricule}</div>
                    <div className="text-[12.5px] text-slate-700 mt-0.5">{d.position}</div>
                    <div className="text-[12px] text-slate-500">{d.department}</div>
                </div>
            </div>
            <div className={`mt-3 px-3 py-2 rounded-lg border text-[13px] font-semibold flex items-center gap-2 ${cfg.chip}`}>
                <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                {d.status === 'CONFORME' ? 'Dotation conforme' : d.status === 'A_RENOUVELER' ? 'Renouvellement à prévoir' : d.status === 'CRITIQUE' ? 'Dotation critique' : 'Dotation incomplète'} — {d.compliancePct} %
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4 mt-3" type="auto">
                {/* Équipements attribués */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-bold text-slate-800">Équipements attribués</h3>
                    <span className="text-[12px] text-slate-500 tabular-nums">{d.satisfiedCount}/{d.requiredCount}</span>
                </div>
                <div className="space-y-2">
                    {(d.attributed || []).map((eq: any) => {
                        const Icon = CAT_ICON[eq.category] || IconShieldCheck;
                        const es = EQ_STATE[eq.state] || EQ_STATE.BON;
                        return (
                            <div key={eq.ppeId + '-' + eq.lastDate} className="rounded-lg border border-slate-200 p-2.5 flex items-start gap-2.5">
                                <span className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><Icon size={16} className="text-slate-500" /></span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[13px] font-semibold text-slate-800 truncate">{eq.name}</div>
                                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${es.chip}`}>{es.label}</span>
                                    </div>
                                    <div className="text-[11.5px] text-slate-500">{eq.categoryLabel}{eq.size ? ` · Taille ${eq.size}` : ''}{eq.quantity ? ` · ${eq.quantity} u.` : ''}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Émis {fmtDate(eq.lastDate)}{eq.expiryDate ? ` · Renouv. ${fmtDate(eq.expiryDate)}` : ''}</div>
                                </div>
                            </div>
                        );
                    })}
                    {(d.attributed || []).length === 0 && <p className="text-[12.5px] text-slate-400 py-3 text-center">Aucun équipement attribué.</p>}
                </div>

                {/* Exigences non satisfaites */}
                {(d.missing || []).length > 0 && (
                    <>
                        <h3 className="text-[13px] font-bold text-slate-800 mt-4 mb-2">Exigences non satisfaites</h3>
                        <div className="space-y-2">
                            {d.missing.map((m: any) => {
                                const Icon = CAT_ICON[m.category] || IconShieldX;
                                const expired = m.state === 'EXPIRED';
                                return (
                                    <div key={m.category} className={`rounded-lg border border-dashed p-2.5 flex items-center gap-2.5 ${expired ? 'border-rose-300 bg-rose-50/50' : 'border-orange-300 bg-orange-50/50'}`}>
                                        <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-white border border-slate-200"><Icon size={16} className={expired ? 'text-rose-500' : 'text-orange-500'} /></span>
                                        <div>
                                            <div className="text-[13px] font-semibold text-slate-800">{m.categoryLabel}</div>
                                            <div className={`text-[11.5px] ${expired ? 'text-rose-600' : 'text-orange-600'}`}>{expired ? 'Expiré — à remplacer' : 'Non attribué — obligatoire'}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Prochaine action */}
                {d.nextAction && (
                    <>
                        <h3 className="text-[13px] font-bold text-slate-800 mt-4 mb-2">Prochaine action</h3>
                        <div className="rounded-lg border border-slate-200 p-3 flex items-start gap-2.5">
                            <span className="w-8 h-8 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0"><IconRefresh size={16} className="text-violet-600" /></span>
                            <div>
                                <div className="text-[13px] font-semibold text-slate-800">{d.nextAction.reason}{d.nextAction.dueDate ? ` le ${fmtDate(d.nextAction.dueDate)}` : ''}</div>
                                <div className="text-[11.5px] text-slate-500">{d.nextAction.ppeName || ''}{d.nextAction.days != null ? ` · dans ${d.nextAction.days} j` : ''} · priorité {(d.nextAction.priority || '').toLowerCase()}</div>
                            </div>
                        </div>
                    </>
                )}
            </ScrollArea>

            {/* Pied d'actions */}
            <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-200">
                <Button variant="default" size="sm" leftSection={<IconHistory size={15} />} className="flex-1" onClick={onHistory}>Voir l'historique</Button>
                <Button color="teal" size="sm" leftSection={<IconPlus size={15} />} className="flex-1" onClick={onComplete}>Compléter la dotation</Button>
            </div>
        </div>
    );
};

export default PPEDotationPage;
