import React, { useEffect, useState } from 'react';
import { Button, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconClipboardCheck, IconDeviceFloppy, IconShield } from '@tabler/icons-react';
import { riskKeyToSeverity } from '../../../Data/DropdownData';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { addChemicalRiskAnalysis } from '../../../services/ChemicalRiskAnalysisService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { SectionCard } from './RiskIdentification';
import {
    GRAVITY_OPTIONS_FR,
    LEVEL_SCORE_LABELS_FR,
    LEVEL_SCORE_OPTIONS_FR,
    PROBABILITY_OPTIONS_FR,
    scoreChip,
} from './chemicalLabels';

/**
 * Évaluation d'un risque chimique (LOT 50) : cotation probabilité × gravité
 * (niveau calculé automatiquement) puis plan de maîtrise.
 */

type RiskAssessmentFormValues = {
    reason: string;
    gravity: string | null;
    probability: string | null;
    severity: string | null;
    currentControls: string;
    additionalControl: string;
    preventiveMeasures: string;
    improvementsMeasures: string;
    comments: string;
    riskId: string | undefined;
    // ISO 45001 — risque résiduel (après mesures de maîtrise)
    residualGravity: string | null;
    residualProbability: string | null;
    residualSeverity: string | null;
};

interface RiskAssessmentFormProps {
    onCancel: () => void;
    assessments: any[];
    fetchAssessments: () => void;
}

/**
 * Légende compacte de la hiérarchie des mesures de maîtrise (ISO 45001 §8.1.2).
 * Présentation uniquement : aucun champ n'y est lié.
 */
const ControlHierarchyLegend = ({ t }: { t: (key: string) => string }) => (
    <div className="rounded-lg border border-red-100 bg-red-50/40 px-3.5 py-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-red-700/90 font-medium mb-2">
            {t('assessmentTab.isoControl.subtitle')}
        </p>
        <ol className="flex flex-wrap gap-1.5">
            {(['tier1', 'tier2', 'tier3', 'tier4', 'tier5'] as const).map((tier) => (
                <li
                    key={tier}
                    className="inline-flex items-center rounded-md bg-white border border-red-100 px-2 py-1 text-[11.5px] text-slate-700 leading-tight"
                >
                    {t(`assessmentTab.isoControl.${tier}`)}
                </li>
            ))}
        </ol>
    </div>
);

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onCancel, assessments, fetchAssessments }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { t } = useTranslation('risk');
    const gravityOptions = GRAVITY_OPTIONS_FR.map((o) => ({ value: o.value, label: t(`gravityOption.${o.value}`, { defaultValue: o.label }) }));
    const probabilityOptions = PROBABILITY_OPTIONS_FR.map((o) => ({ value: o.value, label: t(`probabilityOption.${o.value}`, { defaultValue: o.label }) }));
    const levelScoreOptions = LEVEL_SCORE_OPTIONS_FR.map((o) => ({ value: o.value, label: t(`levelScoreOption.${o.value}`, { defaultValue: o.label }) }));
    const [submitting, setSubmitting] = useState(false);
    const isReassessment = (assessments?.length ?? 0) > 0;

    const form = useForm<RiskAssessmentFormValues>({
        initialValues: {
            reason: '',
            gravity: null,
            probability: null,
            severity: null,
            currentControls: '',
            additionalControl: '',
            preventiveMeasures: '',
            improvementsMeasures: '',
            comments: '',
            riskId: id,
            residualGravity: null,
            residualProbability: null,
            residualSeverity: null,
        },
        validate: {
            reason: (value) =>
                isReassessment && !value.trim() ? t('assessmentTab.validate.reason') : null,
            gravity: (value) => (value ? null : t('assessmentTab.validate.gravity')),
            probability: (value) => (value ? null : t('assessmentTab.validate.probability')),
            currentControls: (value) => (value.trim() ? null : t('assessmentTab.validate.currentControls')),
        },
        validateInputOnBlur: true,
    });

    useEffect(() => {
        const { gravity, probability } = form.values;
        if (gravity && probability) {
            const key = `${probability}${gravity}`;
            const severityScore = riskKeyToSeverity[key] ?? '';
            form.setFieldValue('severity', severityScore || null);
        } else {
            form.setFieldValue('severity', null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.gravity, form.values.probability]);

    // Risque résiduel : même composition que la cotation initiale.
    useEffect(() => {
        const { residualGravity, residualProbability } = form.values;
        if (residualGravity && residualProbability) {
            const key = `${residualProbability}${residualGravity}`;
            const severityScore = riskKeyToSeverity[key] ?? '';
            form.setFieldValue('residualSeverity', severityScore || null);
        } else {
            form.setFieldValue('residualSeverity', null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.residualGravity, form.values.residualProbability]);

    const handleSubmit = (values: RiskAssessmentFormValues) => {
        setSubmitting(true);
        dispatch(showOverlay());
        const residualRiskLevel = values.residualProbability && values.residualSeverity
            ? '' + values.residualProbability + values.residualSeverity
            : '';
        addChemicalRiskAnalysis({
            ...values,
            riskLevel: ('' + (values?.probability ?? '') + (values?.severity ?? '')),
            residualGravity: values.residualGravity ? Number(values.residualGravity) : null,
            residualProbability: values.residualProbability ? Number(values.residualProbability) : null,
            residualSeverity: values.residualSeverity ? Number(values.residualSeverity) : null,
            residualRiskLevel: residualRiskLevel || null,
        })
            .then(() => {
                successNotification(t('assessmentTab.savedToast'));
                fetchAssessments();
                onCancel();
            })
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('assessmentTab.saveFailed'));
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4">
            <SectionCard
                icon={<IconClipboardCheck size={15} stroke={1.8} />}
                title={t('assessmentTab.sectionRating')}
                subtitle={t('assessmentTab.sectionRatingSub')}
            >
                {isReassessment && (
                    <Textarea
                        label={t('assessmentTab.reasonLabel')}
                        placeholder={t('assessmentTab.reasonPlaceholder')}
                        withAsterisk
                        minRows={2}
                        autosize
                        size="sm"
                        {...form.getInputProps('reason')}
                    />
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                        label={t('assessmentTab.gravityLabel')}
                        placeholder={t('assessmentTab.gravityPlaceholder')}
                        data={gravityOptions}
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('gravity')}
                    />
                    <Select
                        label={t('assessmentTab.probabilityLabel')}
                        placeholder={t('assessmentTab.probabilityPlaceholder')}
                        data={probabilityOptions}
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('probability')}
                    />
                    <Select
                        label={t('assessmentTab.computedLevelLabel')}
                        placeholder={t('assessmentTab.computedLevelPlaceholder')}
                        data={levelScoreOptions}
                        disabled
                        size="sm"
                        {...form.getInputProps('severity')}
                    />
                </div>

                <div className="mt-1 border-t border-slate-100 pt-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-red-700/90 font-medium mb-2">
                        Risque résiduel (après mesures de maîtrise)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select
                            label={t('assessmentTab.gravityLabel')}
                            placeholder={t('assessmentTab.gravityPlaceholder')}
                            data={gravityOptions}
                            size="sm"
                            clearable
                            {...form.getInputProps('residualGravity')}
                        />
                        <Select
                            label={t('assessmentTab.probabilityLabel')}
                            placeholder={t('assessmentTab.probabilityPlaceholder')}
                            data={probabilityOptions}
                            size="sm"
                            clearable
                            {...form.getInputProps('residualProbability')}
                        />
                        <div>
                            <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                {t('assessmentTab.computedLevelLabel')}
                            </label>
                            {form.values.residualSeverity ? (
                                <span
                                    className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-[12.5px] ${scoreChip(form.values.residualSeverity)}`}
                                >
                                    {form.values.residualSeverity} {' · '}
                                    {LEVEL_SCORE_LABELS_FR[form.values.residualSeverity] ?? ''}
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-400 italic">
                                    {t('assessmentTab.computedLevelPlaceholder')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                icon={<IconShield size={15} stroke={1.8} />}
                title={t('assessmentTab.isoControl.title')}
                subtitle={t('assessmentTab.sectionControlSub')}
            >
                <ControlHierarchyLegend t={t} />
                <Textarea
                    label={t('assessmentTab.isoControl.currentControlsLabel')}
                    placeholder={t('chemicalAssessmentForm.currentControlsPlaceholder')}
                    withAsterisk
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('currentControls')}
                />
                <Textarea
                    label={t('assessmentTab.isoControl.additionalControlLabel')}
                    placeholder={t('assessmentTab.additionalControlPlaceholder')}
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('additionalControl')}
                />
                <Textarea
                    label={t('assessmentTab.isoControl.preventiveLabel')}
                    placeholder={t('chemicalAssessmentForm.preventivePlaceholder')}
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('preventiveMeasures')}
                />
                <Textarea
                    label={t('assessmentTab.isoControl.improvementsLabel')}
                    placeholder={t('assessmentTab.improvementsPlaceholder')}
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('improvementsMeasures')}
                />
                <Textarea
                    label={t('assessmentTab.commentsLabel')}
                    placeholder={t('assessmentTab.commentsPlaceholder')}
                    minRows={2}
                    autosize
                    size="sm"
                    {...form.getInputProps('comments')}
                />
                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                    {t('assessmentTab.isoControl.note')}
                </p>
            </SectionCard>

            <div className="flex justify-end gap-2">
                <Button variant="default" size="sm" type="button" disabled={submitting} onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
                <Button
                    type="submit"
                    size="sm"
                    loading={submitting}
                    leftSection={<IconDeviceFloppy size={15} />}
                    styles={{ root: { backgroundColor: '#DC2626' } }}
                >
                    {t('assessmentTab.saveAssessment')}
                </Button>
            </div>
        </form>
    );
};

export default RiskAssessmentForm;
