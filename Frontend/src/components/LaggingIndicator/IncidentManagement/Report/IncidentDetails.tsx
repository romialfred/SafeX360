import {
    ActionIcon,
    Badge,
    Button,
    Checkbox,
    Fieldset,
    Group,
    MultiSelect,
    Select,
    SelectProps,
    Text,
    TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { IconPlus, IconTrash, IconInfoSquareRounded, IconShield, IconCategoryPlus, IconMapPin2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import TextEditor from "../../../UtilityComp/TextEditor";
import BodyPartSelect from "./BodyPartSelect";
import { getColorForSeverityLevel } from "../../../../utility/OtherUtilities";
import { incidentStatuses } from "../../../../Data/DropdownData";

const IncidentDetails = ({ form, weatherConditions, locations, categories, incidentTypes, severityLevelMap, bodyParts, workAreas, workProcesses, departments }: any) => {


    // EPI organisés en 3 catégories anatomiques pour saisie rapide terrain
    const ppeCategories = [
        {
            label: 'Tête & voies respiratoires',
            items: [
                { id: 'helmet', name: 'Casque de sécurité' },
                { id: 'goggles', name: 'Lunettes de protection' },
                { id: 'mask', name: 'Masque respiratoire' },
                { id: 'earplugs', name: 'Bouchons auditifs' },
                { id: 'faceshield', name: 'Visière' },
            ],
        },
        {
            label: 'Mains & corps',
            items: [
                { id: 'gloves', name: 'Gants de protection' },
                { id: 'vest', name: 'Gilet haute visibilité' },
                { id: 'coverall', name: 'Combinaison ignifuge' },
                { id: 'apron', name: 'Tablier de protection' },
            ],
        },
        {
            label: 'Pieds & antichute',
            items: [
                { id: 'boots', name: 'Chaussures de sécurité S3' },
                { id: 'harness', name: 'Harnais antichute' },
                { id: 'lanyard', name: 'Longe avec absorbeur' },
                { id: 'kneepads', name: 'Genouillères' },
            ],
        },
    ];




    const handleAddIncident = () => {
        form.insertListItem('incidentDetails', {
            incidentCategoryId: '',
            incidentTypeId: '',
            severityLevelId: '',
            affectedBodyParts: [],
            environmentalImpact: '',
            containmentMeasures: ''
        });
    }


    const handleTypeChange = (value: string | null, index: any) => {
        form.setFieldValue(`incidentDetails.${index}.incidentTypeId`, value);
        formReset(index);
        form.setFieldValue(`incidentDetails.${index}.severityLevelId`, incidentTypes.find((x: any) => x.value == value)?.severityLevel);
    }

    const handleCategoryChange = (value: string | null, index: any) => {
        form.setFieldValue(`incidentDetails.${index}.incidentCategoryId`, value);
        form.setFieldValue(`incidentDetails.${index}.incidentTypeId`, null);
        formReset(index);
    }
    const formReset = (index: number) => {
        form.setFieldValue(`incidentDetails.${index}.affectedBodyParts`, []);
        form.setFieldValue(`incidentDetails.${index}.environmentalImpact`, '');
        form.setFieldValue(`incidentDetails.${index}.containmentMeasures`, '');
        form.setFieldValue(`incidentDetails.${index}.severityLevelId`, '');
    }
    const renderSelectOption: SelectProps['renderOption'] = ({ option }: any) => (<Group wrap='nowrap'>
        < div >
            <Text size="md" className="flex gap-2">{option.label} <Badge color={getColorForSeverityLevel(severityLevelMap[option.severityLevel]?.level)}>{severityLevelMap[option.severityLevel]?.name}</Badge> </Text>
            <Text size="xs" color="dimmed">
                {severityLevelMap[option.severityLevel]?.description}
            </Text>
        </div >
    </Group >
    );
    useEffect(() => {
        form.setFieldValue("workAreaId", "");
        form.setFieldValue("workProcessId", "");
    }, [form.values.department])
    return (
        <div className="space-y-4">
            {/* Carte 1 : Informations générales (numéro retiré, déjà visible dans le header de la page) */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-teal-100/80">
                            <IconInfoSquareRounded size={14} className="text-teal-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">Informations générales</h2>
                    </div>
                    <Select size="xs" {...form.getInputProps("status")} data={incidentStatuses} allowDeselect={false} w={180} />
                </header>
                <div className="p-4 grid grid-cols-1 gap-3">
                    <TextInput size="sm" {...form.getInputProps("title")} label="Titre de l'incident" placeholder="Description courte et factuelle" withAsterisk />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <DateTimePicker size="sm" maxDate={form.values.discoveryTime} {...form.getInputProps("occurredAt")} label="Date et heure de survenance" placeholder="Sélectionner la date et l'heure" withAsterisk />
                        <DateTimePicker size="sm" minDate={form.values.occurredAt} maxDate={new Date()} {...form.getInputProps("discoveryTime")} label="Date et heure de découverte" placeholder="Sélectionner la date et l'heure" withAsterisk />
                    </div>
                </div>
            </section>

            {/* Carte 2 : EPI organisés en 3 colonnes par catégorie anatomique */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-yellow-50/60 border-b border-yellow-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-yellow-100">
                        <IconShield size={14} className="text-yellow-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">Équipements de protection individuelle</h2>
                    <span className="text-[10px] text-slate-500 ml-auto">Cochez les EPI concernés ou manquants au moment de l'incident</span>
                </header>
                <div className="p-4">
                    <Checkbox.Group {...form.getInputProps("ppe")}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {ppeCategories.map((cat) => (
                                <div key={cat.label} className="bg-slate-50/60 rounded-md border border-slate-200 flex flex-col">
                                    <div className="px-3 py-1.5 border-b border-slate-200 bg-white">
                                        <p className="text-[11px] text-slate-700 uppercase tracking-wider">{cat.label}</p>
                                    </div>
                                    <div className="p-2 space-y-1.5 max-h-[180px] overflow-y-auto">
                                        {cat.items.map((item) => (
                                            <Checkbox.Card key={item.id}
                                                value={item.id}
                                                radius="md"
                                                className="group border border-slate-200 transition duration-150 cursor-pointer w-full
                                                 hover:!border-teal-500 hover:!bg-teal-50/60
                                                 data-[checked]:!border-teal-500 data-[checked]:!bg-teal-50
                                                 data-[checked]:shadow-sm bg-white"
                                                p="xs"
                                            >
                                                <Group align="center" gap="xs" wrap="nowrap">
                                                    <Checkbox.Indicator size="xs" />
                                                    <Text size="xs" className="text-slate-800 group-data-[checked]:text-teal-800 group-data-[checked]:truncate">
                                                        {item.name}
                                                    </Text>
                                                </Group>
                                            </Checkbox.Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Checkbox.Group>
                </div>
            </section>

            {/* Carte 3 : Classification */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-red-50/60 border-b border-red-200/70 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-red-100">
                            <IconCategoryPlus size={14} className="text-red-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">Classification de l'incident</h2>
                    </div>
                    <Button size="xs" onClick={handleAddIncident} leftSection={<IconPlus size={14} />} variant="light" color="teal">Ajouter une classification</Button>
                </header>
                <div className="p-4 space-y-3">
                    {form.values.incidentDetails && form.values.incidentDetails.map((x: any, index: any) => {
                        return <Fieldset
                            key={index}
                            className="grid grid-cols-2 gap-3"
                            styles={{
                                root: { borderColor: '#E2E8F0' },
                                legend: { fontSize: 11, fontWeight: 600, color: '#0F766E', padding: '0 6px' }
                            }}
                            legend={<div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-teal-700">Incident {index + 1}</span>
                                <ActionIcon size="xs" onClick={() => form.removeListItem('incidentDetails', index)} variant="light" color="red" aria-label="Retirer">
                                    <IconTrash size={11} stroke={1.5} />
                                </ActionIcon>
                            </div>}
                        >
                            <Select size="sm" withAsterisk {...form.getInputProps(`incidentDetails.${index}.incidentCategoryId`)} onChange={(e) => handleCategoryChange(e, index)} data={categories} label="Catégorie" placeholder="Sélectionner une catégorie" />
                            <div className="flex flex-col gap-1">
                                <Select size="sm" withAsterisk renderOption={renderSelectOption} {...form.getInputProps(`incidentDetails.${index}.incidentTypeId`)} onChange={(e) => handleTypeChange(e, index)} data={incidentTypes.filter((x: any) => x.category == form.getInputProps(`incidentDetails.${index}.incidentCategoryId`)?.value)} label="Type d'incident" placeholder="Sélectionner un type" />
                                {severityLevelMap[x.severityLevelId]?.level > 3 && <Text size="xs" c="red">Cet incident nécessitera une investigation approfondie</Text>}
                            </div>
                            {(incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "Blessure avec traitement" || incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "Premiers soins" || incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "First Aid" || incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "Injury with treatment") &&
                                <div className="space-y-2 col-span-2 bg-red-50/60 border border-red-200 p-3 rounded-md mt-2">
                                    <h4 className="text-xs text-red-800 uppercase tracking-wider">Détails de la blessure</h4>
                                    <BodyPartSelect bodyParts={bodyParts} form={form} id={`incidentDetails.${index}.affectedBodyParts`} />
                                </div>
                            }
                            {
                                categories.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentCategoryId`)?.value)?.label == "Environmental" &&
                                <div className="space-y-2 col-span-2 bg-green-50/60 border border-green-200 p-3 rounded-md mt-2">
                                    <h4 className="text-xs text-green-800 uppercase tracking-wider">Détails de l'incident environnemental</h4>
                                    <TextEditor form={form} id={`incidentDetails.${index}.environmentalImpact`} title="Impact environnemental" />
                                    <TextEditor form={form} id={`incidentDetails.${index}.containmentMeasures`} title="Mesures de confinement" />
                                </div>
                            }
                        </Fieldset>
                    })}
                </div>
            </section>

            {/* Carte 4 : Localisation */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100">
                        <IconMapPin2 size={14} className="text-blue-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">Localisation et contexte de travail</h2>
                </header>
                <div className="p-4 space-y-3">
                    <Select size="sm" {...form.getInputProps("locationId")} data={locations} label="Lieu de l'incident" placeholder="Sélectionner le lieu" withAsterisk />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select size="sm" {...form.getInputProps("department")} label="Département" placeholder="Sélectionner le département" withAsterisk data={departments} />
                        <Select size="sm" {...form.getInputProps("workAreaId")} label="Zone de travail" placeholder="Sélectionner la zone" withAsterisk data={workAreas.filter((x: any) => x.departmentId == form.values.department)} />
                        <Select size="sm" {...form.getInputProps("workProcessId")} label="Processus de travail" placeholder="Sélectionner le processus" withAsterisk data={workProcesses.filter((x: any) => x.departmentId == form.values.department)} />
                    </div>
                    <MultiSelect size="sm" hidePickedOptions {...form.getInputProps("weatherConditions")} data={weatherConditions} label="Conditions environnementales" placeholder="Sélectionner les conditions" withAsterisk />
                </div>
            </section>
        </div>
    )
}

export default IncidentDetails