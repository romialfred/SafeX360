import React, { useEffect, useState } from 'react';
import {
    IconUsers, // Users
    IconPlus, // Plus
    IconSearch, // Search
    IconEdit, // Edit
    IconTrash, // Trash2
    IconEye, // Eye
    IconShield, // Shield
    IconUserCheck, // UserCheck
    IconUserX, // UserX
    IconCheck, // Check
    IconX, // X
    IconAlertTriangle, // AlertTriangle
    IconToggleLeft, // ToggleLeft
    IconToggleRight, // ToggleRight
    IconActivity, // Activity
    IconClock, // Clock
    IconDeviceDesktop, // Monitor
    IconGlobe, // Globe
    IconPointer, // MousePointer
    IconMapPin, // MapPin
    IconArrowLeft, // ArrowLeft
} from '@tabler/icons-react';
import { predefinedRoles } from '../data/roles';
import { useNavigate } from 'react-router-dom';
import { getAllPermissions, updatePermissionStatus } from '../../../services/PermissionManagementService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';




const UsersManagement = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'online' | 'tracking'>('users');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [showUserTrackingModal, setShowUserTrackingModal] = useState(false);
    const [selectedUserForTracking, setSelectedUserForTracking] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [searchEmployee, setSearchEmployee] = useState('');
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [newUser, setNewUser] = useState({
        employeeId: '',
        roleId: '',
        isActive: true
    });
    const [customPermissions, setCustomPermissions] = useState<any>({});
    const [userActivities] = useState<any[]>([]);
    const [userSessions] = useState<any[]>([]);
    const [, setEmpMap] = useState<Record<string, any>>({});
    const [, setLoading] = useState<boolean>(false);
    console.log("ehll ");
    useEffect(() => {
        setLoading(true);
        Promise.all([getAllPermissions(), getEmployeesWithDepartment()])
            .then(([profiles, employees]) => {
                console.log(employees);
                const eMap = mapIdToName(employees || []);
                setEmpMap(eMap);
                const mapped = (profiles || []).map((p: any) => {
                    const emp = eMap[Number(p.employeeId)] || {};
                    const fullName: string = emp.name || '';
                    const [firstName, ...rest] = (fullName || '').split(' ');
                    const lastName = rest.join(' ');
                    return {
                        id: p.id,
                        permissionId: p.id,
                        employeeId: p.employeeId,
                        firstName: firstName || fullName || '-',
                        lastName: lastName || '',
                        email: emp.email || '-',
                        role: { id: p.role, name: humanizeRole(p.role) },
                        isActive: p.status === 'ACTIVE',
                        createdAt: p.createdAt,
                        department: emp.department || '-',
                        position: emp.position || '-',
                    };
                });
                setUsers(mapped);
            })
            .catch((err) => {
                errorNotification(err?.response?.data?.errorMessage || 'Failed to load users');
            })
            .finally(() => setLoading(false));
    }, []);

    function humanizeRole(role: string) {
        switch (role) {
            case 'SYSTEM_ADMINISTRATOR': return 'System Administrator';
            case 'HEALTH_SAFETY_COORDINATOR': return 'Health & Safety Coordinator';
            case 'INCIDENT_INVESTIGATOR': return 'Incident Investigator';
            case 'AUDITOR': return 'Auditor';
            case 'EMPLOYEE': return 'Employee';
            default: return role;
        }
    }

    const menuItems = [
        { id: 'home', name: 'Home' },
        { id: 'non-conformity', name: 'Non-Conformity & Near Miss' },
        { id: 'inspections', name: 'Planned General Inspections' },
        { id: 'meetings', name: 'Meeting Managers' },
        { id: 'management-tour', name: 'Leadership Walk (TDM)' },
        { id: 'incident-management', name: 'Incidents Management' },
        { id: 'investigations', name: 'Investigations' },
        { id: 'action-plans-inc', name: 'Action Plans' },
        { id: 'pending-actions', name: 'Pending Actions' },
        { id: 'action-plan', name: 'Action Plan' },
        { id: 'recommendations', name: 'Recommendations' },
        { id: 'adhoc-actions', name: 'Improvement Ideas' },
        { id: 'risk-overview', name: 'Risk Overview' },
        { id: 'risk-register', name: 'Risk Register' },
        { id: 'risk-assessment', name: 'Risk Assessment' },
        { id: 'chemical-register', name: 'Chemical Register' },
        { id: 'ppe-overview', name: 'PPE Overview' },
        { id: 'ppe-monitoring', name: 'PPE Monitoring' },
        { id: 'ppe-request', name: 'PPE Request' },
        { id: 'audit-plan', name: 'Annual audit plan' },
        { id: 'audits', name: 'Audits' },
        { id: 'audit-recommendations', name: 'Audit Recommendations' },
        { id: 'compliance-dashboard', name: 'Compliance Dashboard' },
        { id: 'requirements', name: 'Requirements' },
        { id: 'position-assignments', name: 'Positions Assignments' },
        { id: 'employee-assignments', name: 'Employee Assignments' },
        { id: 'documents', name: 'Documents' },
        { id: 'document-validation', name: 'Document Validation' },
        { id: 'lessons-learned', name: 'Lesson Learned' },
        { id: 'document-manager', name: 'Document Manager' },
        { id: 'comm-dashboard', name: 'Communication Dashboard' },
        { id: 'employee-comm', name: 'Employee Communications' },
        { id: 'notifications', name: 'Notification Managers' },
        { id: 'users-management', name: 'Users Management' },
        { id: 'settings', name: 'Settings' }
    ];

    const permissionTypes = [
        { id: 'view', label: 'View/Read', color: 'blue' },
        { id: 'edit', label: 'Edit/Create', color: 'yellow' },
        { id: 'delete', label: 'Delete', color: 'red' },
        { id: 'full', label: 'Full Access', color: 'green' }
    ];

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role.id === filterRole;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.isActive) ||
            (filterStatus === 'inactive' && !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const onlineUsers = users.filter(user => user.isOnline);
    const activeSessions = userSessions.filter(session => session.isActive);

    const handleViewUserTracking = (userId: string) => {
        setSelectedUserForTracking(userId);
        setShowUserTrackingModal(true);
    };

    const getUserActivities = (userId: string) => {
        return userActivities.filter(activity => activity.userId === userId);
    };

    const getUserSessions = (userId: string) => {
        return userSessions.filter(session => session.userId === userId);
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getActionIcon = (action: string) => {
        if (action.includes('Login')) return <IconGlobe className="w-4 h-4 text-green-500" />;
        if (action.includes('Page Visit')) return <IconPointer className="w-4 h-4 text-blue-500" />;
        if (action.includes('Incident')) return <IconAlertTriangle className="w-4 h-4 text-red-500" />;
        if (action.includes('Audit')) return <IconShield className="w-4 h-4 text-purple-500" />;
        if (action.includes('Risk')) return <IconAlertTriangle className="w-4 h-4 text-orange-500" />;
        if (action.includes('Document')) return <IconEye className="w-4 h-4 text-indigo-500" />;
        return <IconActivity className="w-4 h-4 text-gray-500" />;
    };

    const handleToggleUserStatus = (permissionId: any) => {
        const target = users.find(u => u.permissionId === permissionId);
        if (!target) return;
        const nextActive = !target.isActive;
        const status = nextActive ? 'ACTIVE' : 'INACTIVE';
        dispatch(showOverlay());
        updatePermissionStatus(Number(permissionId), status as any)
            .then(() => {
                setUsers(prev => prev.map(u => u.permissionId === permissionId ? { ...u, isActive: nextActive } : u));
                successNotification('Status updated');
            })
            .catch(err => {
                errorNotification(err?.response?.data?.errorMessage || 'Failed to update status');
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setUsers(users.filter(user => user.id !== userId));
        }
    };

    const initializeCustomPermissions = (roleId: string) => {
        const role = predefinedRoles.find(r => r.id === roleId);
        if (role) {
            setCustomPermissions({ ...role.permissions });
        } else {
            // Initialize with default permissions
            const defaultPerms: any = {};
            menuItems.forEach(item => {
                defaultPerms[item.id] = { view: false, edit: false, delete: false };
            });
            setCustomPermissions(defaultPerms);
        }
    };

    const togglePermission = (menuId: string, permissionType: string) => {
        setCustomPermissions((prev: any) => {
            const current = prev[menuId] || { view: false, edit: false, delete: false };
            let newPermission = { ...current };

            if (permissionType === 'full') {
                // Toggle full access
                const hasFullAccess = current.view && current.edit && current.delete;
                newPermission = {
                    view: !hasFullAccess,
                    edit: !hasFullAccess,
                    delete: !hasFullAccess
                };
            } else {
                // Toggle individual permission
                newPermission[permissionType as keyof any] = !current[permissionType as keyof any];

                // If we're enabling edit or delete, also enable view
                if ((permissionType === 'edit' || permissionType === 'delete') && newPermission[permissionType as keyof any]) {
                    newPermission.view = true;
                }

                // If we're disabling view, also disable edit and delete
                if (permissionType === 'view' && !newPermission.view) {
                    newPermission.edit = false;
                    newPermission.delete = false;
                }
            }

            return {
                ...prev,
                [menuId]: newPermission
            };
        });
    };

    const getPermissionState = (menuId: string, permissionType: string): boolean => {
        const permission = customPermissions[menuId];
        if (!permission) return false;

        if (permissionType === 'full') {
            return permission.view && permission.edit && permission.delete;
        }
        return permission[permissionType as keyof any] || false;
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedEmployee || !newUser.roleId) {
            alert('Please select an employee and a role');
            return;
        }

        let selectedRole = predefinedRoles.find(role => role.id === newUser.roleId);

        // If custom permissions are set, create a custom role
        if (Object.keys(customPermissions).length > 0) {
            selectedRole = {
                id: `custom-${Date.now()}`,
                name: `Custom Role - ${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                description: 'Custom permissions assigned to user',
                permissions: { ...customPermissions }
            };
        }

        if (!selectedRole) {
            alert('Please select a valid role');
            return;
        }

        const user: any = {
            id: (users.length + 1).toString(),
            firstName: selectedEmployee.firstName,
            lastName: selectedEmployee.lastName,
            email: selectedEmployee.email,
            role: selectedRole,
            isActive: newUser.isActive,
            createdAt: new Date().toISOString(),
            department: selectedEmployee.department,
            position: selectedEmployee.position
        };

        setUsers([...users, user]);
        setSelectedEmployee(null);
        setSearchEmployee('');
        setNewUser({
            employeeId: '',
            roleId: '',
            isActive: true
        });
        setCustomPermissions({});
        setShowAddUserForm(false);
    };

    const handleEditUser = (user: any) => {
        navigate(`/users-management/edit/${user.permissionId}`);
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser || !selectedEmployee || !newUser.roleId) {
            alert('Please select an employee and a role');
            return;
        }

        let selectedRole = predefinedRoles.find(role => role.id === newUser.roleId);

        // If custom permissions are set, create a custom role
        if (Object.keys(customPermissions).length > 0) {
            selectedRole = {
                id: `custom-${Date.now()}`,
                name: `Custom Role - ${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                description: 'Custom permissions assigned to user',
                permissions: { ...customPermissions }
            };
        }

        if (!selectedRole) {
            alert('Please select a valid role');
            return;
        }

        const updatedUser: any = {
            ...editingUser,
            firstName: selectedEmployee.firstName,
            lastName: selectedEmployee.lastName,
            email: selectedEmployee.email,
            role: selectedRole,
            department: selectedEmployee.department,
            position: selectedEmployee.position,
            isActive: newUser.isActive
        };

        setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
        setSelectedEmployee(null);
        setSearchEmployee('');
        setNewUser({
            employeeId: '',
            roleId: '',
            isActive: true
        });
        setCustomPermissions({});
        setEditingUser(null);
        setShowAddUserForm(false);
    };

    const handleCancelForm = () => {
        setShowAddUserForm(false);
        setEditingUser(null);
        setSelectedEmployee(null);
        setSearchEmployee('');
        setShowEmployeeDropdown(false);
        setNewUser({
            employeeId: '',
            roleId: '',
            isActive: true
        });
        setCustomPermissions({});
    };

    const filteredEmployees: any[] = [];

    const handleEmployeeSelect = (employee: any) => {
        setSelectedEmployee(employee);
        setSearchEmployee(`${employee.employeeNumber} - ${employee.firstName} ${employee.lastName}`);
        setNewUser({ ...newUser, employeeId: employee.id });
        setShowEmployeeDropdown(false);
    };

    const PermissionBadge: React.FC<{ permission: any }> = ({ permission }) => {
        if (!permission.view) {
            return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">No Access</span>;
        }
        if (permission.delete) {
            return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Full Access</span>;
        }
        if (permission.edit) {
            return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Edit</span>;
        }
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">View Only</span>;
    };

    const ToggleButton: React.FC<{
        isActive: boolean;
        onClick: () => void;
        color: string;
        disabled?: boolean;
    }> = ({ isActive, onClick, color, disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        p-1 rounded transition-all duration-200 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
        ${isActive
                    ? `text-${color}-600 hover:text-${color}-700`
                    : 'text-gray-300 hover:text-gray-400'
                }
      `}
        >
            {isActive ? <IconToggleRight className="w-5 h-5" /> : <IconToggleLeft className="w-5 h-5" />}
        </button>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
                            >
                                <IconArrowLeft className="w-5 h-5 mr-2" />
                                Back to home
                            </button>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Users Management</h1>
                                <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/users-management/create-user')}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <IconPlus className="w-5 h-5 mr-2" />
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-8">

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`
                flex items-center px-6 py-4 text-sm transition-colors
                ${activeTab === 'users'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
              `}
                        >
                            <IconUsers className="w-5 h-5 mr-2" />
                            All Users ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('online')}
                            className={`
                flex items-center px-6 py-4 text-sm transition-colors
                ${activeTab === 'online'
                                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
              `}
                        >
                            <IconDeviceDesktop className="w-5 h-5 mr-2" />
                            Online Users ({onlineUsers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('tracking')}
                            className={`
                flex items-center px-6 py-4 text-sm transition-colors
                ${activeTab === 'tracking'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
              `}
                        >
                            <IconActivity className="w-5 h-5 mr-2" />
                            User Tracking
                        </button>
                    </div>
                </div>

                {/* Add/Edit User Form */}
                {showAddUserForm && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg text-gray-900">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button
                                onClick={handleCancelForm}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <IconX className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-6">
                            <div className="space-y-6">
                                {/* Employee Selection */}
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Select Employee from HRMS *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchEmployee}
                                            onChange={(e) => {
                                                setSearchEmployee(e.target.value);
                                                setShowEmployeeDropdown(true);
                                            }}
                                            onFocus={() => {
                                                setShowEmployeeDropdown(true);
                                                if (!selectedEmployee) {
                                                    setSearchEmployee('');
                                                }
                                            }}
                                            onBlur={() => {
                                                // Delay hiding to allow click on dropdown items
                                                setTimeout(() => setShowEmployeeDropdown(false), 200);
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Search by employee number, name, department, or position..."
                                            required
                                        />
                                        {showEmployeeDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map((employee) => (
                                                        <div
                                                            key={employee.id}
                                                            onClick={() => handleEmployeeSelect(employee)}
                                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="text-gray-900">
                                                                        {employee.employeeNumber} - {employee.firstName} {employee.lastName}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {employee.department} • {employee.position}
                                                                    </div>
                                                                    <div className="text-sm text-gray-400">{employee.email}</div>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${employee.status === 'active'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : employee.status === 'on-leave'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {employee.status.replace('-', ' ').toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-gray-500 text-center">
                                                        No employees found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Selected Employee Details */}
                                {selectedEmployee && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm text-gray-900 mb-3">Selected Employee Details</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-700">Employee Number:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.employeeNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Full Name:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Email:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Department:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.department}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Position:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.position}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Manager:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.manager}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Location:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.location}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Hire Date:</span>
                                                <span className="ml-2 text-gray-900">{new Date(selectedEmployee.hireDate).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Contract Type:</span>
                                                <span className="ml-2 text-gray-900 capitalize">{selectedEmployee.contractType}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Work Schedule:</span>
                                                <span className="ml-2 text-gray-900">{selectedEmployee.workSchedule}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${selectedEmployee.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedEmployee.status === 'on-leave'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {selectedEmployee.status.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        value={newUser.roleId}
                                        onChange={(e) => {
                                            setNewUser({ ...newUser, roleId: e.target.value });
                                            initializeCustomPermissions(e.target.value);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select a role</option>
                                        {predefinedRoles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={newUser.isActive}
                                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                    Active user
                                </label>
                            </div>

                            {/* Permissions Grid */}
                            {selectedEmployee && newUser.roleId && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg text-gray-900 mb-4">Custom Permissions</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left py-3 px-4 text-gray-700">Module</th>
                                                        {permissionTypes.map(type => (
                                                            <th key={type.id} className="text-center py-3 px-4 text-gray-700">
                                                                {type.label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {menuItems.map(item => (
                                                        <tr key={item.id} className="hover:bg-white transition-colors">
                                                            <td className="py-3 px-4 text-gray-900">
                                                                {item.name}
                                                            </td>
                                                            {permissionTypes.map(type => (
                                                                <td key={type.id} className="py-3 px-4 text-center">
                                                                    <ToggleButton
                                                                        isActive={getPermissionState(item.id, type.id)}
                                                                        onClick={() => togglePermission(item.id, type.id)}
                                                                        color={type.color}
                                                                        disabled={
                                                                            // Disable edit/delete if view is not enabled (except for full access)
                                                                            type.id !== 'view' && type.id !== 'full' &&
                                                                            !getPermissionState(item.id, 'view')
                                                                        }
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <IconAlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
                                                </div>
                                                <div className="ml-3 text-sm text-blue-700">
                                                    <p className="font-medium">Permission Rules:</p>
                                                    <ul className="mt-1 list-disc list-inside space-y-1">
                                                        <li>View permission is required for Edit and Delete</li>
                                                        <li>Full Access grants all permissions for that module</li>
                                                        <li>Custom permissions will override the selected role</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <IconCheck className="w-4 h-4 mr-2" />
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="flex items-center px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    <IconX className="w-4 h-4 mr-2" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {/* Tab Content */}
                {activeTab === 'users' && (
                    <>
                        {/* Filters */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Roles</option>
                                    {predefinedRoles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'online' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg text-gray-900">Currently Online Users</h2>
                            <p className="text-sm text-gray-600 mt-1">{onlineUsers.length} users currently active</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Last Activity</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Session</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {onlineUsers.map((user) => {
                                        const session = activeSessions.find(s => s.userId === user.id);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center relative">
                                                            <IconUsers className="w-5 h-5 text-gray-500" />
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm text-gray-900">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                        Online
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.lastActivity ? formatTimeAgo(user.lastActivity) : 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {session ? (
                                                        <div>
                                                            <div>Duration: {formatTimeAgo(session.loginTime)}</div>
                                                            <div className="text-xs text-gray-400">{session.actionsPerformed} actions</div>
                                                        </div>
                                                    ) : 'No session data'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleViewUserTracking(user.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                        title="View User Activity"
                                                    >
                                                        <IconActivity className="w-4 h-4" />
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

                {activeTab === 'tracking' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg text-gray-900">User Activity Tracking</h2>
                            <p className="text-sm text-gray-600 mt-1">Monitor user sessions and activities</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Session Status</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Login Time</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Pages Visited</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Actions</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {userSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center relative">
                                                        <IconUsers className="w-5 h-5 text-gray-500" />
                                                        {session.isActive && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm text-gray-900">
                                                            {session.userName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{session.ipAddress}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${session.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {session.isActive ? 'Active' : 'Ended'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>
                                                    <div>{new Date(session.loginTime).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(session.loginTime).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="max-w-xs">
                                                    <div className="font-medium">{session.pagesVisited.length} pages</div>
                                                    <div className="text-xs text-gray-400 truncate">
                                                        {session.pagesVisited.slice(0, 2).join(', ')}
                                                        {session.pagesVisited.length > 2 && '...'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="font-medium">{session.actionsPerformed}</div>
                                                <div className="text-xs text-gray-400">actions performed</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewUserTracking(session.userId)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="View Detailed Activity"
                                                >
                                                    <IconEye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Table - Only show in users tab */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center relative">
                                                        <IconUsers className="w-5 h-5 text-gray-500" />
                                                        {user.isOnline && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm text-gray-900">
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <IconShield className="w-4 h-4 text-blue-500 mr-2" />
                                                    <span className="text-sm text-gray-900">{user.role.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.department}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {user.isOnline && (
                                                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                            Online
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowPermissionsModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                        title="View Permissions"
                                                    >
                                                        <IconEye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewUserTracking(user.id)}
                                                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                                                        title="View User Activity"
                                                    >
                                                        <IconActivity className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleEditUser(user);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                                        title="Edit User"
                                                    >
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleUserStatus(user.permissionId)}
                                                        className={`p-1 rounded ${user.isActive
                                                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                            }`}
                                                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                                    >
                                                        {user.isActive ? <IconUserX className="w-4 h-4" /> : <IconUserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Delete User"
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* User Tracking Modal */}
                {showUserTrackingModal && selectedUserForTracking && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg text-gray-900">
                                        User Activity Tracking
                                    </h2>
                                    <button
                                        onClick={() => setShowUserTrackingModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <IconX className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {(() => {
                                        const user = users.find(u => u.id === selectedUserForTracking);
                                        return user ? `${user.firstName} ${user.lastName} - ${user.email}` : 'Unknown User';
                                    })()}
                                </p>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* User Sessions */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg text-gray-900 mb-4 flex items-center">
                                            <IconDeviceDesktop className="w-5 h-5 mr-2 text-blue-500" />
                                            Sessions
                                        </h3>
                                        <div className="space-y-3">
                                            {getUserSessions(selectedUserForTracking).map((session) => (
                                                <div key={session.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {session.isActive ? 'Active' : 'Ended'}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(session.loginTime).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">IP Address:</span>
                                                            <div className="font-medium">{session.ipAddress}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Actions:</span>
                                                            <div className="font-medium">{session.actionsPerformed}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="text-gray-500 text-sm">Pages Visited:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {session.pagesVisited.map((page: any, index: any) => (
                                                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                                    {page}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* User Activities */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg text-gray-900 mb-4 flex items-center">
                                            <IconActivity className="w-5 h-5 mr-2 text-purple-500" />
                                            Recent Activities
                                        </h3>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {getUserActivities(selectedUserForTracking).map((activity) => (
                                                <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {getActionIcon(activity.action)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-gray-900">{activity.action}</h4>
                                                                <span className="text-sm text-gray-500">
                                                                    {formatTimeAgo(activity.timestamp)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">{activity.page}</p>
                                                            {activity.details && (
                                                                <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                                                            )}
                                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                                                <span className="flex items-center">
                                                                    <IconMapPin className="w-3 h-3 mr-1" />
                                                                    {activity.ipAddress}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <IconClock className="w-3 h-3 mr-1" />
                                                                    {new Date(activity.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Permissions Modal */}
                {showPermissionsModal && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg text-gray-900">
                                        Permissions for {selectedUser.firstName} {selectedUser.lastName}
                                    </h2>
                                    <button
                                        onClick={() => setShowPermissionsModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <IconX className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Role: {selectedUser.role.name}</p>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 gap-4">
                                    {menuItems.map((item) => {
                                        const permission = selectedUser.role.permissions[item.id];
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h3 className="text-gray-900">{item.name}</h3>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-gray-500">View:</span>
                                                        {permission?.view ? (
                                                            <IconCheck className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <IconX className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-gray-500">Edit:</span>
                                                        {permission?.edit ? (
                                                            <IconCheck className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <IconX className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-gray-500">Delete:</span>
                                                        {permission?.delete ? (
                                                            <IconCheck className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <IconX className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    <PermissionBadge permission={permission || { view: false, edit: false, delete: false }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role Summary Cards */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {predefinedRoles.map((role) => {
                            const userCount = users.filter(user => user.role.id === role.id).length;
                            return (
                                <div key={role.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex items-center mb-4">
                                        <IconShield className="w-8 h-8 text-blue-500 mr-3" />
                                        <div>
                                            <h3 className="text-gray-900">{role.name}</h3>
                                            <p className="text-sm text-gray-500">{userCount} users</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                                    <div className="text-xs text-gray-500">
                                        <div className="flex justify-between">
                                            <span>Full Access:</span>
                                            <span>{Object.values(role.permissions).filter(p => (p as { view: boolean, edit: boolean, delete: boolean }).view && (p as { view: boolean, edit: boolean, delete: boolean }).edit && (p as { view: boolean, edit: boolean, delete: boolean }).delete).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Edit Access:</span>
                                            <span>{Object.values(role.permissions).filter(p => (p as { view: boolean, edit: boolean, delete: boolean }).view && (p as { view: boolean, edit: boolean, delete: boolean }).edit && !(p as { view: boolean, edit: boolean, delete: boolean }).delete).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>View Only:</span>
                                            <span>{Object.values(role.permissions).filter(p => (p as { view: boolean; edit: boolean; delete: boolean }).view && !(p as { view: boolean; edit: boolean; delete: boolean }).edit && !(p as { view: boolean; edit: boolean; delete: boolean }).delete).length}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersManagement;
