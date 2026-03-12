
import {
    Box, Title, Grid, Card, TextInput, Textarea, NumberInput, Group, Button, Select, Stack, Badge,
    Text,
    Breadcrumbs
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { createPPE, getActivePPE } from '../../services/PPEService';
import { useEffect, useState } from 'react';

const PPECreateForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [ppe, setPpe] = useState<any>([]);
    const form = useForm({
        initialValues: {
            name: '',
            category: '',
            description: '',
            minStock: 5,
            certificationStandard: undefined
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
            },
            category: (value) => (value?.trim().length > 0 ? null : 'Category is Required'),
            minStock: (value) => (value ? null : 'Min Stock is Required'),
            // certificationStandard: (value) => (value?.trim().length > 0 ? null : ' Certification is Required'),

        }
    });

    useEffect(() => {
        getActivePPE().then((res) => {
            setPpe(res);

        }).catch((_err) => {

        }).finally(() => {
        });
    }, []);


    const handleSubmit = () => {
        dispatch(showOverlay());
        createPPE(form.values).then((_res) => {
            successNotification("Requirement created successfully");
            navigate("/ppe-management");

        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        }
        );
    }





    return (
        <div className='flex flex-col gap-5'>

            <div>
                <div className="font-semibold text-2xl text-blue-500 w-fit">Create New PPE</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/ppe-management">
                        <Text variant="gradient">PPE Dashboard</Text>
                    </Link>
                    <Text variant="gradient">Create New PPE</Text>
                </Breadcrumbs>
            </div>


            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={3} mb="md">PPE Information</Title>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Grid>
                                <Grid.Col span={12}>
                                    <TextInput
                                        label="PPE Name "
                                        placeholder="Ex: Safety Helmet"
                                        withAsterisk
                                        required
                                        {...form.getInputProps('name')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Select
                                        label="Category "
                                        placeholder="Select a category"
                                        data={[
                                            'Head protection',
                                            'Eye protection',
                                            'Hand protection',
                                            'Foot protection',
                                            'Respiratory protection',
                                            'Protective clothing',
                                            'Hearing protection',
                                            'Fall protection'
                                        ]}
                                        required
                                        {...form.getInputProps('category')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Textarea
                                        label="Description "
                                        placeholder="Detailed description of the PPE..."
                                        rows={4}
                                        required
                                        {...form.getInputProps('description')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Minimum Stock "
                                        placeholder="5"
                                        min={1}
                                        required
                                        {...form.getInputProps('minStock')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Certification Standard (Optional)"
                                        placeholder="Ex: EN 397"
                                        {...form.getInputProps('certificationStandard')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Group justify="flex-end" mt="md">
                                        <Button variant="outline">
                                            Cancel
                                        </Button>
                                        <Button type="submit" leftSection={<IconDeviceFloppy size={16} />}>
                                            Create PPE
                                        </Button>
                                    </Group>
                                </Grid.Col>
                            </Grid>
                        </form>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Existing PPE List</Title>
                        <Stack gap="md">
                            {ppe.slice(0, 5).map((epp: any) => (
                                <Box key={epp.id} p="sm" style={{ border: '1px solid #e9ecef', borderRadius: '8px' }}>
                                    <Group justify="space-between" mb="xs">
                                        <Text size="xs" fw={500} lineClamp={1}>{epp.name}</Text>
                                    </Group>
                                    <Badge variant="light" color="blue" size="xs" mb="xs">
                                        {epp.category}
                                    </Badge>
                                    <Text size="xs" c="dimmed" lineClamp={2} mb="xs">
                                        {epp.description}
                                    </Text>
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" c="dimmed">Stock: {epp.quantity}</Text>
                                        <Text size="xs" c="dimmed">Min: {epp.minStock}</Text>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </div>
    );
};

export default PPECreateForm;
