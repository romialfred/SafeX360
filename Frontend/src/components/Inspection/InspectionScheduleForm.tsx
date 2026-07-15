/**
 * InspectionScheduleForm — Formulaire de planification en 3 étapes (responsive
 * web + mobile).
 *
 *   1. Cible    — type d'objet (tuiles) + cible (liste déroulante) + panneau
 *                 d'info raffiné (détails de la cible + dernière inspection).
 *   2. Modèle   — sélection du template correspondant au type.
 *   3. Détails  — date, horaires, inspecteur, objectifs, description.
 *
 * La mine (site) n'est JAMAIS demandée : résolue automatiquement via
 * `activeMineId ?? primaryMineId` → `resolvedMineId` → `siteId`. NE PAS
 * réintroduire de sélecteur/erreur de mine.
 *
 * Aucune section EPI. Pas de checklist ni de mesure ici (saisie déportée à la
 * page d'exécution mobile en Phase 4).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select } from '@mantine/core';
import {
    IconChevronRight,
    IconChevronLeft,
    IconChecklist,
    IconBuildingFactory2,
    IconMapPin,
    IconClipboardCheck,
    IconArrowRight,
    IconCheck,
    IconAlertOctagon,
    IconCalendarStats,
    IconHistory,
    IconInfoCircle,
} from '@tabler/icons-react';

import {
    listTemplates,
    scheduleInspection,
    getLastInspection,
    type InspectionTemplateType,
    type InspectionTemplateSummaryDTO,
    type ScheduleInspectionDTO,
    type LastInspectionDTO,
} from '../../services/InspectionService';
import { getAllEquipment } from '../../services/EquipmentService';
import { getAllActiveLocations } from '../../services/LocationService';
import { getAllActiveWorkProcess } from '../../services/WorkProcessService';
import InspectionStatusBadge from './InspectionStatusBadge';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import { useAppSelector } from '../../slices/hooks';

// Wizard à 3 étapes : Cible → Modèle → Détails.
type Step = 1 | 2 | 3;

interface FormState {
    type: InspectionTemplateType | null;
    siteId: number | null;
    targetRefId: string;
    targetLabel: string;
    templateId: number | null;
    plannedDate: string;
    startTime: string;
    endTime: string;
    primaryInspectorId: string;
    objectives: string;
    description: string;
}

const INITIAL: FormState = {
    type: null,
    siteId: null,
    targetRefId: '',
    targetLabel: '',
    templateId: null,
    plannedDate: '',
    startTime: '',
    endTime: '',
    primaryInspectorId: '',
    objectives: '',
    description: '',
};

const TYPE_ICON: Record<InspectionTemplateType, React.ReactNode> = {
    EQUIPMENT: <IconBuildingFactory2 size={28} stroke={1.6} />,
    LOCATION:  <IconMapPin size={28} stroke={1.6} />,
    PROCEDURE: <IconClipboardCheck size={28} stroke={1.6} />,
};

const TYPE_ACCENT: Record<InspectionTemplateType, string> = {
    EQUIPMENT: 'from-amber-500 to-orange-600 text-amber-700',
    LOCATION:  'from-emerald-500 to-teal-600 text-emerald-700',
    PROCEDURE: 'from-violet-500 to-purple-600 text-violet-700',
};

export default function InspectionScheduleForm() {
    const { t, i18n } = useTranslation(['inspection', 'common']);
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormState>(INITIAL);
    const [templates, setTemplates] = useState<InspectionTemplateSummaryDTO[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Cibles : options de la liste déroulante + enregistrements bruts (panneau info)
    const [targetOptions, setTargetOptions] = useState<{ value: string; label: string }[]>([]);
    const [targetRecords, setTargetRecords] = useState<any[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    // Dernière inspection de la cible sélectionnée
    const [lastInspection, setLastInspection] = useState<LastInspectionDTO | null>(null);
    const [loadingLast, setLoadingLast] = useState(false);

    // Principe plateforme : AUCUN formulaire ne demande la mine. La mine active
    // vient du header (sélecteur global) ; toute création y est rattachée. Le
    // « site » de l'inspection = la mine active, résolue automatiquement ici.
    const activeMineId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId ?? null);
    // Mine principale de l'utilisateur (repli quand le header est en « Toutes les
    // Mines » / vue consolidée) : on ne demande JAMAIS la mine dans le formulaire.
    const primaryMineId = useAppSelector((state: any) => {
        const c = state.user?.company;
        const n = c === null || c === undefined ? null : Number(c);
        return Number.isNaN(n as any) ? null : n;
    });
    const resolvedMineId = activeMineId ?? primaryMineId;

    // Aligne en continu le site de l'inspection sur la mine résolue (header, sinon
    // mine principale). Jamais de saisie manuelle de la mine.
    useEffect(() => {
        setForm((f) => (f.siteId === resolvedMineId ? f : { ...f, siteId: resolvedMineId }));
    }, [resolvedMineId]);

    // Charge la liste des cibles selon le type d'objet choisi (étape 1 fusionnée).
    // Dégradation gracieuse : toute erreur → liste vide, pas de crash.
    useEffect(() => {
        if (!form.type) {
            setTargetOptions([]);
            setTargetRecords([]);
            return;
        }
        const currentType = form.type;
        setLoadingTargets(true);
        const loader =
            currentType === 'EQUIPMENT'
                ? getAllEquipment()
                : currentType === 'LOCATION'
                ? getAllActiveLocations()
                : getAllActiveWorkProcess();
        Promise.resolve(loader)
            .then((list: any[]) => {
                const arr = Array.isArray(list) ? list : [];
                setTargetRecords(arr);
                setTargetOptions(
                    arr
                        .filter((r) => r && r.id !== undefined && r.id !== null)
                        .map((r) => ({
                            value: String(r.id),
                            label:
                                currentType === 'EQUIPMENT'
                                    ? [r.code, r.name].filter(Boolean).join(' — ') || `#${r.id}`
                                    : r.name ?? `#${r.id}`,
                        })),
                );
            })
            .catch(() => {
                setTargetRecords([]);
                setTargetOptions([]);
            })
            .finally(() => setLoadingTargets(false));
    }, [form.type]);

    // Charge la liste des templates filtrés par type quand l'utilisateur arrive à
    // l'étape Modèle (étape 2 dans le wizard à 3 étapes).
    useEffect(() => {
        if (step !== 2 || !form.type) return;
        setLoadingTemplates(true);
        listTemplates(form.type)
            .then((list) => setTemplates(list.filter((t) => t.active !== false)))
            .catch(() => setTemplates([]))
            .finally(() => setLoadingTemplates(false));
    }, [step, form.type]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    // Sélection du type d'objet : réinitialise la cible, le template et l'info.
    const handleSelectType = (tt: InspectionTemplateType) => {
        setForm((f) => ({ ...f, type: tt, templateId: null, targetRefId: '', targetLabel: '' }));
        setLastInspection(null);
    };

    // Sélection d'une cible dans la liste déroulante : fixe targetRefId, pré-remplit
    // la désignation (targetLabel, éditable) et va chercher la dernière inspection.
    const handleSelectTarget = (value: string | null) => {
        if (!value) {
            set('targetRefId', '');
            set('targetLabel', '');
            setLastInspection(null);
            return;
        }
        set('targetRefId', value);
        const rec = targetRecords.find((r) => String(r.id) === value);
        set('targetLabel', rec?.name ?? '');
        if (form.type) {
            setLoadingLast(true);
            getLastInspection(form.type, Number(value))
                .then((res) => setLastInspection(res))
                .catch(() => setLastInspection(null))
                .finally(() => setLoadingLast(false));
        }
    };

    const validateStep = (s: Step): string[] => {
        const errs: string[] = [];
        // Étape 1 fusionnée : type d'objet + cible (dropdown) + désignation.
        if (s >= 1) {
            if (!form.type) errs.push(t('schedule.errors.typeRequired'));
            if (!form.targetRefId) {
                errs.push(t('schedule.errors.targetIdRequired', { defaultValue: 'Sélectionnez une cible.' }));
            }
            if (!form.targetLabel.trim()) errs.push(t('schedule.errors.targetLabelRequired'));
        }
        // La mine (site) n'est JAMAIS saisie : résolue depuis le header, sinon la
        // mine principale de l'utilisateur. Aucun blocage ici.
        if (s >= 2 && !form.templateId) errs.push(t('schedule.errors.templateRequired'));
        if (s >= 3 && !form.plannedDate) errs.push(t('schedule.errors.dateRequired'));
        return errs;
    };

    const goNext = () => {
        const errs = validateStep(step);
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }
        setErrors([]);
        setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
    };

    const goPrev = () => {
        setErrors([]);
        setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    };

    const handleSubmit = async () => {
        const errs = validateStep(3);
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        try {
            const payload: ScheduleInspectionDTO = {
                templateId: form.templateId as number,
                siteId: form.siteId as number,
                targetRefId: Number(form.targetRefId),
                targetLabel: form.targetLabel.trim(),
                plannedDate: form.plannedDate,
                startTime: form.startTime ? `${form.startTime}:00` : null,
                endTime: form.endTime ? `${form.endTime}:00` : null,
                description: form.description || undefined,
                objectives: form.objectives || undefined,
                primaryInspectorId: form.primaryInspectorId
                    ? Number(form.primaryInspectorId)
                    : null,
            };
            const id = await scheduleInspection(payload);
            successNotification(t('schedule.success.submitted', { id }));
            navigate('/inspections');
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                t('schedule.errors.submitFailed');
            setErrors([msg]);
            errorNotification(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const stepHeader = (n: Step, labelKey: string, fallback: string) => {
        const isActive = step === n;
        const isDone = step > n;
        return (
            <div className="flex items-center gap-2 min-w-0">
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                        isDone
                            ? 'bg-emerald-600 text-white'
                            : isActive
                            ? 'bg-cyan-700 text-white ring-4 ring-cyan-100'
                            : 'bg-slate-200 text-slate-500'
                    }`}
                >
                    {isDone ? <IconCheck size={14} stroke={2.4} /> : n}
                </div>
                <span
                    className={`text-[12px] truncate ${
                        isActive ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}
                >
                    {t(`schedule.steps.${labelKey}`, { defaultValue: fallback })}
                </span>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('schedule.breadcrumbCurrent')}
                    </span>
                </div>

                {/* Hero */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <IconChecklist size={18} stroke={1.8} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1
                            className="text-slate-900 leading-tight truncate"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(17px, 1.6vw, 20px)',
                                letterSpacing: '-0.015em',
                            }}
                        >
                            {t('schedule.title')}
                        </h1>
                        <p className="text-[12px] text-slate-500 truncate">{t('schedule.subtitle')}</p>
                    </div>
                </div>

                {/* Stepper — 3 étapes : Cible → Modèle → Détails */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                    <div className="grid grid-cols-3 gap-2">
                        {stepHeader(1, 'target', 'Cible')}
                        {stepHeader(2, 'template', 'Modèle')}
                        {stepHeader(3, 'details', 'Détails')}
                    </div>
                </div>

                {/* Erreurs */}
                {errors.length > 0 && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12.5px]" role="alert">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <ul className="space-y-0.5">
                            {errors.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Etape courante */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 mb-4">
                    {step === 1 && (
                        <StepTarget
                            form={form}
                            setField={set}
                            onSelectType={handleSelectType}
                            targetOptions={targetOptions}
                            targetRecords={targetRecords}
                            loadingTargets={loadingTargets}
                            onSelectTarget={handleSelectTarget}
                            lastInspection={lastInspection}
                            loadingLast={loadingLast}
                            locale={i18n.language}
                        />
                    )}
                    {step === 2 && (
                        <StepTemplate
                            templates={templates}
                            loading={loadingTemplates}
                            selectedTemplateId={form.templateId}
                            onSelect={(id) => set('templateId', id)}
                        />
                    )}
                    {step === 3 && (
                        <StepDetails form={form} setField={set} />
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md text-slate-600 hover:bg-slate-100 transition"
                    >
                        {t('schedule.buttons.cancel')}
                    </button>
                    <div className="flex items-center gap-2">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={goPrev}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                            >
                                <IconChevronLeft size={14} stroke={1.8} />
                                {t('schedule.buttons.previous')}
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition font-medium shadow-sm"
                            >
                                {t('schedule.buttons.next')}
                                <IconArrowRight size={14} stroke={1.8} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition font-medium shadow-sm disabled:opacity-50"
                            >
                                <IconCalendarStats size={14} stroke={1.8} />
                                {submitting ? '…' : t('schedule.buttons.submit')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Sous-composants — un par étape
 * ────────────────────────────────────────────────────────────────────────*/

function formatDate(iso: string | undefined, locale: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB');
    } catch (_e) {
        return iso;
    }
}

/**
 * StepTarget — Étape 1 fusionnée : type d'objet (tuiles) + cible (liste
 * déroulante dépendante du type) + panneau d'info raffiné (détails + dernière
 * inspection). La désignation (targetLabel) reste éditable, pré-remplie.
 */
function StepTarget({
    form,
    setField,
    onSelectType,
    targetOptions,
    targetRecords,
    loadingTargets,
    onSelectTarget,
    lastInspection,
    loadingLast,
    locale,
}: {
    form: FormState;
    setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
    onSelectType: (t: InspectionTemplateType) => void;
    targetOptions: { value: string; label: string }[];
    targetRecords: any[];
    loadingTargets: boolean;
    onSelectTarget: (value: string | null) => void;
    lastInspection: LastInspectionDTO | null;
    loadingLast: boolean;
    locale: string;
}) {
    const { t } = useTranslation('inspection');
    const types: InspectionTemplateType[] = ['EQUIPMENT', 'LOCATION', 'PROCEDURE'];
    const selectedRecord = form.targetRefId
        ? targetRecords.find((r) => String(r.id) === form.targetRefId)
        : null;

    return (
        <div>
            {/* Type d'objet — tuiles */}
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">
                {t('schedule.typeStep.heading')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {types.map((tt) => {
                    const active = form.type === tt;
                    return (
                        <button
                            key={tt}
                            type="button"
                            onClick={() => onSelectType(tt)}
                            className={`text-left p-4 rounded-xl border-2 transition min-h-[120px] ${
                                active
                                    ? 'border-cyan-600 bg-cyan-50/60 shadow-md'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TYPE_ACCENT[tt]} flex items-center justify-center mb-2`}
                            >
                                <span className="text-white">{TYPE_ICON[tt]}</span>
                            </div>
                            <div className="text-[14px] font-semibold text-slate-900 mb-0.5">
                                {t(`schedule.typeStep.${tt}.title`)}
                            </div>
                            <div className="text-[12px] text-slate-500 leading-snug">
                                {t(`schedule.typeStep.${tt}.description`)}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Cible — liste déroulante (source dépend du type) */}
            {form.type && (
                <div className="mt-5 space-y-3">
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">
                            {t('schedule.targetStep.targetSelectLabel', { defaultValue: 'Cible' })}
                        </label>
                        <Select
                            searchable
                            clearable
                            data={targetOptions}
                            value={form.targetRefId || null}
                            onChange={onSelectTarget}
                            disabled={loadingTargets}
                            nothingFoundMessage={
                                loadingTargets
                                    ? t('common:loading', { defaultValue: 'Chargement…' })
                                    : t('schedule.targetStep.noTarget', { defaultValue: 'Aucune cible disponible' })
                            }
                            placeholder={
                                loadingTargets
                                    ? t('common:loading', { defaultValue: 'Chargement…' })
                                    : t('schedule.targetStep.targetSelectPlaceholder', { defaultValue: 'Sélectionner une cible…' })
                            }
                            comboboxProps={{ withinPortal: true }}
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            {t('schedule.targetStep.targetSelectHelp', {
                                defaultValue: "La liste est limitée à la mine active.",
                            })}
                        </p>
                    </div>

                    {/* Panneau d'info raffiné — détails de la cible + dernière inspection */}
                    {selectedRecord && (
                        <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-white p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <IconInfoCircle size={15} stroke={1.8} className="text-cyan-700" />
                                <span className="text-[12.5px] font-semibold text-slate-800">
                                    {t('schedule.targetStep.infoHeading', { defaultValue: 'Détails de la cible' })}
                                </span>
                            </div>

                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                {form.type === 'EQUIPMENT' ? (
                                    <>
                                        <InfoField label={t('schedule.targetStep.fieldCode', { defaultValue: 'Code' })} value={selectedRecord.code} />
                                        <InfoField label={t('schedule.targetStep.fieldName', { defaultValue: 'Nom' })} value={selectedRecord.name} />
                                        <InfoField label={t('schedule.targetStep.fieldType', { defaultValue: 'Type' })} value={selectedRecord.type} />
                                        <InfoField
                                            label={t('schedule.targetStep.fieldBrandModel', { defaultValue: 'Marque / Modèle' })}
                                            value={[selectedRecord.brand, selectedRecord.model].filter(Boolean).join(' ')}
                                        />
                                        <InfoField label={t('schedule.targetStep.fieldSerial', { defaultValue: 'N° de série' })} value={selectedRecord.serialNumber} />
                                    </>
                                ) : (
                                    <>
                                        <InfoField label={t('schedule.targetStep.fieldName', { defaultValue: 'Nom' })} value={selectedRecord.name} />
                                        {selectedRecord.zone && (
                                            <InfoField label={t('schedule.targetStep.fieldZone', { defaultValue: 'Zone' })} value={selectedRecord.zone} />
                                        )}
                                    </>
                                )}
                            </dl>

                            {/* Dernière inspection */}
                            <div className="mt-3 pt-3 border-t border-cyan-100 flex items-center gap-2 flex-wrap">
                                <IconHistory size={14} stroke={1.8} className="text-slate-500" />
                                <span className="text-[11.5px] uppercase tracking-[0.08em] text-slate-500 font-medium">
                                    {t('schedule.targetStep.lastInspection', { defaultValue: 'Dernière inspection' })}
                                </span>
                                {loadingLast ? (
                                    <span className="text-[12px] text-slate-400">…</span>
                                ) : lastInspection ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-[12.5px] text-slate-800 tabular-nums font-medium">
                                            {formatDate(lastInspection.plannedDate, locale)}
                                        </span>
                                        <InspectionStatusBadge status={lastInspection.status} />
                                    </span>
                                ) : (
                                    <span className="text-[12px] text-slate-500 italic">
                                        {t('schedule.targetStep.noPreviousInspection', {
                                            defaultValue: 'Aucune inspection précédente',
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Désignation — pré-remplie, éditable */}
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">
                            {t('schedule.targetStep.targetLabelLabel')}
                        </label>
                        <input
                            type="text"
                            value={form.targetLabel}
                            onChange={(e) => setField('targetLabel', e.target.value)}
                            placeholder={t('schedule.targetStep.targetLabelPlaceholder')}
                            className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="min-w-0">
            <dt className="text-[10.5px] uppercase tracking-[0.08em] text-slate-400 font-medium">{label}</dt>
            <dd className="text-[12.5px] text-slate-800 truncate">{value || '—'}</dd>
        </div>
    );
}

function StepTemplate({
    templates,
    loading,
    selectedTemplateId,
    onSelect,
}: {
    templates: InspectionTemplateSummaryDTO[];
    loading: boolean;
    selectedTemplateId: number | null;
    onSelect: (id: number) => void;
}) {
    const { t } = useTranslation('inspection');
    return (
        <div>
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">
                {t('schedule.templateStep.heading')}
            </h2>
            {loading ? (
                <div className="text-[12.5px] text-slate-500 py-6 text-center">…</div>
            ) : templates.length === 0 ? (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('schedule.templateStep.noTemplate')}</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {templates.map((tpl) => {
                        const active = selectedTemplateId === tpl.id;
                        return (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => onSelect(tpl.id)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition flex items-center gap-3 ${
                                    active
                                        ? 'border-cyan-600 bg-cyan-50/60 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13.5px] font-medium text-slate-900 truncate">
                                        {tpl.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                        {tpl.code}
                                        {tpl.scopeRef && <> · {tpl.scopeRef}</>}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3">
                                        <span>
                                            {t('schedule.templateStep.checkpoints', { count: tpl.checkpointCount })}
                                        </span>
                                        {tpl.estimatedDurationMin && (
                                            <span>
                                                {t('schedule.templateStep.estimated', { min: tpl.estimatedDurationMin })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {active && (
                                    <div className="w-6 h-6 rounded-full bg-cyan-700 text-white flex items-center justify-center flex-shrink-0">
                                        <IconCheck size={14} stroke={2.4} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StepDetails({
    form,
    setField,
}: {
    form: FormState;
    setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
    const { t } = useTranslation('inspection');
    return (
        <div>
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">
                {t('schedule.detailsStep.heading')}
            </h2>
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">
                            {t('schedule.detailsStep.plannedDateLabel')}
                        </label>
                        <input
                            type="date"
                            value={form.plannedDate}
                            onChange={(e) => setField('plannedDate', e.target.value)}
                            className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">
                            {t('schedule.detailsStep.startTimeLabel')}
                        </label>
                        <input
                            type="time"
                            value={form.startTime}
                            onChange={(e) => setField('startTime', e.target.value)}
                            className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">
                            {t('schedule.detailsStep.endTimeLabel')}
                        </label>
                        <input
                            type="time"
                            value={form.endTime}
                            onChange={(e) => setField('endTime', e.target.value)}
                            className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[12px] font-medium text-slate-700 mb-1">
                        {t('schedule.detailsStep.primaryInspectorLabel')}
                    </label>
                    <input
                        type="number"
                        value={form.primaryInspectorId}
                        onChange={(e) => setField('primaryInspectorId', e.target.value)}
                        placeholder={t('schedule.detailsStep.primaryInspectorPlaceholder')}
                        className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-medium text-slate-700 mb-1">
                        {t('schedule.detailsStep.objectivesLabel')}
                    </label>
                    <textarea
                        value={form.objectives}
                        onChange={(e) => setField('objectives', e.target.value)}
                        placeholder={t('schedule.detailsStep.objectivesPlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-medium text-slate-700 mb-1">
                        {t('schedule.detailsStep.descriptionLabel')}
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setField('description', e.target.value)}
                        placeholder={t('schedule.detailsStep.descriptionPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                    />
                </div>
            </div>
        </div>
    );
}
