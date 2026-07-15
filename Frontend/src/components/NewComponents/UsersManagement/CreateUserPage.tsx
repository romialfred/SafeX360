/**
 * CreateUserPage — Création d'un utilisateur SafeX 360 en page pleine largeur (LOT 52 / LOT 61).
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
 * Après une création réussie, la WelcomeMessageModal premium s'ouvre par-dessus
 * l'écran de succès (message de bienvenue copiable pour Outlook).
 *
 * Validation client identique au backend (validateLogin, validateEmail, etc.)
 * et mapping des codes d'erreur backend vers des messages traduits.
 *
 * i18n : useTranslation('navigation'), clés sous t('userMgmt.create.*').
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    TextInput, Select, MultiSelect, Button, Group, Stack, Checkbox, Paper, Text, Badge,
    Alert, Code, CopyButton, Modal, Loader, Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import {
    IconUser, IconMail, IconPhone, IconShieldCheck, IconChevronRight, IconChevronLeft,
    IconCheck, IconCopy, IconAlertCircle, IconCircleCheck, IconArrowLeft, IconSearch,
    IconBuildingFactory2, IconAddressBook, IconKey, IconClock, IconUserPlus, IconLock,
    IconWorld, IconStar,
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
import WelcomeMessageModal from './WelcomeMessageModal';

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
// ROLES PREDEFINIS (synchronisés avec roles.tsx côté frontend et backend).
// Les libellés/descriptions sont traduits via i18n (userMgmt.create.roles.*).
// ─────────────────────────────────────────────────────────────────────────

const PREDEFINED_ROLES = [
    {
        value: 'SYSTEM_ADMINISTRATOR',
        color: 'red',
        defaultModules: [
            'home', 'errorManagement', 'nonConformity', 'inspections', 'meetings', 'managementTour',
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
        color: 'teal',
        defaultModules: [
            'home', 'errorManagement', 'nonConformity', 'inspections', 'meetings',
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
        color: 'orange',
        defaultModules: [
            'home', 'errorManagement', 'incidentManagement', 'investigations', 'actionPlansInc',
            'pendingActions', 'recommendations',
            'complianceDashboard', 'documents',
        ],
    },
    {
        value: 'AUDITOR',
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
        color: 'gray',
        defaultModules: [
            'home', 'errorManagement', 'incidentManagement', 'nonConformity',
            'ppeRequest', 'documents',
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────
// CATEGORIES DE MODULES — pour la matrice de l'étape 3.
// Les libellés sont traduits via i18n (userMgmt.create.categories/modules.*).
// ─────────────────────────────────────────────────────────────────────────

interface ModuleCategory {
    key: string;
    color: string;
    modules: string[];
}

const MODULE_CATEGORIES: ModuleCategory[] = [
    { key: 'general', color: 'gray', modules: ['home', 'notifications'] },
    { key: 'incidents', color: 'orange', modules: ['incidentManagement', 'investigations', 'actionPlansInc', 'nonConformity'] },
    { key: 'errorManagement', color: 'indigo', modules: ['errorManagement'] },
    { key: 'preventive', color: 'teal', modules: ['inspections', 'meetings', 'managementTour'] },
    { key: 'corrective', color: 'cyan', modules: ['pendingActions', 'actionPlan', 'recommendations', 'adhocActions'] },
    { key: 'risks', color: 'red', modules: ['riskOverview', 'riskRegister', 'riskAssessment', 'chemicalRegister'] },
    { key: 'ppe', color: 'yellow', modules: ['ppeOverview', 'ppeMonitoring', 'ppeRequest'] },
    { key: 'audits', color: 'indigo', modules: ['auditPlan', 'audits', 'auditRecommendations'] },
    { key: 'compliance', color: 'green', modules: ['complianceDashboard', 'requirements', 'positionAssignments', 'employeeAssignments'] },
    { key: 'documentation', color: 'violet', modules: ['documents', 'documentValidation', 'lessonsLearned', 'documentManager'] },
    { key: 'communication', color: 'pink', modules: ['commDashboard', 'employeeComm'] },
    { key: 'administration', color: 'red', modules: ['usersManagement', 'settings'] },
];

// ─────────────────────────────────────────────────────────────────────────
// MODULES GÉRÉS PAR MINE (activation via « Gestion des Modules »).
// Ils ne sont PAS attribuables par utilisateur : leur visibilité dépend de
// l'activation du module sur la mine, pas du profil de permissions individuel.
// Affichés en lecture seule dans l'étape modules pour que l'admin ait une
// vue complète. Tenir à jour si de nouveaux modules « par mine » sont ajoutés.
// ─────────────────────────────────────────────────────────────────────────
const MINE_MANAGED_MODULES: { key: string; fr: string }[] = [
    { key: 'emergency', fr: 'Gestion des Urgences' },
    { key: 'dosimetry', fr: 'Dosimétrie & Expositions' },
    { key: 'blast', fr: 'Gestion des Dynamitages' },
    { key: 'planning', fr: 'Planification Annuelle' },
    { key: 'reports', fr: 'Rapports & Analytics' },
];

/** Codes d'erreur backend → étape/champ à corriger (le message vient de l'i18n). */
const API_ERROR_TARGETS: Record<string, { step?: number; field?: string }> = {
    LOGIN_TOO_SHORT: { step: 1, field: 'login' },
    LOGIN_INVALID_FORMAT: { step: 1, field: 'login' },
    EMAIL_INVALID: { step: 1, field: 'email' },
    NAME_REQUIRED: { step: 1, field: 'name' },
    ROLE_REQUIRED: { step: 2 },
    COMPANY_REQUIRED: { step: 1, field: 'companyId' },
    COMPANY_NOT_FOUND: { step: 1, field: 'companyId' },
    MODULES_REQUIRED: { step: 2 },
    LOGIN_ALREADY_EXISTS: { step: 1, field: 'login' },
    DIRECTORY_DISABLED: { step: 0 },
    PERMISSIONS_INIT_FAILED: {},
};

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────

export default function CreateUserPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('navigation');

    const STEPS = useMemo(() => ([
        { title: t('userMgmt.create.stepSourceTitle'), hint: t('userMgmt.create.stepSourceHint') },
        { title: t('userMgmt.create.stepIdentityTitle'), hint: t('userMgmt.create.stepIdentityHint') },
        { title: t('userMgmt.create.stepModulesTitle'), hint: t('userMgmt.create.stepModulesHint') },
        { title: t('userMgmt.create.stepSummaryTitle'), hint: t('userMgmt.create.stepSummaryHint') },
    ]), [t]);

    const [step, setStep] = useState(0);
    const [identitySource, setIdentitySource] = useState<IdentitySource>('LOCAL');
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [createdResponse, setCreatedResponse] = useState<CreateUserResponse | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    // Modale « Message de bienvenue » premium (affichée après création réussie)
    const [welcomeOpen, setWelcomeOpen] = useState(false);
    const [createdName, setCreatedName] = useState('');

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
            // Multi-mines : périmètre autorisé + accès consolidé
            assignedCompanyIds: [] as string[],
            allMinesAccess: false,
        },
        validate: {
            login: (v) => validateLogin(v),
            email: (v) => validateEmail(v),
            name: (v) => (v.trim().length === 0 ? t('userMgmt.create.apiErrors.NAME_REQUIRED') : null),
            role: (v) => (v.trim().length === 0 ? t('userMgmt.create.apiErrors.ROLE_REQUIRED') : null),
            companyId: (v) => (!v ? t('userMgmt.create.apiErrors.COMPANY_REQUIRED') : null),
            assignedCompanyIds: (v, values) =>
                (!values.allMinesAccess && (!v || v.length === 0))
                    ? t('userMgmt.create.errorAssignedRequired')
                    : null,
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
            .catch(() => errorNotification(t('userMgmt.create.loadCompaniesError')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const roleLabel = (value: string) => t(`userMgmt.create.roles.${value}`, { defaultValue: value });
    const roleDesc = (value: string) => t(`userMgmt.create.roleDesc.${value}`, { defaultValue: '' });
    const moduleLabel = (id: string) => t(`userMgmt.create.modules.${id}`, { defaultValue: id });
    const categoryLabel = (key: string) => t(`userMgmt.create.categories.${key}`, { defaultValue: key });

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
            || v.assignedCompanyIds.length > 0 || v.allMinesAccess
            || adUser || identitySource !== 'LOCAL' || step > 0
        );
    }, [form.values, adUser, identitySource, step]);

    const companyLabel = (id: string | null) => {
        if (!id) return '—';
        const c = companies.find((x) => String(x.id) === id);
        return c?.name || c?.shortName || `#${id}`;
    };

    const departmentLabel = (id: string | null) => {
        if (!id) return '—';
        const d = departments.find((x) => String(x.id) === id);
        return d?.name || `#${id}`;
    };

    // ── Options mines (Select / MultiSelect) ──
    const companyOptions = useMemo(
        () => companies.map((c) => ({
            value: String(c.id),
            label: c.name || c.shortName || `#${c.id}`,
        })),
        [companies]
    );

    /**
     * Choix de design « mine principale » :
     * la mine principale (companyId) est TOUJOURS explicite et obligatoire.
     * - Accès restreint : elle est contrainte aux mines assignées ; par défaut la
     *   1re mine sélectionnée, mais l'admin peut en choisir une autre parmi elles.
     * - Accès à toutes les mines : elle est choisie librement dans la liste complète
     *   (mine active par défaut à l'ouverture de session).
     */
    const mainMineOptions = useMemo(() => {
        if (form.values.allMinesAccess) return companyOptions;
        const allowed = new Set(form.values.assignedCompanyIds);
        return companyOptions.filter((o) => allowed.has(o.value));
    }, [companyOptions, form.values.allMinesAccess, form.values.assignedCompanyIds]);

    /** Sélection des mines assignées — garde la mine principale cohérente. */
    const handleAssignedChange = (vals: string[]) => {
        form.setFieldValue('assignedCompanyIds', vals);
        if (vals.length > 0) form.clearFieldError('assignedCompanyIds');
        // La mine principale doit rester dans le périmètre : sinon on reprend la 1re.
        if (!form.values.companyId || !vals.includes(form.values.companyId)) {
            const next = vals[0] ?? null;
            form.setFieldValue('companyId', next);
            form.setFieldValue('departmentId', null);
            if (next) form.clearFieldError('companyId');
        }
    };

    /** Bascule « accès à toutes les mines ». */
    const handleAllMinesToggle = (checked: boolean) => {
        form.setFieldValue('allMinesAccess', checked);
        if (checked) {
            form.clearFieldError('assignedCompanyIds');
        } else if (form.values.companyId && form.values.assignedCompanyIds.length === 0) {
            // Repli : amorcer le périmètre avec la mine principale déjà choisie.
            form.setFieldValue('assignedCompanyIds', [form.values.companyId]);
        }
    };

    /** Mise à jour de la mine principale (réinitialise le département filtré). */
    const handleMainMineChange = (v: string | null) => {
        form.setFieldValue('companyId', v);
        form.setFieldValue('departmentId', null);
        if (v) form.clearFieldError('companyId');
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
            cat.modules.forEach((m) => { if (on) next.add(m); else next.delete(m); });
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
                    errorNotification(t('userMgmt.create.errorAdDisabled'));
                    return false;
                }
                if (!adUser) {
                    errorNotification(t('userMgmt.create.errorSelectAd'));
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
                errorNotification(t('userMgmt.create.errorSelectModule'));
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
                assignedCompanyIds: form.values.allMinesAccess
                    ? []
                    : form.values.assignedCompanyIds.map((id) => Number(id)),
                allMinesAccess: form.values.allMinesAccess,
                departmentId: form.values.departmentId ? Number(form.values.departmentId) : undefined,
                identitySource,
            });
            setCreatedResponse(resp);
            setCreatedName(form.values.name.trim());
            successNotification(t('userMgmt.create.createdSuccess', { login: resp.login }));
            // Ouvre la modale « Message de bienvenue » premium (comptes LOCAL avec MDP).
            if (resp.temporaryPassword) setWelcomeOpen(true);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { errorMessage?: string; error?: string } } };
            const code = err?.response?.data?.errorMessage || err?.response?.data?.error;
            const target = code ? API_ERROR_TARGETS[code] : undefined;
            if (target) {
                const message = t(`userMgmt.create.apiErrors.${code}`, { defaultValue: code as string });
                if (target.field) form.setFieldError(target.field, message);
                if (target.step !== undefined) setStep(target.step);
                errorNotification(message);
            } else {
                errorNotification(code || t('userMgmt.create.errorGeneric'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // SOUS-RENDUS
    // ─────────────────────────────────────────────────────────────────────

    const progressPct = createdResponse ? 100 : Math.round(((step + 1) / STEPS.length) * 100);

    /** Stepper horizontal en haut — numéros + intitulés, état complété/actif. */
    const stepHeader = (
        <div className="px-4 sm:px-5 lg:px-6 pt-5">
            <nav
                aria-label={t('userMgmt.create.railTitle')}
                className="bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-3 sm:px-4"
            >
                <ol className="flex items-center">
                    {STEPS.map((s, i) => {
                        const done = createdResponse ? true : i < step;
                        const active = !createdResponse && i === step;
                        const clickable = !createdResponse && !submitting && i < step;
                        return (
                            <li key={s.title} className={`flex items-center min-w-0 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                                <button
                                    type="button"
                                    onClick={() => handleRailClick(i)}
                                    disabled={!clickable}
                                    className={`flex items-center gap-2.5 min-w-0 rounded-lg px-2 py-1.5 text-left transition ${
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
                                    <span className="hidden min-w-0 sm:block">
                                        <span className={`block text-[12.5px] leading-snug truncate ${
                                            active ? 'text-teal-800 font-medium' : done ? 'text-slate-700' : 'text-slate-400'
                                        }`}>
                                            {s.title}
                                        </span>
                                        <span className="block text-[10.5px] text-slate-400 leading-snug truncate">
                                            {s.hint}
                                        </span>
                                    </span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mx-2 min-w-[12px] transition-colors ${done ? 'bg-teal-300' : 'bg-slate-200'}`} aria-hidden="true" />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
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
                    {t('userMgmt.create.sourceQuestion')}
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                    {t('userMgmt.create.sourceIntro')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sourceCard(
                    'LOCAL',
                    <IconKey size={20} stroke={1.8} />,
                    t('userMgmt.create.sourceLocalTitle'),
                    t('userMgmt.create.sourceLocalDesc'),
                )}
                {sourceCard(
                    'ACTIVE_DIRECTORY',
                    <IconAddressBook size={20} stroke={1.8} />,
                    t('userMgmt.create.sourceAdTitle'),
                    t('userMgmt.create.sourceAdDesc'),
                    dirStatusLoading ? (
                        <Loader size={12} color="teal" />
                    ) : dirStatus?.demoMode ? (
                        <Badge color="violet" variant="light" size="xs">{t('userMgmt.create.badgeDemoDirectory')}</Badge>
                    ) : dirStatus && !dirStatus.enabled ? (
                        <Badge color="gray" variant="light" size="xs">{t('userMgmt.create.badgeConnectorDisabled')}</Badge>
                    ) : undefined,
                    !dirStatusLoading && (!dirStatus || !dirStatus.enabled),
                )}
            </div>

            {/* ── Recherche dans l'annuaire (si AD sélectionné) ── */}
            {identitySource === 'ACTIVE_DIRECTORY' && dirStatus?.enabled && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                    <TextInput
                        label={t('userMgmt.create.adSearchLabel')}
                        placeholder={t('userMgmt.create.adSearchPlaceholder')}
                        leftSection={adSearching ? <Loader size={14} color="teal" /> : <IconSearch size={14} />}
                        value={adQuery}
                        onChange={(e) => setAdQuery(e.currentTarget.value)}
                        description={dirStatus.demoMode
                            ? t('userMgmt.create.adSearchDescDemo')
                            : t('userMgmt.create.adSearchDescConnected', { host: dirStatus.host || 'LDAP' })}
                    />

                    {adUser && (
                        <Alert color="teal" variant="light" icon={<IconCircleCheck size={16} />}>
                            <Text size="sm">
                                {t('userMgmt.create.adProfileSelected', { name: adUser.displayName, login: adUser.login })}
                            </Text>
                        </Alert>
                    )}

                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                        {adResults.length === 0 && !adSearching && (
                            <p className="text-[12.5px] text-slate-500 text-center py-6">
                                {t('userMgmt.create.adNoResults')}
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
                                                <Badge color="gray" variant="light" size="xs">{t('userMgmt.create.adAlreadyImported')}</Badge>
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
                    {t('userMgmt.create.identityTitle')}
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                    {adUser
                        ? t('userMgmt.create.identityIntroAd')
                        : t('userMgmt.create.identityIntroLocal')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                    label={t('userMgmt.create.fieldName')}
                    placeholder={t('userMgmt.create.fieldNamePlaceholder')}
                    leftSection={<IconUser size={14} />}
                    rightSection={adUser ? adLockBadge : undefined}
                    rightSectionWidth={adUser ? 52 : undefined}
                    disabled={!!adUser}
                    {...form.getInputProps('name')}
                    required
                />
                <TextInput
                    label={t('userMgmt.create.fieldLogin')}
                    placeholder={t('userMgmt.create.fieldLoginPlaceholder')}
                    leftSection={<IconUser size={14} />}
                    rightSection={adUser ? adLockBadge : undefined}
                    rightSectionWidth={adUser ? 52 : undefined}
                    disabled={!!adUser}
                    {...form.getInputProps('login')}
                    required
                />
                <TextInput
                    label={t('userMgmt.create.fieldEmail')}
                    placeholder={t('userMgmt.create.fieldEmailPlaceholder')}
                    leftSection={<IconMail size={14} />}
                    rightSection={adUser ? adLockBadge : undefined}
                    rightSectionWidth={adUser ? 52 : undefined}
                    disabled={!!adUser}
                    {...form.getInputProps('email')}
                    required
                />
                <TextInput
                    label={t('userMgmt.create.fieldPhone')}
                    placeholder={t('userMgmt.create.fieldPhonePlaceholder')}
                    leftSection={<IconPhone size={14} />}
                    {...form.getInputProps('phoneNumber')}
                />
            </div>

            <div className="pt-4 border-t border-slate-100">
                <h3
                    className="text-slate-900 mb-1"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500, fontSize: 14.5 }}
                >
                    {t('userMgmt.create.orgTitle')}
                </h3>
                <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
                    {t('userMgmt.create.orgIntro')}
                </p>

                {/* ── Switch : accès à toutes les mines (vue consolidée) ── */}
                <div className={`flex items-start gap-3 rounded-xl border p-3.5 mb-4 transition ${
                    form.values.allMinesAccess ? 'bg-teal-50/60 border-teal-300' : 'bg-slate-50/60 border-slate-200'
                }`}>
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                        form.values.allMinesAccess ? 'bg-teal-700 text-white' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                        <IconWorld size={18} stroke={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <Switch
                            color="teal"
                            checked={form.values.allMinesAccess}
                            onChange={(e) => handleAllMinesToggle(e.currentTarget.checked)}
                            label={
                                <span className="text-[13.5px] font-medium text-slate-800">
                                    {t('userMgmt.create.allMinesLabel')}
                                </span>
                            }
                        />
                        <p className="text-[12px] text-slate-500 leading-snug mt-1">
                            {t('userMgmt.create.allMinesDesc')}
                        </p>
                    </div>
                </div>

                {form.values.allMinesAccess ? (
                    /* ── Accès consolidé : encart explicatif + mine principale ── */
                    <div className="space-y-4">
                        <Alert color="teal" variant="light" icon={<IconWorld size={16} />}>
                            <Text size="xs">{t('userMgmt.create.allMinesNotice')}</Text>
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label={t('userMgmt.create.fieldMainMine')}
                                placeholder={t('userMgmt.create.fieldMainMinePlaceholder')}
                                leftSection={<IconStar size={14} />}
                                data={mainMineOptions}
                                searchable
                                value={form.values.companyId}
                                onChange={handleMainMineChange}
                                error={form.errors.companyId}
                                description={t('userMgmt.create.fieldMainMineDescAll')}
                                required
                            />
                            <Select
                                label={t('userMgmt.create.fieldDepartment')}
                                placeholder={form.values.companyId ? t('userMgmt.create.fieldDepartmentOptional') : t('userMgmt.create.fieldDepartmentNeedMine')}
                                data={departments.map((d) => ({
                                    value: String(d.id),
                                    label: d.name || `#${d.id}`,
                                }))}
                                searchable
                                clearable
                                disabled={!form.values.companyId || departments.length === 0}
                                value={form.values.departmentId}
                                onChange={(v) => form.setFieldValue('departmentId', v)}
                                description={form.values.companyId && departments.length === 0
                                    ? t('userMgmt.create.fieldDepartmentNone')
                                    : undefined}
                            />
                        </div>
                    </div>
                ) : (
                    /* ── Accès restreint : mines assignées (chips) + mine principale ── */
                    <div className="space-y-4">
                        <MultiSelect
                            label={t('userMgmt.create.fieldAssignedMines')}
                            placeholder={form.values.assignedCompanyIds.length === 0
                                ? t('userMgmt.create.fieldAssignedMinesPlaceholder')
                                : undefined}
                            leftSection={<IconBuildingFactory2 size={14} />}
                            data={companyOptions}
                            searchable
                            clearable
                            hidePickedOptions
                            value={form.values.assignedCompanyIds}
                            onChange={handleAssignedChange}
                            error={form.errors.assignedCompanyIds}
                            description={t('userMgmt.create.fieldAssignedMinesDesc')}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label={t('userMgmt.create.fieldMainMine')}
                                placeholder={t('userMgmt.create.fieldMainMinePlaceholder')}
                                leftSection={<IconStar size={14} />}
                                data={mainMineOptions}
                                searchable
                                disabled={form.values.assignedCompanyIds.length === 0}
                                value={form.values.companyId}
                                onChange={handleMainMineChange}
                                error={form.errors.companyId}
                                description={form.values.assignedCompanyIds.length === 0
                                    ? t('userMgmt.create.fieldMainMineNeedAssigned')
                                    : t('userMgmt.create.fieldMainMineDescRestricted')}
                                required
                            />
                            <Select
                                label={t('userMgmt.create.fieldDepartment')}
                                placeholder={form.values.companyId ? t('userMgmt.create.fieldDepartmentOptional') : t('userMgmt.create.fieldDepartmentNeedMine')}
                                data={departments.map((d) => ({
                                    value: String(d.id),
                                    label: d.name || `#${d.id}`,
                                }))}
                                searchable
                                clearable
                                disabled={!form.values.companyId || departments.length === 0}
                                value={form.values.departmentId}
                                onChange={(v) => form.setFieldValue('departmentId', v)}
                                description={form.values.companyId && departments.length === 0
                                    ? t('userMgmt.create.fieldDepartmentNone')
                                    : undefined}
                            />
                        </div>
                    </div>
                )}
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
                        {t('userMgmt.create.roleTitle')}
                    </h2>
                    <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                        {t('userMgmt.create.roleIntro')}
                    </p>
                </div>
                <Select
                    label={t('userMgmt.create.fieldRole')}
                    placeholder={t('userMgmt.create.fieldRolePlaceholder')}
                    leftSection={<IconShieldCheck size={14} />}
                    data={PREDEFINED_ROLES.map((r) => ({ value: r.value, label: roleLabel(r.value) }))}
                    {...form.getInputProps('role')}
                    required
                />
                {selectedRoleInfo && (
                    <Paper p="sm" radius="md" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
                        <Group gap={6} mb={4}>
                            <Badge color={selectedRoleInfo.color} variant="filled" size="sm">
                                {roleLabel(selectedRoleInfo.value)}
                            </Badge>
                            <Text size="xs" c="dimmed">
                                {t('userMgmt.create.roleDefaultModules', { count: selectedRoleInfo.defaultModules.length })}
                            </Text>
                            {presetDelta.isCustom && (
                                <Badge color="amber" variant="light" size="sm">
                                    {t('userMgmt.create.custom')}
                                    {presetDelta.added > 0 && ` · +${presetDelta.added}`}
                                    {presetDelta.removed > 0 && ` · −${presetDelta.removed}`}
                                </Badge>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed">{roleDesc(selectedRoleInfo.value)}</Text>
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
                            {t('userMgmt.create.modulesTitle')}
                        </h2>
                        <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                            {t('userMgmt.create.modulesIntro', { name: form.values.name || t('userMgmt.create.modulesIntroFallback') })}
                        </p>
                    </div>
                    <Badge variant="filled" color={selectedModules.size === 0 ? 'red' : 'teal'} size="lg">
                        {t('userMgmt.create.modulesSelected', { count: selectedModules.size })}
                    </Badge>
                </div>

                {selectedModules.size === 0 && (
                    <Alert color="red" variant="light" icon={<IconAlertCircle size={14} />}>
                        <Text size="xs">
                            {t('userMgmt.create.modulesRequired')}
                        </Text>
                    </Alert>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {MODULE_CATEGORIES.map((cat) => {
                        const catSelectedCount = cat.modules.filter((m) => selectedModules.has(m)).length;
                        const allSelected = catSelectedCount === cat.modules.length;
                        return (
                            <Paper key={cat.key} p="sm" radius="md" style={{ border: '1px solid #E2E8F0' }}>
                                <Group justify="space-between" mb={8} wrap="nowrap">
                                    <Group gap={6} wrap="nowrap">
                                        <Badge color={cat.color} variant="dot" size="sm">{categoryLabel(cat.key)}</Badge>
                                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                            {catSelectedCount}/{cat.modules.length}
                                        </Text>
                                    </Group>
                                    <Switch
                                        size="xs"
                                        color={cat.color}
                                        label={allSelected ? t('userMgmt.create.toggleAllOff') : t('userMgmt.create.toggleAllOn')}
                                        checked={allSelected}
                                        onChange={(e) => toggleCategory(cat, e.currentTarget.checked)}
                                    />
                                </Group>
                                <Stack gap={6}>
                                    {cat.modules.map((m) => (
                                        <Checkbox
                                            key={m}
                                            size="sm"
                                            color={cat.color}
                                            label={moduleLabel(m)}
                                            checked={selectedModules.has(m)}
                                            onChange={() => toggleModule(m)}
                                        />
                                    ))}
                                </Stack>
                            </Paper>
                        );
                    })}

                    {/* Catégorie « Modules par mine » : activés par site via
                        « Gestion des Modules », non attribuables par utilisateur. */}
                    <Paper p="sm" radius="md" style={{ border: '1px dashed #CBD5E1', background: '#F8FAFC' }}>
                        <Group justify="space-between" mb={8} wrap="nowrap">
                            <Group gap={6} wrap="nowrap">
                                <Badge color="gray" variant="dot" size="sm">
                                    {t('userMgmt.create.categories.mineManaged', { defaultValue: 'Modules par mine' })}
                                </Badge>
                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                    {t('userMgmt.create.mineManagedBadge', { defaultValue: 'activés par site' })}
                                </Text>
                            </Group>
                            <IconBuildingFactory2 size={15} className="text-slate-400" />
                        </Group>
                        <Stack gap={6}>
                            {MINE_MANAGED_MODULES.map((m) => (
                                <Group key={m.key} justify="space-between" wrap="nowrap" gap={8}>
                                    <Text size="sm" c="dimmed">
                                        {t(`userMgmt.create.mineModules.${m.key}`, { defaultValue: m.fr })}
                                    </Text>
                                    <Badge size="xs" variant="light" color="gray" leftSection={<IconLock size={9} />}>
                                        {t('userMgmt.create.mineManagedTag', { defaultValue: 'par mine' })}
                                    </Badge>
                                </Group>
                            ))}
                        </Stack>
                        <Text size="xs" c="dimmed" mt={8}>
                            {t('userMgmt.create.mineModulesHint', {
                                defaultValue: "Activés par mine via « Gestion des Modules », non réglables par utilisateur.",
                            })}
                        </Text>
                    </Paper>
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
                    {t('userMgmt.create.summaryTitle')}
                </h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                    {t('userMgmt.create.summaryIntro')}
                </p>
            </div>

            <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                {summaryRow(t('userMgmt.create.summarySource'), identitySource === 'LOCAL' ? (
                    <Badge color="teal" variant="light" leftSection={<IconKey size={10} />}>{t('userMgmt.create.summaryLocal')}</Badge>
                ) : (
                    <Group gap={6}>
                        <Badge color="violet" variant="light" leftSection={<IconAddressBook size={10} />}>
                            {t('userMgmt.create.sourceAdTitle')}
                        </Badge>
                        {dirStatus?.demoMode && <Badge color="violet" variant="outline" size="xs">{t('userMgmt.create.badgeDemoDirectory')}</Badge>}
                    </Group>
                ))}
                {summaryRow(t('userMgmt.create.summaryName'), form.values.name || '—')}
                {summaryRow(t('userMgmt.create.summaryLogin'), <Code>{form.values.login}</Code>)}
                {summaryRow(t('userMgmt.create.summaryEmail'), form.values.email || '—')}
                {summaryRow(t('userMgmt.create.summaryPhone'), form.values.phoneNumber || '—')}
                {summaryRow(t('userMgmt.create.summaryAssignedMines'), form.values.allMinesAccess ? (
                    <Badge color="teal" variant="light" leftSection={<IconWorld size={10} />}>
                        {t('userMgmt.create.summaryAllMines')}
                    </Badge>
                ) : form.values.assignedCompanyIds.length > 0 ? (
                    <Group gap={6}>
                        {form.values.assignedCompanyIds.map((id) => (
                            <Badge key={id} color="gray" variant="light" leftSection={<IconBuildingFactory2 size={10} />}>
                                {companyLabel(id)}
                            </Badge>
                        ))}
                    </Group>
                ) : '—')}
                {summaryRow(t('userMgmt.create.summaryMainMine'), (
                    <Badge color="teal" variant="light" leftSection={<IconStar size={10} />}>
                        {companyLabel(form.values.companyId)}
                    </Badge>
                ))}
                {summaryRow(t('userMgmt.create.summaryDepartment'), departmentLabel(form.values.departmentId))}
                {summaryRow(t('userMgmt.create.summaryRole'), (
                    <Badge color={selectedRoleInfo?.color} variant="light">{selectedRoleInfo ? roleLabel(selectedRoleInfo.value) : '—'}</Badge>
                ))}
                {summaryRow(t('userMgmt.create.summaryModules'), (
                    <Group gap={6}>
                        <Badge color="teal" variant="filled">{t('userMgmt.create.summaryModulesCount', { count: selectedModules.size })}</Badge>
                        {presetDelta.isCustom && (
                            <Badge color="amber" variant="light" size="sm">{t('userMgmt.create.custom')}</Badge>
                        )}
                    </Group>
                ))}
            </Paper>

            {identitySource === 'LOCAL' ? (
                <Alert color="blue" variant="light" icon={<IconAlertCircle size={14} />}>
                    <Text size="xs">{t('userMgmt.create.summaryLocalNotice')}</Text>
                </Alert>
            ) : (
                <Alert color="violet" variant="light" icon={<IconAddressBook size={14} />}>
                    <Text size="xs">{t('userMgmt.create.summaryAdNotice')}</Text>
                </Alert>
            )}
        </div>
    );

    /** Écran de succès — MDP temporaire affiché UNE SEULE FOIS. */
    const renderSuccess = createdResponse && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
            <Alert color="teal" variant="light" icon={<IconCircleCheck size={16} />}>
                <Text size="sm" fw={500}>{t('userMgmt.create.successTitle')}</Text>
                <Text size="xs" c="dimmed">{createdResponse.message}</Text>
            </Alert>

            <Paper p="md" radius="md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                {summaryRow(t('userMgmt.create.summaryLogin'), <Code>{createdResponse.login}</Code>)}
                {summaryRow(t('userMgmt.create.summaryEmail'), (
                    <Group gap={6}>
                        <span>{createdResponse.email}</span>
                        {createdResponse.emailSent && (
                            <Badge color="teal" size="xs" variant="light">{t('userMgmt.create.successEmailSent')}</Badge>
                        )}
                    </Group>
                ))}
            </Paper>

            {identitySource === 'ACTIVE_DIRECTORY' ? (
                <Alert color="violet" variant="light" icon={<IconAddressBook size={16} />}>
                    <Text size="sm">{t('userMgmt.create.successAdNotice')}</Text>
                </Alert>
            ) : createdResponse.emailSent ? (
                <Alert color="teal" variant="light" icon={<IconMail size={16} />}>
                    <Text size="sm">{t('userMgmt.create.successEmailNotice', { email: createdResponse.email })}</Text>
                </Alert>
            ) : null}

            {createdResponse.temporaryPassword && (
                <Paper p="md" radius="md" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <Group gap={6} align="center" mb={6}>
                        <IconClock size={14} stroke={1.8} className="text-amber-700" />
                        <Text size="xs" fw={500} tt="uppercase" style={{ color: '#92400E', letterSpacing: 0.4 }}>
                            {t('userMgmt.create.tempPasswordTitle')}
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
                                    {copied ? t('userMgmt.list.copied') : t('userMgmt.list.copy')}
                                </Button>
                            )}
                        </CopyButton>
                    </Group>
                    <Text size="xs" mt={6} style={{ color: '#92400E' }}>
                        {t('userMgmt.create.tempPasswordNotice')}
                    </Text>
                </Paper>
            )}

            <Group justify="flex-end">
                <Button
                    leftSection={<IconArrowLeft size={14} />}
                    onClick={() => navigate('/users-admin')}
                    styles={{ root: { background: '#0F766E' } }}
                >
                    {t('userMgmt.create.backToList')}
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
                        aria-label={t('userMgmt.create.backAria')}
                        title={t('userMgmt.create.backAria')}
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                    </button>
                    <span className="uppercase tracking-[0.16em] font-medium">{t('userMgmt.create.breadcrumbAdmin')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">{t('userMgmt.create.breadcrumbUsers')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-teal-700 font-medium">{t('userMgmt.create.breadcrumbNew')}</span>
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
                                {t('userMgmt.create.title')}
                            </h1>
                            <p className="text-[12.5px] text-slate-500 mt-0.5">
                                {t('userMgmt.create.headerSubtitle')}
                            </p>
                        </div>
                    </div>
                    <div className="min-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>
                                {createdResponse ? t('userMgmt.create.progressDone') : t('userMgmt.create.progressStep', { current: step + 1, total: STEPS.length })}
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

            {/* ── Stepper horizontal (toutes tailles) ── */}
            {stepHeader}

            {/* ── Corps : colonne pleine largeur ── */}
            <div className="px-4 sm:px-5 lg:px-6 py-5">
                <div className="mx-auto max-w-5xl min-w-0 space-y-4">
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
                                        {t('userMgmt.create.cancel')}
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
                                            {t('userMgmt.create.previous')}
                                        </Button>
                                    )}
                                    {step < STEPS.length - 1 ? (
                                        <Button
                                            rightSection={<IconChevronRight size={14} />}
                                            onClick={handleNext}
                                            disabled={step === 2 && selectedModules.size === 0}
                                            styles={{ root: { background: '#0F766E' } }}
                                        >
                                            {t('userMgmt.create.next')}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            loading={submitting}
                                            leftSection={<IconCheck size={14} />}
                                            styles={{
                                                root: {
                                                    background: '#0F766E',
                                                    fontWeight: 500,
                                                },
                                            }}
                                        >
                                            {t('userMgmt.create.submit')}
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
                title={<Text fw={500}>{t('userMgmt.create.cancelTitle')}</Text>}
                centered
                size="sm"
            >
                <Stack gap="md">
                    <Text size="sm">
                        {t('userMgmt.create.cancelText')}
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setCancelConfirm(false)}>
                            {t('userMgmt.create.cancelContinue')}
                        </Button>
                        <Button color="red" onClick={() => navigate('/users-admin')}>
                            {t('userMgmt.create.cancelConfirm')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* ── Modale « Message de bienvenue » premium — après création réussie ── */}
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
        </div>
    );
}
