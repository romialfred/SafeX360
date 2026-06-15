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
    LEVEL_SCORE_OPTIONS_FR,
    PROBABILITY_OPTIONS_FR,
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
};

interface RiskAssessmentFormProps {
    onCancel: () => void;
    assessments: any[];
    fetchAssessments: () => void;
}

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

    const handleSubmit = (values: RiskAssessmentFormValues) => {
        setSubmitting(true);
        dispatch(showOverlay());
        addChemicalRiskAnalysis({ ...values, riskLevel: ('' + (values?.probability ?? '') + (values?.severity ?? '')) })
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
            </SectionCard>

            <SectionCard
                icon={<IconShield size={15} stroke={1.8} />}
                title={t('assessmentTab.sectionControl')}
                subtitle={t('assessmentTab.sectionControlSub')}
            >
                <Textarea
                    label={t('assessmentTab.currentControlsLabel')}
                    placeholder={t('chemicalAssessmentForm.currentControlsPlaceholder')}
                    withAsterisk
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('currentControls')}
                />
                <Textarea
                    label={t('assessmentTab.additionalControlLabel')}
                    placeholder={t('assessmentTab.additionalControlPlaceholder')}
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('additionalControl')}
                />
                <Textarea
                    label={t('assessmentTab.preventiveLabel')}
                    placeholder={t('chemicalAssessmentForm.preventivePlaceholder')}
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('preventiveMeasures')}
                />
                <Textarea
                    label={t('assessmentTab.improvementsLabel')}
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
            </SectionCard>

            <div className="flex justify-end gap-2">
                <Button variant="default" size="sm" type="button" disabled={submitting} onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
                <Button
                    type="submit"
                    color="teal"
                    size="sm"
                    loading={submitting}
                    leftSection={<IconDeviceFloppy size={15} />}
                >
                    {t('assessmentTab.saveAssessment')}
                </Button>
            </div>
        </form>
    );
};

export default RiskAssessmentForm;
