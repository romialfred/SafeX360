/**
 * UsersAdminPage — Page principale de gestion des utilisateurs (LOT 49 / LOT 61).
 *
 * Fonctionnalites :
 *  - Liste des comptes (nom, login, email, role, statut)
 *  - Filtres : recherche, statut (ACTIVE/INACTIVE), role
 *  - Actions par ligne : reinitialiser MDP, activer/desactiver, editer modules, SUPPRIMER
 *  - Action header : creer un nouvel utilisateur (page CreateUserPage)
 *
 * Securite frontend :
 *  - Reservee aux administrateurs (verifie via usePermissions().isAdmin)
 *  - Confirmation Mantine pour les actions sensibles
 *  - Affichage des MDP temporaires uniquement si email NON envoye
 *  - Suppression : modale de confirmation, jamais sur son propre compte
 *
 * i18n : useTranslation('navigation'), cles sous t('userMgmt.list.*') et t('userMgmt.delete.*').
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Paper, Group, Button, TextInput, Select, Badge, ActionIcon, Tooltip, Modal,
    Text, Stack, Code, CopyButton, Alert, Box, Loader,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import {
    IconUserPlus, IconRefresh, IconSearch, IconLock, IconPower, IconEdit,
    IconAlertCircle, IconShieldLock, IconUsers, IconCopy, IconCircleCheck, IconTrash,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import { usePermissions } from '../../../hooks/usePermissions';
import { getAllAccounts } from '../../../services/AccountService';
import { resetUserPassword, toggleUserStatus, deleteUser } from '../../../services/UserManagementService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

interface Account {
    id: number;
    login: string;
    name: string;
    email: string;
    role: string;
    status?: string;
    phoneNumber?: string;
    empId?: number | null;
    company?: any;
    department?: any;
}

const ROLE_COLOR: Record<string, string> = {
    SYSTEM_ADMINISTRATOR: 'red',
    Administrator: 'red',
    HEALTH_SAFETY_COORDINATOR: 'teal',
    INCIDENT_INVESTIGATOR: 'orange',
    AUDITOR: 'blue',
    EMPLOYEE: 'gray',
    BLAST_OFFICER: 'violet',
    HSE_MANAGER: 'indigo',
};

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────

export default function UsersAdminPage() {
    const navigate = useNavigate();
    const perms = usePermissions();
    const { t } = useTranslation('navigation');

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>('ALL');
    const [roleFilter, setRoleFilter] = useState<string | null>('ALL');

    // Modal reset password — affiche le MDP temporaire si email non envoye
    const [resetResult, setResetResult] = useState<{ login: string; tempPassword: string | null; emailSent: boolean } | null>(null);

    // Modal confirmation toggle status
    const [statusConfirm, setStatusConfirm] = useState<Account | null>(null);

    // Libelle traduit d'un role (repli sur le code brut).
    const roleLabel = (role: string) => t(`userMgmt.list.roles.${role}`, { defaultValue: role || '—' });

    // ─── Chargement ───
    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await getAllAccounts();
            setAccounts(Array.isArray(res) ? res : []);
        } catch (e: any) {
            errorNotification(t('userMgmt.list.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Filtrage ───
    const filtered = useMemo(() => {
        return accounts.filter((a) => {
            if (statusFilter !== 'ALL' && (a.status || '').toUpperCase() !== statusFilter) return false;
            if (roleFilter !== 'ALL' && a.role !== roleFilter) return false;
            if (search) {
                const s = search.toLowerCase();
                if (
                    !(a.login || '').toLowerCase().includes(s)
                    && !(a.name || '').toLowerCase().includes(s)
                    && !(a.email || '').toLowerCase().includes(s)
                ) return false;
            }
            return true;
        });
    }, [accounts, search, statusFilter, roleFilter]);

    // ─── Actions ───
    const handleResetPassword = async (account: Account) => {
        try {
            const resp = await resetUserPassword(account.id);
            setResetResult({
                login: account.login,
                tempPassword: resp.temporaryPassword,
                emailSent: resp.emailSent,
            });
            successNotification(t('userMgmt.list.resetSuccess', { login: account.login }));
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || t('userMgmt.list.resetError'));
        }
    };

    const handleToggleStatus = async () => {
        if (!statusConfirm) return;
        try {
            const resp = await toggleUserStatus(statusConfirm.id);
            successNotification(resp.message);
            setStatusConfirm(null);
            await loadAccounts();
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || t('userMgmt.list.toggleError'));
        }
    };

    // ─── Suppression (l'id de la ligne EST l'accountId HRMS, cf. getAllAccounts) ───
    const performDelete = async (account: Account) => {
        try {
            await deleteUser(account.id);
            setAccounts((prev) => prev.filter((a) => a.id !== account.id));
            successNotification(t('userMgmt.delete.success'));
        } catch (err: any) {
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
        }
    };

    const handleDeleteUser = (account: Account) => {
        const fullName = account.name || account.login || account.email;
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
            onConfirm: () => performDelete(account),
        });
    };

    // ─── Rendu cellules ───
    // Le nom ouvre la fiche complète : c'est le geste naturel dans une liste, et
    // il évite d'avoir à chercher quel bouton mène à quel écran.
    const renderName = (row: Account) => (
        <Stack
            gap={2}
            role="link"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/users-admin/${row.id}`)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/users-admin/${row.id}`);
                }
            }}
        >
            <Text size="sm" fw={500} c="teal.7" td="underline">{row.name || '—'}</Text>
            <Text size="xs" c="dimmed">@{row.login}</Text>
        </Stack>
    );

    const renderEmail = (row: Account) => (
        <Text size="xs" c="dimmed">{row.email || '—'}</Text>
    );

    const renderRole = (row: Account) => (
        <Badge color={ROLE_COLOR[row.role] || 'gray'} variant="light" size="sm">
            {roleLabel(row.role)}
        </Badge>
    );

    const renderStatus = (row: Account) => {
        const s = (row.status || 'ACTIVE').toUpperCase();
        return (
            <Badge color={s === 'ACTIVE' ? 'teal' : 'gray'} variant={s === 'ACTIVE' ? 'filled' : 'light'} size="sm">
                {s === 'ACTIVE' ? t('userMgmt.list.statusActive') : t('userMgmt.list.statusInactive')}
            </Badge>
        );
    };

    const renderActions = (row: Account) => {
        const isSelf = perms.profile?.accountId != null && row.id === perms.profile.accountId;
        return (
            <Group gap={4} justify="center">
                <Tooltip label={t('userMgmt.list.actionEditModules')}>
                    <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        onClick={() => navigate(`/users-admin/${row.id}?tab=rights`)}
                    >
                        <IconEdit size={14} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={t('userMgmt.list.actionResetPassword')}>
                    <ActionIcon
                        variant="light"
                        color="orange"
                        size="sm"
                        onClick={() => handleResetPassword(row)}
                    >
                        <IconLock size={14} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={(row.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? t('userMgmt.list.actionDeactivate') : t('userMgmt.list.actionActivate')}>
                    <ActionIcon
                        variant="light"
                        color={(row.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'red' : 'teal'}
                        size="sm"
                        onClick={() => setStatusConfirm(row)}
                    >
                        <IconPower size={14} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={isSelf ? t('userMgmt.delete.tooltipSelf') : t('userMgmt.delete.tooltip')}>
                    <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        disabled={isSelf}
                        onClick={() => handleDeleteUser(row)}
                    >
                        <IconTrash size={14} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        );
    };

    // ─── Garde RBAC ───
    if (!perms.loading && !perms.isAdmin) {
        return (
            <Box p="lg">
                <Alert color="red" icon={<IconShieldLock size={16} />}>
                    <Text fw={600}>{t('userMgmt.list.accessDeniedTitle')}</Text>
                    <Text size="sm">{t('userMgmt.list.accessDeniedText')}</Text>
                </Alert>
            </Box>
        );
    }

    return (
        <Box p="md">
            <PageHeader
                breadcrumbs={[
                    { label: t('userMgmt.list.breadcrumbHome'), to: '/' },
                    { label: t('userMgmt.list.breadcrumbAdmin') },
                    { label: t('userMgmt.list.breadcrumbUsers') },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="teal"
                title={t('userMgmt.list.title')}
                subtitle={t('userMgmt.list.subtitle')}
                actions={
                    <Group gap="xs">
                        <Button
                            variant="default"
                            size="sm"
                            leftSection={<IconRefresh size={14} />}
                            onClick={loadAccounts}
                            disabled={loading}
                        >
                            {t('userMgmt.list.refresh')}
                        </Button>
                        <Button
                            size="sm"
                            leftSection={<IconUserPlus size={14} />}
                            // LOT 52 — la création passe par la page pleine largeur (CreateUserPage).
                            onClick={() => navigate('/users-admin/new')}
                            styles={{
                                root: {
                                    background: '#0F766E',
                                    fontWeight: 600,
                                },
                            }}
                        >
                            {t('userMgmt.list.newUser')}
                        </Button>
                    </Group>
                }
            />

            {/* Filtres */}
            <Paper p="sm" radius="md" style={{ border: '1px solid #E2E8F0' }} mb="md">
                <Group gap="sm">
                    <TextInput
                        placeholder={t('userMgmt.list.searchPlaceholder')}
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1, minWidth: 280 }}
                        size="sm"
                    />
                    <Select
                        placeholder={t('userMgmt.list.statusPlaceholder')}
                        data={[
                            { value: 'ALL', label: t('userMgmt.list.statusAll') },
                            { value: 'ACTIVE', label: t('userMgmt.list.statusActiveOnly') },
                            { value: 'INACTIVE', label: t('userMgmt.list.statusInactiveOnly') },
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        size="sm"
                        w={180}
                    />
                    <Select
                        placeholder={t('userMgmt.list.rolePlaceholder')}
                        data={[
                            { value: 'ALL', label: t('userMgmt.list.roleAll') },
                            ...Object.keys(ROLE_COLOR).map((v) => ({ value: v, label: roleLabel(v) })),
                        ]}
                        value={roleFilter}
                        onChange={setRoleFilter}
                        size="sm"
                        w={200}
                    />
                </Group>
            </Paper>

            {/* Table */}
            <Paper radius="md" style={{ border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {loading ? (
                    <Box style={{ padding: 60, textAlign: 'center' }}>
                        <Loader color="teal" />
                        <Text size="sm" c="dimmed" mt={12}>{t('userMgmt.list.loading')}</Text>
                    </Box>
                ) : (
                    <DataTable
                        value={filtered}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="id"
                        emptyMessage={
                            <Box style={{ padding: 40, textAlign: 'center' }}>
                                <Text size="sm" c="dimmed">{t('userMgmt.list.empty')}</Text>
                            </Box>
                        }
                        size="small"
                        stripedRows
                        rowHover
                        className="
                            [&_.p-datatable-thead>tr>th]:!bg-slate-50
                            [&_.p-datatable-thead>tr>th]:!text-slate-700
                            [&_.p-datatable-thead>tr>th]:!text-[10.5px]
                            [&_.p-datatable-thead>tr>th]:!uppercase
                            [&_.p-datatable-thead>tr>th]:!tracking-[0.1em]
                            [&_.p-datatable-thead>tr>th]:!font-semibold
                            [&_.p-datatable-thead>tr>th]:!border-b-2
                            [&_.p-datatable-thead>tr>th]:!border-teal-600
                            [&_.p-datatable-thead>tr>th]:!py-2.5
                            [&_.p-datatable-thead>tr>th]:!px-5
                            [&_.p-datatable-thead>tr>th]:!whitespace-nowrap
                            [&_.p-datatable-tbody>tr]:!transition-colors
                            [&_.p-datatable-tbody>tr]:hover:!bg-teal-50/50
                            [&_.p-datatable-tbody>tr.p-row-odd]:!bg-slate-50/30
                            [&_.p-datatable-tbody>tr>td]:!text-[12.5px]
                            [&_.p-datatable-tbody>tr>td]:!py-3
                            [&_.p-datatable-tbody>tr>td]:!px-5
                            [&_.p-datatable-tbody>tr>td]:!border-b
                            [&_.p-datatable-tbody>tr>td]:!border-slate-100
                            [&_.p-paginator]:!bg-white
                            [&_.p-paginator]:!border-t
                            [&_.p-paginator]:!border-slate-100
                            [&_.p-paginator_.p-highlight]:!bg-teal-600
                            [&_.p-paginator_.p-highlight]:!text-white
                        "
                        currentPageReportTemplate="{first}-{last} / {totalRecords}"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    >
                        <Column header={t('userMgmt.list.colUser')} body={renderName} sortable sortField="name" />
                        <Column header={t('userMgmt.list.colEmail')} body={renderEmail} sortable sortField="email" />
                        <Column header={t('userMgmt.list.colRole')} body={renderRole} sortable sortField="role" />
                        <Column header={t('userMgmt.list.colStatus')} body={renderStatus} sortable sortField="status" />
                        <Column header={t('userMgmt.list.colActions')} body={renderActions} style={{ width: 180, textAlign: 'center' }} />
                    </DataTable>
                )}
            </Paper>

            {/* Modal reset password — affiche MDP si email non envoye */}
            <Modal
                opened={resetResult !== null}
                onClose={() => setResetResult(null)}
                title={<Text fw={600}>{t('userMgmt.list.resetTitle')}</Text>}
                centered
                size="md"
            >
                {resetResult && (
                    <Stack gap="md">
                        <Alert
                            color={resetResult.emailSent ? 'teal' : 'orange'}
                            icon={resetResult.emailSent ? <IconCircleCheck size={16} /> : <IconAlertCircle size={16} />}
                        >
                            {resetResult.emailSent ? (
                                <Text size="sm">{t('userMgmt.list.resetEmailSent', { login: resetResult.login })}</Text>
                            ) : (
                                <Text size="sm">{t('userMgmt.list.resetEmailNotSent')}</Text>
                            )}
                        </Alert>

                        {resetResult.tempPassword && (
                            <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6}>
                                    {t('userMgmt.list.resetTempLabel', { login: resetResult.login })}
                                </Text>
                                <Group gap={6}>
                                    <Code style={{ fontSize: 14, padding: '6px 10px' }}>
                                        {resetResult.tempPassword}
                                    </Code>
                                    <CopyButton value={resetResult.tempPassword}>
                                        {({ copied, copy }) => (
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color={copied ? 'teal' : 'gray'}
                                                leftSection={<IconCopy size={12} />}
                                                onClick={copy}
                                            >
                                                {copied ? t('userMgmt.list.copied') : t('userMgmt.list.copy')}
                                            </Button>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Paper>
                        )}

                        <Button color="teal" onClick={() => setResetResult(null)}>
                            {t('userMgmt.list.close')}
                        </Button>
                    </Stack>
                )}
            </Modal>

            {/* Modal confirmation toggle status */}
            <Modal
                opened={statusConfirm !== null}
                onClose={() => setStatusConfirm(null)}
                title={<Text fw={600}>{t('userMgmt.list.confirmTitle')}</Text>}
                centered
                size="sm"
            >
                {statusConfirm && (
                    <Stack gap="md">
                        <Text size="sm">
                            {t('userMgmt.list.confirmIntro')}{' '}
                            <strong>
                                {(statusConfirm.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? t('userMgmt.list.confirmDeactivate') : t('userMgmt.list.confirmActivate')}
                            </strong>{' '}
                            <strong>{statusConfirm.name}</strong> (@{statusConfirm.login}) ?
                        </Text>
                        {(statusConfirm.status || 'ACTIVE').toUpperCase() === 'ACTIVE' && (
                            <Alert color="orange" icon={<IconAlertCircle size={14} />}>
                                <Text size="xs">{t('userMgmt.list.deactivateWarning')}</Text>
                            </Alert>
                        )}
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setStatusConfirm(null)}>
                                {t('userMgmt.list.cancel')}
                            </Button>
                            <Button
                                color={(statusConfirm.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'red' : 'teal'}
                                onClick={handleToggleStatus}
                            >
                                {t('userMgmt.list.confirm')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
}

