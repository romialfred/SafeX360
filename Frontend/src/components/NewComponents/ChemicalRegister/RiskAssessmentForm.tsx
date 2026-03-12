import React, { useEffect } from 'react';
import { Select, Textarea, Box, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
    IconFileText,
    IconShield,
} from "@tabler/icons-react";
import { gravities, probabilities, severities, riskKeyToSeverity } from "../../../Data/DropdownData";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { addChemicalRiskAnalysis } from "../../../services/ChemicalRiskAnalysisService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";

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
            riskId: id
        }
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
    }, [form.values.gravity, form.values.probability]);

    const handleSubmit = (values: RiskAssessmentFormValues) => {
        dispatch(showOverlay());
        addChemicalRiskAnalysis({ ...values, riskLevel: ("" + (values?.probability ?? "") + (values?.severity ?? "")) })
            .then(() => {
                successNotification("Assessment added successfully");
                fetchAssessments();
                onCancel();
            })
            .catch((_error) => {
                errorNotification("Error adding assessment:");
            }).finally(() => {
                dispatch(hideOverlay());
            })
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-6">
                <div className="flex items-center mb-6">
                    <IconFileText className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">
                        Assessment Information
                    </h3>
                </div>

                {assessments?.length > 0 && (
                    <Box>
                        <Textarea
                            label="Reason for Reassessment"
                            placeholder="Why are you reassessing this risk? (incident, process change, audit, etc.)"
                            withAsterisk
                            rows={3}
                            {...form.getInputProps('reason')}
                        />
                    </Box>
                )}

                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Select
                            label="Gravity"
                            placeholder="Select gravity level"
                            data={gravities}
                            required
                            {...form.getInputProps('gravity')}
                        />

                        <Select
                            label="Probability"
                            placeholder="Select probability"
                            data={probabilities}
                            required
                            {...form.getInputProps('probability')}
                        />
                        <Select
                            label="Severity"
                            placeholder="Select severity"
                            data={severities}
                            required
                            disabled
                            {...form.getInputProps('severity')}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-6">
                <div className="flex items-center mb-6">
                    <IconShield className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">
                        Risk Controls
                    </h3>
                </div>

                <div className="flex flex-col gap-6 mb-6">
                    <Textarea
                        label="Current Controls"
                        placeholder="Describe existing risk controls..."
                        required
                        rows={3}
                        {...form.getInputProps('currentControls')}
                    />

                    <Textarea
                        label="Additional Controls Needed"
                        placeholder="Describe additional controls required..."
                        rows={3}
                        {...form.getInputProps('additionalControl')}
                    />

                    <Textarea
                        label="Preventive Measures"
                        placeholder="Describe preventive measures to implement..."
                        rows={3}
                        {...form.getInputProps('preventiveMeasures')}
                    />

                    <Textarea
                        label="Improvement Measures"
                        placeholder="Describe improvement measures to enhance risk control..."
                        rows={3}
                        {...form.getInputProps('improvementsMeasures')}
                    />

                    <Box>
                        <Textarea
                            label="Comments"
                            placeholder="Additional comments..."
                            rows={2}
                            {...form.getInputProps('comments')}
                        />
                    </Box>
                </div>
            </div>

            <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200">
                <div className="flex space-x-4">
                    <Button color='gray' type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Submit for Review</Button>
                </div>
            </div>
        </form>
    );
};

export default RiskAssessmentForm;
