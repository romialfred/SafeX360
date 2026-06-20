import { useEffect, useState } from "react";
import {
    Button,
    Divider,
    TextInput,
    Avatar,
    Popover,
    Indicator,
    Breadcrumbs,
    Text,
    Chip,
    Group,
    Select,
} from "@mantine/core";
import { IconExclamationCircle, IconUserPlus, IconUsers, IconX, IconBriefcase } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAllDepartments, getEmployeesByDepartment } from "../../../services/HrmsService";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { getIncidentTeamById, getTeamMembers, updateIncidentTeam } from "../../../services/TeamService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { modals } from "@mantine/modals";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";


const chips = ["1", "2", "3", "4", "5"];

type Member = {
    employeeId: string;
    notificationLevel: string[];
    role: string;
    [string: string]: any;
}

const UpdateTeam = () => {
    const { id } = useParams();
    const [popoverOpened, setPopoverOpened] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [error, setError] = useState<boolean>(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [empMap, setEmpMap] = useState<Record<any, any>>({});
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

    useEffect(() => {

        getIncidentTeamById(id).then((res) => {

            form.setValues({
                departmentId: "" + res.departmentId,
                name: res.name,
            });

        }).catch((_err) => { });

        getTeamMembers(id).then((res) => {

            form.setFieldValue("members", res.map((item: any) => ({
                ...item,
                value: "" + item.employeeId,
                employeeId: "" + item.employeeId,
                notificationLevel: item.notificationLevel.map((n: any) => "" + n),
                role: item.role,
            })));
        }).catch((_err) => { });

        getAllDepartments()
            .then((res) => {
                setDepartments(res.map((item: any) => ({
                    value: "" + item.id,
                    label: item.name,
                })));


            })
            .catch((_err) => { })
    }, [])



    const form = useForm({
        initialValues: {
            id: id,
            departmentId: "",
            name: "",
            members: [] as Member[],
        },
        validate: {
            departmentId: (value) => (value ? null : "Department is required"),
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Team Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
        },
    })
    useEffect(() => {
        if (!form.values.departmentId) return;
        getEmployeesByDepartment(form.values.departmentId)
            .then((res) => {
                setEmpMap(mapIdToName(res));
                setEmployees(res.map((item: any) => ({
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                    id: undefined
                })));
            })
            .catch((_err) => { })
    }, [form.values.departmentId]);

    const memberIds = new Set(form.values.members.map((m) => m.employeeId));

    useEffect(() => {
        setFilteredUsers(employees
            .filter((emp) => !memberIds.has("" + emp.value)).filter((emp) => !search ||
                emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.empNumber.toLowerCase().includes(search.toLowerCase())
            ));
    }, [form.values.members, employees]);

    const addUser = (user: any) => {
        const members = form.values.members;
        if (!members.find((u: any) => u.employeeId == user.value)) {
            form.setFieldValue("members", [...members, { ...user, role: "MEMBER", notificationLevel: ["1"], employeeId: user.value }]);
            setPopoverOpened(false);
        }

    };

    const removeUser = (idx: any) => {
        const members = form.values.members;
        if (members[idx].id) {
            modals.openConfirmModal({
                title: <span className='text-2xl'>Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this member? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: 'Cancel' },
                cancelProps: { color: 'red', variant: "filled" },
                confirmProps: { color: 'green', variant: "filled" },

                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    form.setFieldValue("members", members.filter((_u: any, index: any) => index != idx));
                },
            });
        } else {
            form.setFieldValue("members", members.filter((_u: any, index: any) => index != idx));

        }

    };

    const makeTeamLead = (index: number) => {
        let members = form.values.members;
        members[index].role = "TEAM_LEAD";
        form.setFieldValue("members", [...members]);
    };
    const removeTeamLead = (index: number) => {
        let members = form.values.members;
        members[index].role = "MEMBER";
        form.setFieldValue("members", [...members]);
    };
    const handleSubmit = () => {
        form.validate();
        if (!form.isValid()) return;
        if (!checkTeamLead()) return;
        console.log("Form Values", form.values);
        dispatch(showOverlay());
        updateIncidentTeam(form.values).then((_res) => {
            successNotification("Team updated successfully");
            navigate("/team-setup");
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        }
        );
    }

    const checkTeamLead = () => {
        const members = form.values.members;
        const teamLead = members.find((u: any) => u.role === "TEAM_LEAD");
        if (!teamLead) {
            setError(true);
            return false;
        }
        setError(false);
        return true;
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Update Committee</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/team-setup" ><Text c="dimmed" className="hover:!underline cursor-pointer">H&S Committee</Text></Link>
                        <Text c="teal" fw={500}>Update Committee</Text>
                    </Breadcrumbs>
                </div>

            </div>


            <div className="bg-white p-5 shadow-xl rounded-xl border-none flex flex-col gap-5">
                {/* LOT 40 P1: grid-cols-2 -> grid-cols-1 md:grid-cols-2 (responsive form) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select {...form.getInputProps("departmentId")}
                        withAsterisk
                        label="Department"
                        readOnly
                        data={departments}
                        searchable
                        allowDeselect={false}
                        placeholder="Select Department" />
                    <TextInput {...form.getInputProps("name")} withAsterisk label="Team Name" placeholder="Enter Team Name" />
                </div>

                <Divider size="sm" />

                <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                        <p className="text-lg">Team Members</p>
                        <span className="bg-primary/20 p-1 px-3 text-blue-500 rounded-3xl">
                            {form.values.members.length} Selected
                        </span>
                    </div>

                    <div className="flex gap-2 bg-primary/20 p-5 rounded-2xl items-center">
                        <IconExclamationCircle size={25} className="text-blue-500" />
                        <p className="text-blue-500">
                            Add employees who will receive notifications for incident reports. At least one team member must be designated as Team Lead.
                        </p>
                    </div>
                    {error && <div className="flex gap-2 bg-red-400/20 p-5 rounded-2xl items-center">
                        <IconExclamationCircle size={25} className="text-red-500" />
                        <p className="text-red-400">
                            At least one team member must be designated as Team Lead.
                        </p>
                    </div>}
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2">

                            <Popover
                                opened={popoverOpened}
                                onChange={setPopoverOpened}
                                width="target"
                                position="bottom"
                                withinPortal={false}

                                withArrow={false}
                                middlewares={{ flip: false }}
                            >
                                <Popover.Target>
                                    <div>
                                        <TextInput label="Add Team Members" placeholder="Add Team Members...." leftSection={<IconUserPlus color="gray" />} onClick={() => setPopoverOpened((o) => !o)} className=" text-gray-600 text-lg" />

                                    </div>
                                </Popover.Target>
                                <Popover.Dropdown className="w-full !shadow-2xl">
                                    <TextInput
                                        placeholder="Search users..."
                                        value={search}
                                        onChange={(e) => setSearch(e.currentTarget.value)}
                                        mb="md"
                                    />
                                    <div className="flex flex-col max-h-[200px] overflow-y-auto">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.value}
                                                className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-100 cursor-pointer"
                                                onClick={() => addUser(user)} // Use empMap to get the full user object
                                            >
                                                <div className="flex gap-4 items-center ">
                                                    <Avatar name={empMap[user.value]?.name} color="initials" radius="xl" variant="filled" />
                                                    <div>
                                                        <p className="font-medium">{empMap[user.value]?.name}</p>
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            {empMap[user.value]?.empNumber}
                                                        </div>

                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </Popover.Dropdown>
                            </Popover>
                        </div>

                        {form.values.members.length === 0 ? (
                            <div className="flex flex-col gap-2 justify-center items-center  border-dashed border-3 rounded border-gray-400 ">
                                <IconUsers size={60} color="gray" />
                                <p>No Team Members</p>
                                <p className="text-gray-400">Add team members using the selector above.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {form.values.members.map((user: any, index: number) => (
                                    <div
                                        key={user.value}
                                        className="border rounded-xl shadow flex flex-col gap-3 relative p-5"
                                    >
                                        <button
                                            className="absolute top-2 right-2 text-gray-500 hover:text-red-600 cursor-pointer"
                                            onClick={() => removeUser(index)}
                                        >
                                            <IconX size={25} />
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <Indicator disabled={user.role == "MEMBER"} label="Team Lead" size={25} variant="gradient">
                                                <Avatar radius="xl" size={70} name={empMap[user.value]?.name} color="initials" variant="filled" />
                                            </Indicator>
                                            <div>
                                                <p className="text-xl">{empMap[user.value]?.name}</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <IconBriefcase size={14} /> {empMap[user.value]?.empNumber}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-lg text-gray-500">Incident Level Notifications:</p>

                                            <Chip.Group {...form.getInputProps(`members.${index}.notificationLevel`)} multiple={true} >
                                                <Group gap={5}>
                                                    {
                                                        chips.map((chip) => (
                                                            <Chip px={0} size="md" key={chip} value={chip} className="cursor-pointer" >
                                                                {`Level ${chip}`}
                                                            </Chip>))
                                                    }
                                                </Group>
                                            </Chip.Group>
                                        </div>

                                        {user.role == "MEMBER" ? <Button onClick={() => makeTeamLead(index)} variant="gradient">Make Team Lead Status</Button> : <Button variant="filled" color="red" onClick={() => removeTeamLead(index)} >Remove Team Lead Status</Button>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 justify-center mt-5">
                <Button onClick={handleSubmit} variant="gradient">Save Team Configuration</Button>
            </div>
        </div>
    );
};

export default UpdateTeam;