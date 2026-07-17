/**
 * HsIndicators — Referentiel des indicateurs de performance HSE (onglet
 * « Indicateurs Sante-Securite »).
 *
 * Ecran de donnees de reference : liste + creation / edition / desactivation
 * (logique) des indicateurs de la mine active. La mine n'est JAMAIS demandee :
 * l'intercepteur Axios injecte `?companyId=` (scoping serveur). Le `code` est
 * derive du nom cote serveur — on ne l'expose pas dans le formulaire.
 *
 * Style aligne sur EquipmentRegistryPage : cartes blanches arrondies, KPI tiles,
 * toolbar de recherche, Modal Mantine pour la saisie, modale de confirmation
 * pour la desactivation. Degradation gracieuse : getAllIndicators absorbe les
 * erreurs -> [].
 */

import { useEffect, useMemo, useState } from 'react';
import { Button, LoadingOverlay, Modal, Select, Switch, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
    IconActivity,
    IconAlertOctagon,
    IconChartBar,
    IconEdit,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconTarget,
    IconTrash,
    IconTrendingUp,
    IconUsers,
} from '@tabler/icons-react';

import {
    createIndicator,
    deleteIndicator,
    getAllIndicators,
    updateIndicator,
    type IndicatorCategory,
    type IndicatorDTO,
} from '../../../services/IndicatorService';
import {
    CATEGORY_CONFIG,
    CATEGORY_OPTIONS,
    categoryConfig,
    directionLabel,
    DIRECTION_OPTIONS,
    frequencyLabel,
    FREQUENCY_OPTIONS,
} from './indicatorLabels';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { Z } from '../../../constants/zIndex';

/* ── KPI tile (proportions EquipmentRegistryPage) ────────────────────────── */

type Accent = 'slate' | 'emerald' | 'rose' | 'violet';

const ACCENT: Record<Accent, { bg: string; ring: string; text: string }> = {
    slate: { bg: 'bg-slate-100', ring: 'ring-slate-200', text: 'text-slate-700' },
    emerald: { bg: 'bg-emerald-100', ring: 'ring-emerald-200', text: 'text-emerald-700' },
    rose: { bg: 'bg-rose-100', ring: 'ring-rose-200', text: 'text-rose-700' },
    violet: { bg: 'bg-violet-100', ring: 'ring-violet-200', text: 'text-violet-700' },
};

function KpiTile({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: Accent }) {
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

/* Icone par categorie (deco des sections). */
const categoryIcon = (c: IndicatorCategory, size = 16) => {
    switch (c) {
        case 'LEADING':
            return <IconTrendingUp size={size} stroke={1.8} />;
        case 'LAGGING':
            return <IconChartBar size={size} stroke={1.8} />;
        case 'COMMUNITY':
            return <IconUsers size={size} stroke={1.8} />;
        default:
            return <IconActivity size={size} stroke={1.8} />;
    }
};

const CATEGORY_ORDER: IndicatorCategory[] = ['LEADING', 'LAGGING', 'COMMUNITY'];

/* Valeurs du formulaire (le `code` n'est pas expose : derive serveur). */
interface FormValues {
    name: string;
    definition: string;
    category: IndicatorCategory;
    frequency: NonNullable<IndicatorDTO['frequency']>;
    direction: NonNullable<IndicatorDTO['direction']>;
    unit: string;
    hasForecast: boolean;
}

const HsIndicators = () => {
    const [items, setItems] = useState<IndicatorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | IndicatorCategory>('all');
    const [opened, { open, close }] = useDisclosure(false);
    const [editing, setEditing] = useState<IndicatorDTO | null>(null);

    const form = useForm<FormValues>({
        initialValues: {
            name: '',
            definition: '',
            category: 'LEADING',
            frequency: 'MONTHLY',
            direction: 'LOWER_IS_BETTER',
            unit: '',
            hasForecast: false,
        },
        validate: {
            name: (v) => (v && v.trim().length > 0 ? null : 'Le nom est requis'),
            definition: (v) => (v && v.trim().length > 0 ? null : 'La definition est requise'),
        },
    });

    const fetchList = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getAllIndicators();
            setItems(Array.isArray(data) ? data : []);
        } catch (_e) {
            setLoadError('Impossible de charger le referentiel des indicateurs.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchList();
    }, []);

    const kpi = useMemo(
        () => ({
            total: items.length,
            leading: items.filter((i) => i.category === 'LEADING').length,
            lagging: items.filter((i) => i.category === 'LAGGING').length,
            forecast: items.filter((i) => i.hasForecast === true).length,
        }),
        [items],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((it) => {
            if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
            if (q) {
                const hay = [it.name, it.definition, it.code].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [items, search, categoryFilter]);

    /* Categories affichees : toutes (filtre 'all') ou la seule selectionnee. */
    const visibleCategories = useMemo(
        () => (categoryFilter === 'all' ? CATEGORY_ORDER : CATEGORY_ORDER.filter((c) => c === categoryFilter)),
        [categoryFilter],
    );

    const openCreate = () => {
        setEditing(null);
        form.setValues({
            name: '',
            definition: '',
            category: 'LEADING',
            frequency: 'MONTHLY',
            direction: 'LOWER_IS_BETTER',
            unit: '',
            hasForecast: false,
        });
        form.clearErrors();
        open();
    };

    const openEdit = (row: IndicatorDTO) => {
        setEditing(row);
        form.setValues({
            name: row.name ?? '',
            definition: row.definition ?? '',
            category: (row.category as IndicatorCategory) ?? 'LEADING',
            frequency: row.frequency ?? 'MONTHLY',
            direction: row.direction ?? 'LOWER_IS_BETTER',
            unit: row.unit ?? '',
            hasForecast: row.hasForecast ?? false,
        });
        form.clearErrors();
        open();
    };

    const handleClose = () => {
        close();
        setEditing(null);
        form.reset();
    };

    const handleSubmit = async (values: FormValues) => {
        setSaving(true);
        const payload: IndicatorDTO = {
            ...(editing ?? {}),
            name: values.name.trim(),
            definition: values.definition.trim(),
            category: values.category,
            frequency: values.frequency,
            direction: values.direction,
            unit: values.unit.trim() || undefined,
            hasForecast: values.hasForecast,
        };
        try {
            if (editing?.id) {
                await updateIndicator({ ...payload, id: editing.id });
                successNotification('Indicateur mis a jour.');
            } else {
                await createIndicator(payload);
                successNotification('Indicateur cree.');
            }
            handleClose();
            await fetchList();
        } catch (e: any) {
            errorNotification(
                e?.response?.data?.errorMessage || "Echec de l'enregistrement de l'indicateur.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (row: IndicatorDTO) => {
        modals.openConfirmModal({
            title: <span className="text-lg font-semibold">Confirmer</span>,
            centered: true,
            zIndex: Z.modal,
            children: (
                <span className="text-sm">
                    Voulez-vous desactiver l'indicateur <strong>{row.name}</strong> ?
                </span>
            ),
            labels: { confirm: 'Oui, desactiver', cancel: 'Annuler' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    if (row.id) await deleteIndicator(row.id);
                    successNotification('Indicateur desactive.');
                    await fetchList();
                } catch (e: any) {
                    errorNotification(
                        e?.response?.data?.errorMessage || 'Echec de la desactivation.',
                    );
                }
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiTile label="Total" value={kpi.total} icon={<IconActivity size={18} stroke={1.8} />} accent="slate" />
                <KpiTile label="Proactifs" value={kpi.leading} icon={<IconTrendingUp size={18} stroke={1.8} />} accent="emerald" />
                <KpiTile label="Reactifs" value={kpi.lagging} icon={<IconChartBar size={18} stroke={1.8} />} accent="rose" />
                <KpiTile label="Planifiables" value={kpi.forecast} icon={<IconTarget size={18} stroke={1.8} />} accent="violet" />
            </div>

            {/* Banner erreur */}
            {loadError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]" role="alert">
                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{loadError}</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                        <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" stroke={1.8} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher (nom, definition, code…)"
                            aria-label="Rechercher un indicateur"
                            className="w-full pl-8 pr-3 py-2 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 min-h-[40px]"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as 'all' | IndicatorCategory)}
                        className="px-2.5 py-2 text-[12.5px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 min-h-[40px] min-w-[160px]"
                        aria-label="Filtrer par categorie"
                    >
                        <option value="all">Toutes les categories</option>
                        {CATEGORY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={fetchList}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 min-h-[40px]"
                        >
                            <IconRefresh size={13} stroke={1.8} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Actualiser</span>
                        </button>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] rounded-md bg-violet-700 text-white hover:bg-violet-800 transition shadow-sm font-medium min-h-[40px]"
                        >
                            <IconPlus size={14} stroke={2} />
                            <span>Nouvel indicateur</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sections par categorie */}
            {visibleCategories.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const rows = filtered.filter((i) => i.category === cat);
                return (
                    <div key={cat} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${cfg.chip}`}>
                                {categoryIcon(cat, 16)}
                            </div>
                            <div className="min-w-0">
                                <div className="text-[13.5px] font-semibold text-slate-800">Indicateurs {cfg.label.toLowerCase()}s</div>
                                <div className="text-[11.5px] text-slate-500 truncate">{cfg.help}</div>
                            </div>
                            <span className="ml-auto inline-flex items-center justify-center min-w-[26px] h-[22px] px-2 rounded-full bg-slate-100 text-slate-600 text-[11.5px] font-medium tabular-nums">
                                {rows.length}
                            </span>
                        </div>

                        {rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 ${cfg.chip}`}>
                                    {categoryIcon(cat, 22)}
                                </div>
                                <p className="text-[12.5px] text-slate-500 max-w-sm">
                                    Aucun indicateur {cfg.label.toLowerCase()} {search.trim() ? 'ne correspond a la recherche' : "pour l'instant"}.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 p-3">
                                {rows.map((ind) => {
                                    const cc = categoryConfig(ind.category);
                                    return (
                                        <div key={ind.id ?? ind.code} className="border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 hover:shadow-sm transition">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                                                        <h4 className="text-[13.5px] font-semibold text-slate-900 truncate">{ind.name}</h4>
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${cc.chip}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} aria-hidden="true" />
                                                            {cc.label}
                                                        </span>
                                                        {ind.hasForecast && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border bg-violet-50 text-violet-700 border-violet-200">
                                                                <IconTarget size={11} stroke={1.8} />
                                                                Prevision
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-2">{ind.definition || '—'}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(ind)}
                                                        className="p-1.5 rounded text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition"
                                                        title="Editer"
                                                        aria-label="Editer"
                                                    >
                                                        <IconEdit size={14} stroke={1.8} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(ind)}
                                                        className="p-1.5 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                                        title="Desactiver"
                                                        aria-label="Desactiver"
                                                    >
                                                        <IconTrash size={14} stroke={1.8} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-500">
                                                <span><span className="text-slate-400">Frequence :</span> {frequencyLabel(ind.frequency)}</span>
                                                <span><span className="text-slate-400">Unite :</span> {ind.unit || '—'}</span>
                                                <span><span className="text-slate-400">Sens :</span> {directionLabel(ind.direction)}</span>
                                                {ind.code && <span className="tabular-nums"><span className="text-slate-400">Code :</span> {ind.code}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Modal creation / edition */}
            <Modal
                opened={opened}
                onClose={handleClose}
                centered
                size="lg"
                zIndex={Z.modal}
                title={
                    <span className="text-[15px] font-semibold text-slate-900">
                        {editing ? "Modifier l'indicateur" : 'Nouvel indicateur'}
                    </span>
                }
            >
                <LoadingOverlay visible={saving} zIndex={Z.overlay} overlayProps={{ radius: 'sm', blur: 2 }} />
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-3">
                    <TextInput
                        label="Nom de l'indicateur"
                        withAsterisk
                        placeholder="ex. Taux de frequence des accidents avec arret"
                        {...form.getInputProps('name')}
                    />
                    <Textarea
                        label="Definition"
                        withAsterisk
                        autosize
                        minRows={2}
                        placeholder="Definition complete de l'indicateur (formule, perimetre…)"
                        {...form.getInputProps('definition')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            label="Categorie"
                            withAsterisk
                            data={CATEGORY_OPTIONS}
                            allowDeselect={false}
                            {...form.getInputProps('category')}
                        />
                        <Select
                            label="Frequence"
                            withAsterisk
                            data={FREQUENCY_OPTIONS}
                            allowDeselect={false}
                            {...form.getInputProps('frequency')}
                        />
                    </div>
                    <Select
                        label="Sens d'amelioration"
                        withAsterisk
                        data={DIRECTION_OPTIONS}
                        allowDeselect={false}
                        description="Determine si « atteint » veut dire au-dessus ou en-dessous de la cible"
                        {...form.getInputProps('direction')}
                    />
                    <TextInput
                        label="Unite"
                        placeholder='ex. « pour 200 000 h », « % », « score (1-10) »'
                        {...form.getInputProps('unit')}
                    />
                    <Switch
                        label="Cet indicateur fait l'objet d'une prevision/planification"
                        {...form.getInputProps('hasForecast', { type: 'checkbox' })}
                    />
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button variant="default" onClick={handleClose}>Annuler</Button>
                        <Button type="submit" color="violet">{editing ? 'Enregistrer' : 'Creer'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HsIndicators;
