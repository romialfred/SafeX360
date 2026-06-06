import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@mantine/core';
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
} from '@tabler/icons-react';
import type { AssemblyPointDTO } from '../../../services/EmergencyService';
import { errorNotification } from '../../../utility/NotificationUtility';
import AssemblyPointsMap from './AssemblyPointsMap';

/**
 * Modal de création / édition d'un Point de rassemblement (LOT 48 Phase 2).
 *
 * <p>5 sections :</p>
 * <ol>
 *   <li>Infos générales (nom + description)</li>
 *   <li>Localisation : adresse + lat/lng + capture GPS + pick sur carte</li>
 *   <li>Responsabilité : manager + adjoint</li>
 *   <li>Capacité & priorité d'évacuation (1-5)</li>
 *   <li>Couverture départements (multi-select chips)</li>
 * </ol>
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

interface Props {
    opened: boolean;
    onClose: () => void;
    onSave: (dto: AssemblyPointDTO) => Promise<void>;
    initial?: AssemblyPointDTO | null;
    companyId: number;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    saving?: boolean;
}

const DEFAULT_PRIORITY = 2;

const AssemblyPointForm = ({
    opened,
    onClose,
    onSave,
    initial,
    companyId,
    employees,
    departments,
    saving = false,
}: Props) => {
    const { t } = useTranslation('emergency');

    // ── Form state ──
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [locationText, setLocationText] = useState('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [managerId, setManagerId] = useState<string>('');
    const [deputyManagerId, setDeputyManagerId] = useState<string>('');
    const [evacuationPriority, setEvacuationPriority] = useState<number>(DEFAULT_PRIORITY);
    const [maxCapacity, setMaxCapacity] = useState<string>('');
    const [departmentIds, setDepartmentIds] = useState<Set<number>>(new Set());

    const [gpsCapturing, setGpsCapturing] = useState(false);
    const [showPickMap, setShowPickMap] = useState(false);

    // ── Hydratation initiale ──
    useEffect(() => {
        if (!opened) return;
        if (initial) {
            setName(initial.name ?? '');
            setDescription(initial.description ?? '');
            setLocationText(initial.locationText ?? '');
            setLatitude(initial.latitude != null ? String(initial.latitude) : '');
            setLongitude(initial.longitude != null ? String(initial.longitude) : '');
            setManagerId(initial.managerId != null ? String(initial.managerId) : '');
            setDeputyManagerId(initial.deputyManagerId != null ? String(initial.deputyManagerId) : '');
            setEvacuationPriority(initial.evacuationPriority ?? DEFAULT_PRIORITY);
            setMaxCapacity(initial.maxCapacity != null ? String(initial.maxCapacity) : '');
            setDepartmentIds(
                new Set(
                    (initial.departmentIdsCsv ?? '')
                        .split(',')
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !Number.isNaN(n))
                )
            );
        } else {
            setName('');
            setDescription('');
            setLocationText('');
            setLatitude('');
            setLongitude('');
            setManagerId('');
            setDeputyManagerId('');
            setEvacuationPriority(DEFAULT_PRIORITY);
            setMaxCapacity('');
            setDepartmentIds(new Set());
        }
        setShowPickMap(false);
    }, [opened, initial]);

    // ── Validation ──
    const errors = useMemo(() => {
        const e: string[] = [];
        if (!name.trim()) e.push(t('assemblyPoints.form.name'));
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (Number.isNaN(lat) || lat < -90 || lat > 90) e.push(t('assemblyPoints.form.latitude'));
        if (Number.isNaN(lng) || lng < -180 || lng > 180) e.push(t('assemblyPoints.form.longitude'));
        return e;
    }, [name, latitude, longitude, t]);
    const valid = errors.length === 0;

    // ── Capture GPS via Geolocation API ──
    const captureGps = () => {
        if (!('geolocation' in navigator)) {
            errorNotification(t('assemblyPoints.geolocation.unsupported'));
            return;
        }
        setGpsCapturing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(6));
                setLongitude(pos.coords.longitude.toFixed(6));
                setGpsCapturing(false);
            },
            (err) => {
                setGpsCapturing(false);
                let msg = t('assemblyPoints.geolocation.unavailable');
                if (err.code === err.PERMISSION_DENIED) msg = t('assemblyPoints.geolocation.denied');
                else if (err.code === err.TIMEOUT) msg = t('assemblyPoints.geolocation.timeout');
                errorNotification(msg);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    // ── Pick sur carte ──
    const handlePickOnMap = (lat: number, lng: number) => {
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setShowPickMap(false);
    };

    // ── Submit ──
    const submit = async () => {
        if (!valid) return;
        const dto: AssemblyPointDTO = {
            id: initial?.id,
            companyId,
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
        await onSave(dto);
    };

    // ── Helpers ──
    const employeeLabel = (e: EmployeeOption) => {
        const parts = [e.name];
        if (e.position) parts.push(`(${e.position})`);
        return parts.join(' ');
    };
    const toggleDept = (id: number) =>
        setDepartmentIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    // ── Preview point for map ──
    const previewPoint = useMemo((): AssemblyPointDTO | null => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return {
            id: -1,
            companyId,
            name: name || '(nouveau)',
            latitude: lat,
            longitude: lng,
            evacuationPriority,
        };
    }, [latitude, longitude, name, evacuationPriority, companyId]);

    return (
        <Modal
            opened={opened}
            onClose={() => !saving && onClose()}
            centered
            size="lg"
            title={
                <div className="flex items-center gap-2">
                    <span className="bg-red-50 text-red-700 rounded-full p-1.5 flex items-center justify-center">
                        <IconMapPin size={13} stroke={1.8} />
                    </span>
                    <span
                        className="text-slate-800"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 500 }}
                    >
                        {initial ? t('assemblyPoints.edit') : t('assemblyPoints.addNew')}
                    </span>
                </div>
            }
        >
            <div className="space-y-5 mt-2">
                {/* ════ SECTION 1 — Infos générales ════ */}
                <fieldset>
                    <legend className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-2">
                        {t('assemblyPoints.form.section.general')}
                    </legend>
                    <div className="space-y-2.5">
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('assemblyPoints.form.namePlaceholder')}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.description')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder={t('assemblyPoints.form.descriptionPlaceholder')}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* ════ SECTION 2 — Localisation GPS ════ */}
                <fieldset className="border-t border-slate-100 pt-4">
                    <legend className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-2 flex items-center gap-1.5">
                        <IconMapPin size={11} stroke={1.8} />
                        {t('assemblyPoints.form.section.location')}
                    </legend>
                    <div className="space-y-2.5">
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.locationText')}
                            </label>
                            <input
                                type="text"
                                value={locationText}
                                onChange={(e) => setLocationText(e.target.value)}
                                placeholder={t('assemblyPoints.form.locationTextPlaceholder')}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] text-slate-500 mb-1">
                                    {t('assemblyPoints.form.latitude')}
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    min={-90}
                                    max={90}
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="12.371428"
                                    className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-slate-500 mb-1">
                                    {t('assemblyPoints.form.longitude')}
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    min={-180}
                                    max={180}
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="-1.519660"
                                    className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-mono"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={captureGps}
                                disabled={gpsCapturing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[12px] font-medium transition-colors disabled:opacity-50"
                            >
                                <IconCurrentLocation size={12} stroke={1.8} />
                                {gpsCapturing
                                    ? t('assemblyPoints.form.capturing')
                                    : t('assemblyPoints.form.captureGps')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPickMap((v) => !v)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 text-[12px] font-medium transition-colors"
                            >
                                <IconMap2 size={12} stroke={1.8} />
                                {t('assemblyPoints.form.pickOnMap')}
                            </button>
                        </div>
                        {showPickMap && (
                            <div className="rounded-lg overflow-hidden">
                                <AssemblyPointsMap
                                    points={previewPoint ? [previewPoint] : []}
                                    onPickLocation={handlePickOnMap}
                                    height={300}
                                />
                                <p className="text-[10.5px] text-slate-500 italic mt-1 px-1">
                                    Cliquez sur la carte pour placer le point.
                                </p>
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* ════ SECTION 3 — Responsabilité ════ */}
                <fieldset className="border-t border-slate-100 pt-4">
                    <legend className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-2 flex items-center gap-1.5">
                        <IconUser size={11} stroke={1.8} />
                        {t('assemblyPoints.form.section.responsible')}
                    </legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.manager')}
                            </label>
                            <select
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white"
                            >
                                <option value="">— Non assigné —</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {employeeLabel(emp)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.deputy')}
                            </label>
                            <select
                                value={deputyManagerId}
                                onChange={(e) => setDeputyManagerId(e.target.value)}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white"
                            >
                                <option value="">— Non assigné —</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {employeeLabel(emp)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                {/* ════ SECTION 4 — Capacité & priorité ════ */}
                <fieldset className="border-t border-slate-100 pt-4">
                    <legend className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-2 flex items-center gap-1.5">
                        <IconUsers size={11} stroke={1.8} />
                        {t('assemblyPoints.form.section.capacity')}
                    </legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.evacuationPriority')}
                            </label>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((p) => {
                                    const isActive = evacuationPriority === p;
                                    const colors = ['red', 'orange', 'yellow', 'sky', 'slate'][p - 1];
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setEvacuationPriority(p)}
                                            className={`flex-1 py-1.5 text-[12px] rounded-md border transition-all ${
                                                isActive
                                                    ? `bg-${colors}-600 text-white border-${colors}-700 font-semibold shadow-sm`
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                            title={t(`assemblyPoints.priority.p${p}`)}
                                        >
                                            P{p}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10.5px] text-slate-500 italic mt-1">
                                {t(`assemblyPoints.priority.p${evacuationPriority}`)}
                            </p>
                        </div>
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                {t('assemblyPoints.form.maxCapacity')}
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(e.target.value)}
                                placeholder="250"
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                            />
                            <p className="text-[10.5px] text-slate-500 mt-1">
                                {t('assemblyPoints.form.maxCapacityHint')}
                            </p>
                        </div>
                    </div>
                </fieldset>

                {/* ════ SECTION 5 — Départements couverts ════ */}
                {departments.length > 0 && (
                    <fieldset className="border-t border-slate-100 pt-4">
                        <legend className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-2 flex items-center gap-1.5">
                            <IconBuildingBank size={11} stroke={1.8} />
                            {t('assemblyPoints.form.section.coverage')}
                        </legend>
                        <p className="text-[11px] text-slate-500 mb-2">
                            {t('assemblyPoints.form.departmentsHint')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {departments.map((d) => {
                                const isSelected = departmentIds.has(d.id);
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => toggleDept(d.id)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11.5px] font-medium transition-colors ${
                                            isSelected
                                                ? 'bg-red-50 text-red-800 border-red-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {isSelected && <IconCheck size={10} stroke={2.4} />}
                                        {d.name}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                )}

                {/* ════ Erreurs + boutons ════ */}
                {errors.length > 0 && (
                    <div className="bg-red-50/60 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                        <IconAlertTriangle
                            size={14}
                            stroke={1.8}
                            className="text-red-500 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-[11.5px] text-red-800">
                            Champs requis manquants : <strong>{errors.join(', ')}</strong>
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                        <IconX size={11} stroke={2} />
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving || !valid}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 disabled:opacity-40"
                    >
                        <IconCheck size={11} stroke={2.4} />
                        {saving ? '…' : initial ? 'Enregistrer' : 'Créer'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AssemblyPointForm;
