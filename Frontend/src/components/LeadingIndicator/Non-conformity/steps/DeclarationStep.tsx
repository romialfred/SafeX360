import { TextInput, Select, Text, Badge, MultiSelect } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconUser, IconTool, IconAlertTriangle, IconClipboardList,
    IconCategoryPlus, IconBookmark,
} from '@tabler/icons-react';
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
        'Chute évitée',
        'Chute d\'objet',
        'Conflit véhicule / piéton',
        'Exposition chimique évitée',
        'Dysfonctionnement d\'équipement',
        'Risque incendie / explosion',
        'Danger électrique',
        'Rejet environnemental',
        'Atteinte à la sûreté',
        'Autre'
    ];

    const contributingFactorsOptions = [
        'Comportement à risque',
        'Conditions environnementales',
        'Défaillance d\'équipement',
        'Formation insuffisante',
        'Communication défaillante',
        'Pression temporelle',
        'Procédures inadéquates',
        'Manque de supervision',
        'Problème d\'EPI',
        'Conception du poste de travail'
    ];

    const requirementOptions = [
        'Norme ISO 45001',
        'Politique sécurité interne',
        'Procédure environnementale',
        'Système de management qualité',
        'Exigence légale / réglementaire',
        'Norme sectorielle',
        'Exigence de formation',
        'Procédure de maintenance',
        'Plan d\'urgence',
        'Analyse de risque (HIRA)'
    ];

    const detectionSources = [
        'Audit interne',
        'Revue de direction',
        'Réclamation client',
        'Audit fournisseur',
        'Inspection réglementaire',
        'Auto-évaluation',
        'Investigation d\'incident',
        'Inspection de routine',
        'Signalement d\'employé',
        'Audit externe'
    ];

    const getSelectedDescriptions = () => {
        return natureOptions.filter(option => form.values.nonConformity.events?.includes(option.value));
    };





    const isNearMiss = form.values.nonConformity.type === 'NEAR_MISS';
    const accentColor = isNearMiss ? 'orange' : 'red';

    return (
        <div className="space-y-4">
            {/* Section 1 — Informations générales */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className={`px-4 py-2.5 ${isNearMiss ? 'bg-orange-50/60 border-orange-200/70' : 'bg-red-50/60 border-red-200/70'} border-b flex items-center gap-2`}>
                    <div className={`p-1 rounded ${isNearMiss ? 'bg-orange-100' : 'bg-red-100'}`}>
                        <IconClipboardList size={14} className={isNearMiss ? 'text-orange-700' : 'text-red-700'} />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Informations générales
                    </h2>
                </header>
                <div className="p-4 space-y-3">
                    <Select
                        size="sm"
                        disabled={edit}
                        label="Type d'événement"
                        placeholder="Sélectionner le type"
                        {...form.getInputProps('nonConformity.type')}
                        data={eventTypes}
                        withAsterisk
                        description="Non-conformité ou quasi-accident"
                    />

                    <TextInput
                        size="sm"
                        label="Titre"
                        placeholder={`Titre court de ${eventTypesMap[form.values.nonConformity.type] || "l'événement"}`}
                        {...form.getInputProps('nonConformity.title')}
                        withAsterisk
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <DateInput
                            size="sm"
                            label="Date de l'événement"
                            placeholder="Sélectionner la date"
                            maxDate={form.values.nonConformity.detectionDate}
                            {...form.getInputProps('nonConformity.date')}
                            withAsterisk
                        />
                        <DateInput
                            size="sm"
                            label="Date de détection"
                            placeholder="Sélectionner la date"
                            withAsterisk
                            {...form.getInputProps('nonConformity.detectionDate')}
                            minDate={form.values.nonConformity.date}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select
                            size="sm"
                            label="Déclarant"
                            placeholder="Personne qui rapporte"
                            {...form.getInputProps('nonConformity.reportedBy')}
                            leftSection={<IconUser size={14} className="text-slate-400" />}
                            data={employees}
                            searchable
                            withAsterisk
                        />
                        <Select
                            size="sm"
                            label="Processus de travail"
                            placeholder="Sélectionner le processus"
                            withAsterisk
                            {...form.getInputProps('nonConformity.workProcessId')}
                            data={workProcesses}
                            leftSection={<IconTool size={14} className="text-slate-400" />}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select
                            size="sm"
                            label="Lieu"
                            placeholder="Sélectionner le lieu"
                            {...form.getInputProps('nonConformity.locationId')}
                            data={locations}
                            withAsterisk
                        />
                        <Select
                            size="sm"
                            label="Catégorie"
                            placeholder="Sélectionner la catégorie"
                            {...form.getInputProps('nonConformity.categoryId')}
                            data={categories}
                            withAsterisk
                        />
                    </div>

                    <div>
                        <TextEditor form={form} id="nonConformity.description" title="Description" withAsterisk />
                    </div>

                    <div>
                        <FileUpdateDropzone form={form} id="nonConformity.evidence" />
                    </div>
                </div>
            </section>

            {/* Section 2 — Spécifique Non-conformité */}
            {form.values.nonConformity.type === 'NON_CONFORMITY' && (
                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-red-50/60 border-b border-red-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-red-100">
                            <IconAlertTriangle size={14} className="text-red-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Spécifique non-conformité
                        </h2>
                        <span className="text-[10px] text-slate-500 ml-auto">Exigence · Détection · Gravité</span>
                    </header>
                    <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select
                                size="sm"
                                label="Exigence non respectée"
                                placeholder="Sélectionner"
                                {...form.getInputProps('nonConformity.requirement')}
                                data={requirementOptions.map(req => ({ value: req, label: req }))}
                                withAsterisk
                            />
                            <Select
                                size="sm"
                                label="Source de détection"
                                placeholder="Sélectionner"
                                {...form.getInputProps('nonConformity.detectionSource')}
                                data={detectionSources.map(source => ({ value: source, label: source }))}
                                withAsterisk
                            />
                            <Select
                                size="sm"
                                label="Gravité"
                                placeholder="Sélectionner"
                                {...form.getInputProps('nonConformity.severityLevel')}
                                data={[
                                    { value: 'Minor', label: 'Mineure' },
                                    { value: 'Major', label: 'Majeure' },
                                    { value: 'Critical', label: 'Critique' }
                                ]}
                                withAsterisk
                            />
                        </div>
                        <TextEditor form={form} id="nonConformity.actionTaken" title="Action immédiate prise" withAsterisk />
                    </div>
                </section>
            )}

            {/* Section 3 — Spécifique Quasi-accident */}
            {form.values.nonConformity.type === 'NEAR_MISS' && (
                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-orange-50/60 border-b border-orange-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-orange-100">
                            <IconAlertTriangle size={14} className="text-orange-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Spécifique quasi-accident
                        </h2>
                        <span className="text-[10px] text-slate-500 ml-auto">Type · Facteurs · Préventives</span>
                    </header>
                    <div className="p-4 space-y-3">
                        <Select
                            size="sm"
                            label="Type de quasi-accident"
                            placeholder="Sélectionner le type"
                            {...form.getInputProps('nonConformity.nearMissType')}
                            data={nearMissTypes.map(type => ({ value: type, label: type }))}
                            withAsterisk
                        />
                        <MultiSelect
                            size="sm"
                            label="Facteurs contributifs"
                            placeholder="Sélectionner les facteurs"
                            data={contributingFactorsOptions.map(factor => ({ value: factor, label: factor }))}
                            {...form.getInputProps('nonConformity.factors')}
                            withAsterisk
                            searchable
                            clearable
                            description="Sélectionner tous les facteurs ayant contribué"
                        />
                        <TextEditor
                            form={form}
                            id="nonConformity.preventiveAction"
                            title="Action corrective ou préventive immédiate"
                            withAsterisk
                        />
                        <TextEditor
                            form={form}
                            withAsterisk
                            title="Opportunité d'amélioration"
                            id="nonConformity.improvement"
                        />
                    </div>
                </section>
            )}

            {/* Section 4 — Classification de la nature */}
            {form.values.nonConformity.type && (
                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-blue-100">
                            <IconCategoryPlus size={14} className="text-blue-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Classification de la nature
                        </h2>
                        <span className="text-[10px] text-slate-500 ml-auto">Selon ISO 45001</span>
                    </header>
                    <div className="p-4 space-y-3">
                        <MultiSelect
                            size="sm"
                            label="Nature de l'événement"
                            placeholder="Sélectionner la (ou les) nature(s)"
                            data={natureOptions}
                            {...form.getInputProps('nonConformity.events')}
                            withAsterisk
                            searchable
                            clearable
                            description="Plusieurs natures peuvent être sélectionnées"
                        />

                        {form.values.nonConformity.events.length > 0 && (
                            <div className={`rounded-md border p-3 ${accentColor === 'red'
                                ? 'bg-red-50/60 border-red-200'
                                : 'bg-orange-50/60 border-orange-200'
                                }`}>
                                <div className="flex items-center gap-1.5 mb-2.5">
                                    <IconBookmark size={12} className={accentColor === 'red' ? 'text-red-700' : 'text-orange-700'} />
                                    <span className={`text-[11px] uppercase tracking-wider ${accentColor === 'red' ? 'text-red-800' : 'text-orange-800'}`}>
                                        Descriptions des natures sélectionnées
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {getSelectedDescriptions().map((nature, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <Badge
                                                size="xs"
                                                radius="sm"
                                                className={`mt-0.5 flex-shrink-0 ${accentColor === 'red'
                                                    ? '!bg-red-100 !text-red-700'
                                                    : '!bg-orange-100 !text-orange-700'
                                                    }`}
                                            >
                                                {nature.label}
                                            </Badge>
                                            <Text size="xs" className={`leading-relaxed ${accentColor === 'red' ? '!text-red-700' : '!text-orange-700'}`}>
                                                {nature.description}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default DeclarationStep;