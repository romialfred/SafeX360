/**
 * UsersAdminPage — Page principale de gestion des utilisateurs (LOT 49).
 *
 * Fonctionnalites :
 *  - Liste des comptes (nom, login, email, role, statut)
 *  - Filtres : recherche, statut (ACTIVE/INACTIVE), role
 *  - Actions par ligne : reinitialiser MDP, activer/desactiver, editer modules
 *  - Action header : creer un nouvel utilisateur (CreateUserWizard)
 *
 * Securite frontend :
 *  - Reservee aux administrateurs (verifie via usePermissions().isAdmin)
 *  - Confirmation Mantine pour les actions sensibles
 *  - Affichage des MDP temporaires uniquement si email NON envoye
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Paper, Group, Button, TextInput, Select, Badge, ActionIcon, Tooltip, Modal,
    Text, Stack, Code, CopyButton, Alert, Box, Loader, Title,
} from '@mantine/core';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import {
    IconUserPlus, IconRefresh, IconSearch, IconLock, IconPower, IconEdit,
    IconAlertCircle, IconShieldLock, IconUsers, IconCopy, IconCircleCheck,
} from '@tabler/icons-react';
import CreateUserWizard from './CreateUserWizard';
import PageHeader from '../../UtilityComp/PageHeader';
import { usePermissions } from '../../../hooks/usePermissions';
import { getAllAccounts } from '../../../services/AccountService';
import { resetUserPassword, toggleUserStatus } from '../../../services/UserManagementService';
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

const ROLE_LABEL: Record<string, string> = {
    SYSTEM_ADMINISTRATOR: 'Admin Systeme',
    Administrator: 'Administrateur',
    HEALTH_SAFETY_COORDINATOR: 'Coordinateur HSE',
    INCIDENT_INVESTIGATOR: 'Enqueteur',
    AUDITOR: 'Auditeur',
    EMPLOYEE: 'Employe',
    BLAST_OFFICER: 'Boutefeu',
    HSE_MANAGER: 'Manager HSE',
};

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────

export default function UsersAdminPage() {
    const navigate = useNavigate();
    const perms = usePermissions();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>('ALL');
    const [roleFilter, setRoleFilter] = useState<string | null>('ALL');

    const [wizardOpen, setWizardOpen] = useState(false);

    // Modal reset password — affiche le MDP temporaire si email non envoye
    const [resetResult, setResetResult] = useState<{ login: string; tempPassword: string | null; emailSent: boolean } | null>(null);

    // Modal confirmation toggle status
    const [statusConfirm, setStatusConfirm] = useState<Account | null>(null);

    // ─── Chargement ───
    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await getAllAccounts();
            setAccounts(Array.isArray(res) ? res : []);
        } catch (e: any) {
            errorNotification('Impossible de charger la liste des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
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
            successNotification(`Mot de passe reinitialise pour ${account.login}`);
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || 'Erreur lors de la reinitialisation');
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
            errorNotification(e?.response?.data?.errorMessage || 'Erreur lors du changement de statut');
        }
    };

    // ─── Rendu cellules ───
    const renderName = (row: Account) => (
        <Stack gap={2}>
            <Text size="sm" fw={500}>{row.name || '—'}</Text>
            <Text size="xs" c="dimmed">@{row.login}</Text>
        </Stack>
    );

    const renderEmail = (row: Account) => (
        <Text size="xs" c="dimmed">{row.email || '—'}</Text>
    );

    const renderRole = (row: Account) => (
        <Badge color={ROLE_COLOR[row.role] || 'gray'} variant="light" size="sm">
            {ROLE_LABEL[row.role] || row.role || '—'}
        </Badge>
    );

    const renderStatus = (row: Account) => {
        const s = (row.status || 'ACTIVE').toUpperCase();
        return (
            <Badge color={s === 'ACTIVE' ? 'teal' : 'gray'} variant={s === 'ACTIVE' ? 'filled' : 'light'} size="sm">
                {s === 'ACTIVE' ? 'Actif' : 'Inactif'}
            </Badge>
        );
    };

    const renderActions = (row: Account) => (
        <Group gap={4} justify="center">
            <Tooltip label="Editer les modules autorises">
                <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={() => navigate(`/users-management/edit/${row.id}`)}
                >
                    <IconEdit size={14} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Reinitialiser le mot de passe">
                <ActionIcon
                    variant="light"
                    color="orange"
                    size="sm"
                    onClick={() => handleResetPassword(row)}
                >
                    <IconLock size={14} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label={(row.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Desactiver le compte' : 'Activer le compte'}>
                <ActionIcon
                    variant="light"
                    color={(row.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'red' : 'teal'}
                    size="sm"
                    onClick={() => setStatusConfirm(row)}
                >
                    <IconPower size={14} />
                </ActionIcon>
            </Tooltip>
        </Group>
    );

    // ─── Garde RBAC ───
    if (!perms.loading && !perms.isAdmin) {
        return (
            <Box p="lg">
                <Alert color="red" icon={<IconShieldLock size={16} />}>
                    <Text fw={600}>Acces refuse</Text>
                    <Text size="sm">Seuls les administrateurs peuvent gerer les utilisateurs.</Text>
                </Alert>
            </Box>
        );
    }

    // ─── KPI ───
    const stats = useMemo(() => {
        const total = accounts.length;
        const active = accounts.filter((a) => (a.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
        const inactive = total - active;
        const admins = accounts.filter((a) => a.role === 'Administrator' || a.role === 'SYSTEM_ADMINISTRATOR').length;
        return { total, active, inactive, admins };
    }, [accounts]);

    return (
        <Box p="md">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Administration' },
                    { label: 'Gestion des utilisateurs' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="teal"
                title="Gestion des utilisateurs"
                subtitle="Comptes, roles et permissions par module"
                actions={
                    <Group gap="xs">
                        <Button
                            variant="default"
                            size="sm"
                            leftSection={<IconRefresh size={14} />}
                            onClick={loadAccounts}
                            disabled={loading}
                        >
                            Rafraichir
                        </Button>
                        <Button
                            size="sm"
                            leftSection={<IconUserPlus size={14} />}
                            onClick={() => setWizardOpen(true)}
                            styles={{
                                root: {
                                    background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                    fontWeight: 600,
                                },
                            }}
                        >
                            Nouvel utilisateur
                        </Button>
                    </Group>
                }
            />

            {/* KPI cards */}
            <Group grow gap="sm" mb="md" mt="md">
                <KpiCard label="Total comptes" value={stats.total} color="slate" />
                <KpiCard label="Actifs" value={stats.active} color="teal" />
                <KpiCard label="Inactifs" value={stats.inactive} color="gray" />
                <KpiCard label="Administrateurs" value={stats.admins} color="red" />
            </Group>

            {/* Filtres */}
            <Paper p="sm" radius="md" style={{ border: '1px solid #E2E8F0' }} mb="md">
                <Group gap="sm">
                    <TextInput
                        placeholder="Rechercher par nom, login ou email…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1, minWidth: 280 }}
                        size="sm"
                    />
                    <Select
                        placeholder="Statut"
                        data={[
                            { value: 'ALL', label: 'Tous les statuts' },
                            { value: 'ACTIVE', label: 'Actifs uniquement' },
                            { value: 'INACTIVE', label: 'Inactifs uniquement' },
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        size="sm"
                        w={180}
                    />
                    <Select
                        placeholder="Role"
                        data={[
                            { value: 'ALL', label: 'Tous les roles' },
                            ...Object.entries(ROLE_LABEL).map(([v, l]) => ({ value: v, label: l })),
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
                        <Text size="sm" c="dimmed" mt={12}>Chargement des comptes…</Text>
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
                                <Text size="sm" c="dimmed">Aucun utilisateur ne correspond aux filtres</Text>
                            </Box>
                        }
                        size="small"
                        stripedRows
                        className="[&_.p-datatable-tbody]:!text-sm"
                        currentPageReportTemplate="Affichage {first}-{last} sur {totalRecords}"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    >
                        <Column header="Utilisateur" body={renderName} sortable sortField="name" />
                        <Column header="Email" body={renderEmail} sortable sortField="email" />
                        <Column header="Role" body={renderRole} sortable sortField="role" />
                        <Column header="Statut" body={renderStatus} sortable sortField="status" />
                        <Column header="Actions" body={renderActions} style={{ width: 160, textAlign: 'center' }} />
                    </DataTable>
                )}
            </Paper>

            {/* Wizard creation */}
            <CreateUserWizard
                opened={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onCreated={() => {
                    setWizardOpen(false);
                    loadAccounts();
                }}
            />

            {/* Modal reset password — affiche MDP si email non envoye */}
            <Modal
                opened={resetResult !== null}
                onClose={() => setResetResult(null)}
                title={<Text fw={600}>Mot de passe reinitialise</Text>}
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
                                <Text size="sm">
                                    Un email a ete envoye a <strong>{resetResult.login}</strong> avec son nouveau
                                    mot de passe temporaire. L'utilisateur devra le changer a sa prochaine connexion.
                                </Text>
                            ) : (
                                <Text size="sm">
                                    Email <strong>non envoye</strong>. Communiquez le mot de passe ci-dessous a
                                    l'utilisateur de maniere securisee.
                                </Text>
                            )}
                        </Alert>

                        {resetResult.tempPassword && (
                            <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6}>
                                    Mot de passe temporaire pour {resetResult.login}
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
                                                {copied ? 'Copie !' : 'Copier'}
                                            </Button>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Paper>
                        )}

                        <Button color="teal" onClick={() => setResetResult(null)}>
                            Fermer
                        </Button>
                    </Stack>
                )}
            </Modal>

            {/* Modal confirmation toggle status */}
            <Modal
                opened={statusConfirm !== null}
                onClose={() => setStatusConfirm(null)}
                title={<Text fw={600}>Confirmation</Text>}
                centered
                size="sm"
            >
                {statusConfirm && (
                    <Stack gap="md">
                        <Text size="sm">
                            Voulez-vous vraiment{' '}
                            <strong>
                                {(statusConfirm.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'desactiver' : 'activer'}
                            </strong>{' '}
                            le compte de <strong>{statusConfirm.name}</strong> (@{statusConfirm.login}) ?
                        </Text>
                        {(statusConfirm.status || 'ACTIVE').toUpperCase() === 'ACTIVE' && (
                            <Alert color="orange" icon={<IconAlertCircle size={14} />}>
                                <Text size="xs">
                                    L'utilisateur ne pourra plus se connecter tant que son compte est desactive.
                                </Text>
                            </Alert>
                        )}
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setStatusConfirm(null)}>
                                Annuler
                            </Button>
                            <Button
                                color={(statusConfirm.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'red' : 'teal'}
                                onClick={handleToggleStatus}
                            >
                                Confirmer
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT KPI
// ─────────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
    const bgMap: Record<string, string> = {
        slate: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        teal: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
        gray: 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
        red: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)',
    };
    return (
        <Paper
            radius="md"
            p="md"
            style={{
                background: bgMap[color] || bgMap.slate,
                color: 'white',
                boxShadow: '0 6px 16px -6px rgba(0,0,0,0.15)',
            }}
        >
            <Text size="xs" tt="uppercase" style={{ opacity: 0.8, letterSpacing: 0.5 }}>
                {label}
            </Text>
            <Title order={2} mt={4} style={{ color: 'white', fontWeight: 600 }}>
                {value}
            </Title>
        </Paper>
    );
}
