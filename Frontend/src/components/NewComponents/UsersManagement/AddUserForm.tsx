import React, { useState, useEffect } from 'react';
import {
    IconUser,
    IconMail,
    IconBuilding,
    IconShield,
    IconEye,
    IconEdit,
    IconTrash,
    IconInfoCircle,
    IconCircleCheck,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { predefinedRoles } from '../data/roles';
import { Breadcrumbs, Select, Text, Loader } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { getEmployeeDropdownWithEmail, getEmployee } from '../../../services/EmployeeService';
import { createPermissionProfile, getRegisteredEmployeeIds } from '../../../services/PermissionManagementService';
import { mapIdToName } from '../../../utility/OtherUtilities';

interface AddUserFormProps {
    onBackToUsers: () => void;
    onCreateUser: (userData: Partial<any>) => void;
}

interface HRMSEmployee {
    id: number | string;
    employeeNumber?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    empNumber?: string;
    email?: string;
    department?: string;
    position?: string;
    manager?: string;
    location?: string;
    hireDate?: string;
    contractType?: string;
    workSchedule?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

// All available modules for permissions matrix
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

const AddUserForm: React.FC<AddUserFormProps> = ({ onBackToUsers, onCreateUser }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<HRMSEmployee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<HRMSEmployee | null>(null);
    const [selectedRole, setSelectedRole] = useState<any | null>(null);
    const [isActiveUser, setIsActiveUser] = useState(true);
    const [customPermissions, setCustomPermissions] = useState<{ [key: string]: any }>({});
    const [activePermissionTab, setActivePermissionTab] = useState<string>('Leading');
    const [loadingEmployee, setLoadingEmployee] = useState<boolean>(false);
    const [empMap, setEmpMap] = useState<any>({});
    // Map UI module ids to API fields
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

    // Role mapping from UI role id to API enum
    const roleIdToApiRole: Record<string, 'SYSTEM_ADMINISTRATOR' | 'HEALTH_SAFETY_COORDINATOR' | 'INCIDENT_INVESTIGATOR' | 'AUDITOR' | 'EMPLOYEE'> = {
        'system-admin': 'SYSTEM_ADMINISTRATOR',
        'health-safety-coordinator': 'HEALTH_SAFETY_COORDINATOR',
        'incident-investigator': 'INCIDENT_INVESTIGATOR',
        'auditor': 'AUDITOR',
        'employee': 'EMPLOYEE',
    };

    // Load employees for dropdown (with email) and exclude already registered
    useEffect(() => {
        Promise.all([getEmployeeDropdownWithEmail(), getRegisteredEmployeeIds()])
            .then(([data, registeredIds]) => {
                const regSet = new Set((registeredIds || []).map((x: any) => Number(x)));
                const filtered = (data || []).filter((e: any) => !regSet.has(Number(e.id)));
                setEmployees(filtered);
                setEmpMap(mapIdToName(filtered));
            })
            .catch((_err) => {
                // Fallback: show all employees if registered list fails
                getEmployeeDropdownWithEmail()
                    .then((data) => {
                        setEmployees(data);
                        setEmpMap(mapIdToName(data));
                    })
                    .catch(() => { /* silent */ });
            });
    }, []);

    // Initialize custom permissions when role changes
    useEffect(() => {
        if (selectedRole) {
            setCustomPermissions({ ...selectedRole.permissions });
        }
    }, [selectedRole]);

    const handleEmployeeSelect = (employeeId: string) => {
        if (!employeeId) {
            setSelectedEmployeeId(null);
            setSelectedEmployee(null);
            return;
        }
        const idNum = Number(employeeId);
        setSelectedEmployeeId(idNum);
        setSelectedEmployee(null);
        setLoadingEmployee(true);
        // Fetch enriched employee details (email, position, etc.)
        getEmployee(employeeId)
            .then((emp) => setSelectedEmployee(emp))
            .catch((_err) => {
                // Fallback to minimal info from dropdown list
                const fallback = employees.find((e) => Number(e.id) === idNum) || null;
                setSelectedEmployee(fallback);
            })
            .finally(() => setLoadingEmployee(false));
    };

    const handleRoleSelect = (roleId: string) => {
        const role = predefinedRoles.find(r => r.id === roleId);
        setSelectedRole(role || null);
    };

    const handlePermissionToggle = (moduleId: string, permissionType: 'view' | 'edit' | 'delete') => {
        setCustomPermissions(prev => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                [permissionType]: !prev[moduleId]?.[permissionType]
            }
        }));
    };

    const toBits = (perm: { view?: boolean; edit?: boolean; delete?: boolean } | undefined) => {
        const p = perm || { view: false, edit: false, delete: false };
        // Enforce rules: delete => edit => view
        const del = !!p.delete;
        const write = !!p.edit || del;
        const read = !!p.view || write;
        const r = read ? '1' : '0';
        const w = write ? '1' : '0';
        const d = del ? '1' : '0';
        return `${r}${w}${d}`;
    };

    const buildPermissionsPayload = () => {
        const payload: Record<string, string> = {};
        // Iterate every module id we know and populate API fields
        Object.entries(moduleIdToApiField).forEach(([moduleId, apiField]) => {
            payload[apiField] = toBits(customPermissions[moduleId]);
        });
        return payload;
    };

    const handleCreateUser = () => {
        if (!selectedEmployeeId || !selectedRole) return;

        const payload: any = {
            employeeId: selectedEmployeeId,
            status: isActiveUser ? 'ACTIVE' : 'INACTIVE',
            role: roleIdToApiRole[selectedRole.id as keyof typeof roleIdToApiRole] || 'EMPLOYEE',
            ...buildPermissionsPayload(),
        };

        dispatch(showOverlay());
        createPermissionProfile(payload)
            .then((res) => {
                successNotification('User permission profile created');
                try { onCreateUser(res); } catch { /* optional */ }
                onBackToUsers();
                navigate('/users-management');
            })
            .catch((err) => {
                errorNotification(err?.response?.data?.errorMessage || 'Failed to create permission profile');
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    // const getPermissionColor = (hasPermission: boolean, type: 'view' | 'edit' | 'delete') => {
    //     if (!hasPermission) return 'bg-gray-200';

    //     switch (type) {
    //         case 'view': return 'bg-blue-500';
    //         case 'edit': return 'bg-orange-500';
    //         case 'delete': return 'bg-red-500';
    //         default: return 'bg-gray-500';
    //     }
    // };

    return (
        <div className="flex flex-col gap-8 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Create User</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/users-management" ><Text variant="gradient" className="hover:!underline cursor-pointer">Users Management</Text></Link>
                        <Text variant="gradient">Create User</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <div>

                {/* Content */}
                <div className="bg-white shadow-sm border border-gray-300 p-6 rounded-xl">
                    <p className="text-gray-600 text-lg mb-4">Manage user accounts, roles, and permissions</p>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Main Form - 3 columns */}
                        <div className="lg:col-span-3 space-y-8">



                            {/* Employee Selection */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Select Employee from HRMS *
                                    </label>
                                    <Select
                                        onChange={(value) => handleEmployeeSelect(value ?? '')}
                                        searchable
                                        defaultValue=""
                                        data={employees.map((employee: any) => ({
                                            value: "" + employee.id,
                                            label: (employee.empNumber || employee.employeeNumber || employee.id) + ' - ' + (employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim())
                                        }))}
                                    />
                                </div>

                                {/* Selected Employee Details */}
                                {loadingEmployee && (
                                    <div className="mt-6">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Loader size="sm" />
                                            <span>Loading employee details...</span>
                                        </div>
                                    </div>
                                )}
                                {!loadingEmployee && selectedEmployee && (
                                    <div className="mt-6">
                                        <h3 className="text-lg text-gray-900 mb-4">Selected Employee Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <IconUser className="w-4 h-4 text-gray-400 mr-3" />
                                                    <div>
                                                        <span className="text-sm text-gray-500">Employee Number:</span>
                                                        <span className="ml-2 text-gray-900">{empMap["" + selectedEmployee.id]?.empNumber || selectedEmployee.id}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <IconMail className="w-4 h-4 text-gray-400 mr-3" />
                                                    <div>
                                                        <span className="text-sm text-gray-500">Email:</span>
                                                        <span className="ml-2 text-gray-900">{selectedEmployee.email}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <IconBuilding className="w-4 h-4 text-gray-400 mr-3" />
                                                    <div>
                                                        <span className="text-sm text-gray-500">Position:</span>
                                                        <span className="ml-2 text-gray-900">{selectedEmployee.position}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-500">Full Name:</span>
                                                    <span className="ml-2 text-gray-900">{selectedEmployee.name || `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim()}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-500">Department:</span>
                                                    <span className="ml-2 text-gray-900">{selectedEmployee.department}</span>
                                                </div>
                                                {/* <div className="flex items-center">
                                                    <span className="text-sm text-gray-500">Manager:</span>
                                                    <span className="ml-2 text-gray-900">{selectedEmployee.manager}</span>
                                                </div> */}
                                                <div className="mt-4 flex items-center">
                                                    <span className="text-sm text-gray-500">Status:</span>
                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${(selectedEmployee.status || (isActiveUser ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {selectedEmployee.status || (isActiveUser ? 'ACTIVE' : 'INACTIVE')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>

                            {/* Role Selection */}
                            {selectedEmployee && (
                                <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6">
                                    <div className="mb-4">
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Role *
                                        </label>
                                        <Select
                                            placeholder="Select a role..."
                                            data={[
                                                { value: 'system-admin', label: 'System Administrator' },
                                                { value: 'health-safety-coordinator', label: 'Health & Safety Coordinator' },
                                                { value: 'incident-investigator', label: 'Incident Investigator' },
                                                { value: 'auditor', label: 'Auditor' },
                                                { value: 'employee', label: 'Employee' },
                                            ]}
                                            value={selectedRole?.id || null}
                                            onChange={(val) => handleRoleSelect(val || '')}
                                            withAsterisk
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="activeUser"
                                            checked={isActiveUser}
                                            onChange={(e) => setIsActiveUser(e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="activeUser" className="text-sm text-gray-700">
                                            Active user
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Custom Permissions Matrix */}
                            {selectedRole && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg text-gray-900 mb-6">Custom Permissions</h3>

                                    {/* Permission Tabs */}
                                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                                        {Object.keys(modulesByCategory).map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => setActivePermissionTab(category)}
                                                className={`px-4 py-2 rounded-md transition-colors text-sm ${activePermissionTab === category
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-gray-900">Module</th>
                                                    <th className="text-center py-3 px-4 text-blue-600">View/Read</th>
                                                    <th className="text-center py-3 px-4 text-orange-600">Edit/Create</th>
                                                    <th className="text-center py-3 px-4 text-red-600">Delete</th>
                                                    <th className="text-center py-3 px-4 text-green-600">Full Access</th>
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
                                                                    className={`w-8 h-4 rounded-full transition-colors ${permissions.view ? 'bg-blue-500' : 'bg-gray-300'
                                                                        } relative`}
                                                                >
                                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${permissions.view ? 'translate-x-4' : 'translate-x-0.5'
                                                                        }`} />
                                                                </button>
                                                            </td>

                                                            {/* Edit/Create Toggle */}
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    onClick={() => handlePermissionToggle(module.id, 'edit')}
                                                                    className={`w-8 h-4 rounded-full transition-colors ${permissions.edit ? 'bg-orange-500' : 'bg-gray-300'
                                                                        } relative`}
                                                                >
                                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${permissions.edit ? 'translate-x-4' : 'translate-x-0.5'
                                                                        }`} />
                                                                </button>
                                                            </td>

                                                            {/* Delete Toggle */}
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    onClick={() => handlePermissionToggle(module.id, 'delete')}
                                                                    className={`w-8 h-4 rounded-full transition-colors ${permissions.delete ? 'bg-red-500' : 'bg-gray-300'
                                                                        } relative`}
                                                                >
                                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${permissions.delete ? 'translate-x-4' : 'translate-x-0.5'
                                                                        }`} />
                                                                </button>
                                                            </td>

                                                            {/* Full Access Toggle */}
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    onClick={() => {
                                                                        const newFullAccess = !hasFullAccess;
                                                                        setCustomPermissions(prev => ({
                                                                            ...prev,
                                                                            [module.id]: {
                                                                                view: newFullAccess,
                                                                                edit: newFullAccess,
                                                                                delete: newFullAccess
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className={`w-8 h-4 rounded-full transition-colors ${hasFullAccess ? 'bg-green-500' : 'bg-gray-300'
                                                                        } relative`}
                                                                >
                                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${hasFullAccess ? 'translate-x-4' : 'translate-x-0.5'
                                                                        }`} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Permission Rules */}
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start">
                                            <IconAlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                                            <div>
                                                <h4 className="text-blue-900 mb-2">Permission Rules</h4>
                                                <ul className="text-sm text-blue-800">
                                                    <li>• View permission is required for Edit and Delete</li>
                                                    <li>• Edit permission includes View permission</li>
                                                    <li>• Delete permission requires both View and Edit permissions</li>
                                                    <li>• Full Access grants all permissions for the module</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => { try { onBackToUsers(); } catch { /* noop */ } navigate('/users-management'); }}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={!selectedEmployee || !selectedRole}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create User
                                </button>
                            </div>
                        </div>

                        {/* Right Panel - Permissions Guide - 1 column */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
                                <div className="flex items-center mb-6">
                                    <IconInfoCircle className="w-6 h-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg text-gray-900">Permissions Guide</h3>
                                </div>

                                <div className="space-y-6">
                                    {/* View/Read Permission */}
                                    <div className="border-l-4 border-blue-500 pl-4">
                                        <div className="flex items-center mb-2">
                                            <IconEye className="w-5 h-5 text-blue-600 mr-2" />
                                            <h4 className="text-blue-900">View/Read</h4>
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
                                            <h4 className="text-orange-900">Edit/Create</h4>
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
                                            <h4 className="text-red-900">Delete</h4>
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
                                            <h4 className="text-green-900">Full Access</h4>
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
                                    <h4 className="text-gray-900 mb-3 flex items-center">
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
                </div>
            </div>


        </div>
    );
};

export default AddUserForm
