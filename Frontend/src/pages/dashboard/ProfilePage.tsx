import { useEffect, useMemo, useState } from 'react';
import {
    IconUser,
    IconSettings,
    IconShieldLock,
    IconBell,
    IconCheck,
    IconAlertTriangle,
    IconMail,
    IconBuildingFactory2,
    IconBriefcase,
    IconPhone,
    IconWorld,
    IconMoon,
    IconSun,
    IconCalendarTime,
    IconKey,
    IconDeviceDesktop,
    IconLogout,
} from '@tabler/icons-react';
import {
    Avatar,
    Badge,
    Button,
    PasswordInput,
    Select,
    Switch,
    Tabs,
    Alert,
    Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../slices/hooks';
import { updatePassword } from '../../services/AccountService';
import useLogout from '../../hooks/useLogout';

/**
 * ProfilePage — Page utilisateur unifiée à onglets.
 *
 * Inspirée des standards modernes (GitHub, Linear, Notion) :
 * un seul écran "profil" qui regroupe les préoccupations user-level :
 *  - Informations personnelles (lecture / édition partielle)
 *  - Préférences applicatives (langue, thème, format date)
 *  - Sécurité (mot de passe, sessions)
 *  - Notifications (canaux + opt-ins)
 *
 * L'onglet actif est piloté par `?tab=` afin que les liens du ProfileMenu
 * puissent diriger l'utilisateur directement vers la section concernée
 * (ex : /profile?tab=security pour "Mot de passe & sécurité").
 *
 * Note : la BDD ne stocke pas (encore) les préférences ; on persiste
 * temporairement dans localStorage pour ne pas créer une fausse promesse
 * de persistance. Le code est prêt à brancher un endpoint dès qu'il existe.
 */

type TabKey = 'info' | 'preferences' | 'security' | 'notifications';

const TAB_KEYS: TabKey[] = ['info', 'preferences', 'security', 'notifications'];

const PREFS_KEY_BASE = 'safex.userPreferences.v1';
const NOTIFS_KEY_BASE = 'safex.notificationPreferences.v1';

/**
 * LOT 39 audit P1 fix : on scope les clés localStorage par utilisateur (sub JWT)
 * pour éviter qu'un compte hérite des préférences d'un autre sur poste partagé.
 */
function scopedKey(base: string, user: any): string {
    const sub = user?.sub || user?.login || user?.username || 'anon';
    return `${base}:${sub}`;
}

interface UserPreferences {
    language: 'fr' | 'en';
    theme: 'light' | 'dark' | 'system';
    dateFormat: 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MM/dd/yyyy';
    timezone: string;
}
const DEFAULT_PREFS: UserPreferences = {
    language: 'fr',
    theme: 'light',
    dateFormat: 'dd/MM/yyyy',
    timezone: 'Africa/Ouagadougou',
};

interface NotificationPrefs {
    email: { incidents: boolean; audits: boolean; reports: boolean; system: boolean };
    inApp: { incidents: boolean; audits: boolean; reports: boolean; system: boolean };
    sms: { incidents: boolean; audits: boolean };
}
const DEFAULT_NOTIFS: NotificationPrefs = {
    email: { incidents: true, audits: true, reports: false, system: true },
    inApp: { incidents: true, audits: true, reports: true, system: true },
    sms: { incidents: true, audits: false },
};

function loadJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return { ...fallback, ...JSON.parse(raw) };
    } catch {
        return fallback;
    }
}

function saveJSON<T>(key: string, value: T) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* quota or private-mode — silent */
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section header — visuel cohérent avec Mirka / Source Serif 4
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="mb-6">
            <h2
                className="text-slate-900"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 500,
                    fontSize: '20px',
                    letterSpacing: '-0.01em',
                }}
            >
                {title}
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const user: any = useAppSelector((state) => state.user) ?? {};
    const navigate = useNavigate();
    const location = useLocation();

    // Onglet courant pilote par ?tab=
    const tabFromUrl = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const raw = (params.get('tab') ?? 'info') as TabKey;
        return TAB_KEYS.includes(raw) ? raw : 'info';
    }, [location.search]);

    const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl);
    useEffect(() => setActiveTab(tabFromUrl), [tabFromUrl]);

    const handleTabChange = (next: string | null) => {
        if (!next) return;
        setActiveTab(next as TabKey);
        navigate(`/profile?tab=${next}`, { replace: true });
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-10 py-6">
            <div className="max-w-5xl mx-auto">

                {/* ═══ En-tête page ═══ */}
                <div className="mb-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        SafeX 360 · Mon compte
                    </p>
                    <h1
                        className="text-slate-900 mt-1.5"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 500,
                            fontSize: '30px',
                            letterSpacing: '-0.018em',
                        }}
                    >
                        Mon profil
                    </h1>
                </div>

                {/* ═══ Bandeau utilisateur ═══ */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
                    <div className="h-20 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600" />
                    <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
                        <Avatar
                            size={72}
                            name={user?.name}
                            color="initials"
                            autoContrast
                            variant="filled"
                            className="border-4 border-white shadow-md"
                        />
                        <div className="flex-1 pb-1 min-w-0">
                            <h2
                                className="text-slate-900 truncate"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '20px',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {user?.name || 'Utilisateur'}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[13px] text-slate-600 truncate">
                                    {user?.email || user?.username || '—'}
                                </span>
                                {user?.role && (
                                    <Badge size="sm" variant="light" color="teal" radius="sm">
                                        {user.role}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Onglets ═══ */}
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    keepMounted={false}
                    radius="md"
                    styles={{
                        list: {
                            borderBottom: '1px solid rgba(148,163,184,0.25)',
                        },
                        tab: {
                            fontSize: '13px',
                            letterSpacing: '0.005em',
                        },
                    }}
                >
                    <Tabs.List>
                        <Tabs.Tab value="info" leftSection={<IconUser size={15} />}>
                            Informations
                        </Tabs.Tab>
                        <Tabs.Tab value="preferences" leftSection={<IconSettings size={15} />}>
                            Préférences
                        </Tabs.Tab>
                        <Tabs.Tab value="security" leftSection={<IconShieldLock size={15} />}>
                            Sécurité
                        </Tabs.Tab>
                        <Tabs.Tab value="notifications" leftSection={<IconBell size={15} />}>
                            Notifications
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* ───── Informations ───── */}
                    <Tabs.Panel value="info" pt="lg">
                        <InfoPanel user={user} />
                    </Tabs.Panel>

                    {/* ───── Préférences ───── */}
                    <Tabs.Panel value="preferences" pt="lg">
                        <PreferencesPanel />
                    </Tabs.Panel>

                    {/* ───── Sécurité ───── */}
                    <Tabs.Panel value="security" pt="lg">
                        <SecurityPanel />
                    </Tabs.Panel>

                    {/* ───── Notifications ───── */}
                    <Tabs.Panel value="notifications" pt="lg">
                        <NotificationsPanel />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Onglet 1 — Informations personnelles
// ═════════════════════════════════════════════════════════════════════════════
function InfoPanel({ user }: { user: any }) {
    /**
     * Lecture seule pour l'instant : l'API d'édition de profil n'est pas exposée
     * côté frontend. On affiche les données dérivées du JWT (sub, role, email).
     * Le bandeau "Demande de modification" oriente l'utilisateur vers
     * l'administrateur — c'est le pattern HSE habituel (audit trail des
     * changements de comptes utilisateurs).
     */
    const rows: Array<{ icon: any; label: string; value: string }> = [
        { icon: IconUser, label: 'Nom complet', value: user?.name || '—' },
        { icon: IconMail, label: 'Email', value: user?.email || user?.username || '—' },
        { icon: IconBriefcase, label: 'Rôle', value: user?.role || '—' },
        { icon: IconBuildingFactory2, label: 'Site / mine', value: user?.mine || user?.site || 'Non assigné' },
        { icon: IconPhone, label: 'Téléphone', value: user?.phone || '—' },
        { icon: IconCalendarTime, label: 'Dernière connexion', value: user?.lastLogin || 'Cette session' },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="p-6">
                <SectionHeader
                    title="Informations personnelles"
                    description="Vos coordonnées telles qu'enregistrées dans SafeX 360."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-start gap-3">
                            <div className="mt-0.5 w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                <row.icon size={15} className="text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                                    {row.label}
                                </p>
                                <p className="text-[14px] text-slate-800 mt-0.5 truncate">
                                    {row.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <Alert
                    color="gray"
                    variant="light"
                    icon={<IconAlertTriangle size={16} />}
                    mt={28}
                    radius="md"
                    styles={{
                        title: { fontSize: '13px' },
                        message: { fontSize: '12.5px', color: '#475569' },
                    }}
                    title="Modification des informations"
                >
                    Pour modifier votre nom, votre rôle ou votre affectation,
                    contactez votre administrateur SafeX 360. Toute modification
                    de compte est tracée pour conformité ISO 27001.
                </Alert>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Onglet 2 — Préférences
// ═════════════════════════════════════════════════════════════════════════════
function PreferencesPanel() {
    const user: any = useAppSelector((state) => state.user) ?? {};
    const prefsKey = useMemo(() => scopedKey(PREFS_KEY_BASE, user), [user]);
    const [prefs, setPrefs] = useState<UserPreferences>(() => loadJSON(prefsKey, DEFAULT_PREFS));
    const [saved, setSaved] = useState(false);

    const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        const next = { ...prefs, [key]: value };
        setPrefs(next);
        saveJSON(prefsKey, next);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <SectionHeader
                        title="Préférences applicatives"
                        description="Personnalisez l'interface SafeX 360. Vos choix sont sauvegardés automatiquement."
                    />
                    {saved && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700">
                            <IconCheck size={14} /> Enregistré
                        </span>
                    )}
                </div>

                <div className="space-y-5">
                    <Select
                        label="Langue"
                        leftSection={<IconWorld size={15} className="text-slate-500" />}
                        value={prefs.language}
                        onChange={(v) => v && update('language', v as UserPreferences['language'])}
                        data={[
                            { value: 'fr', label: 'Français' },
                            { value: 'en', label: 'English' },
                        ]}
                        radius="md"
                        size="md"
                    />

                    <Select
                        label="Thème de l'interface"
                        leftSection={
                            prefs.theme === 'dark'
                                ? <IconMoon size={15} className="text-slate-500" />
                                : <IconSun size={15} className="text-slate-500" />
                        }
                        value={prefs.theme}
                        onChange={(v) => v && update('theme', v as UserPreferences['theme'])}
                        data={[
                            { value: 'light', label: 'Clair (recommandé)' },
                            { value: 'dark', label: 'Sombre' },
                            { value: 'system', label: 'Suivre le système' },
                        ]}
                        radius="md"
                        size="md"
                        description="Le thème sombre sera disponible prochainement."
                    />

                    <Select
                        label="Format de date"
                        leftSection={<IconCalendarTime size={15} className="text-slate-500" />}
                        value={prefs.dateFormat}
                        onChange={(v) => v && update('dateFormat', v as UserPreferences['dateFormat'])}
                        data={[
                            { value: 'dd/MM/yyyy', label: 'JJ/MM/AAAA (français)' },
                            { value: 'yyyy-MM-dd', label: 'AAAA-MM-JJ (ISO 8601)' },
                            { value: 'MM/dd/yyyy', label: 'MM/JJ/AAAA (anglais)' },
                        ]}
                        radius="md"
                        size="md"
                    />

                    <Select
                        label="Fuseau horaire"
                        value={prefs.timezone}
                        onChange={(v) => v && update('timezone', v)}
                        data={[
                            { value: 'Africa/Ouagadougou', label: 'Ouagadougou (UTC+0)' },
                            { value: 'Africa/Bamako', label: 'Bamako (UTC+0)' },
                            { value: 'Africa/Conakry', label: 'Conakry (UTC+0)' },
                            { value: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
                            { value: 'Africa/Abidjan', label: 'Abidjan (UTC+0)' },
                            { value: 'Africa/Monrovia', label: 'Monrovia (UTC+0)' },
                            { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
                        ]}
                        radius="md"
                        size="md"
                    />
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Onglet 3 — Sécurité
// ═════════════════════════════════════════════════════════════════════════════
function SecurityPanel() {
    const user: any = useAppSelector((state) => state.user) ?? {};
    const logout = useLogout();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const form = useForm({
        initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        validate: {
            currentPassword: (v) => (!v ? 'Mot de passe actuel requis' : null),
            newPassword: (v) => {
                if (!v) return 'Nouveau mot de passe requis';
                if (v.length < 10) return 'Au moins 10 caractères';
                if (!/[A-Z]/.test(v)) return 'Au moins une majuscule';
                if (!/[a-z]/.test(v)) return 'Au moins une minuscule';
                if (!/[0-9]/.test(v)) return 'Au moins un chiffre';
                if (!/[^A-Za-z0-9]/.test(v)) return 'Au moins un caractère spécial';
                return null;
            },
            confirmPassword: (v, values) =>
                v !== values.newPassword ? 'Les mots de passe ne correspondent pas' : null,
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setErrorMsg(null);
        setSuccess(false);
        setLoading(true);
        try {
            // LOT 39 audit P0 fix : aligné avec le DTO backend.
            // - `login` permet au backend de résoudre le compte côté serveur
            //   (sans faire confiance à un id confié au client).
            // - `oldPassword` est obligatoirement vérifié par le backend.
            // - `password` porte le nouveau mot de passe (mapping AccountDTO.password).
            await updatePassword({
                login: user?.sub || user?.login || user?.username,
                oldPassword: values.currentPassword,
                password: values.newPassword,
            });
            setSuccess(true);
            form.reset();
        } catch (e: any) {
            setErrorMsg(
                e?.response?.data?.message ||
                e?.response?.data ||
                'Impossible de modifier le mot de passe. Vérifiez votre mot de passe actuel.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* ─── Bloc changement de mot de passe ─── */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <div className="p-6">
                    <SectionHeader
                        title="Mot de passe"
                        description="Choisissez un mot de passe robuste (≥10 caractères, majuscule, minuscule, chiffre, caractère spécial)."
                    />

                    {success && (
                        <Alert
                            color="teal"
                            icon={<IconCheck size={16} />}
                            radius="md"
                            mb={16}
                            styles={{ message: { fontSize: '13px' } }}
                        >
                            Mot de passe modifié avec succès.
                        </Alert>
                    )}

                    {errorMsg && (
                        <Alert
                            color="red"
                            icon={<IconAlertTriangle size={16} />}
                            radius="md"
                            mb={16}
                            styles={{ message: { fontSize: '13px' } }}
                        >
                            {errorMsg}
                        </Alert>
                    )}

                    <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4 max-w-lg">
                        <PasswordInput
                            label="Mot de passe actuel"
                            placeholder="••••••••"
                            leftSection={<IconKey size={15} className="text-slate-500" />}
                            radius="md"
                            size="md"
                            autoComplete="current-password"
                            {...form.getInputProps('currentPassword')}
                        />
                        <PasswordInput
                            label="Nouveau mot de passe"
                            placeholder="••••••••"
                            leftSection={<IconKey size={15} className="text-slate-500" />}
                            radius="md"
                            size="md"
                            autoComplete="new-password"
                            description="≥10 car. · majuscule · minuscule · chiffre · spécial"
                            {...form.getInputProps('newPassword')}
                        />
                        <PasswordInput
                            label="Confirmer le nouveau mot de passe"
                            placeholder="••••••••"
                            leftSection={<IconKey size={15} className="text-slate-500" />}
                            radius="md"
                            size="md"
                            autoComplete="new-password"
                            {...form.getInputProps('confirmPassword')}
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                loading={loading}
                                radius="md"
                                size="md"
                                color="teal"
                                rightSection={loading ? <Loader size="xs" color="white" /> : null}
                            >
                                Mettre à jour le mot de passe
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ─── Session active ─── */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <div className="p-6">
                    <SectionHeader
                        title="Sessions actives"
                        description="Liste des sessions actuellement ouvertes sur votre compte."
                    />

                    <div className="border border-slate-200 rounded-lg p-4 flex items-start gap-3 bg-slate-50/40">
                        <div className="mt-0.5 w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                            <IconDeviceDesktop size={16} className="text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[13.5px] text-slate-800">Cette session</span>
                                <Badge size="xs" color="emerald" variant="light" radius="sm">Active</Badge>
                            </div>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Navigateur courant · {(navigator as any)?.userAgentData?.platform ?? navigator?.platform ?? 'inconnu'}
                            </p>
                        </div>
                    </div>

                    <Alert
                        color="gray"
                        variant="light"
                        icon={<IconAlertTriangle size={15} />}
                        mt={14}
                        radius="md"
                        styles={{ message: { fontSize: '12.5px', color: '#475569' } }}
                    >
                        La gestion multi-session (révocation à distance, journal de connexions)
                        sera disponible prochainement.
                    </Alert>
                </div>
            </div>

            {/* ─── Déconnexion ─── */}
            <div className="bg-white rounded-xl border border-red-100 shadow-sm">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3
                            className="text-slate-900"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 500,
                                fontSize: '16px',
                            }}
                        >
                            Se déconnecter de cette session
                        </h3>
                        <p className="text-[12.5px] text-slate-500 mt-1">
                            Termine votre session courante. Vous serez redirigé vers la page de connexion.
                        </p>
                    </div>
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<IconLogout size={15} />}
                        radius="md"
                        size="sm"
                        onClick={() => logout()}
                    >
                        Se déconnecter
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Onglet 4 — Notifications
// ═════════════════════════════════════════════════════════════════════════════
function NotificationsPanel() {
    const user: any = useAppSelector((state) => state.user) ?? {};
    const notifsKey = useMemo(() => scopedKey(NOTIFS_KEY_BASE, user), [user]);
    const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadJSON(notifsKey, DEFAULT_NOTIFS));
    const [saved, setSaved] = useState(false);

    const toggle = (
        channel: keyof NotificationPrefs,
        topic: string,
    ) => {
        const next = {
            ...prefs,
            [channel]: {
                ...(prefs[channel] as any),
                [topic]: !(prefs[channel] as any)[topic],
            },
        };
        setPrefs(next);
        saveJSON(notifsKey, next);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
    };

    type Row = { key: string; label: string; description: string };
    const rows: Row[] = [
        { key: 'incidents', label: 'Incidents & accidents', description: 'Nouvel incident, modification de gravité, clôture' },
        { key: 'audits', label: 'Audits & inspections', description: 'Audit programmé, recommandation, action corrective' },
        { key: 'reports', label: 'Rapports périodiques', description: 'Rapport mensuel HSE, indicateurs KPI' },
        { key: 'system', label: 'Système & maintenance', description: 'Notifications techniques, mises à jour planifiées' },
    ];

    const channels: Array<{ key: keyof NotificationPrefs; label: string; description: string }> = [
        { key: 'inApp', label: 'Dans l\'application', description: 'Notifications affichées dans SafeX 360' },
        { key: 'email', label: 'Email', description: 'Envoyées à votre adresse professionnelle' },
        { key: 'sms', label: 'SMS', description: 'Réservé aux alertes critiques (incidents, audits urgents)' },
    ];

    return (
        <div className="space-y-6">
            {channels.map((channel) => (
                <div key={channel.key} className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <SectionHeader title={channel.label} description={channel.description} />
                            {saved && (
                                <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700 flex-shrink-0">
                                    <IconCheck size={14} /> Enregistré
                                </span>
                            )}
                        </div>

                        <div className="divide-y divide-slate-100">
                            {rows.map((row) => {
                                const channelPrefs = prefs[channel.key] as Record<string, boolean>;
                                const exists = row.key in channelPrefs;
                                if (!exists) return null;
                                return (
                                    <div key={row.key} className="flex items-center justify-between py-3.5 gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[13.5px] text-slate-800">{row.label}</p>
                                            <p className="text-[12px] text-slate-500 mt-0.5">{row.description}</p>
                                        </div>
                                        <Switch
                                            checked={channelPrefs[row.key]}
                                            onChange={() => toggle(channel.key, row.key)}
                                            color="teal"
                                            size="md"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            <Alert
                color="gray"
                variant="light"
                icon={<IconAlertTriangle size={15} />}
                radius="md"
                styles={{ message: { fontSize: '12.5px', color: '#475569' } }}
            >
                Les préférences de notifications sont sauvegardées localement.
                La synchronisation serveur (multi-appareils) sera activée
                lorsque l'API de préférences sera disponible.
            </Alert>
        </div>
    );
}

