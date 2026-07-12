import React, { useState } from 'react';
import {
    Grid,
    TextInput,
    Select,
    Textarea,
    Group,
    Text,
    Card,
    Button,
    ActionIcon,
    Badge
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconUsers, IconPlus, IconCalendar, IconTarget, IconSearch } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';

const AnalysisStep = ({ form, employees, empMap }: any) => {
    // La méthode d'analyse est pilotée par le form (analysis.method) : l'ancien
    // état local n'était jamais mis à jour (setter inutilisé) → le switch restait
    // bloqué sur ICAM et la méthode choisie n'était jamais soumise.
    const selectedMethod = form.values?.analysis?.method || 'ICAM';
    const [employee, setEmployee] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);


    const handleAddMember = () => {
        if (employee && role) {
            form.setFieldValue('analysis.team', (prev: any) => [...prev, { id: employee, role }]);
            setEmployee(null);
            setRole(null);
        }
    };

    const handleDelete = (index: number) => {
        form.setFieldValue('analysis.team', (prev: any) => prev.filter((_: any, i: number) => i !== index));
    };

    const methodDescriptions = {
        '5 Pourquoi': 'Technique simple qui consiste à poser 5 fois la question "Pourquoi ?" pour identifier la cause racine d\'un problème.',
        'Ishikawa': 'Diagramme en arête de poisson qui analyse les causes selon 6 catégories : Main d\'œuvre, Matière, Machine, Méthode, Milieu, Mesure.',
        'ICAM': 'Méthode structurée d\'analyse des incidents qui examine les facteurs organisationnels, individuels et techniques pour identifier les causes profondes.',
        'AMDEC': 'Analyse systématique des modes de défaillance potentiels et de leur criticité basée sur Gravité × Occurrence × Détection.',
        'Arbre des causes': 'Méthode d\'analyse logique qui remonte des faits observés vers les causes profondes de manière structurée.',
        'Brainstorming': 'Technique de créativité en groupe pour générer un maximum d\'idées sur les causes possibles sans jugement initial.',
        'Autre': 'Utilisation d\'une méthode d\'analyse personnalisée ou spécifique au contexte de l\'organisation.'
    };


    const renderMethodSpecificFields = () => {
        switch (selectedMethod) {
            case '5 Pourquoi':
                return (
                    <div className="space-y-4">
                        <Text size="md" className="text-slate-700">
                            Méthode des 5 Pourquoi
                        </Text>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div key={num}>
                                <Text size="sm" className="mb-1 text-slate-700">
                                    Pourquoi {num} ?
                                </Text>
                                <Textarea
                                    placeholder={`Réponse au pourquoi ${num}`}
                                    minRows={2}
                                    {...form.getInputProps(`analysis.methodData.why${num}`)}
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'Ishikawa':
                return (
                    <div className="space-y-4">
                        <Text size="md" className="text-slate-700">
                            Diagramme d'Ishikawa (Causes et Effets)
                        </Text>
                        <Grid>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Main d'œuvre (Personnel)"
                                    placeholder="Causes liées au personnel"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.ishikawaPersonnel')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Matière (Matériaux)"
                                    placeholder="Causes liées aux matériaux"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.ishikawaMatiere')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Machine (Équipement)"
                                    placeholder="Causes liées aux équipements"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.ishikawaMachine')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Méthode (Procédures)"
                                    placeholder="Causes liées aux méthodes"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.ishikawaMethode')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Milieu (Environnement)"
                                    placeholder="Causes liées à l'environnement"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.ishikawaMilieu')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Mesure (Contrôle)"
                                    placeholder="Causes liées aux mesures/contrôles"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.ishikawaMesure')}
                                />
                            </Grid.Col>
                        </Grid>
                    </div>
                );

            case 'ICAM':
                return (
                    <div className="space-y-4">
                        <Text size="md" mb={2} className="text-slate-700">
                            Analyse ICAM (Incident Cause Analysis Method)
                        </Text>
                        <Grid>
                            <Grid.Col span={12}>
                                <Textarea
                                    size="sm"
                                    label="Description"
                                    placeholder="Description factuelle de l'événement"
                                    {...form.getInputProps('analysis.description')}
                                    minRows={2}
                                    withAsterisk
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    size="sm"
                                    label="Facteurs individuels"
                                    placeholder="Facteurs liés aux personnes (compétences, formation, fatigue...)"
                                    {...form.getInputProps('analysis.individualFactors')}
                                    minRows={3}
                                    withAsterisk
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    size="sm"
                                    label="Facteurs techniques"
                                    placeholder="Facteurs liés aux équipements, outils, environnement physique"
                                    {...form.getInputProps('analysis.technicalFactors')}
                                    minRows={3}
                                    withAsterisk
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    size="sm"
                                    label="Facteurs organisationnels"
                                    placeholder="Procédures, management, culture sécurité, communication..."
                                    {...form.getInputProps('analysis.organizationalFactors')}
                                    minRows={3}
                                    withAsterisk
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    size="sm"
                                    label="Causes profondes identifiées"
                                    placeholder="Synthèse des causes profondes selon l'analyse ICAM"
                                    {...form.getInputProps('analysis.rootCauses')}
                                    minRows={3}
                                    withAsterisk
                                />
                            </Grid.Col>
                        </Grid>
                    </div>
                );
            case 'AMDEC':
                return (
                    <div className="space-y-4">
                        <Text size="md" className="text-slate-700">
                            Analyse AMDEC (Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité)
                        </Text>
                        <Grid>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Mode de défaillance"
                                    placeholder="Description du mode de défaillance"
                                    minRows={2}
                                    {...form.getInputProps('analysis.methodData.amdecMode')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Effets de la défaillance"
                                    placeholder="Conséquences de la défaillance"
                                    minRows={2}
                                    {...form.getInputProps('analysis.methodData.amdecEffets')}
                                />
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Select
                                    label="Gravité (G)"
                                    placeholder="1-10"
                                    data={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                                    {...form.getInputProps('analysis.methodData.amdecGravite')}
                                />
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Select
                                    label="Occurrence (O)"
                                    placeholder="1-10"
                                    data={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                                    {...form.getInputProps('analysis.methodData.amdecOccurrence')}
                                />
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Select
                                    label="Détection (D)"
                                    placeholder="1-10"
                                    data={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                                    {...form.getInputProps('analysis.methodData.amdecDetection')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <TextInput
                                    label="Criticité (G × O × D)"
                                    placeholder="Calcul automatique"
                                    readOnly
                                    value={String(
                                        (Number(form.values?.analysis?.methodData?.amdecGravite) || 0) *
                                        (Number(form.values?.analysis?.methodData?.amdecOccurrence) || 0) *
                                        (Number(form.values?.analysis?.methodData?.amdecDetection) || 0) || ''
                                    )}
                                />
                            </Grid.Col>
                        </Grid>
                    </div>
                );

            case 'Arbre des causes':
                return (
                    <div className="space-y-4">
                        <Text size="md" className="text-slate-700">
                            Arbre des Causes
                        </Text>
                        <Grid>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Événement indésirable"
                                    placeholder="Description de l'événement à analyser"
                                    minRows={2}
                                    {...form.getInputProps('analysis.methodData.arbreEvenement')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Causes immédiates"
                                    placeholder="Causes directes de l'événement"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.arbreImmediate')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Textarea
                                    label="Causes sous-jacentes"
                                    placeholder="Causes profondes"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.arbreSousJacentes')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Causes racines"
                                    placeholder="Causes fondamentales à traiter"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.arbreRacines')}
                                />
                            </Grid.Col>
                        </Grid>
                    </div>
                );

            case 'Brainstorming':
                return (
                    <div className="space-y-4">
                        <Text size="md" className="text-slate-700">
                            Brainstorming
                        </Text>
                        <Grid>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Idées générées"
                                    placeholder="Toutes les idées et causes potentielles identifiées"
                                    minRows={5}
                                    {...form.getInputProps('analysis.methodData.brainstormGenerees')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Idées retenues"
                                    placeholder="Idées sélectionnées après tri et priorisation"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.brainstormRetenues')}
                                />
                            </Grid.Col>
                        </Grid>
                    </div>
                );

            case 'Autre':
                return (
                    <div className="space-y-4">
                        <Grid>
                            <Grid.Col span={12}>
                                <TextInput
                                    label="Nom de la méthode"
                                    placeholder="Spécifier la méthode utilisée"
                                    {...form.getInputProps('analysis.methodData.autreNom')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Description de la méthode"
                                    placeholder="Décrire la méthode d'analyse utilisée"
                                    minRows={3}
                                    {...form.getInputProps('analysis.methodData.autreDescription')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Résultats de l'analyse"
                                    placeholder="Résultats obtenus avec cette méthode"
                                    minRows={4}
                                    {...form.getInputProps('analysis.methodData.autreResultats')}
                                />
                            </Grid.Col>
                        </Grid>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <Text size="sm" className="text-slate-500">
                            Sélectionnez une méthode d'analyse pour afficher les champs correspondants
                        </Text>
                    </div>
                );
        }
    };
    return (
        <div className="space-y-6">
            {/* Équipe d'analyse - First Section */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 !flex !flex-col !gap-2">
                <Group className="mb-2">
                    <div className="p-2 rounded-lg bg-green-50">
                        <IconUsers size={20} className="text-green-500" />
                    </div>
                    <div>
                        <Text size="lg" className="text-slate-800">
                            Équipe d'analyse
                        </Text>

                    </div>
                </Group>

                <div className="flex flex-col gap-2">
                    <Text size="md" className="text-slate-700">
                        Ajouter un membre
                    </Text>

                    <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4">
                            <Select
                                size="sm"
                                placeholder="Sélectionner l'employé"
                                value={employee}
                                onChange={setEmployee}
                                searchable
                                data={employees.filter((emp: any) =>
                                    !form.values.analysis.team.some((m: any) => m.id == emp.value)
                                )}
                                classNames={{ input: 'border-slate-300 focus:border-green-500' }}
                            />
                        </div>

                        <div className="col-span-4">
                            <Select
                                size="sm"
                                placeholder="Sélectionner le rôle"
                                value={role}
                                onChange={setRole}
                                data={[
                                    "Chef d'équipe",
                                    'Analyste principal',
                                    'Expert technique',
                                    'Témoin',
                                    'Support',
                                ].map((r) => ({ value: r, label: r }))}
                                classNames={{ input: 'border-slate-300 focus:border-green-500' }}
                            />
                        </div>

                        <div className="col-span-4">
                            <Button
                                size="sm"
                                color="green"
                                onClick={handleAddMember}
                                disabled={!employee || !role}
                                leftSection={<IconPlus size={14} />}
                            >
                                Ajouter
                            </Button>
                        </div>
                    </div>

                    {/* Team Members List */}
                    <div className="space-y-2 mt-4">
                        {form.values.analysis.team.map((member: any, index: any) => (
                            <Card key={index} className="bg-slate-50 border border-slate-200 p-3">
                                <Group justify="space-between">
                                    <Group>
                                        <Badge variant="light" className="bg-green-100 text-green-700">
                                            {member.role}
                                        </Badge>
                                        <Text size="sm" className="text-slate-700">{empMap[member.id]?.name}</Text>
                                    </Group>
                                    <Text size='sm'>
                                        Département : {empMap[member.id]?.department}
                                    </Text>
                                    <ActionIcon
                                        variant="light"
                                        color="red"
                                        size="sm"
                                        onClick={() => handleDelete(index)}
                                        aria-label="Retirer le membre de l'équipe"
                                    >
                                        <IconPlus size={14} style={{ transform: 'rotate(45deg)' }} />
                                    </ActionIcon>
                                </Group>
                            </Card>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Dates d'analyse et échéance - Second Section */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                <Group className="mb-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <IconCalendar size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <Text size="lg" className="text-slate-800">
                            Calendrier de l'analyse
                        </Text>
                    </div>
                </Group>

                <Grid>
                    <Grid.Col span={4}>
                        <DateInput
                            size="sm"
                            label="Date de début"
                            placeholder="Sélectionner la date"
                            withAsterisk
                            {...form.getInputProps('analysis.startDate')}
                            leftSection={<IconCalendar size={14} className="text-slate-400" />}
                        />
                    </Grid.Col>

                    <Grid.Col span={4}>
                        <DateInput
                            size="sm"
                            label="Échéance"
                            placeholder="Sélectionner la date"
                            withAsterisk
                            {...form.getInputProps('analysis.deadline')}
                            leftSection={<IconCalendar size={14} className="text-slate-400" />}
                        />
                    </Grid.Col>

                    <Grid.Col span={4}>
                        <Select
                            size="sm"
                            label="Priorité"
                            placeholder="Sélectionner la priorité"
                            data={[
                                { value: 'Urgente', label: 'Urgente' },
                                { value: 'Élevée', label: 'Élevée' },
                                { value: 'Normale', label: 'Normale' },
                                { value: 'Faible', label: 'Faible' }
                            ]}
                            {...form.getInputProps('analysis.priority')}
                            withAsterisk
                        />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Status et gravité - Third Section */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                <Group className="mb-3">
                    <div className="p-2 rounded-lg bg-orange-50">
                        <IconTarget size={20} className="text-orange-500" />
                    </div>
                    <div>
                        <Text size="lg" className="text-slate-800">
                            Statut et gravité
                        </Text>
                    </div>
                </Group>

                <Grid>
                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Niveau de gravité"
                            placeholder="Sélectionner la gravité"
                            data={[
                                { value: 'Insignifiante', label: 'Insignifiante' },
                                { value: 'Mineure', label: 'Mineure' },
                                { value: 'Modérée', label: 'Modérée' },
                                { value: 'Majeure', label: 'Majeure' },
                                { value: 'Catastrophique', label: 'Catastrophique' }
                            ]}
                            withAsterisk
                            {...form.getInputProps('analysis.severityLevel')}
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Statut de traitement"
                            placeholder="Sélectionner le statut"
                            data={[
                                { value: 'En attente', label: 'En attente' },
                                { value: 'En cours', label: 'En cours' },
                                { value: 'Terminé', label: 'Terminé' },
                                { value: 'Suspendu', label: 'Suspendu' },
                                { value: 'Annulé', label: 'Annulé' }
                            ]}
                            withAsterisk
                            {...form.getInputProps('analysis.status')}
                        />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Analyse de l'analyse - Fourth Section */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                <Group className="mb-3">
                    <div className="p-2 rounded-lg bg-yellow-50">
                        <IconSearch size={20} className="text-yellow-600" />
                    </div>
                    <div>
                        <Text size="lg" className="text-slate-800">
                            Analyse causale
                        </Text>
                    </div>
                </Group>

                <Grid>
                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Méthode d'analyse"
                            placeholder="Sélectionner la méthode"
                            data={[
                                { value: '5 Pourquoi', label: '5 Pourquoi' },
                                { value: 'Ishikawa', label: 'Diagramme d\'Ishikawa' },
                                { value: 'ICAM', label: 'ICAM (Incident Cause Analysis)' },
                                { value: 'AMDEC', label: 'AMDEC' },
                                { value: 'Arbre des causes', label: 'Arbre des causes' },
                                { value: 'Brainstorming', label: 'Brainstorming' },
                                { value: 'Autre', label: 'Autre méthode' }
                            ]}
                            withAsterisk
                            {...form.getInputProps('analysis.method')}
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Origine de la cause"
                            placeholder="Sélectionner l'origine"
                            withAsterisk
                            data={[
                                { value: 'Interne', label: 'Interne' },
                                { value: 'Prestataire externe', label: 'Prestataire externe' },
                                { value: 'Client', label: 'Client' },
                                { value: 'Fournisseur', label: 'Fournisseur' },
                                { value: 'Environnement', label: 'Environnement' }
                            ]}
                            {...form.getInputProps('analysis.origin')}
                        />
                    </Grid.Col>

                    {selectedMethod && (
                        <Grid.Col span={12}>
                            <Text size="xs" className="text-slate-500 italic leading-relaxed">
                                {methodDescriptions[selectedMethod as keyof typeof methodDescriptions]}
                            </Text>
                        </Grid.Col>
                    )}

                    <Grid.Col span={12}>
                        <Card className="bg-slate-50 border border-slate-200 p-4">
                            {renderMethodSpecificFields()}
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-4">
                            <Group className="mb-3">
                                <div className="p-2 rounded-lg bg-yellow-100">
                                    <IconTarget size={18} className="text-yellow-600" />
                                </div>
                                <div>
                                    <Text size="md" className="text-yellow-800">
                                        Synthèse des causes identifiées
                                    </Text>
                                    <Text size="xs" className="text-yellow-600">
                                        Résumé structuré des principales causes racines mises en évidence par l'analyse
                                    </Text>
                                </div>
                            </Group>
                            <TextEditor
                                form={form}
                                id="analysis.summary"

                            />
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 p-4">
                            <Group className="mb-3">
                                <div className="p-2 rounded-lg bg-emerald-100">
                                    <IconSearch size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <Text size="md" className="text-emerald-800">
                                        Conclusions de l'analyse
                                    </Text>
                                    <Text size="xs" className="text-emerald-600">
                                        Synthèse finale avec recommandations d'action et mesures préventives
                                    </Text>
                                </div>
                            </Group>
                            <TextEditor
                                form={form}
                                id="analysis.conclusion"
                            />
                        </Card>
                    </Grid.Col>
                </Grid>
            </Card>
        </div>
    );
};

export default AnalysisStep;