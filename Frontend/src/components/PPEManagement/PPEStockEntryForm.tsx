
import { useEffect, useState } from 'react';
import {
    Box, Title, Grid, Card, Text, Group, Badge, Select, NumberInput, TextInput, Button, Stack, Progress,
    Breadcrumbs
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconPlus } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { createPPEStock } from '../../services/PPEStockService';
import { getActivePPE } from '../../services/PPEService';
import { mapIdToName } from '../../utility/OtherUtilities';

const PPEStockEntryForm = () => {
    const [ppe, setPpe] = useState<any>([]);
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});

    const dispatch = useDispatch()
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            ppeId: undefined as string | undefined,
            quantity: 1,
            unitPrice: 0,
            supplier: undefined,
            brand: undefined,
            model: undefined,
            size: undefined,
            expiryDate: null as Date | null,
        },
        validate: {

            ppeId: (value) => (value ? null : 'PPE Id is Required'),
            quantity: (value) => (value ? null : ' Quantity is Required'),
            unitPrice: (value) => value && value > 0 ? null : "Unit Price is required",
            // supplier: (value) => (value ? null : ' Supplier is Required'),
            // brand: (value) => (value ? null : 'Brand is Required'),
            // model: (value) => (value ? null : 'Model is Required'),
            // size: (value) => (value ? null : ' Size is Required'),
            // expiryDate: (value) => (value ? null : 'Expiry Date is Required'),
        }

    });

    useEffect(() => {
        getActivePPE().then((res) => {
            setPpe(res);
            setPpeMap(mapIdToName(res));
        }).catch((_err) => {

        }).finally(() => {
        });
    }, []);



    const handleSubmit = (values: any) => {
        dispatch(showOverlay());
        createPPEStock(values).then((_res) => {
            successNotification("Requirement created successfully");
            navigate("/ppe-management");
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }).finally(() => {
            dispatch(hideOverlay());
        });
    }

    const selectedPpe = ppeMap[form.values.ppeId ?? ''];

    return (
        <Box className='flex flex-col gap-5'>
            <div>
                <div className="text-2xl text-blue-500 w-fit">Stock Entry</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/ppe-management">
                        <Text variant="gradient">PPE Dashboard</Text>
                    </Link>
                    <Text variant="gradient">Stock Entry</Text>
                </Breadcrumbs>
            </div>


            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Grid>
                                <Grid.Col span={12}>
                                    <Select
                                        {...form.getInputProps('ppeId')}
                                        label="PPE Name"
                                        placeholder="Select PPE to add stock"
                                        data={ppe.map((epp: any) => ({
                                            value: epp.id.toString(),
                                            label: `${epp.name} - ${epp.category}`
                                        }))}
                                        searchable
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Title order={4} c="blue" >New Stock Information</Title>
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Quantity "
                                        placeholder="1"
                                        min={1}
                                        required
                                        {...form.getInputProps('quantity')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Unit Price (€) "
                                        placeholder="0"
                                        min={0}
                                        required
                                        {...form.getInputProps('unitPrice')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <TextInput
                                        label="Supplier "
                                        placeholder="Ex: Safety Equipment Ltd"

                                        {...form.getInputProps('supplier')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        label="Brand "
                                        placeholder="SafeGuard"
                                        {...form.getInputProps('brand')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        label="Model "
                                        placeholder="SG-100"
                                        {...form.getInputProps('model')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        label="Size "
                                        placeholder="Adjustable"
                                        {...form.getInputProps('size')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <DateInput
                                        label="Expiry Date"
                                        placeholder="Select expiry date"
                                        {...form.getInputProps('expiryDate')}
                                    />
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Group justify="flex-end" mt="md">

                                        <Button
                                            type="submit"
                                            leftSection={<IconPlus size={16} />}

                                        >
                                            Add Stock
                                        </Button>
                                    </Group>
                                </Grid.Col>
                            </Grid>
                        </form>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">PPE Information</Title>

                        {selectedPpe ? (
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Category:</Text>
                                    <Text size="sm">{selectedPpe.category}</Text>
                                </Group>

                                <Box>
                                    <Text size="sm" c="dimmed" mb="xs">Description:</Text>
                                    <Text size="sm">{selectedPpe.description}</Text>
                                </Box>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Minimum Stock:</Text>
                                    <Text size="sm">{selectedPpe.minStock}</Text>
                                </Group>

                                {selectedPpe.certificationStandard && <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Certification:</Text>
                                    <Text size="sm">{selectedPpe.certificationStandard}</Text>
                                </Group>}

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Current Stock:</Text>
                                    <Badge color="green" variant="filled">
                                        {selectedPpe.stock} UNITS
                                    </Badge>
                                </Group>

                                {form.values.quantity && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">New Total:</Text>
                                        <Badge color="blue" variant="filled">
                                            {(selectedPpe.stock ?? 0) + parseInt(String(form.values.quantity || '0'))} UNITS
                                        </Badge>
                                    </Group>
                                )}
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed" ta="center" py="xl">
                                Select a PPE to view information
                            </Text>
                        )}
                    </Card>

                    {/* Low Stock Alert Section */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
                        <Group mb="md">
                            <IconAlertTriangle size={20} color="#FF922B" />
                            <Title order={5} c="orange">Low Stock Alert</Title>
                        </Group>

                        <Stack gap="md">
                            {ppe
                                .filter((ppe: any) => ppe.stock <= ppe.minStock)
                                .slice(0, 3)
                                .map((ppe: any) => {
                                    const percentage = Math.round((ppe.stock / ppe.minStock) * 100);
                                    return (
                                        <Box key={ppe.id}>
                                            <Group justify="space-between" mb="xs">
                                                <Text size="sm">{ppe.name}</Text>
                                                <Badge color="orange" variant="light" size="xs">
                                                    {percentage}%
                                                </Badge>
                                            </Group>
                                            <Badge variant="light" color="blue" size="xs" mb="xs">
                                                {ppe.category?.toUpperCase()}
                                            </Badge>
                                            <Text size="xs" c="dimmed">
                                                {ppe.stock} / {ppe.minStock} units
                                            </Text>
                                            <Progress value={percentage} color="orange" size="xs" mt="xs" />
                                        </Box>
                                    );
                                })}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Box>
    );
};

export default PPEStockEntryForm;
