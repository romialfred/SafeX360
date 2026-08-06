import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActionIcon, Button, Drawer, FileInput, Loader, Menu, NumberInput,
    Pagination, ScrollArea, Select, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconArrowLeft, IconBan, IconCalendar, IconCertificate, IconCheck, IconDeviceFloppy,
    IconDots, IconEdit, IconEye, IconMapPin, IconPaperclip, IconPlus, IconRefresh,
    IconSearch, IconWorld,
} from '@tabler/icons-react';

import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getBase64, openPDF } from '../../../utility/DocumentUtility';
import { getMedia } from '../../../services/MediaService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import {
    activateLicense, createLicense, deactivateLicense, getAllLicenses, updateLicense,
    type License,
} from '../../../services/RegulatoryLicenseService';
import {
    CHIP_BASE, conformityConfig, dueLabel, fmtArea, fmtXof, formatDateFr,
    LICENSE_TYPE_OPTIONS, licenseTypeLabel, toIsoDateLocal,
} from '../regulatoryLabels';

const PAGE_SIZE = 12;

interface EmpRow { id: number; name: string }

interface FormValues {
    licenseType: string;
    reference: string;
    title: string;
    issuingAuthority: string;
    holder: string;
    issueDate: Date | null;
    effectiveDate: Date | null;
    expiryDate: Date | null;
    renewalDeadline: Date | null;
    areaHectares: number | '';
    perimeter: string;
    feeAmount: number | '';
    responsibleEmployeeId: string | null;
    notes: string;
}

const emptyForm: FormValues = {
    licenseType: '', reference: '', title: '', issuingAuthority: '', holder: '',
    issueDate: null, effectiveDate: null, expiryDate: null, renewalDeadline: null,
    areaHectares: '', perimeter: '', feeAmount: '', responsibleEmployeeId: null, notes: '',
};

const parseDate = (v?: string | null): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

export default function LicenseRegisterPage() {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [employees, setEmployees] = useState<EmpRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [confFilter, setConfFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<License | null>(null);
    const [mode, setMode] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        initialValues: emptyForm,
        validate: {
            licenseType: (v) => (v ? null : 'Type requis'),
            reference: (v) => (v.trim().length >= 2 ? null : 'Référence requise'),
            title: (v) => (v.trim().length >= 3 ? null : 'Intitulé requis (3 caractères min.)'),
        },
    });

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [lic, emps] = await Promise.all([
                getAllLicenses(),
                getEmployeesWithDepartment().catch(() => []),
            ]);
            setLicenses(Array.isArray(lic) ? lic : []);
            setEmployees((Array.isArray(emps) ? emps : []).map((e: any) => ({ id: e.id, name: e.name })));
            setError(null);
        } catch {
            setError("Impossible de charger le registre des licences.");
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
    const empOptions = useMemo(
        () => employees.map((e) => ({ value: String(e.id), label: e.name })),
        [employees],
    );

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return licenses.filter((l) => {
            if (typeFilter && l.licenseType !== typeFilter) return false;
            if (confFilter && l.conformity !== confFilter) return false;
            if (!needle) return true;
            return [l.reference, l.title, l.issuingAuthority, l.holder, licenseTypeLabel(l.licenseType)]
                .some((v) => (v || '').toLowerCase().includes(needle));
        });
    }, [licenses, search, typeFilter, confFilter]);

    const kpis = useMemo(() => {
        const by = (c: string) => licenses.filter((l) => l.conformity === c).length;
        const area = licenses.reduce((s, l) => s + (l.areaHectares || 0), 0);
        return {
            total: licenses.length,
            conforme: by('CONFORME'),
            aRenouveler: by('A_RENOUVELER'),
            expire: by('EXPIRE'),
            area,
        };
    }, [licenses]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [search, typeFilter, confFilter]);

    // ─── Form ────────────────────────────────────────────────────────────────
    const openCreate = () => {
        form.setValues(emptyForm);
        setFile(null);
        setEditingId(null);
        setMode('form');
    };

    const openEdit = (l: License) => {
        form.setValues({
            licenseType: l.licenseType || '',
            reference: l.reference || '',
            title: l.title || '',
            issuingAuthority: l.issuingAuthority || '',
            holder: l.holder || '',
            issueDate: parseDate(l.issueDate),
            effectiveDate: parseDate(l.effectiveDate),
            expiryDate: parseDate(l.expiryDate),
            renewalDeadline: parseDate(l.renewalDeadline),
            areaHectares: l.areaHectares ?? '',
            perimeter: l.perimeter || '',
            feeAmount: l.feeAmount ?? '',
            responsibleEmployeeId: l.responsibleEmployeeId ? String(l.responsibleEmployeeId) : null,
            notes: l.notes || '',
        });
        setFile(null);
        setEditingId(l.id ?? null);
        setSelected(null);
        setMode('form');
    };

    const buildPayload = async (v: FormValues): Promise<License> => {
        const payload: License = {
            licenseType: v.licenseType,
            reference: v.reference.trim(),
            title: v.title.trim(),
            issuingAuthority: v.issuingAuthority.trim() || undefined,
            holder: v.holder.trim() || undefined,
            issueDate: toIsoDateLocal(v.issueDate),
            effectiveDate: toIsoDateLocal(v.effectiveDate),
            expiryDate: toIsoDateLocal(v.expiryDate),
            renewalDeadline: toIsoDateLocal(v.renewalDeadline),
            areaHectares: v.areaHectares === '' ? null : Number(v.areaHectares),
            perimeter: v.perimeter.trim() || null,
            feeAmount: v.feeAmount === '' ? null : Number(v.feeAmount),
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
            if (editingId) {
                await updateLicense(payload);
                successNotification('Licence mise à jour.');
            } else {
                await createLicense(payload);
                successNotification('Licence enregistrée.');
            }
            setMode('list');
            await fetchData();
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || e?.response?.data?.message
                || "Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    });

    const toggleStatus = async (l: License) => {
        try {
            if (l.status === 'INACTIVE') await activateLicense(l.id!);
            else await deactivateLicense(l.id!);
            successNotification(l.status === 'INACTIVE' ? 'Licence réactivée.' : 'Licence suspendue.');
            setSelected(null);
            await fetchData();
        } catch {
            errorNotification("Action impossible.");
        }
    };

    const openEvidence = async (mediaId?: number | null) => {
        if (!mediaId) return;
        try {
            const m: any = await getMedia(mediaId);
            if (m?.file) openPDF(m.file);
        } catch {
            errorNotification("Pièce jointe indisponible.");
        }
    };

    // ─── Rendu ─────────────────────────────────────────────────────────────────
    const header = (
        <PageHeader
            breadcrumbs={[
                { label: 'Accueil', to: '/' },
                { label: 'Conformité Réglementaire' },
                { label: 'Licences & permis' },
            ]}
            icon={<IconCertificate size={22} stroke={2} />}
            iconColor="green"
            title="Licences & permis d'exploitation"
            subtitle="Titres miniers, autorisations et échéances de renouvellement de la mine."
            actions={
                mode === 'list' ? (
                    <>
                        <Tooltip label="Actualiser">
                            <ActionIcon variant="default" size={34} onClick={fetchData} aria-label="Actualiser">
                                <IconRefresh size={16} className={refreshing ? 'animate-spin text-teal-500' : ''} />
                            </ActionIcon>
                        </Tooltip>
                        <Button size="sm" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                            Nouvelle licence
                        </Button>
                    </>
                ) : (
                    <Button size="sm" variant="default" leftSection={<IconArrowLeft size={14} />}
                        onClick={() => setMode('list')}>
                        Retour au registre
                    </Button>
                )
            }
        />
    );

    if (loading) {
        return (
            <div className="p-5 space-y-4 w-full">
                {header}
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
                            <div className="p-1 rounded bg-green-100"><IconCertificate size={14} className="text-green-700" /></div>
                            <div>
                                <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, fontWeight: 600 }}>
                                    {editingId ? 'Modifier la licence' : 'Nouvelle licence / permis'}
                                </h2>
                                <p className="text-[11.5px] text-slate-500">Titre minier ou autorisation réglementaire de la mine active.</p>
                            </div>
                        </header>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select label="Type de titre" withAsterisk size="sm" data={LICENSE_TYPE_OPTIONS}
                                searchable className="md:col-span-1" {...form.getInputProps('licenseType')} />
                            <TextInput label="Référence / n°" withAsterisk size="sm"
                                placeholder="AE-2019-0142/MMC" {...form.getInputProps('reference')} />
                            <TextInput label="Intitulé" withAsterisk size="sm" className="md:col-span-2"
                                {...form.getInputProps('title')} />
                            <TextInput label="Autorité émettrice" size="sm"
                                placeholder="Ministère des Mines…" {...form.getInputProps('issuingAuthority')} />
                            <TextInput label="Titulaire" size="sm" {...form.getInputProps('holder')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Validité & échéances</p>
                            </div>
                            <DateInput label="Date de délivrance" size="sm" valueFormat="DD/MM/YYYY" clearable
                                leftSection={<IconCalendar size={14} />} {...form.getInputProps('issueDate')} />
                            <DateInput label="Date d'effet" size="sm" valueFormat="DD/MM/YYYY" clearable
                                {...form.getInputProps('effectiveDate')} />
                            <DateInput label="Date d'expiration" size="sm" valueFormat="DD/MM/YYYY" clearable
                                {...form.getInputProps('expiryDate')} />
                            <DateInput label="Échéance de renouvellement" size="sm" valueFormat="DD/MM/YYYY" clearable
                                {...form.getInputProps('renewalDeadline')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Emprise foncière & redevance</p>
                            </div>
                            <NumberInput label="Superficie (hectares)" size="sm" min={0} thousandSeparator=" "
                                {...form.getInputProps('areaHectares')} />
                            <NumberInput label="Redevance annuelle (FCFA)" size="sm" min={0} thousandSeparator=" "
                                {...form.getInputProps('feeAmount')} />
                            <TextInput label="Périmètre / localisation" size="sm" className="md:col-span-2"
                                placeholder="Commune, province, coordonnées…" {...form.getInputProps('perimeter')} />

                            <div className="md:col-span-2 mt-1 pt-3 border-t border-slate-100">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Suivi & pièce justificative</p>
                            </div>
                            <Select label="Responsable du suivi" size="sm" data={empOptions} searchable clearable
                                placeholder="Employé responsable" {...form.getInputProps('responsibleEmployeeId')} />
                            <FileInput label="Pièce justificative (PDF)" size="sm" accept="application/pdf"
                                placeholder={editingId ? 'Remplacer le fichier…' : 'Téléverser…'}
                                leftSection={<IconPaperclip size={14} />} value={file} onChange={setFile} clearable />
                            <Textarea label="Notes" size="sm" rows={3} className="md:col-span-2"
                                {...form.getInputProps('notes')} />

                            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <Button variant="default" size="sm" onClick={() => setMode('list')}>Annuler</Button>
                                <Button type="submit" color="teal" size="sm" loading={saving}
                                    leftSection={<IconDeviceFloppy size={14} />}>Enregistrer</Button>
                            </div>
                        </div>
                    </section>

                    <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                        <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                            <h2 className="text-[13px] font-semibold text-slate-700">Repère réglementaire</h2>
                        </header>
                        <div className="p-4 space-y-3 text-[12.5px] text-slate-600">
                            <p>Chaque titre est suivi <b>par mine</b>. Sa conformité est calculée automatiquement à partir de la date d'expiration :</p>
                            <ul className="space-y-1.5">
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /> Conforme (&gt; 60 j)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} /> À renouveler (≤ 60 j)</li>
                                <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f43f5e' }} /> Expiré</li>
                            </ul>
                            <p className="pt-2 border-t border-slate-100 text-[11.5px] text-slate-500">
                                Cadre : Loi 036-2015/CNT — Code minier du Burkina Faso, et réglementations sectorielles (environnement, eau, explosifs).
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

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {[
                    { label: 'Titres suivis', value: kpis.total, color: '#0f766e', icon: <IconCertificate size={16} /> },
                    { label: 'Conformes', value: kpis.conforme, color: '#10b981', icon: <IconCheck size={16} /> },
                    { label: 'À renouveler', value: kpis.aRenouveler, color: '#f59e0b', icon: <IconCalendar size={16} /> },
                    { label: 'Expirés', value: kpis.expire, color: '#f43f5e', icon: <IconBan size={16} /> },
                    { label: 'Superficie totale', value: fmtArea(kpis.area), color: '#4f46e5', icon: <IconWorld size={16} /> },
                ].map((k) => (
                    <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                        style={{ borderTop: `2px solid ${k.color}` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10.5px] uppercase tracking-[0.08em] text-slate-500 font-semibold">{k.label}</span>
                            <span className="w-6 h-6 rounded-md grid place-items-center"
                                style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</span>
                        </div>
                        <div className="mt-1 text-[24px] font-black tabular-nums text-slate-800"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-end gap-3">
                <TextInput size="xs" label="Recherche" placeholder="Référence, intitulé, autorité…"
                    leftSection={<IconSearch size={14} />} value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)} style={{ minWidth: 240 }} />
                <Select size="xs" label="Type" data={LICENSE_TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter}
                    clearable searchable placeholder="Tous" style={{ minWidth: 190 }} />
                <Select size="xs" label="Conformité" value={confFilter} onChange={setConfFilter} clearable placeholder="Toutes"
                    data={[
                        { value: 'CONFORME', label: 'Conforme' },
                        { value: 'A_RENOUVELER', label: 'À renouveler' },
                        { value: 'EXPIRE', label: 'Expiré' },
                        { value: 'A_EVALUER', label: 'À évaluer' },
                        { value: 'SUSPENDU', label: 'Suspendu' },
                    ]} style={{ minWidth: 160 }} />
                <div className="ml-auto text-[12px] text-slate-500 self-center">
                    {filtered.length} titre{filtered.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <EmptyState icon={<IconCertificate />} iconColor="emerald"
                    title="Aucune licence enregistrée"
                    description="Ajoutez les titres miniers et autorisations de cette mine pour suivre leurs échéances."
                    action={<Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>Nouvelle licence</Button>} />
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-400 text-[11.5px] tracking-wide">
                                <tr>
                                    <th className="text-left font-semibold p-2.5">Référence</th>
                                    <th className="text-left font-semibold p-2.5">Type</th>
                                    <th className="text-left font-semibold p-2.5">Intitulé</th>
                                    <th className="text-left font-semibold p-2.5">Autorité</th>
                                    <th className="text-left font-semibold p-2.5">Expiration</th>
                                    <th className="text-left font-semibold p-2.5">Conformité</th>
                                    <th className="text-center font-semibold p-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((l) => {
                                    const cfg = conformityConfig(l.conformity);
                                    const sel = selected?.id === l.id;
                                    return (
                                        <tr key={l.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                                            style={sel ? { background: 'rgba(20,184,166,0.06)', boxShadow: 'inset 3px 0 0 #14b8a6' } : undefined}
                                            onClick={() => setSelected(l)}>
                                            <td className="p-2.5 font-semibold text-slate-700">{l.reference || '—'}</td>
                                            <td className="p-2.5 text-slate-600">{licenseTypeLabel(l.licenseType)}</td>
                                            <td className="p-2.5 text-slate-600 max-w-[240px] truncate">{l.title}</td>
                                            <td className="p-2.5 text-slate-500 max-w-[180px] truncate">{l.issuingAuthority || '—'}</td>
                                            <td className="p-2.5 text-slate-600 tabular-nums">
                                                {formatDateFr(l.expiryDate)}
                                                {l.daysToExpiry != null && l.conformity !== 'CONFORME' && l.conformity !== 'SUSPENDU' && (
                                                    <span className="ml-1.5 text-[11px]" style={{ color: cfg.dot }}>({dueLabel(l.daysToExpiry)})</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">
                                                <span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span>
                                            </td>
                                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="inline-flex items-center gap-1">
                                                    <ActionIcon variant="subtle" color="gray" onClick={() => setSelected(l)} aria-label="Consulter">
                                                        <IconEye size={16} />
                                                    </ActionIcon>
                                                    <Menu position="bottom-end" withArrow>
                                                        <Menu.Target>
                                                            <ActionIcon variant="subtle" color="gray" aria-label="Actions"><IconDots size={16} /></ActionIcon>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(l)}>Modifier</Menu.Item>
                                                            {l.mediaId && <Menu.Item leftSection={<IconPaperclip size={14} />} onClick={() => openEvidence(l.mediaId)}>Ouvrir la pièce</Menu.Item>}
                                                            <Menu.Item leftSection={l.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />}
                                                                color={l.status === 'INACTIVE' ? 'teal' : 'red'} onClick={() => toggleStatus(l)}>
                                                                {l.status === 'INACTIVE' ? 'Réactiver' : 'Suspendre'}
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

            {/* Drawer détail */}
            <Drawer opened={!!selected} onClose={() => setSelected(null)} position="right" size={470}
                title={<span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>Détail du titre</span>}>
                {selected && (
                    <div className="flex flex-col h-full">
                        <div className="pb-3 border-b border-slate-200">
                            <div className="text-[15px] font-semibold text-slate-800">{selected.title}</div>
                            <div className="text-[12.5px] text-slate-500">{licenseTypeLabel(selected.licenseType)} · {selected.reference}</div>
                            <div className="mt-2">
                                <span className={`${CHIP_BASE} ${conformityConfig(selected.conformity).chip}`}>
                                    {conformityConfig(selected.conformity).label}
                                </span>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 -mr-4 pr-4 mt-3">
                            <div className="space-y-3 text-[13px]">
                                <Field label="Autorité émettrice" value={selected.issuingAuthority} />
                                <Field label="Titulaire" value={selected.holder} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Délivrance" value={formatDateFr(selected.issueDate)} />
                                    <Field label="Effet" value={formatDateFr(selected.effectiveDate)} />
                                    <Field label="Expiration" value={formatDateFr(selected.expiryDate)} />
                                    <Field label="Renouvellement" value={formatDateFr(selected.renewalDeadline)} />
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                                    <IconMapPin size={13} /> Emprise foncière
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Superficie" value={fmtArea(selected.areaHectares)} />
                                    <Field label="Redevance / an" value={fmtXof(selected.feeAmount)} />
                                </div>
                                <Field label="Périmètre" value={selected.perimeter} />
                                <Field label="Responsable" value={empName(selected.responsibleEmployeeId)} />
                                {selected.notes && <Field label="Notes" value={selected.notes} />}
                                {selected.mediaId && (
                                    <Button variant="light" color="teal" size="xs" leftSection={<IconPaperclip size={14} />}
                                        onClick={() => openEvidence(selected.mediaId)}>Ouvrir la pièce justificative</Button>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="pt-3 mt-2 border-t border-slate-200 flex gap-2">
                            <Button variant="default" size="sm" leftSection={<IconEdit size={14} />}
                                onClick={() => openEdit(selected)} className="flex-1">Modifier</Button>
                            <Button size="sm" color={selected.status === 'INACTIVE' ? 'teal' : 'red'}
                                variant="light" leftSection={selected.status === 'INACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />}
                                onClick={() => toggleStatus(selected)}>
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
