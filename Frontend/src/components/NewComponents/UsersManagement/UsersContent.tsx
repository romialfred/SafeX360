import { useEffect, useState } from "react";
import { TextInput, Select, Group, Badge, ActionIcon, Tooltip, Avatar, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import {
    IconEdit,
    IconEye,
    IconSearch,
    IconShield,
    IconTrash,
    IconUserCheck,
    IconUserX,
} from "@tabler/icons-react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { predefinedRoles } from "../data/roles";
import { Toolbar } from "primereact/toolbar";
import { useNavigate } from "react-router-dom";
import { getAllPermissions, updatePermissionStatus } from "../../../services/PermissionManagementService";
import { deleteUser } from "../../../services/UserManagementService";
import { getAllAccounts } from "../../../services/AccountService";
import { usePermissions } from "../../../hooks/usePermissions";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getAllEmployeeWithDirection } from "../../../services/EmployeeService";

const UsersContent = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [users, setUsers] = useState<any[]>([]);

    const { t } = useTranslation('navigation');
    const perms = usePermissions();
    const navigate = useNavigate();


    const filteredUsers = users.filter((user) => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const matchesSearch =
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRole === "all" || user.role.uiId === filterRole;
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && user.isActive) ||
            (filterStatus === "inactive" && !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const dispatch = useDispatch();

    const apiRoleToUi = (role: string) => {
        switch (role) {
            case 'SYSTEM_ADMINISTRATOR': return { uiId: 'system-admin', name: 'System Administrator' };
            case 'HEALTH_SAFETY_COORDINATOR': return { uiId: 'health-safety-coordinator', name: 'Health & Safety Coordinator' };
            case 'INCIDENT_INVESTIGATOR': return { uiId: 'incident-investigator', name: 'Incident Investigator' };
            case 'AUDITOR': return { uiId: 'auditor', name: 'Auditor' };
            case 'EMPLOYEE': return { uiId: 'employee', name: 'Employee' };
            default: return { uiId: role, name: role };
        }
    };

    useEffect(() => {
        // On charge aussi les comptes HRMS : le DTO permissions (getAll) ne porte pas
        // l'accountId, or l'endpoint de suppression cible l'accountId HRMS. On reconstruit
        // donc le lien employeeId -> accountId via la liste des comptes (champ empId).
        Promise.all([getAllPermissions(), getAllEmployeeWithDirection(), getAllAccounts().catch(() => [])])
            .then(([profiles, employees, accounts]) => {
                const eMap = mapIdToName(employees || []);
                const accByEmp: Record<number, number> = {};
                (Array.isArray(accounts) ? accounts : []).forEach((a: any) => {
                    if (a?.empId != null && a?.id != null) accByEmp[Number(a.empId)] = Number(a.id);
                });
                const mapped = (profiles || []).map((p: any) => {
                    const emp = eMap[Number(p.employeeId)] || {};
                    const fullName: string = emp.name || '';
                    const [first, ...rest] = (fullName || '').split(' ');
                    const last = rest.join(' ');
                    const uiRole = apiRoleToUi(p.role);
                    return {
                        id: p.id,
                        employeeId: p.employeeId,
                        accountId: accByEmp[Number(p.employeeId)] ?? null,
                        firstName: first || fullName || '-',
                        lastName: last || '',
                        email: emp.email || '-',
                        role: { id: p.role, name: uiRole.name, uiId: uiRole.uiId },
                        isActive: p.status === 'ACTIVE',
                        department: emp.department || '-',
                        position: emp.position || '-',
                        lastLogin: null,
                    };
                });
                setUsers(mapped);
            })
            .catch((err) => {
                errorNotification(err?.response?.data?.errorMessage || 'Failed to load users');
            });
    }, []);

    const handleToggleUserStatus = (permissionId: number) => {
        const target = users.find(u => u.id === permissionId);
        if (!target) return;
        const nextActive = !target.isActive;
        const status = nextActive ? 'ACTIVE' : 'INACTIVE';
        dispatch(showOverlay());
        updatePermissionStatus(permissionId, status as any)
            .then(() => {
                setUsers(prev => prev.map(u => u.id === permissionId ? { ...u, isActive: nextActive } : u));
                successNotification('Status updated');
            })
            .catch((err) => {
                errorNotification(err?.response?.data?.errorMessage || 'Failed to update status');
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const performDelete = (rowData: any) => {
        const accountId: number | null = rowData.accountId;
        if (accountId == null) {
            errorNotification(t('userMgmt.delete.noAccountId'));
            return;
        }
        dispatch(showOverlay());
        deleteUser(accountId)
            .then(() => {
                setUsers((prev) => prev.filter((u) => u.id !== rowData.id));
                successNotification(t('userMgmt.delete.success'));
            })
            .catch((err) => {
                const code = err?.response?.data?.errorMessage || err?.response?.data?.error;
                if (code === 'CANNOT_DELETE_SELF') {
                    errorNotification(t('userMgmt.delete.errorSelf'));
                } else if (code === 'ACCOUNT_PROTECTED') {
                    errorNotification(t('userMgmt.delete.errorProtected'));
                } else if (code === 'ACCOUNT_NOT_FOUND') {
                    errorNotification(t('userMgmt.delete.errorNotFound'));
                } else {
                    errorNotification(t('userMgmt.delete.errorGeneric'));
                }
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const handleDeleteUser = (rowData: any) => {
        const fullName = `${rowData.firstName || ''} ${rowData.lastName || ''}`.trim() || rowData.email;
        modals.openConfirmModal({
            title: <Text fw={700} size="lg">{t('userMgmt.delete.confirmTitle')}</Text>,
            centered: true,
            children: (
                <Text size="sm">
                    {t('userMgmt.delete.confirmIntro')}{' '}
                    <strong>{fullName}</strong>
                    {t('userMgmt.delete.confirmWarning')}
                </Text>
            ),
            labels: {
                confirm: t('userMgmt.delete.confirmButton'),
                cancel: t('userMgmt.delete.cancelButton'),
            },
            confirmProps: { color: 'red', variant: 'filled' },
            cancelProps: { variant: 'default' },
            onConfirm: () => performDelete(rowData),
        });
    };



    // Edit handled via navigation to dedicated page

    // ====== TABLE BODY TEMPLATES ======
    const userBodyTemplate = (rowData: any) => (
        <Group>

            <Avatar name={`${rowData.firstName} ${rowData.lastName}`} color="initials" variant="filled" />
            <div>
                <div className="font-medium">
                    {rowData.firstName} {rowData.lastName}
                </div>
                <div className="text-gray-500 text-xs">{rowData.email}</div>
            </div>
        </Group>
    );

    const roleBodyTemplate = (rowData: any) => (
        <Group gap="xs">
            <IconShield size={16} className="text-blue-500" />
            <span>{rowData.role.name}</span>
        </Group>
    );

    const statusBodyTemplate = (rowData: any) => (
        <Group gap={4} wrap="nowrap" align="flex-start">
            <Badge color={rowData.isActive ? "green" : "red"} variant="light">
                {rowData.isActive ? "Active" : "Inactive"}
            </Badge>
            {/* Online indicator removed */}
        </Group>
    );

    const actionsBodyTemplate = (rowData: any) => (
        <Group gap="xs">
            <Tooltip label="View Permissions">
                <ActionIcon color="blue" variant="subtle" onClick={() => navigate(`usersManagement-details/${rowData.employeeId}`)}>
                    <IconEye size={16} />
                </ActionIcon>
            </Tooltip>



            <Tooltip label="Edit User">
                <ActionIcon color="indigo" variant="subtle" onClick={() => navigate(`edit/${rowData.id}`)}>
                    <IconEdit size={16} />
                </ActionIcon>
            </Tooltip>

            <Tooltip label={rowData.isActive ? "Deactivate" : "Activate"}>
                <ActionIcon
                    color={rowData.isActive ? "red" : "green"}
                    variant="subtle"
                    onClick={() => handleToggleUserStatus(rowData.id)}
                >
                    {rowData.isActive ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
                </ActionIcon>
            </Tooltip>

            <Tooltip
                label={
                    rowData.accountId != null && rowData.accountId === perms.profile?.accountId
                        ? t('userMgmt.delete.tooltipSelf')
                        : t('userMgmt.delete.tooltip')
                }
            >
                <ActionIcon
                    color="red"
                    variant="subtle"
                    disabled={rowData.accountId != null && rowData.accountId === perms.profile?.accountId}
                    onClick={() => handleDeleteUser(rowData)}
                >
                    <IconTrash size={16} />
                </ActionIcon>
            </Tooltip>
        </Group>
    );

    const leftToolbarTemplate = () => (
        <div className="flex gap-5">
            <Select
                data={[
                    { value: "all", label: "All Roles" },
                    ...predefinedRoles.map((role) => ({
                        value: role.id,
                        label: role.name,
                    })),
                ]}
                value={filterRole}
                onChange={(val) => setFilterRole(val || "all")}
                placeholder="Filter by Role"
            />
            <Select
                data={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val || "all")}
                placeholder="Filter by Status"
            />
        </div>
    );

    const rightToolbarTemplate = () => (
        <TextInput
            placeholder="Search users..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />
    );

    return (
        <div className="flex flex-col gap-5">

            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
            <DataTable
                value={filteredUsers}
                paginator
                stripedRows
                emptyMessage="No users found."
                removableSort
                tableStyle={{ minWidth: "60rem" }}
                className="[&_.p-datatable-tbody]:!text-sm"
                size="small"
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="id"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} risks"
            >
                <Column style={{ fontWeight: "normal", fontSize: "14px" }} field="user" header="User" body={userBodyTemplate} sortable />
                <Column style={{ fontWeight: "normal", fontSize: "14px" }} field="role" header="Role" body={roleBodyTemplate} sortable />
                <Column style={{ fontWeight: "normal", fontSize: "14px" }} field="department" header="Department" sortable />
                <Column style={{ fontWeight: "normal", fontSize: "14px" }} field="status" header="Status" body={statusBodyTemplate} />
                {/* <Column style={{ fontWeight: "normal", fontSize: "14px" }} field="lastLogin" header="Last Login" body={(row) => row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : "Never"} /> */}
                <Column style={{ fontWeight: "normal", fontSize: "14px" }} body={actionsBodyTemplate} />
            </DataTable>
        </div>

    );
};

export default UsersContent;
