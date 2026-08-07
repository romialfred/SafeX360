import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActionIcon, Button, Drawer, FileInput, Loader, Menu, Pagination, ScrollArea,
    Select, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconAlertTriangle, IconArchive, IconArrowLeft, IconCalendar, IconCheck, IconDeviceFloppy,
    IconDots, IconEdit, IconEye, IconPaperclip, IconPlus, IconRefresh, IconScale, IconSearch,
} from '@tabler/icons-react';

import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getBase64, openPDF } from '../../../utility/DocumentUtility';
import { getMedia } from '../../../services/MediaService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import {
    activateObligation, createObligation, deactivateObligation, getAllObligations, updateObligation,
    type RegulatoryObligation,
} from '../../../services/RegulatoryObligationService';
import {
    CHIP_BASE, DOMAIN_OPTIONS, domainLabel, formatDateFr, OBLIGATION_CATEGORY_OPTIONS,
    obligationCategoryLabel, OBLIGATION_STATUS_OPTIONS, obligationStatusConfig, toIsoDateLocal,
} from '../regulatoryLabels';

const PAGE_SIZE = 12;
interface EmpRow { id: number; name: string }

interface FormValues {
    category: string;
    reference: string;
    article: string;
    title: string;
    domain: string | null;
    authority: string;
    description: string;
    complianceStatus: string | null;
    actionRequired: string;
    applicableSince: Date | null;
    lastReviewDate: Date | null;
    nextReviewDate: Date | null;
    responsibleEmployeeId: string | null;
    notes: string;
}

const emptyForm: FormValues = {
    category: '', reference: '', article: '', title: '', domain: null, authority: '', description: '',
    complianceStatus: 'A_EVALUER', actionRequired: '', applicableSince: null, lastReviewDate: null,
    nextReviewDate: null, responsibleEmployeeId: null, notes: '',
};

const parseDate = (v?: string | null): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

export default function ObligationRegisterPage() {
    const [rows, setRows] = useState<RegulatoryObligation[]>([]);
    const [employees, setEmployees] = useState<EmpRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [domainFilter, setDomainFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<RegulatoryObligation | null>(null);
    const [mode, setMode] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        initialValues: emptyForm,
        validate: {
            category: (v) => (v ? null : 'Nature du texte requise'),
            reference: (v) => (v.trim().length >= 2 ? null : 'Référence requise'),
            title: (v) => (v.trim().length >= 3 ? null : 'Intitulé requis (3 caractères min.)'),
        },
    });

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [data, emps] = await Promise.all([
                getAllObligations(),
                getEmployeesWithDepartment().catch(() => []),
            ]);
            setRows(Array.isArray(data) ? data : []);
            setEmployees((Array.isArray(emps) ? emps : []).map((e: any) => ({ id: e.id, name: e.name })));
            setError(null);
        } catch {
            setError("Impossible de charger le registre des obligations.");
        } finally { setLoading(false); setRefreshing(false); }
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    const empName = useCallback(
        (id?: number | null) => employees.find((e) => e.id === id)?.name ?? (id ? `#${id}` : '—'), [employees]);
    const empOptions = useMemo(() => employees.map((e) => ({ value: String(e.id), label: e.name })), [employees]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return rows.filter((o) => {
            if (domainFilter && o.domain !== domainFilter) return false;
            if (statusFilter && o.conformity !== statusFilter) return false;
            if (!needle) return true;
            return [o.reference, o.title, o.article, o.authority, obligationCategoryLabel(o.category)]
                .some((v) => (v || '').toLowerCase().includes(needle));
        });
    }, [rows, search, domainFilter, statusFilter]);

    const kpis = useMemo(() => {
        const by = (c: string) => rows.filter((o) => o.conformity === c).length;
        return {
            total: rows.length,
            conforme: by('CONFORME'),
            partiel: by('PARTIEL'),
            nonConforme: by('NON_CONFORME'),
            reviewOverdue: rows.filter((o) => o.reviewOverdue).length,
        };
    }, [rows]);

    const conformityRate = useMemo(() => {
        const assessable = rows.filter((o) => o.conformity && o.conformity !== 'SUSPENDU' && o.conformity !== 'A_EVALUER');
        if (!assessable.length) return null;
        const conf = assessable.filter((o) => o.conformity === 'CONFORME').length;
        return Math.round((conf / assessable.length) * 100);
    }, [rows]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [search, domainFilter, statusFilter]);

    const openCreate = () => { form.setValues(emptyForm); setFile(null); setEditingId(null); setMode('form'); };

    const openEdit = (o: RegulatoryObligation) => {
        form.setValues({
            category: o.category || '',
            reference: o.reference || '',
            article: o.article || '',
            title: o.title || '',
            domain: o.domain || null,
            authority: o.authority || '',
            description: o.description || '',
            complianceStatus: o.complianceStatus || 'A_EVALUER',
            actionRequired: o.actionRequired || '',
            applicableSince: parseDate(o.applicableSince),
            lastReviewDate: parseDate(o.lastReviewDate),
            nextReviewDate: parseDate(o.nextReviewDate),
            responsibleEmployeeId: o.responsibleEmployeeId ? String(o.responsibleEmployeeId) : null,
            notes: o.notes || '',
        });
        setFile(null); setEditingId(o.id ?? null); setSelected(null); setMode('form');
    };

    const buildPayload = async (v: FormValues): Promise<RegulatoryObligation> => {
        const payload: RegulatoryObligation = {
            category: v.category,
            reference: v.reference.trim(),
            article: v.article.trim() || null,
            title: v.title.trim(),
            domain: v.domain,
            authority: v.authority.trim() || null,
            description: v.description.trim() || null,
            complianceStatus: v.complianceStatus,
            actionRequired: v.actionRequired.trim() || null,
            applicableSince: toIsoDateLocal(v.applicableSince),
            lastReviewDate: toIsoDateLocal(v.lastReviewDate),
            nextReviewDate: toIsoDateLocal(v.nextReviewDate),
            responsibleEmployeeId: v.responsibleEmployeeId ? Number(v.responsibleEmployeeId) : null,
            notes: v.notes.trim() || null,
        };
        if (editingId) payload.id = editingId;
        if (file) {
            const raw = (await getBase64(file)) as string;
            payload.media = { name: file.name, type: file.type || 'application/pdf', file: raw.split(',').pop() || raw };
        }
        return payload;
    };

    const submit = form.onSubmit(async (v) => {
        setSaving(true);
        try {
            const payload = await buildPayload(v);
            if (editingId) { await updateObligation(payload); successNotification('Obligation mise à jour.'); }
            else { await createObligation(payload); successNotification('Obligation enregistrée.'); }
            setMode('list');
            await fetchData();
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || e?.response?.data?.message || "Enregistrement impossible.");
        } finally { setSaving(false); }
    });

    const toggleStatus = async (o: RegulatoryObligation) => {
        try {
            if (o.status === 'INACTIVE') await activateObligation(o.id!);
            else await deactivateObligation(o.id!);
            successNotification(o.status === 'INACTIVE' ? 'Obligation réactivée.' : 'Obligation archivée.');
            setSelected(null); await fetchData();
        } catch { errorNotification("Action impossible."); }
    };

    const openEvidence = async (mediaId?: number | null) => {
        if (!mediaId) return;
        try { const m: any = await getMedia(mediaId); if (m?.file) openPDF(m.file); }
        catch { errorNotification("Pièce jointe indisponible."); }
    };

    const header = (
        <PageHeader
            breadcrumbs={[
                { label: 'Accueil', to: '/' },
                { label: 'Conformité Réglementaire' },
                { label: 'Obligations & code minier' },
            ]}
            icon={<IconScale size={22} stroke={2} />}
            iconColor="green"
            title="Obligations réglementaires & code minier"
            subtitle="Conformité de la mine vis-à-vis des lois locales, du code minier et des textes applicables."
            actions={
                mode === 'list' ? (
                    <>
                        <Tooltip label="Actualiser">
                            <ActionIcon variant="default" size={34} onClick={fetchData} aria-label="Actualiser">
                                <IconRefresh size={16} className={refreshing ? 'animate-spin text-teal-500' : ''} />
                            </ActionIcon>
                        </Tooltip>
                        <Button size="sm" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                            Nouvelle obligation
                        </Button>
                    </>
                ) : (
                    <Button size="sm" variant="default" leftSection={<IconArrowLeft size={14} />} onClick={() => setMode('list')}>
                        Retour au registre
                    </Button>
                )
            }
        />
    );

    if (loading) {
        return (
            <div className="p-5 space-y-4 w-full">{header}
                <div className="flex items-center justify-center py-24"><Loader color="teal" /></div>
            </div>
        );
    }

    if (mode === 'form') {
        return (
            <div className="p-5 space-y-4 w-full">
                {header}
                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <header className="px-4 py-2.5 bg-green-50/60 border-b border-green-200/70 flex items-center gap-2">
                            <div className="p-1 rounded bg-green-100"><IconScale size={14} className="text-green-700" /></div>
                            <div>
                                <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, fontWeight: 600 }}>
                                    {editingId ? "Modifier l'obligation" : 'Nouvelle obligation réglementaire'}
                                </h2>
                                <p className="text-[11.5px] text-slate-500">Texte applicable et évaluation de conformité de la mine.</p>
                            </div>
                        </header>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select label="Nature du texte" withAsterisk size="sm" data={OBLIGATION_CATEGORY_OPTIONS} searchable {...form.getInputProps('category')} />
                            <Select label="Domaine" size="sm" data={DOMAIN_OPTIONS} clearable {...form.getInputProps('domain')} />
                            <TextInput label="Référence du texte" withAsterisk size="sm" placeholder="Loi 036-2015/CNT" {...form.getInputProps('reference')} />
                            <TextInput label="Article / section" size="sm" placeholder="art. 145" {...form.getInputProps('article')} />
                            <TextInput label="Intitulé de l'obligation" withAsterisk size="sm" className="md:col-span-2" {...form.getInputProps('title')} />
                            <TextInput label="Autorité de tutelle" size="sm" className="md:col-span-2" {...form.getInputProps('authority')} />
                            <Textarea label="Description de l'obligation" size="sm" rows={3} className="md:col-span-2" {...form.getInputProps('description')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Évaluation de conformité</p>
                            </div>
                            <Select label="Statut de conformité" size="sm" data={OBLIGATION_STATUS_OPTIONS} {...form.getInputProps('complianceStatus')} />
                            <Select label="Responsable du suivi" size="sm" data={empOptions} searchable clearable {...form.getInputProps('responsibleEmployeeId')} />
                            <Textarea label="Action requise (si non conforme / partiel)" size="sm" rows={2} className="md:col-span-2" {...form.getInputProps('actionRequired')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Cycle de revue & justificatif</p>
                            </div>
                            <DateInput label="Applicable depuis" size="sm" valueFormat="DD/MM/YYYY" clearable leftSection={<IconCalendar size={14} />} {...form.getInputProps('applicableSince')} />
                            <div />
                            <DateInput label="Dernière revue" size="sm" valueFormat="DD/MM/YYYY" clearable {...form.getInputProps('lastReviewDate')} />
                            <DateInput label="Prochaine revue" size="sm" valueFormat="DD/MM/YYYY" clearable {...form.getInputProps('nextReviewDate')} />
                            <FileInput label="Pièce justificative (PDF)" size="sm" accept="application/pdf"
                                placeholder={editingId ? 'Remplacer le fichier…' : 'Téléverser…'}
                                leftSection={<IconPaperclip size={14} />} value={file} onChange={setFile} clearable />
                            <Textarea label="Notes" size="sm" rows={2} {...form.getInputProps('notes')} />

                            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <Button variant="default" size="sm" onClick={() => setMode('list')}>Annuler</Button>
                                <Button type="submit" color="teal" size="sm" loading={saving} leftSection={<IconDeviceFloppy size={14} />}>Enregistrer</Button>
                            </div>
                        </div>
                    </section>
                    <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                        <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                            <h2 className="text-[13px] font-semibold text-slate-700">Repère réglementaire</h2>
                        </header>
                        <div className="p-4 space-y-3 text-[12.5px] text-slate-600">
                            <p>Chaque mine évalue sa conformité vis-à-vis des textes applicables :</p>
                            <ul className="space-y-1.5">
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /> Conforme</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} /> Partiel (action requise)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f43f5e' }} /> Non conforme</li>
                            </ul>
                            <p className="pt-2 border-t border-slate-100 text-[11.5px] text-slate-500">
                                Cadre principal : Loi 036-2015/CNT (Code minier du Burkina Faso), code de l'environnement, code du travail, conventions OIT.
                            </p>
                        </div>
                    </aside>
                </form>
            </div>
        );
    }

    return (
        <div className="p-5 space-y-4 w-full">
            {header}

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {[
                    { label: 'Obligations', value: kpis.total, color: '#0f766e', icon: <IconScale size={16} /> },
                    { label: 'Taux conformité', value: conformityRate == null ? '—' : `${conformityRate}%`, color: '#0284c7', icon: <IconCheck size={16} /> },
                    { label: 'Conformes', value: kpis.conforme, color: '#10b981', icon: <IconCheck size={16} /> },
                    { label: 'Partielles', value: kpis.partiel, color: '#f59e0b', icon: <IconAlertTriangle size={16} /> },
                    { label: 'Non conformes', value: kpis.nonConforme, color: '#f43f5e', icon: <IconAlertTriangle size={16} /> },
                    { label: 'Revue en retard', value: kpis.reviewOverdue, color: '#7c3aed', icon: <IconCalendar size={16} /> },
                ].map((k) => (
                    <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm" style={{ borderTop: `2px solid ${k.color}` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10.5px] uppercase tracking-[0.08em] text-slate-500 font-semibold">{k.label}</span>
                            <span className="w-6 h-6 rounded-md grid place-items-center" style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</span>
                        </div>
                        <div className="mt-1 text-[22px] font-black tabular-nums text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{k.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-end gap-3">
                <TextInput size="xs" label="Recherche" placeholder="Référence, article, intitulé, autorité…" leftSection={<IconSearch size={14} />}
                    value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ minWidth: 260 }} />
                <Select size="xs" label="Domaine" data={DOMAIN_OPTIONS} value={domainFilter} onChange={setDomainFilter} clearable placeholder="Tous" style={{ minWidth: 160 }} />
                <Select size="xs" label="Conformité" value={statusFilter} onChange={setStatusFilter} clearable placeholder="Toutes"
                    data={[...OBLIGATION_STATUS_OPTIONS, { value: 'SUSPENDU', label: 'Archivé' }]} style={{ minWidth: 150 }} />
                <div className="ml-auto text-[12px] text-slate-500 self-center">{filtered.length} obligation{filtered.length > 1 ? 's' : ''}</div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={<IconScale />} iconColor="emerald" title="Aucune obligation enregistrée"
                    description="Recensez les textes applicables (code minier, environnement, travail…) et l'état de conformité de la mine."
                    action={<Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>Nouvelle obligation</Button>} />
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-400 text-[11.5px] tracking-wide">
                                <tr>
                                    <th className="text-left font-semibold p-2.5">Texte</th>
                                    <th className="text-left font-semibold p-2.5">Domaine</th>
                                    <th className="text-left font-semibold p-2.5">Obligation</th>
                                    <th className="text-left font-semibold p-2.5">Autorité</th>
                                    <th className="text-left font-semibold p-2.5">Prochaine revue</th>
                                    <th className="text-left font-semibold p-2.5">Conformité</th>
                                    <th className="text-center font-semibold p-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((o) => {
                                    const cfg = obligationStatusConfig(o.conformity);
                                    const sel = selected?.id === o.id;
                                    return (
                                        <tr key={o.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                                            style={sel ? { background: 'rgba(20,184,166,0.06)', boxShadow: 'inset 3px 0 0 #14b8a6' } : undefined}
                                            onClick={() => setSelected(o)}>
                                            <td className="p-2.5">
                                                <div className="font-semibold text-slate-700">{o.reference}</div>
                                                <div className="text-[11.5px] text-slate-400">{obligationCategoryLabel(o.category)}{o.article ? ` · ${o.article}` : ''}</div>
                                            </td>
                                            <td className="p-2.5 text-slate-600">{domainLabel(o.domain)}</td>
                                            <td className="p-2.5 text-slate-600 max-w-[280px] truncate">{o.title}</td>
                                            <td className="p-2.5 text-slate-500 max-w-[150px] truncate">{o.authority || '—'}</td>
                                            <td className="p-2.5 text-slate-600 tabular-nums">
                                                {formatDateFr(o.nextReviewDate)}
                                                {o.reviewOverdue && <span className="ml-1.5 text-[11px] text-violet-600">(en retard)</span>}
                                            </td>
                                            <td className="p-2.5"><span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span></td>
                                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="inline-flex items-center gap-1">
                                                    <ActionIcon variant="subtle" color="gray" onClick={() => setSelected(o)} aria-label="Consulter"><IconEye size={16} /></ActionIcon>
                                                    <Menu position="bottom-end" withArrow>
                                                        <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Actions"><IconDots size={16} /></ActionIcon></Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(o)}>Modifier</Menu.Item>
                                                            {o.mediaId && <Menu.Item leftSection={<IconPaperclip size={14} />} onClick={() => openEvidence(o.mediaId)}>Ouvrir la pièce</Menu.Item>}
                                                            <Menu.Item leftSection={o.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconArchive size={14} />}
                                                                color={o.status === 'INACTIVE' ? 'teal' : 'red'} onClick={() => toggleStatus(o)}>
                                                                {o.status === 'INACTIVE' ? 'Réactiver' : 'Archiver'}
                                                            </Menu.Item>
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
                    {pageCount > 1 && (
                        <div className="flex justify-center py-3 border-t border-slate-100">
                            <Pagination size="sm" color="teal" value={page} onChange={setPage} total={pageCount} />
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="text-[12.5px] text-rose-600 flex items-center gap-2">
                    {error} <Button size="compact-xs" variant="subtle" onClick={fetchData}>Réessayer</Button>
                </div>
            )}

            <Drawer opened={!!selected} onClose={() => setSelected(null)} position="right" size={480}
                title={<span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>Détail de l'obligation</span>}>
                {selected && (
                    <div className="flex flex-col h-full">
                        <div className="pb-3 border-b border-slate-200">
                            <div className="text-[15px] font-semibold text-slate-800">{selected.title}</div>
                            <div className="text-[12.5px] text-slate-500">{obligationCategoryLabel(selected.category)} · {selected.reference}{selected.article ? ` · ${selected.article}` : ''}</div>
                            <div className="mt-2"><span className={`${CHIP_BASE} ${obligationStatusConfig(selected.conformity).chip}`}>{obligationStatusConfig(selected.conformity).label}</span></div>
                        </div>
                        <ScrollArea className="flex-1 -mr-4 pr-4 mt-3">
                            <div className="space-y-3 text-[13px]">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Domaine" value={domainLabel(selected.domain)} />
                                    <Field label="Autorité" value={selected.authority} />
                                </div>
                                {selected.description && <Field label="Description" value={selected.description} />}
                                {selected.actionRequired && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                                        <div className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold">Action requise</div>
                                        <div className="text-slate-700 text-[12.5px]">{selected.actionRequired}</div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Applicable depuis" value={formatDateFr(selected.applicableSince)} />
                                    <Field label="Dernière revue" value={formatDateFr(selected.lastReviewDate)} />
                                    <Field label="Prochaine revue" value={formatDateFr(selected.nextReviewDate)} />
                                    <Field label="Responsable" value={empName(selected.responsibleEmployeeId)} />
                                </div>
                                {selected.notes && <Field label="Notes" value={selected.notes} />}
                                {selected.mediaId && (
                                    <Button variant="light" color="teal" size="xs" leftSection={<IconPaperclip size={14} />}
                                        onClick={() => openEvidence(selected.mediaId)}>Ouvrir la pièce justificative</Button>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="pt-3 mt-2 border-t border-slate-200 flex gap-2">
                            <Button variant="default" size="sm" leftSection={<IconEdit size={14} />} onClick={() => openEdit(selected)} className="flex-1">Modifier</Button>
                            <Button size="sm" color={selected.status === 'INACTIVE' ? 'teal' : 'red'} variant="light"
                                leftSection={selected.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconArchive size={14} />} onClick={() => toggleStatus(selected)}>
                                {selected.status === 'INACTIVE' ? 'Réactiver' : 'Archiver'}
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
}

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
            <div className="text-slate-700" style={{ wordBreak: 'break-word' }}>{value || '—'}</div>
        </div>
    );
}
