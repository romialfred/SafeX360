/**
 * CreateUserPage — Création d'un utilisateur SafeX 360 en page pleine largeur (LOT 52).
 *
 * Remplace le modal CreateUserWizard par un parcours professionnel en 4 étapes,
 * avec rail de progression latéral sticky (convention plateforme R1, voir
 * InspectionExecutePage pour la référence visuelle) :
 *
 *   Étape 1 « Source d'identité »      : LOCAL (identifiants SafeX) ou
 *                                        ACTIVE_DIRECTORY (import depuis l'annuaire,
 *                                        recherche debounce 300 ms, badge démo).
 *   Étape 2 « Identité & rattachement »: nom, login, email, téléphone,
 *                                        mine (obligatoire), département (optionnel,
 *                                        filtré par mine). Champs verrouillés si AD.
 *   Étape 3 « Rôle & accès modules »   : rôle prédéfini → modules pré-cochés,
 *                                        matrice par catégorie, écart vs preset.
 *   Étape 4 « Récapitulatif & création »: synthèse + MDP temporaire affiché UNE FOIS
 *                                        (72 h) si compte LOCAL sans email envoyé.
 *
 * Validation client identique au backend (validateLogin, validateEmail, etc.)
 * et mapping des codes d'erreur backend vers des messages français.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextInput, Select, Button, Group, Stack, Checkbox, Paper, Text, Badge,
    Alert, Code, CopyButton, Modal, Loader, Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import {
    IconUser, IconMail, IconPhone, IconShieldCheck, IconChevronRight, IconChevronLeft,
    IconCheck, IconCopy, IconAlertCircle, IconCircleCheck, IconArrowLeft, IconSearch,
    IconBuildingFactory2, IconAddressBook, IconKey, IconClock, IconUserPlus, IconLock,
} from '@tabler/icons-react';
import {
    createUser, validateLogin, validateEmail,
    CreateUserResponse,
} from '../../../services/UserManagementService';
import {
    getDirectoryStatus, searchDirectory,
    DirectoryStatus, DirectoryUser,
} from '../../../services/DirectoryService';
import { getAllCompanies, getDepartmentsByCompany } from '../../../services/HrmsService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

type IdentitySource = 'LOCAL' | 'ACTIVE_DIRECTORY';

interface CompanyOption {
    id: number;
    name?: string;
    shortName?: string;
}

interface DepartmentOption {
    id: number;
    name?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// ROLES PREDEFINIS (synchronisés avec roles.tsx côté frontend et backend —
// repris du CreateUserWizard, qui sera supprimé une fois cette page câblée)
// ─────────────────────────────────────────────────────────────────────────

const PREDEFINED_ROLES = [
    {
        value: 'SYSTEM_ADMINISTRATOR',
        label: 'Administrateur Système',
        description: 'Accès total à tous les modules + paramètres système',
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
        description: 'Supervision des activités HSE — incidents, audits, EPI, risques',
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
        label: 'Enquêteur Incidents',
        description: 'Spécialisé sur la déclaration et l\'investigation d\'incidents',
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
        description: 'Audits, conformité réglementaire, recommandations',
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
        label: 'Employé (self-service)',
        description: 'Déclaration d\'incidents, demande EPI, consultation documents',
        color: 'gray',
        defaultModules: [
            'home', 'incidentManagement', 'nonConformity',
            'ppeRequest', 'documents',
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────
// CATEGORIES DE MODULES — pour la matrice de l'étape 3
// ─────────────────────────────────────────────────────────────────────────

interface ModuleCategory {
    name: string;
    color: string;
    modules: { id: string; label: string }[];
}

const MODULE_CATEGORIES: ModuleCategory[] = [
    {
        name: 'Généraux', color: 'gray',
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
            { id: 'nonConformity', label: 'Non-conformités' },
        ],
    },
    {
        name: 'Activités Préventives', color: 'teal',
        modules: [
            { id: 'inspections', label: 'Inspections' },
            { id: 'meetings', label: 'Réunions HSE' },
            { id: 'managementTour', label: 'Tournées direction' },
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
            { id: 'riskAssessment', label: 'Évaluation des risques' },
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
        name: 'Conformité', color: 'green',
        modules: [
            { id: 'complianceDashboard', label: 'Dashboard conformité' },
            { id: 'requirements', label: 'Exigences' },
            { id: 'positionAssignments', label: 'Affectations postes' },
            { id: 'employeeAssignments', label: 'Affectations employés' },
        ],
    },
    {
        name: 'Documentation', color: 'violet',
        modules: [
            { id: 'documents', label: 'Documents' },
            { id: 'documentValidation', label: 'Validation documents' },
            { id: 'lessonsLearned', label: 'Leçons apprises' },
            { id: 'documentManager', label: 'Gestionnaire documents' },
        ],
    },
    {
        name: 'Communication', color: 'pink',
        modules: [
            { id: 'commDashboard', label: 'Dashboard communication' },
            { id: 'employeeComm', label: 'Communication employés' },
        ],
    },
    {
        name: 'Administration', color: 'red',
        modules: [
            { id: 'usersManagement', label: 'Gestion utilisateurs' },
            { id: 'settings', label: 'Paramètres' },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────
// ETAPES + MAPPING DES ERREURS BACKEND
// ─────────────────────────────────────────────────────────────────────────

const STEPS = [
    { title: 'Source d\'identité', hint: 'SafeX ou annuaire AD' },
    { title: 'Identité & rattachement', hint: 'Compte, mine, département' },
    { title: 'Rôle & accès aux modules', hint: 'Permissions par module' },
    { title: 'Récapitulatif & création', hint: 'Vérification finale' },
];

/** Codes d'erreur backend → message français + étape/champ à corriger. */
const API_ERRORS: Record<string, { message: string; step?: number; field?: string }> = {
    LOGIN_TOO_SHORT: { message: 'Le login doit comporter au moins 3 caractères', step: 1, field: 'login' },
    LOGIN_INVALID_FORMAT: { message: 'Le login ne peut contenir que des lettres, chiffres, point, underscore ou tiret', step: 1, field: 'login' },
    EMAIL_INVALID: { message: 'Format email invalide', step: 1, field: 'email' },
    NAME_REQUIRED: { message: 'Le nom est requis', step: 1, field: 'name' },
    ROLE_REQUIRED: { message: 'Le rôle est requis', step: 2 },
    COMPANY_REQUIRED: { message: 'La mine de rattachement est obligatoire', step: 1, field: 'companyId' },
    COMPANY_NOT_FOUND: { message: 'La mine sélectionnée est introuvable', step: 1, field: 'companyId' },
    MODULES_REQUIRED: { message: 'Sélectionnez au moins un module', step: 2 },
    LOGIN_ALREADY_EXISTS: { message: 'Ce login est déjà utilisé', step: 1, field: 'login' },
    DIRECTORY_DISABLED: { message: 'Le connecteur Active Directory est désactivé — import impossible', step: 0 },
    PERMISSIONS_INIT_FAILED: { message: 'Le compte a été créé mais l\'initialisation des permissions a échoué. Contactez le support.' },
};

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────

export default function CreateUserPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [identitySource, setIdentitySource] = useState<IdentitySource>('LOCAL');
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [createdResponse, setCreatedResponse] = useState<CreateUserResponse | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    // ── Annuaire AD ──
    const [dirStatus, setDirStatus] = useState<DirectoryStatus | null>(null);
    const [dirStatusLoading, setDirStatusLoading] = useState(true);
    const [adQuery, setAdQuery] = useState('');
    const [debouncedQuery] = useDebouncedValue(adQuery, 300);
    const [adResults, setAdResults] = useState<DirectoryUser[]>([]);
    const [adSearching, setAdSearching] = useState(false);
    const [adUser, setAdUser] = useState<DirectoryUser | null>(null);

    // ── Référentiels mine / département ──
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);

    const form = useForm({
        initialValues: {
            login: '',
            email: '',
            name: '',
            phoneNumber: '',
            role: 'EMPLOYEE',
            companyId: null as string | null,
            departmentId: null as string | null,
        },
        validate: {
            login: (v) => validateLogin(v),
            email: (v) => validateEmail(v),
            name: (v) => (v.trim().length === 0 ? 'Le nom est requis' : null),
            role: (v) => (v.trim().length === 0 ? 'Le rôle est requis' : null),
            companyId: (v) => (!v ? 'La mine de rattachement est obligatoire' : null),
        },
        validateInputOnBlur: true,
    });

    // ── Chargements initiaux : statut annuaire + liste des mines ──
    useEffect(() => {
        getDirectoryStatus()
            .then(setDirStatus)
            .catch(() => setDirStatus(null))
            .finally(() => setDirStatusLoading(false));
        getAllCompanies()
            .then((res: CompanyOption[]) => setCompanies(Array.isArray(res) ? res : []))
            .catch(() => errorNotification('Impossible de charger la liste des mines'));
    }, []);

    // ── Recherche annuaire avec debounce 300 ms (uniquement si AD actif) ──
    useEffect(() => {
        if (identitySource !== 'ACTIVE_DIRECTORY' || !dirStatus?.enabled) return;
        let cancelled = false;
        setAdSearching(true);
        searchDirectory(debouncedQuery.trim())
            .then((res) => { if (!cancelled) setAdResults(res); })
            .catch(() => { if (!cancelled) setAdResults([]); })
            .finally(() => { if (!cancelled) setAdSearching(false); });
        return () => { cancelled = true; };
    }, [debouncedQuery, identitySource, dirStatus?.enabled]);

    // ── Quand le rôle change, pré-remplit les modules du preset ──
    useEffect(() => {
        const roleDef = PREDEFINED_ROLES.find((r) => r.value === form.values.role);
        if (roleDef) setSelectedModules(new Set(roleDef.defaultModules));
    }, [form.values.role]);

    // ── Départements filtrés par mine ──
    useEffect(() => {
        if (!form.values.companyId) {
            setDepartments([]);
            return;
        }
        getDepartmentsByCompany(Number(form.values.companyId))
            .then((res: DepartmentOption[]) => setDepartments(Array.isArray(res) ? res : []))
            .catch(() => setDepartments([]));
    }, [form.values.companyId]);

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────

    const selectedRoleInfo = useMemo(
        () => PREDEFINED_ROLES.find((r) => r.value === form.values.role),
        [form.values.role]
    );

    /** Écart entre la sélection et le preset du rôle (chip « Personnalisé »). */
    const presetDelta = useMemo(() => {
        const preset = new Set(selectedRoleInfo?.defaultModules ?? []);
        let added = 0;
        let removed = 0;
        selectedModules.forEach((m) => { if (!preset.has(m)) added++; });
        preset.forEach((m) => { if (!selectedModules.has(m)) removed++; });
        return { added, removed, isCustom: added > 0 || removed > 0 };
    }, [selectedModules, selectedRoleInfo]);

    /** Saisie en cours → confirmation avant abandon. */
    const isDirty = useMemo(() => {
        const v = form.values;
        return Boolean(
            v.login || v.email || v.name || v.phoneNumber || v.companyId
            || adUser || identitySource !== 'LOCAL' || step > 0
        );
    }, [form.values, adUser, identitySource, step]);

    const companyLabel = (id: string | null) => {
        if (!id) return '—';
        const c = companies.find((x) => String(x.id) === id);
        return c?.name || c?.shortName || `Mine #${id}`;
    };

    const departmentLabel = (id: string | null) => {
        if (!id) return '—';
        const d = departments.find((x) => String(x.id) === id);
        return d?.name || `Département #${id}`;
    };

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
            cat.modules.forEach((m) => { if (on) next.add(m.id); else next.delete(m.id); });
            return next;
        });
    };

    /** Sélection d'un profil AD → pré-remplit et verrouille identité (étape 2). */
    const selectAdUser = (u: DirectoryUser) => {
        if (u.alreadyImported) return;
        setAdUser(u);
        form.setFieldValue('login', u.login);
        form.setFieldValue('email', u.email);
        form.setFieldValue('name', u.displayName);
        form.clearFieldError('login');
        form.clearFieldError('email');
        form.clearFieldError('name');
    };

    /** Bascule LOCAL / AD — repasser en LOCAL libère les champs pré-remplis. */
    const switchSource = (src: IdentitySource) => {
        if (src === identitySource) return;
        setIdentitySource(src);
        if (src === 'LOCAL' && adUser) {
            setAdUser(null);
            form.setFieldValue('login', '');
            form.setFieldValue('email', '');
            form.setFieldValue('name', '');
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // NAVIGATION ENTRE ETAPES
    // ─────────────────────────────────────────────────────────────────────

    const validateStep = (s: number): boolean => {
        if (s === 0) {
            if (identitySource === 'ACTIVE_DIRECTORY') {
                if (!dirStatus?.enabled) {
                    errorNotification('Le connecteur Active Directory est désactivé — import impossible');
                    return false;
                }
                if (!adUser) {
                    errorNotification('Sélectionnez un utilisateur dans l\'annuaire avant de continuer');
                    return false;
                }
            }
            return true;
        }
        if (s === 1) {
            const errs = form.validate();
            return !errs.hasErrors;
        }
        if (s === 2) {
            if (selectedModules.size === 0) {
                errorNotification('Sélectionnez au moins un module pour l\'utilisateur');
                return false;
            }
            return true;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
    };

    const handleBack = () => setStep((s) => Math.max(0, s - 1));

    /** Retour à un jalon déjà complété via le rail latéral. */
    const handleRailClick = (target: number) => {
        if (createdResponse || submitting) return;
        if (target < step) setStep(target);
    };

    const handleCancel = () => {
        if (isDirty && !createdResponse) setCancelConfirm(true);
        else navigate('/users-admin');
    };

    // ─────────────────────────────────────────────────────────────────────
    // SOUMISSION
    // ─────────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!validateStep(2)) { setStep(2); return; }
        setSubmitting(true);
        try {
            const resp = await createUser({
                login: form.values.login.trim(),
                email: form.values.email.trim(),
                name: form.values.name.trim(),
                phoneNumber: form.values.phoneNumber.trim() || undefined,
                role: form.values.role,
                allowedModules: Array.from(selectedModules).join(','),
                companyId: Number(form.values.companyId),
                departmentId: form.values.departmentId ? Number(form.values.departmentId) : undefined,
                identitySource,
            });
            setCreatedResponse(resp);
            successNotification(`Compte ${resp.login} créé avec succès`);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { errorMessage?: string; error?: string } } };
            const code = err?.response?.data?.errorMessage || err?.response?.data?.error;
            const known = code ? API_ERRORS[code] : undefined;
            if (known) {
                if (known.field) form.setFieldError(known.field, known.message);
                if (known.step !== undefined) setStep(known.step);
                errorNotification(known.message);
            } else {
                errorNotification(code || 'Erreur lors de la création du compte');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // SOUS-RENDUS
    // ─────────────────────────────────────────────────────────────────────

    const progressPct = createdResponse ? 100 : Math.round(((step + 1) / STEPS.length) * 100);

    /** Rail latéral sticky — numéros + intitulés, état complété/actif. */
    const stepRail = (
        <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-medium mb-3">
                    Parcours de création
                </p>
                <ol className="space-y-1">
                    {STEPS.map((s, i) => {
                        const done = createdResponse ? true : i < step;
                        const active = !createdResponse && i === step;
                        const clickable = !createdResponse && !submitting && i < step;
                        return (
                            <li key={s.title}>
                                <button
                                    type="button"
                                    onClick={() => handleRailClick(i)}
                                    disabled={!clickable}
                                    className={`w-full flex items-start gap-3 px-2 py-2.5 rounded-lg text-left transition ${
                                        active ? 'bg-teal-50/70' : clickable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                                    }`}
                                >
                                    <span
                                        className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-[12.5px] tabular-nums border transition ${
                                            done
                                                ? 'bg-teal-600 border-teal-600 text-white'
                                                : active
                                                    ? 'bg-white border-teal-600 text-teal-700 ring-2 ring-teal-100'
                                                    : 'bg-white border-slate-300 text-slate-400'
                                        }`}
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                                    >
                                        {done ? <IconCheck size={14} stroke={2.2} /> : i + 1}
                                    </span>
                                    <span className="min-w-0 pt-0.5">
                                        <span className={`block text-[13px] leading-snug ${
                                            active ? 'text-teal-800 font-medium' : done ? 'text-slate-700' : 'text-slate-400'
                                        }`}>
                                            {s.title}
                                        </span>
                                        <span className="block text-[11px] text-slate-400 leading-snug mt-0.5">
                                            {s.hint}
                                        </span>
                                    </span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className="ml-[21px] h-3 border-l border-slate-200" aria-hidden="true" />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </aside>
    );

    /** Carte sélectionnable de source d'identité (étape 1). */
    const sourceCard = (
        src: IdentitySource,
        icon: React.ReactNode,
        title: string,
        description: string,
        extra?: React.ReactNode,
        disabled?: boolean,
    ) => {
        const active = identitySource === src;
        return (
            <button
                type="button"
                onClick={() => !disabled && switchSource(src)}
                disabled={disabled}
                className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition w-full ${
                    disabled
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : active
                            ? 'bg-teal-50/60 border-teal-600'
                            : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
            >
                <span className={`inline-flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0 ${
                    active ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                    {icon}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[14px] font-medium ${active ? 'text-teal-900' : 'text-slate-800'}`}>
                            {title}
                        </span>
                        {extra}
                    </span>
                    <span className="block text-[12px] text-slate-500 leading-snug mt-1">
                        {description}
                    </span>
                </span>
                <span className={`mt-1 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition ${
                    active ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'
                }`}>
                    {active && <IconCheck size={12} stroke={3} className="text-white" />}
                </span>
            </button>
        );
    };

    /** Étape 1 — Source d'identité. */
    const renderStepSource = (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
            <div>
                <h2
                    className="text-slate-900"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 16 }}
                >
                    D'où proviennent les identifiants de cet utilisateur ?
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                    Un compte local reçoit un mot de passe temporaire SafeX (valable 72 h). Un compte importé
                    depuis l'annuaire se connecte avec ses identifiants Active Directory.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sourceCard(
                    'LOCAL',
                    <IconKey size={20} stroke={1.8} />,
                    'Compte local',
                    'Créer les identifiants dans SafeX — mot de passe temporaire généré, changement forcé à la première connexion.',
                )}
                {sourceCard(
                    'ACTIVE_DIRECTORY',
                    <IconAddressBook size={20} stroke={1.8} />,
                    'Active Directory',
                    'Importer depuis l\'annuaire — identité pré-remplie, connexion avec les identifiants AD existants.',
                    dirStatusLoading ? (
                        <Loader size={12} color="teal" />
                    ) : dirStatus?.demoMode ? (
                        <Badge color="violet" variant="light" size="xs">Annuaire démo</Badge>
                    ) : dirStatus && !dirStatus.enabled ? (
                        <Badge color="gray" variant="light" size="xs">Connecteur désactivé</Badge>
                    ) : undefined,
                    !dirStatusLoading && (!dirStatus || !dirStatus.enabled),
                )}
            </div>

            {/* ── Recherche dans l'annuaire (si AD sélectionné) ── */}
            {identitySource === 'ACTIVE_DIRECTORY' && dirStatus?.enabled && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                    <TextInput
                        label="Rechercher dans l'annuaire"
                        placeholder="Nom, login ou email…"
                        leftSection={adSearching ? <Loader size={14} color="teal" /> : <IconSearch size={14} />}
                        value={adQuery}
                        onChange={(e) => setAdQuery(e.currentTarget.value)}
                        description={dirStatus.demoMode
                            ? 'Annuaire de démonstration — les profils listés sont fictifs.'
                            : `Annuaire connecté : ${dirStatus.host || 'LDAP'}`}
                    />

                    {adUser && (
                        <Alert color="teal" variant="light" icon={<IconCircleCheck size={16} />}>
                            <Text size="sm">
                                Profil sélectionné : <strong>{adUser.displayName}</strong> (@{adUser.login}) —
                                son identité sera pré-remplie et verrouillée à l'étape suivante.
                            </Text>
                        </Alert>
                    )}

                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                        {adResults.length === 0 && !adSearching && (
                            <p className="text-[12.5px] text-slate-500 text-center py-6">
                                Aucun profil trouvé dans l'annuaire pour cette recherche.
                            </p>
                        )}
                        {adResults.map((u) => {
                            const selected = adUser?.login === u.login;
                            return (
                                <button
                                    key={u.login}
                                    type="button"
                                    onClick={() => selectAdUser(u)}
                                    disabled={u.alreadyImported}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                                        u.alreadyImported
                                            ? 'bg-slate-50 opacity-55 cursor-not-allowed'
                                            : selected
                                                ? 'bg-teal-50/70'
                                                : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 text-[12px] font-medium ${
                                        selected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {u.displayName.split(' ').map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase()}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] text-slate-800 font-medium">{u.displayName}</span>
                                            <span className="text-[11.5px] text-slate-400">@{u.login}</span>
                                            {u.alreadyImported && (
                                                <Badge color="gray" variant="light" size="xs">Déjà importé</Badge>
                                            )}
                                        </span>
                                        <span className="block text-[11.5px] text-slate-500 truncate">
                                            {u.email}
                                            {u.department && <> · {u.department}</>}
                                            {u.title && <> · {u.title}</>}
                                        </span>
                                    </span>
                                    {selected && <IconCheck size={16} stroke={2.2} className="text-teal-700 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    /** Badge AD affiché sur les champs verrouillés (étape 2). */
    const adLockBadge = (
        <Badge color="violet" variant="light" size="xs" leftSection={<IconLock size={9} />}>
            AD
        </Badge>
    );

    /** Étape 2 — Identité & rattachement. */
    const renderStepIdentity = (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5">
            <div>
                <h2
                    className="text-slate-900"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 16 }}
                >
                    Identité de l'utilisateur
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                    {adUser
                        ? 'Identité importée depuis l\'annuaire Active Directory — login, email et nom sont verrouillés.'
                        : 'Renseignez les informations du compte. Le login servira d\'identifiant de connexion.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                    label="Nom complet"
                    placeholder="DUPONT Jean"
                    leftSection={<IconUser size={14} />}
                    rightSection={adUser ? adLockBadge : undefined}
                    rightSectionWidth={adUser ? 52 : undefined}
                    disabled={!!adUser}
                    {...form.getInputProps('name')}
                    required
                />
                <TextInput
                    label="Login"
                    placeholder="ex. jdupont"
                    leftSection={<IconUser size={14} />}
                    rightSection={adUser ? adLockBadge : undefined}
                    rightSectionWidth={adUser ? 52 : undefined}
                    disabled={!!adUser}
                    {...form.getInputProps('login')}
                    required
                />
                <TextInput
                    label="Email"
                    placeholder="jean.dupont@mine.com"
                    leftSection={<IconMail size={14} />}
                    rightSection={adUser ? adLockBadge : undefined}
                    rightSectionWidth={adUser ? 52 : undefined}
                    disabled={!!adUser}
                    {...form.getInputProps('email')}
                    required
                />
                <TextInput
                    label="Téléphone"
                    placeholder="+226 77 96 35 25"
                    leftSection={<IconPhone size={14} />}
                    {...form.getInputProps('phoneNumber')}
                />
            </div>

            <div className="pt-4 border-t border-slate-100">
                <h3
                    className="text-slate-900 mb-1"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 14.5 }}
                >
                    Rattachement organisationnel
                </h3>
                <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
                    La mine détermine le périmètre des données visibles par l'utilisateur.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Mine"
                        placeholder="Sélectionner la mine de rattachement"
                        leftSection={<IconBuildingFactory2 size={14} />}
                        data={companies.map((c) => ({
                            value: String(c.id),
                            label: c.name || c.shortName || `Mine #${c.id}`,
                        }))}
                        searchable
                        value={form.values.companyId}
                        onChange={(v) => {
                            form.setFieldValue('companyId', v);
                            form.setFieldValue('departmentId', null);
                            if (v) form.clearFieldError('companyId');
                        }}
                        error={form.errors.companyId}
                        required
                    />
                    <Select
                        label="Département"
                        placeholder={form.values.companyId ? 'Optionnel' : 'Choisissez d\'abord une mine'}
                        data={departments.map((d) => ({
                            value: String(d.id),
                            label: d.name || `Département #${d.id}`,
                        }))}
                        searchable
                        clearable
                        disabled={!form.values.companyId || departments.length === 0}
                        value={form.values.departmentId}
                        onChange={(v) => form.setFieldValue('departmentId', v)}
                        description={form.values.companyId && departments.length === 0
                            ? 'Aucun département référencé pour cette mine'
                            : undefined}
                    />
                </div>
            </div>
        </div>
    );

    /** Étape 3 — Rôle & accès aux modules. */
    const renderStepModules = (
        <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
                <div>
                    <h2
                        className="text-slate-900"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 16 }}
                    >
                        Rôle de l'utilisateur
                    </h2>
                    <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                        Le rôle pré-coche les modules recommandés — vous pouvez ensuite ajuster la sélection.
                    </p>
                </div>
                <Select
                    label="Rôle"
                    placeholder="Choisir un rôle prédéfini"
                    leftSection={<IconShieldCheck size={14} />}
                    data={PREDEFINED_ROLES.map((r) => ({ value: r.value, label: r.label }))}
                    {...form.getInputProps('role')}
                    required
                />
                {selectedRoleInfo && (
                    <Paper p="sm" radius="md" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
                        <Group gap={6} mb={4}>
                            <Badge color={selectedRoleInfo.color} variant="filled" size="sm">
                                {selectedRoleInfo.label}
                            </Badge>
                            <Text size="xs" c="dimmed">
                                {selectedRoleInfo.defaultModules.length} modules par défaut
                            </Text>
                            {presetDelta.isCustom && (
                                <Badge color="amber" variant="light" size="sm">
                                    Personnalisé
                                    {presetDelta.added > 0 && ` · +${presetDelta.added}`}
                                    {presetDelta.removed > 0 && ` · −${presetDelta.removed}`}
                                </Badge>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed">{selectedRoleInfo.description}</Text>
                    </Paper>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h2
                            className="text-slate-900"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 16 }}
                        >
                            Accès aux modules
                        </h2>
                        <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                            Cochez les modules auxquels {form.values.name || 'l\'utilisateur'} aura accès.
                        </p>
                    </div>
                    <Badge variant="filled" color={selectedModules.size === 0 ? 'red' : 'teal'} size="lg">
                        {selectedModules.size} module{selectedModules.size > 1 ? 's' : ''} sélectionné{selectedModules.size > 1 ? 's' : ''}
                    </Badge>
                </div>

                {selectedModules.size === 0 && (
                    <Alert color="red" variant="light" icon={<IconAlertCircle size={14} />}>
                        <Text size="xs">
                            Au moins un module est requis pour passer au récapitulatif.
                        </Text>
                    </Alert>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {MODULE_CATEGORIES.map((cat) => {
                        const catSelectedCount = cat.modules.filter((m) => selectedModules.has(m.id)).length;
                        const allSelected = catSelectedCount === cat.modules.length;
                        return (
                            <Paper key={cat.name} p="sm" radius="md" style={{ border: '1px solid #E2E8F0' }}>
                                <Group justify="space-between" mb={8} wrap="nowrap">
                                    <Group gap={6} wrap="nowrap">
                                        <Badge color={cat.color} variant="dot" size="sm">{cat.name}</Badge>
                                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                            {catSelectedCount}/{cat.modules.length}
                                        </Text>
                                    </Group>
                                    <Switch
                                        size="xs"
                                        color={cat.color}
                                        label={allSelected ? 'Tout décocher' : 'Tout cocher'}
                                        checked={allSelected}
                                        onChange={(e) => toggleCategory(cat, e.currentTarget.checked)}
                                    />
                                </Group>
                                <Stack gap={6}>
                                    {cat.modules.map((m) => (
                                        <Checkbox
                                            key={m.id}
                                            size="sm"
                                            color={cat.color}
                                            label={m.label}
                                            checked={selectedModules.has(m.id)}
                                            onChange={() => toggleModule(m.id)}
                                        />
                                    ))}
                                </Stack>
                            </Paper>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    /** Ligne du récapitulatif (étape 4). */
    const summaryRow = (label: string, value: React.ReactNode) => (
        <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-b-0">
            <span className="w-36 flex-shrink-0 text-[12px] text-slate-500 pt-0.5">{label}</span>
            <span className="text-[13px] text-slate-800 min-w-0">{value}</span>
        </div>
    );

    /** Étape 4 — Récapitulatif avant création. */
    const renderStepSummary = (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
            <div>
                <h2
                    className="text-slate-900"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 16 }}
                >
                    Récapitulatif avant création
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                    Vérifiez les informations — le compte et ses permissions seront créés en une seule opération.
                </p>
            </div>

            <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                {summaryRow('Source d\'identité', identitySource === 'LOCAL' ? (
                    <Badge color="teal" variant="light" leftSection={<IconKey size={10} />}>Compte local SafeX</Badge>
                ) : (
                    <Group gap={6}>
                        <Badge color="violet" variant="light" leftSection={<IconAddressBook size={10} />}>
                            Active Directory
                        </Badge>
                        {dirStatus?.demoMode && <Badge color="violet" variant="outline" size="xs">Annuaire démo</Badge>}
                    </Group>
                ))}
                {summaryRow('Nom complet', form.values.name || '—')}
                {summaryRow('Login', <Code>{form.values.login}</Code>)}
                {summaryRow('Email', form.values.email || '—')}
                {summaryRow('Téléphone', form.values.phoneNumber || '—')}
                {summaryRow('Mine', companyLabel(form.values.companyId))}
                {summaryRow('Département', departmentLabel(form.values.departmentId))}
                {summaryRow('Rôle', (
                    <Badge color={selectedRoleInfo?.color} variant="light">{selectedRoleInfo?.label}</Badge>
                ))}
                {summaryRow('Modules autorisés', (
                    <Group gap={6}>
                        <Badge color="teal" variant="filled">{selectedModules.size} modules</Badge>
                        {presetDelta.isCustom && (
                            <Badge color="amber" variant="light" size="sm">Personnalisé</Badge>
                        )}
                    </Group>
                ))}
            </Paper>

            {identitySource === 'LOCAL' ? (
                <Alert color="blue" variant="light" icon={<IconAlertCircle size={14} />}>
                    <Text size="xs">
                        Un mot de passe temporaire fort sera <strong>généré automatiquement</strong> (valable 72 h)
                        et envoyé par email si la messagerie est disponible. L'utilisateur devra le changer
                        obligatoirement lors de sa première connexion.
                    </Text>
                </Alert>
            ) : (
                <Alert color="violet" variant="light" icon={<IconAddressBook size={14} />}>
                    <Text size="xs">
                        Aucun mot de passe local ne sera créé : l'utilisateur se connectera directement
                        avec ses <strong>identifiants Active Directory</strong>.
                    </Text>
                </Alert>
            )}
        </div>
    );

    /** Écran de succès — MDP temporaire affiché UNE SEULE FOIS. */
    const renderSuccess = createdResponse && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
            <Alert color="teal" variant="light" icon={<IconCircleCheck size={16} />}>
                <Text size="sm" fw={500}>Compte créé avec succès !</Text>
                <Text size="xs" c="dimmed">{createdResponse.message}</Text>
            </Alert>

            <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                {summaryRow('Login', <Code>{createdResponse.login}</Code>)}
                {summaryRow('Email', (
                    <Group gap={6}>
                        <span>{createdResponse.email}</span>
                        {createdResponse.emailSent && (
                            <Badge color="teal" size="xs" variant="light">Email envoyé</Badge>
                        )}
                    </Group>
                ))}
            </Paper>

            {identitySource === 'ACTIVE_DIRECTORY' ? (
                <Alert color="violet" variant="light" icon={<IconAddressBook size={16} />}>
                    <Text size="sm">
                        L'utilisateur se connecte avec ses <strong>identifiants Active Directory</strong> —
                        aucun mot de passe SafeX n'a été créé pour ce compte.
                    </Text>
                </Alert>
            ) : createdResponse.emailSent ? (
                <Alert color="teal" variant="light" icon={<IconMail size={16} />}>
                    <Text size="sm">
                        Un email contenant le mot de passe temporaire a été envoyé
                        à <strong>{createdResponse.email}</strong>. Il devra être changé à la première connexion.
                    </Text>
                </Alert>
            ) : null}

            {createdResponse.temporaryPassword && (
                <Paper p="md" radius="md" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <Group gap={6} align="center" mb={6}>
                        <IconClock size={14} stroke={1.8} className="text-amber-700" />
                        <Text size="xs" fw={500} tt="uppercase" style={{ color: '#92400E', letterSpacing: 0.4 }}>
                            Mot de passe temporaire — affiché une seule fois
                        </Text>
                    </Group>
                    <Group gap={6}>
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
                                    {copied ? 'Copié !' : 'Copier'}
                                </Button>
                            )}
                        </CopyButton>
                    </Group>
                    <Text size="xs" mt={6} style={{ color: '#92400E' }}>
                        Valable <strong>72 heures</strong>. Communiquez-le à l'utilisateur de manière sécurisée :
                        il devra le changer obligatoirement à sa première connexion. Ce mot de passe ne pourra
                        plus être affiché — en cas de perte, utilisez « Réinitialiser le mot de passe ».
                    </Text>
                </Paper>
            )}

            <Group justify="flex-end">
                <Button
                    leftSection={<IconArrowLeft size={14} />}
                    onClick={() => navigate('/users-admin')}
                    styles={{ root: { background: '#0F766E' } }}
                >
                    Retour à la liste
                </Button>
            </Group>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────
    // RENDU PRINCIPAL
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] pb-10">
            {/* ── En-tête blanc : retour + fil + titre + progression ── */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-5 lg:px-6 py-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition flex-shrink-0"
                        aria-label="Retour à la gestion des utilisateurs"
                        title="Retour à la gestion des utilisateurs"
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                    </button>
                    <span className="uppercase tracking-[0.16em] font-medium">Administration</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">Gestion des utilisateurs</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-teal-700 font-medium">Nouvel utilisateur</span>
                </div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex items-center gap-3">
                        <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/40 ring-1 ring-teal-200/70 border-l-[3px] border-l-teal-500 shadow-sm">
                            <IconUserPlus size={20} stroke={1.8} className="text-teal-700" />
                        </div>
                        <div>
                            <h1
                                className="text-slate-900 leading-tight"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(18px, 1.8vw, 22px)',
                                    letterSpacing: '-0.015em',
                                }}
                            >
                                Nouvel utilisateur
                            </h1>
                            <p className="text-[12.5px] text-slate-500 mt-0.5">
                                Compte, rattachement et permissions par module — en 4 étapes
                            </p>
                        </div>
                    </div>
                    <div className="min-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>
                                {createdResponse ? 'Création terminée' : `Étape ${step + 1} sur ${STEPS.length}`}
                            </span>
                            <span className="font-medium text-slate-700 tabular-nums">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-600 transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stepper compact mobile (le rail est masqué < lg) ── */}
            <div className="lg:hidden px-4 sm:px-5 pt-4">
                <div className="flex items-center gap-1.5">
                    {STEPS.map((s, i) => {
                        const done = createdResponse ? true : i < step;
                        const active = !createdResponse && i === step;
                        return (
                            <div key={s.title} className="flex-1 flex flex-col gap-1" title={s.title}>
                                <div className={`h-1.5 rounded-full transition ${
                                    done ? 'bg-teal-600' : active ? 'bg-teal-400' : 'bg-slate-200'
                                }`} />
                                <span className={`text-[10px] leading-tight truncate ${
                                    active ? 'text-teal-800 font-medium' : 'text-slate-400'
                                }`}>
                                    {i + 1}. {s.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Corps : rail sticky + colonne principale ── */}
            <div className="px-4 sm:px-5 lg:px-6 py-5 flex items-start gap-5">
                {stepRail}

                <div className="flex-1 min-w-0 space-y-4">
                    {createdResponse ? renderSuccess : (
                        <>
                            {step === 0 && renderStepSource}
                            {step === 1 && renderStepIdentity}
                            {step === 2 && renderStepModules}
                            {step === 3 && renderStepSummary}

                            {/* ── Navigation bas de page ── */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                                <Group gap="xs">
                                    <Button variant="subtle" color="gray" onClick={handleCancel} disabled={submitting}>
                                        Annuler
                                    </Button>
                                </Group>
                                <Group gap="xs">
                                    {step > 0 && (
                                        <Button
                                            variant="default"
                                            leftSection={<IconChevronLeft size={14} />}
                                            onClick={handleBack}
                                            disabled={submitting}
                                        >
                                            Précédent
                                        </Button>
                                    )}
                                    {step < STEPS.length - 1 ? (
                                        <Button
                                            rightSection={<IconChevronRight size={14} />}
                                            onClick={handleNext}
                                            disabled={step === 2 && selectedModules.size === 0}
                                            styles={{ root: { background: '#0F766E' } }}
                                        >
                                            Suivant
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            loading={submitting}
                                            leftSection={<IconCheck size={14} />}
                                            styles={{
                                                root: {
                                                    background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                                    fontWeight: 500,
                                                },
                                            }}
                                        >
                                            Créer l'utilisateur
                                        </Button>
                                    )}
                                </Group>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Confirmation d'abandon (saisie en cours) ── */}
            <Modal
                opened={cancelConfirm}
                onClose={() => setCancelConfirm(false)}
                title={<Text fw={500}>Abandonner la création ?</Text>}
                centered
                size="sm"
            >
                <Stack gap="md">
                    <Text size="sm">
                        Les informations saisies seront perdues. Voulez-vous vraiment revenir
                        à la liste des utilisateurs ?
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setCancelConfirm(false)}>
                            Continuer la saisie
                        </Button>
                        <Button color="red" onClick={() => navigate('/users-admin')}>
                            Abandonner
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
}
