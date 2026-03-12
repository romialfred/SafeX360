import { Badge, Breadcrumbs, Text, Loader } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getEmployee } from "../../../services/EmployeeService";
import { getPermissionByEmployeeId } from "../../../services/PermissionManagementService";

const UserDetails = () => {
    const { id } = useParams(); // treat as employeeId
    const [employee, setEmployee] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

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

    const moduleIdToApiField: Record<string, string> = {
        'home': 'home',
        'non-conformity': 'nonConformity',
        'inspections': 'inspections',
        'meetings': 'meetings',
        'management-tour': 'managementTour',
        'incident-management': 'incidentManagement',
        'investigations': 'investigations',
        'action-plans-inc': 'actionPlansInc',
        'pending-actions': 'pendingActions',
        'action-plan': 'actionPlan',
        'recommendations': 'recommendations',
        'adhoc-actions': 'adhocActions',
        'risk-overview': 'riskOverview',
        'risk-register': 'riskRegister',
        'risk-assessment': 'riskAssessment',
        'chemical-register': 'chemicalRegister',
        'ppe-overview': 'ppeOverview',
        'ppe-monitoring': 'ppeMonitoring',
        'ppe-request': 'ppeRequest',
        'audit-plan': 'auditPlan',
        'audits': 'audits',
        'audit-recommendations': 'auditRecommendations',
        'compliance-dashboard': 'complianceDashboard',
        'requirements': 'requirements',
        'position-assignments': 'positionAssignments',
        'employee-assignments': 'employeeAssignments',
        'documents': 'documents',
        'document-validation': 'documentValidation',
        'lessons-learned': 'lessonsLearned',
        'document-manager': 'documentManager',
        'comm-dashboard': 'commDashboard',
        'employee-comm': 'employeeComm',
        'notifications': 'notifications',
        'users-management': 'usersManagement',
        'settings': 'settings',
    };

    const fromBits = (bits?: string) => {
        const b = (bits || '000').padEnd(3, '0');
        const r = b.charAt(0) === '1';
        const w = b.charAt(1) === '1';
        const d = b.charAt(2) === '1';
        return { view: r || w || d, edit: w || d, delete: d };
    };

    const apiRoleToName = (role: string) => {
        switch (role) {
            case 'SYSTEM_ADMINISTRATOR': return 'System Administrator';
            case 'HEALTH_SAFETY_COORDINATOR': return 'Health & Safety Coordinator';
            case 'INCIDENT_INVESTIGATOR': return 'Incident Investigator';
            case 'AUDITOR': return 'Auditor';
            case 'EMPLOYEE': return 'Employee';
            default: return role;
        }
    };

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getEmployee(id),
            getPermissionByEmployeeId(Number(id))
        ]).then(([emp, perm]) => {
            setEmployee(emp);
            setProfile(perm);
        }).finally(() => setLoading(false));
    }, [id]);

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

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Users Management Details</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>

                        <Link className="hover:!underline" to="/users-management" ><Text variant="gradient" className="hover:!underline cursor-pointer">Users Management</Text></Link>
                        <Text variant="gradient">Users Management Details</Text>
                    </Breadcrumbs>
                </div>

            </div>

            {loading && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                    <div className="flex items-center gap-3 text-gray-700">
                        <Loader size="sm" />
                        <span>Loading user details...</span>
                    </div>
                </div>
            )}
            {!loading && employee && profile && (
                <div className=" ">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-300  ">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-primary">
                                    {employee?.name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-sm text-gray-600">Role: <span className="font-medium text-gray-900">{apiRoleToName(profile.role)}</span></p>
                                <Badge color={profile.status === 'ACTIVE' ? 'green' : 'red'} variant="light">{profile.status}</Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                <span>Department: {employee?.department || '-'}</span> • <span>Position: {employee?.position || '-'}</span> • <span>Email: {employee?.email || '-'}</span>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 gap-4">
                                {menuItems.map((item) => {
                                    const apiField = moduleIdToApiField[item.id];
                                    const permission = fromBits(profile?.[apiField]);
                                    return (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{item.name}</h3>
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
        </div>
    );
};

export default UserDetails;
