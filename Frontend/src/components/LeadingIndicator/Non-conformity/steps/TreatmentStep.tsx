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
                title: <span className='text-2xl'>Are you sure?</span>,
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
            valorisationTitle: isNearMiss ? 'Coût de prévention' : "Valorisation de la non-conformité",
            valorisationDescription: isNearMiss ? "Coûts estimés de mise en œuvre des actions préventives" : "Coûts directs liés à la non-conformité",
            impactsTitle: isNearMiss ? 'Bénéfices préventifs' : 'Impacts indirects',
            impactsDescription: isNearMiss
                ? "Bénéfices obtenus grâce à la prévention"
                : "Conséquences ne pouvant pas être quantifiées financièrement",
            impactsOptions: isNearMiss ? [
                { key: 'Prévention d\'accidents potentiels', label: "Prévention d'accidents potentiels" },
                { key: 'Économies futures', label: 'Économies futures' },
                { key: 'Amélioration de la sécurité', label: 'Amélioration de la sécurité' },
                { key: 'Sensibilisation de l\'équipe', label: "Sensibilisation de l'équipe" },
                { key: 'Amélioration du processus', label: 'Amélioration du processus' }
            ] : [
                { key: 'Arrêt temporaire de production', label: 'Arrêt temporaire de production' },
                { key: 'Impact sur la santé ou sécurité des employés', label: 'Impact sur la santé ou sécurité des employés' },
                { key: 'Non-conformité légale ou réglementaire', label: 'Non-conformité légale ou réglementaire' },
                { key: 'Atteinte à la réputation', label: 'Atteinte à la réputation' },
                { key: 'Perte de client ou de contrat', label: 'Perte de client ou de contrat' }
            ],
            actionsTitle: isNearMiss ? 'Actions préventives' : 'Actions correctives',
            actionsDescription: isNearMiss ? "Définir les actions pour prévenir la survenue d'incidents similaires" : "Définir les actions pour prévenir la récurrence de l'incident",
            actionButtonText: isNearMiss ? 'Ajouter un plan préventif' : 'Ajouter un plan correctif',
            actionPlanLabel: isNearMiss ? 'Nom du plan préventif' : 'Nom du plan correctif',
            actionPlanPlaceholder: isNearMiss ? 'Nom du plan de prévention' : "Nom du plan d'action",
            actionDescriptionLabel: 'Description',
            actionDescriptionPlaceholder: isNearMiss ? "Description détaillée de l'action préventive" : "Description détaillée de l'action corrective",
            priseEnChargeTitle: isNearMiss ? 'Suivi et communication' : 'Prise en charge',
            priseEnChargeCheckbox: isNearMiss ? "Partager les leçons apprises avec l'équipe" : 'Demande "Avoir prestataire externe"',
            priseEnChargeDescription: isNearMiss ? "Cochez pour partager les enseignements avec l'équipe" : "Cochez si une demande d'avoir doit être faite au prestataire externe",
            priseEnChargeComments: isNearMiss ? 'Plan de communication et partage des bonnes pratiques' : 'Commentaires sur la prise en charge',
            priseEnChargeCommentsPlaceholder: isNearMiss ? "Détails sur la communication des leçons apprises et actions de sensibilisation" : "Détails sur la prise en charge et les actions entreprises"
        };
    };

    const labels = getLabels();

    // const handleChange = (field: string, value: any) => {
    //     setFormData({ ...formData, [field]: value });
    // };


    return (
        <div className="space-y-6">
            <Card shadow="sm" padding="md">
                <Text size="lg" className="text-slate-800 mb-4">
                    {labels.valorisationTitle}
                </Text>
                <Text size="sm" className="text-slate-600 mb-4">
                    {labels.valorisationDescription}
                </Text>
                {/* Sélecteur de devise et Total en haut */}
                <Group justify="space-between" className="mb-4 mt-2">
                    <div className='flex gap-5 items-center'>

                        <Text size="sm" className="text-slate-700">
                            Devise
                        </Text>
                        <Select allowDeselect={false}
                            {...form.getInputProps('nonConformity.currency')}
                            data={[
                                { value: 'EUR', label: 'Euro (€)' },
                                { value: 'USD', label: 'Dollar US ($)' },
                                { value: 'XOF', label: 'Franc CFA (CFA)' }
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
                                Coût matériel / équipement
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
                                {form.values.nonConformity.type === 'NEAR_MISS' ? 'Coût formation / personnel' : "Coût main-d'œuvre"}
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
                                {form.values.nonConformity.type === 'NEAR_MISS' ? 'Frais de communication' : 'Frais administratifs'}
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
                            <Text size="sm" className="w-40 text-slate-700">Dépenses diverses</Text>
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
                            <Text size="sm" className="text-slate-800 w-40">
                                {form.values.nonConformity.type === 'NEAR_MISS' ? 'Total prévention :' : 'Total NC :'}
                            </Text>
                            <NumberInput disabled
                                thousandSeparator=","
                                value={totalNCValue}
                                readOnly
                                className="w-48"
                                size="sm"
                            />
                            <Text size="sm" className="text-slate-600">
                                {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                            </Text>
                        </Group>
                    </div>
                    <div>
                        <TextEditor form={form} id="nonConformity.details" title="Détails" withAsterisk />
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
                        <Text size="lg" className="text-slate-800">
                            {labels.impactsTitle}
                        </Text>
                        <Text size="sm" className="text-slate-600">
                            {labels.impactsDescription}
                        </Text>
                    </div>
                </Group>
                <Card className={`${form.values.nonConformity.type === 'NEAR_MISS' ? 'bg-green-50/30 border border-green-200' : 'bg-orange-50/30 border border-orange-200'} p-4`}>
                    <Text size="sm" className="!mb-3 text-slate-700">
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
                        <h3 className="text-lg text-gray-800 ">{form.values.nonConformity.type == "NEAR_MISS" ? "Preventive Actions" : "Corrective Actions"}</h3>
                        <p>Define actions to prevent occurence of similar incidents</p>
                    </div>


                    <Button size="sm" color="indigo" onClick={handleAddIncident} leftSection={<IconPlus size={14} />}>Ajouter un plan {form.values.nonConformity.type == "NEAR_MISS" ? "préventif" : "correctif"}</Button>
                </div>
                {form?.values.correctiveActions && form?.values.correctiveActions.map((x: any, index: any) => <Fieldset className="grid grid-cols-2 gap-6 mt-5" legend={<div className="flex gap-5">
                    <div className="text-sm text-indigo-700 uppercase tracking-wider">Action {index + 1}</div>
                    <ActionIcon size="xs" onClick={() => handleRemoveActionPlan(index, x.id)} variant="light" color="red" aria-label="Retirer">
                        <IconTrash size={11} stroke={1.5} />
                    </ActionIcon>
                </div>}>
                    <TextInput size="sm" withAsterisk {...form.getInputProps(`correctiveActions.${index}.actionName`)} label={`Nom du plan ${form.values.nonConformity.type == "NEAR_MISS" ? "préventif" : "correctif"}`} placeholder='Saisir le nom du plan' />
                    <Select size="sm" withAsterisk {...form.getInputProps(`correctiveActions.${index}.assignedEmployeeId`)} data={employees} searchable label="Employé assigné" placeholder="Sélectionner l'employé" />
                    <DateInput size="sm" withAsterisk {...form.getInputProps(`correctiveActions.${index}.deadline`)} label="Échéance" placeholder="Sélectionner la date" />
                    <Select size="sm" withAsterisk {...form.getInputProps(`correctiveActions.${index}.status`)} data={[{ label: "En attente", value: "PENDING" }, { label: "En cours", value: "IN_PROGRESS" }, { label: "Annulée", value: "CANCELED" }, { label: "Terminée", value: "COMPLETED" }]} label="Statut" placeholder="Sélectionner le statut" />
                    <div className='col-span-2'>

                        <TextEditor withAsterisk form={form} id={`correctiveActions.${index}.description`} title="Description" />
                    </div>
                </Fieldset>)}
            </Card>
            {/* <Card shadow="sm" padding="md"> */}
            {/* <Text size="lg" className="!mb-4">
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
                    <TextEditor form={form} withAsterisk id="nonConformity.supportComments" title="Retour sur la prise en charge" />
                </div> */}
            {/* </Card> */}
        </div>
    );
};

export default TreatmentStep;