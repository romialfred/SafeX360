import {
    TextInput,
    Select,
    Group,
    Text,
    Card,
    Button,
    ActionIcon,
    NumberInput,
    Checkbox,
    Fieldset,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconPlus, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import FileUpdateDropzone from '../../../UtilityComp/FileUpdateDropzone';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { modals } from '@mantine/modals';
import { removeCorrectiveAction } from '../../../../services/CorrectiveActionService';



const TreatmentStep = ({ form, employees }: any) => {
    const selectedCurrency = form.values.nonConformity.currency || 'EUR';



    // Calculate total NC value automatically
    const totalNCValue = form.values.nonConformity.materialCost + form.values.nonConformity.laborCost + form.values.nonConformity.adminFees + form.values.nonConformity.expenses;

    const currencySymbols = {
        'EUR': '€',
        'USD': '$',
        'XOF': 'CFA'
    };
    const handleAddIncident = () => {
        form.insertListItem('correctiveActions', {
            actionName: '',
            deadline: '',
            assignedEmployeeId: "",
            status: "",
            description: ""
        });
    }
    const handleRemoveActionPlan = (index: number, id: any) => {
        if (id) {
            modals.openConfirmModal({
                title: <span className='font-semibold text-2xl'>Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this action plan? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: 'Cancel' },
                cancelProps: { color: 'red', variant: "filled" },
                confirmProps: { color: 'green', variant: "filled" },

                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    form.removeListItem('correctiveActions', index);
                    removeCorrectiveAction(id)
                        .then((_res) => {
                            successNotification("Action Plan removed successfully");
                        }
                        ).catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                        }
                        )
                },
            });
        }
        else {
            form.removeListItem('correctiveActions', index);
        }
    }
    // Get labels based on event type
    const getLabels = () => {
        const isNearMiss = form.values.nonConformity.type === 'NEAR_MISS';

        return {
            treatmentTitle: isNearMiss ? 'Traitement du NEAR_MISS' : 'Traitement de la non conformité',
            decisionLabel: isNearMiss ? 'Action préventive' : 'Décision',
            decisionPlaceholder: isNearMiss ? 'Sélectionner une action préventive' : 'Sélectionner une décision',
            decisionOptions: isNearMiss ? [
                { value: 'Formation', label: 'Formation supplémentaire' },
                { value: 'Sensibilisation', label: 'Sensibilisation équipe' },
                { value: 'Amélioration procédure', label: 'Amélioration procédure' },
                { value: 'Modification équipement', label: 'Modification équipement' },
                { value: 'Renforcement contrôle', label: 'Renforcement contrôle' },
                { value: 'Communication', label: 'Communication renforcée' }
            ] : [
                { value: 'Reprise', label: 'Reprise' },
                { value: 'Rebut', label: 'Rebut' },
                { value: 'Dérogation', label: 'Dérogation' },
                { value: 'Retour fournisseur', label: 'Retour fournisseur' },
                { value: 'Acceptation en l\'état', label: 'Acceptation en l\'état' },
                { value: 'Reclassement', label: 'Reclassement' }
            ],
            valorisationTitle: isNearMiss ? 'Prevention Cost' : 'Non-Conformity valuation',
            valorisationDescription: isNearMiss ? 'Estimated costs of implementing preventive actions' : 'Direct costs related to the non-conformity',
            impactsTitle: isNearMiss ? 'Preventive Benefits' : 'Indirect Impacts',
            impactsDescription: isNearMiss
                ? 'Benefits obtained through prevention'
                : 'Consequences that cannot be financially quantified',
            impactsOptions: isNearMiss ? [
                { key: 'Prevention of potential accidents', label: 'Prevention of potential accidents' },
                { key: 'Future cost savings', label: 'Future cost savings' },
                { key: 'Improved safety', label: 'Improved safety' },
                { key: 'Team awareness', label: 'Team awareness' },
                { key: 'Process improvement', label: 'Process improvement' }
            ] : [
                { key: 'Temporary production shutdown', label: 'Temporary production shutdown' },
                { key: 'Impact on employee health or safety', label: 'Impact on employee health or safety' },
                { key: 'Legal or regulatory non-compliance', label: 'Legal or regulatory non-compliance' },
                { key: 'Damage to company reputation', label: 'Damage to company reputation' },
                { key: 'Loss of client or contract', label: 'Loss of client or contract' }
            ],
            actionsTitle: isNearMiss ? 'Actions Préventives' : 'Actions Correctives',
            actionsDescription: isNearMiss ? 'Définir les actions pour prévenir la survenue d\'incidents similaires' : 'Définir les actions pour prévenir la récurrence de l\'incident',
            actionButtonText: isNearMiss ? 'Add Prevention Plan' : 'Add Action Plan',
            actionPlanLabel: isNearMiss ? 'Prevention Plan Name' : 'Action Plan Name',
            actionPlanPlaceholder: isNearMiss ? 'Nom du plan de prévention' : 'Nom du plan d\'action',
            actionDescriptionLabel: isNearMiss ? 'Description' : 'Description',
            actionDescriptionPlaceholder: isNearMiss ? 'Description détaillée de l\'action préventive' : 'Description détaillée de l\'action corrective',
            priseEnChargeTitle: isNearMiss ? 'Suivi et Communication' : 'Prise en charge',
            priseEnChargeCheckbox: isNearMiss ? 'Partager les leçons apprises avec l\'équipe' : 'Demande << Avoir Prestataire externe >>',
            priseEnChargeDescription: isNearMiss ? 'Cochez cette case pour partager les enseignements avec l\'équipe' : 'Cochez cette case si une demande d\'avoir doit être faite au prestataire externe',
            priseEnChargeComments: isNearMiss ? 'Plan de communication et partage des bonnes pratiques' : 'Commentaires sur la prise en charge',
            priseEnChargeCommentsPlaceholder: isNearMiss ? 'Détails sur la communication des leçons apprises et actions de sensibilisation' : 'Détails sur la prise en charge et les actions entreprises'
        };
    };

    const labels = getLabels();

    // const handleChange = (field: string, value: any) => {
    //     setFormData({ ...formData, [field]: value });
    // };


    return (
        <div className="space-y-6">
            <Card shadow="sm" padding="md">
                <Text size="lg" fw={600} className="text-slate-800 mb-4">
                    {labels.valorisationTitle}
                </Text>
                <Text size="sm" className="text-slate-600 mb-4">
                    {labels.valorisationDescription}
                </Text>
                {/* Sélecteur de devise et Total en haut */}
                <Group justify="space-between" className="mb-4 mt-2">
                    <div className='flex gap-5 items-center'>

                        <Text size="sm" fw={500} className="text-slate-700">
                            Currency
                        </Text>
                        <Select allowDeselect={false}
                            {...form.getInputProps('nonConformity.currency')}
                            data={[
                                { value: 'EUR', label: 'Euro (€)' },
                                { value: 'USD', label: 'US Dollar ($)' },
                                { value: 'XOF', label: 'CFA Franc (CFA)' }
                            ]}
                            className="w-40"
                            size="sm"
                        />
                    </div>
                </Group>
                <div className="space-y-4">
                    {/* First row: Material/Equipment Cost and Labor/Training Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <Group>
                            <Text size="sm" className="w-40 text-slate-700">
                                {form.values.nonConformity.type === 'NEAR_MISS'
                                    ? 'Equipment/Material Cost'
                                    : 'Material/Equipment Cost'}
                            </Text>
                            <NumberInput
                                thousandSeparator="," {...form.getInputProps('nonConformity.materialCost')}
                                placeholder="0"
                                min={0}
                                step={0.01}
                                decimalScale={2}
                                className="w-48"
                                size="sm"
                            />
                            <Text size="sm" className="text-slate-600 w-6">
                                {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                            </Text>
                        </Group>
                        <Group>
                            <Text size="sm" className="w-40 text-slate-700">
                                {form.values.nonConformity.type === 'NEAR_MISS'
                                    ? 'Training/Personnel Cost'
                                    : 'Labor Cost'}
                            </Text>
                            <NumberInput
                                thousandSeparator=","
                                {...form.getInputProps('nonConformity.laborCost')}
                                placeholder="0"
                                min={0}
                                step={0.01}
                                decimalScale={2}
                                className="w-48"
                                size="sm"
                            />
                            <Text size="sm" className="text-slate-600 w-6">
                                {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                            </Text>
                        </Group>
                    </div>

                    {/* Second row: Administrative Fees and Miscellaneous Expenses */}
                    <div className="grid grid-cols-2 gap-4">
                        <Group>
                            <Text size="sm" className="w-40 text-slate-700">
                                {form.values.nonConformity.type === 'NEAR_MISS'
                                    ? 'Communication Fees'
                                    : 'Administrative Fees'}
                            </Text>
                            <NumberInput
                                thousandSeparator=","
                                {...form.getInputProps('nonConformity.adminFees')}
                                placeholder="0"
                                min={0}
                                step={0.01}
                                decimalScale={2}
                                className="w-48"
                                size="sm"
                            />
                            <Text size="sm" className="text-slate-600 w-6">
                                {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                            </Text>
                        </Group>

                        <Group>
                            <Text size="sm" className="w-40 text-slate-700">Miscellaneous Expenses</Text>
                            <NumberInput
                                thousandSeparator=","
                                {...form.getInputProps('nonConformity.expenses')}
                                placeholder="0"
                                min={0}
                                step={0.01}
                                decimalScale={2}
                                className="w-48"
                                size="sm"
                            />
                            <Text size="sm" className="text-slate-600 w-6">
                                {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                            </Text>
                        </Group>

                    </div>
                    {/* Details Field */}
                    <div className="grid grid-cols-2 gap-4">

                        <Group >
                            <Text size="sm" fw={500} className="text-slate-800 w-40">
                                {form.values.nonConformity.type === 'NEAR_MISS'
                                    ? 'Total Prevention:'
                                    : 'Total NC Value:'}
                            </Text>
                            <NumberInput disabled
                                thousandSeparator=","
                                value={totalNCValue}
                                readOnly
                                className="w-48"
                                size="sm"
                            />
                            <Text size="sm" className="text-slate-600 font-semibold">
                                {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                            </Text>
                        </Group>
                    </div>
                    <div>
                        <TextEditor form={form} id="nonConformity.details" title="Details" withAsterisk />
                    </div>
                    {/* File Upload */}
                    <div>
                        <FileUpdateDropzone form={form} id="nonConformity.docs" />
                    </div>
                    {/* Total comes at the end */}

                </div>

            </Card>
            {/* Section Impacts indirects déplacée ici */}
            <Card shadow="sm" padding="md">
                <Group className="mb-4">
                    <div className={`p-2 rounded-lg ${form.values.nonConformity.type === 'NEAR_MISS' ? 'bg-green-50' : 'bg-orange-50'}`}>
                        <IconAlertTriangle size={20} className={form.values.nonConformity.type === 'NEAR_MISS' ? 'text-green-500' : 'text-orange-500'} />
                    </div>
                    <div>
                        <Text size="lg" fw={600} className="text-slate-800">
                            {labels.impactsTitle}
                        </Text>
                        <Text size="sm" className="text-slate-600">
                            {labels.impactsDescription}
                        </Text>
                    </div>
                </Group>
                <Card className={`${form.values.nonConformity.type === 'NEAR_MISS' ? 'bg-green-50/30 border border-green-200' : 'bg-orange-50/30 border border-orange-200'} p-4`}>
                    <Text size="sm" fw={500} className="!mb-3 text-slate-700">
                        {form.values.nonConformity.type === 'NEAR_MISS'
                            ? 'Select applicable preventive benefits:'
                            : 'Select applicable indirect impacts:'}
                    </Text>
                    <Checkbox.Group {...form.getInputProps('nonConformity.indirectImpacts')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {labels.impactsOptions.map((option) => (
                                <Checkbox
                                    key={option.key}
                                    label={option.label}
                                    value={option.key}
                                />
                            ))}
                        </div>
                    </Checkbox.Group>
                    <TextEditor
                        form={form}
                        id="nonConformity.comments"
                        title={
                            form.values.nonConformity.type === 'NEAR_MISS'
                                ? 'Comment on preventive benefits'
                                : 'Comment on indirect impacts'
                        }
                        withAsterisk
                    />
                </Card>
            </Card>
            <Card shadow="sm" padding="md">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-medium text-lg text-gray-800 ">{form.values.nonConformity.type == "NEAR_MISS" ? "Preventive Actions" : "Corrective Actions"}</h3>
                        <p>Define actions to prevent occurence of similar incidents</p>
                    </div>


                    <Button onClick={handleAddIncident} leftSection={<IconPlus />} variant="gradient">Add {form.values.nonConformity.type == "NEAR_MISS" ? "Preventive Plan" : "Corrective Plan"}</Button>
                </div>
                {form?.values.correctiveActions && form?.values.correctiveActions.map((x: any, index: any) => <Fieldset className="grid grid-cols-2 gap-6 mt-5" legend={<div className="flex gap-5">
                    <div className="text-lg font-medium text-blue-500">Action {index + 1}</div>
                    <ActionIcon onClick={() => handleRemoveActionPlan(index, x.id)} variant="filled" color="red" aria-label="Settings">
                        <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                </div>}>
                    <TextInput withAsterisk {...form.getInputProps(`correctiveActions.${index}.actionName`)} label={`${form.values.nonConformity.type == "NEAR_MISS" ? "Preventive" : "Corrective"} Plan Name`} placeholder='Enter plan name' />
                    <Select withAsterisk {...form.getInputProps(`correctiveActions.${index}.assignedEmployeeId`)} data={employees} label="Assign Employee" placeholder="Select assigned employee" />
                    <DateInput withAsterisk {...form.getInputProps(`correctiveActions.${index}.deadline`)} label="Deadline" placeholder="Select deadline" />
                    <Select withAsterisk {...form.getInputProps(`correctiveActions.${index}.status`)} data={[{ label: "Pending", value: "PENDING" }, { label: "In-Progress", value: "IN_PROGRESS" }, { label: "Canceled", value: "CANCELED" }, { label: "Completed", value: "COMPLETED" }]} label="Status" placeholder="Select status" />
                    <div className='col-span-2'>

                        <TextEditor withAsterisk form={form} id={`correctiveActions.${index}.description`} title="Description" />
                    </div>
                </Fieldset>)}
            </Card>
            {/* <Card shadow="sm" padding="md"> */}
            {/* <Text size="lg" fw={500} className="!mb-4">
                    {labels.priseEnChargeTitle}
                </Text>
                <Checkbox
                    label={labels.priseEnChargeCheckbox}
                    className="mb-4"
                />
                <Text size="sm" color="dimmed">
                    {labels.priseEnChargeDescription}
                </Text> */}
            {/* <div className="">
                    <TextEditor form={form} withAsterisk id="nonConformity.supportComments" title="Feedback on support" />
                </div> */}
            {/* </Card> */}
        </div>
    );
};

export default TreatmentStep;