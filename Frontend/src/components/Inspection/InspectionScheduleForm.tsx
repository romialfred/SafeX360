/**
 * InspectionScheduleForm — Formulaire de planification en 4 etapes (responsive
 * web + mobile). Choix tactile par tuiles pour le type d'objet, suggestion
 * automatique des templates correspondants, saisie de la cible et de la date.
 *
 * Aucune section EPI (suppression demandee). Pas de checklist ni de mesure ici
 * (saisie deportee a la page d'execution mobile en Phase 4).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
} from '@tabler/icons-react';

import {
    listTemplates,
    scheduleInspection,
    type InspectionTemplateType,
    type InspectionTemplateSummaryDTO,
    type ScheduleInspectionDTO,
} from '../../services/InspectionService';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import { useAppSelector } from '../../slices/hooks';

type Step = 1 | 2 | 3 | 4;

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
    const { t } = useTranslation(['inspection', 'common']);
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormState>(INITIAL);
    const [templates, setTemplates] = useState<InspectionTemplateSummaryDTO[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Principe plateforme : AUCUN formulaire ne demande la mine. La mine active
    // vient du header (sélecteur global) ; toute création y est rattachée. Le
    // « site » de l'inspection = la mine active, résolue automatiquement ici.
    const activeMineId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId ?? null);

    // Aligne en continu le site de l'inspection sur la mine active du header.
    useEffect(() => {
        setForm((f) => (f.siteId === activeMineId ? f : { ...f, siteId: activeMineId }));
    }, [activeMineId]);

    // Charge la liste des templates filtres par type quand l'utilisateur arrive a l'etape 3
    useEffect(() => {
        if (step !== 3 || !form.type) return;
        setLoadingTemplates(true);
        listTemplates(form.type)
            .then((list) => setTemplates(list.filter((t) => t.active !== false)))
            .catch(() => setTemplates([]))
            .finally(() => setLoadingTemplates(false));
    }, [step, form.type]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    const validateStep = (s: Step): string[] => {
        const errs: string[] = [];
        if (s >= 1 && !form.type) errs.push(t('schedule.errors.typeRequired'));
        if (s >= 2) {
            // La mine (site) n'est PLUS saisie dans le formulaire : elle vient du
            // header. On vérifie seulement qu'une mine active est bien sélectionnée
            // (sinon, l'admin en « Toutes les mines » doit en choisir une en haut).
            if (!form.siteId) errs.push(t('schedule.errors.mineNotActive', { defaultValue: 'Sélectionnez une mine active dans l\'en-tête avant de planifier.' }));
            if (!form.targetRefId) errs.push(t('schedule.errors.targetIdRequired'));
            if (!form.targetLabel.trim()) errs.push(t('schedule.errors.targetLabelRequired'));
        }
        if (s >= 3 && !form.templateId) errs.push(t('schedule.errors.templateRequired'));
        if (s >= 4 && !form.plannedDate) errs.push(t('schedule.errors.dateRequired'));
        return errs;
    };

    const goNext = () => {
        const errs = validateStep(step);
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }
        setErrors([]);
        setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
    };

    const goPrev = () => {
        setErrors([]);
        setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    };

    const handleSubmit = async () => {
        const errs = validateStep(4);
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

    const stepHeader = (n: Step, labelKey: string) => {
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
                    {t(`schedule.steps.${labelKey}`)}
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

                {/* Stepper */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {stepHeader(1, 'type')}
                        {stepHeader(2, 'target')}
                        {stepHeader(3, 'template')}
                        {stepHeader(4, 'details')}
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
                        <StepType
                            selected={form.type}
                            onSelect={(t) => {
                                set('type', t);
                                set('templateId', null);
                            }}
                        />
                    )}
                    {step === 2 && (
                        <StepTarget
                            form={form}
                            setField={set}
                        />
                    )}
                    {step === 3 && (
                        <StepTemplate
                            templates={templates}
                            loading={loadingTemplates}
                            selectedTemplateId={form.templateId}
                            onSelect={(id) => set('templateId', id)}
                        />
                    )}
                    {step === 4 && (
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
                        {step < 4 ? (
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
 *  Sous-composants — un par etape
 * ────────────────────────────────────────────────────────────────────────*/

function StepType({
    selected,
    onSelect,
}: {
    selected: InspectionTemplateType | null;
    onSelect: (t: InspectionTemplateType) => void;
}) {
    const { t } = useTranslation('inspection');
    const types: InspectionTemplateType[] = ['EQUIPMENT', 'LOCATION', 'PROCEDURE'];
    return (
        <div>
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">
                {t('schedule.typeStep.heading')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {types.map((tt) => {
                    const active = selected === tt;
                    return (
                        <button
                            key={tt}
                            type="button"
                            onClick={() => onSelect(tt)}
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
        </div>
    );
}

function StepTarget({
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
                {t('schedule.targetStep.heading')}
            </h2>
            <div className="space-y-3">
                {/* Principe plateforme : la mine (site) N'est PAS demandée ici — elle
                    est celle active dans l'en-tête. On rappelle juste où sera rattachée
                    l'inspection ; aucune sélection de site dans le formulaire. */}
                <div>
                    <label className="block text-[12px] font-medium text-slate-700 mb-1">
                        {t('schedule.targetStep.targetIdLabel')}
                    </label>
                    {/* Saisie numérique en input texte (inputMode numeric) : un
                        <input type=number> bloquait la frappe de façon déroutante.
                        La valeur reste numérique (targetRefId = Long côté backend). */}
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.targetRefId}
                        onChange={(e) => setField('targetRefId', e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 min-h-[40px]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">{t('schedule.targetStep.targetIdHelp')}</p>
                </div>
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
