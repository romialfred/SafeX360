import 'primeicons/primeicons.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Avatar, Button, Checkbox, Drawer, Menu, Pagination, ScrollArea, Select, Textarea, TextInput, Tooltip } from '@mantine/core';
import {
    IconAdjustmentsHorizontal, IconBox, IconCalendar, IconCheck, IconChevronDown, IconCircleCheck, IconCircleX,
    IconClipboardList, IconClock, IconDots, IconDownload, IconEye, IconMapPin, IconPackage, IconPlus, IconRefresh,
    IconSearch, IconTruck, IconX,
} from '@tabler/icons-react';
import { getAllPPE } from '../../services/PPEService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { getAllCompanies } from '../../services/HrmsService';
import { useAppSelector } from '../../slices/hooks';
import {
    approvePpeRequest, deliverPpeRequest, getAllPpeRequests, preparePpeRequest, rejectPpeRequest,
} from '../../services/PpeRequestService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { notifyError } from '../../utility/notifyError';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';

/**
 * Gestion des demandes EPI — suivi, validation et traitement des demandes de dotation.
 * Données réelles (getAllPpeRequests + catalogue + employés) ; workflow serveur
 * (approbation → préparation → distribution / rejet). Volet détail à droite.
 * NB : la demande ne porte pas de « demandeur » distinct → 1er bénéficiaire affiché.
 */

const STATUS_CFG: Record<string, { label: string; chip: string; dot: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: '#f59e0b' },
    APPROVED: { label: 'Approuvée', chip: 'bg-sky-50 text-sky-700 border-sky-200', dot: '#0ea5e9' },
    PREPARATION: { label: 'En préparation', chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: '#8b5cf6' },
    DELIVERED: { label: 'Distribuée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981' },
    RETURNED: { label: 'Retournée', chip: 'bg-slate-100 text-slate-600 border-slate-300', dot: '#64748b' },
    REJECTED: { label: 'Rejetée', chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: '#f43f5e' },
};

const priorityCfg = (p?: string) => {
    const v = (p || '').toUpperCase();
    if (v.includes('CRITIC') || v.includes('URGENT')) return { label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (v.includes('HIGH') || v.includes('ELEV')) return { label: 'Élevée', chip: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (v.includes('LOW') || v.includes('FAIB')) return { label: 'Faible', chip: 'bg-slate-100 text-slate-600 border-slate-200' };
    return { label: 'Moyenne', chip: 'bg-sky-50 text-sky-700 border-sky-200' };
};

const AV = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#6366f1', '#ec4899'];
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
const avColor = (k: string) => AV[Math.abs([...(k || '?')].reduce((a, c) => a + c.charCodeAt(0), 0)) % AV.length];
const fmtDate = (d?: string | null) => { if (!d) return '—'; const dt = new Date(d); return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); };
const reqNo = (r: any) => `DEM-${new Date(r.createdAt || Date.now()).getFullYear()}-${String(r.id).padStart(4, '0')}`;
const stockBadge = (p: any) => {
    const s = p?.stock ?? 0, m = p?.minStock ?? 0;
    if (s <= 0) return { label: 'Rupture', chip: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (s <= m) return { label: 'Stock faible', chip: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Disponible', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
};

const TABS = [
    { id: '', label: 'Toutes' }, { id: 'PENDING', label: 'En attente' }, { id: 'APPROVED', label: 'Approuvées' },
    { id: 'PREPARATION', label: 'En préparation' }, { id: 'DELIVERED', label: 'Distribuées' }, { id: 'REJECTED', label: 'Rejetées' },
];

const PPERequestsTable = () => {
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((s: any) => s.companySelection?.selectedCompanyId);
    const [mineName, setMineName] = useState('');
    const [requests, setRequests] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [refreshedAt, setRefreshedAt] = useState('');

    const [tab, setTab] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState<string | null>(null);
    const [priority, setPriority] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState('10');

    const [selected, setSelected] = useState<any | null>(null);
    const [comment, setComment] = useState('');
    const [acting, setActing] = useState(false);

    const debounce = useRef<any>(null);
    useEffect(() => { clearTimeout(debounce.current); debounce.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(debounce.current); }, [searchInput]);

    const fetchAll = () => {
        setLoading(true);
        Promise.all([getAllPpeRequests(), getEmployeesWithDepartment().catch(() => []), getAllPPE().catch(() => [])])
            .then(([reqs, emps, ppes]: any[]) => {
                setRequests(Array.isArray(reqs) ? reqs : []);
                const em: Record<string, any> = {}; (emps || []).forEach((e: any) => { em[e.id] = { name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || `#${e.id}`, department: e.department, position: e.position }; });
                setEmpMap(em);
                const pm: Record<string, any> = {}; (ppes || []).forEach((p: any) => { pm[p.id] = p; }); setPpeMap(pm);
                setRefreshedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            })
            .catch((e) => errorNotification('Chargement des demandes impossible'))
            .finally(() => setLoading(false));
    };
    useEffect(fetchAll, []);
    useEffect(() => { getAllCompanies().then((cs: any[]) => setMineName((cs || []).find((c) => c.id === selectedCompanyId)?.name || '')).catch(() => {}); }, [selectedCompanyId]);

    // Enrichissement (dérivé, cloisonné côté serveur).
    const rows = useMemo(() => requests.map((r) => {
        const lines: any[] = r.lines || [];
        const beneficiaries = Array.from(new Set(lines.map((l) => l.empId).filter(Boolean)));
        if (beneficiaries.length === 0 && Array.isArray(r.empIds)) r.empIds.forEach((e: any) => beneficiaries.push(e));
        const demandeurId = beneficiaries[0];
        const units = lines.reduce((a, l) => a + (Number(l.quantityRequested) || 0), 0);
        const refs = new Set(lines.map((l) => l.ppeId)).size || (Array.isArray(r.ppeIds) ? r.ppeIds.length : 0);
        return { ...r, _no: reqNo(r), _benef: beneficiaries, _demandeurId: demandeurId, _units: units, _refs: refs };
    }), [requests]);

    const kpi = useMemo(() => {
        const c: Record<string, number> = { PENDING: 0, APPROVED: 0, PREPARATION: 0, DELIVERED: 0, REJECTED: 0, RETURNED: 0 };
        rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
        const priorityPending = rows.filter((r) => r.status === 'PENDING' && priorityCfg(r.priority).label !== 'Moyenne' && priorityCfg(r.priority).label !== 'Faible').length;
        return {
            total: rows.length, priorityPending,
            PENDING: c.PENDING, APPROVED: c.APPROVED, PREPARATION: c.PREPARATION,
            DELIVERED: c.DELIVERED, REJECTED: c.REJECTED, RETURNED: c.RETURNED,
        };
    }, [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (tab && r.status !== tab) return false;
            if (department && empMap[r._demandeurId]?.department !== department) return false;
            if (priority && priorityCfg(r.priority).label !== priority) return false;
            if (!q) return true;
            const demandeur = empMap[r._demandeurId]?.name || '';
            const epi = (r.lines || []).map((l: any) => ppeMap[l.ppeId]?.name).join(' ');
            return `${r._no} ${demandeur} ${r.reason || ''} ${epi}`.toLowerCase().includes(q);
        });
    }, [rows, tab, department, priority, search, empMap, ppeMap]);

    const total = filtered.length;
    const pageSize = Number(size);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

    const departments = useMemo(() => Array.from(new Set(Object.values(empMap).map((e: any) => e.department).filter(Boolean))).sort() as string[], [empMap]);
    const distribution = useMemo(() => {
        const t = kpi.total || 1;
        return [['PENDING', kpi.PENDING], ['APPROVED', kpi.APPROVED], ['PREPARATION', kpi.PREPARATION], ['DELIVERED', kpi.DELIVERED], ['REJECTED', kpi.REJECTED]]
            .map(([s, n]) => ({ status: s as string, count: n as number, pct: Math.round(1000 * (n as number) / t) / 10 }));
    }, [kpi]);

    const openRow = (r: any) => { setSelected(r); setComment(''); };

    const act = async (fn: () => Promise<any>, ok: string) => {
        try { setActing(true); await fn(); successNotification(ok); setSelected(null); fetchAll(); }
        catch (e) { notifyError(e, "L'action a échoué"); } finally { setActing(false); }
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Gestion des EPI', to: '/ppe-management' }, { label: 'Gestion des demandes' }]}
                icon={<IconClipboardList size={22} stroke={2} />} iconColor="teal"
                title="Gestion des demandes EPI" subtitle="Suivez, validez et traitez les demandes de dotation"
                actions={
                    <div className="flex items-center gap-2">
                        <span className="text-[11.5px] text-slate-400 hidden md:flex items-center gap-1">Dernière actualisation : {refreshedAt || '—'}
                            <button onClick={fetchAll} className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><IconRefresh size={13} className={loading ? 'animate-spin text-teal-500' : 'text-slate-500'} /></button>
                        </span>
                        <Button variant="default" size="sm" leftSection={<IconDownload size={14} />} onClick={() => navigate('/ppe-management/analytics')}>Exporter</Button>
                        <Button color="teal" size="sm" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/request-matrix')}>Nouvelle demande</Button>
                    </div>
                }
            />

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <Kpi icon={<IconClipboardList size={17} />} color="#0ea5e9" label="Total des demandes" value={kpi.total} />
                <Kpi icon={<IconClock size={17} />} color="#f59e0b" label="En attente" value={kpi.PENDING} sub={kpi.priorityPending ? `${kpi.priorityPending} prioritaires` : undefined} />
                <Kpi icon={<IconCircleCheck size={17} />} color="#10b981" label="Approuvées" value={kpi.APPROVED} />
                <Kpi icon={<IconBox size={17} />} color="#8b5cf6" label="En préparation" value={kpi.PREPARATION} />
                <Kpi icon={<IconTruck size={17} />} color="#0ea5e9" label="Distribuées" value={kpi.DELIVERED} />
                <Kpi icon={<IconCircleX size={17} />} color="#f43f5e" label="Rejetées" value={kpi.REJECTED} />
            </div>

            {/* Onglets */}
            <div className="flex flex-wrap items-center gap-2">
                {TABS.map((t) => {
                    const n = t.id === '' ? kpi.total : (kpi as any)[t.id] || 0; const on = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border inline-flex items-center gap-1.5 ${on ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            {t.label}<span className={`px-1.5 rounded text-[11px] ${on ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
                        </button>
                    );
                })}
            </div>

            {/* Recherche + filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
                <TextInput className="flex-1 min-w-[240px]" leftSection={<IconSearch size={15} />} placeholder="Rechercher un N° de demande, un employé ou un motif…" value={searchInput} onChange={(e) => setSearchInput(e.currentTarget.value)} size="sm" />
                <Select placeholder="Tous les sites" data={['Mine active']} size="sm" w={150} disabled />
                <Select placeholder="Tous les départements" data={departments} value={department} onChange={(v) => { setDepartment(v); setPage(1); }} clearable searchable size="sm" w={200} />
                <Select placeholder="Toutes les priorités" data={['Critique', 'Élevée', 'Moyenne', 'Faible']} value={priority} onChange={(v) => { setPriority(v); setPage(1); }} clearable size="sm" w={180} />
                <Button variant="default" size="sm" leftSection={<IconAdjustmentsHorizontal size={15} />}>Filtres avancés</Button>
                <button onClick={fetchAll} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><IconRefresh size={15} className="text-slate-500" /></button>
                <span className="text-[12.5px] text-slate-500 tabular-nums ml-auto">{total} demandes</span>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-3 space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}</div>
                ) : pageRows.length === 0 ? (
                    <EmptyState icon={<IconClipboardList size={26} />} title="Aucune demande" description="Aucun résultat pour ces filtres." compact />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-400 text-[11.5px] uppercase tracking-wider">
                                <tr>
                                    <th className="w-9 p-2.5"><Checkbox size="xs" disabled /></th>
                                    <th className="text-left font-semibold p-2.5">N° demande</th>
                                    <th className="text-left font-semibold p-2.5">Demandeur</th>
                                    <th className="text-left font-semibold p-2.5">Bénéficiaires</th>
                                    <th className="text-left font-semibold p-2.5">Motif</th>
                                    <th className="text-left font-semibold p-2.5">Priorité</th>
                                    <th className="text-left font-semibold p-2.5">Date souhaitée</th>
                                    <th className="text-left font-semibold p-2.5">Créée le</th>
                                    <th className="text-left font-semibold p-2.5">Statut</th>
                                    <th className="text-left font-semibold p-2.5">Progression</th>
                                    <th className="text-center font-semibold p-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((r) => {
                                    const st = STATUS_CFG[r.status] || STATUS_CFG.PENDING; const pr = priorityCfg(r.priority);
                                    const demandeur = empMap[r._demandeurId]?.name || `#${r._demandeurId ?? '—'}`;
                                    const on = selected?.id === r.id;
                                    return (
                                        <tr key={r.id} onClick={() => openRow(r)} className={`border-t border-slate-100 cursor-pointer ${on ? 'bg-teal-50/60' : 'hover:bg-slate-50'}`} style={on ? { boxShadow: 'inset 3px 0 0 #14b8a6' } : undefined}>
                                            <td className="p-2.5" onClick={(e) => e.stopPropagation()}><Checkbox size="xs" /></td>
                                            <td className="p-2.5 font-semibold text-teal-700 whitespace-nowrap">{r._no}</td>
                                            <td className="p-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Avatar radius="xl" size={26} styles={{ placeholder: { background: avColor(demandeur), color: '#fff', fontSize: 10, fontWeight: 700 } }}>{initials(demandeur)}</Avatar>
                                                    <span className="text-slate-800 font-medium truncate max-w-[130px]">{demandeur}</span>
                                                </div>
                                            </td>
                                            <td className="p-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar.Group spacing="xs">
                                                        {r._benef.slice(0, 3).map((id: any) => { const nm = empMap[id]?.name || `#${id}`; return <Avatar key={id} radius="xl" size={24} styles={{ placeholder: { background: avColor(nm), color: '#fff', fontSize: 9, fontWeight: 700 } }}>{initials(nm)}</Avatar>; })}
                                                    </Avatar.Group>
                                                    <span className="text-[12px] text-slate-500 whitespace-nowrap">{r._benef.length} {r._benef.length > 1 ? 'employés' : 'employé'}</span>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-slate-600 max-w-[160px] truncate" title={r.reason}>{r.reason || '—'}</td>
                                            <td className="p-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${pr.chip}`}>{pr.label}</span></td>
                                            <td className="p-2.5 text-slate-600 whitespace-nowrap">{fmtDate(r.desiredDate)}</td>
                                            <td className="p-2.5 text-slate-600 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                                            <td className="p-2.5"><span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[11.5px] font-semibold ${st.chip}`}>{st.label}</span></td>
                                            <td className="p-2.5 min-w-[130px]"><Progression status={r.status} /></td>
                                            <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Tooltip label="Détail" withArrow><ActionIcon variant="subtle" color="gray" onClick={() => openRow(r)}><IconEye size={16} /></ActionIcon></Tooltip>
                                                    <Menu position="bottom-end" withArrow>
                                                        <Menu.Target><ActionIcon variant="subtle" color="gray"><IconDots size={16} /></ActionIcon></Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => openRow(r)}>Consulter le détail</Menu.Item>
                                                            {r.status === 'PENDING' && <Menu.Item leftSection={<IconCheck size={14} />} onClick={() => act(() => approvePpeRequest(r.id), 'Demande approuvée')}>Approuver</Menu.Item>}
                                                            {r.status === 'APPROVED' && <Menu.Item leftSection={<IconBox size={14} />} onClick={() => act(() => preparePpeRequest(r.id), 'Passée en préparation')}>Mettre en préparation</Menu.Item>}
                                                            {(r.status === 'APPROVED' || r.status === 'PREPARATION') && <Menu.Item leftSection={<IconTruck size={14} />} onClick={() => act(() => deliverPpeRequest(r.id), 'Demande distribuée')}>Distribuer</Menu.Item>}
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
                <div className="flex-1 min-w-[300px]">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] mb-1.5">
                        {distribution.map((d) => { const c = STATUS_CFG[d.status]; return <span key={d.status} className="inline-flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />{c.label} {d.count} ({d.pct}%)</span>; })}
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                        {distribution.map((d) => <div key={d.status} style={{ width: `${d.pct}%`, background: STATUS_CFG[d.status].dot }} title={`${STATUS_CFG[d.status].label}: ${d.count}`} />)}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[12px] text-slate-500 tabular-nums">{total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`} sur {total}</span>
                    <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="teal" />
                    <Select data={['10', '25', '50']} value={size} onChange={(v) => { setSize(v || '10'); setPage(1); }} size="xs" w={90} rightSection={<IconChevronDown size={14} />} allowDeselect={false} />
                </div>
            </div>

            {/* Volet détail */}
            <Drawer opened={!!selected} onClose={() => setSelected(null)} position="right" size={470} withCloseButton
                title={<span className="text-[15px] font-bold text-slate-900">Détail de la demande</span>}>
                {selected && (
                    <RequestDetail r={selected} empMap={empMap} ppeMap={ppeMap} mineName={mineName} comment={comment} setComment={setComment} acting={acting}
                        onApprove={() => act(() => approvePpeRequest(selected.id, comment), 'Demande approuvée')}
                        onReject={() => { if (!comment.trim()) { errorNotification('Motif de rejet requis'); return; } act(() => rejectPpeRequest(selected.id, comment), 'Demande rejetée'); }}
                        onPrepare={() => act(() => preparePpeRequest(selected.id, comment), 'Passée en préparation')}
                        onDeliver={() => act(() => deliverPpeRequest(selected.id, comment), 'Demande distribuée')} />
                )}
            </Drawer>
        </div>
    );
};

const Kpi = ({ icon, color, label, value, sub }: { icon: React.ReactNode; color: string; label: string; value: any; sub?: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm" style={{ borderTop: `2px solid ${color}` }}>
        <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>{icon}</span>
            <span className="text-[10.5px] uppercase tracking-[0.06em] font-bold text-slate-500 leading-tight">{label}</span>
        </div>
        <div className="text-[24px] font-black text-slate-800 tabular-nums mt-2 leading-none">{value}</div>
        {sub && <div className="text-[11px] text-amber-600 mt-1">{sub}</div>}
    </div>
);

const Progression = ({ status }: { status: string }) => {
    if (status === 'DELIVERED') return (<div><div className="h-1.5 rounded-full bg-emerald-500" /><div className="text-[11px] text-emerald-600 mt-0.5">100 % distribuée</div></div>);
    if (status === 'PREPARATION') return (<div><div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-violet-500" style={{ width: '55%' }} /></div><div className="text-[11px] text-violet-600 mt-0.5">Préparation magasin</div></div>);
    if (status === 'APPROVED') return <div className="text-[11.5px] text-sky-600">Stock réservé</div>;
    if (status === 'PENDING') return <div className="text-[11.5px] text-slate-500 inline-flex items-center gap-1"><IconClock size={12} /> Validation</div>;
    if (status === 'REJECTED') return <div className="text-[11.5px] text-slate-400">—</div>;
    return <div className="text-[11.5px] text-slate-400">—</div>;
};

const CIRCUIT = [
    { key: 'submitted', label: 'Demande soumise' },
    { key: 'validation', label: 'Validation' },
    { key: 'preparation', label: 'Préparation magasin' },
    { key: 'distribution', label: 'Distribution' },
];
const stepState = (status: string, key: string) => {
    const order = ['PENDING', 'APPROVED', 'PREPARATION', 'DELIVERED'];
    const idx = order.indexOf(status);
    if (status === 'REJECTED') return key === 'submitted' ? 'done' : key === 'validation' ? 'rejected' : 'todo';
    if (key === 'submitted') return 'done';
    if (key === 'validation') return idx >= 1 ? 'done' : 'current';
    if (key === 'preparation') return idx >= 2 ? 'done' : idx === 1 ? 'current' : 'todo';
    if (key === 'distribution') return idx >= 3 ? 'done' : idx === 2 ? 'current' : 'todo';
    return 'todo';
};

const RequestDetail = ({ r, empMap, ppeMap, mineName, comment, setComment, acting, onApprove, onReject, onPrepare, onDeliver }: any) => {
    const st = STATUS_CFG[r.status] || STATUS_CFG.PENDING; const pr = priorityCfg(r.priority);
    const demandeur = empMap[r._demandeurId]?.name || `#${r._demandeurId ?? '—'}`;
    const dept = empMap[r._demandeurId]?.department || '—';
    const byEmp: Record<string, any[]> = {}; (r.lines || []).forEach((l: any) => { (byEmp[l.empId] = byEmp[l.empId] || []).push(l); });
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[16px] font-black text-slate-900">{r._no}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11.5px] font-semibold ${st.chip}`}>{st.label}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11.5px] font-semibold ${pr.chip}`}>Priorité {pr.label.toLowerCase()}</span>
            </div>

            <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 mt-3 text-[12px]">
                <Meta label="Demandeur" value={demandeur} />
                <Meta label="Site" value={mineName || 'Mine active'} />
                <Meta label="Département" value={dept} />
                <Meta label="Date souhaitée" value={fmtDate(r.desiredDate)} />
                <Meta label="Motif" value={r.reason || '—'} />
                <Meta label="Créée le" value={fmtDate(r.createdAt)} />
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4 mt-4" type="auto">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-bold text-slate-800">Bénéficiaires &amp; EPI demandés</h3>
                    <span className="text-[11.5px] text-slate-500">{r._benef.length} bénéf. · {r._refs} réf. · {r._units} u.</span>
                </div>
                <div className="space-y-3">
                    {Object.entries(byEmp).map(([empId, lines]) => {
                        const nm = empMap[empId]?.name || `#${empId}`; const totUnits = lines.reduce((a: number, l: any) => a + (Number(l.quantityRequested) || 0), 0);
                        return (
                            <div key={empId} className="rounded-lg border border-slate-200 overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                                    <Avatar radius="xl" size={28} styles={{ placeholder: { background: avColor(nm), color: '#fff', fontSize: 11, fontWeight: 700 } }}>{initials(nm)}</Avatar>
                                    <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-slate-800 truncate">{nm}</div><div className="text-[11px] text-slate-500">{empMap[empId]?.position || '—'}</div></div>
                                    <span className="text-[11px] text-slate-500 shrink-0">{lines.length} réf. · {totUnits} u.</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {lines.map((l: any, i: number) => {
                                        const p = ppeMap[l.ppeId]; const sb = stockBadge(p);
                                        return (
                                            <div key={i} className="flex items-center gap-2 px-3 py-2">
                                                <span className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><IconPackage size={14} className="text-slate-500" /></span>
                                                <div className="min-w-0 flex-1"><div className="text-[12.5px] font-medium text-slate-800 truncate">{p?.name || `EPI #${l.ppeId}`}</div><div className="text-[11px] text-slate-400">Qté {l.quantityRequested ?? 1}{p?.size ? ` · Taille ${p.size}` : ''}</div></div>
                                                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${sb.chip}`}>{sb.label}</span>
                                                <span className="text-[11px] text-slate-400 tabular-nums w-16 text-right shrink-0">Stock : {p?.stock ?? 0}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(byEmp).length === 0 && <p className="text-[12.5px] text-slate-400 py-3 text-center">Aucune ligne.</p>}
                </div>

                {/* Circuit de validation */}
                <h3 className="text-[13px] font-bold text-slate-800 mt-5 mb-2">Circuit de validation</h3>
                <div className="space-y-0">
                    {CIRCUIT.map((s, i) => {
                        const state = stepState(r.status, s.key);
                        const color = state === 'done' ? '#10b981' : state === 'current' ? '#0ea5e9' : state === 'rejected' ? '#f43f5e' : '#cbd5e1';
                        return (
                            <div key={s.key} className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: state === 'done' ? color : '#fff', border: `2px solid ${color}` }}>
                                        {state === 'done' && <IconCheck size={11} className="text-white" />}
                                        {state === 'rejected' && <IconX size={11} style={{ color }} />}
                                    </span>
                                    {i < CIRCUIT.length - 1 && <span className="w-0.5 h-6" style={{ background: state === 'done' ? '#10b981' : '#e2e8f0' }} />}
                                </div>
                                <div className="pb-4 -mt-0.5">
                                    <div className="text-[12.5px] font-semibold text-slate-800">{s.label}{state === 'current' ? ' (en cours)' : state === 'rejected' ? ' (rejetée)' : ''}</div>
                                    <div className="text-[11px] text-slate-400">{state === 'done' ? 'Validé' : state === 'current' ? 'En attente' : state === 'rejected' ? 'Demande rejetée' : 'À venir'}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Commentaires */}
                <h3 className="text-[13px] font-bold text-slate-800 mt-3 mb-2">Commentaires &amp; historique</h3>
                {r.comment && <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-2">{r.comment}</div>}
                {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                    <Textarea placeholder="Ajouter un commentaire (motif de rejet, note de validation…)" size="xs" autosize minRows={2} value={comment} onChange={(e) => setComment(e.currentTarget.value)} />
                )}
            </ScrollArea>

            {/* Actions */}
            <div className="pt-3 mt-2 border-t border-slate-200">
                {r.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                        <Button variant="light" color="red" size="sm" leftSection={<IconX size={15} />} onClick={onReject} loading={acting}>Rejeter</Button>
                        <Button color="teal" size="sm" leftSection={<IconCheck size={15} />} className="flex-1" onClick={onApprove} loading={acting}>Approuver</Button>
                    </div>
                )}
                {r.status === 'APPROVED' && (
                    <div className="flex items-center gap-2">
                        <Button variant="light" color="violet" size="sm" leftSection={<IconBox size={15} />} onClick={onPrepare} loading={acting}>Préparer</Button>
                        <Button color="teal" size="sm" leftSection={<IconTruck size={15} />} className="flex-1" onClick={onDeliver} loading={acting}>Distribuer</Button>
                    </div>
                )}
                {r.status === 'PREPARATION' && (
                    <Button color="teal" size="sm" leftSection={<IconTruck size={15} />} fullWidth onClick={onDeliver} loading={acting}>Distribuer</Button>
                )}
                {(r.status === 'DELIVERED' || r.status === 'REJECTED' || r.status === 'RETURNED') && (
                    <p className="text-[12px] text-slate-400 text-center">Demande {STATUS_CFG[r.status].label.toLowerCase()} — aucune action.</p>
                )}
            </div>
        </div>
    );
};

const Meta = ({ label, value }: { label: string; value: string }) => (
    <div><div className="text-[10.5px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div><div className="text-[12.5px] text-slate-800 truncate" title={value}>{value}</div></div>
);

export default PPERequestsTable;
