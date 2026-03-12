import { Box, Breadcrumbs, Card, Grid, Group, Text } from "@mantine/core";
import { riskData } from "../../../Data/dummyData/riskData";
import { Link, useParams } from "react-router-dom";

const RegisterDetails = () => {
    const { id } = useParams(); // string aayega
    const selectedRisk = riskData.find((risk) => String(risk.id) === id);

    const formatZone = (zone?: string) => {
        if (!zone) return ""; // or "Unknown"
        const parts = zone.split(" - ");
        if (parts.length === 2) {
            const letter = parts[0];
            const description =
                parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
            return `${letter} - ${description}`;
        }
        return zone;
    };



    return (
        <Box p="xl">
            <div>
                <div className="font-semibold text-2xl text-blue-500 w-fit">Regsiter Details</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/risks-register">
                        <Text variant="gradient">Risk Catalog & Tracking</Text>
                    </Link>
                    <Text variant="gradient">Regsiter Details</Text>
                </Breadcrumbs>
            </div>
            <div className="border border-gray-300 shadow-sm p-4 rounded-xl bg-white">
                <Group justify="space-between" mb="xl">
                    <Box>

                        <p className="text-2xl font-medium text-primary">{selectedRisk?.id} - {selectedRisk?.title}</p>
                    </Box>
                </Group>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <p className="text-xl font-bold text-gray-600 mb-4">Risk Details</p>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Title:</Text>
                            <Text size="sm" fw={500} mb="md">{selectedRisk?.title}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Zone:</Text>
                            <Text size="sm" mb="md">
                                {selectedRisk?.zone ? formatZone(selectedRisk.zone) : ""}
                            </Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Department:</Text>
                            <Text size="sm" mb="md">{selectedRisk?.department}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Risk Level:</Text>
                            <Text size="sm" mb="md">{selectedRisk?.riskLevel}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Status:</Text>
                            <Text size="sm" mb="md">{selectedRisk?.status}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">Owner:</Text>
                            <Text size="sm" mb="md">{selectedRisk?.owner}</Text>
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Text size="sm" c="dimmed">Description:</Text>
                            <Text size="sm">{selectedRisk?.riskDescription}</Text>
                        </Grid.Col>
                    </Grid>
                </Card>
            </div>

        </Box>
    )
}

export default RegisterDetails