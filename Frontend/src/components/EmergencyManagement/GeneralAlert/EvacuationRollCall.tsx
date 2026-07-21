import { useMemo, useState } from 'react';
import {
    IconShieldCheck,
    IconStethoscope,
    IconShieldX,
    IconCircleMinus,
    IconSearch,
    IconUsers,
    IconAlertTriangle,
    IconSquareCheck,
    IconSquare,
} from '@tabler/icons-react';
import {
    bulkCheckInToAlert,
    type CheckInStatus,
    type EvacuationCheckInDTO,
} from '../../../services/GeneralAlertService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';

/**
 * EvacuationRollCall — Appel nominatif du centre de contrôle (LOT 63).
 *
 * Objectif opérationnel : à la fin d'une évacuation, répondre à UNE question —
 * « reste-t-il quelqu'un que personne n'a localisé ? ». Tout est conçu autour
 * de ce chiffre.
 *
 * Principes de conception :
 *
 * 1. **L'effectif COMPLET est listé**, y compris les employés sans département.
 *    L'ancien head-count les filtrait par catégorie de département : un employé
 *    sans département n'apparaissait dans aucun panneau, donc ne pouvait pas
 *    être pointé — il restait invisible tout en étant potentiellement sur site.
 *
 * 2. **« Reste à pointer » ≠ « Absent »**. L'absence de pointage signifie que
 *    personne n'a encore vérifié cette personne ; MISSING est un constat. Les
 *    confondre ferait croire l'évacuation terminée alors que des employés n'ont
 *    jamais été cherchés.
 *
 * 3. **Un clic = un statut.** Les 4 boutons sont sur la ligne, sans modale :
 *    sous stress et en temps contraint, ouvrir/fermer une fenêtre par personne
 *    est inutilisable. La modale existante reste disponible pour justifier un
 *    statut par une note.
 *
 * 4. **Traitement par lot** : sélection multiple + application en une requête
 *    (une équipe entière arrivée au point, un service en congé).
 *
 * 5. **Mise à jour optimiste avec retour arrière** si le serveur refuse.
 */

export interface RollCallEmployee {
    id: number;
    name: string;
    department?: string;
    position?: string;
}

interface Props {
    alertId: number;
    employees: RollCallEmployee[];
    checkIns: EvacuationCheckInDTO[];
    /** Alerte en cours : le pointage n'est modifiable que dans ce cas. */
    isActive: boolean;
    actorId?: number;
    /** Remonte les pointages (créés ou modifiés) pour fusion dans l'état parent. */
    onCheckInsUpdated: (updated: EvacuationCheckInDTO[]) => void;
    /** Ouvre la modale détaillée (note / source de l'information). */
    onOpenDetail?: (employee: RollCallEmployee) => void;
}

type FilterKey = 'PENDING' | 'ALL' | CheckInStatus;

const STATUS_META: Record<CheckInStatus, {
    label: string; short: string; icon: any; chip: string; btnActive: string;
}> = {
    SAFE: {
        label: 'En sécurité', short: 'Sécurité', icon: IconShieldCheck,
        chip: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        btnActive: 'bg-emerald-600 border-emerald-600 text-white',
    },
    INJURED: {
        label: 'Blessé', short: 'Blessé', icon: IconStethoscope,
        chip: 'bg-amber-100 text-amber-800 ring-amber-200',
        btnActive: 'bg-amber-500 border-amber-500 text-white',
    },
    MISSING: {
        label: 'Absent', short: 'Absent', icon: IconShieldX,
        chip: 'bg-red-100 text-red-700 ring-red-200',
        btnActive: 'bg-red-600 border-red-600 text-white',
    },
    NOT_APPLICABLE: {
        label: 'Non concerné', short: 'N/A', icon: IconCircleMinus,
        chip: 'bg-slate-100 text-slate-600 ring-slate-200',
        btnActive: 'bg-slate-600 border-slate-600 text-white',
    },
};

const ORDERED_STATUSES: CheckInStatus[] = ['SAFE', 'INJURED', 'MISSING', 'NOT_APPLICABLE'];

export default function EvacuationRollCall({
    alertId,
    employees,
    checkIns,
    isActive,
    actorId,
    onCheckInsUpdated,
    onOpenDetail,
}: Props) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterKey>('PENDING');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

    const statusByEmployee = useMemo(() => {
        const m = new Map<number, EvacuationCheckInDTO>();
        checkIns.forEach((c) => m.set(c.employeeId, c));
        return m;
    }, [checkIns]);

    const counts = useMemo(() => {
        const c = { total: employees.length, SAFE: 0, INJURED: 0, MISSING: 0, NOT_APPLICABLE: 0, pending: 0 };
        employees.forEach((e) => {
            const st = statusByEmployee.get(e.id)?.status;
            if (!st) c.pending++;
            else c[st]++;
        });
        return c;
    }, [employees, statusByEmployee]);

    // Personnes réellement "traitées" : tout sauf celles qu'on n'a pas encore vérifiées.
    const accounted = counts.total - counts.pending;
    const progress = counts.total === 0 ? 0 : Math.round((accounted / counts.total) * 100);

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return employees.filter((e) => {
            const st = statusByEmployee.get(e.id)?.status;
            if (filter === 'PENDING' && st) return false;
            if (filter !== 'PENDING' && filter !== 'ALL' && st !== filter) return false;
            if (!needle) return true;
            return (
                e.name.toLowerCase().includes(needle) ||
                (e.department || '').toLowerCase().includes(needle) ||
                (e.position || '').toLowerCase().includes(needle)
            );
        });
    }, [employees, statusByEmployee, filter, search]);

    // Regroupement par département, avec un vrai bucket pour les sans-département
    // (sinon ils disparaissent de l'appel — c'est exactement le bug corrigé).
    const grouped = useMemo(() => {
        const m = new Map<string, RollCallEmployee[]>();
        visible.forEach((e) => {
            const key = e.department?.trim() || 'Sans département';
            if (!m.has(key)) m.set(key, []);
            m.get(key)!.push(e);
        });
        return Array.from(m.entries())
            .sort((a, b) => a[0].localeCompare(b[0], 'fr', { sensitivity: 'base' }))
            .map(([dept, list]) => [
                dept,
                list.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })),
            ] as [string, RollCallEmployee[]]);
    }, [visible]);

    const toggleSelect = (empId: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(empId)) next.delete(empId); else next.add(empId);
            return next;
        });
    };

    const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.id));
    const toggleSelectAllVisible = () => {
        setSelected((prev) => {
            if (allVisibleSelected) {
                const next = new Set(prev);
                visible.forEach((e) => next.delete(e.id));
                return next;
            }
            const next = new Set(prev);
            visible.forEach((e) => next.add(e.id));
            return next;
        });
    };

    const applyStatus = async (employeeIds: number[], status: CheckInStatus) => {
        if (employeeIds.length === 0 || saving) return;

        // Optimiste : la liste doit réagir au clic, pas à la latence réseau.
        const optimistic: EvacuationCheckInDTO[] = employeeIds.map((employeeId) => ({
            ...(statusByEmployee.get(employeeId) ?? { generalAlertId: alertId, employeeId }),
            generalAlertId: alertId,
            employeeId,
            status,
            checkedAt: new Date().toISOString(),
        } as EvacuationCheckInDTO));
        onCheckInsUpdated(optimistic);

        setSaving(true);
        try {
            const saved = await bulkCheckInToAlert({
                alertId,
                actorId,
                entries: employeeIds.map((employeeId) => ({ employeeId, status })),
            });
            // Réconciliation avec la vérité serveur (ids, horodatage réel).
            if (Array.isArray(saved) && saved.length > 0) onCheckInsUpdated(saved);
            setSelected(new Set());
            successNotification(
                employeeIds.length === 1
                    ? `Statut enregistré : ${STATUS_META[status].label}`
                    : `${employeeIds.length} employés marqués « ${STATUS_META[status].label} »`,
            );
        } catch (e: any) {
            // Retour arrière : on restaure l'état d'origine des lignes touchées.
            const rollback = employeeIds
                .map((employeeId) => statusByEmployee.get(employeeId))
                .filter(Boolean) as EvacuationCheckInDTO[];
            onCheckInsUpdated(rollback);
            errorNotification(
                e?.response?.data?.errorMessage || "Le pointage n'a pas pu être enregistré",
            );
        } finally {
            setSaving(false);
        }
    };

    const FILTERS: { key: FilterKey; label: string; count: number; tone: string }[] = [
        { key: 'PENDING', label: 'À pointer', count: counts.pending, tone: 'bg-slate-900 text-white' },
        { key: 'SAFE', label: 'En sécurité', count: counts.SAFE, tone: 'bg-emerald-600 text-white' },
        { key: 'INJURED', label: 'Blessés', count: counts.INJURED, tone: 'bg-amber-500 text-white' },
        { key: 'MISSING', label: 'Absents', count: counts.MISSING, tone: 'bg-red-600 text-white' },
        { key: 'NOT_APPLICABLE', label: 'Non concernés', count: counts.NOT_APPLICABLE, tone: 'bg-slate-600 text-white' },
    ];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* ── Bandeau de progression ── */}
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <IconUsers size={16} stroke={1.8} className="text-slate-500" />
                        <h3 className="text-[14px] font-semibold text-slate-800">Appel nominatif</h3>
                    </div>

                    {counts.pending > 0 ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 ring-1 ring-red-200">
                            <IconAlertTriangle size={13} stroke={2} className="text-red-600" />
                            <span className="text-[12px] font-semibold text-red-700 tabular-nums">
                                {counts.pending} personne{counts.pending > 1 ? 's' : ''} non localisée{counts.pending > 1 ? 's' : ''}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                            <IconShieldCheck size={13} stroke={2} className="text-emerald-600" />
                            <span className="text-[12px] font-semibold text-emerald-700">
                                Effectif intégralement pointé
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                counts.pending === 0 ? 'bg-emerald-500' : 'bg-slate-800'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[11.5px] text-slate-600 tabular-nums font-medium">
                        {accounted}/{counts.total}
                    </span>
                </div>
            </div>

            {/* ── Filtres (une seule ligne) puis recherche en dessous ── */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex flex-col gap-2.5">
                <div className="flex flex-nowrap gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                                filter === f.key ? f.tone : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {f.label}
                            <span className="tabular-nums opacity-80">{f.count}</span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full">
                    <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nom, département…"
                        className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 focus:bg-white"
                    />
                </div>
            </div>

            {/* ── Barre d'action par lot ── */}
            {isActive && selected.size > 0 && (
                <div className="px-4 py-2.5 bg-slate-900 flex items-center gap-2.5 flex-wrap sticky top-0 z-10">
                    <span className="text-[12px] text-white font-medium">
                        {selected.size} sélectionné{selected.size > 1 ? 's' : ''} —
                    </span>
                    {ORDERED_STATUSES.map((s) => {
                        const meta = STATUS_META[s];
                        return (
                            <button
                                key={s}
                                type="button"
                                disabled={saving}
                                onClick={() => applyStatus(Array.from(selected), s)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-colors disabled:opacity-50 ${meta.btnActive} hover:brightness-110`}
                            >
                                <meta.icon size={13} stroke={2} />
                                {meta.label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setSelected(new Set())}
                        className="ml-auto text-[11.5px] text-slate-300 hover:text-white underline"
                    >
                        Annuler la sélection
                    </button>
                </div>
            )}

            {/* ── Liste ── */}
            <div className="max-h-[560px] overflow-y-auto">
                {visible.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconShieldCheck size={26} className="text-emerald-400 mx-auto mb-2" />
                        <p className="text-[13px] font-medium text-slate-700">
                            {filter === 'PENDING'
                                ? 'Plus personne à pointer dans ce filtre'
                                : 'Aucun employé ne correspond'}
                        </p>
                    </div>
                ) : (
                    <>
                        {isActive && (
                            <div className="px-4 py-1.5 border-b border-slate-100 bg-slate-50/60">
                                <button
                                    type="button"
                                    onClick={toggleSelectAllVisible}
                                    className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600 hover:text-slate-900"
                                >
                                    {allVisibleSelected
                                        ? <IconSquareCheck size={14} stroke={1.8} />
                                        : <IconSquare size={14} stroke={1.8} />}
                                    Tout sélectionner ({visible.length})
                                </button>
                            </div>
                        )}

                        {grouped.map(([dept, list]) => (
                            <div key={dept}>
                                <div className="px-4 py-1.5 bg-slate-50 border-y border-slate-100 sticky top-0">
                                    <span className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-500">
                                        {dept} · {list.length}
                                    </span>
                                </div>

                                {list.map((emp) => {
                                    const ci = statusByEmployee.get(emp.id);
                                    const st = ci?.status;
                                    const isSel = selected.has(emp.id);
                                    return (
                                        <div
                                            key={emp.id}
                                            className={`px-4 py-2 flex items-center gap-3 border-b border-slate-50 transition-colors ${
                                                isSel ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                                            }`}
                                        >
                                            {isActive && (
                                                <button
                                                    type="button"
                                                    aria-label={isSel ? 'Désélectionner' : 'Sélectionner'}
                                                    onClick={() => toggleSelect(emp.id)}
                                                    className="text-slate-400 hover:text-slate-700 flex-shrink-0"
                                                >
                                                    {isSel
                                                        ? <IconSquareCheck size={16} stroke={1.8} className="text-slate-800" />
                                                        : <IconSquare size={16} stroke={1.8} />}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => onOpenDetail?.(emp)}
                                                className="flex-1 min-w-0 text-left group"
                                                title="Ouvrir le détail (ajouter une note)"
                                            >
                                                <p className="text-[13px] font-medium text-slate-800 truncate group-hover:text-slate-950">
                                                    {emp.name}
                                                </p>
                                                {emp.position && (
                                                    <p className="text-[11px] text-slate-500 truncate">{emp.position}</p>
                                                )}
                                            </button>

                                            {/* Statut courant */}
                                            <div className="w-[92px] flex-shrink-0 hidden sm:block">
                                                {st ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ring-1 ${STATUS_META[st].chip}`}>
                                                        {STATUS_META[st].short}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                                                        À pointer
                                                    </span>
                                                )}
                                            </div>

                                            {/* 4 statuts en un clic */}
                                            {isActive && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {ORDERED_STATUSES.map((s) => {
                                                        const meta = STATUS_META[s];
                                                        const active = st === s;
                                                        return (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                disabled={saving}
                                                                title={meta.label}
                                                                aria-label={`${emp.name} : ${meta.label}`}
                                                                aria-pressed={active}
                                                                onClick={() => applyStatus([emp.id], s)}
                                                                className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors disabled:opacity-40 ${
                                                                    active
                                                                        ? meta.btnActive
                                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                                                }`}
                                                            >
                                                                <meta.icon size={14} stroke={1.9} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
