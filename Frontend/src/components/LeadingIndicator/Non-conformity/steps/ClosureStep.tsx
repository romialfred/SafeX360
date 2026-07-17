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
                            <Text size="lg" className="text-orange-800">
                                Leçons apprises
                            </Text>
                            <Text size="sm" className="text-orange-600">
                                Documentez les leçons apprises de cet événement {eventTypesMap[form.values.nonConformity.type]?.toLowerCase() || ''}
                            </Text>
                        </div>
                    </Group>
                    <Grid>
                        <Grid.Col span={12}>
                            <TextEditor form={form} id="nonConformity.lessonLearned" title="Leçons apprises" />
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
                        <Text size="lg" className="text-slate-800">
                            Clôture {eventTypesMap[form.values.nonConformity.type]?.toLowerCase() || ''}
                        </Text>
                        <Text size="sm" className="text-slate-600">
                            Clôture finale et validation du dossier
                        </Text>
                    </div>
                </Group>
                {/* Aucun astérisque sur cette étape : les étapes 2 à 4 sont
                    OPTIONNELLES (cf. règles de validation de NonConformityForm —
                    seule l'étape 1 « Déclaration » est obligatoire). Marquer ces
                    champs comme requis était un engagement que rien ne tenait :
                    la soumission passait sans eux. Obligatoire ⇒ réellement exigé. */}
                <Grid>
                    <Grid.Col span={6}>
                        <DateInput
                            size="sm"
                            label="Date de clôture"
                            {...form.getInputProps('nonConformity.closingDate')}
                            placeholder="Sélectionner la date"
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Statut final"
                            {...form.getInputProps('nonConformity.finalStatus')}
                            placeholder="Sélectionner le statut final"
                            data={[{ value: 'Clôturé', label: 'Clôturé' }, { value: 'Rejeté', label: 'Rejeté' }, { value: 'Annulé', label: 'Annulé' }, { value: 'En attente', label: 'En attente' }, { value: 'Reporté', label: 'Reporté' }]}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Validé par"
                            {...form.getInputProps('nonConformity.validator')}
                            placeholder="Sélectionner le validateur"
                            data={employees}
                            searchable
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <DateInput
                            size="sm"
                            label="Date de validation"
                            {...form.getInputProps('nonConformity.validationDate')}
                            placeholder="Sélectionner la date"
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <TextEditor form={form} id="nonConformity.validationComment" title="Commentaires de clôture" />
                    </Grid.Col>
                </Grid>
            </Card>

            <Card shadow="sm" padding="md">
                <Text size="lg" className="mb-4">
                    Évaluation de l'efficacité
                </Text>
                <Grid>
                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Efficacité du traitement"
                            placeholder="Sélectionner le niveau d'efficacité"
                            data={[{ value: 'Très efficace', label: 'Très efficace' }, { value: 'Efficace', label: 'Efficace' }, { value: 'Peu efficace', label: 'Peu efficace' }, { value: 'Inefficace', label: 'Inefficace' }]}
                            {...form.getInputProps('nonConformity.effectiveness')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        {/* Score ENTIER : `rating` est un Integer côté back
                            (NonConformityDTO / NonConformity). Avec step={0.1},
                            un 7,5 saisi était tronqué à 7 en silence
                            (ACCEPT_FLOAT_AS_INT) : l'évaluation d'efficacité
                            §10.2 était falsifiée à la baisse sans que
                            l'utilisateur en soit averti. Le libellé « /10 »
                            appelant de toute façon une note entière, on aligne
                            l'IHM sur le contrat serveur plutôt que de migrer la
                            colonne. */}
                        <NumberInput
                            size="sm"
                            label="Score d'efficacité (/10)"
                            placeholder="0"
                            min={0}
                            max={10}
                            step={1}
                            allowDecimal={false}
                            {...form.getInputProps('nonConformity.rating')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Select
                            size="sm"
                            label="Risque de récurrence"
                            placeholder="Sélectionner le niveau de risque"
                            data={[{ value: 'Très faible', label: 'Très faible' }, { value: 'Faible', label: 'Faible' }, { value: 'Moyen', label: 'Moyen' }, { value: 'Élevé', label: 'Élevé' }, { value: 'Très élevé', label: 'Très élevé' }]}
                            {...form.getInputProps('nonConformity.risk')}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <DateInput
                            size="sm"
                            label="Prochaine vérification"
                            placeholder="Date de suivi"
                            {...form.getInputProps('nonConformity.nextCheck')}
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <TextEditor form={form} id="nonConformity.feedback" title="Retour d'expérience" />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* <Card shadow="sm" padding="md">
                <Text size="lg" className="mb-4">
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