import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../slices/hooks';
import {
    IconShield,
    IconUsersGroup,
    IconVolume,
    IconMessage,
    IconSettings,
    IconAlertTriangle,
    IconStairsUp,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import {
    getEmergencySettings,
    updateEmergencySettings,
    type EmergencySettingsDTO,
} from '../../../services/EmergencyService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import EmergencyPermissionsSection from './EmergencyPermissionsSection';
import RescueTeamsSection from './RescueTeamsSection';
import EscalationRulesSection from './EscalationRulesSection';
import EmergencyMediaSection from './EmergencyMediaSection';
import WeeklyPlanningSection from './WeeklyPlanningSection';

/**
 * Page « Paramètres de la Gestion des Urgences » (LOT 48 Phase 1 — refonte en onglets).
 *
 * Organisation 4 onglets :
 *   1. Général         — Paramètres globaux (autoDispatch, headcount, drill, etc.)
 *   2. Permissions     — RBAC : Coordinateurs / Secouristes / Lanceurs d'alerte
 *   3. Équipes & Escalade — Équipes de secours + roulements + chaîne d'escalade
 *   4. Médias & Canaux — Sirènes + messages vocaux + config SMS/Voix
 *
 * Marges réduites pour exploiter la largeur écran (suppression du max-w-[1400px]).
 */

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

type Accent = 'sky' | 'teal' | 'orange' | 'violet' | 'amber' | 'rose' | 'emerald' | 'red';

const ACCENT: Record<Accent, { icon: string; iconBg: string; borderL: string }> = {
    sky:     { icon: 'text-sky-600',     iconBg: 'bg-sky-50',     borderL: 'border-l-sky-400' },
    teal:    { icon: 'text-teal-600',    iconBg: 'bg-teal-50',    borderL: 'border-l-teal-400' },
    orange:  { icon: 'text-orange-600',  iconBg: 'bg-orange-50',  borderL: 'border-l-orange-400' },
    violet:  { icon: 'text-violet-600',  iconBg: 'bg-violet-50',  borderL: 'border-l-violet-400' },
    amber:   { icon: 'text-amber-600',   iconBg: 'bg-amber-50',   borderL: 'border-l-amber-400' },
    rose:    { icon: 'text-rose-600',    iconBg: 'bg-rose-50',    borderL: 'border-l-rose-400' },
    emerald: { icon: 'text-emerald-600', iconBg: 'bg-emerald-50', borderL: 'border-l-emerald-400' },
    red:     { icon: 'text-red-600',     iconBg: 'bg-red-50',     borderL: 'border-l-red-400' },
};

function Section({
    icon,
    label,
    description,
    accent,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    description?: string;
    accent: Accent;
    children?: React.ReactNode;
}) {
    const tone = ACCENT[accent];
    return (
        <section className={`bg-white border border-slate-200 border-l-[3px] ${tone.borderL} rounded-xl p-5 shadow-sm`}>
            <header className="flex items-start gap-2.5 mb-4 pb-2.5 border-b border-slate-100">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tone.iconBg} ${tone.icon} flex-shrink-0`} aria-hidden="true">
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {label}
                    </h3>
                    {description && (
                        <p className="text-[11.5px] text-slate-500 mt-0.5">{description}</p>
                    )}
                </div>
            </header>
            {children}
        </section>
    );
}

function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: React.ReactNode;
    hint?: string;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-4 items-start py-2 border-b border-slate-100 last:border-0">
            <div>
                <p className="text-[12px] font-medium text-slate-700">{label}</p>
                {hint && <p className="text-[10.5px] text-slate-500 mt-0.5">{hint}</p>}
            </div>
            <div>{children}</div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Onglets
// ────────────────────────────────────────────────────────────────────────────

type TabKey = 'general' | 'permissions' | 'teams' | 'media';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    accent: Accent;
}

function TabBar({
    tabs,
    active,
    onChange,
}: {
    tabs: TabDef[];
    active: TabKey;
    onChange: (k: TabKey) => void;
}) {
    return (
        <div className="border-b border-slate-200 mt-4">
            <div className="flex items-end gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = active === tab.key;
                    const tone = ACCENT[tab.accent];
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onChange(tab.key)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] transition-colors whitespace-nowrap border-b-2 ${
                                isActive
                                    ? `${tone.icon} border-current font-semibold bg-white`
                                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            style={{ fontFamily: isActive ? "'Source Serif 4', Georgia, serif" : undefined }}
                        >
                            <span className={isActive ? tone.icon : 'text-slate-400'}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────

const EmergencySettingsPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const user = useAppSelector((state: any) => state.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [settings, setSettings] = useState<EmergencySettingsDTO | null>(null);
    const [draft, setDraft] = useState<EmergencySettingsDTO | null>(null);
    const [retryTick, setRetryTick] = useState(0);
    const [activeTab, setActiveTab] = useState<TabKey>('general');

    useEffect(() => {
        if (!selectedCompanyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        getEmergencySettings(selectedCompanyId)
            .then((data) => {
                setSettings(data);
                setDraft(data);
            })
            .catch((err: any) => {
                const msg = err?.response?.status
                    ? `Erreur ${err.response.status} — le serveur backend Health-Safety répond mais retourne une erreur. Vérifiez les logs ou redémarrez le service.`
                    : 'Impossible de joindre le serveur backend (Health-Safety hors service).';
                setLoadError(msg);
                errorNotification(t('common:messages.errorGeneric'));
            })
            .finally(() => setLoading(false));
    }, [selectedCompanyId, t, retryTick]);

    const handleSave = async () => {
        if (!draft) return;
        setSaving(true);
        try {
            const saved = await updateEmergencySettings(draft, user?.id);
            setSettings(saved);
            setDraft(saved);
            successNotification(t('emergency:settings.actions.savedSuccess'));
        } catch {
            errorNotification(t('common:messages.errorGeneric'));
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (settings) setDraft(settings);
    };

    const isDirty = JSON.stringify(settings) !== JSON.stringify(draft);

    // ── Empty state si aucune mine sélectionnée ──
    if (!selectedCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <PageHeader
                    breadcrumbs={[
                        { label: t('navigation:breadcrumbs.home'), to: '/' },
                        { label: t('emergency:module.name') },
                        { label: t('emergency:subModules.settings') },
                    ]}
                    useSafeXLogo
                    title={t('emergency:settings.title')}
                    subtitle={t('emergency:settings.subtitle')}
                />
                <div className="mt-6 bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-center">
                    <IconAlertTriangle size={28} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13px] text-slate-700 max-w-md mx-auto">
                        Sélectionnez une mine active dans le sélecteur en haut pour configurer ses paramètres
                        d'urgence.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <PageHeader
                    breadcrumbs={[
                        { label: t('navigation:breadcrumbs.home'), to: '/' },
                        { label: t('emergency:module.name') },
                        { label: t('emergency:subModules.settings') },
                    ]}
                    useSafeXLogo
                    title={t('emergency:settings.title')}
                    subtitle={t('emergency:settings.subtitle')}
                />
                <div className="mt-6 bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <IconShield size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                </div>
            </div>
        );
    }

    if (loadError || !draft) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <PageHeader
                    breadcrumbs={[
                        { label: t('navigation:breadcrumbs.home'), to: '/' },
                        { label: t('emergency:module.name') },
                        { label: t('emergency:subModules.settings') },
                    ]}
                    useSafeXLogo
                    title={t('emergency:settings.title')}
                    subtitle={t('emergency:settings.subtitle')}
                />
                <div className="mt-6 bg-red-50/60 border border-red-200 rounded-xl p-8 text-center shadow-sm">
                    <IconAlertTriangle size={32} className="text-red-500 mx-auto mb-3" stroke={1.6} />
                    <h3
                        className="text-[15px] text-slate-800 mb-2"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                    >
                        Impossible de charger les paramètres
                    </h3>
                    <p className="text-[12.5px] text-slate-600 max-w-lg mx-auto mb-1">
                        {loadError || 'Données indisponibles.'}
                    </p>
                    <p className="text-[11.5px] text-slate-500 max-w-lg mx-auto mb-4">
                        ⓘ Le module Emergency a été ajouté en Phase 1 — le backend Health-Safety doit être
                        <strong> redémarré</strong> pour charger les nouveaux endpoints et créer les tables
                        en BDD.
                    </p>
                    <button
                        type="button"
                        onClick={() => setRetryTick((n) => n + 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // ── Définition des onglets ─────────────────────────────────────────────
    const tabs: TabDef[] = [
        { key: 'general',     label: 'Général',              icon: <IconSettings size={14} stroke={1.7} />, accent: 'teal' },
        { key: 'permissions', label: 'Permissions',          icon: <IconShield size={14} stroke={1.7} />,    accent: 'rose' },
        { key: 'teams',       label: 'Équipes & Escalade',   icon: <IconUsersGroup size={14} stroke={1.7} />,accent: 'orange' },
        { key: 'media',       label: 'Médias & Canaux',      icon: <IconVolume size={14} stroke={1.7} />,    accent: 'violet' },
    ];

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: t('emergency:subModules.settings') },
                ]}
                useSafeXLogo
                title={t('emergency:settings.title')}
                subtitle={t('emergency:settings.subtitle')}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={!isDirty || saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {t('emergency:settings.actions.reset')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saving ? '…' : t('emergency:settings.actions.save')}
                        </button>
                    </>
                }
            />

            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* Barre dirty bar : prévient si modifs non sauvegardées */}
            {isDirty && (
                <div className="mt-3 px-3 py-1.5 rounded-md bg-amber-50/60 border border-amber-200 flex items-center gap-2 text-[11.5px] text-amber-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Modifications non enregistrées — pensez à cliquer « Enregistrer les paramètres »
                </div>
            )}

            <div className="mt-5">
                {/* ════════ ONGLET 1 : GÉNÉRAL ════════ */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <Section
                            icon={<IconSettings size={15} stroke={1.6} />}
                            label={t('emergency:settings.sections.global.title')}
                            description={t('emergency:settings.sections.global.subtitle')}
                            accent="teal"
                        >
                            <Field
                                label={t('emergency:settings.sections.global.autoDispatchSeconds')}
                                hint="Délai avant escalade automatique"
                            >
                                <input
                                    type="number"
                                    min={10}
                                    max={3600}
                                    value={draft.autoDispatchSeconds ?? 120}
                                    onChange={(e) =>
                                        setDraft({ ...draft, autoDispatchSeconds: parseInt(e.target.value, 10) || 0 })
                                    }
                                    className="w-32 px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                />
                            </Field>

                            <Field label={t('emergency:settings.sections.global.drillMode')}>
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={draft.drillModeEnabled ?? false}
                                        onChange={(e) => setDraft({ ...draft, drillModeEnabled: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-[12.5px] text-slate-700">
                                        {draft.drillModeEnabled ? 'Activé' : 'Désactivé'}
                                    </span>
                                </label>
                            </Field>

                            <Field label={t('emergency:settings.sections.global.headCountMethod')}>
                                <select
                                    value={draft.headCountMethod ?? 'GPS'}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            headCountMethod: e.target.value as EmergencySettingsDTO['headCountMethod'],
                                        })
                                    }
                                    className="w-full max-w-[280px] px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                >
                                    <option value="GPS">{t('emergency:headCountMethod.GPS')}</option>
                                    <option value="QR">{t('emergency:headCountMethod.QR')}</option>
                                    <option value="NFC">{t('emergency:headCountMethod.NFC')}</option>
                                    <option value="MANUAL">{t('emergency:headCountMethod.MANUAL')}</option>
                                </select>
                            </Field>

                            <Field label={t('emergency:settings.sections.global.geolocationRequired')}>
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={draft.geolocationRequired ?? true}
                                        onChange={(e) =>
                                            setDraft({ ...draft, geolocationRequired: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-[12.5px] text-slate-700">
                                        {draft.geolocationRequired ? 'Requise' : 'Optionnelle'}
                                    </span>
                                </label>
                            </Field>

                            <Field
                                label={t('emergency:settings.sections.global.auditRetentionYears')}
                                hint="ISO 45001 §9.1.2 — défaut 5 ans"
                            >
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={draft.auditRetentionYears ?? 5}
                                    onChange={(e) =>
                                        setDraft({ ...draft, auditRetentionYears: parseInt(e.target.value, 10) || 5 })
                                    }
                                    className="w-24 px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                />
                            </Field>
                        </Section>

                        {/* Info / résumé latéral */}
                        <Section
                            icon={<IconShield size={15} stroke={1.6} />}
                            label="À propos du module"
                            description="Aperçu de la configuration courante"
                            accent="sky"
                        >
                            <ul className="space-y-2 text-[12px] text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500 mt-0.5">●</span>
                                    <span>
                                        <strong className="text-slate-800">Auto-dispatch :</strong>{' '}
                                        {draft.autoDispatchSeconds ?? 120} secondes avant escalade
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500 mt-0.5">●</span>
                                    <span>
                                        <strong className="text-slate-800">Mode drill :</strong>{' '}
                                        {draft.drillModeEnabled ? 'activé (simulation)' : 'désactivé (production)'}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500 mt-0.5">●</span>
                                    <span>
                                        <strong className="text-slate-800">Comptage évacuation :</strong>{' '}
                                        {draft.headCountMethod ?? 'GPS'}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500 mt-0.5">●</span>
                                    <span>
                                        <strong className="text-slate-800">Géolocalisation :</strong>{' '}
                                        {draft.geolocationRequired ? 'requise' : 'optionnelle'}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500 mt-0.5">●</span>
                                    <span>
                                        <strong className="text-slate-800">Rétention audit :</strong>{' '}
                                        {draft.auditRetentionYears ?? 5} ans (ISO 45001 §9.1.2)
                                    </span>
                                </li>
                            </ul>
                            <p className="text-[11px] text-slate-400 italic mt-4 pt-3 border-t border-slate-100">
                                Configuration appliquée à la mine active. Chaque mine possède sa propre
                                configuration indépendante.
                            </p>
                        </Section>
                    </div>
                )}

                {/* ════════ ONGLET 2 : PERMISSIONS ════════ */}
                {activeTab === 'permissions' && (
                    <EmergencyPermissionsSection companyId={selectedCompanyId} />
                )}

                {/* ════════ ONGLET 3 : ÉQUIPES & ESCALADE ════════ */}
                {activeTab === 'teams' && (
                    <div className="space-y-5">
                        {/* Équipes + Escalade (côte-à-côte sur XL) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <RescueTeamsSection companyId={selectedCompanyId} />
                            <EscalationRulesSection companyId={selectedCompanyId} />
                        </div>
                        {/* Planification hebdomadaire pleine largeur */}
                        <WeeklyPlanningSection companyId={selectedCompanyId} />
                    </div>
                )}

                {/* ════════ ONGLET 4 : MÉDIAS & CANAUX ════════ */}
                {activeTab === 'media' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <EmergencyMediaSection companyId={selectedCompanyId} />

                        {/* Canaux SMS / Voix */}
                        <Section
                            icon={<IconMessage size={15} stroke={1.6} />}
                            label={t('emergency:settings.sections.channels.title')}
                            description={t('emergency:settings.sections.channels.subtitle')}
                            accent="sky"
                        >
                            <Field label={t('emergency:settings.sections.channels.smsProvider')}>
                                <select
                                    value={draft.smsProvider ?? ''}
                                    onChange={(e) =>
                                        setDraft({ ...draft, smsProvider: e.target.value || null })
                                    }
                                    className="w-full px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                >
                                    <option value="">—</option>
                                    <option value="AFRICAS_TALKING">Africa's Talking</option>
                                    <option value="TWILIO">Twilio</option>
                                </select>
                            </Field>
                            <Field
                                label={t('emergency:settings.sections.channels.smsSenderId')}
                                hint="Code 3-11 caractères affiché côté destinataire"
                            >
                                <input
                                    type="text"
                                    value={draft.smsSenderId ?? ''}
                                    onChange={(e) =>
                                        setDraft({ ...draft, smsSenderId: e.target.value || null })
                                    }
                                    maxLength={11}
                                    placeholder="SAFEX360"
                                    className="w-full px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                />
                            </Field>

                            <Field label={t('emergency:settings.sections.media.voiceProvider')}>
                                <select
                                    value={draft.voiceProvider ?? ''}
                                    onChange={(e) => setDraft({ ...draft, voiceProvider: e.target.value || null })}
                                    className="w-full px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                >
                                    <option value="">—</option>
                                    <option value="AZURE_SPEECH">Azure Speech</option>
                                    <option value="OTHER">Autre</option>
                                </select>
                            </Field>

                            <Field label={t('emergency:settings.sections.media.voiceLocale')}>
                                <select
                                    value={draft.voiceLocale ?? 'fr-FR'}
                                    onChange={(e) => setDraft({ ...draft, voiceLocale: e.target.value })}
                                    className="w-full max-w-[220px] px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                >
                                    <option value="fr-FR">Français (fr-FR)</option>
                                    <option value="en-US">English (en-US)</option>
                                    <option value="en-GB">English (en-GB)</option>
                                </select>
                            </Field>

                            <Field label="Voix Azure (nom)" hint="Recommandé : fr-FR-DeniseNeural">
                                <input
                                    type="text"
                                    value={draft.voiceVoiceName ?? ''}
                                    onChange={(e) => setDraft({ ...draft, voiceVoiceName: e.target.value })}
                                    placeholder="fr-FR-DeniseNeural"
                                    className="w-full px-3 py-1.5 text-[13px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
                                />
                            </Field>

                            <div className="mt-3 px-3 py-2 rounded-lg bg-sky-50/60 border border-sky-100 flex items-center gap-2 text-[11.5px] text-slate-700">
                                <span className={`w-1.5 h-1.5 rounded-full ${draft.smsProvider && draft.smsSenderId ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>
                                    {draft.smsProvider && draft.smsSenderId
                                        ? 'Canal SMS configuré — connectivité réelle activée en Phase 3'
                                        : 'Configuration SMS incomplète'}
                                </span>
                            </div>
                        </Section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencySettingsPage;
