import {
    Breadcrumbs,
    Fieldset,
    Select,
    Text,
    Textarea,
    TextInput,
    Button,
    Group,
    useMantineTheme,
    Divider,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { IconCloudUpload, IconDownload, IconX, IconTrash } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { severity } from '../../../Data/IncidentsData';
import { PickList } from 'primereact/picklist';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { reportIncident } from '../../../services/IncidentService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';

const AddIncidents = () => {
    const theme = useMantineTheme();
    const navigate = useNavigate();
    const [uploadedImages, setUploadedImages] = useState<File[]>([]);
    const [emps, setEmps] = useState<any[]>([]);
    const [emps1, setEmps1] = useState<any[]>([]);

    useEffect(() => {
        getEmployeeDropdown().then((res: any) => {
            setEmps(res);
            setEmps1(res);

        })
            .catch((_err: any) => {
            });

    }, []);

    const form = useForm({
        initialValues: {
            title: '',
            incidentType: '',
            location: '',
            severity: '',
            description: '',
            occurredAt: '',
            involvedPersons: [],
            witnesses: [],
            docs: []
        },
        validate: {
            title: (value) => (value?.trim().length > 0 ? null : 'Incident Title is Required'),
            location: (value) => (value?.trim().length > 0 ? null : 'Incident Location is Required'),
            incidentType: (value) => (value?.trim().length > 0 ? null : 'Incident Type is Required'),
            severity: (value) => (value?.trim().length > 0 ? null : 'Severity Level is Required'),
            description: (value) => (value?.trim().length > 0 ? null : 'Description is required'),
            occurredAt: (value) => (value?.toString().length > 0 ? null : 'Occurrence Time Date is Required'),

        },
    });

    const handleRemoveImage = (index: number) => {
        const newImages = [...uploadedImages];
        newImages.splice(index, 1);
        setUploadedImages(newImages);
    };

    const onChange = (event: any) => {
        setEmps(event.source);
        form.setFieldValue('witnesses', event.target);
    };
    const onPersonChange = (event: any) => {
        setEmps1(event.source);
        form.setFieldValue('involvedPersons', event.target);
    };

    const itemTemplate = (item: any) => {
        return (
            <div className={`  flex gap-5 justify-between`}>
                <span className="text-sm">{item.name}</span>
                <span className="text-400 text-xs">{item.empNumber}</span>

            </div>
        );
    };

    const handleSubmit = () => {
        form.validate();
        if (!form.isValid()) return;
        const values = form.values;
        reportIncident({ ...values, involvedPersons: values.involvedPersons.map((x: any) => x.id), witnesses: values.witnesses.map((x: any) => x.id) }).then((_res: any) => {
            successNotification("Incident Reported Successfully");
            navigate("/incidents");
        }).catch((err: any) => {
            errorNotification(err?.response?.data?.errorMessage || "Something went wrong");
        })
    }

    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    {/* LOT 40 P1 fix: brand color teal */}
                    <div className="text-2xl text-teal-700 w-fit">Report Incidents</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/incidents">
                            <Text variant="gradient">Incidents Management</Text>
                        </Link>
                        <Text variant="gradient">Report Incidents</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <Fieldset
                    /* LOT 40 P1 fix: responsive grid + teal brand legend */
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 [&>legend]:w-fit gap-5 flex-wrap"
                    legend={<div className="text-lg text-teal-700">Report Incidents Info</div>}
                >
                    <TextInput withAsterisk label="Incident Title" placeholder="Enter Incident Title" {...form.getInputProps('title')} />
                    <Select withAsterisk label="Incident Type" placeholder="Select Incident Type" data={['Server Outage', 'Bug', 'Security', 'Other']} {...form.getInputProps('incidentType')} />
                    <TextInput withAsterisk label="Incident Location" placeholder="Enter Incident Location" {...form.getInputProps('location')} />
                    <Select withAsterisk label="Severity Level" placeholder="Select Severity Level" searchable={false} data={severity} {...form.getInputProps('severity')} />
                    <DateTimePicker withAsterisk withSeconds label="Occurred At" placeholder="Pick Date and Time" {...form.getInputProps('occurredAt')} />

                    {/* LOT 40 P1 fix: responsive col-span to match grid */}
                    <Textarea withAsterisk label="Description" placeholder="Enter Description" {...form.getInputProps('description')} className='sm:col-span-2 lg:col-span-3 ' rows={3} />
                </Fieldset>

                {/* LOT 40 P1 fix: teal brand legend */}
                <Fieldset className=" [&>legend]:w-fit grid grid-cols-[1fr_auto_1fr] gap-5" legend={<div className="text-lg text-teal-700 ">Witnesses & Invloved Persons</div>}>
                    <PickList
                        dataKey="id"
                        filter
                        filterBy="name"
                        sourceFilterPlaceholder="Search by name"
                        showTargetControls={false}
                        showSourceControls={false}
                        targetFilterPlaceholder="Search by name"
                        source={emps}
                        target={form.getValues().witnesses}
                        onChange={onChange}
                        itemTemplate={itemTemplate}
                        breakpoint="1280px"
                        sourceHeader={`Employees (${emps.length})`}
                        targetHeader={`Witnesses (${form.getValues().witnesses.length})`}
                        sourceStyle={{ height: '24rem' }}
                        targetStyle={{ height: '24rem' }}
                    />
                    <Divider orientation='vertical' />

                    <PickList
                        dataKey="id"
                        filter
                        filterBy="name"
                        sourceFilterPlaceholder="Search by name"
                        showTargetControls={false}
                        showSourceControls={false}
                        targetFilterPlaceholder="Search by name"
                        source={emps1}
                        target={form.getValues().involvedPersons}
                        onChange={onPersonChange}
                        itemTemplate={itemTemplate}
                        breakpoint="1280px"
                        sourceHeader={`Employees (${emps1.length})`}
                        targetHeader={`Involved Persons (${form.getValues().involvedPersons.length})`}
                        sourceStyle={{ height: '24rem' }}
                        targetStyle={{ height: '24rem' }}
                    />
                </Fieldset>

                {/* LOT 40 P1 fix: teal brand legend */}
                <Fieldset legend={<div className="text-lg text-teal-700">Upload Image</div>}>
                    <Dropzone
                        onDrop={(files: any) => setUploadedImages([...uploadedImages, ...files])}
                        accept={['image/*']}
                        maxSize={30 * 1024 * 1024}
                        multiple
                    >
                        <div style={{ pointerEvents: 'none' }}>
                            <Group justify="center">
                                <Dropzone.Accept>
                                    <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                    <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                    <IconCloudUpload size={50} stroke={1.5} />
                                </Dropzone.Idle>
                            </Group>
                            <Text ta="center" fz="lg" mt="xl">
                                <Dropzone.Accept>Drop image files here</Dropzone.Accept>
                                <Dropzone.Reject>Only image files under 30MB are allowed</Dropzone.Reject>
                                <Dropzone.Idle>Upload incident images</Dropzone.Idle>
                            </Text>
                            <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                Drag & drop images here to upload. You can upload multiple images under 30MB each.
                            </Text>
                        </div>
                    </Dropzone>

                    {uploadedImages.length > 0 && (
                        // LOT 40 P1 fix: smoother responsive grid scaling
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {uploadedImages.map((file, index) => (
                                <div key={index} className="relative group border p-5 rounded  shadow bg-white">
                                    <div className=" w-full h-[200px] flex items-center justify-center">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`upload-${index}`}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <Button
                                        size="xs"
                                        variant="filled"
                                        color="red"
                                        className="!absolute !top-5 !right-5 opacity-0 group-hover:opacity-100 transition-all z-10"
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        <IconTrash size={15} />
                                    </Button>
                                    <Text ta="center" fz="xs" className="truncate !p-2">
                                        {file.name}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    )}
                </Fieldset>
            </div>
            <div className="flex justify-center mt-5">
                <Button onClick={handleSubmit} className="!bg-primary-500 !text-white">
                    Submit
                </Button>
            </div>
        </div>
    );
};

export default AddIncidents;
