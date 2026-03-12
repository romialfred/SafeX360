import { Grid, TextInput, Select, Group, Text, Card, Badge, MultiSelect } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconUser, IconTool, IconAlertTriangle } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import { eventTypes, eventTypesMap } from '../../../../Data/DropdownData';
import FileUpdateDropzone from '../../../UtilityComp/FileUpdateDropzone';




const DeclarationStep = ({ form, employees, locations, categories, workProcesses, edit }: any) => {


    const natureOptions = [
        {
            value: 'Documentaire / Procédurale',
            label: 'Documentaire / Procédurale',
            description: 'Procédure absente, non suivie ou obsolète'
        },
        {
            value: 'Organisationnelle',
            label: 'Organisationnelle',
            description: 'Rôle, responsabilité ou ressource non définie ou mal appliquée'
        },
        {
            value: 'Comportementale / Humaine',
            label: 'Comportementale / Humaine',
            description: 'Non-respect des consignes de sécurité, mauvais usage des équipements'
        },
        {
            value: 'Technique / Équipement',
            label: 'Technique / Équipement',
            description: 'Défaillance d\'un équipement, maintenance non effectuée'
        },
        {
            value: 'Conformité légale / réglementaire',
            label: 'Conformité légale / réglementaire',
            description: 'Non-respect d\'une loi, d\'un décret ou d\'une exigence administrative'
        },
        {
            value: 'Environnement de travail / Conditions SST',
            label: 'Environnement de travail / Conditions SST',
            description: 'Risques non identifiés ou mal maîtrisés (ex : bruit, chaleur, produits chimiques)'
        },
        {
            value: 'Formation / Compétence',
            label: 'Formation / Compétence',
            description: 'Personnel non formé ou non habilité à effectuer une tâche'
        },
        {
            value: 'Réactivité / Incident non traité',
            label: 'Réactivité / Incident non traité',
            description: 'Signalement ignoré, traitement trop lent ou non conforme'
        },
        {
            value: 'Fournisseurs / Sous-traitants',
            label: 'Fournisseurs / Sous-traitants',
            description: 'Produit, service ou intervention non conforme aux exigences SST'
        },
        {
            value: 'Résultats / Performances',
            label: 'Résultats / Performances',
            description: 'Objectifs SST non atteints, indicateurs défaillants'
        }
    ];

    const nearMissTypes = [
        'Fall avoided',
        'Object drop',
        'Vehicle conflict',
        'Chemical exposure avoided',
        'Equipment malfunction',
        'Fire/explosion risk',
        'Electrical hazard',
        'Environmental release',
        'Security breach',
        'Other'
    ];

    const contributingFactorsOptions = [
        'Unsafe behavior',
        'Environmental conditions',
        'Equipment failure',
        'Inadequate training',
        'Poor communication',
        'Time pressure',
        'Inadequate procedures',
        'Lack of supervision',
        'Personal protective equipment issues',
        'Workplace design'
    ];

    const requirementOptions = [
        'ISO 45001 Standard',
        'Company Safety Policy',
        'Environmental Procedure',
        'Quality Management System',
        'Legal Requirement',
        'Industry Standard',
        'Training Requirement',
        'Maintenance Procedure',
        'Emergency Response Plan',
        'Risk Assessment'
    ];

    const detectionSources = [
        'Internal Audit',
        'Management Review',
        'Customer Complaint',
        'Supplier Audit',
        'Regulatory Inspection',
        'Self-Assessment',
        'Incident Investigation',
        'Routine Inspection',
        'Employee Report',
        'External Audit'
    ];

    const getSelectedDescriptions = () => {
        return natureOptions.filter(option => form.values.nonConformity.events?.includes(option.value));
    };





    return (
        <div className="space-y-6">
            {/* Event Type Selection */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 !flex !flex-col gap-2">
                <Group className="mb-6">
                    <div className={`p-2 rounded-lg ${form.values.nonConformity.type === 'NON_CONFORMITY' ? 'bg-red-50' : 'bg-orange-50'
                        }`}>
                        <IconAlertTriangle size={20} className={
                            form.values.nonConformity.type === 'NON_CONFORMITY' ? 'text-red-500' : 'text-orange-500'
                        } />
                    </div>
                    <div>
                        <Text size="lg" fw={600} className="text-slate-800">
                            HSE Event Declaration
                        </Text>
                        <Text size="sm" className="text-slate-600">
                            Event type selection and basic information
                        </Text>
                    </div>
                </Group>

                <Grid >
                    <Grid.Col span={12}>
                        <Select disabled={edit}
                            label="Event Type "
                            placeholder="Select event type"
                            {...form.getInputProps('nonConformity.type')}
                            data={eventTypes}
                            withAsterisk

                            description="Select whether this is a non-conformity or a near miss event"
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <TextInput
                            label="Auto-Generated Number"
                            value={form.values.nonConformity.number || ''}
                            disabled



                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <TextInput
                            label="Title "
                            placeholder={`Brief title of the ${eventTypesMap[form.values.nonConformity.type] || 'event'}`}
                            {...form.getInputProps('nonConformity.title')}
                            withAsterisk

                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <DateInput
                            label="Date of Event "
                            placeholder="When was this reported"
                            maxDate={form.values.nonConformity.detectionDate}
                            {...form.getInputProps('nonConformity.date')}
                            withAsterisk
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <DateInput
                            label="Detection Date "
                            placeholder="When was this detected"
                            withAsterisk {...form.getInputProps('nonConformity.detectionDate')}
                            minDate={form.values.nonConformity.date}

                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Select
                            label="Reported by "
                            placeholder="Person who reported the event"
                            {...form.getInputProps('nonConformity.reportedBy')}
                            leftSection={<IconUser size={16} className="text-slate-400" />}
                            data={employees}
                            withAsterisk
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Select
                            label="Work Process "
                            placeholder="Select work process"
                            withAsterisk {...form.getInputProps('nonConformity.workProcessId')}
                            data={workProcesses}
                            leftSection={<IconTool size={16} className="text-slate-400" />}

                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Select
                            label="Location "
                            placeholder="Select location"
                            {...form.getInputProps('nonConformity.locationId')}
                            data={locations}
                            withAsterisk

                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Select
                            label="Event Category "
                            placeholder="Select event category"
                            {...form.getInputProps('nonConformity.categoryId')}
                            data={categories}
                            withAsterisk

                        />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <TextEditor form={form} id="nonConformity.description" title="Description" withAsterisk />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <FileUpdateDropzone form={form} id="nonConformity.evidence" />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Event Type Specific Fields */}
            {form.values.nonConformity.type === 'NON_CONFORMITY' && (
                <Card className="bg-red-50 border border-red-200 shadow-sm rounded-xl p-6">
                    <Group className="mb-6">
                        <div className="p-2 rounded-lg bg-red-100">
                            <IconAlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <Text size="lg" fw={600} className="text-red-800">
                                Non-Conformity Specific Information
                            </Text>
                            <Text size="sm" className="text-red-600">
                                Additional details for non-conformity events
                            </Text>
                        </div>
                    </Group>

                    <Grid>
                        <Grid.Col span={4}>
                            <Select
                                label="Requirement Not Met "
                                placeholder="Select requirement"
                                {...form.getInputProps('nonConformity.requirement')}
                                data={requirementOptions.map(req => ({ value: req, label: req }))}
                                withAsterisk

                            />
                        </Grid.Col>

                        <Grid.Col span={4}>
                            <Select
                                label="Source of Detection "
                                placeholder="How was this detected"
                                {...form.getInputProps('nonConformity.detectionSource')}
                                data={detectionSources.map(source => ({ value: source, label: source }))}
                                withAsterisk

                            />
                        </Grid.Col>

                        <Grid.Col span={4}>
                            <Select
                                label="Severity Level "
                                placeholder="Select severity"
                                {...form.getInputProps('nonConformity.severityLevel')}
                                data={[
                                    { value: 'Minor', label: 'Minor' },
                                    { value: 'Major', label: 'Major' },
                                    { value: 'Critical', label: 'Critical' }
                                ]}
                                withAsterisk

                            />
                        </Grid.Col>

                        <Grid.Col span={12}>


                            <TextEditor form={form} id="nonConformity.actionTaken" title="Immediate Action Taken" withAsterisk />

                        </Grid.Col>
                    </Grid>
                </Card>
            )}

            {form.values.nonConformity.type === 'NEAR_MISS' && (
                <Card className="bg-orange-50 border border-orange-200 shadow-sm rounded-xl p-6">
                    <Group className="mb-6">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <IconAlertTriangle size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <Text size="lg" fw={600} className="text-orange-800">
                                Near Miss Specific Information
                            </Text>
                            <Text size="sm" className="text-orange-600">
                                Additional details for near miss events
                            </Text>
                        </div>
                    </Group>

                    <Grid>
                        <Grid.Col span={12}>
                            <Select
                                label="Type of Near Miss "
                                placeholder="Select near miss type"
                                {...form.getInputProps('nonConformity.nearMissType')}
                                data={nearMissTypes.map(type => ({ value: type, label: type }))}
                                withAsterisk

                            />
                        </Grid.Col>

                        <Grid.Col span={12}>
                            <MultiSelect
                                label="Contributing Factors "
                                placeholder="Select contributing factors"
                                data={contributingFactorsOptions.map(factor => ({ value: factor, label: factor }))}
                                {...form.getInputProps('nonConformity.factors')}
                                withAsterisk
                                searchable
                                clearable

                                description="Select all factors that contributed to this near miss"
                            />
                        </Grid.Col>

                        <Grid.Col span={12}>
                            <TextEditor
                                form={form}
                                id="nonConformity.preventiveAction"
                                title="Immediate Corrective or Preventive Action"
                                withAsterisk
                            />
                        </Grid.Col>

                        <Grid.Col span={12}>
                            <TextEditor
                                form={form}
                                withAsterisk
                                title="Opportunity for Improvement"
                                id="nonConformity.improvement"

                            />
                        </Grid.Col>
                    </Grid>
                </Card>
            )}

            {/* Common Nature Classification (for both types) */}
            {form.values.nonConformity.type && (
                <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                    <Group className="mb-6">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <IconTool size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <Text size="lg" fw={600} className="text-slate-800">
                                Event Classification
                            </Text>
                            <Text size="sm" className="text-slate-600">
                                Classify the nature of this event according to ISO 45001
                            </Text>
                        </div>
                    </Group>

                    <Grid>
                        <Grid.Col span={12}>
                            <MultiSelect
                                label="Nature of the Event "
                                placeholder="Select Nature of the Event"
                                data={natureOptions}
                                {...form.getInputProps('nonConformity.events')}
                                withAsterisk
                                searchable
                                clearable

                                description="You can select multiple event types according to ISO 45001"
                            />
                        </Grid.Col>

                        {form.values.nonConformity.events.length > 0 && (
                            <Grid.Col span={12}>
                                <Card className={`border p-4 ${form.values.nonConformity.type === 'NON_CONFORMITY'
                                    ? '!bg-red-50 !border-red-200'
                                    : '!bg-orange-50 !border-orange-200'
                                    }`}>
                                    <Text size="sm" fw={500} className={`!mb-3 ${form.values.nonConformity.type === 'NON_CONFORMITY'
                                        ? '!text-red-800'
                                        : '!text-orange-800'
                                        }`}>
                                        Description of selected natures:
                                    </Text>
                                    <div className="space-y-2">
                                        {getSelectedDescriptions().map((nature, index) => (
                                            <div key={index} className="flex items-start space-x-2">
                                                <Badge
                                                    size="sm"
                                                    className={`mt-0.5 flex-shrink-0 ${form.values.nonConformity.type === 'NON_CONFORMITY'
                                                        ? '!bg-red-100 !text-red-700'
                                                        : '!bg-orange-100 !text-orange-700'
                                                        }`}
                                                >
                                                    {nature.label}
                                                </Badge>
                                                <Text size="xs" className={`leading-relaxed ${form.values.nonConformity.type === 'NON_CONFORMITY'
                                                    ? '!text-red-700'
                                                    : '!text-orange-700'
                                                    }`}>
                                                    {nature.description}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </Grid.Col>
                        )}
                    </Grid>
                </Card>
            )}
        </div>
    );
};

export default DeclarationStep;