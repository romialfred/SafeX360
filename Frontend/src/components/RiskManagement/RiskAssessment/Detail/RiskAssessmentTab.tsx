import React, { useEffect } from 'react';
import { Card, Title, Stack, Textarea, Box, Group, Button, Grid, Select, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useParams } from 'react-router-dom';
import { addRiskAnalysis } from '../../../../services/RiskAnalysisService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { gravities, probabilities, riskKeyToSeverity, severities } from '../../../../Data/DropdownData';


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

const RiskAssessmentTab: React.FC<RiskAssessmentTabProps> = ({ onCancel, assessments, fetchAssessments }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
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
            riskId: id ?? ''
        }
    });

    const handleSubmit = (values: RiskAssessmentFormValues) => {
        dispatch(showOverlay());
        addRiskAnalysis({ ...values, riskLevel: ("" + (values?.probability ?? "") + (values?.severity ?? "")) })
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
    useEffect(() => {
        const { gravity, probability } = form.values;
        if (gravity && probability) {
            const key = `${probability}${gravity}`;
            const sev = riskKeyToSeverity[key] ?? '';
            form.setFieldValue('severity', sev);
        } else {
            form.setFieldValue('severity', '');
        }
    }, [form.values.gravity, form.values.probability])
    return <Grid > <Grid.Col span={{ base: 12, lg: 8 }} ><Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md">New Risk Assessment</Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                {assessments?.length > 0 && <Box>
                    <Textarea
                        label="Reason for Reassessment"
                        placeholder="Why are you reassessing this risk? (incident, process change, audit, etc.)"
                        withAsterisk
                        rows={3}
                        {...form.getInputProps('reason')}
                    />
                </Box>}
                {/* Additional form fields can be added here */}
                <Grid>
                    <Grid.Col span={4}>
                        <Select
                            label="Gravity"
                            placeholder="Select gravity level"
                            data={gravities}
                            required
                            {...form.getInputProps('gravity')}
                        />
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Select
                            label="Probability"
                            placeholder="Select probability"
                            data={probabilities}
                            required
                            {...form.getInputProps('probability')}
                        />
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Select
                            disabled
                            label="Severity"
                            placeholder="Select severity"
                            data={severities}
                            required
                            {...form.getInputProps('severity')}
                        />
                    </Grid.Col>
                </Grid>
                <Title order={3} mt="xl" mb="md">Risk Controls</Title>

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
                <Group justify="flex-end" mt="xl">
                    <Button variant="outline" onClick={onCancel} size="md">
                        Cancel
                    </Button>
                    <Button type="submit" color="green" size="md">
                        Save Assessment
                    </Button>
                </Group>
            </Stack>
        </form>
    </Card>
    </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Title order={4} mb="md" c="blue">Risk Assessment Guide</Title>

                <Box p="md" mb="md" style={{ backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #339af0' }}>
                    <Group mb="xs">
                        <Text size="sm" c="blue">ℹ️ Risk Level Matrix</Text>
                    </Group>
                    <Text size="xs" c="dimmed" mb="xs">
                        • Low (1-8): Acceptable risk<br />
                        • Medium (9-20): Tolerable risk<br />
                        • High (21-40): Undesirable risk<br />
                        • Critical (40+): Unacceptable risk
                    </Text>
                </Box>

                <Box p="md" mb="md" style={{ backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                    <Text size="sm" mb="xs" c="orange">Probability Levels:</Text>
                    <Text size="xs" c="dimmed">
                        • Rare: May occur in exceptional circumstances<br />
                        • Unlikely: Could occur at some time<br />
                        • Possible: Might occur at some time<br />
                        • Likely: Will probably occur<br />
                        • Almost Certain: Expected to occur
                    </Text>
                </Box>

                <Box p="md" mb="md" style={{ backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                    <Text size="sm" mb="xs" c="red">Severity Levels:</Text>
                    <Text size="xs" c="dimmed">
                        • Negligible: No injuries, minimal impact<br />
                        • Minor: First aid treatment<br />
                        • Moderate: Medical treatment required<br />
                        • Major: Extensive injuries, hospitalization<br />
                        • Catastrophic: Death or permanent disability
                    </Text>
                </Box>

                <Box p="md" style={{ backgroundColor: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
                    <Text size="sm" mb="xs" c="teal">Severity Formula:</Text>
                    <Text size="xs" c="dimmed" mb="xs">
                        Severity = Gravity × Probability
                    </Text>
                    <Text size="xs" c="dimmed">
                        The final risk level is calculated by multiplying the gravity score by the probability score.
                    </Text>
                </Box>
            </Card>
        </Grid.Col>
    </Grid >

}

export default RiskAssessmentTab;
