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

    /**
     * LOT Dosimétrie & Expositions — Permissions effectives Spring Security.
     *
     * Ce bloc affiche les 11 autorisations granulaires du module Dosimétrie qui sont
     * accordées au runtime via le header X-Permissions propagé par la Gateway
     * (cf. {@code GatewayAuthorityFilter} + {@code DosimetryRBACConfig}).
     *
     * Différence avec les permissions ci-dessus :
     *   - Les permissions des modules HSE historiques (non-conformity, incidents, etc.)
     *     sont stockées en BDD dans {@code permission_management.<column>} sous forme
     *     de bits read/write/delete.
     *   - Les permissions DOSIMETRY_* relèvent du modèle ABAC/RBAC Spring (autorities
     *     du SecurityContext), accordées par défaut au rôle SYSTEM_ADMINISTRATOR via
     *     le secret partagé Gateway (compat ascendante R-003).
     *
     * Affichage : badge "Accordée" pour SYSTEM_ADMINISTRATOR, "Selon rôle" sinon.
     */
    const dosimetryPermissions = [
        { id: 'DOSIMETRY_VIEW', name: 'Consultation tableau de bord & KPIs' },
        { id: 'DOSIMETRY_READ_AGGREGATE', name: 'Lecture agrégée (sans données nominatives)' },
        { id: 'DOSIMETRY_READ_NOMINATIVE', name: 'Lecture nominative (avec audit RGPD art. 30)' },
        { id: 'DOSIMETRY_RECORD', name: 'Saisie des mesures de dose' },
        { id: 'DOSIMETRY_WRITE', name: 'Écriture sur les données du registre' },
        { id: 'DOSIMETRY_VALIDATE', name: 'Validation des doses et des seuils' },
        { id: 'DOSIMETRY_MEDICAL', name: 'Accès médical (médecin du travail, RGPD art. 9)' },
        { id: 'DOSIMETRY_PCR_RPO', name: 'Personne Compétente en Radioprotection (PCR/RPO)' },
        { id: 'DOSIMETRY_ALERT', name: 'Gestion des alertes de dépassement' },
        { id: 'DOSIMETRY_EXPORT_MEDICAL', name: 'Export des données médicales (attestation, rapport)' },
        { id: 'DOSIMETRY_ADMIN', name: 'Administration du module (paramètres, RBAC)' },
    ];

    /**
     * LOT Blast Management — Permissions effectives Spring Security (P8).
     *
     * Ces 6 autorisations granulaires sont accordées au runtime via le header
     * X-Permissions propagé par la Gateway et consommées par les @PreAuthorize
     * du backend Blast (cf. {@code BlastRBACConfig} + controllers Blast).
     *
     * Modèle ABAC : par défaut, SYSTEM_ADMINISTRATOR a TOUTES les permissions
     * Blast (compat ascendante R-003). Les autres rôles ne reçoivent que le
     * sous-ensemble pertinent (Boutefeu, HSE Manager, Employee).
     *
     * Affichage : badge "Accordée" pour SYSTEM_ADMINISTRATOR, "Selon rôle" sinon.
     */
    const blastPermissions = [
        { id: 'BLAST_VIEW', name: 'Consulter les tirs et rapports' },
        { id: 'BLAST_PLAN', name: 'Planifier et modifier les tirs' },
        { id: 'BLAST_CONFIRM', name: 'Confirmer un tir et déclarer les statuts' },
        { id: 'BLAST_ALARM', name: 'Déclencher et arrêter l\'alerte générale' },
        { id: 'BLAST_REPORT', name: 'Établir et signer le rapport d\'évacuation' },
        { id: 'BLAST_ADMIN', name: 'Administrer le module (paramètres, RBAC, résoudre misfire)' },
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
            return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Modifier</span>;
        }
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">View Only</span>;
    };

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: page title — text-slate-900 (was text-blue-500 gradient) */}
                    <div className="text-2xl font-semibold text-slate-900">Users Management Details</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumbs — c="dimmed" non-leaf, c="teal" leaf (was gradient) */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>

                        <Link className="hover:!underline" to="/users-management" ><Text c="dimmed" className="hover:!underline cursor-pointer">Users Management</Text></Link>
                        <Text c="teal" fw={500}>Users Management Details</Text>
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
                                <h2 className="text-lg text-primary">
                                    {employee?.name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-sm text-gray-600">Role: <span className="text-gray-900">{apiRoleToName(profile.role)}</span></p>
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

                            {/* ─── Section Dosimétrie & Expositions (LOT) ───
                                Permissions Spring Security granulaires accordees via la Gateway.
                                Pour SYSTEM_ADMINISTRATOR : toutes accordees (compat ascendante R-003).
                                Pour les autres roles : selon le profil RBAC effectif au runtime. */}
                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-800">
                                            Dosimétrie & Expositions
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Autorisations granulaires de radioprotection (Spring Security · ICRP 103 / AIEA GSR Part 3)
                                        </p>
                                    </div>
                                    <Badge color="violet" variant="light">
                                        {profile.role === 'SYSTEM_ADMINISTRATOR' ? 'Toutes accordées' : 'Selon rôle'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {dosimetryPermissions.map((perm) => {
                                        const granted = profile.role === 'SYSTEM_ADMINISTRATOR';
                                        return (
                                            <div
                                                key={perm.id}
                                                className="flex items-center justify-between p-3 bg-violet-50/50 border border-violet-100 rounded-lg"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-slate-800 font-medium">{perm.name}</p>
                                                    <p className="text-[11px] font-mono text-violet-700 mt-0.5">{perm.id}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {granted ? (
                                                        <>
                                                            <IconCheck className="w-4 h-4 text-emerald-600" />
                                                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                Accordée
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconX className="w-4 h-4 text-slate-400" />
                                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                Selon rôle
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ─── Section Gestion des Dynamitages (LOT P8) ───
                                Permissions Spring Security granulaires accordees via la Gateway.
                                Pour SYSTEM_ADMINISTRATOR : toutes accordees (compat ascendante R-003).
                                Pour les autres roles : selon le profil RBAC effectif au runtime
                                (Boutefeu / HSE Manager / Employee). */}
                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-800">
                                            Gestion des Dynamitages
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Autorisations granulaires du module Blast (Spring Security · cycle de vie des tirs et alerte générale)
                                        </p>
                                    </div>
                                    <Badge color="orange" variant="light">
                                        {profile.role === 'SYSTEM_ADMINISTRATOR' ? 'Toutes accordées' : 'Selon rôle'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {blastPermissions.map((perm) => {
                                        const granted = profile.role === 'SYSTEM_ADMINISTRATOR';
                                        return (
                                            <div
                                                key={perm.id}
                                                className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100 rounded-lg"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-slate-800 font-medium">{perm.name}</p>
                                                    <p className="text-[11px] font-mono text-amber-800 mt-0.5">{perm.id}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {granted ? (
                                                        <>
                                                            <IconCheck className="w-4 h-4 text-emerald-600" />
                                                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                Accordée
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconX className="w-4 h-4 text-slate-400" />
                                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                Selon rôle
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetails;
