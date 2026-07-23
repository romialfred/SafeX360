import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ActionIcon, Alert, Badge, Button, Card, Group, Loader, Modal, Pagination, ScrollArea,
    Select, Switch, Table, Tabs, Text, TextInput, Title, Tooltip,
} from '@mantine/core';
import {
    IconAlertTriangle, IconArrowLeft, IconCheck, IconClipboardList, IconDeviceDesktop,
    IconHistory, IconLock, IconRefresh, IconSearch, IconShieldCheck, IconUserCircle,
} from '@tabler/icons-react';

import {
    disableUserMfa, enableUserMfa, getAccountModules, getModuleCatalog, getUserActivity,
    getUserOverview, getUserSessions, resetUserMfa, updateAccountModules,
    type ModuleCatalogCategory, type UserActivityRow, type UserOverview, type UserSessionRow,
} from '../../../services/UserTraceabilityService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';

/**
 * FICHE UTILISATEUR — écran unique de consultation et d'administration d'un compte.
 *
 * Remplace à la fois l'ancienne page d'édition des permissions et l'ancienne page
 * de détails : deux écrans distincts pour un même compte finissaient toujours par
 * diverger, et c'est l'ancien qui s'ouvrait au clic sur « Modifier ».
 *
 * Quatre onglets, un par question que se pose l'administrateur :
 *   Profil       — qui est cette personne dans l'organisation
 *   Droits       — ce à quoi elle a accès (matrice complète, issue du serveur)
 *   Connexions   — quand elle s'est connectée, depuis où, avec quel second facteur
 *   Activité     — ce qu'elle a consulté et ce qu'elle a fait
 */

const CATEGORY_LABELS: Record<string, string> = {
    general: 'Général',
    incidents: 'Incidents',
    errorManagement: 'Gestion des erreurs',
    preventive: 'Prévention',
    corrective: 'Actions correctives',
    risks: 'Risques',
    ppe: 'EPI',
    audits: 'Audits',
    compliance: 'Conformité',
    documentation: 'Documentation',
    communication: 'Communication',
    performance: 'Performance',
    administration: 'Administration',
    mineManaged: 'Modules activés par mine',
};

const MODULE_LABELS: Record<string, string> = {
    home: 'Accueil', notifications: 'Centre de notifications',
    incidentManagement: 'Gestion des incidents', investigations: 'Investigations',
    actionPlansInc: "Plans d'actions (incidents)", nonConformity: 'Non-conformités',
    errorManagement: 'Gestion des erreurs',
    inspections: 'Inspections HSE', meetings: 'Réunions sécurité',
    managementTour: 'Tournées leadership', equipmentRegistry: 'Registre des équipements',
    pendingActions: 'Actions en attente', actionPlan: "Plan d'actions",
    recommendations: 'Recommandations', adhocActions: "Suggestions d'amélioration",
    riskOverview: "Vue d'ensemble des risques", riskRegister: 'Registre des risques',
    riskAssessment: 'Évaluation des risques', chemicalRegister: 'Registre chimique',
    riskOpportunities: 'Opportunités SST',
    ppeOverview: "Vue d'ensemble EPI", ppeMonitoring: 'Suivi des EPI', ppeRequest: "Demande d'EPI",
    auditProgram: "Programme d'audit", auditPlan: "Plan annuel d'audits",
    audits: 'Audits ISO 19011', auditRecommendations: 'Recommandations audit',
    complianceDashboard: 'Tableau de bord conformité', requirements: 'Exigences légales',
    positionAssignments: 'Affectations par poste', employeeAssignments: 'Affectations employés',
    documents: 'Documents', documentValidation: 'Validation des documents',
    lessonsLearned: "Retours d'expérience", documentManager: 'Gestionnaire de documents',
    isoDocuments: 'Standards ISO', processDocs: 'Processus de travail',
    commDashboard: 'Tableau de bord communication', employeeComm: 'Communications HSE',
    targetForecast: 'Cibles et prévisions',
    usersManagement: 'Gestion des utilisateurs', settings: 'Paramètres',
    modulesManagement: 'Gestion des modules',
    emergency: 'Gestion des urgences', dosimetry: 'Dosimétrie & expositions',
    blast: 'Gestion des dynamitages', planning: 'Planification annuelle',
    reports: 'Rapports & analytics',
};

const moduleLabel = (key: string) => MODULE_LABELS[key] ?? key;

const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

/** Durée lisible entre deux instants (« 1 h 12 min »). */
const duration = (from?: string | null, to?: string | null): string => {
    if (!from) return '—';
    const start = new Date(from).getTime();
    const end = to ? new Date(to).getTime() : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
    const minutes = Math.round((end - start) / 60000);
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
};

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'teal', UPDATE: 'blue', DELETE: 'red', VALIDATE: 'violet', OTHER: 'gray',
};

const ACTION_LABELS: Record<string, string> = {
    CREATE: 'Création', UPDATE: 'Modification', DELETE: 'Suppression',
    VALIDATE: 'Validation', OTHER: 'Autre',
};

export default function UserProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const accountId = Number(id);

    const [overview, setOverview] = useState<UserOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Droits
    const [catalog, setCatalog] = useState<ModuleCatalogCategory[]>([]);
    const [granted, setGranted] = useState<Set<string>>(new Set());
    const [initialGranted, setInitialGranted] = useState<Set<string>>(new Set());
    const [savingRights, setSavingRights] = useState(false);
    const [moduleFilter, setModuleFilter] = useState('');

    // Connexions / activité
    const [sessions, setSessions] = useState<UserSessionRow[]>([]);
    const [sessionPage, setSessionPage] = useState(1);
    const [sessionTotal, setSessionTotal] = useState(0);
    const [activity, setActivity] = useState<UserActivityRow[]>([]);
    const [activityKind, setActivityKind] = useState<string>('');
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotal, setActivityTotal] = useState(0);

    const [mfaBusy, setMfaBusy] = useState(false);
    const [confirmDisable, setConfirmDisable] = useState(false);

    const tab = searchParams.get('tab') || 'profile';
    const setTab = (value: string | null) => {
        // L'onglet vit dans l'URL : un lien vers « Connexions » reste un lien vers
        // « Connexions », et le retour arrière du navigateur fait ce qu'on attend.
        const next = new URLSearchParams(searchParams);
        next.set('tab', value || 'profile');
        setSearchParams(next, { replace: true });
    };

    const loadOverview = useCallback(async () => {
        try {
            setOverview(await getUserOverview(accountId));
            setLoadError(null);
        } catch (e: any) {
            setLoadError(e?.response?.status === 403
                ? "Accès réservé aux administrateurs."
                : "Impossible de charger cette fiche utilisateur.");
        }
    }, [accountId]);

    useEffect(() => {
        if (!Number.isFinite(accountId)) {
            setLoadError('Identifiant de compte invalide.');
            setLoading(false);
            return;
        }
        (async () => {
            setLoading(true);
            await loadOverview();
            try {
                const [cat, mods] = await Promise.all([getModuleCatalog(), getAccountModules(accountId)]);
                setCatalog(cat);
                setGranted(new Set(mods));
                setInitialGranted(new Set(mods));
            } catch {
                // La matrice reste vide plutôt que fausse : mieux vaut un onglet qui
                // dit ne pas savoir qu'un onglet qui affiche des droits inventés.
                setCatalog([]);
            }
            setLoading(false);
        })();
    }, [accountId, loadOverview]);

    useEffect(() => {
        if (!Number.isFinite(accountId) || tab !== 'sessions') return;
        getUserSessions(accountId, sessionPage - 1, 25)
            .then((p) => { setSessions(p.content); setSessionTotal(p.total); })
            .catch(() => { setSessions([]); setSessionTotal(0); });
    }, [accountId, tab, sessionPage]);

    useEffect(() => {
        if (!Number.isFinite(accountId) || tab !== 'activity') return;
        getUserActivity(accountId, (activityKind || undefined) as any, activityPage - 1, 50)
            .then((p) => { setActivity(p.content); setActivityTotal(p.total); })
            .catch(() => { setActivity([]); setActivityTotal(0); });
    }, [accountId, tab, activityKind, activityPage]);

    const dirty = useMemo(() => {
        if (granted.size !== initialGranted.size) return true;
        for (const key of granted) if (!initialGranted.has(key)) return true;
        return false;
    }, [granted, initialGranted]);

    const toggleModule = (key: string) => {
        setGranted((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleCategory = (modules: { key: string }[], enable: boolean) => {
        setGranted((prev) => {
            const next = new Set(prev);
            modules.forEach((m) => (enable ? next.add(m.key) : next.delete(m.key)));
            return next;
        });
    };

    const saveRights = async () => {
        setSavingRights(true);
        try {
            await updateAccountModules(accountId, Array.from(granted), overview?.role);
            setInitialGranted(new Set(granted));
            successNotification('Droits enregistrés : les modules autorisés ont été mis à jour.');
        } catch (e: any) {
            errorNotification(e?.response?.data?.message
                || "Enregistrement impossible : les droits n'ont pas pu être enregistrés.");
        } finally {
            setSavingRights(false);
        }
    };

    const applyMfa = async (action: 'enable' | 'disable' | 'reset') => {
        setMfaBusy(true);
        try {
            const result = action === 'enable' ? await enableUserMfa(accountId)
                : action === 'disable' ? await disableUserMfa(accountId)
                    : await resetUserMfa(accountId);
            await loadOverview();
            successNotification(result?.message || "L'état du second facteur a été modifié.");
        } catch (e: any) {
            const data = e?.response?.data;
            errorNotification(data?.errorMessage || data?.message
                || "Action refusée : elle n'a pas pu être appliquée.");
        } finally {
            setMfaBusy(false);
            setConfirmDisable(false);
        }
    };

    const filteredCatalog = useMemo(() => {
        const needle = moduleFilter.trim().toLowerCase();
        if (!needle) return catalog;
        return catalog
            .map((c) => ({
                ...c,
                modules: c.modules.filter((m) =>
                    moduleLabel(m.key).toLowerCase().includes(needle) || m.key.toLowerCase().includes(needle)),
            }))
            .filter((c) => c.modules.length > 0);
    }, [catalog, moduleFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader color="teal" />
            </div>
        );
    }

    if (loadError || !overview) {
        return (
            <div className="p-6">
                <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}
                    onClick={() => navigate('/users-admin')}>
                    Retour à la liste
                </Button>
                <Alert color="red" icon={<IconAlertTriangle size={18} />} mt="md">
                    {loadError ?? 'Fiche indisponible.'}
                </Alert>
            </div>
        );
    }

    const mfaStateColor = overview.mfa.exempt ? 'red' : overview.mfa.enrolled ? 'teal' : 'orange';
    const mfaStateLabel = overview.mfa.exempt
        ? 'Désactivé (dispense administrative)'
        : overview.mfa.enrolled ? 'Actif et enrôlé' : 'Exigé — enrôlement en attente';

    return (
        <div className="p-4 sm:p-6 w-full">
            <Group justify="space-between" align="flex-start" mb="md" wrap="wrap">
                <Group gap="sm">
                    <ActionIcon variant="subtle" size="lg" onClick={() => navigate('/users-admin')}
                        aria-label="Retour à la liste des utilisateurs">
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <div>
                        <Title order={3}>{overview.name || overview.login}</Title>
                        <Text size="sm" c="dimmed">{overview.login}</Text>
                    </div>
                </Group>
                <Group gap="xs">
                    <Badge color={overview.status === 'ACTIVE' ? 'teal' : 'gray'} variant="light">
                        {overview.status === 'ACTIVE' ? 'Compte actif' : overview.status || 'Statut inconnu'}
                    </Badge>
                    <Badge color={mfaStateColor} variant="light" leftSection={<IconShieldCheck size={12} />}>
                        2FA — {mfaStateLabel}
                    </Badge>
                </Group>
            </Group>

            {/* En-tête professionnel : ce qui situe la personne dans l'organisation. */}
            <Card withBorder radius="md" mb="md" padding="md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        ['Rôle', overview.role || '—'],
                        ['Mine principale', overview.company || '—'],
                        ['Département', overview.department || '—'],
                        ['Poste', overview.position || '—'],
                        ['Courriel', overview.email || '—'],
                        ['Téléphone', overview.phoneNumber || '—'],
                        ['Dernière connexion', formatDate(overview.stats.lastLoginAt)],
                        ['Source d\'identité', overview.identitySource || 'LOCAL'],
                    ].map(([label, value]) => (
                        <div key={String(label)}>
                            <Text size="xs" c="dimmed" tt="uppercase">{label}</Text>
                            <Text size="sm" fw={500} style={{ wordBreak: 'break-word' }}>{value}</Text>
                        </div>
                    ))}
                </div>
            </Card>

            <Tabs value={tab} onChange={setTab} keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab value="profile" leftSection={<IconUserCircle size={16} />}>Profil</Tabs.Tab>
                    <Tabs.Tab value="rights" leftSection={<IconLock size={16} />}>Droits et permissions</Tabs.Tab>
                    <Tabs.Tab value="sessions" leftSection={<IconHistory size={16} />}>
                        Connexions {overview.stats.sessions ? `(${overview.stats.sessions})` : ''}
                    </Tabs.Tab>
                    <Tabs.Tab value="activity" leftSection={<IconClipboardList size={16} />}>Activité</Tabs.Tab>
                </Tabs.List>

                {/* ───────────────────────── PROFIL + SÉCURITÉ ───────────────────────── */}
                <Tabs.Panel value="profile" pt="md">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card withBorder radius="md" padding="md" className="lg:col-span-2">
                            <Title order={5} mb="sm">Périmètre</Title>
                            <Text size="sm" mb="xs">
                                {overview.allMinesAccess
                                    ? 'Accès à toutes les mines.'
                                    : `Mines autorisées : ${overview.assignedCompanies.length
                                        ? overview.assignedCompanies.map((c) => c.name).join(', ')
                                        : overview.company || 'aucune'}`}
                            </Text>
                            <Group gap="lg" mt="md">
                                <div>
                                    <Text size="xs" c="dimmed" tt="uppercase">Sessions</Text>
                                    <Text fw={600}>{overview.stats.sessions}</Text>
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed" tt="uppercase">Pages consultées</Text>
                                    <Text fw={600}>{overview.stats.pages}</Text>
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed" tt="uppercase">Actions</Text>
                                    <Text fw={600}>{overview.stats.actions}</Text>
                                </div>
                            </Group>
                        </Card>

                        <Card withBorder radius="md" padding="md">
                            <Title order={5} mb="xs">Second facteur (2FA)</Title>
                            <Text size="sm" c="dimmed" mb="sm">{mfaStateLabel}</Text>

                            <Switch
                                checked={!overview.mfa.exempt}
                                disabled={mfaBusy}
                                label="Exiger le second facteur pour ce compte"
                                onChange={(e) => {
                                    if (e.currentTarget.checked) applyMfa('enable');
                                    else setConfirmDisable(true);
                                }}
                            />

                            {overview.mfa.enrolled && !overview.mfa.exempt && (
                                <Button mt="md" variant="light" fullWidth loading={mfaBusy}
                                    leftSection={<IconRefresh size={16} />}
                                    onClick={() => applyMfa('reset')}>
                                    Réinitialiser l'enrôlement
                                </Button>
                            )}

                            {overview.mfa.exempt && (
                                <Alert color="red" mt="md" icon={<IconAlertTriangle size={16} />}>
                                    Ce compte est dispensé de second facteur. Il se connecte avec son seul
                                    mot de passe.
                                </Alert>
                            )}
                        </Card>
                    </div>
                </Tabs.Panel>

                {/* ───────────────────────── DROITS ───────────────────────── */}
                <Tabs.Panel value="rights" pt="md">
                    <Group justify="space-between" mb="sm" wrap="wrap">
                        <TextInput
                            placeholder="Rechercher un module…"
                            leftSection={<IconSearch size={16} />}
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.currentTarget.value)}
                            style={{ minWidth: 260 }}
                        />
                        <Group gap="xs">
                            {dirty && <Badge color="orange" variant="light">Modifications non enregistrées</Badge>}
                            <Button leftSection={<IconCheck size={16} />} loading={savingRights}
                                disabled={!dirty} onClick={saveRights}>
                                Enregistrer les droits
                            </Button>
                        </Group>
                    </Group>

                    {catalog.length === 0 && (
                        <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
                            Le catalogue des modules n'a pas pu être chargé. Aucun droit n'est affiché —
                            plutôt qu'une liste incomplète qui donnerait une fausse impression d'exhaustivité.
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCatalog.map((cat) => {
                            const allOn = cat.modules.every((m) => granted.has(m.key));
                            return (
                                <Card key={cat.category} withBorder radius="md" padding="md">
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={600}>{CATEGORY_LABELS[cat.category] ?? cat.category}</Text>
                                        <Button size="compact-xs" variant="subtle"
                                            onClick={() => toggleCategory(cat.modules, !allOn)}>
                                            {allOn ? 'Tout retirer' : 'Tout accorder'}
                                        </Button>
                                    </Group>
                                    {cat.category === 'mineManaged' && (
                                        <Text size="xs" c="dimmed" mb="xs">
                                            Ces modules exigent AUSSI d'être activés sur la mine : accorder le
                                            droit ici ne suffit pas si le module est désactivé pour la mine.
                                        </Text>
                                    )}
                                    {cat.modules.map((m) => (
                                        <Group key={m.key} justify="space-between" py={4}>
                                            <Text size="sm">{moduleLabel(m.key)}</Text>
                                            <Switch
                                                size="sm"
                                                checked={granted.has(m.key)}
                                                onChange={() => toggleModule(m.key)}
                                                aria-label={`Autoriser ${moduleLabel(m.key)}`}
                                            />
                                        </Group>
                                    ))}
                                </Card>
                            );
                        })}
                    </div>
                </Tabs.Panel>

                {/* ───────────────────────── CONNEXIONS ───────────────────────── */}
                <Tabs.Panel value="sessions" pt="md">
                    <ScrollArea>
                        <Table striped highlightOnHover withTableBorder miw={860}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Début</Table.Th>
                                    <Table.Th>Fin</Table.Th>
                                    <Table.Th>Durée</Table.Th>
                                    <Table.Th>2FA</Table.Th>
                                    <Table.Th>Adresse IP</Table.Th>
                                    <Table.Th>Navigateur / appareil</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {sessions.map((s) => (
                                    <Table.Tr key={s.id}>
                                        <Table.Td>{formatDate(s.startedAt)}</Table.Td>
                                        <Table.Td>
                                            {s.open
                                                ? <Badge color="teal" variant="light" leftSection={<IconDeviceDesktop size={12} />}>En cours</Badge>
                                                : formatDate(s.endedAt)}
                                        </Table.Td>
                                        <Table.Td>{duration(s.startedAt, s.endedAt)}</Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light" color={s.mfaUsed ? 'teal' : 'gray'}>
                                                {s.mfaUsed ? 'Oui' : 'Non'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{s.ipAddress || '—'}</Table.Td>
                                        <Table.Td>
                                            <Tooltip label={s.userAgent || '—'} multiline w={320}>
                                                <Text size="xs" lineClamp={1} style={{ maxWidth: 260 }}>
                                                    {s.userAgent || '—'}
                                                </Text>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {sessions.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={6}>
                                            <Text size="sm" c="dimmed" ta="center" py="md">
                                                Aucune connexion enregistrée pour ce compte.
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                    {sessionTotal > 25 && (
                        <Group justify="center" mt="md">
                            <Pagination value={sessionPage} onChange={setSessionPage}
                                total={Math.ceil(sessionTotal / 25)} />
                        </Group>
                    )}
                </Tabs.Panel>

                {/* ───────────────────────── ACTIVITÉ ───────────────────────── */}
                <Tabs.Panel value="activity" pt="md">
                    <Group mb="sm">
                        <Select
                            value={activityKind}
                            onChange={(v) => { setActivityKind(v || ''); setActivityPage(1); }}
                            data={[
                                { value: '', label: 'Tout' },
                                { value: 'ACTION', label: 'Actions (création, modification, suppression…)' },
                                { value: 'PAGE', label: 'Pages consultées' },
                            ]}
                            style={{ minWidth: 320 }}
                        />
                    </Group>
                    <ScrollArea>
                        <Table striped highlightOnHover withTableBorder miw={860}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Nature</Table.Th>
                                    <Table.Th>Objet</Table.Th>
                                    <Table.Th>Détail</Table.Th>
                                    <Table.Th>Origine</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {activity.map((a) => (
                                    <Table.Tr key={a.id}>
                                        <Table.Td>{formatDate(a.occurredAt)}</Table.Td>
                                        <Table.Td>
                                            {a.kind === 'ACTION' ? (
                                                <Badge size="sm" variant="light"
                                                    color={ACTION_COLORS[a.actionType || 'OTHER'] || 'gray'}>
                                                    {ACTION_LABELS[a.actionType || 'OTHER'] || 'Action'}
                                                </Badge>
                                            ) : (
                                                <Badge size="sm" variant="light" color="gray">Page</Badge>
                                            )}
                                        </Table.Td>
                                        <Table.Td>{a.label || '—'}</Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 420 }}>
                                                {a.method ? `${a.method} ` : ''}{a.path || '—'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {/* Un fait constaté par le serveur et une navigation déclarée par
                                                le client n'ont pas la même valeur probante : on le montre. */}
                                            <Badge size="xs" variant="outline"
                                                color={a.source === 'SERVER' ? 'teal' : 'gray'}>
                                                {a.source === 'SERVER' ? 'Serveur' : a.source || 'Client'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {activity.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={5}>
                                            <Text size="sm" c="dimmed" ta="center" py="md">
                                                Aucune activité enregistrée sur la période.
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                    {activityTotal > 50 && (
                        <Group justify="center" mt="md">
                            <Pagination value={activityPage} onChange={setActivityPage}
                                total={Math.ceil(activityTotal / 50)} />
                        </Group>
                    )}
                </Tabs.Panel>
            </Tabs>

            {/* Retirer une protection se confirme : c'est une décision, pas un réflexe. */}
            <Modal opened={confirmDisable} onClose={() => setConfirmDisable(false)}
                title="Désactiver le second facteur ?" centered>
                <Text size="sm" mb="md">
                    Ce compte pourra se connecter avec son seul mot de passe. Le secret d'authentification
                    existant sera effacé : réactiver la 2FA imposera un nouvel enrôlement.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setConfirmDisable(false)}>Annuler</Button>
                    <Button color="red" loading={mfaBusy} onClick={() => applyMfa('disable')}>
                        Désactiver
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}
