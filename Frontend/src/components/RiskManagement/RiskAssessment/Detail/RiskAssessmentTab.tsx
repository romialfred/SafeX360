import React, { useEffect, useState } from 'react';
import { Button, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { IconClipboardCheck, IconDeviceFloppy, IconShield } from '@tabler/icons-react';
import { addRiskAnalysis } from '../../../../services/RiskAnalysisService';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { riskKeyToSeverity } from '../../../../Data/DropdownData';
import {
    GRAVITY_OPTIONS_FR,
    LEVEL_SCORE_OPTIONS_FR,
    PROBABILITY_OPTIONS_FR,
} from '../../riskLabels';

/**
 * Nouvelle évaluation d'un risque (LOT 50) : cotation probabilité × gravité
 * (niveau calculé automatiquement) puis plan de maîtrise, avec aide-mémoire.
 */

interface RiskAssessmentTabProps {
    onCancel: () => void;
    assessments: any[];
    fetchAssessments: () => void;
}

type RiskAssessmentFormValues = {
    reason: string;
    gravity: string;
    probability: string;
    severity: string;
    currentControls: string;
    additionalControl: string;
    preventiveMeasures: string;
    improvementsMeasures: string;
    comments: string;
    riskId: string;
};

const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
            <span className="inline-flex p-1.5 rounded-md bg-red-50 text-red-700">{icon}</span>
            <div>
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const GUIDE_BLOCKS: { title: string; accent: string; items: string[] }[] = [
    {
        title: 'Lire le niveau calculé',
        accent: 'border-amber-200 bg-amber-50/60',
        items: [
            'Faible et faible à modéré : risque acceptable, à surveiller dans le cycle normal.',
            "Modéré : risque tolérable sous réserve d'un plan d'action suivi.",
            'Élevé et critique : traitement prioritaire, mesures complémentaires obligatoires.',
        ],
    },
    {
        title: 'Coter la probabilité',
        accent: 'border-sky-200 bg-sky-50/60',
        items: [
            'Rare : envisageable seulement dans des circonstances exceptionnelles.',
            'Possible : pourrait survenir au cours du cycle de production.',
            'Quasi-certain : attendu si rien ne change dans les conditions actuelles.',
        ],
    },
    {
        title: 'Coter la gravité',
        accent: 'border-rose-200 bg-rose-50/60',
        items: [
            'Négligeable : pas de blessure, impact minime.',
            'Modérée : soins médicaux nécessaires, arrêt de courte durée.',
            'Catastrophique : décès ou invalidité permanente.',
        ],
    },
    {
        title: 'Documenter la maîtrise',
        accent: 'border-emerald-200 bg-emerald-50/60',
        items: [
            'Listez les mesures existantes : protections collectives, EPI, consignes.',
            'Les mesures proposées doivent avoir un responsable et une échéance.',
            'Réévaluez après tout incident, changement de procédé ou constat d\'audit.',
        ],
    },
];

const RiskAssessmentTab: React.FC<RiskAssessmentTabProps> = ({ onCancel, assessments, fetchAssessments }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [submitting, setSubmitting] = useState(false);
    const isReassessment = (assessments?.length ?? 0) > 0;

    const form = useForm<RiskAssessmentFormValues>({
        initialValues: {
            reason: '',
            gravity: '',
            probability: '',
            severity: '',
            currentControls: '',
            additionalControl: '',
            preventiveMeasures: '',
            improvementsMeasures: '',
            comments: '',
            riskId: id ?? '',
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
            form.setFieldValue('severity', riskKeyToSeverity[key] ?? '');
        } else {
            form.setFieldValue('severity', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.gravity, form.values.probability]);

    const handleSubmit = (values: RiskAssessmentFormValues) => {
        setSubmitting(true);
        dispatch(showOverlay());
        addRiskAnalysis({ ...values, riskLevel: ('' + (values?.probability ?? '') + (values?.severity ?? '')) })
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
            <form onSubmit={form.onSubmit(handleSubmit)} className="xl:col-span-2 flex flex-col gap-4">
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
                        placeholder="ex. Balisage de la zone, vigie pendant les manœuvres, consigne de vitesse à 20 km/h"
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
                        placeholder="Actions de prévention à engager (formation, signalisation, maintenance…)"
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

            {/* Aide-mémoire de cotation */}
            <aside className="flex flex-col gap-3" aria-label="Aide à l'évaluation">
                {GUIDE_BLOCKS.map((block) => (
                    <div key={block.title} className={`rounded-xl border p-3 ${block.accent}`}>
                        <h4
                            className="text-slate-800 mb-1.5"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {block.title}
                        </h4>
                        <ul className="space-y-1 text-[12px] text-slate-600 leading-relaxed list-disc pl-4">
                            {block.items.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </aside>
        </div>
    );
};

export default RiskAssessmentTab;
