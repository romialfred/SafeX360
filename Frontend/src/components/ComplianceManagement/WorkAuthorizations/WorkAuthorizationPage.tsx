import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActionIcon, Button, Drawer, FileInput, Loader, Menu, Pagination, ScrollArea,
    Select, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconArrowLeft, IconBan, IconCalendar, IconCheck, IconDeviceFloppy, IconDots, IconEdit,
    IconEye, IconHammer, IconMapPin, IconPaperclip, IconPlus, IconRefresh, IconSearch,
} from '@tabler/icons-react';

import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getBase64, openPDF } from '../../../utility/DocumentUtility';
import { getMedia } from '../../../services/MediaService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import {
    closeAuthorization, createAuthorization, getAllAuthorizations, reopenAuthorization,
    updateAuthorization, type WorkAuthorization,
} from '../../../services/WorkAuthorizationService';
import {
    AUTHORIZATION_TYPE_OPTIONS, authorizationTypeLabel, authStatusConfig, CHIP_BASE,
    dueLabel, formatDateFr, RISK_LEVEL_OPTIONS, riskLevelConfig, toIsoDateLocal,
} from '../regulatoryLabels';

const PAGE_SIZE = 12;

interface EmpRow { id: number; name: string }

interface FormValues {
    authorizationType: string;
    reference: string;
    title: string;
    zone: string;
    riskLevel: string | null;
    requestedByEmployeeId: string | null;
    approvedByEmployeeId: string | null;
    issueDate: Date | null;
    validFrom: Date | null;
    validTo: Date | null;
    precautions: string;
    notes: string;
}

const emptyForm: FormValues = {
    authorizationType: '', reference: '', title: '', zone: '', riskLevel: null,
    requestedByEmployeeId: null, approvedByEmployeeId: null,
    issueDate: null, validFrom: null, validTo: null, precautions: '', notes: '',
};

const parseDate = (v?: string | null): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

export default function WorkAuthorizationPage() {
    const [rows, setRows] = useState<WorkAuthorization[]>([]);
    const [employees, setEmployees] = useState<EmpRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<WorkAuthorization | null>(null);
    const [mode, setMode] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        initialValues: emptyForm,
        validate: {
            authorizationType: (v) => (v ? null : 'Type requis'),
            reference: (v) => (v.trim().length >= 2 ? null : 'Référence requise'),
            title: (v) => (v.trim().length >= 3 ? null : 'Intitulé requis (3 caractères min.)'),
        },
    });

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [data, emps] = await Promise.all([
                getAllAuthorizations(),
                getEmployeesWithDepartment().catch(() => []),
            ]);
            setRows(Array.isArray(data) ? data : []);
            setEmployees((Array.isArray(emps) ? emps : []).map((e: any) => ({ id: e.id, name: e.name })));
            setError(null);
        } catch {
            setError("Impossible de charger le registre des autorisations.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const empName = useCallback(
        (id?: number | null) => employees.find((e) => e.id === id)?.name ?? (id ? `#${id}` : '—'),
        [employees],
    );
    const empOptions = useMemo(() => employees.map((e) => ({ value: String(e.id), label: e.name })), [employees]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return rows.filter((a) => {
            if (typeFilter && a.authorizationType !== typeFilter) return false;
            if (statusFilter && a.conformity !== statusFilter) return false;
            if (!needle) return true;
            return [a.reference, a.title, a.zone, authorizationTypeLabel(a.authorizationType)]
                .some((v) => (v || '').toLowerCase().includes(needle));
        });
    }, [rows, search, typeFilter, statusFilter]);

    const kpis = useMemo(() => {
        const by = (c: string) => rows.filter((a) => a.conformity === c).length;
        return {
            total: rows.length,
            enCours: by('EN_COURS'),
            planifie: by('PLANIFIE'),
            expire: by('EXPIRE'),
            critique: rows.filter((a) => a.riskLevel === 'CRITIQUE' && a.conformity === 'EN_COURS').length,
        };
    }, [rows]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

    const openCreate = () => { form.setValues(emptyForm); setFile(null); setEditingId(null); setMode('form'); };

    const openEdit = (a: WorkAuthorization) => {
        form.setValues({
            authorizationType: a.authorizationType || '',
            reference: a.reference || '',
            title: a.title || '',
            zone: a.zone || '',
            riskLevel: a.riskLevel || null,
            requestedByEmployeeId: a.requestedByEmployeeId ? String(a.requestedByEmployeeId) : null,
            approvedByEmployeeId: a.approvedByEmployeeId ? String(a.approvedByEmployeeId) : null,
            issueDate: parseDate(a.issueDate),
            validFrom: parseDate(a.validFrom),
            validTo: parseDate(a.validTo),
            precautions: a.precautions || '',
            notes: a.notes || '',
        });
        setFile(null); setEditingId(a.id ?? null); setSelected(null); setMode('form');
    };

    const buildPayload = async (v: FormValues): Promise<WorkAuthorization> => {
        const payload: WorkAuthorization = {
            authorizationType: v.authorizationType,
            reference: v.reference.trim(),
            title: v.title.trim(),
            zone: v.zone.trim() || null,
            riskLevel: v.riskLevel,
            requestedByEmployeeId: v.requestedByEmployeeId ? Number(v.requestedByEmployeeId) : null,
            approvedByEmployeeId: v.approvedByEmployeeId ? Number(v.approvedByEmployeeId) : null,
            issueDate: toIsoDateLocal(v.issueDate),
            validFrom: toIsoDateLocal(v.validFrom),
            validTo: toIsoDateLocal(v.validTo),
            precautions: v.precautions.trim() || null,
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
            if (editingId) { await updateAuthorization(payload); successNotification('Autorisation mise à jour.'); }
            else { await createAuthorization(payload); successNotification('Autorisation enregistrée.'); }
            setMode('list');
            await fetchData();
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || e?.response?.data?.message || "Enregistrement impossible.");
        } finally { setSaving(false); }
    });

    const toggleStatus = async (a: WorkAuthorization) => {
        try {
            if (a.status === 'INACTIVE') await reopenAuthorization(a.id!);
            else await closeAuthorization(a.id!);
            successNotification(a.status === 'INACTIVE' ? 'Autorisation rouverte.' : 'Autorisation clôturée.');
            setSelected(null);
            await fetchData();
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
                { label: 'Autorisations de travaux' },
            ]}
            icon={<IconHammer size={22} stroke={2} />}
            iconColor="green"
            title="Autorisations de travaux"
            subtitle="Permis de travail à risque : excavation, hauteur, forage, dynamitage, travail à chaud…"
            actions={
                mode === 'list' ? (
                    <>
                        <Tooltip label="Actualiser">
                            <ActionIcon variant="default" size={34} onClick={fetchData} aria-label="Actualiser">
                                <IconRefresh size={16} className={refreshing ? 'animate-spin text-teal-500' : ''} />
                            </ActionIcon>
                        </Tooltip>
                        <Button size="sm" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                            Nouvelle autorisation
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
                            <div className="p-1 rounded bg-green-100"><IconHammer size={14} className="text-green-700" /></div>
                            <div>
                                <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, fontWeight: 600 }}>
                                    {editingId ? "Modifier l'autorisation" : 'Nouvelle autorisation de travaux'}
                                </h2>
                                <p className="text-[11.5px] text-slate-500">Permis de travail à risque de la mine active.</p>
                            </div>
                        </header>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select label="Type de travaux" withAsterisk size="sm" data={AUTHORIZATION_TYPE_OPTIONS}
                                searchable {...form.getInputProps('authorizationType')} />
                            <TextInput label="Référence / n°" withAsterisk size="sm" placeholder="PT-DYN-2026-054"
                                {...form.getInputProps('reference')} />
                            <TextInput label="Intitulé" withAsterisk size="sm" className="md:col-span-2" {...form.getInputProps('title')} />
                            <TextInput label="Zone / lieu" size="sm" leftSection={<IconMapPin size={14} />} {...form.getInputProps('zone')} />
                            <Select label="Niveau de risque" size="sm" data={RISK_LEVEL_OPTIONS} clearable {...form.getInputProps('riskLevel')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Fenêtre de validité</p>
                            </div>
                            <DateInput label="Date d'émission" size="sm" valueFormat="DD/MM/YYYY" clearable
                                leftSection={<IconCalendar size={14} />} {...form.getInputProps('issueDate')} />
                            <div />
                            <DateInput label="Valide du" size="sm" valueFormat="DD/MM/YYYY" clearable {...form.getInputProps('validFrom')} />
                            <DateInput label="Valide jusqu'au" size="sm" valueFormat="DD/MM/YYYY" clearable {...form.getInputProps('validTo')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Acteurs & mesures</p>
                            </div>
                            <Select label="Demandeur" size="sm" data={empOptions} searchable clearable {...form.getInputProps('requestedByEmployeeId')} />
                            <Select label="Approbateur" size="sm" data={empOptions} searchable clearable {...form.getInputProps('approvedByEmployeeId')} />
                            <Textarea label="Mesures de prévention / conditions" size="sm" rows={3} className="md:col-span-2"
                                {...form.getInputProps('precautions')} />
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
                            <h2 className="text-[13px] font-semibold text-slate-700">Repère</h2>
                        </header>
                        <div className="p-4 space-y-3 text-[12.5px] text-slate-600">
                            <p>Une autorisation est un <b>permis à fenêtre</b>. Son statut est calculé automatiquement :</p>
                            <ul className="space-y-1.5">
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /> En cours (fenêtre active)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#0284c7' }} /> Planifié (à venir)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f43f5e' }} /> Expiré</li>
                            </ul>
                            <p className="pt-2 border-t border-slate-100 text-[11.5px] text-slate-500">
                                Les travaux à haut risque (dynamitage, espace confiné, travail à chaud) exigent des mesures de prévention documentées.
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

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {[
                    { label: 'Autorisations', value: kpis.total, color: '#0f766e', icon: <IconHammer size={16} /> },
                    { label: 'En cours', value: kpis.enCours, color: '#10b981', icon: <IconCheck size={16} /> },
                    { label: 'Planifiées', value: kpis.planifie, color: '#0284c7', icon: <IconCalendar size={16} /> },
                    { label: 'Expirées', value: kpis.expire, color: '#f43f5e', icon: <IconBan size={16} /> },
                    { label: 'Critiques actives', value: kpis.critique, color: '#ea580c', icon: <IconHammer size={16} /> },
                ].map((k) => (
                    <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm" style={{ borderTop: `2px solid ${k.color}` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10.5px] uppercase tracking-[0.08em] text-slate-500 font-semibold">{k.label}</span>
                            <span className="w-6 h-6 rounded-md grid place-items-center" style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</span>
                        </div>
                        <div className="mt-1 text-[24px] font-black tabular-nums text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{k.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-end gap-3">
                <TextInput size="xs" label="Recherche" placeholder="Référence, intitulé, zone…" leftSection={<IconSearch size={14} />}
                    value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ minWidth: 240 }} />
                <Select size="xs" label="Type" data={AUTHORIZATION_TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} clearable searchable placeholder="Tous" style={{ minWidth: 190 }} />
                <Select size="xs" label="Statut" value={statusFilter} onChange={setStatusFilter} clearable placeholder="Tous"
                    data={[
                        { value: 'EN_COURS', label: 'En cours' },
                        { value: 'PLANIFIE', label: 'Planifié' },
                        { value: 'EXPIRE', label: 'Expiré' },
                        { value: 'CLOTURE', label: 'Clôturé' },
                    ]} style={{ minWidth: 150 }} />
                <div className="ml-auto text-[12px] text-slate-500 self-center">{filtered.length} autorisation{filtered.length > 1 ? 's' : ''}</div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={<IconHammer />} iconColor="emerald" title="Aucune autorisation enregistrée"
                    description="Enregistrez les permis de travail à risque pour suivre leur validité et leurs mesures."
                    action={<Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>Nouvelle autorisation</Button>} />
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-400 text-[11.5px] tracking-wide">
                                <tr>
                                    <th className="text-left font-semibold p-2.5">Référence</th>
                                    <th className="text-left font-semibold p-2.5">Type</th>
                                    <th className="text-left font-semibold p-2.5">Intitulé</th>
                                    <th className="text-left font-semibold p-2.5">Zone</th>
                                    <th className="text-left font-semibold p-2.5">Risque</th>
                                    <th className="text-left font-semibold p-2.5">Fin de validité</th>
                                    <th className="text-left font-semibold p-2.5">Statut</th>
                                    <th className="text-center font-semibold p-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((a) => {
                                    const cfg = authStatusConfig(a.conformity);
                                    const risk = riskLevelConfig(a.riskLevel);
                                    const sel = selected?.id === a.id;
                                    return (
                                        <tr key={a.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                                            style={sel ? { background: 'rgba(20,184,166,0.06)', boxShadow: 'inset 3px 0 0 #14b8a6' } : undefined}
                                            onClick={() => setSelected(a)}>
                                            <td className="p-2.5 font-semibold text-slate-700">{a.reference || '—'}</td>
                                            <td className="p-2.5 text-slate-600">{authorizationTypeLabel(a.authorizationType)}</td>
                                            <td className="p-2.5 text-slate-600 max-w-[220px] truncate">{a.title}</td>
                                            <td className="p-2.5 text-slate-500 max-w-[140px] truncate">{a.zone || '—'}</td>
                                            <td className="p-2.5">{risk ? <span className={`${CHIP_BASE} ${risk.chip}`}>{risk.label}</span> : <span className="text-slate-400">—</span>}</td>
                                            <td className="p-2.5 text-slate-600 tabular-nums">
                                                {formatDateFr(a.validTo)}
                                                {a.daysToEnd != null && (a.conformity === 'EN_COURS' || a.conformity === 'EXPIRE') && (
                                                    <span className="ml-1.5 text-[11px]" style={{ color: cfg.dot }}>({dueLabel(a.daysToEnd)})</span>
                                                )}
                                            </td>
                                            <td className="p-2.5"><span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span></td>
                                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="inline-flex items-center gap-1">
                                                    <ActionIcon variant="subtle" color="gray" onClick={() => setSelected(a)} aria-label="Consulter"><IconEye size={16} /></ActionIcon>
                                                    <Menu position="bottom-end" withArrow>
                                                        <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Actions"><IconDots size={16} /></ActionIcon></Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(a)}>Modifier</Menu.Item>
                                                            {a.mediaId && <Menu.Item leftSection={<IconPaperclip size={14} />} onClick={() => openEvidence(a.mediaId)}>Ouvrir la pièce</Menu.Item>}
                                                            <Menu.Item leftSection={a.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />}
                                                                color={a.status === 'INACTIVE' ? 'teal' : 'red'} onClick={() => toggleStatus(a)}>
                                                                {a.status === 'INACTIVE' ? 'Rouvrir' : 'Clôturer'}
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

            <Drawer opened={!!selected} onClose={() => setSelected(null)} position="right" size={470}
                title={<span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>Détail de l'autorisation</span>}>
                {selected && (
                    <div className="flex flex-col h-full">
                        <div className="pb-3 border-b border-slate-200">
                            <div className="text-[15px] font-semibold text-slate-800">{selected.title}</div>
                            <div className="text-[12.5px] text-slate-500">{authorizationTypeLabel(selected.authorizationType)} · {selected.reference}</div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`${CHIP_BASE} ${authStatusConfig(selected.conformity).chip}`}>{authStatusConfig(selected.conformity).label}</span>
                                {riskLevelConfig(selected.riskLevel) && (
                                    <span className={`${CHIP_BASE} ${riskLevelConfig(selected.riskLevel)!.chip}`}>Risque {riskLevelConfig(selected.riskLevel)!.label}</span>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-1 -mr-4 pr-4 mt-3">
                            <div className="space-y-3 text-[13px]">
                                <Field label="Zone / lieu" value={selected.zone} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Émission" value={formatDateFr(selected.issueDate)} />
                                    <Field label="Valide du" value={formatDateFr(selected.validFrom)} />
                                    <Field label="Valide jusqu'au" value={formatDateFr(selected.validTo)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Demandeur" value={empName(selected.requestedByEmployeeId)} />
                                    <Field label="Approbateur" value={empName(selected.approvedByEmployeeId)} />
                                </div>
                                {selected.precautions && <Field label="Mesures de prévention" value={selected.precautions} />}
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
                                leftSection={selected.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />} onClick={() => toggleStatus(selected)}>
                                {selected.status === 'INACTIVE' ? 'Rouvrir' : 'Clôturer'}
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
