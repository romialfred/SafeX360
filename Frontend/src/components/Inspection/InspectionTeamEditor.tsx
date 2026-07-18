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
 * PRÉSENTATION (refonte 2026-07-18) — l'éditeur empilait une CARTE par membre,
 * chacune répétant sous ses deux listes déroulantes un badge de rôle et un nom
 * déjà lisibles juste au-dessus. Trois membres suffisaient à remplir l'écran de
 * redites. Il s'agit d'un TABLEAU : quatre membres = quatre lignes comparables
 * colonne par colonne, sans aucune information affichée deux fois.
 *
 * L'en-tête de colonnes n'est rendu qu'à partir du 1er membre : une table vide
 * n'a pas de colonnes à annoncer. Sur écran étroit c'est le défilement
 * horizontal qui prend le relais — les libellés restent donc portés par le seul
 * en-tête, jamais répétés dans les cellules.
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

/**
 * Puce d'avatar à initiales, teintée par le RÔLE (et non par l'employé) :
 * la couleur porte donc une information — qui dirige, qui observe — plutôt
 * qu'une simple décoration. Grise tant qu'aucun employé n'est choisi.
 */
export function MemberAvatar({
    name,
    role,
    size = 30,
}: {
    name: string;
    role: InspectionRoleKey;
    size?: number;
}) {
    const cfg = INSPECTION_ROLE_CONFIG[role];
    return (
        <span
            className={`rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 ${
                name ? cfg.avatar : 'bg-slate-300'
            }`}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
            aria-hidden="true"
        >
            {name ? initialsOf(name) : '—'}
        </span>
    );
}

interface Props {
    value: TeamMemberState[];
    onChange: (next: TeamMemberState[]) => void;
    employees: { value: string; label: string }[];
    loadingEmployees?: boolean;
    /** Masque l'en-tête (l'appelant fournit le sien, ex. un panneau d'édition). */
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

    const employeePlaceholder = loadingEmployees
        ? t('common:loading', { defaultValue: 'Chargement…' })
        : t('schedule.detailsStep.teamMemberEmployeePlaceholder');

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {!hideHeader && (
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 flex-wrap">
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
                <p className="text-[12.5px] text-slate-500 italic px-4 py-5 text-center">
                    {t('schedule.detailsStep.teamEmpty')}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                        {/* Les libellés vivent UNIQUEMENT dans cet en-tête : sur écran
                            étroit, c'est le défilement horizontal du conteneur qui
                            prend le relais. Un tableau ne se replie pas en blocs —
                            répéter le libellé dans chaque cellule n'aurait donc rien
                            corrigé et aurait doublé le texte à toutes les largeurs. */}
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-slate-600">
                                <th className="text-left px-3 py-2 font-medium w-[46%]">
                                    {t('schedule.detailsStep.teamMemberEmployeeLabel')}
                                </th>
                                <th className="text-left px-3 py-2 font-medium">
                                    {t('schedule.detailsStep.teamMemberRoleLabel')}
                                </th>
                                <th className="w-10" aria-label={t('schedule.detailsStep.teamRemoveMember')} />
                            </tr>
                        </thead>
                        <tbody>
                            {value.map((m) => {
                                const name = employeeLabel(m.employeeId);
                                return (
                                    <tr
                                        key={m.uid}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                    >
                                        <td className="px-3 py-2 align-middle">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <MemberAvatar name={name} role={m.role} />
                                                <div className="flex-1 min-w-[150px]">
                                                    <Select
                                                        searchable
                                                        size="sm"
                                                        data={optionsFor(m.uid)}
                                                        value={m.employeeId || null}
                                                        onChange={(v) => setMemberEmployee(m.uid, v ?? '')}
                                                        disabled={loadingEmployees}
                                                        nothingFoundMessage={
                                                            loadingEmployees
                                                                ? t('common:loading', { defaultValue: 'Chargement…' })
                                                                : t('schedule.detailsStep.noInspector')
                                                        }
                                                        placeholder={employeePlaceholder}
                                                        comboboxProps={{ withinPortal: true }}
                                                        aria-label={t('schedule.detailsStep.teamMemberEmployeeLabel')}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 align-middle min-w-[150px]">
                                            <Select
                                                size="sm"
                                                data={roleOptions}
                                                value={m.role}
                                                onChange={(v) =>
                                                    setMemberRole(m.uid, (v ?? 'INSPECTOR') as InspectionRoleKey)
                                                }
                                                allowDeselect={false}
                                                comboboxProps={{ withinPortal: true }}
                                                aria-label={t('schedule.detailsStep.teamMemberRoleLabel')}
                                            />
                                        </td>
                                        <td className="px-2 py-2 align-middle text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeMember(m.uid)}
                                                title={t('schedule.detailsStep.teamRemoveMember')}
                                                aria-label={t('schedule.detailsStep.teamRemoveMember')}
                                                className="p-1.5 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition"
                                            >
                                                <IconTrash size={15} stroke={1.8} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                {/* Invariant « exactement un LEAD » : signalé AVANT la soumission. */}
                {value.length > 0 && leadCount === 0 && (
                    <div className="mb-2.5 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11.5px]">
                        <IconAlertOctagon size={13} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{t('schedule.detailsStep.teamNoLead')}</span>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={addMember}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-cyan-300 text-cyan-800 bg-white hover:bg-cyan-50 transition font-medium min-h-[38px]"
                    >
                        <IconUserPlus size={14} stroke={1.8} />
                        {t('schedule.detailsStep.teamAddMember')}
                    </button>

                    <p className="text-[11px] text-slate-500 flex-1 min-w-[200px] leading-snug">
                        {value.length > 0
                            ? t('schedule.detailsStep.teamLeadHint')
                            : t('schedule.detailsStep.teamHelp')}
                    </p>
                </div>
            </div>
        </div>
    );
}
