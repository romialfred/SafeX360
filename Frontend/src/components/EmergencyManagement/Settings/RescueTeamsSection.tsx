import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@mantine/core';
import {
    IconUsersGroup,
    IconPlus,
    IconTrash,
    IconChevronDown,
    IconChevronRight,
    IconUser,
    IconBriefcase,
    IconBuildingBank,
    IconEdit,
    IconSearch,
} from '@tabler/icons-react';
import {
    listRescueTeams,
    createRescueTeam,
    updateRescueTeam,
    deleteRescueTeam,
    listRescueTeamMembers,
    addRescueTeamMember,
    removeRescueTeamMember,
    type RescueTeamDTO,
    type RescueTeamMemberDTO,
} from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Section « Équipes de secours » (LOT 48 Phase 1.c.2 — refonte table).
 *
 * Évolutions :
 *   - Membres en TABLE structurée (Nom & Prénom · Position · Rôle · Département · Actions)
 *   - Plus de roulements inline (déplacés dans le module Planification hebdomadaire)
 *   - Dropdown employé enrichi avec position + département en aperçu + recherche
 *   - Edition équipe (nom/description) via modal
 */

interface Props {
    companyId: number;
}

interface EmployeeEnriched {
    id: number;
    name: string;
    position?: string;
    department?: string;
}

const RescueTeamsSection = ({ companyId }: Props) => {
    const { t } = useTranslation('emergency');
    const currentUser = useAppSelector((state: any) => state.user);

    const [teams, setTeams] = useState<RescueTeamDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
    const [members, setMembers] = useState<Record<number, RescueTeamMemberDTO[]>>({});
    const [employees, setEmployees] = useState<EmployeeEnriched[]>([]);

    // ── Team modals ──
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<RescueTeamDTO | null>(null);
    const [teamFormName, setTeamFormName] = useState('');
    const [teamFormDesc, setTeamFormDesc] = useState('');
    const [savingTeam, setSavingTeam] = useState(false);

    // ── Member modal ──
    const [addMemberModalFor, setAddMemberModalFor] = useState<number | null>(null);
    const [memberEmployeeId, setMemberEmployeeId] = useState<string>('');
    const [memberRole, setMemberRole] = useState('');
    const [memberIsLeader, setMemberIsLeader] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    // ── Lookup ──
    const employeeMap = useMemo(() => {
        const map = new Map<number, EmployeeEnriched>();
        employees.forEach((e) => map.set(e.id, e));
        return map;
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        const s = memberSearch.trim().toLowerCase();
        if (!s) return employees;
        return employees.filter(
            (e) =>
                e.name.toLowerCase().includes(s) ||
                (e.position && e.position.toLowerCase().includes(s)) ||
                (e.department && e.department.toLowerCase().includes(s))
        );
    }, [memberSearch, employees]);

    // ── Chargement initial ──
    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res: any[]) => {
                const list: EmployeeEnriched[] = Array.isArray(res)
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
    }, []);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        listRescueTeams(companyId)
            .then((list) => setTeams(list.filter((tm) => tm.status !== 'INACTIVE')))
            .catch(() => setTeams([]))
            .finally(() => setLoading(false));
    }, [companyId]);

    const toggleExpand = async (teamId: number) => {
        if (expandedTeamId === teamId) {
            setExpandedTeamId(null);
            return;
        }
        setExpandedTeamId(teamId);
        if (!members[teamId]) {
            try {
                const m = await listRescueTeamMembers(teamId);
                setMembers((prev) => ({ ...prev, [teamId]: m }));
            } catch {
                setMembers((prev) => ({ ...prev, [teamId]: [] }));
            }
        }
    };

    // ── Création / Édition équipe ──
    const openCreateTeam = () => {
        setEditingTeam(null);
        setTeamFormName('');
        setTeamFormDesc('');
        setTeamModalOpen(true);
    };

    const openEditTeam = (team: RescueTeamDTO) => {
        setEditingTeam(team);
        setTeamFormName(team.name);
        setTeamFormDesc(team.description ?? '');
        setTeamModalOpen(true);
    };

    const handleSaveTeam = async () => {
        if (!teamFormName.trim()) return;
        setSavingTeam(true);
        try {
            if (editingTeam?.id) {
                const updated = await updateRescueTeam(
                    editingTeam.id,
                    { ...editingTeam, name: teamFormName.trim(), description: teamFormDesc.trim() },
                    currentUser?.id
                );
                setTeams((prev) => prev.map((tm) => (tm.id === updated.id ? updated : tm)));
                successNotification('Équipe mise à jour');
            } else {
                const created = await createRescueTeam(
                    { name: teamFormName.trim(), description: teamFormDesc.trim(), companyId },
                    currentUser?.id
                );
                setTeams((prev) => [...prev, created]);
                successNotification('Équipe créée');
            }
            setTeamModalOpen(false);
        } catch {
            errorNotification("Échec de l'enregistrement");
        } finally {
            setSavingTeam(false);
        }
    };

    const handleDeleteTeam = async (teamId: number) => {
        if (!confirm("Désactiver cette équipe ? L'historique reste conservé.")) return;
        try {
            await deleteRescueTeam(teamId, currentUser?.id);
            setTeams((prev) => prev.filter((tm) => tm.id !== teamId));
            if (expandedTeamId === teamId) setExpandedTeamId(null);
            successNotification('Équipe désactivée');
        } catch {
            errorNotification('Échec de la suppression');
        }
    };

    // ── Membres ──
    const openAddMember = (teamId: number) => {
        setAddMemberModalFor(teamId);
        setMemberEmployeeId('');
        setMemberRole('');
        setMemberIsLeader(false);
        setMemberSearch('');
    };

    const handleAddMember = async () => {
        if (!addMemberModalFor || !memberEmployeeId) return;
        try {
            const saved = await addRescueTeamMember(
                {
                    teamId: addMemberModalFor,
                    employeeId: Number(memberEmployeeId),
                    role: memberRole || null,
                    isTeamLeader: memberIsLeader,
                },
                currentUser?.id
            );
            setMembers((prev) => ({
                ...prev,
                [addMemberModalFor]: [...(prev[addMemberModalFor] || []), saved],
            }));
            setAddMemberModalFor(null);
            successNotification('Membre ajouté');
        } catch {
            errorNotification("Échec de l'ajout du membre");
        }
    };

    const handleRemoveMember = async (teamId: number, memberId: number) => {
        if (!confirm('Retirer ce membre de l\'équipe ?')) return;
        try {
            await removeRescueTeamMember(memberId, currentUser?.id);
            setMembers((prev) => ({
                ...prev,
                [teamId]: (prev[teamId] || []).filter((m) => m.id !== memberId),
            }));
            successNotification('Membre retiré');
        } catch {
            errorNotification('Échec du retrait');
        }
    };

    // ── Render ──
    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-emerald-400 rounded-xl p-5 shadow-sm">
            <header className="flex items-start justify-between gap-3 mb-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex-shrink-0" aria-hidden="true">
                        <IconUsersGroup size={15} stroke={1.6} />
                    </span>
                    <div>
                        <h3
                            className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            {t('settings.sections.rescueTeams.title')}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('settings.sections.rescueTeams.subtitle')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={openCreateTeam}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11.5px] font-medium transition-colors"
                >
                    <IconPlus size={12} stroke={2.2} />
                    {t('settings.sections.rescueTeams.addTeam')}
                </button>
            </header>

            {loading ? (
                <p className="text-[12px] text-slate-400 italic">Chargement…</p>
            ) : teams.length === 0 ? (
                <p className="text-[12px] text-slate-400 italic">
                    Aucune équipe de secours configurée.
                </p>
            ) : (
                <ul className="space-y-2.5">
                    {teams.map((team) => {
                        const expanded = expandedTeamId === team.id;
                        const teamId = team.id!;
                        const teamMembers = members[teamId] || [];
                        return (
                            <li
                                key={teamId}
                                className="border border-slate-200 rounded-lg overflow-hidden bg-white"
                            >
                                <div
                                    className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50/80"
                                    onClick={() => toggleExpand(teamId)}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {expanded ? (
                                            <IconChevronDown size={13} stroke={1.8} className="text-slate-500 flex-shrink-0" />
                                        ) : (
                                            <IconChevronRight size={13} stroke={1.8} className="text-slate-500 flex-shrink-0" />
                                        )}
                                        <span className="text-[13px] font-medium text-slate-800 truncate">
                                            {team.name}
                                        </span>
                                        <span className="text-[10.5px] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                            {team.memberCount ?? 0} membre{(team.memberCount ?? 0) > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditTeam(team);
                                            }}
                                            title="Modifier l'équipe"
                                            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                        >
                                            <IconEdit size={12} stroke={1.8} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTeam(teamId);
                                            }}
                                            title="Désactiver l'équipe"
                                            className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <IconTrash size={12} stroke={1.8} />
                                        </button>
                                    </div>
                                </div>

                                {expanded && (
                                    <div className="border-t border-slate-200 bg-slate-50/40 p-3">
                                        {team.description && (
                                            <p className="text-[11.5px] text-slate-600 italic mb-3 px-1">
                                                {team.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                                                Membres de l'équipe
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => openAddMember(teamId)}
                                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] text-emerald-700 border border-emerald-200 bg-white hover:bg-emerald-50"
                                            >
                                                <IconPlus size={10} stroke={2.4} />
                                                Ajouter
                                            </button>
                                        </div>

                                        {teamMembers.length === 0 ? (
                                            <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-lg">
                                                <IconUser size={20} className="text-slate-300 mx-auto mb-1" stroke={1.5} />
                                                <p className="text-[11.5px] text-slate-400 italic">
                                                    Aucun membre dans cette équipe.
                                                </p>
                                            </div>
                                        ) : (
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
                                                                    Rôle équipe
                                                                </th>
                                                                <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                                                    Département
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-20">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {teamMembers.map((m) => {
                                                                const emp = employeeMap.get(m.employeeId);
                                                                return (
                                                                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                                                                        <td className="px-3 py-2 text-slate-800">
                                                                            <span className="inline-flex items-center gap-1.5">
                                                                                <IconUser size={11} stroke={1.8} className="text-emerald-600" />
                                                                                {emp?.name ?? `#${m.employeeId}`}
                                                                                {m.isTeamLeader && (
                                                                                    <span className="text-[9px] uppercase font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1 rounded">
                                                                                        Chef
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-slate-600">
                                                                            {emp?.position || <span className="text-slate-400 italic">—</span>}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-slate-600">
                                                                            {m.role || <span className="text-slate-400 italic">—</span>}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-slate-600">
                                                                            {emp?.department || <span className="text-slate-400 italic">—</span>}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => m.id && handleRemoveMember(teamId, m.id)}
                                                                                title="Retirer"
                                                                                className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* ════ Modal création/édition équipe ════ */}
            <Modal
                opened={teamModalOpen}
                onClose={() => !savingTeam && setTeamModalOpen(false)}
                centered
                title={editingTeam ? "Modifier l'équipe" : 'Nouvelle équipe de secours'}
                size="sm"
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Nom *</label>
                        <input
                            type="text"
                            value={teamFormName}
                            onChange={(e) => setTeamFormName(e.target.value)}
                            placeholder="Équipe Alpha"
                            className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Description</label>
                        <textarea
                            value={teamFormDesc}
                            onChange={(e) => setTeamFormDesc(e.target.value)}
                            rows={2}
                            placeholder="Mission, périmètre, spécialités…"
                            className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setTeamModalOpen(false)}
                            disabled={savingTeam}
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSaveTeam}
                            disabled={savingTeam || !teamFormName.trim()}
                            className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 disabled:opacity-40"
                        >
                            {savingTeam ? '…' : editingTeam ? 'Enregistrer' : 'Créer'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ════ Modal ajout membre ════ */}
            <Modal
                opened={addMemberModalFor !== null}
                onClose={() => setAddMemberModalFor(null)}
                centered
                title="Ajouter un membre"
                size="md"
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Employé *</label>
                        <div className="relative mb-2">
                            <IconSearch
                                size={13}
                                stroke={1.8}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Rechercher par nom, position ou département…"
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                            />
                        </div>
                        <div className="border border-slate-200 rounded-md max-h-48 overflow-y-auto bg-white">
                            {filteredEmployees.length === 0 ? (
                                <p className="px-3 py-3 text-[12px] text-slate-400 italic text-center">
                                    Aucun employé trouvé.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {filteredEmployees.slice(0, 80).map((e) => {
                                        const isSelected = String(e.id) === memberEmployeeId;
                                        return (
                                            <li
                                                key={e.id}
                                                onClick={() => setMemberEmployeeId(String(e.id))}
                                                className={`px-3 py-2 cursor-pointer transition-colors flex items-start gap-2 ${
                                                    isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                                                    isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <IconUser size={11} stroke={1.8} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-[12.5px] truncate ${isSelected ? 'text-emerald-900 font-medium' : 'text-slate-800'}`}>
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
                    </div>
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                            Rôle dans l'équipe (optionnel)
                        </label>
                        <select
                            value={memberRole}
                            onChange={(e) => setMemberRole(e.target.value)}
                            className="w-full px-3 py-1.5 text-[12.5px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                        >
                            <option value="">— Aucun —</option>
                            <option value="Médecin">Médecin</option>
                            <option value="Infirmier">Infirmier</option>
                            <option value="Secouriste">Secouriste</option>
                            <option value="Pompier">Pompier</option>
                            <option value="Sauveteur minier">Sauveteur minier</option>
                            <option value="Coordinateur">Coordinateur</option>
                            <option value="Logistique">Logistique</option>
                            <option value="Communication">Communication</option>
                        </select>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={memberIsLeader}
                            onChange={(e) => setMemberIsLeader(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-[12.5px] text-slate-700">Désigner comme chef d'équipe</span>
                    </label>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setAddMemberModalFor(null)}
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleAddMember}
                            disabled={!memberEmployeeId}
                            className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 disabled:opacity-40"
                        >
                            Ajouter
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
};

export default RescueTeamsSection;
