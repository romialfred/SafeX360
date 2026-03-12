import { Grid, Select, Group, Text, Card, NumberInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCheck, IconBulb } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import { eventTypesMap } from '../../../../Data/DropdownData';


const ClosureStep = ({ form, employees }: any) => {

    return (
        <div className="space-y-6">

            {(form.values.nonConformity.type === 'NEAR_MISS' || form.values.nonConformity.type === 'NON_CONFORMITY') && (
                <Card className="bg-orange-50 border border-orange-200 shadow-sm rounded-xl p-6">
                    <Group className="mb-6">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <IconBulb size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <Text size="lg" fw={600} className="text-orange-800">
                                Lessons Learned
                            </Text>
                            <Text size="sm" className="text-orange-600">
                                Document lessons learned from this {eventTypesMap[form.values.nonConformity.type]} event
                            </Text>
                        </div>
                    </Group>
                    <Grid>
                        <Grid.Col span={12}>
                            <TextEditor form={form} id="nonConformity.lessonLearned" title="Lessons Learned" />
                        </Grid.Col>
                        {/* <Grid.Col span={12}>
                            <TextEditor form={form} id="nonConformity.sharingPlan" title="Knowledge Sharing Plan" />
                        </Grid.Col> */}
                    </Grid>
                </Card>
            )}

            <Card shadow="sm" padding="md">
                <Group className="mb-6">
                    <div className={`p-2 rounded-lg ${form.values.nonConformity.type === 'NON_CONFORMITY' ? 'bg-red-50' : 'bg-green-50'}`}>
                        <IconCheck size={20} className={form.values.nonConformity.type === 'NON_CONFORMITY' ? 'text-red-500' : 'text-green-500'} />
                    </div>
                    <div>
                        <Text size="lg" fw={600} className="text-slate-800">
                            {eventTypesMap[form.values.nonConformity.type]} Closure
                        </Text>
                        <Text size="sm" className="text-slate-600">
                            Final closure and validation
                        </Text>
                    </div>
                </Group>
                <Grid>
                    <Grid.Col span={6}>
                        <DateInput
                            label="Closing date"
                            {...form.getInputProps('nonConformity.closingDate')}
                            placeholder="Enter Closing date"
                            withAsterisk

                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            label="Final status"
                            {...form.getInputProps('nonConformity.finalStatus')}
                            placeholder="Select Final status"
                            data={[{ value: 'Clôturé', label: 'Clôturé' }, { value: 'Rejeté', label: 'Rejeté' }, { value: 'Annulé', label: 'Annulé' }, { value: 'En attente', label: 'En attente' }, { value: 'Reporté', label: 'Reporté' }]}
                            withAsterisk

                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            label="Validated by "
                            {...form.getInputProps('nonConformity.validator')}
                            placeholder="Name of Validator"
                            withAsterisk
                            data={employees}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <DateInput
                            label="Validation date"
                            {...form.getInputProps('nonConformity.validationDate')}
                            placeholder="Enter Validation date"
                            withAsterisk
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <TextEditor form={form} id="nonConformity.validationComment" title="Closing comments" />
                    </Grid.Col>
                </Grid>
            </Card>

            <Card shadow="sm" padding="md">
                <Text size="lg" fw={500} className="mb-4">
                    Effectiveness evaluation
                </Text>
                <Grid>
                    <Grid.Col span={6}>
                        <Select
                            label="Treatment Effectiveness"
                            placeholder="Select Treatment Effectiveness"
                            data={[{ value: 'Très efficace', label: 'Très efficace' }, { value: 'Efficace', label: 'Efficace' }, { value: 'Peu efficace', label: 'Peu efficace' }, { value: 'Inefficace', label: 'Inefficace' }]}{...form.getInputProps('nonConformity.effectiveness')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <NumberInput
                            label="Efficiency score (/10)"
                            placeholder="0"
                            min={0}
                            max={10}
                            step={0.1}{...form.getInputProps('nonConformity.rating')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            label="Risk of recurrence"
                            placeholder="Select Risk of recurrence"
                            data={[{ value: 'Très faible', label: 'Très faible' }, { value: 'Faible', label: 'Faible' }, { value: 'Moyen', label: 'Moyen' }, { value: 'Élevé', label: 'Élevé' }, { value: 'Très élevé', label: 'Très élevé' }]}
                            {...form.getInputProps('nonConformity.risk')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <DateInput
                            label="Next check"
                            placeholder="Follow-up Date"
                            {...form.getInputProps('nonConformity.nextCheck')}
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <TextEditor form={form} id="nonConformity.feedback" title="Feedback" />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* <Card shadow="sm" padding="md">
                <Text size="lg" fw={500} className="mb-4">
                    Archiving and Tracking
                </Text>
                <Grid>
                    <Grid.Col span={6}>
                        <TextInput {...form.getInputProps('nonConformity.archiveNumber')}
                            label="Archive number"
                            placeholder="Enter Archive number"
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select {...form.getInputProps('nonConformity.retentionPeriod')}
                            label="Retention period"
                            placeholder="Select Retention period"
                            data={[{ value: '1', label: '1 an' }, { value: '3', label: '3 ans' }, { value: '5', label: '5 ans' }, { value: '10', label: '10 ans' }, { value: 'permanent', label: 'Permanent' }]}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            label="Archive location"
                            placeholder="Select Location"
                            data={locations}{...form.getInputProps('nonConformity.archiveLocationId')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <TextInput
                            label="Archiving Manager"
                            placeholder="Name of the person in charge"
                            {...form.getInputProps('nonConformity.archiveManager')}
                        />
                    </Grid.Col>
                </Grid>
            </Card> */}
        </div>
    );
};

export default ClosureStep;