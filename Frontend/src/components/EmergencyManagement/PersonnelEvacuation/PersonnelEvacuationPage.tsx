import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    IconStar,
    IconMapPin,
    IconPhone,
    IconPlus,
    IconTrash,
    IconSearch,
    IconUser,
    IconDeviceFloppy,
    IconAlertTriangle,
    IconUsers,
    IconShieldCheck,
    IconRefresh,
    IconPencil,
    IconMail,
    IconX,
    IconChevronDown,
    IconBriefcase,
    IconBuilding,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import {
    listEmployeeEvacuation,
    getEmployeeEvacuation,
    upsertEmployeeEvacuation,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    type EmployeeEvacuationDTO,
    type EmergencyContactDTO,
    type EvacPriorityLevel,
} from '../../../services/EmployeeEvacuationService';
import { listAssemblyPoints, type AssemblyPointDTO } from '../../../services/EmergencyService';

/**
 * Personnel & Évacuation — édition, par employé, des paramètres d'évacuation SIRH.
 *
 * <p>Cette page permet de définir, pour chaque employé actif de la mine active,
 * sa <strong>priorité d'évacuation</strong> (P1/P2/P3), son <strong>point de
 * rassemblement</strong> affecté, ses <strong>besoins particuliers</strong>
 * (PMR…) et ses <strong>contacts d'urgence</strong>.</p>
 *
 * <p>Règle métier : tout Directeur est automatiquement P1 si aucune priorité
 * explicite n'est enregistrée (priorité effective retournée par le SIRH).</p>
 *
 * <p>La page n'interroge JAMAIS la mine : elle utilise toujours la mine active
 * du header (effectiveCompanyId). Sans mine active → carte ambre d'invitation.</p>
 */

// ── Constantes d'affichage priorité ──────────────────────────────────────────

const PRIORITY_META: Record<EvacPriorityLevel, { badge: string; label: string }> = {
    P1: { badge: 'bg-red-50 text-red-700 border-red-200', label: 'P1 : Priorité 1' },
    P2: { badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'P2 : Priorité 2' },
    P3: { badge: 'bg-sky-50 text-sky-700 border-sky-200', label: 'P3 : Priorité 3' },
};
const NONE_BADGE = 'bg-slate-50 text-slate-500 border-slate-200';

// Rang de tri : P1 avant P2 avant P3 avant « sans priorité ».
const PRIO_ORDER: Record<EvacPriorityLevel, number> = { P1: 0, P2: 1, P3: 2 };
const prioRank = (e: EmployeeEvacuationDTO): number =>
    e.effectivePriority ? PRIO_ORDER[e.effectivePriority] : 3;

type PrioFilter = 'ALL' | 'P1' | 'P2' | 'P3' | 'NONE';
const PRIO_FILTERS: { id: PrioFilter; label: string }[] = [
    { id: 'ALL', label: 'Tous' },
    { id: 'P1', label: 'P1' },
    { id: 'P2', label: 'P2' },
    { id: 'P3', label: 'P3' },
    { id: 'NONE', label: 'Sans' },
];

// ── Badge de priorité (P1 rouge / P2 ambre / P3 ciel / — slate) ───────────────

function PriorityBadge({ level, auto }: { level?: EvacPriorityLevel | null; auto?: boolean }) {
    if (!level) {
        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${NONE_BADGE}`}
            >
                Sans
            </span>
        );
    }
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${PRIORITY_META[level].badge}`}
        >
            {level}
            {auto && (
                <span className="text-[8px] font-semibold uppercase tracking-[0.08em] opacity-70">auto</span>
            )}
        </span>
    );
}

// ── Tuile KPI (petite carte de synthèse) ──────────────────────────────────────

const KPI_TONE: Record<string, string> = {
    slate: 'text-slate-700 bg-slate-50 border-slate-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
};

function KpiTile({
    icon,
    label,
    value,
    tone,
}: {
    icon: ReactNode;
    label: string;
    value: number;
    tone: keyof typeof KPI_TONE;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-3.5 py-3 flex items-center gap-3">
            <div
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${KPI_TONE[tone]}`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <div
                    className="text-[20px] leading-none text-slate-900 font-bold"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                >
                    {value}
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.04em] text-slate-500 mt-1 truncate">
                    {label}
                </div>
            </div>
        </div>
    );
}

// ── Champ de saisie label + input (réutilisé dans le formulaire de contact) ───

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-600">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-2.5 py-1.5 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400"
            />
        </label>
    );
}

// ── Formulaire de contact d'urgence (ajout ou édition inline) ─────────────────

function ContactForm({
    initial,
    submitLabel,
    submitting,
    onSubmit,
    onCancel,
}: {
    initial?: EmergencyContactDTO;
    submitLabel: string;
    submitting: boolean;
    onSubmit: (dto: EmergencyContactDTO) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [relationship, setRelationship] = useState(initial?.relationship ?? '');
    const [phone, setPhone] = useState(initial?.phone ?? '');
    const [altPhone, setAltPhone] = useState(initial?.altPhone ?? '');
    const [email, setEmail] = useState(initial?.email ?? '');
    const [note, setNote] = useState(initial?.note ?? '');

    const submit = () => {
        onSubmit({
            name: name.trim() || null,
            relationship: relationship.trim() || null,
            phone: phone.trim() || null,
            altPhone: altPhone.trim() || null,
            email: email.trim() || null,
            note: note.trim() || null,
        });
    };

    const canSubmit = name.trim().length > 0 && !submitting;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nom" value={name} onChange={setName} placeholder="Nom complet" />
                <Field
                    label="Lien"
                    value={relationship}
                    onChange={setRelationship}
                    placeholder="Épouse, Frère…"
                />
                <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="+226 …" type="tel" />
                <Field
                    label="Téléphone secondaire"
                    value={altPhone}
                    onChange={setAltPhone}
                    placeholder="+226 …"
                    type="tel"
                />
                <Field label="Email" value={email} onChange={setEmail} placeholder="nom@exemple.com" type="email" />
                <Field label="Note" value={note} onChange={setNote} placeholder="Précision éventuelle" />
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"
                >
                    <IconX size={13} stroke={1.8} />
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <IconDeviceFloppy size={13} stroke={1.9} />
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}

// ── Ligne d'affichage d'un contact d'urgence ──────────────────────────────────

function ContactRow({
    contact,
    onEdit,
    onDelete,
    deleting,
}: {
    contact: EmergencyContactDTO;
    onEdit: () => void;
    onDelete: () => void;
    deleting: boolean;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[13px] text-slate-900 font-semibold leading-tight">
                    {contact.name || 'Contact'}
                    {contact.relationship && (
                        <span className="text-[12px] text-slate-500 font-normal"> · {contact.relationship}</span>
                    )}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11.5px] text-slate-600">
                    {contact.phone && (
                        <a
                            href={`tel:${contact.phone}`}
                            className="inline-flex items-center gap-1.5 text-red-600 hover:underline"
                        >
                            <IconPhone size={13} stroke={1.8} />
                            {contact.phone}
                        </a>
                    )}
                    {contact.altPhone && (
                        <a
                            href={`tel:${contact.altPhone}`}
                            className="inline-flex items-center gap-1.5 text-slate-500 hover:underline"
                        >
                            <IconPhone size={13} stroke={1.8} />
                            {contact.altPhone}
                        </a>
                    )}
                    {contact.email && (
                        <a
                            href={`mailto:${contact.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-500 hover:underline"
                        >
                            <IconMail size={13} stroke={1.8} />
                            {contact.email}
                        </a>
                    )}
                </div>
                {contact.note && <p className="text-[11.5px] text-slate-500 italic mt-1">« {contact.note} »</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    type="button"
                    onClick={onEdit}
                    title="Modifier"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                    <IconPencil size={14} stroke={1.8} />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    title="Retirer"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    <IconTrash size={14} stroke={1.8} />
                </button>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────────────────────

const PersonnelEvacuationPage = () => {
    // Résolution mine active (identique à AlertsHistoryPage) : jamais demandée à
    // l'utilisateur, toujours la mine du header (repli sur la mine d'attache).
    const selectedCompanyId = useAppSelector((s: any) => s.companySelection.selectedCompanyId);
    const user = useAppSelector((s: any) => s.user);
    const effectiveCompanyId = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 0);
    const actorId = Number(user?.id) || undefined;

    const [employees, setEmployees] = useState<EmployeeEvacuationDTO[]>([]);
    const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPointDTO[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    const [search, setSearch] = useState('');
    const [prioFilter, setPrioFilter] = useState<PrioFilter>('ALL');

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [profile, setProfile] = useState<EmployeeEvacuationDTO | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Champs éditables du profil sélectionné.
    const [prioValue, setPrioValue] = useState<'' | EvacPriorityLevel>('');
    const [apValue, setApValue] = useState('');
    const [specialNeeds, setSpecialNeeds] = useState('');
    const [saving, setSaving] = useState(false);

    // Gestion des contacts.
    const [addingContact, setAddingContact] = useState(false);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [contactBusy, setContactBusy] = useState(false);

    // ── Fetchers ──
    const fetchList = useCallback(() => {
        if (!effectiveCompanyId) return;
        setLoadingList(true);
        listEmployeeEvacuation(effectiveCompanyId)
            .then(setEmployees)
            .catch(() => setEmployees([]))
            .finally(() => setLoadingList(false));
    }, [effectiveCompanyId]);

    const fetchAssemblyPoints = useCallback(() => {
        if (!effectiveCompanyId) return;
        listAssemblyPoints(effectiveCompanyId)
            .then(setAssemblyPoints)
            .catch(() => setAssemblyPoints([]));
    }, [effectiveCompanyId]);

    // Rechargement liste + points à chaque changement de mine active.
    useEffect(() => {
        setSelectedId(null);
        setProfile(null);
        fetchList();
        fetchAssemblyPoints();
    }, [fetchList, fetchAssemblyPoints]);

    // ── Chargement du profil complet (avec contacts) ──
    const loadProfile = useCallback((employeeId: number) => {
        setProfileLoading(true);
        getEmployeeEvacuation(employeeId)
            .then((p) => {
                setProfile(p);
                setPrioValue(p.priorityLevel ?? '');
                setApValue(p.assemblyPointId != null ? String(p.assemblyPointId) : '');
                setSpecialNeeds(p.specialNeeds ?? '');
            })
            .catch((err: any) =>
                errorNotification(err?.response?.data?.message ?? 'Échec du chargement du profil')
            )
            .finally(() => setProfileLoading(false));
    }, []);

    const selectEmployee = (id: number) => {
        setSelectedId(id);
        setAddingContact(false);
        setEditingContactId(null);
        loadProfile(id);
    };

    // ── Sauvegarde des paramètres d'évacuation ──
    const handleSave = () => {
        if (!profile) return;
        setSaving(true);
        upsertEmployeeEvacuation(
            profile.employeeId,
            {
                companyId: effectiveCompanyId,
                priorityLevel: prioValue || null,
                assemblyPointId: apValue ? Number(apValue) : null,
                specialNeeds: specialNeeds.trim() || null,
            },
            actorId
        )
            .then(() => {
                successNotification('Paramètres enregistrés');
                fetchList(); // met à jour le badge dans la liste
                loadProfile(profile.employeeId); // recharge la priorité effective
            })
            .catch((err: any) =>
                errorNotification(err?.response?.data?.message ?? "Échec de l'enregistrement")
            )
            .finally(() => setSaving(false));
    };

    // ── Actions contacts ──
    const handleAddContact = (dto: EmergencyContactDTO) => {
        if (!profile) return;
        setContactBusy(true);
        addEmergencyContact(profile.employeeId, dto)
            .then(() => {
                successNotification('Contact ajouté');
                setAddingContact(false);
                loadProfile(profile.employeeId);
            })
            .catch((err: any) =>
                errorNotification(err?.response?.data?.message ?? "Échec de l'ajout du contact")
            )
            .finally(() => setContactBusy(false));
    };

    const handleUpdateContact = (id: number, dto: EmergencyContactDTO) => {
        if (!profile) return;
        setContactBusy(true);
        updateEmergencyContact(id, dto)
            .then(() => {
                successNotification('Contact mis à jour');
                setEditingContactId(null);
                loadProfile(profile.employeeId);
            })
            .catch((err: any) =>
                errorNotification(err?.response?.data?.message ?? 'Échec de la mise à jour du contact')
            )
            .finally(() => setContactBusy(false));
    };

    const handleDeleteContact = (id: number) => {
        if (!profile) return;
        setContactBusy(true);
        deleteEmergencyContact(id)
            .then(() => {
                successNotification('Contact retiré');
                loadProfile(profile.employeeId);
            })
            .catch((err: any) =>
                errorNotification(err?.response?.data?.message ?? 'Échec de la suppression du contact')
            )
            .finally(() => setContactBusy(false));
    };

    // ── Dérivés ──
    const apNameById = useMemo(() => {
        const m = new Map<number, string>();
        assemblyPoints.forEach((ap) => {
            if (ap.id != null) m.set(ap.id, ap.name);
        });
        return m;
    }, [assemblyPoints]);

    const stats = useMemo(() => {
        let p1 = 0;
        let withAp = 0;
        let noPrio = 0;
        for (const e of employees) {
            if (e.effectivePriority === 'P1') p1 += 1;
            if (e.assemblyPointId != null) withAp += 1;
            if (!e.effectivePriority) noPrio += 1;
        }
        return { total: employees.length, p1, withAp, noPrio };
    }, [employees]);

    const q = search.trim().toLowerCase();
    const filtered = useMemo(() => {
        const sorted = [...employees].sort((a, b) => {
            const ra = prioRank(a);
            const rb = prioRank(b);
            if (ra !== rb) return ra - rb;
            return (a.employeeName ?? '').localeCompare(b.employeeName ?? '', 'fr');
        });
        return sorted.filter((e) => {
            if (prioFilter === 'NONE') {
                if (e.effectivePriority) return false;
            } else if (prioFilter !== 'ALL') {
                if (e.effectivePriority !== prioFilter) return false;
            }
            if (q) {
                const hay = `${e.employeeName ?? ''} ${e.department ?? ''} ${e.positionName ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [employees, prioFilter, q]);

    // ── État « pas de mine sélectionnée » ──
    if (!effectiveCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={30} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13.5px] text-slate-700 font-medium">Sélectionnez une mine active</p>
                    <p className="text-[12px] text-slate-500 mt-1">
                        Les paramètres d'évacuation du personnel sont propres à chaque mine.
                    </p>
                </div>
            </div>
        );
    }

    const showProfile = profile != null && profile.employeeId === selectedId;

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Urgences' },
                    { label: 'Personnel & Évacuation' },
                ]}
                useSafeXLogo
                title="Personnel & Évacuation"
                subtitle="Priorité d'évacuation, point de rassemblement et contacts d'urgence · par employé"
                actions={
                    <button
                        type="button"
                        onClick={fetchList}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <IconRefresh size={13} stroke={1.8} />
                        Rafraîchir
                    </button>
                }
            />

            {/* Tuiles de synthèse */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiTile icon={<IconUsers size={18} stroke={1.7} />} label="Effectif total" value={stats.total} tone="slate" />
                <KpiTile icon={<IconStar size={18} stroke={1.7} />} label="Priorité 1 (P1)" value={stats.p1} tone="red" />
                <KpiTile
                    icon={<IconMapPin size={18} stroke={1.7} />}
                    label="Avec point de rass."
                    value={stats.withAp}
                    tone="emerald"
                />
                <KpiTile
                    icon={<IconAlertTriangle size={18} stroke={1.7} />}
                    label="Sans priorité"
                    value={stats.noPrio}
                    tone="amber"
                />
            </div>

            {/* Deux colonnes : liste | éditeur */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── Colonne gauche : liste des employés ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        {/* En-tête : recherche + filtre priorité */}
                        <div className="p-3 border-b border-slate-100 space-y-2.5">
                            <div className="relative">
                                <IconSearch
                                    size={14}
                                    stroke={1.8}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Nom, poste, département…"
                                    className="w-full pl-8 pr-3 py-1.5 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400"
                                />
                            </div>
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full">
                                {PRIO_FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setPrioFilter(f.id)}
                                        className={`flex-1 px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                                            prioFilter === f.id
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Liste */}
                        <div className="max-h-[68vh] overflow-y-auto p-2">
                            {loadingList ? (
                                <div className="p-8 text-center">
                                    <IconUsers size={26} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                                    <p className="text-[12.5px] text-slate-500">Chargement du personnel…</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-8 text-center">
                                    <IconUser size={28} className="text-slate-300 mx-auto mb-2" stroke={1.5} />
                                    <p className="text-[12.5px] text-slate-500">
                                        {employees.length === 0
                                            ? 'Aucun employé pour cette mine.'
                                            : 'Aucun employé ne correspond aux filtres.'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-1.5">
                                    {filtered.map((e) => {
                                        const active = e.employeeId === selectedId;
                                        const apName =
                                            e.assemblyPointId != null ? apNameById.get(e.assemblyPointId) : undefined;
                                        return (
                                            <li key={e.employeeId}>
                                                <button
                                                    type="button"
                                                    onClick={() => selectEmployee(e.employeeId)}
                                                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                                                        active
                                                            ? 'border-red-300 bg-red-50/50 ring-1 ring-red-100'
                                                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-slate-900 font-semibold leading-tight truncate">
                                                                {e.employeeName || `Employé #${e.employeeId}`}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                                {[e.positionName, e.department].filter(Boolean).join(' · ') ||
                                                                    '—'}
                                                            </p>
                                                        </div>
                                                        <PriorityBadge
                                                            level={e.effectivePriority}
                                                            auto={e.director && !e.priorityLevel}
                                                        />
                                                    </div>
                                                    {apName && (
                                                        <p className="inline-flex items-center gap-1 text-[10.5px] text-slate-500 mt-1.5">
                                                            <IconMapPin size={11} stroke={1.8} className="text-emerald-500" />
                                                            {apName}
                                                        </p>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Colonne droite : éditeur ── */}
                <div className="lg:col-span-2">
                    {!selectedId ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
                            <IconUser size={34} className="text-slate-300 mx-auto mb-3" stroke={1.5} />
                            <h3
                                className="text-[15px] text-slate-800 mb-1"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                            >
                                Sélectionnez un employé
                            </h3>
                            <p className="text-[12px] text-slate-500">
                                Choisissez un membre du personnel dans la liste pour éditer ses paramètres d'évacuation.
                            </p>
                        </div>
                    ) : !showProfile ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
                            <IconUser size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                            <p className="text-[12.5px] text-slate-500">Chargement du profil…</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* En-tête employé */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2
                                            className="text-[17px] text-slate-900 leading-tight"
                                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                                        >
                                            {profile.employeeName || `Employé #${profile.employeeId}`}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[12px] text-slate-600">
                                            {profile.positionName && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <IconBriefcase size={13} stroke={1.7} className="text-slate-400" />
                                                    {profile.positionName}
                                                </span>
                                            )}
                                            {profile.department && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <IconBuilding size={13} stroke={1.7} className="text-slate-400" />
                                                    {profile.department}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <PriorityBadge
                                        level={profile.effectivePriority}
                                        auto={profile.director && !profile.priorityLevel}
                                    />
                                </div>
                                {profile.director && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[11.5px] text-red-700 font-medium">
                                        <IconShieldCheck size={13} stroke={1.8} />
                                        Directeur : P1 automatique si aucune priorité n'est définie
                                    </div>
                                )}
                            </div>

                            {/* Paramètres d'évacuation */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                                <h3
                                    className="text-[14px] text-slate-800 mb-3.5"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                                >
                                    Paramètres d'évacuation
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-600">Priorité d'évacuation</span>
                                        <div className="relative">
                                            <select
                                                value={prioValue}
                                                onChange={(e) => setPrioValue(e.target.value as '' | EvacPriorityLevel)}
                                                className="w-full appearance-none cursor-pointer h-9 pl-3 pr-8 text-[12.5px] leading-tight border border-slate-200 rounded-lg bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400"
                                            >
                                                <option value="">Aucune priorité</option>
                                                <option value="P1">P1 : Priorité 1</option>
                                                <option value="P2">P2 : Priorité 2</option>
                                                <option value="P3">P3 : Priorité 3</option>
                                            </select>
                                            <IconChevronDown size={15} stroke={1.8} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-600">Point de rassemblement</span>
                                        <div className="relative">
                                            <select
                                                value={apValue}
                                                onChange={(e) => setApValue(e.target.value)}
                                                className="w-full appearance-none cursor-pointer h-9 pl-3 pr-8 text-[12.5px] leading-tight border border-slate-200 rounded-lg bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400"
                                            >
                                                <option value="">Non affecté</option>
                                                {assemblyPoints
                                                    .filter((ap) => ap.id != null)
                                                    .map((ap) => (
                                                        <option key={ap.id} value={String(ap.id)}>
                                                            {ap.name}
                                                        </option>
                                                    ))}
                                            </select>
                                            <IconChevronDown size={15} stroke={1.8} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </label>
                                    <div className="sm:col-span-2">
                                        <Field
                                            label="Besoins particuliers"
                                            value={specialNeeds}
                                            onChange={setSpecialNeeds}
                                            placeholder="Ex. Personne à mobilité réduite (PMR), assistance requise…"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 text-white text-[12.5px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <IconDeviceFloppy size={14} stroke={1.9} />
                                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>

                            {/* Contacts d'urgence */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                                <div className="flex items-center justify-between gap-3 mb-3.5">
                                    <h3
                                        className="text-[14px] text-slate-800"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                                    >
                                        Contacts d'urgence
                                    </h3>
                                    {!addingContact && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingContactId(null);
                                                setAddingContact(true);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12px] font-medium hover:bg-slate-50 transition-colors"
                                        >
                                            <IconPlus size={13} stroke={1.9} />
                                            Ajouter un contact
                                        </button>
                                    )}
                                </div>

                                {addingContact && (
                                    <div className="mb-3">
                                        <ContactForm
                                            submitLabel="Ajouter"
                                            submitting={contactBusy}
                                            onSubmit={handleAddContact}
                                            onCancel={() => setAddingContact(false)}
                                        />
                                    </div>
                                )}

                                {(!profile.contacts || profile.contacts.length === 0) && !addingContact ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center">
                                        <IconPhone size={22} className="text-slate-300 mx-auto mb-1.5" stroke={1.6} />
                                        <p className="text-[12px] text-slate-500">
                                            Aucun contact d'urgence enregistré pour cet employé.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {(profile.contacts ?? []).map((c) =>
                                            editingContactId != null && c.id === editingContactId ? (
                                                <ContactForm
                                                    key={c.id}
                                                    initial={c}
                                                    submitLabel="Enregistrer"
                                                    submitting={contactBusy}
                                                    onSubmit={(dto) => c.id != null && handleUpdateContact(c.id, dto)}
                                                    onCancel={() => setEditingContactId(null)}
                                                />
                                            ) : (
                                                <ContactRow
                                                    key={c.id ?? `${c.name}-${c.phone}`}
                                                    contact={c}
                                                    deleting={contactBusy}
                                                    onEdit={() => {
                                                        setAddingContact(false);
                                                        setEditingContactId(c.id ?? null);
                                                    }}
                                                    onDelete={() => c.id != null && handleDeleteContact(c.id)}
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonnelEvacuationPage;
