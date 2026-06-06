import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Select } from '@mantine/core';
import {
    IconMapPin,
    IconCurrentLocation,
    IconUser,
    IconUsers,
    IconAlertTriangle,
    IconBuildingBank,
    IconCheck,
    IconX,
    IconMap2,
    IconArrowLeft,
    IconShield,
    IconBriefcase,
    IconInfoCircle,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import { useAppSelector } from '../../../slices/hooks';
import {
    createAssemblyPoint,
    updateAssemblyPoint,
    getAssemblyPoint,
    type AssemblyPointDTO,
} from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { getAllDepartments } from '../../../services/HrmsService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import AssemblyPointsMap from './AssemblyPointsMap';

/**
 * Page de création / édition d'un Point de rassemblement (LOT 48 Phase 2.b).
 *
 * <p>Refonte profonde : remplace le modal d'édition par une page intégrée
 * inspirée du pattern de déclaration d'incident (sections accent-left,
 * dropdowns Mantine Select raffinés avec recherche, validation inline,
 * carte intégrée pour pick visuel).</p>
 *
 * <p>Routes :</p>
 * <ul>
 *   <li>{@code /emergency/assembly-points/new} — création</li>
 *   <li>{@code /emergency/assembly-points/:id/edit} — édition</li>
 * </ul>
 */

interface EmployeeOption {
    id: number;
    name: string;
    position?: string;
    department?: string;
}

interface DepartmentOption {
    id: number;
    name: string;
}

// ── Sous-composant Section ──────────────────────────────────────────────────
type Accent = 'red' | 'amber' | 'sky' | 'emerald' | 'violet';
const ACCENT: Record<Accent, { borderL: string; iconBg: string; iconColor: string }> = {
    red:     { borderL: 'border-l-red-400',     iconBg: 'bg-red-50',     iconColor: 'text-red-600' },
    amber:   { borderL: 'border-l-amber-400',   iconBg: 'bg-amber-50',   iconColor: 'text-amber-600' },
    sky:     { borderL: 'border-l-sky-400',     iconBg: 'bg-sky-50',     iconColor: 'text-sky-600' },
    emerald: { borderL: 'border-l-emerald-400', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    violet:  { borderL: 'border-l-violet-400',  iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
};

function Section({
    icon,
    title,
    description,
    accent,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    accent: Accent;
    children: React.ReactNode;
}) {
    const tone = ACCENT[accent];
    return (
        <section className={`bg-white border border-slate-200 border-l-[3px] ${tone.borderL} rounded-xl shadow-sm`}>
            <header className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start gap-2.5">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tone.iconBg} ${tone.iconColor} flex-shrink-0`}>
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {title}
                    </h3>
                    {description && <p className="text-[11.5px] text-slate-500 mt-0.5">{description}</p>}
                </div>
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}

// ── Field wrapper ───────────────────────────────────────────────────────────
function Field({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-[11.5px] font-medium text-slate-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-[10.5px] text-slate-500 mt-1">{hint}</p>}
            {error && (
                <p className="text-[10.5px] text-red-600 mt-1 inline-flex items-center gap-1">
                    <IconAlertTriangle size={10} stroke={2} />
                    {error}
                </p>
            )}
        </div>
    );
}

// ── Composant principal ─────────────────────────────────────────────────────

const AssemblyPointFormPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const currentUser = useAppSelector((state: any) => state.user);

    // ── State ────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [touched, setTouched] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [locationText, setLocationText] = useState('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [managerId, setManagerId] = useState<string | null>(null);
    const [deputyManagerId, setDeputyManagerId] = useState<string | null>(null);
    const [evacuationPriority, setEvacuationPriority] = useState<number>(2);
    const [maxCapacity, setMaxCapacity] = useState<string>('');
    const [departmentIds, setDepartmentIds] = useState<Set<number>>(new Set());

    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);

    const [gpsCapturing, setGpsCapturing] = useState(false);
    const [showPickMap, setShowPickMap] = useState(false);

    // ── Chargement référentiels ──
    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res: any[]) => {
                const list: EmployeeOption[] = Array.isArray(res)
                    ? res.map((e) => ({
                          id: e.id,
                          name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
                          position: e.position,
                          department: e.department,
                      }))
                    : [];
                setEmployees(list);
            })
            .catch(() => setEmployees([]));
        getAllDepartments()
            .then((res: any[]) => {
                const list: DepartmentOption[] = Array.isArray(res)
                    ? res.map((d) => ({ id: d.id, name: d.name ?? d.departmentName ?? `#${d.id}` }))
                    : [];
                setDepartments(list);
            })
            .catch(() => setDepartments([]));
    }, []);

    // ── Hydratation édition ──
    useEffect(() => {
        if (!isEdit || !id) return;
        setLoading(true);
        getAssemblyPoint(Number(id))
            .then((dto) => {
                setName(dto.name ?? '');
                setDescription(dto.description ?? '');
                setLocationText(dto.locationText ?? '');
                setLatitude(dto.latitude != null ? String(dto.latitude) : '');
                setLongitude(dto.longitude != null ? String(dto.longitude) : '');
                setManagerId(dto.managerId != null ? String(dto.managerId) : null);
                setDeputyManagerId(dto.deputyManagerId != null ? String(dto.deputyManagerId) : null);
                setEvacuationPriority(dto.evacuationPriority ?? 2);
                setMaxCapacity(dto.maxCapacity != null ? String(dto.maxCapacity) : '');
                setDepartmentIds(
                    new Set(
                        (dto.departmentIdsCsv ?? '')
                            .split(',')
                            .map((s) => parseInt(s.trim(), 10))
                            .filter((n) => !Number.isNaN(n))
                    )
                );
            })
            .catch(() => errorNotification(t('common:messages.errorGeneric')))
            .finally(() => setLoading(false));
    }, [id, isEdit, t]);

    // ── Validation ──
    const errors = useMemo(() => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Le nom est requis';
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (Number.isNaN(lat) || lat < -90 || lat > 90)
            e.latitude = 'Latitude invalide (entre -90 et 90)';
        if (Number.isNaN(lng) || lng < -180 || lng > 180)
            e.longitude = 'Longitude invalide (entre -180 et 180)';
        return e;
    }, [name, latitude, longitude]);
    const valid = Object.keys(errors).length === 0;

    // ── Capture GPS ──
    const captureGps = () => {
        if (!('geolocation' in navigator)) {
            errorNotification(t('emergency:assemblyPoints.geolocation.unsupported'));
            return;
        }
        setGpsCapturing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(6));
                setLongitude(pos.coords.longitude.toFixed(6));
                setGpsCapturing(false);
                successNotification(`Position capturée (±${Math.round(pos.coords.accuracy)} m)`);
            },
            (err) => {
                setGpsCapturing(false);
                let msg = t('emergency:assemblyPoints.geolocation.unavailable');
                if (err.code === err.PERMISSION_DENIED) msg = t('emergency:assemblyPoints.geolocation.denied');
                else if (err.code === err.TIMEOUT) msg = t('emergency:assemblyPoints.geolocation.timeout');
                errorNotification(msg);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    // ── Pick sur carte ──
    const handlePickOnMap = (lat: number, lng: number) => {
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
    };

    // ── Submit ──
    const submit = async () => {
        setTouched(true);
        if (!valid || !selectedCompanyId) return;
        setSaving(true);
        try {
            const dto: AssemblyPointDTO = {
                companyId: selectedCompanyId,
                name: name.trim(),
                description: description.trim() || null,
                locationText: locationText.trim() || null,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                managerId: managerId ? Number(managerId) : null,
                deputyManagerId: deputyManagerId ? Number(deputyManagerId) : null,
                evacuationPriority,
                maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
                departmentIdsCsv: Array.from(departmentIds).join(',') || null,
            };
            const saved = isEdit
                ? await updateAssemblyPoint(Number(id), dto, currentUser?.id)
                : await createAssemblyPoint(dto, currentUser?.id);
            successNotification(t('emergency:assemblyPoints.saved'));
            navigate(`/emergency/assembly-points/${saved.id}`);
        } catch {
            errorNotification(t('common:messages.errorGeneric'));
        } finally {
            setSaving(false);
        }
    };

    // ── Mantine Select data ──
    const employeeSelectData = useMemo(
        () =>
            employees.map((e) => ({
                value: String(e.id),
                label: e.name + (e.position ? ` · ${e.position}` : ''),
            })),
        [employees]
    );

    const previewPoint = useMemo((): AssemblyPointDTO | null => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return {
            id: -1,
            companyId: selectedCompanyId ?? 0,
            name: name || 'Aperçu',
            latitude: lat,
            longitude: lng,
            evacuationPriority,
        };
    }, [latitude, longitude, name, evacuationPriority, selectedCompanyId]);

    const toggleDept = (deptId: number) =>
        setDepartmentIds((prev) => {
            const next = new Set(prev);
            if (next.has(deptId)) next.delete(deptId);
            else next.add(deptId);
            return next;
        });

    // ── No company state ──
    if (!selectedCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-center">
                    <IconAlertTriangle size={28} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13px] text-slate-700">
                        Sélectionnez une mine active dans le sélecteur en haut.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <IconMapPin size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: t('emergency:assemblyPoints.title'), to: '/emergency/assembly-points' },
                    { label: isEdit ? t('emergency:assemblyPoints.edit') : t('emergency:assemblyPoints.addNew') },
                ]}
                useSafeXLogo
                title={isEdit ? t('emergency:assemblyPoints.edit') : t('emergency:assemblyPoints.addNew')}
                subtitle={
                    isEdit
                        ? 'Mettre à jour les informations du point de rassemblement'
                        : 'Définir un nouveau lieu de regroupement pour les évacuations'
                }
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => navigate('/emergency/assembly-points')}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <IconArrowLeft size={12} stroke={2} />
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={saving || (!valid && touched)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-[12.5px] font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <IconCheck size={12} stroke={2.4} />
                            {saving ? '…' : isEdit ? 'Enregistrer' : 'Créer le point'}
                        </button>
                    </>
                }
            />

            {/* Banner d'erreurs globales */}
            {touched && !valid && (
                <div className="mt-4 bg-red-50/60 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <IconAlertTriangle size={14} stroke={1.8} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[12px] font-semibold text-red-800">Champs requis manquants</p>
                        <ul className="text-[11.5px] text-red-700 mt-0.5 list-disc list-inside">
                            {Object.values(errors).map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* ════ Colonne principale (2/3) ════ */}
                <div className="xl:col-span-2 space-y-5">
                    {/* SECTION 1 — INFOS GÉNÉRALES */}
                    <Section
                        icon={<IconInfoCircle size={15} stroke={1.6} />}
                        title="Informations générales"
                        description="Nom et description du point de rassemblement"
                        accent="red"
                    >
                        <div className="space-y-4">
                            <Field label="Nom du point" required error={touched ? errors.name : undefined}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex : Aire de rassemblement Principale"
                                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                                />
                            </Field>
                            <Field label="Description" hint="Détails complémentaires (signalétique, accès, particularités)">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Aire bétonnée éclairée, accès véhicules de secours par l'ouest, capacité testée lors du drill de mars 2026…"
                                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                                />
                            </Field>
                        </div>
                    </Section>

                    {/* SECTION 2 — LOCALISATION GPS */}
                    <Section
                        icon={<IconMapPin size={15} stroke={1.6} />}
                        title="Localisation GPS"
                        description="Coordonnées exactes — capturer depuis l'appareil ou cliquer sur la carte"
                        accent="amber"
                    >
                        <div className="space-y-4">
                            <Field label="Adresse / repère" hint="Repère visuel pour les équipes d'évacuation">
                                <input
                                    type="text"
                                    value={locationText}
                                    onChange={(e) => setLocationText(e.target.value)}
                                    placeholder="Ex : Devant la grille d'entrée, parking visiteurs"
                                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Latitude" required error={touched ? errors.latitude : undefined}>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        min={-90}
                                        max={90}
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        placeholder="12.371428"
                                        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
                                    />
                                </Field>
                                <Field label="Longitude" required error={touched ? errors.longitude : undefined}>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        min={-180}
                                        max={180}
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        placeholder="-1.519660"
                                        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
                                    />
                                </Field>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={captureGps}
                                    disabled={gpsCapturing}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[12px] font-medium transition-colors disabled:opacity-50"
                                >
                                    <IconCurrentLocation size={12} stroke={1.8} />
                                    {gpsCapturing ? 'Capture en cours…' : 'Capturer ma position GPS'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPickMap((v) => !v)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-[12px] font-medium transition-colors"
                                >
                                    <IconMap2 size={12} stroke={1.8} />
                                    {showPickMap ? 'Masquer la carte' : 'Choisir sur la carte'}
                                </button>
                            </div>
                            {showPickMap && (
                                <div>
                                    <AssemblyPointsMap
                                        points={previewPoint ? [previewPoint] : []}
                                        onPickLocation={handlePickOnMap}
                                        height={320}
                                    />
                                    <p className="text-[10.5px] text-slate-500 italic mt-1.5 px-1">
                                        ⓘ Cliquez sur la carte pour placer ou déplacer le point.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* SECTION 3 — COUVERTURE DÉPARTEMENTS */}
                    {departments.length > 0 && (
                        <Section
                            icon={<IconBuildingBank size={15} stroke={1.6} />}
                            title="Départements couverts"
                            description="Sélectionnez les départements dont les employés évacueront vers ce point"
                            accent="violet"
                        >
                            <div className="flex flex-wrap gap-1.5">
                                {departments.map((d) => {
                                    const isSelected = departmentIds.has(d.id);
                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => toggleDept(d.id)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11.5px] font-medium transition-colors ${
                                                isSelected
                                                    ? 'bg-violet-50 text-violet-800 border-violet-300 ring-1 ring-violet-200'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            {isSelected && <IconCheck size={10} stroke={2.6} />}
                                            {d.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-3 inline-flex items-center gap-1">
                                <IconInfoCircle size={10} stroke={1.8} />
                                {departmentIds.size === 0
                                    ? 'Aucune restriction : tous les employés peuvent rejoindre ce point.'
                                    : `${departmentIds.size} département(s) sélectionné(s)`}
                            </p>
                        </Section>
                    )}
                </div>

                {/* ════ Colonne latérale (1/3) ════ */}
                <div className="space-y-5">
                    {/* SECTION RESPONSABILITÉ */}
                    <Section
                        icon={<IconUser size={15} stroke={1.6} />}
                        title="Responsabilité"
                        description="Personnes en charge du point lors d'une évacuation"
                        accent="emerald"
                    >
                        <div className="space-y-4">
                            <Field label="Responsable titulaire" hint="Personne en charge pendant les heures de service">
                                <Select
                                    data={employeeSelectData}
                                    value={managerId}
                                    onChange={setManagerId}
                                    placeholder="Rechercher un employé…"
                                    searchable
                                    clearable
                                    nothingFoundMessage="Aucun employé trouvé"
                                    size="sm"
                                    leftSection={<IconBriefcase size={12} stroke={1.8} className="text-slate-400" />}
                                    styles={{
                                        input: { fontSize: 13 },
                                        option: { fontSize: 12.5 },
                                    }}
                                />
                            </Field>
                            <Field label="Suppléant" hint="Prend le relais en cas d'absence du titulaire">
                                <Select
                                    data={employeeSelectData}
                                    value={deputyManagerId}
                                    onChange={setDeputyManagerId}
                                    placeholder="Rechercher un employé…"
                                    searchable
                                    clearable
                                    nothingFoundMessage="Aucun employé trouvé"
                                    size="sm"
                                    leftSection={<IconBriefcase size={12} stroke={1.8} className="text-slate-400" />}
                                    styles={{
                                        input: { fontSize: 13 },
                                        option: { fontSize: 12.5 },
                                    }}
                                />
                            </Field>
                        </div>
                    </Section>

                    {/* SECTION CAPACITÉ & PRIORITÉ */}
                    <Section
                        icon={<IconUsers size={15} stroke={1.6} />}
                        title="Capacité & priorité"
                        description="Dimensionnement et ordre d'évacuation"
                        accent="sky"
                    >
                        <div className="space-y-4">
                            <Field
                                label="Priorité d'évacuation"
                                hint="P1 = priorité haute (à utiliser en premier), P5 = repli"
                            >
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[
                                        { p: 1, bg: 'bg-red-600', text: 'text-white', label: 'Haute' },
                                        { p: 2, bg: 'bg-orange-600', text: 'text-white', label: 'Standard' },
                                        { p: 3, bg: 'bg-yellow-500', text: 'text-white', label: 'Secondaire' },
                                        { p: 4, bg: 'bg-sky-500', text: 'text-white', label: 'Repli' },
                                        { p: 5, bg: 'bg-slate-500', text: 'text-white', label: 'Faible' },
                                    ].map((opt) => {
                                        const isActive = evacuationPriority === opt.p;
                                        return (
                                            <button
                                                key={opt.p}
                                                type="button"
                                                onClick={() => setEvacuationPriority(opt.p)}
                                                title={opt.label}
                                                className={`flex flex-col items-center justify-center py-2 rounded-md border transition-all ${
                                                    isActive
                                                        ? `${opt.bg} ${opt.text} border-transparent font-semibold shadow-sm`
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-[13px] leading-none">P{opt.p}</span>
                                                <span className={`text-[9px] mt-0.5 ${isActive ? 'opacity-90' : 'text-slate-400'}`}>
                                                    {opt.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                            <Field label="Capacité maximale" hint="Nombre de personnes accueillables (optionnel)">
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        value={maxCapacity}
                                        onChange={(e) => setMaxCapacity(e.target.value)}
                                        placeholder="250"
                                        className="w-full pl-3 pr-14 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-400 uppercase tracking-wider font-semibold">
                                        pers.
                                    </span>
                                </div>
                            </Field>
                        </div>
                    </Section>

                    {/* Récap visuel */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                            <IconShield size={11} stroke={1.8} />
                            Récapitulatif
                        </p>
                        <ul className="space-y-1.5 text-[11.5px] text-slate-700">
                            <li>
                                <strong className="text-slate-800">Nom :</strong> {name || <em className="text-slate-400">non renseigné</em>}
                            </li>
                            <li>
                                <strong className="text-slate-800">GPS :</strong>{' '}
                                {latitude && longitude ? (
                                    <span className="font-mono text-[11px]">{parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}</span>
                                ) : (
                                    <em className="text-slate-400">non capturé</em>
                                )}
                            </li>
                            <li>
                                <strong className="text-slate-800">Priorité :</strong> P{evacuationPriority}
                            </li>
                            <li>
                                <strong className="text-slate-800">Capacité :</strong>{' '}
                                {maxCapacity ? `${maxCapacity} pers.` : <em className="text-slate-400">non définie</em>}
                            </li>
                            <li>
                                <strong className="text-slate-800">Départements :</strong>{' '}
                                {departmentIds.size === 0 ? <em className="text-slate-400">tous</em> : `${departmentIds.size} sélectionné(s)`}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer actions */}
            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                    type="button"
                    onClick={() => navigate('/emergency/assembly-points')}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <IconX size={13} stroke={2} />
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-40"
                >
                    <IconCheck size={13} stroke={2.4} />
                    {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer le point de rassemblement'}
                </button>
            </div>
        </div>
    );
};

export default AssemblyPointFormPage;
