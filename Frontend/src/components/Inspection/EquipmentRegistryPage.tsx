/**
 * EquipmentRegistryPage — Registre des équipements (module Inspections HSE).
 *
 * Écran de « données de référence » : liste + création / édition /
 * (dés)activation des équipements de la mine active. La mine n'est JAMAIS
 * demandée : l'intercepteur Axios injecte `?companyId=` (scoping serveur).
 *
 * Style aligné sur InspectionRegistryPage / BlastRegistryPage : fond crème,
 * cartes blanches arrondies, titres Source Serif 4, accent cyan/teal, badges
 * de statut colorés. Le formulaire de saisie est un Modal Mantine ; la
 * (dés)activation passe par une modale de confirmation.
 *
 * Dégradation gracieuse : si l'API n'est pas déployée, la liste reste vide et
 * l'écran ne crashe pas (getAllEquipment absorbe les erreurs → []).
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LoadingOverlay, Modal, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
    IconChevronRight,
    IconSearch,
    IconPlus,
    IconEdit,
    IconRefresh,
    IconAlertOctagon,
    IconTruck,
    IconCircleCheck,
    IconCircleOff,
    IconCategory2,
    IconPower,
    IconPlayerPlay,
} from '@tabler/icons-react';

import {
    getAllEquipment,
    createEquipment,
    updateEquipment,
    type EquipmentDTO,
} from '../../services/EquipmentService';
import { getAllActiveLocations } from '../../services/LocationService';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import { Z } from '../../constants/zIndex';

/* ─────────────────────────────────────────────────────────────────────────
 *  KPI tile (mêmes proportions que InspectionRegistryPage)
 * ────────────────────────────────────────────────────────────────────────*/
interface KpiTileProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent: 'cyan' | 'emerald' | 'slate' | 'violet';
}

const ACCENT: Record<KpiTileProps['accent'], { bg: string; ring: string; text: string }> = {
    cyan:    { bg: 'bg-cyan-100',    ring: 'ring-cyan-200',    text: 'text-cyan-700' },
    emerald: { bg: 'bg-emerald-100', ring: 'ring-emerald-200', text: 'text-emerald-700' },
    slate:   { bg: 'bg-slate-100',   ring: 'ring-slate-200',   text: 'text-slate-700' },
    violet:  { bg: 'bg-violet-100',  ring: 'ring-violet-200',  text: 'text-violet-700' },
};

function KpiTile({ label, value, icon, accent }: KpiTileProps) {
    const c = ACCENT[accent];
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center ${c.text} flex-shrink-0`}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[20px] leading-none text-slate-900 font-semibold tabular-nums">{value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-slate-500 truncate">{label}</div>
            </div>
        </div>
    );
}

/* Badge de statut équipement (ACTIVE / INACTIVE) */
function StatusBadge({ status }: { status?: string }) {
    const active = (status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
    const cfg = active
        ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Actif' }
        : { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Inactif' };
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] rounded font-medium border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {cfg.label}
        </span>
    );
}

/* Familles d'équipement proposées (type = String libre côté backend) */
const BASE_TYPES = ['ENGIN', 'VEHICULE', 'MACHINE', 'INSTALLATION', 'OUTILLAGE', 'AUTRE'];

const isActive = (s?: string) => (s ?? 'ACTIVE').toUpperCase() === 'ACTIVE';

interface FiltersState {
    query: string;
    status: 'all' | 'ACTIVE' | 'INACTIVE';
}

export default function EquipmentRegistryPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<EquipmentDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState<FiltersState>({ query: '', status: 'all' });
    const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [editing, setEditing] = useState<EquipmentDTO | null>(null);

    const form = useForm<EquipmentDTO>({
        initialValues: {
            code: '',
            name: '',
            type: '',
            brand: '',
            model: '',
            serialNumber: '',
            locationId: null,
            status: 'ACTIVE',
        },
        validate: {
            code: (v) => (v && v.trim().length > 0 ? null : 'Le code est requis'),
            name: (v) => (v && v.trim().length > 0 ? null : 'Le nom est requis'),
        },
    });

    const fetchList = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getAllEquipment();
            setItems(Array.isArray(data) ? data : []);
        } catch (_e) {
            setLoadError("Impossible de charger le registre des équipements.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchList();
        // Lieux de rattachement (optionnel) — dégradation gracieuse si indisponible.
        getAllActiveLocations()
            .then((list: any[]) =>
                setLocations(
                    (Array.isArray(list) ? list : []).map((l) => ({
                        value: String(l.id),
                        label: l.name ?? `Lieu #${l.id}`,
                    })),
                ),
            )
            .catch(() => setLocations([]));
    }, []);

    // Options « type » : base + valeurs distinctes déjà présentes (gère le libre).
    const typeOptions = useMemo(() => {
        const set = new Set<string>(BASE_TYPES);
        for (const it of items) if (it.type) set.add(it.type);
        return Array.from(set).map((t) => ({ value: t, label: t }));
    }, [items]);

    const kpi = useMemo(() => {
        const active = items.filter((i) => isActive(i.status)).length;
        const types = new Set(items.map((i) => (i.type || '').trim()).filter(Boolean));
        return { total: items.length, active, inactive: items.length - active, types: types.size };
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter((it) => {
            if (filters.status !== 'all') {
                const act = isActive(it.status);
                if (filters.status === 'ACTIVE' && !act) return false;
                if (filters.status === 'INACTIVE' && act) return false;
            }
            if (filters.query.trim()) {
                const q = filters.query.trim().toLowerCase();
                const hay = [it.code, it.name, it.type, it.brand, it.model, it.serialNumber]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [items, filters]);

    const locationLabel = (id?: number | null) => {
        if (id === null || id === undefined) return '—';
        return locations.find((l) => l.value === String(id))?.label ?? `Lieu #${id}`;
    };

    const openCreate = () => {
        setEditing(null);
        form.setValues({
            code: '',
            name: '',
            type: '',
            brand: '',
            model: '',
            serialNumber: '',
            locationId: null,
            status: 'ACTIVE',
        });
        form.clearErrors();
        open();
    };

    const openEdit = (row: EquipmentDTO) => {
        setEditing(row);
        form.setValues({
            code: row.code ?? '',
            name: row.name ?? '',
            type: row.type ?? '',
            brand: row.brand ?? '',
            model: row.model ?? '',
            serialNumber: row.serialNumber ?? '',
            locationId: row.locationId ?? null,
            status: row.status ?? 'ACTIVE',
        });
        form.clearErrors();
        open();
    };

    const handleClose = () => {
        close();
        setEditing(null);
        form.reset();
    };

    const handleSubmit = async (values: EquipmentDTO) => {
        setSaving(true);
        const payload: EquipmentDTO = {
            ...(editing ?? {}),
            ...values,
            code: values.code.trim(),
            name: values.name.trim(),
            type: values.type?.trim() || undefined,
            brand: values.brand?.trim() || undefined,
            model: values.model?.trim() || undefined,
            serialNumber: values.serialNumber?.trim() || undefined,
            locationId:
                values.locationId === null || values.locationId === undefined
                    ? null
                    : Number(values.locationId),
        };
        try {
            if (editing?.id) {
                await updateEquipment({ ...payload, id: editing.id });
                successNotification('Équipement mis à jour.');
            } else {
                await createEquipment(payload);
                successNotification('Équipement ajouté.');
            }
            handleClose();
            await fetchList();
        } catch (e: any) {
            errorNotification(
                e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    "Échec de l'enregistrement de l'équipement.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = (row: EquipmentDTO) => {
        const active = isActive(row.status);
        const action = active ? 'désactiver' : 'réactiver';
        modals.openConfirmModal({
            title: <span className="text-lg font-semibold">Confirmer</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Voulez-vous <strong>{action}</strong> l'équipement{' '}
                    <strong>{row.code} — {row.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${action}`, cancel: 'Annuler' },
            confirmProps: { color: active ? 'red' : 'green' },
            onConfirm: async () => {
                try {
                    await updateEquipment({ ...row, status: active ? 'INACTIVE' : 'ACTIVE' });
                    successNotification(active ? 'Équipement désactivé.' : 'Équipement réactivé.');
                    await fetchList();
                } catch (_e) {
                    errorNotification("Échec du changement de statut.");
                }
            },
        });
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span
                        className="uppercase tracking-[0.16em] font-medium cursor-pointer hover:text-slate-700"
                        onClick={() => navigate('/inspections')}
                    >
                        Inspections
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">Équipements</span>
                </div>

                {/* Hero */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                <IconTruck size={18} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight truncate"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(17px, 1.6vw, 20px)',
                                        letterSpacing: '-0.015em',
                                    }}
                                >
                                    Registre des équipements
                                </h1>
                                <p className="text-[12px] text-slate-500 truncate">
                                    Engins, véhicules, machines et installations de la mine active
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={fetchList}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                <IconRefresh size={13} stroke={1.8} className={loading ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">Actualiser</span>
                            </button>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition shadow-sm font-medium"
                            >
                                <IconPlus size={14} stroke={2} />
                                <span>Nouvel équipement</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <KpiTile label="Total" value={kpi.total} icon={<IconTruck size={18} stroke={1.8} />} accent="cyan" />
                    <KpiTile label="Actifs" value={kpi.active} icon={<IconCircleCheck size={18} stroke={1.8} />} accent="emerald" />
                    <KpiTile label="Inactifs" value={kpi.inactive} icon={<IconCircleOff size={18} stroke={1.8} />} accent="slate" />
                    <KpiTile label="Familles" value={kpi.types} icon={<IconCategory2 size={18} stroke={1.8} />} accent="violet" />
                </div>

                {/* Banner erreur */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]" role="alert">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* Toolbar */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                            <IconSearch
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                stroke={1.8}
                            />
                            <input
                                type="search"
                                value={filters.query}
                                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                                placeholder="Rechercher (code, nom, marque, n° série…)"
                                aria-label="Rechercher un équipement"
                                className="w-full pl-8 pr-3 py-2 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                            />
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as FiltersState['status'] }))}
                            className="px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px] min-w-[150px]"
                            aria-label="Filtrer par statut"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="ACTIVE">Actifs</option>
                            <option value="INACTIVE">Inactifs</option>
                        </select>
                    </div>
                </div>

                {/* Tableau */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 border border-cyan-200 flex items-center justify-center mb-4 shadow-sm">
                                <IconTruck size={28} className="text-cyan-700" stroke={1.6} />
                            </div>
                            <p className="text-[14px] text-slate-800 font-semibold mb-1">Aucun équipement</p>
                            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                                Ajoutez les engins, véhicules et installations à inspecter. Ils alimenteront la
                                liste des cibles lors de la planification d'une inspection.
                            </p>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition shadow-sm font-medium min-h-[40px]"
                            >
                                <IconPlus size={14} stroke={2} />
                                Ajouter un équipement
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-slate-600">
                                        <th className="text-left px-3 py-2 font-medium">Code</th>
                                        <th className="text-left px-3 py-2 font-medium">Nom</th>
                                        <th className="text-left px-3 py-2 font-medium">Type</th>
                                        <th className="text-left px-3 py-2 font-medium">Marque / Modèle</th>
                                        <th className="text-left px-3 py-2 font-medium">N° série</th>
                                        <th className="text-left px-3 py-2 font-medium">Lieu</th>
                                        <th className="text-left px-3 py-2 font-medium">Statut</th>
                                        <th className="text-right px-3 py-2 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((it) => (
                                        <tr key={it.id ?? it.code} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                            <td className="px-3 py-2 text-slate-800 font-medium whitespace-nowrap">{it.code}</td>
                                            <td className="px-3 py-2 text-slate-700 truncate max-w-[220px]">{it.name}</td>
                                            <td className="px-3 py-2 text-slate-700">{it.type || '—'}</td>
                                            <td className="px-3 py-2 text-slate-700 truncate max-w-[200px]">
                                                {[it.brand, it.model].filter(Boolean).join(' ') || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-600 tabular-nums">{it.serialNumber || '—'}</td>
                                            <td className="px-3 py-2 text-slate-600 truncate max-w-[160px]">{locationLabel(it.locationId)}</td>
                                            <td className="px-3 py-2"><StatusBadge status={it.status} /></td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(it)}
                                                        className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition"
                                                        title="Modifier"
                                                        aria-label="Modifier"
                                                    >
                                                        <IconEdit size={14} stroke={1.8} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(it)}
                                                        className={
                                                            isActive(it.status)
                                                                ? 'p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition'
                                                                : 'p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition'
                                                        }
                                                        title={isActive(it.status) ? 'Désactiver' : 'Réactiver'}
                                                        aria-label={isActive(it.status) ? 'Désactiver' : 'Réactiver'}
                                                    >
                                                        {isActive(it.status) ? <IconPower size={14} stroke={1.8} /> : <IconPlayerPlay size={14} stroke={1.8} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal création / édition */}
            <Modal
                opened={opened}
                onClose={handleClose}
                centered
                size="lg"
                zIndex={Z.modal}
                title={
                    <span className="text-[15px] font-semibold text-slate-900">
                        {editing ? 'Modifier un équipement' : 'Nouvel équipement'}
                    </span>
                }
            >
                <LoadingOverlay visible={saving} zIndex={Z.overlay} overlayProps={{ radius: 'sm', blur: 2 }} />
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextInput
                            label="Code"
                            withAsterisk
                            placeholder="ex. CAM-A40G-18"
                            {...form.getInputProps('code')}
                        />
                        <Select
                            label="Type / Famille"
                            placeholder="Sélectionner"
                            searchable
                            clearable
                            data={typeOptions}
                            {...form.getInputProps('type')}
                        />
                    </div>
                    <TextInput
                        label="Nom / Désignation"
                        withAsterisk
                        placeholder="ex. Camion benne Volvo A40G #18"
                        {...form.getInputProps('name')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextInput label="Marque" placeholder="ex. Volvo" {...form.getInputProps('brand')} />
                        <TextInput label="Modèle" placeholder="ex. A40G" {...form.getInputProps('model')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextInput label="N° de série" placeholder="ex. VOLV-2018-0187" {...form.getInputProps('serialNumber')} />
                        <Select
                            label="Lieu de rattachement"
                            placeholder="Optionnel"
                            searchable
                            clearable
                            data={locations}
                            value={
                                form.values.locationId === null || form.values.locationId === undefined
                                    ? null
                                    : String(form.values.locationId)
                            }
                            onChange={(v) => form.setFieldValue('locationId', v ? Number(v) : null)}
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button variant="default" onClick={handleClose}>Annuler</Button>
                        <Button type="submit" color="cyan">{editing ? 'Enregistrer' : 'Ajouter'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
