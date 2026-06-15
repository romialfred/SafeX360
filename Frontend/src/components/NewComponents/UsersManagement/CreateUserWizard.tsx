/**
 * CreateUserWizard — Modal wizard 2 etapes pour creer un nouvel utilisateur SafeX 360.
 *
 * Etape 1 : Compte (login, email, nom, telephone, role predefini)
 * Etape 2 : Modules autorises (matrice ON/OFF, pre-rempli depuis le role)
 * Etape 3 : Confirmation + affichage du MDP temporaire si email non envoye
 *
 * Validation client identique au backend (validateLogin, validateEmail, etc.)
 * Submit atomique : appelle POST /admin/users/create qui cree compte + permissions + email.
 */

import { useState, useMemo, useEffect } from 'react';
import {
    Modal, Stepper, TextInput, Select, Button, Group, Stack, Switch, Paper, Text, Badge,
    Alert, Code, CopyButton, Box, ScrollArea, Divider, Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconUser, IconMail, IconPhone, IconShieldCheck, IconChevronRight, IconChevronLeft,
    IconCheck, IconCopy, IconAlertCircle, IconCircleCheck, IconUsers,
} from '@tabler/icons-react';
import {
    createUser, validateLogin, validateEmail,
    CreateUserResponse,
} from '../../../services/UserManagementService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import WelcomeMessageModal from './WelcomeMessageModal';

interface Props {
    opened: boolean;
    onClose: () => void;
    onCreated?: (resp: CreateUserResponse) => void;
}

// ─────────────────────────────────────────────────────────────────────────
// ROLES PREDEFINIS (synchronises avec roles.tsx cote frontend et backend)
// ─────────────────────────────────────────────────────────────────────────

const PREDEFINED_ROLES = [
    {
        value: 'SYSTEM_ADMINISTRATOR',
        label: 'Administrateur Systeme',
        description: 'Acces total a tous les modules + parametres systeme',
        color: 'red',
        defaultModules: [
            'home', 'nonConformity', 'inspections', 'meetings', 'managementTour',
            'ppeOverview', 'ppeMonitoring', 'ppeRequest',
            'incidentManagement', 'investigations', 'actionPlansInc',
            'pendingActions', 'actionPlan', 'recommendations', 'adhocActions',
            'auditPlan', 'audits', 'auditRecommendations',
            'complianceDashboard', 'requirements', 'positionAssignments', 'employeeAssignments',
            'riskOverview', 'riskRegister', 'riskAssessment', 'chemicalRegister',
            'documents', 'documentValidation', 'lessonsLearned', 'documentManager',
            'commDashboard', 'employeeComm', 'notifications',
            'usersManagement', 'settings',
        ],
    },
    {
        value: 'HEALTH_SAFETY_COORDINATOR',
        label: 'Coordinateur HSE',
        description: 'Supervision des activites HSE — incidents, audits, EPI, risques',
        color: 'teal',
        defaultModules: [
            'home', 'nonConformity', 'inspections', 'meetings',
            'ppeOverview', 'ppeMonitoring', 'ppeRequest',
            'incidentManagement', 'investigations', 'actionPlansInc',
            'pendingActions', 'actionPlan', 'recommendations',
            'auditPlan', 'audits',
            'riskOverview', 'riskRegister', 'riskAssessment',
            'documents', 'commDashboard',
        ],
    },
    {
        value: 'INCIDENT_INVESTIGATOR',
        label: 'Enqueteur Incidents',
        description: 'Specialise sur la declaration et l\'investigation d\'incidents',
        color: 'orange',
        defaultModules: [
            'home', 'incidentManagement', 'investigations', 'actionPlansInc',
            'pendingActions', 'recommendations',
            'complianceDashboard', 'documents',
        ],
    },
    {
        value: 'AUDITOR',
        label: 'Auditeur',
        description: 'Audits, conformite reglementaire, recommandations',
        color: 'blue',
        defaultModules: [
            'home', 'auditPlan', 'audits', 'auditRecommendations',
            'complianceDashboard', 'requirements',
            'riskOverview', 'riskRegister',
            'documents', 'documentValidation',
        ],
    },
    {
        value: 'EMPLOYEE',
        label: 'Employe (self-service)',
        description: 'Declaration d\'incidents, demande EPI, consultation documents',
        color: 'gray',
        defaultModules: [
            'home', 'incidentManagement', 'nonConformity',
            'ppeRequest', 'documents',
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────
// CATEGORIES DE MODULES — pour le rendu Etape 2
// ─────────────────────────────────────────────────────────────────────────

interface ModuleCategory {
    name: string;
    color: string;
    modules: { id: string; label: string }[];
}

const MODULE_CATEGORIES: ModuleCategory[] = [
    {
        name: 'Generaux', color: 'gray',
        modules: [
            { id: 'home', label: 'Accueil / Dashboard' },
            { id: 'notifications', label: 'Notifications' },
        ],
    },
    {
        name: 'Incidents & Investigations', color: 'orange',
        modules: [
            { id: 'incidentManagement', label: 'Gestion des incidents' },
            { id: 'investigations', label: 'Investigations' },
            { id: 'actionPlansInc', label: 'Plans d\'actions incidents' },
            { id: 'nonConformity', label: 'Non-conformites' },
        ],
    },
    {
        name: 'Activites Preventives', color: 'teal',
        modules: [
            { id: 'inspections', label: 'Inspections' },
            { id: 'meetings', label: 'Reunions HSE' },
            { id: 'managementTour', label: 'Tournees direction' },
        ],
    },
    {
        name: 'Actions Correctives', color: 'cyan',
        modules: [
            { id: 'pendingActions', label: 'Actions en cours' },
            { id: 'actionPlan', label: 'Plans d\'actions' },
            { id: 'recommendations', label: 'Recommandations' },
            { id: 'adhocActions', label: 'Actions ad-hoc' },
        ],
    },
    {
        name: 'Risques', color: 'red',
        modules: [
            { id: 'riskOverview', label: 'Vue d\'ensemble risques' },
            { id: 'riskRegister', label: 'Registre des risques' },
            { id: 'riskAssessment', label: 'Evaluation des risques' },
            { id: 'chemicalRegister', label: 'Registre chimique' },
        ],
    },
    {
        name: 'EPI', color: 'yellow',
        modules: [
            { id: 'ppeOverview', label: 'Vue d\'ensemble EPI' },
            { id: 'ppeMonitoring', label: 'Suivi EPI' },
            { id: 'ppeRequest', label: 'Demande EPI' },
        ],
    },
    {
        name: 'Audits', color: 'indigo',
        modules: [
            { id: 'auditPlan', label: 'Planification audits' },
            { id: 'audits', label: 'Audits' },
            { id: 'auditRecommendations', label: 'Recommandations audits' },
        ],
    },
    {
        name: 'Conformite', color: 'green',
        modules: [
            { id: 'complianceDashboard', label: 'Dashboard conformite' },
            { id: 'requirements', label: 'Exigences' },
            { id: 'positionAssignments', label: 'Affectations postes' },
            { id: 'employeeAssignments', label: 'Affectations employes' },
        ],
    },
    {
        name: 'Documentation', color: 'violet',
        modules: [
            { id: 'documents', label: 'Documents' },
            { id: 'documentValidation', label: 'Validation documents' },
            { id: 'lessonsLearned', label: 'Lecons apprises' },
            { id: 'documentManager', label: 'Gestionnaire documents' },
        ],
    },
    {
        name: 'Communication', color: 'pink',
        modules: [
            { id: 'commDashboard', label: 'Dashboard communication' },
            { id: 'employeeComm', label: 'Communication employes' },
        ],
    },
    {
        name: 'Administration', color: 'red',
        modules: [
            { id: 'usersManagement', label: 'Gestion utilisateurs' },
            { id: 'settings', label: 'Parametres' },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────

export default function CreateUserWizard({ opened, onClose, onCreated }: Props) {
    const [step, setStep] = useState(0);
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [createdResponse, setCreatedResponse] = useState<CreateUserResponse | null>(null);
    // Modale « Message de bienvenue » premium (affichee apres creation reussie)
    const [welcomeOpen, setWelcomeOpen] = useState(false);
    const [createdName, setCreatedName] = useState('');

    const form = useForm({
        initialValues: {
            login: '',
            email: '',
            name: '',
            phoneNumber: '',
            role: 'EMPLOYEE',
        },
        validate: {
            login: (v) => validateLogin(v),
            email: (v) => validateEmail(v),
            name: (v) => (v.trim().length === 0 ? 'Le nom est requis' : null),
            role: (v) => (v.trim().length === 0 ? 'Le role est requis' : null),
        },
        validateInputOnBlur: true,
    });

    // Quand le role change, pre-remplit les modules
    useEffect(() => {
        const roleDef = PREDEFINED_ROLES.find((r) => r.value === form.values.role);
        if (roleDef) {
            setSelectedModules(new Set(roleDef.defaultModules));
        }
    }, [form.values.role]);

    // Reset a la fermeture
    useEffect(() => {
        if (!opened) {
            setTimeout(() => {
                setStep(0);
                form.reset();
                setSelectedModules(new Set());
                setCreatedResponse(null);
                setWelcomeOpen(false);
                setCreatedName('');
            }, 300);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]);

    const toggleModule = (moduleId: string) => {
        setSelectedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const toggleCategory = (cat: ModuleCategory, on: boolean) => {
        setSelectedModules((prev) => {
            const next = new Set(prev);
            cat.modules.forEach((m) => {
                if (on) next.add(m.id);
                else next.delete(m.id);
            });
            return next;
        });
    };

    const handleNext = () => {
        if (step === 0) {
            const errs = form.validate();
            if (errs.hasErrors) return;
        }
        setStep((s) => Math.min(2, s + 1));
    };

    const handleBack = () => setStep((s) => Math.max(0, s - 1));

    const handleSubmit = async () => {
        if (selectedModules.size === 0) {
            errorNotification('Selectionnez au moins un module pour l\'utilisateur');
            return;
        }
        setSubmitting(true);
        try {
            const resp = await createUser({
                login: form.values.login.trim(),
                email: form.values.email.trim(),
                name: form.values.name.trim(),
                phoneNumber: form.values.phoneNumber.trim() || undefined,
                role: form.values.role,
                allowedModules: Array.from(selectedModules).join(','),
            });
            setCreatedResponse(resp);
            setCreatedName(form.values.name.trim());
            setStep(2);
            successNotification(`Compte ${resp.login} cree avec succes`);
            // Ouvre la modale « Message de bienvenue » premium par-dessus le recapitulatif
            setWelcomeOpen(true);
            onCreated?.(resp);
        } catch (e: any) {
            const code = e?.response?.data?.errorMessage || e?.response?.data?.error;
            if (code === 'LOGIN_ALREADY_EXISTS') {
                form.setFieldError('login', 'Ce login est deja utilise');
                setStep(0);
            } else if (code === 'EMAIL_INVALID') {
                form.setFieldError('email', 'Format email invalide');
                setStep(0);
            } else {
                errorNotification(code || 'Erreur lors de la creation du compte');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const selectedRoleInfo = useMemo(
        () => PREDEFINED_ROLES.find((r) => r.value === form.values.role),
        [form.values.role]
    );

    return (
        <>
        <Modal
            opened={opened}
            onClose={onClose}
            size="xl"
            title={
                <Group gap={8}>
                    <IconUsers size={20} stroke={1.8} color="#0F766E" />
                    <Text fw={600} size="lg">Creer un nouvel utilisateur</Text>
                </Group>
            }
            centered
            closeOnClickOutside={!submitting}
            closeOnEscape={!submitting}
        >
            <Stack gap="md">
                <Stepper active={step} size="sm" color="teal">
                    <Stepper.Step label="Compte" description="Identite + role" icon={<IconUser size={16} />} />
                    <Stepper.Step label="Modules" description="Acces autorises" icon={<IconShieldCheck size={16} />} />
                    <Stepper.Step label="Confirme" description="Recapitulatif" icon={<IconCheck size={16} />} />
                </Stepper>

                <Divider />

                {/* ─── ETAPE 1 : Compte ─── */}
                {step === 0 && (
                    <Stack gap="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <TextInput
                                    label="Login"
                                    placeholder="ex. jdupont"
                                    leftSection={<IconUser size={14} />}
                                    {...form.getInputProps('login')}
                                    required
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <TextInput
                                    label="Email"
                                    placeholder="jean.dupont@mine.com"
                                    leftSection={<IconMail size={14} />}
                                    {...form.getInputProps('email')}
                                    required
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 8 }}>
                                <TextInput
                                    label="Nom complet"
                                    placeholder="DUPONT Jean"
                                    {...form.getInputProps('name')}
                                    required
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <TextInput
                                    label="Telephone"
                                    placeholder="+226 77 96 35 25"
                                    leftSection={<IconPhone size={14} />}
                                    {...form.getInputProps('phoneNumber')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Select
                                    label="Role"
                                    placeholder="Choisir un role predefini"
                                    leftSection={<IconShieldCheck size={14} />}
                                    data={PREDEFINED_ROLES.map((r) => ({ value: r.value, label: r.label }))}
                                    {...form.getInputProps('role')}
                                    required
                                />
                                {selectedRoleInfo && (
                                    <Paper
                                        mt="xs"
                                        p="sm"
                                        radius="md"
                                        style={{
                                            background: '#F0FDFA',
                                            border: `1px solid #99F6E4`,
                                        }}
                                    >
                                        <Group gap={6} mb={4}>
                                            <Badge color={selectedRoleInfo.color} variant="filled" size="sm">
                                                {selectedRoleInfo.label}
                                            </Badge>
                                            <Text size="xs" c="dimmed">
                                                {selectedRoleInfo.defaultModules.length} modules par defaut
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="dimmed">{selectedRoleInfo.description}</Text>
                                    </Paper>
                                )}
                            </Grid.Col>
                        </Grid>

                        <Alert color="blue" variant="light" icon={<IconAlertCircle size={14} />}>
                            <Text size="xs">
                                Un mot de passe temporaire fort sera <strong>genere automatiquement</strong> et envoye
                                par email a l'utilisateur. Il devra le changer obligatoirement lors de sa premiere connexion.
                            </Text>
                        </Alert>
                    </Stack>
                )}

                {/* ─── ETAPE 2 : Modules ─── */}
                {step === 1 && (
                    <Stack gap="sm">
                        <Group justify="space-between" align="center">
                            <Text size="sm" c="dimmed">
                                Cochez les modules auxquels <strong>{form.values.name}</strong> aura acces.
                                Les modules pre-coches correspondent au role <strong>{selectedRoleInfo?.label}</strong>.
                            </Text>
                            <Badge variant="filled" color="teal" size="lg">
                                {selectedModules.size} modules
                            </Badge>
                        </Group>

                        <ScrollArea h={420} type="auto">
                            <Stack gap="sm">
                                {MODULE_CATEGORIES.map((cat) => {
                                    const catSelectedCount = cat.modules.filter((m) => selectedModules.has(m.id)).length;
                                    const allSelected = catSelectedCount === cat.modules.length;
                                    return (
                                        <Paper
                                            key={cat.name}
                                            p="sm"
                                            radius="md"
                                            style={{ border: '1px solid #E2E8F0' }}
                                        >
                                            <Group justify="space-between" mb={8}>
                                                <Group gap={6}>
                                                    <Badge color={cat.color} variant="dot" size="sm">
                                                        {cat.name}
                                                    </Badge>
                                                    <Text size="xs" c="dimmed">
                                                        {catSelectedCount}/{cat.modules.length}
                                                    </Text>
                                                </Group>
                                                <Switch
                                                    size="xs"
                                                    color={cat.color}
                                                    label={allSelected ? 'Tout decocher' : 'Tout cocher'}
                                                    checked={allSelected}
                                                    onChange={(e) => toggleCategory(cat, e.currentTarget.checked)}
                                                />
                                            </Group>
                                            <Grid gutter="xs">
                                                {cat.modules.map((m) => (
                                                    <Grid.Col key={m.id} span={{ base: 12, sm: 6 }}>
                                                        <Switch
                                                            size="sm"
                                                            color={cat.color}
                                                            label={m.label}
                                                            checked={selectedModules.has(m.id)}
                                                            onChange={() => toggleModule(m.id)}
                                                        />
                                                    </Grid.Col>
                                                ))}
                                            </Grid>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </ScrollArea>
                    </Stack>
                )}

                {/* ─── ETAPE 3 : Confirmation ─── */}
                {step === 2 && (
                    <Stack gap="md">
                        {createdResponse ? (
                            <>
                                <Alert color="teal" variant="light" icon={<IconCircleCheck size={16} />}>
                                    <Text size="sm" fw={600}>Compte cree avec succes !</Text>
                                    <Text size="xs" c="dimmed">{createdResponse.message}</Text>
                                </Alert>

                                <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <Stack gap={6}>
                                        <Group gap={6}>
                                            <Text size="xs" c="dimmed" fw={600} tt="uppercase">Login</Text>
                                            <Code>{createdResponse.login}</Code>
                                        </Group>
                                        <Group gap={6}>
                                            <Text size="xs" c="dimmed" fw={600} tt="uppercase">Email</Text>
                                            <Code>{createdResponse.email}</Code>
                                            {createdResponse.emailSent && (
                                                <Badge color="teal" size="xs" variant="light">Email envoye</Badge>
                                            )}
                                        </Group>
                                        {createdResponse.temporaryPassword && (
                                            <Box>
                                                <Group gap={6} align="center">
                                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                                        Mot de passe temporaire
                                                    </Text>
                                                    <Badge color="orange" size="xs" variant="light">
                                                        Email NON envoye
                                                    </Badge>
                                                </Group>
                                                <Group gap={6} mt={4}>
                                                    <Code style={{ fontSize: 14, padding: '6px 10px' }}>
                                                        {createdResponse.temporaryPassword}
                                                    </Code>
                                                    <CopyButton value={createdResponse.temporaryPassword}>
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
                                                <Text size="xs" c="dimmed" mt={4}>
                                                    Communiquez ce mot de passe a l'utilisateur de maniere securisee.
                                                    Il devra le changer a sa premiere connexion.
                                                </Text>
                                            </Box>
                                        )}
                                    </Stack>
                                </Paper>
                            </>
                        ) : (
                            <Stack gap="md">
                                <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
                                    <Text size="sm" fw={600}>Recapitulatif</Text>
                                    <Text size="xs">Verifiez les informations avant de creer le compte.</Text>
                                </Alert>
                                <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <Stack gap={4}>
                                        <Group><Text size="xs" c="dimmed" w={100}>Login :</Text><Text size="sm" fw={500}>{form.values.login}</Text></Group>
                                        <Group><Text size="xs" c="dimmed" w={100}>Email :</Text><Text size="sm" fw={500}>{form.values.email}</Text></Group>
                                        <Group><Text size="xs" c="dimmed" w={100}>Nom :</Text><Text size="sm" fw={500}>{form.values.name}</Text></Group>
                                        <Group><Text size="xs" c="dimmed" w={100}>Telephone :</Text><Text size="sm" fw={500}>{form.values.phoneNumber || '—'}</Text></Group>
                                        <Group><Text size="xs" c="dimmed" w={100}>Role :</Text>
                                            <Badge color={selectedRoleInfo?.color} variant="light">
                                                {selectedRoleInfo?.label}
                                            </Badge>
                                        </Group>
                                        <Group><Text size="xs" c="dimmed" w={100}>Modules :</Text>
                                            <Badge color="teal" variant="filled">
                                                {selectedModules.size} modules autorises
                                            </Badge>
                                        </Group>
                                    </Stack>
                                </Paper>
                            </Stack>
                        )}
                    </Stack>
                )}

                <Divider />

                {/* ─── ACTIONS ─── */}
                <Group justify="space-between">
                    {step > 0 && !createdResponse && (
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconChevronLeft size={14} />}
                            onClick={handleBack}
                            disabled={submitting}
                        >
                            Retour
                        </Button>
                    )}
                    <Group ml="auto">
                        {!createdResponse && step < 2 && (
                            <Button
                                rightSection={<IconChevronRight size={14} />}
                                onClick={handleNext}
                                styles={{ root: { background: '#0F766E' } }}
                            >
                                Suivant
                            </Button>
                        )}
                        {!createdResponse && step === 2 && (
                            <Button
                                onClick={handleSubmit}
                                loading={submitting}
                                leftSection={<IconCheck size={14} />}
                                styles={{
                                    root: {
                                        background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                        fontWeight: 600,
                                    },
                                }}
                            >
                                Creer le compte
                            </Button>
                        )}
                        {createdResponse && (
                            <Button color="teal" onClick={onClose}>
                                Terminer
                            </Button>
                        )}
                    </Group>
                </Group>
            </Stack>
        </Modal>

        {/* Modale « Message de bienvenue » premium — affichee apres creation reussie */}
        {createdResponse && (
            <WelcomeMessageModal
                opened={welcomeOpen}
                onClose={() => setWelcomeOpen(false)}
                name={createdName || createdResponse.login}
                login={createdResponse.login}
                email={createdResponse.email}
                temporaryPassword={createdResponse.temporaryPassword}
            />
        )}
        </>
    );
}
