import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActionIcon, Button, Drawer, FileInput, Loader, Menu, NumberInput, Pagination, ScrollArea,
    Select, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconArrowLeft, IconBan, IconCalendar, IconCheck, IconDeviceFloppy, IconDots, IconEdit,
    IconEye, IconGauge, IconPaperclip, IconPlus, IconRefresh, IconSearch,
} from '@tabler/icons-react';

import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getBase64, openPDF } from '../../../utility/DocumentUtility';
import { getMedia } from '../../../services/MediaService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import {
    activateInspection, createInspection, deactivateInspection, getAllInspections, updateInspection,
    type MandatoryInspection,
} from '../../../services/MandatoryInspectionService';
import {
    CHIP_BASE, conformityConfig, dueLabel, EQUIPMENT_TYPE_OPTIONS, equipmentTypeLabel, formatDateFr,
    INSPECTION_RESULT_OPTIONS, INSPECTION_TYPE_OPTIONS, inspectionResultConfig, inspectionTypeLabel,
    toIsoDateLocal,
} from '../regulatoryLabels';

const PAGE_SIZE = 12;
interface EmpRow { id: number; name: string }

interface FormValues {
    equipmentType: string;
    equipmentRef: string;
    title: string;
    inspectionType: string | null;
    inspectionBody: string;
    frequencyMonths: number | '';
    lastInspectionDate: Date | null;
    nextInspectionDate: Date | null;
    result: string | null;
    certificateNumber: string;
    responsibleEmployeeId: string | null;
    notes: string;
}

const emptyForm: FormValues = {
    equipmentType: '', equipmentRef: '', title: '', inspectionType: null, inspectionBody: '',
    frequencyMonths: '', lastInspectionDate: null, nextInspectionDate: null, result: null,
    certificateNumber: '', responsibleEmployeeId: null, notes: '',
};

const parseDate = (v?: string | null): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

export default function InspectionRegisterPage() {
    const [rows, setRows] = useState<MandatoryInspection[]>([]);
    const [employees, setEmployees] = useState<EmpRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [confFilter, setConfFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<MandatoryInspection | null>(null);
    const [mode, setMode] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        initialValues: emptyForm,
        validate: {
            equipmentType: (v) => (v ? null : 'Type requis'),
            title: (v) => (v.trim().length >= 3 ? null : 'Intitulé requis (3 caractères min.)'),
        },
    });

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [data, emps] = await Promise.all([
                getAllInspections(),
                getEmployeesWithDepartment().catch(() => []),
            ]);
            setRows(Array.isArray(data) ? data : []);
            setEmployees((Array.isArray(emps) ? emps : []).map((e: any) => ({ id: e.id, name: e.name })));
            setError(null);
        } catch {
            setError("Impossible de charger le registre des inspections.");
        } finally {
            setLoading(false); setRefreshing(false);
        }
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    const empName = useCallback(
        (id?: number | null) => employees.find((e) => e.id === id)?.name ?? (id ? `#${id}` : '—'), [employees]);
    const empOptions = useMemo(() => employees.map((e) => ({ value: String(e.id), label: e.name })), [employees]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return rows.filter((i) => {
            if (typeFilter && i.equipmentType !== typeFilter) return false;
            if (confFilter && i.conformity !== confFilter) return false;
            if (!needle) return true;
            return [i.equipmentRef, i.title, i.inspectionBody, equipmentTypeLabel(i.equipmentType)]
                .some((v) => (v || '').toLowerCase().includes(needle));
        });
    }, [rows, search, typeFilter, confFilter]);

    const kpis = useMemo(() => {
        const by = (c: string) => rows.filter((i) => i.conformity === c).length;
        return {
            total: rows.length,
            conforme: by('CONFORME'),
            aRenouveler: by('A_RENOUVELER'),
            expire: by('EXPIRE'),
            nonConforme: rows.filter((i) => i.result === 'NON_CONFORME').length,
        };
    }, [rows]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [search, typeFilter, confFilter]);

    const openCreate = () => { form.setValues(emptyForm); setFile(null); setEditingId(null); setMode('form'); };

    const openEdit = (i: MandatoryInspection) => {
        form.setValues({
            equipmentType: i.equipmentType || '',
            equipmentRef: i.equipmentRef || '',
            title: i.title || '',
            inspectionType: i.inspectionType || null,
            inspectionBody: i.inspectionBody || '',
            frequencyMonths: i.frequencyMonths ?? '',
            lastInspectionDate: parseDate(i.lastInspectionDate),
            nextInspectionDate: parseDate(i.nextInspectionDate),
            result: i.result || null,
            certificateNumber: i.certificateNumber || '',
            responsibleEmployeeId: i.responsibleEmployeeId ? String(i.responsibleEmployeeId) : null,
            notes: i.notes || '',
        });
        setFile(null); setEditingId(i.id ?? null); setSelected(null); setMode('form');
    };

    const buildPayload = async (v: FormValues): Promise<MandatoryInspection> => {
        const payload: MandatoryInspection = {
            equipmentType: v.equipmentType,
            equipmentRef: v.equipmentRef.trim() || null,
            title: v.title.trim(),
            inspectionType: v.inspectionType || undefined,
            inspectionBody: v.inspectionBody.trim() || null,
            frequencyMonths: v.frequencyMonths === '' ? null : Number(v.frequencyMonths),
            lastInspectionDate: toIsoDateLocal(v.lastInspectionDate),
            nextInspectionDate: toIsoDateLocal(v.nextInspectionDate),
            result: v.result || null,
            certificateNumber: v.certificateNumber.trim() || null,
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
            if (editingId) { await updateInspection(payload); successNotification('Inspection mise à jour.'); }
            else { await createInspection(payload); successNotification('Inspection enregistrée.'); }
            setMode('list');
            await fetchData();
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || e?.response?.data?.message || "Enregistrement impossible.");
        } finally { setSaving(false); }
    });

    const toggleStatus = async (i: MandatoryInspection) => {
        try {
            if (i.status === 'INACTIVE') await activateInspection(i.id!);
            else await deactivateInspection(i.id!);
            successNotification(i.status === 'INACTIVE' ? 'Suivi réactivé.' : 'Suivi suspendu.');
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
                { label: 'Inspections équipements' },
            ]}
            icon={<IconGauge size={22} stroke={2} />}
            iconColor="green"
            title="Inspections réglementaires d'équipements"
            subtitle="Contrôles périodiques obligatoires : cuves sous pression, levage, réservoirs, installations…"
            actions={
                mode === 'list' ? (
                    <>
                        <Tooltip label="Actualiser">
                            <ActionIcon variant="default" size={34} onClick={fetchData} aria-label="Actualiser">
                                <IconRefresh size={16} className={refreshing ? 'animate-spin text-teal-500' : ''} />
                            </ActionIcon>
                        </Tooltip>
                        <Button size="sm" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                            Nouvelle inspection
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
                            <div className="p-1 rounded bg-green-100"><IconGauge size={14} className="text-green-700" /></div>
                            <div>
                                <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, fontWeight: 600 }}>
                                    {editingId ? "Modifier l'inspection" : 'Nouvelle inspection réglementaire'}
                                </h2>
                                <p className="text-[11.5px] text-slate-500">Contrôle périodique d'un équipement soumis à obligation.</p>
                            </div>
                        </header>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select label="Type d'équipement" withAsterisk size="sm" data={EQUIPMENT_TYPE_OPTIONS} searchable {...form.getInputProps('equipmentType')} />
                            <TextInput label="Repère équipement" size="sm" placeholder="CIL-CUVE-03" {...form.getInputProps('equipmentRef')} />
                            <TextInput label="Intitulé" withAsterisk size="sm" className="md:col-span-2" {...form.getInputProps('title')} />
                            <Select label="Type de contrôle" size="sm" data={INSPECTION_TYPE_OPTIONS} clearable searchable {...form.getInputProps('inspectionType')} />
                            <TextInput label="Organisme agréé" size="sm" placeholder="APAVE, Bureau Veritas, SOCOTEC…" {...form.getInputProps('inspectionBody')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Périodicité & échéances</p>
                            </div>
                            <NumberInput label="Périodicité (mois)" size="sm" min={1} {...form.getInputProps('frequencyMonths')} />
                            <div />
                            <DateInput label="Dernière inspection" size="sm" valueFormat="DD/MM/YYYY" clearable
                                leftSection={<IconCalendar size={14} />} {...form.getInputProps('lastInspectionDate')} />
                            <DateInput label="Prochaine inspection" size="sm" valueFormat="DD/MM/YYYY" clearable {...form.getInputProps('nextInspectionDate')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Résultat & justificatif</p>
                            </div>
                            <Select label="Résultat" size="sm" data={INSPECTION_RESULT_OPTIONS} clearable {...form.getInputProps('result')} />
                            <TextInput label="N° de certificat / rapport" size="sm" {...form.getInputProps('certificateNumber')} />
                            <Select label="Responsable du suivi" size="sm" data={empOptions} searchable clearable {...form.getInputProps('responsibleEmployeeId')} />
                            <FileInput label="Rapport / certificat (PDF)" size="sm" accept="application/pdf"
                                placeholder={editingId ? 'Remplacer le fichier…' : 'Téléverser…'}
                                leftSection={<IconPaperclip size={14} />} value={file} onChange={setFile} clearable />
                            <Textarea label="Notes / réserves" size="sm" rows={2} className="md:col-span-2" {...form.getInputProps('notes')} />

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
                            <p>La conformité est calculée à partir de la <b>prochaine inspection</b> :</p>
                            <ul className="space-y-1.5">
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /> Conforme (&gt; 60 j)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} /> À planifier (≤ 60 j)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f43f5e' }} /> En retard</li>
                            </ul>
                            <p className="pt-2 border-t border-slate-100 text-[11.5px] text-slate-500">
                                La prochaine échéance peut se déduire de la dernière inspection + la périodicité réglementaire.
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
                    { label: 'Équipements suivis', value: kpis.total, color: '#0f766e', icon: <IconGauge size={16} /> },
                    { label: 'Conformes', value: kpis.conforme, color: '#10b981', icon: <IconCheck size={16} /> },
                    { label: 'À planifier', value: kpis.aRenouveler, color: '#f59e0b', icon: <IconCalendar size={16} /> },
                    { label: 'En retard', value: kpis.expire, color: '#f43f5e', icon: <IconBan size={16} /> },
                    { label: 'Non conformes', value: kpis.nonConforme, color: '#e11d48', icon: <IconBan size={16} /> },
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
                <TextInput size="xs" label="Recherche" placeholder="Repère, intitulé, organisme…" leftSection={<IconSearch size={14} />}
                    value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ minWidth: 240 }} />
                <Select size="xs" label="Équipement" data={EQUIPMENT_TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} clearable searchable placeholder="Tous" style={{ minWidth: 190 }} />
                <Select size="xs" label="Conformité" value={confFilter} onChange={setConfFilter} clearable placeholder="Toutes"
                    data={[
                        { value: 'CONFORME', label: 'Conforme' },
                        { value: 'A_RENOUVELER', label: 'À planifier' },
                        { value: 'EXPIRE', label: 'En retard' },
                        { value: 'SUSPENDU', label: 'Suspendu' },
                    ]} style={{ minWidth: 150 }} />
                <div className="ml-auto text-[12px] text-slate-500 self-center">{filtered.length} équipement{filtered.length > 1 ? 's' : ''}</div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={<IconGauge />} iconColor="emerald" title="Aucune inspection enregistrée"
                    description="Enregistrez les contrôles réglementaires des équipements soumis à obligation."
                    action={<Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>Nouvelle inspection</Button>} />
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-400 text-[11.5px] tracking-wide">
                                <tr>
                                    <th className="text-left font-semibold p-2.5">Équipement</th>
                                    <th className="text-left font-semibold p-2.5">Type</th>
                                    <th className="text-left font-semibold p-2.5">Contrôle</th>
                                    <th className="text-left font-semibold p-2.5">Organisme</th>
                                    <th className="text-left font-semibold p-2.5">Prochaine</th>
                                    <th className="text-left font-semibold p-2.5">Résultat</th>
                                    <th className="text-left font-semibold p-2.5">Conformité</th>
                                    <th className="text-center font-semibold p-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((i) => {
                                    const cfg = conformityConfig(i.conformity);
                                    const res = inspectionResultConfig(i.result);
                                    const sel = selected?.id === i.id;
                                    return (
                                        <tr key={i.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                                            style={sel ? { background: 'rgba(20,184,166,0.06)', boxShadow: 'inset 3px 0 0 #14b8a6' } : undefined}
                                            onClick={() => setSelected(i)}>
                                            <td className="p-2.5">
                                                <div className="font-semibold text-slate-700">{i.equipmentRef || i.title}</div>
                                                {i.equipmentRef && <div className="text-[11.5px] text-slate-400 max-w-[200px] truncate">{i.title}</div>}
                                            </td>
                                            <td className="p-2.5 text-slate-600">{equipmentTypeLabel(i.equipmentType)}</td>
                                            <td className="p-2.5 text-slate-600">{inspectionTypeLabel(i.inspectionType)}</td>
                                            <td className="p-2.5 text-slate-500 max-w-[150px] truncate">{i.inspectionBody || '—'}</td>
                                            <td className="p-2.5 text-slate-600 tabular-nums">
                                                {formatDateFr(i.nextInspectionDate)}
                                                {i.daysToNext != null && i.conformity !== 'CONFORME' && i.conformity !== 'SUSPENDU' && (
                                                    <span className="ml-1.5 text-[11px]" style={{ color: cfg.dot }}>({dueLabel(i.daysToNext)})</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">{res ? <span className={`${CHIP_BASE} ${res.chip}`}>{res.label}</span> : <span className="text-slate-400">—</span>}</td>
                                            <td className="p-2.5"><span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span></td>
                                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="inline-flex items-center gap-1">
                                                    <ActionIcon variant="subtle" color="gray" onClick={() => setSelected(i)} aria-label="Consulter"><IconEye size={16} /></ActionIcon>
                                                    <Menu position="bottom-end" withArrow>
                                                        <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Actions"><IconDots size={16} /></ActionIcon></Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(i)}>Modifier</Menu.Item>
                                                            {i.mediaId && <Menu.Item leftSection={<IconPaperclip size={14} />} onClick={() => openEvidence(i.mediaId)}>Ouvrir la pièce</Menu.Item>}
                                                            <Menu.Item leftSection={i.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />}
                                                                color={i.status === 'INACTIVE' ? 'teal' : 'red'} onClick={() => toggleStatus(i)}>
                                                                {i.status === 'INACTIVE' ? 'Réactiver' : 'Suspendre'}
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
                title={<span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>Détail de l'inspection</span>}>
                {selected && (
                    <div className="flex flex-col h-full">
                        <div className="pb-3 border-b border-slate-200">
                            <div className="text-[15px] font-semibold text-slate-800">{selected.title}</div>
                            <div className="text-[12.5px] text-slate-500">{equipmentTypeLabel(selected.equipmentType)}{selected.equipmentRef ? ` · ${selected.equipmentRef}` : ''}</div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`${CHIP_BASE} ${conformityConfig(selected.conformity).chip}`}>{conformityConfig(selected.conformity).label}</span>
                                {inspectionResultConfig(selected.result) && (
                                    <span className={`${CHIP_BASE} ${inspectionResultConfig(selected.result)!.chip}`}>{inspectionResultConfig(selected.result)!.label}</span>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-1 -mr-4 pr-4 mt-3">
                            <div className="space-y-3 text-[13px]">
                                <Field label="Type de contrôle" value={inspectionTypeLabel(selected.inspectionType)} />
                                <Field label="Organisme agréé" value={selected.inspectionBody} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Périodicité" value={selected.frequencyMonths ? `${selected.frequencyMonths} mois` : '—'} />
                                    <Field label="N° certificat" value={selected.certificateNumber} />
                                    <Field label="Dernière" value={formatDateFr(selected.lastInspectionDate)} />
                                    <Field label="Prochaine" value={formatDateFr(selected.nextInspectionDate)} />
                                </div>
                                <Field label="Responsable" value={empName(selected.responsibleEmployeeId)} />
                                {selected.notes && <Field label="Notes / réserves" value={selected.notes} />}
                                {selected.mediaId && (
                                    <Button variant="light" color="teal" size="xs" leftSection={<IconPaperclip size={14} />}
                                        onClick={() => openEvidence(selected.mediaId)}>Ouvrir le rapport / certificat</Button>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="pt-3 mt-2 border-t border-slate-200 flex gap-2">
                            <Button variant="default" size="sm" leftSection={<IconEdit size={14} />} onClick={() => openEdit(selected)} className="flex-1">Modifier</Button>
                            <Button size="sm" color={selected.status === 'INACTIVE' ? 'teal' : 'red'} variant="light"
                                leftSection={selected.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />} onClick={() => toggleStatus(selected)}>
                                {selected.status === 'INACTIVE' ? 'Réactiver' : 'Suspendre'}
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
