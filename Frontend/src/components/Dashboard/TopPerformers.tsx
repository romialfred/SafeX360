import { Alert, Card, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

/**
 * Emplacement conservé pour compatibilité avec l'ancien tableau de bord.
 * Aucun classement n'est inventé : les résultats seront affichés uniquement
 * lorsqu'une source, une période et un propriétaire de donnée seront fournis.
 */
const TopPerformers = () => (
    <Card shadow="sm" p="lg" radius="md" withBorder>
        <Text component="h2" size="lg" fw={600}>
            Résultats d’équipe
        </Text>
        <Text size="sm" c="dimmed" mt={2} mb="md">
            Indicateurs validés par période
        </Text>
        <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light" title="Aucune donnée validée">
            Aucun classement n’est publié tant que la source, le périmètre, la période de mesure et le responsable de
            validation ne sont pas renseignés.
        </Alert>
    </Card>
);

export default TopPerformers;
