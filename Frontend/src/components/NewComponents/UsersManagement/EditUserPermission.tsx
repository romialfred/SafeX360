import React, { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs, Select, Text, Loader } from '@mantine/core';
import { IconInfoCircle, IconEye, IconEdit, IconTrash, IconShield, IconCircleCheck } from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  'Leading': [
    { id: 'non-conformity', name: 'Non-Conformity & Near Miss' },
    { id: 'inspections', name: 'Planned General Inspections' },
    { id: 'meetings', name: 'Meeting Managers' },
    { id: 'management-tour', name: 'Leadership Walk (TDM)' },
    { id: 'ppe-overview', name: 'PPE Overview' },
    { id: 'ppe-monitoring', name: 'PPE Monitoring' },
    { id: 'ppe-request', name: 'PPE Request' }
  ],
  'Lagging': [
    { id: 'incident-management', name: 'Incidents Management' },
    { id: 'investigations', name: 'Investigations' },
    { id: 'action-plans-inc', name: 'Action Plans' },
    { id: 'pending-actions', name: 'Pending Actions' },
    { id: 'action-plan', name: 'Action Plan' },
    { id: 'recommendations', name: 'Recommendations' },
    { id: 'adhoc-actions', name: 'Improvement Ideas' }
  ],
  'Audit': [
    { id: 'audit-plan', name: 'Annual audit plan' },
    { id: 'audits', name: 'Audits' },
    { id: 'audit-recommendations', name: 'Audit Recommendations' },
    { id: 'compliance-dashboard', name: 'Compliance Dashboard' },
    { id: 'requirements', name: 'Requirements' },
    { id: 'position-assignments', name: 'Positions Assignments' },
    { id: 'employee-assignments', name: 'Employee Assignments' }
  ],
  'Risk & Document': [
    { id: 'risk-overview', name: 'Risk Overview' },
    { id: 'risk-register', name: 'Risk Register' },
    { id: 'risk-assessment', name: 'Risk Assessment' },
    { id: 'chemical-register', name: 'Chemical Register' },
    { id: 'documents', name: 'Documents' },
    { id: 'document-validation', name: 'Document Validation' },
    { id: 'lessons-learned', name: 'Lesson Learned' },
    { id: 'document-manager', name: 'Document Manager' }
  ],
  'Autres': [
    { id: 'home', name: 'Home' },
    { id: 'comm-dashboard', name: 'Communication Dashboard' },
    { id: 'employee-comm', name: 'Employee Communications' },
    { id: 'notifications', name: 'Notification Managers' },
    { id: 'users-management', name: 'Users Management' },
    { id: 'settings', name: 'Settings' }
  ]
};

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
  const [activePermissionTab, setActivePermissionTab] = useState<string>('Leading');

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

  return (
    <div className="flex flex-col gap-8 p-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Edit User</div>
          <Breadcrumbs mt="xs">
            <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>
            <Link className="hover:!underline" to="/users-management"><Text variant="gradient">Users Management</Text></Link>
            <Text variant="gradient">Edit</Text>
          </Breadcrumbs>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-300 p-6 rounded-xl">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-700"><Loader size="sm" /> <span>Loading...</span></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              {/* Employee details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium text-gray-900">{employee?.name || '-'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{employee?.email || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Role and status */}
              <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <Select
                    placeholder="Select a role..."
                    data={[
                      { value: 'system-admin', label: 'System Administrator' },
                      { value: 'health-safety-coordinator', label: 'Health & Safety Coordinator' },
                      { value: 'incident-investigator', label: 'Incident Investigator' },
                      { value: 'auditor', label: 'Auditor' },
                      { value: 'employee', label: 'Employee' },
                    ]}
                    value={selectedRoleId}
                    onChange={(val) => {
                      setSelectedRoleId(val);
                      if (val) {
                        const role = predefinedRoles.find((r) => r.id === val);
                        if (role) {
                          // Apply the default permissions template for the selected role
                          setCustomPermissions({ ...role.permissions });
                        }
                      }
                    }}
                    withAsterisk
                  />
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="activeUser" checked={isActiveUser} onChange={handleToggleStatus} className="mr-2" />
                  <label htmlFor="activeUser" className="text-sm text-gray-700">Active user</label>
                </div>
              </div>

              {/* Permissions matrix */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Permissions</h3>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                  {permissionTabs.map((tab) => (
                    <button key={tab} onClick={() => setActivePermissionTab(tab)} className={`px-4 py-2 rounded-md font-medium text-sm ${activePermissionTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Module</th>
                        <th className="text-center py-3 px-4 font-medium text-blue-600">View/Read</th>
                        <th className="text-center py-3 px-4 font-medium text-orange-600">Edit/Create</th>
                        <th className="text-center py-3 px-4 font-medium text-red-600">Delete</th>
                        <th className="text-center py-3 px-4 font-medium text-green-600">Full Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modulesByCategory[activePermissionTab as keyof typeof modulesByCategory].map((module) => {
                        const permissions = customPermissions[module.id] || { view: false, edit: false, delete: false };
                        const hasFullAccess = permissions.view && permissions.edit && permissions.delete;

                        return (
                          <tr key={module.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{module.name}</td>

                            {/* View/Read Toggle */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handlePermissionToggle(module.id, 'view')}
                                className={`w-8 h-4 rounded-full transition-colors ${permissions.view ? 'bg-blue-500' : 'bg-gray-300'} relative`}
                              >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${permissions.view ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                            </td>

                            {/* Edit/Create Toggle */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handlePermissionToggle(module.id, 'edit')}
                                className={`w-8 h-4 rounded-full transition-colors ${permissions.edit ? 'bg-orange-500' : 'bg-gray-300'} relative`}
                              >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${permissions.edit ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                            </td>

                            {/* Delete Toggle */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handlePermissionToggle(module.id, 'delete')}
                                className={`w-8 h-4 rounded-full transition-colors ${permissions.delete ? 'bg-red-500' : 'bg-gray-300'} relative`}
                              >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${permissions.delete ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                            </td>

                            {/* Full Access Toggle */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  const newFullAccess = !hasFullAccess;
                                  setCustomPermissions(prev => ({
                                    ...prev,
                                    [module.id]: { view: newFullAccess, edit: newFullAccess, delete: newFullAccess }
                                  }));
                                }}
                                className={`w-8 h-4 rounded-full transition-colors ${hasFullAccess ? 'bg-green-500' : 'bg-gray-300'} relative`}
                              >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${hasFullAccess ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button onClick={() => navigate('/users-management')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving || !selectedRoleId} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Changes</button>
              </div>
            </div>
            {/* Right Panel - Permissions Guide - 1 column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
                <div className="flex items-center mb-6">
                  <IconInfoCircle className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Permissions Guide</h3>
                </div>

                <div className="space-y-6">
                  {/* View/Read Permission */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center mb-2">
                      <IconEye className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="font-semibold text-blue-900">View/Read</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Allows users to view and read information in the module. Users can see data, reports, and content but cannot make changes.
                    </p>
                    <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      <strong>Examples:</strong> View dashboards, read reports, see user lists
                    </div>
                  </div>

                  {/* Edit/Create Permission */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <div className="flex items-center mb-2">
                      <IconEdit className="w-5 h-5 text-orange-600 mr-2" />
                      <h4 className="font-semibold text-orange-900">Edit/Create</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Allows users to create new records and edit existing ones. Includes all View permissions plus the ability to modify data.
                    </p>
                    <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                      <strong>Examples:</strong> Create incidents, edit assessments, update user profiles
                    </div>
                  </div>

                  {/* Delete Permission */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center mb-2">
                      <IconTrash className="w-5 h-5 text-red-600 mr-2" />
                      <h4 className="font-semibold text-red-900">Delete</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Allows users to permanently remove records. This is a high-level permission that should be granted carefully.
                    </p>
                    <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                      <strong>Examples:</strong> Delete incidents, remove users, archive documents
                    </div>
                  </div>

                  {/* Full Access Permission */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                      <IconShield className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-900">Full Access</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Grants complete control over the module. Includes View, Edit, and Delete permissions plus administrative functions.
                    </p>
                    <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                      <strong>Examples:</strong> Module configuration, user management, system settings
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <IconCircleCheck className="w-4 h-4 text-green-600 mr-2" />
                    Best Practices
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-2">
                    <li>• Start with minimal permissions and add as needed</li>
                    <li>• Review permissions regularly</li>
                    <li>• Use role-based permissions when possible</li>
                    <li>• Document permission changes</li>
                    <li>• Test permissions before going live</li>
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
