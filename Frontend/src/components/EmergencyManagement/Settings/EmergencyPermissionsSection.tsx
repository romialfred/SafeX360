import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@mantine/core';
import {
    IconShield,
    IconPlus,
    IconTrash,
    IconUserCheck,
    IconUser,
    IconBriefcase,
    IconBuildingBank,
    IconSearch,
    IconChevronDown,
    IconChevronRight,
} from '@tabler/icons-react';
import {
    listEmergencyPermissionHolders,
    grantEmergencyPermission,
    revokeEmergencyPermission,
    type EmergencyPermissionDTO,
    type EmergencyPermissionKey,
} from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { useAppSelector } from '../../../slices/hooks';

/**
 * Section « Permissions » de la page Paramètres Urgences
 * (LOT 48 Phase 1.b puis 1.g — refonte table).
 *
 * 3 zones pliables d'attribution (Coordinateurs / Secouristes / Lanceurs d'alerte),
 * une par {@link EmergencyPermissionKey}.
 *
 * Évolutions Phase 1.g :
 *   - Détenteurs en TABLE structurée (Nom & Prénom · Position · Département · Actions)
 *   - Picker employé filtrable avec position + département en aperçu
 *   - Sections collapsibles pour gagner de la verticalité
 */

interface Props {
    companyId: number;
}

interface EmployeeEnriched {
    id: number;
    name: string;
    position?: string;
    department?: string;
    email?: string;
}

interface PermissionState {
    holders: EmergencyPermissionDTO[];
    loading: boolean;
}

const PERMISSION_KEYS: EmergencyPermissionKey[] = ['COORDINATOR', 'RESPONDER', 'ALERT_LAUNCHER'];

// ────────────────────────────────────────────────────────────────────────────
// Sous-composant : table des détenteurs
// ────────────────────────────────────────────────────────────────────────────

function HoldersTable({
    holders,
    employeeMap,
    onRemove,
    busyIds,
}: {
    holders: EmergencyPermissionDTO[];
    employeeMap: Map<number, EmployeeEnriched>;
    onRemove: (permissionId: number) => void;
    busyIds: Set<number>;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Nom & Prénom
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Position
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Département
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-20">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {holders.map((h) => {
                            const emp = employeeMap.get(h.userId);
                            const isBusy = busyIds.has(h.id ?? -1);
                            return (
                                <tr
                                    key={h.id}
                                    className={`hover:bg-slate-50/60 transition-colors ${isBusy ? 'opacity-50' : ''}`}
                                >
                                    <td className="px-3 py-2 text-slate-800">
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconUserCheck size={11} stroke={1.8} className="text-rose-600" />
                                            {emp?.name ?? `#${h.userId}`}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">
                                        {emp?.position || <span className="text-slate-400 italic">—</span>}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">
                                        {emp?.department || <span className="text-slate-400 italic">—</span>}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => h.id !== undefined && onRemove(h.id)}
                                            title="Révoquer la permission"
                                            className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                                        >
                                            <IconTrash size={11} stroke={1.8} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Sous-composant : zone d'une permission (collapsible)
// ────────────────────────────────────────────────────────────────────────────

function PermissionZone({
    title,
    description,
    holders,
    loading,
    expanded,
    onToggle,
    onAddClick,
    onRemove,
    employeeMap,
    busyIds,
}: {
    title: string;
    description: string;
    holders: EmergencyPermissionDTO[];
    loading: boolean;
    expanded: boolean;
    onToggle: () => void;
    onAddClick: () => void;
    onRemove: (permissionId: number) => void;
    employeeMap: Map<number, EmployeeEnriched>;
    busyIds: Set<number>;
}) {
    const count = holders.length;
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-2.5 last:mb-0">
            <div
                onClick={onToggle}
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-50/40 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {expanded ? (
                        <IconChevronDown size={13} stroke={1.8} className="text-slate-500 flex-shrink-0" />
                    ) : (
                        <IconChevronRight size={13} stroke={1.8} className="text-slate-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 truncate">
                            {title}
                            <span className="ml-2 text-[10.5px] uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-semibold">
                                {count}
                            </span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{description}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddClick();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11.5px] font-medium transition-colors whitespace-nowrap flex-shrink-0"
                >
                    <IconPlus size={12} stroke={2.2} />
                    Ajouter
                </button>
            </div>

            {expanded && (
                <div className="p-3">
                    {loading ? (
                        <p className="text-[12px] text-slate-400 italic">Chargement…</p>
                    ) : holders.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                            <IconUser size={20} className="text-slate-300 mx-auto mb-1" stroke={1.5} />
                            <p className="text-[11.5px] text-slate-400 italic">
                                Aucun utilisateur désigné pour le moment.
                            </p>
                        </div>
                    ) : (
                        <HoldersTable
                            holders={holders}
                            employeeMap={employeeMap}
                            onRemove={onRemove}
                            busyIds={busyIds}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────

const EmergencyPermissionsSection = ({ companyId }: Props) => {
    const { t } = useTranslation('emergency');
    const currentUser = useAppSelector((state: any) => state.user);

    const [employees, setEmployees] = useState<EmployeeEnriched[]>([]);
    const [state, setState] = useState<Record<EmergencyPermissionKey, PermissionState>>({
        COORDINATOR: { holders: [], loading: true },
        RESPONDER: { holders: [], loading: true },
        ALERT_LAUNCHER: { holders: [], loading: true },
    });
    const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState<Record<EmergencyPermissionKey, boolean>>({
        COORDINATOR: true,
        RESPONDER: false,
        ALERT_LAUNCHER: false,
    });

    // Modal
    const [modalOpenFor, setModalOpenFor] = useState<EmergencyPermissionKey | null>(null);
    const [modalSelection, setModalSelection] = useState<Set<number>>(new Set());
    const [modalSaving, setModalSaving] = useState(false);
    const [modalSearch, setModalSearch] = useState('');

    // ── Lookup ──
    const employeeMap = useMemo(() => {
        const map = new Map<number, EmployeeEnriched>();
        employees.forEach((e) => map.set(e.id, e));
        return map;
    }, [employees]);

    // ── Chargement employés enrichis ──
    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res: any[]) => {
                const list: EmployeeEnriched[] = Array.isArray(res)
                    ? res.map((e) => ({
                          id: e.id,
                          name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
                          position: e.position,
                          department: e.department,
                          email: e.email,
                      }))
                    : [];
                setEmployees(list);
            })
            .catch(() => errorNotification('Impossible de charger la liste des employés'));
    }, []);

    // ── Chargement des holders en parallèle ──
    useEffect(() => {
        if (!companyId) return;
        let cancelled = false;
        PERMISSION_KEYS.forEach((perm) => {
            setState((prev) => ({ ...prev, [perm]: { ...prev[perm], loading: true } }));
            listEmergencyPermissionHolders(perm, companyId)
                .then((list) => {
                    if (cancelled) return;
                    setState((prev) => ({ ...prev, [perm]: { holders: list, loading: false } }));
                })
                .catch(() => {
                    if (cancelled) return;
                    setState((prev) => ({ ...prev, [perm]: { holders: [], loading: false } }));
                });
        });
        return () => {
            cancelled = true;
        };
    }, [companyId]);

    const toggleExpand = (key: EmergencyPermissionKey) =>
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

    // ── Révocation (soft delete) avec optimistic UI ──
    const handleRevoke = async (permissionId: number) => {
        let key: EmergencyPermissionKey | null = null;
        for (const k of PERMISSION_KEYS) {
            if (state[k].holders.some((h) => h.id === permissionId)) {
                key = k;
                break;
            }
        }
        if (!key) return;

        setBusyIds((prev) => new Set(prev).add(permissionId));
        const previousHolders = state[key].holders;
        setState((prev) => ({
            ...prev,
            [key!]: {
                ...prev[key!],
                holders: prev[key!].holders.filter((h) => h.id !== permissionId),
            },
        }));

        try {
            await revokeEmergencyPermission(permissionId, currentUser?.id);
            successNotification('Permission révoquée');
        } catch {
            setState((prev) => ({ ...prev, [key!]: { ...prev[key!], holders: previousHolders } }));
            errorNotification('Échec de la révocation');
        } finally {
            setBusyIds((prev) => {
                const next = new Set(prev);
                next.delete(permissionId);
                return next;
            });
        }
    };

    // ── Modal d'ajout ──
    const openAddModal = (perm: EmergencyPermissionKey) => {
        setModalOpenFor(perm);
        setModalSelection(new Set());
        setModalSearch('');
    };

    const closeAddModal = () => {
        if (modalSaving) return;
        setModalOpenFor(null);
        setModalSelection(new Set());
    };

    const toggleEmployeeInSelection = (id: number) => {
        setModalSelection((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSaveModal = async () => {
        if (!modalOpenFor || modalSelection.size === 0) return;
        setModalSaving(true);
        const perm = modalOpenFor;
        const targetIds = Array.from(modalSelection);

        try {
            const created: EmergencyPermissionDTO[] = [];
            for (const userId of targetIds) {
                const dto: EmergencyPermissionDTO = { userId, permission: perm, companyId };
                const saved = await grantEmergencyPermission(dto, currentUser?.id);
                if (!state[perm].holders.some((h) => h.id === saved.id)) {
                    created.push(saved);
                }
            }
            setState((prev) => ({
                ...prev,
                [perm]: { ...prev[perm], holders: [...prev[perm].holders, ...created] },
            }));
            successNotification(`${created.length} permission(s) accordée(s)`);
            closeAddModal();
        } catch {
            errorNotification("Échec de l'ajout des permissions");
        } finally {
            setModalSaving(false);
        }
    };

    // ── Employés éligibles + recherche ──
    const eligibleFiltered = useMemo(() => {
        if (!modalOpenFor) return [];
        const heldUserIds = new Set(state[modalOpenFor].holders.map((h) => h.userId));
        const s = modalSearch.trim().toLowerCase();
        return employees.filter((e) => {
            if (heldUserIds.has(e.id)) return false;
            if (!s) return true;
            return (
                e.name.toLowerCase().includes(s) ||
                (e.position && e.position.toLowerCase().includes(s)) ||
                (e.department && e.department.toLowerCase().includes(s))
            );
        });
    }, [employees, modalOpenFor, state, modalSearch]);

    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-rose-400 rounded-xl p-5 shadow-sm">
            <header className="flex items-start gap-2.5 mb-4 pb-2.5 border-b border-slate-100">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex-shrink-0" aria-hidden="true">
                    <IconShield size={15} stroke={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {t('settings.sections.permissions.title')}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                        {t('settings.sections.permissions.subtitle')}
                    </p>
                </div>
            </header>

            <PermissionZone
                title={t('settings.sections.permissions.coordinators')}
                description={t('settings.sections.permissions.coordinatorsHelp')}
                holders={state.COORDINATOR.holders}
                loading={state.COORDINATOR.loading}
                expanded={expanded.COORDINATOR}
                onToggle={() => toggleExpand('COORDINATOR')}
                onAddClick={() => openAddModal('COORDINATOR')}
                onRemove={handleRevoke}
                employeeMap={employeeMap}
                busyIds={busyIds}
            />
            <PermissionZone
                title={t('settings.sections.permissions.responders')}
                description={t('settings.sections.permissions.respondersHelp')}
                holders={state.RESPONDER.holders}
                loading={state.RESPONDER.loading}
                expanded={expanded.RESPONDER}
                onToggle={() => toggleExpand('RESPONDER')}
                onAddClick={() => openAddModal('RESPONDER')}
                onRemove={handleRevoke}
                employeeMap={employeeMap}
                busyIds={busyIds}
            />
            <PermissionZone
                title={t('settings.sections.permissions.alertLaunchers')}
                description={t('settings.sections.permissions.alertLaunchersHelp')}
                holders={state.ALERT_LAUNCHER.holders}
                loading={state.ALERT_LAUNCHER.loading}
                expanded={expanded.ALERT_LAUNCHER}
                onToggle={() => toggleExpand('ALERT_LAUNCHER')}
                onAddClick={() => openAddModal('ALERT_LAUNCHER')}
                onRemove={handleRevoke}
                employeeMap={employeeMap}
                busyIds={busyIds}
            />

            {/* ════ Modal d'ajout multi-cibles ════ */}
            <Modal
                opened={modalOpenFor !== null}
                onClose={closeAddModal}
                centered
                size="md"
                title={
                    <div className="flex items-center gap-2">
                        <span className="bg-rose-50 text-rose-700 rounded-full p-1.5 flex items-center justify-center">
                            <IconShield size={13} stroke={1.8} />
                        </span>
                        <span
                            className="text-slate-800"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 500 }}
                        >
                            Ajouter — {modalOpenFor ? t(`permissions.${modalOpenFor}`) : ''}
                        </span>
                    </div>
                }
            >
                <div className="space-y-3 mt-2">
                    <p className="text-[12.5px] text-slate-600">
                        Sélectionnez un ou plusieurs employés à qui accorder cette permission.
                    </p>

                    {/* Barre de recherche */}
                    <div className="relative">
                        <IconSearch
                            size={13}
                            stroke={1.8}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                            placeholder="Rechercher par nom, position ou département…"
                            className="w-full pl-8 pr-3 py-1.5 text-[12.5px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                        />
                    </div>

                    {/* Liste filtrable */}
                    <div className="border border-slate-200 rounded-md max-h-72 overflow-y-auto bg-white">
                        {eligibleFiltered.length === 0 ? (
                            <p className="px-3 py-4 text-[12px] text-slate-400 italic text-center">
                                Aucun employé éligible.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {eligibleFiltered.slice(0, 100).map((e) => {
                                    const isSelected = modalSelection.has(e.id);
                                    return (
                                        <li
                                            key={e.id}
                                            onClick={() => toggleEmployeeInSelection(e.id)}
                                            className={`px-3 py-2 cursor-pointer transition-colors flex items-start gap-2 ${
                                                isSelected ? 'bg-rose-50' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleEmployeeInSelection(e.id)}
                                                onClick={(ev) => ev.stopPropagation()}
                                                className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-[12.5px] truncate ${isSelected ? 'text-rose-900 font-medium' : 'text-slate-800'}`}>
                                                    {e.name}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                    {e.position && (
                                                        <span className="inline-flex items-center gap-0.5">
                                                            <IconBriefcase size={9} stroke={1.8} />
                                                            {e.position}
                                                        </span>
                                                    )}
                                                    {e.position && e.department && <span className="text-slate-300">·</span>}
                                                    {e.department && (
                                                        <span className="inline-flex items-center gap-0.5">
                                                            <IconBuildingBank size={9} stroke={1.8} />
                                                            {e.department}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <span className="text-[11.5px] text-slate-500">
                            {modalSelection.size} sélectionné{modalSelection.size > 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={closeAddModal}
                                disabled={modalSaving}
                                className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveModal}
                                disabled={modalSaving || modalSelection.size === 0}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 disabled:opacity-40"
                            >
                                <IconUserCheck size={13} stroke={2} />
                                {modalSaving ? 'Enregistrement…' : `Accorder (${modalSelection.size})`}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </section>
    );
};

export default EmergencyPermissionsSection;
