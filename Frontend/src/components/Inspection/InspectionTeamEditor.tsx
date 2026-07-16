/**
 * InspectionTeamEditor — éditeur d'équipe d'inspection (employés + rôles).
 *
 * Composant CONTRÔLÉ, partagé par deux écrans :
 *   - `InspectionScheduleForm` (composition à la planification) ;
 *   - `InspectionDetailPage`   (modification d'une inspection déjà planifiée,
 *                               via `PUT /hns/inspection/{id}/team`).
 *
 * Extrait de InspectionScheduleForm : dupliquer ce bloc aurait garanti que les
 * deux copies divergent (l'invariant du LEAD en premier).
 *
 * INVARIANT (D4) : exactement UN membre `LEAD`. Il est tenu ICI, côté IHM —
 * désigner un nouveau principal rétrograde le précédent en inspecteur — ET
 * revalidé par le serveur (`normalizeTeam`). On ne se repose pas sur le seul
 * serveur : l'utilisateur doit voir le problème avant de soumettre.
 * Un employé ne peut tenir qu'un seul rôle : il est exclu des autres lignes.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@mantine/core';
import { IconUsers, IconUserPlus, IconTrash, IconAlertOctagon } from '@tabler/icons-react';

import {
    INSPECTION_ROLE_CONFIG,
    inspectionRoleLabel,
    inspectionRoleOptions,
    initialsOf,
    type InspectionRoleKey,
} from './inspectionLabels';

/** Membre côté IHM. `uid` = clé de rendu stable, jamais envoyée au serveur. */
export interface TeamMemberState {
    uid: string;
    employeeId: string;
    role: InspectionRoleKey;
}

let memberSeq = 0;
export const newTeamMember = (role: InspectionRoleKey): TeamMemberState => ({
    uid: `m${++memberSeq}`,
    employeeId: '',
    role,
});

/** Nombre de LEAD — utilisé par les appelants pour bloquer la soumission. */
export const leadCountOf = (team: TeamMemberState[]) =>
    team.filter((m) => m.role === 'LEAD').length;

/**
 * Hydrate l'éditeur depuis l'API (`InspectionDetailDTO.teamMembers`).
 * Le LEAD est remis en tête pour un affichage stable.
 */
export const teamFromDTO = (
    members: { employeeId?: number | null; role?: string | null }[] | null | undefined,
): TeamMemberState[] => {
    const out = (members ?? [])
        .filter((m) => m && m.employeeId != null)
        .map((m) => ({
            uid: `m${++memberSeq}`,
            employeeId: String(m.employeeId),
            role: ((m.role as InspectionRoleKey) || 'INSPECTOR') as InspectionRoleKey,
        }));
    return out.sort((a, b) => (a.role === 'LEAD' ? -1 : b.role === 'LEAD' ? 1 : 0));
};

/** Payload serveur : lignes sans employé ignorées (l'IHM tolère les vides). */
export const teamToDTO = (team: TeamMemberState[]) =>
    team
        .filter((m) => m.employeeId)
        .map((m) => ({ employeeId: Number(m.employeeId), role: m.role }));

export function RoleBadge({ role }: { role: InspectionRoleKey }) {
    const { t } = useTranslation('inspection');
    const cfg = INSPECTION_ROLE_CONFIG[role];
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 text-[10.5px] rounded font-medium border whitespace-nowrap ${cfg.chip}`}
        >
            {inspectionRoleLabel(t, role)}
        </span>
    );
}

interface Props {
    value: TeamMemberState[];
    onChange: (next: TeamMemberState[]) => void;
    employees: { value: string; label: string }[];
    loadingEmployees?: boolean;
    /** Masque l'en-tête (l'appelant fournit le sien, ex. une modale). */
    hideHeader?: boolean;
}

export default function InspectionTeamEditor({
    value,
    onChange,
    employees,
    loadingEmployees = false,
    hideHeader = false,
}: Props) {
    const { t } = useTranslation(['inspection', 'common']);
    const roleOptions = useMemo(() => inspectionRoleOptions(t), [t]);
    const employeeLabel = (id: string) => employees.find((e) => e.value === id)?.label ?? '';
    const leadCount = leadCountOf(value);

    /** Le 1er membre est LEAD ; les suivants inspecteurs (un seul chef). */
    const addMember = () =>
        onChange([...value, newTeamMember(value.some((m) => m.role === 'LEAD') ? 'INSPECTOR' : 'LEAD')]);

    const removeMember = (uid: string) => onChange(value.filter((m) => m.uid !== uid));

    const setMemberEmployee = (uid: string, employeeId: string) =>
        onChange(value.map((m) => (m.uid === uid ? { ...m, employeeId } : m)));

    const setMemberRole = (uid: string, role: InspectionRoleKey) =>
        onChange(
            value.map((m) =>
                m.uid === uid
                    ? { ...m, role }
                    : // Un seul LEAD : le précédent redevient inspecteur.
                    role === 'LEAD' && m.role === 'LEAD'
                    ? { ...m, role: 'INSPECTOR' as InspectionRoleKey }
                    : m,
            ),
        );

    /** Un employé ne peut pas tenir deux rôles : on l'exclut des autres lignes. */
    const optionsFor = (uid: string) => {
        const taken = new Set(
            value.filter((m) => m.uid !== uid && m.employeeId).map((m) => m.employeeId),
        );
        return employees.filter((e) => !taken.has(e.value));
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            {!hideHeader && (
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <IconUsers size={15} stroke={1.8} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-slate-800">
                                {t('schedule.detailsStep.teamHeading')}
                            </div>
                            <div className="text-[11px] text-slate-500">
                                {t('schedule.detailsStep.teamSubtitle')}
                            </div>
                        </div>
                    </div>
                    {value.length > 0 && (
                        <span className="text-[11px] text-slate-500 tabular-nums flex-shrink-0">
                            {t('schedule.detailsStep.teamMemberCount', { count: value.length })}
                        </span>
                    )}
                </div>
            )}

            {value.length === 0 ? (
                <p className="text-[12px] text-slate-500 italic py-2">
                    {t('schedule.detailsStep.teamEmpty')}
                </p>
            ) : (
                <div className="space-y-2">
                    {value.map((m) => {
                        const cfg = INSPECTION_ROLE_CONFIG[m.role];
                        const name = employeeLabel(m.employeeId);
                        return (
                            <div
                                key={m.uid}
                                className="rounded-lg border border-slate-200 bg-white p-2.5 flex items-start gap-2.5"
                            >
                                {/* Puce d'avatar à initiales, teintée par le rôle */}
                                <span
                                    className={`w-8 h-8 rounded-full text-white text-[10.5px] font-semibold flex items-center justify-center flex-shrink-0 mt-1 ${
                                        name ? cfg.avatar : 'bg-slate-300'
                                    }`}
                                    aria-hidden="true"
                                >
                                    {name ? initialsOf(name) : '—'}
                                </span>
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="min-w-0">
                                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                            {t('schedule.detailsStep.teamMemberEmployeeLabel')}
                                        </label>
                                        <Select
                                            searchable
                                            data={optionsFor(m.uid)}
                                            value={m.employeeId || null}
                                            onChange={(v) => setMemberEmployee(m.uid, v ?? '')}
                                            disabled={loadingEmployees}
                                            nothingFoundMessage={
                                                loadingEmployees
                                                    ? t('common:loading', { defaultValue: 'Chargement…' })
                                                    : t('schedule.detailsStep.noInspector')
                                            }
                                            placeholder={
                                                loadingEmployees
                                                    ? t('common:loading', { defaultValue: 'Chargement…' })
                                                    : t('schedule.detailsStep.teamMemberEmployeePlaceholder')
                                            }
                                            comboboxProps={{ withinPortal: true }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                            {t('schedule.detailsStep.teamMemberRoleLabel')}
                                        </label>
                                        <Select
                                            data={roleOptions}
                                            value={m.role}
                                            onChange={(v) =>
                                                setMemberRole(m.uid, (v ?? 'INSPECTOR') as InspectionRoleKey)
                                            }
                                            allowDeselect={false}
                                            comboboxProps={{ withinPortal: true }}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center gap-2 flex-wrap">
                                        <RoleBadge role={m.role} />
                                        {name && (
                                            <span className="text-[12px] text-slate-700 font-medium truncate">
                                                {name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMember(m.uid)}
                                    title={t('schedule.detailsStep.teamRemoveMember')}
                                    aria-label={t('schedule.detailsStep.teamRemoveMember')}
                                    className="p-1.5 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition flex-shrink-0 mt-1"
                                >
                                    <IconTrash size={14} stroke={1.8} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Invariant « exactement un LEAD » : signalé AVANT la soumission. */}
            {value.length > 0 && leadCount === 0 && (
                <div className="mt-2 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11.5px]">
                    <IconAlertOctagon size={13} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('schedule.detailsStep.teamNoLead')}</span>
                </div>
            )}

            <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-cyan-300 text-cyan-800 bg-white hover:bg-cyan-50 transition font-medium min-h-[40px]"
                >
                    <IconUserPlus size={14} stroke={1.8} />
                    {t('schedule.detailsStep.teamAddMember')}
                </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
                {value.length > 0
                    ? t('schedule.detailsStep.teamLeadHint')
                    : t('schedule.detailsStep.teamHelp')}
            </p>
        </div>
    );
}
