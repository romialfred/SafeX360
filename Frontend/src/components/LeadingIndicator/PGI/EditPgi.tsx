

import {
    ActionIcon,
    Alert,
    Breadcrumbs,
    Button,
    Checkbox,
    Fieldset,
    Group,
    Select,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PickList } from "primereact/picklist";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { IconClock } from "@tabler/icons-react";
import TextEditor from "../../UtilityComp/TextEditor";
import { getAllLocations } from "../../../services/LocationService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { getPgiById, updatePgi } from "../../../services/PgiService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActivitiesByYearStatusAndCategory } from "../../../services/HSEActivityService";
import { mapIdToName } from "../../../utility/OtherUtilities";






const EditPgi = () => {
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [location, setLocation] = useState<any[]>([]);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<any>({});
    const dispatch = useDispatch();
    const { id } = useParams();
    const navigate = useNavigate();
    const [activities, setActivities] = useState<any[]>([]);
    const [lockedInfo, setLockedInfo] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });


    const [ppe, _setPPE] = useState([
        { id: 'helmet', name: 'Safety Helmet', required: false, worn: false },
        { id: 'goggles', name: 'Safety Goggles', required: false, worn: false },
        { id: 'gloves', name: 'Safety Gloves', required: false, worn: false },
        { id: 'boots', name: 'Safety Boots', required: false, worn: false },
        { id: 'vest', name: 'High-Visibility Vest', required: false, worn: false },
        { id: 'mask', name: 'Respiratory Mask', required: false, worn: false },
        { id: 'harness', name: 'Safety Harness', required: false, worn: false }
    ]);



    const form = useForm({
        initialValues: {
            id: 0,
            activityId: undefined,
            siteId: '',
            plannedDate: undefined,
            description: '',
            riskTypes: [],
            objectives: '',
            ppe: [],
            startTime: '',
            endTime: '',
            participants: [],

        },
        validate: {

            activityId: (value) => (value ? null : 'Activity is Required'),

            siteId: (value) => (value?.trim().length > 0 ? null : 'Inspections Site is Required'),
            plannedDate: (value) => (value ? null : 'Planned Date is Required'),
            objectives: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Objectives is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            startTime: (value) => (value ? null : 'Start Time is Required'),
            endTime: (value) => (value ? null : 'End Time is Required'),



        },
    });



    useEffect(() => {

        dispatch(showOverlay());
        getPgiById(id).then((res) => {
            form.setValues({ ...res, id: res.id, plannedDate: new Date(res.plannedDate), activityId: String(res.activityId), siteId: String(res.locationId), participants: res.participants.map((x: any) => ({ ...x, pos: "Target" })) });
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
                setLockedInfo({ locked: true, status: statusUpper });
            }

        }).catch((_err) => {
        }).finally(() => {
            dispatch(hideOverlay());
        });

        getEmployeeDropdown().then((res: any) => {
            setEmpMap(mapIdToName(res));
            setEmps(res);
        }).catch((_err: any) => { });

        getAllLocations({}).then((res) => {
            setLocation(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        })
            .catch((_err: any) => {

            })
        getActivitiesByYearStatusAndCategory(new Date().getFullYear(), "PENDING", "IGP").then((res) => {
            setActivities(res.map((x: any) => ({ label: x.title, value: String(x.id) })));
        }).catch(() => { })
    }, []);


    const employees = emps.filter((emp: any) => !form.values.participants.some((p: any) => p.id === emp.id));

    const onChange = (event: any) => {
        // setEmps(event.source?.map((x: any) => ({ ...x, pos: "Source" })));

        form.setFieldValue('participants', (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string) => {
        let selEmp: any = form.values.participants
        form.setFieldValue('participants', selEmp.map((item: any) =>

            item.id === id ? { ...item, role: value } : item)

        )
        setEditingRoleId(null); // hide dropdown after selection
    };

    const itemTemplate = (item: any) => {
        return (
            <div className={` ${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm">{empMap[item.id]?.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                label="Role"
                                placeholder="Select role"
                                data={['Lead Inspector', 'Inspector', 'Site Supervisor', 'HSE Manager', 'External Auditor']}
                                value={item.role}
                                onChange={(val) => handleRoleChange(item.id, val!)}
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setEditingRoleId(item.id)}
                            >
                                {item.role}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    const handleSubmit = (values: any) => {
        if (isLocked) {
            errorNotification(lockedInfo.status === 'COMPLETED' ? 'This inspection is completed. Modifications are not allowed.' : 'This inspection is cancelled. Modifications are not allowed.');
            return;
        }
        dispatch(showOverlay())
        updatePgi(values).then((_res) => {
            successNotification("Inspection updated successfully");
            navigate("/PGI")
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay())
            })
    }






    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const pickerControl1 = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref1.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );


    const isLocked = lockedInfo.locked;

    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    {/* LOT 40 P1: titre page passé en text-slate-900 */}
                    <div className="text-2xl text-slate-900 w-fit">Update Inspections</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        {/* LOT 40 P1: breadcrumbs Mantine 7 — couleurs sémantiques au lieu de variant="gradient" */}
                        <Link className="hover:!underline" to="/">
                            <Text c="dimmed">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/PGI">
                            <Text c="dimmed">Planned General Inspections</Text>
                        </Link>
                        <Text c="teal" fw={500}>Update Inspections</Text>
                    </Breadcrumbs>
                </div>
            </div>

            {isLocked && (
                <Alert color={lockedInfo.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="mb-4 border">
                    <Text>
                        {lockedInfo.status === 'COMPLETED' ? 'This inspection is completed. Modifications are not allowed.' : 'This inspection is cancelled. Modifications are not allowed.'}
                    </Text>
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="flex flex-col gap-8">

                    {/* LOT 40 P1: grille responsive du fieldset (mobile→single col) */}
                    <Fieldset
                        className="grid grid-cols-1 md:grid-cols-2 [&>legend]:w-fit gap-5 flex-wrap "
                        legend={<div className="text-lg text-teal-700">Inspections Informations</div>} >

                        <Select disabled withAsterisk label="Activity" placeholder="Select activity" data={activities} {...form.getInputProps('activityId')} />
                        <Select withAsterisk label="Location" placeholder="Select location" data={location} {...form.getInputProps('siteId')} />
                        <DatePickerInput label="Date" placeholder="dd-mm-yyyy" withAsterisk {...form.getInputProps('plannedDate')} />

                        {/* LOT 40 P1: sous-grille horaires responsive */}
                        < div className="grid grid-cols-1 md:grid-cols-2 gap-4 self-center">

                            <TimeInput label="Start Time" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps('startTime')} />
                            <TimeInput label="End Time" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps('endTime')} />

                        </div>
                    </Fieldset>

                    <TextEditor form={form} id="description" title="Description" />

                    <Fieldset
                        className="flex flex-col [&>legend]:w-fit gap-5 flex-wrap"
                        legend={<div className="text-lg text-teal-700">Objective & Risk</div>} >

                        <TextInput label="Objective" placeholder="Enter Objective" {...form.getInputProps('objectives')} />
                        <Checkbox.Group {...form.getInputProps('riskTypes')} label="Risk Types" withAsterisk >
                            <Group my={2}>
                                <Checkbox value="mechanical" label="Mechanical" />
                                <Checkbox value="chemical" label="Chemical" />
                                <Checkbox value="electrical" label="Electrical" />
                                <Checkbox value="environmental" label="Environmental" />
                                <Checkbox value="erogonomic" label="Erogonomic" />
                            </Group>
                        </Checkbox.Group>

                    </Fieldset>
                    <Fieldset
                        className=" [&>legend]:w-fit gap-5 flex-wrap "
                        legend={<div className="text-lg text-teal-700">Personal Protective Equipment (PPE)</div>} >
                        <Checkbox.Group size="md"
                            {...form.getInputProps("ppe")}
                            label=""
                        >
                            <div className="flex flex-wrap mt-5 gap-2">
                                {ppe.map((item: any) => (
                                    <div key={item.id} className="">

                                        <Checkbox.Card key={item.id}
                                            value={item.id}
                                            radius="md"
                                            className="group border border-gray-300 transition duration-150 cursor-pointer 
                                 hover:!border-primary hover:!bg-primary/10 
                                 data-[checked]:!border-primary data-[checked]:!bg-primary/20 
                                 data-[checked]:shadow-sm"
                                            p="xs"
                                        >
                                            <Group align="center" gap="xs">
                                                <Checkbox.Indicator size="xs" className=" text-blue-600" />
                                                <Text
                                                    size="xs"
                                                    className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-medium"
                                                >
                                                    {item.name}
                                                </Text>
                                            </Group>
                                        </Checkbox.Card>

                                    </div>
                                ))}
                            </div>
                        </Checkbox.Group>
                    </Fieldset>
                    <Fieldset className=" [&>legend]:w-fit flex  p-5" legend={<div className="text-lg text-teal-700 "> Participants</div>}>


                        <div className=' [&>legend]:w-fit flex gap-5 flex-wrap'>
                            <PickList
                                dataKey="id"
                                filter
                                filterBy="name"
                                sourceFilterPlaceholder="Search by name"
                                targetFilterPlaceholder="Search by name"
                                showTargetControls={false}
                                showSourceControls={false}
                                source={employees}
                                target={form.values.participants}
                                onChange={onChange}
                                itemTemplate={itemTemplate}
                                breakpoint="1280px"
                                sourceHeader={`Available Employees (${employees.length})`}
                                targetHeader={`Participants  (${form.values.participants.length})`}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />
                        </div>
                    </Fieldset>




                </div>

                <div className="flex gap-2 mt-8 justify-center">

                    <Button type="submit" variant="gradient" disabled={isLocked}>Update Inspections</Button>
                </div>
            </form>
        </div>
    )
}

export default EditPgi
