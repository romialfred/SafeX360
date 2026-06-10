import React, { useEffect, useState } from 'react';
import { Button, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
                isReassessment && !value.trim() ? 'Le motif de la réévaluation est obligatoire' : null,
            gravity: (value) => (value ? null : 'La gravité est obligatoire'),
            probability: (value) => (value ? null : 'La probabilité est obligatoire'),
            currentControls: (value) => (value.trim() ? null : 'Les mesures de maîtrise actuelles sont obligatoires'),
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
                successNotification('Évaluation enregistrée');
                fetchAssessments();
                onCancel();
            })
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || "L'évaluation n'a pas pu être enregistrée");
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
                title="Cotation du risque"
                subtitle="Le niveau de risque est calculé automatiquement à partir de la probabilité et de la gravité"
            >
                {isReassessment && (
                    <Textarea
                        label="Motif de la réévaluation"
                        placeholder="ex. Incident du 12 mai, changement de procédé, constat d'audit"
                        withAsterisk
                        minRows={2}
                        autosize
                        size="sm"
                        {...form.getInputProps('reason')}
                    />
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                        label="Gravité"
                        placeholder="Choisir la gravité"
                        data={GRAVITY_OPTIONS_FR}
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('gravity')}
                    />
                    <Select
                        label="Probabilité"
                        placeholder="Choisir la probabilité"
                        data={PROBABILITY_OPTIONS_FR}
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('probability')}
                    />
                    <Select
                        label="Niveau de risque (calculé)"
                        placeholder="Calculé automatiquement"
                        data={LEVEL_SCORE_OPTIONS_FR}
                        disabled
                        size="sm"
                        {...form.getInputProps('severity')}
                    />
                </div>
            </SectionCard>

            <SectionCard
                icon={<IconShield size={15} stroke={1.8} />}
                title="Maîtrise du risque"
                subtitle="Mesures en place et plan d'amélioration"
            >
                <Textarea
                    label="Mesures de maîtrise actuelles"
                    placeholder="ex. Stockage en rétention ventilée, port du masque ABEK et de gants nitrile"
                    withAsterisk
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('currentControls')}
                />
                <Textarea
                    label="Mesures complémentaires nécessaires"
                    placeholder="Mesures à mettre en place pour réduire le risque résiduel"
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('additionalControl')}
                />
                <Textarea
                    label="Mesures préventives"
                    placeholder="Actions de prévention à engager (formation, signalisation, substitution…)"
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('preventiveMeasures')}
                />
                <Textarea
                    label="Mesures d'amélioration"
                    placeholder="Améliorations du dispositif de maîtrise existant"
                    minRows={3}
                    autosize
                    size="sm"
                    {...form.getInputProps('improvementsMeasures')}
                />
                <Textarea
                    label="Commentaires"
                    placeholder="Validations, points de vigilance, suites à donner"
                    minRows={2}
                    autosize
                    size="sm"
                    {...form.getInputProps('comments')}
                />
            </SectionCard>

            <div className="flex justify-end gap-2">
                <Button variant="default" size="sm" type="button" disabled={submitting} onClick={onCancel}>
                    Annuler
                </Button>
                <Button
                    type="submit"
                    color="teal"
                    size="sm"
                    loading={submitting}
                    leftSection={<IconDeviceFloppy size={15} />}
                >
                    Enregistrer l'évaluation
                </Button>
            </div>
        </form>
    );
};

export default RiskAssessmentForm;
