import React, { useEffect, useMemo, useState } from 'react';
import { Select, Switch, Loader } from '@mantine/core';
import { modals } from '@mantine/modals';
import {
  IconInfoCircle, IconEye, IconEdit, IconTrash, IconShield, IconCircleCheck,
  IconArrowLeft, IconChevronRight, IconUserShield,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getPermissionById, updatePermissionProfile } from '../../../services/PermissionManagementService';
import { getEmployee } from '../../../services/EmployeeService';
import { predefinedRoles } from '../data/roles';

const moduleIdToApiField: Record<string, string> = {
  'non-conformity': 'nonConformity',
  'inspections': 'inspections',
  'meetings': 'meetings',
  'management-tour': 'managementTour',
  'ppe-overview': 'ppeOverview',
  'ppe-monitoring': 'ppeMonitoring',
  'ppe-request': 'ppeRequest',
  'incident-management': 'incidentManagement',
  'investigations': 'investigations',
  'action-plans-inc': 'actionPlansInc',
  'pending-actions': 'pendingActions',
  'action-plan': 'actionPlan',
  'recommendations': 'recommendations',
  'adhoc-actions': 'adhocActions',
  'audit-plan': 'auditPlan',
  'audits': 'audits',
  'audit-recommendations': 'auditRecommendations',
  'compliance-dashboard': 'complianceDashboard',
  'requirements': 'requirements',
  'position-assignments': 'positionAssignments',
  'employee-assignments': 'employeeAssignments',
  'risk-overview': 'riskOverview',
  'risk-register': 'riskRegister',
  'risk-assessment': 'riskAssessment',
  'chemical-register': 'chemicalRegister',
  'documents': 'documents',
  'document-validation': 'documentValidation',
  'lessons-learned': 'lessonsLearned',
  'document-manager': 'documentManager',
  'home': 'home',
  'comm-dashboard': 'commDashboard',
  'employee-comm': 'employeeComm',
  'notifications': 'notifications',
  'users-management': 'usersManagement',
  'settings': 'settings',
};

const roleIdToApiRole = {
  'system-admin': 'SYSTEM_ADMINISTRATOR',
  'health-safety-coordinator': 'HEALTH_SAFETY_COORDINATOR',
  'incident-investigator': 'INCIDENT_INVESTIGATOR',
  'auditor': 'AUDITOR',
  'employee': 'EMPLOYEE',
} as const;

const apiRoleToRoleId = Object.fromEntries(Object.entries(roleIdToApiRole).map(([k, v]) => [v, k])) as Record<string, string>;

const modulesByCategory = {
  'Indicateurs avancés': [
    { id: 'non-conformity', name: 'Non-conformités & presqu\'accidents' },
    { id: 'inspections', name: 'Inspections planifiées' },
    { id: 'meetings', name: 'Gestion des réunions' },
    { id: 'management-tour', name: 'Tournée de direction (TDM)' },
    { id: 'ppe-overview', name: 'Vue d\'ensemble EPI' },
    { id: 'ppe-monitoring', name: 'Suivi des EPI' },
    { id: 'ppe-request', name: 'Demande d\'EPI' }
  ],
  'Indicateurs réactifs': [
    { id: 'incident-management', name: 'Gestion des incidents' },
    { id: 'investigations', name: 'Enquêtes' },
    { id: 'action-plans-inc', name: 'Plans d\'action' },
    { id: 'pending-actions', name: 'Actions en attente' },
    { id: 'action-plan', name: 'Plan d\'action' },
    { id: 'recommendations', name: 'Recommandations' },
    { id: 'adhoc-actions', name: 'Idées d\'amélioration' }
  ],
  'Audits': [
    { id: 'audit-plan', name: 'Plan d\'audit annuel' },
    { id: 'audits', name: 'Audits' },
    { id: 'audit-recommendations', name: 'Recommandations d\'audit' },
    { id: 'compliance-dashboard', name: 'Tableau de bord conformité' },
    { id: 'requirements', name: 'Exigences réglementaires' },
    { id: 'position-assignments', name: 'Affectations par poste' },
    { id: 'employee-assignments', name: 'Affectations par employé' }
  ],
  'Risques & Documents': [
    { id: 'risk-overview', name: 'Vue d\'ensemble des risques' },
    { id: 'risk-register', name: 'Registre des risques' },
    { id: 'risk-assessment', name: 'Évaluation des risques' },
    { id: 'chemical-register', name: 'Registre des produits chimiques' },
    { id: 'documents', name: 'Documents' },
    { id: 'document-validation', name: 'Validation des documents' },
    { id: 'lessons-learned', name: 'Leçons apprises' },
    { id: 'document-manager', name: 'Gestionnaire de documents' }
  ],
  'Autres': [
    { id: 'home', name: 'Accueil' },
    { id: 'comm-dashboard', name: 'Tableau de bord communication' },
    { id: 'employee-comm', name: 'Communications aux employés' },
    { id: 'notifications', name: 'Gestion des notifications' },
    { id: 'users-management', name: 'Gestion des utilisateurs' },
    { id: 'settings', name: 'Paramètres' }
  ]
};

const SERIF = "'Source Serif 4', Georgia, serif";

const EditUserPermission: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profile, setProfile] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isActiveUser, setIsActiveUser] = useState<boolean>(true);
  const [customPermissions, setCustomPermissions] = useState<Record<string, { view: boolean; edit: boolean; delete: boolean }>>({});
  const [activePermissionTab, setActivePermissionTab] = useState<string>('Indicateurs avancés');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPermissionById(Number(id))
      .then(async (p) => {
        setProfile(p);
        setIsActiveUser(p.status === 'ACTIVE');
        setSelectedRoleId(apiRoleToRoleId[p.role] || 'employee');
        setCustomPermissions(fromProfileToPermissions(p));
        try {
          const emp = await getEmployee(p.employeeId);
          setEmployee(emp);
        } catch (_e) {
          setEmployee({ id: p.employeeId });
        }
      })
      .catch((err) => {
        errorNotification(err?.response?.data?.errorMessage || 'Failed to load user permission');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fromBits = (bits?: string) => {
    const b = (bits || '000').padEnd(3, '0');
    const r = b.charAt(0) === '1';
    const w = b.charAt(1) === '1';
    const d = b.charAt(2) === '1';
    return { view: r || w || d, edit: w || d, delete: d };
  };

  const fromProfileToPermissions = (p: any) => {
    const perms: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
    Object.entries(moduleIdToApiField).forEach(([moduleId, apiField]) => {
      perms[moduleId] = fromBits(p?.[apiField]);
    });
    return perms;
  };

  const toBits = (perm?: { view?: boolean; edit?: boolean; delete?: boolean }) => {
    const del = !!perm?.delete;
    const write = !!perm?.edit || del;
    const read = !!perm?.view || write;
    return `${read ? '1' : '0'}${write ? '1' : '0'}${del ? '1' : '0'}`;
  };

  const buildPayload = () => {
    const payload: any = {
      id: profile.id,
      employeeId: profile.employeeId,
      status: isActiveUser ? 'ACTIVE' : 'INACTIVE',
      role: roleIdToApiRole[selectedRoleId as keyof typeof roleIdToApiRole] || 'EMPLOYEE',
    };
    Object.entries(moduleIdToApiField).forEach(([moduleId, apiField]) => {
      payload[apiField] = toBits(customPermissions[moduleId]);
    });
    return payload;
  };

  const handleSave = () => {
    setSaving(true);
    dispatch(showOverlay());
    updatePermissionProfile(buildPayload())
      .then(() => {
        successNotification('Permission updated');
        navigate('/users-management');
      })
      .catch((err) => {
        errorNotification(err?.response?.data?.errorMessage || 'Failed to update');
      })
      .finally(() => {
        setSaving(false);
        dispatch(hideOverlay());
      });
  };

  const handleToggleStatus = () => {
    const next = !isActiveUser;
    setIsActiveUser(next);
  };

  const permissionTabs = useMemo(() => Object.keys(modulesByCategory), []);

  const handlePermissionToggle = (moduleId: string, permissionType: 'view' | 'edit' | 'delete') => {
    setCustomPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permissionType]: !prev[moduleId]?.[permissionType]
      }
    }));
  };

  // ── Initiales pour l'avatar identité ──
  const initials = (employee?.name || '')
    .split(' ')
    .map((p: string) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="min-h-full bg-[#FAF8F3] pb-10">
      {/* ── En-tête blanc premium : retour + fil + titre + identité employé ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-5 lg:px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
          <button
            type="button"
            onClick={() => navigate('/users-management')}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition flex-shrink-0"
            aria-label="Retour à la gestion des utilisateurs"
            title="Retour à la gestion des utilisateurs"
          >
            <IconArrowLeft size={14} stroke={1.8} />
          </button>
          <span className="uppercase tracking-[0.16em] font-medium">Administration</span>
          <IconChevronRight size={10} className="text-slate-400" />
          <span className="uppercase tracking-[0.16em] font-medium">Gestion des utilisateurs</span>
          <IconChevronRight size={10} className="text-slate-400" />
          <span className="uppercase tracking-[0.16em] text-teal-700 font-medium">Modifier le profil</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/40 ring-1 ring-teal-200/70 border-l-[3px] border-l-teal-500 shadow-sm">
              <IconUserShield size={20} stroke={1.8} className="text-teal-700" />
            </div>
            <div>
              <h1
                className="text-slate-900 leading-tight"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 'clamp(18px, 1.8vw, 22px)',
                  letterSpacing: '-0.015em',
                }}
              >
                Modifier le profil
              </h1>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Ajustez le rôle, le statut et les permissions par module de l'utilisateur.
              </p>
            </div>
          </div>

          {/* Identité de l'employé à droite */}
          {!loading && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-700 text-white text-[12px] font-medium flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 text-right sm:text-left">
                <div className="text-[13px] font-medium text-slate-800 truncate">{employee?.name || '—'}</div>
                <div className="text-[11.5px] text-slate-500 truncate">{employee?.email || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="px-4 sm:px-5 lg:px-6 py-5">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4">
            <Loader size="sm" color="teal" /> <span className="text-[13px]">Chargement du profil…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* ── Colonne gauche ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Employé */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 15 }}>
                    Employé
                  </h2>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="text-[11.5px] uppercase tracking-wide text-slate-400 font-medium mb-1">Nom</div>
                    <div className="text-[13px] text-slate-800">{employee?.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11.5px] uppercase tracking-wide text-slate-400 font-medium mb-1">Adresse e-mail</div>
                    <div className="text-[13px] text-slate-800">{employee?.email || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Rôle & statut */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 15 }}>
                    Rôle & statut
                  </h2>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <Select
                    label="Rôle"
                    placeholder="Sélectionner un rôle…"
                    leftSection={<IconShield size={14} />}
                    data={[
                      { value: 'system-admin', label: 'Administrateur système' },
                      { value: 'health-safety-coordinator', label: 'Coordinateur santé & sécurité' },
                      { value: 'incident-investigator', label: 'Enquêteur incidents' },
                      { value: 'auditor', label: 'Auditeur' },
                      { value: 'employee', label: 'Employé' },
                    ]}
                    value={selectedRoleId}
                    onChange={(val) => {
                      const previousRoleId = selectedRoleId;
                      setSelectedRoleId(val);
                      if (val) {
                        const role = predefinedRoles.find((r) => r.id === val);
                        if (role) {
                          // Appliquer le modèle de permissions écrase la matrice personnalisée :
                          // demander confirmation avant d'écraser les permissions par module existantes.
                          modals.openConfirmModal({
                            title: <span className="text-xl">Appliquer le modèle de rôle ?</span>,
                            centered: true,
                            children: (
                              <span className="text-sm">
                                Changer le rôle remplacera les permissions personnalisées actuelles par le modèle du rôle sélectionné. Continuer ?
                              </span>
                            ),
                            labels: { confirm: 'Oui, appliquer', cancel: 'Annuler' },
                            cancelProps: { color: 'red', variant: 'filled' },
                            confirmProps: { color: 'green', variant: 'filled' },
                            closeOnEscape: false,
                            closeOnClickOutside: false,
                            withCloseButton: false,
                            onConfirm: () => {
                              // Apply the default permissions template for the selected role
                              setCustomPermissions({ ...role.permissions });
                            },
                            onCancel: () => {
                              // Conserver la matrice personnalisée : revenir au rôle précédent.
                              setSelectedRoleId(previousRoleId);
                            },
                          });
                        }
                      }
                    }}
                    withAsterisk
                    styles={{ input: { borderColor: '#CBD5E1' } }}
                  />

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
                    <div>
                      <div className="text-[13px] font-medium text-slate-800">Utilisateur actif</div>
                      <div className="text-[11.5px] text-slate-500">Un utilisateur inactif ne peut plus se connecter.</div>
                    </div>
                    <Switch
                      color="teal"
                      size="md"
                      checked={isActiveUser}
                      onChange={handleToggleStatus}
                      aria-label="Utilisateur actif"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions par module */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 15 }}>
                    Permissions par module
                  </h2>
                </div>
                <div className="px-5 py-4">
                  {/* Onglets segmentés */}
                  <div className="inline-flex flex-wrap gap-1 bg-slate-50 p-1 rounded-lg mb-4 border border-slate-200">
                    {permissionTabs.map((tab) => {
                      const active = activePermissionTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActivePermissionTab(tab)}
                          className={`px-3 py-1.5 rounded-md text-[12.5px] transition ${
                            active
                              ? 'bg-white text-teal-700 shadow-sm font-medium'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left py-2.5 px-4 text-[11.5px] uppercase tracking-wide font-medium text-slate-500">Module</th>
                          <th className="text-center py-2.5 px-3 text-[11.5px] uppercase tracking-wide font-medium text-blue-600">Voir / Lire</th>
                          <th className="text-center py-2.5 px-3 text-[11.5px] uppercase tracking-wide font-medium text-orange-600">Modifier / Créer</th>
                          <th className="text-center py-2.5 px-3 text-[11.5px] uppercase tracking-wide font-medium text-red-600">Supprimer</th>
                          <th className="text-center py-2.5 px-3 text-[11.5px] uppercase tracking-wide font-medium text-teal-700">Accès total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modulesByCategory[activePermissionTab as keyof typeof modulesByCategory].map((module) => {
                          const permissions = customPermissions[module.id] || { view: false, edit: false, delete: false };
                          const hasFullAccess = permissions.view && permissions.edit && permissions.delete;

                          return (
                            <tr key={module.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                              <td className="py-2.5 px-4 text-[13px] text-slate-800">{module.name}</td>

                              {/* Voir / Lire */}
                              <td className="py-2.5 px-3">
                                <div className="flex justify-center">
                                  <Switch
                                    size="sm"
                                    color="blue"
                                    checked={permissions.view}
                                    onChange={() => handlePermissionToggle(module.id, 'view')}
                                    aria-label={`Voir / Lire — ${module.name}`}
                                  />
                                </div>
                              </td>

                              {/* Modifier / Créer */}
                              <td className="py-2.5 px-3">
                                <div className="flex justify-center">
                                  <Switch
                                    size="sm"
                                    color="orange"
                                    checked={permissions.edit}
                                    onChange={() => handlePermissionToggle(module.id, 'edit')}
                                    aria-label={`Modifier / Créer — ${module.name}`}
                                  />
                                </div>
                              </td>

                              {/* Supprimer */}
                              <td className="py-2.5 px-3">
                                <div className="flex justify-center">
                                  <Switch
                                    size="sm"
                                    color="red"
                                    checked={permissions.delete}
                                    onChange={() => handlePermissionToggle(module.id, 'delete')}
                                    aria-label={`Supprimer — ${module.name}`}
                                  />
                                </div>
                              </td>

                              {/* Accès total */}
                              <td className="py-2.5 px-3">
                                <div className="flex justify-center">
                                  <Switch
                                    size="sm"
                                    color="teal"
                                    checked={hasFullAccess}
                                    onChange={() => {
                                      const newFullAccess = !hasFullAccess;
                                      setCustomPermissions(prev => ({
                                        ...prev,
                                        [module.id]: { view: newFullAccess, edit: newFullAccess, delete: newFullAccess }
                                      }));
                                    }}
                                    aria-label={`Accès total — ${module.name}`}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/users-management')}
                  className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 text-[13px] font-medium bg-white hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedRoleId}
                  className="px-5 py-2 rounded-lg text-white text-[13px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#0F766E' }}
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>

            {/* ── Colonne droite : Guide des permissions ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:sticky lg:top-6">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <IconInfoCircle size={16} className="text-teal-700" />
                  <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 15 }}>
                    Guide des permissions
                  </h2>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Voir / Lire */}
                  <div className="border-l-[3px] border-blue-500 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <IconEye size={16} className="text-blue-600" />
                      <h3 className="text-[13px] font-medium text-blue-900">Voir / Lire</h3>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Permet de consulter les informations du module. L'utilisateur voit les données, rapports et contenus sans pouvoir les modifier.
                    </p>
                    <div className="mt-2 text-[11.5px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded">
                      <strong>Exemples :</strong> consulter les tableaux de bord, lire les rapports, voir les listes d'utilisateurs.
                    </div>
                  </div>

                  {/* Modifier / Créer */}
                  <div className="border-l-[3px] border-orange-500 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <IconEdit size={16} className="text-orange-600" />
                      <h3 className="text-[13px] font-medium text-orange-900">Modifier / Créer</h3>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Permet de créer de nouveaux enregistrements et de modifier ceux qui existent. Inclut tous les droits de lecture ainsi que la modification des données.
                    </p>
                    <div className="mt-2 text-[11.5px] text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded">
                      <strong>Exemples :</strong> créer des incidents, modifier des évaluations, mettre à jour des profils.
                    </div>
                  </div>

                  {/* Supprimer */}
                  <div className="border-l-[3px] border-red-500 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <IconTrash size={16} className="text-red-600" />
                      <h3 className="text-[13px] font-medium text-red-900">Supprimer</h3>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Permet de retirer définitivement des enregistrements. C'est un droit sensible qui doit être accordé avec prudence.
                    </p>
                    <div className="mt-2 text-[11.5px] text-red-700 bg-red-50 px-2.5 py-1.5 rounded">
                      <strong>Exemples :</strong> supprimer des incidents, retirer des utilisateurs, archiver des documents.
                    </div>
                  </div>

                  {/* Accès total */}
                  <div className="border-l-[3px] border-teal-600 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <IconShield size={16} className="text-teal-700" />
                      <h3 className="text-[13px] font-medium text-teal-900">Accès total</h3>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Accorde le contrôle complet du module : lecture, modification, suppression ainsi que les fonctions d'administration.
                    </p>
                    <div className="mt-2 text-[11.5px] text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded">
                      <strong>Exemples :</strong> configuration du module, gestion des utilisateurs, paramètres système.
                    </div>
                  </div>
                </div>

                {/* Bonnes pratiques */}
                <div className="mx-5 mb-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-[13px] font-medium text-slate-800 mb-2 flex items-center gap-2">
                    <IconCircleCheck size={15} className="text-teal-700" />
                    Bonnes pratiques
                  </h3>
                  <ul className="text-[12px] text-slate-600 space-y-1.5">
                    <li className="flex gap-2"><span className="text-teal-600">•</span> Commencez par des permissions minimales, puis ajoutez selon les besoins.</li>
                    <li className="flex gap-2"><span className="text-teal-600">•</span> Réexaminez les permissions régulièrement.</li>
                    <li className="flex gap-2"><span className="text-teal-600">•</span> Privilégiez les permissions basées sur les rôles lorsque c'est possible.</li>
                    <li className="flex gap-2"><span className="text-teal-600">•</span> Documentez les changements de permissions.</li>
                    <li className="flex gap-2"><span className="text-teal-600">•</span> Testez les permissions avant la mise en production.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserPermission;
