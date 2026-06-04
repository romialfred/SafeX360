import { useEffect, useState } from "react";
import { Button, Divider, Select, TextInput, Avatar, Popover, Indicator, Breadcrumbs, Text, Chip, Group } from "@mantine/core";
import { IconExclamationCircle, IconUserPlus, IconUsers, IconX, IconBriefcase } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { getAllDepartments, getEmployeesByDepartment } from "../../../services/HrmsService";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { createIncidentTeam } from "../../../services/TeamService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";


const chips = ["1", "2", "3", "4", "5"];

type Member = {
    employeeId: string;
    notificationLevel: string[];
    role: string;
    [string: string]: any;
}

const AddTeam = () => {
    const [popoverOpened, setPopoverOpened] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [error, setError] = useState<boolean>(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
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
                setEmployees(res.map((item: any) => ({
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                    id: undefined
                })));
            })
            .catch((_err) => { })
    }, [form.values.departmentId]);

    const filteredUsers = employees.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) || user.empNumber.toLowerCase().includes(search.toLowerCase())
    );

    const addUser = (user: any) => {
        const members = form.values.members;
        if (!members.find((u: any) => u.id == user.value)) {
            form.setFieldValue("members", [...members, { ...user, role: "MEMBER", notificationLevel: ["1"], employeeId: user.value }]);
            setPopoverOpened(false);
        }
        setEmployees((prev) =>
            prev.filter((u) => u.value !== user.value)
        );
    };

    const removeUser = (id: any) => {
        const members = form.values.members;
        form.setFieldValue("members", members.filter((u: any) => u.value != id));
        setEmployees((prev) => [
            ...prev,
            ...members.filter((u: any) => u.value == id)
        ]);
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
        dispatch(showOverlay());
        createIncidentTeam(form.values).then((_res) => {
            successNotification("Team created successfully");
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
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Add Team</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/team-setup" ><Text c="dimmed" className="hover:!underline cursor-pointer">Team Setup</Text></Link>
                        <Text c="teal" fw={500}>Add Team</Text>
                    </Breadcrumbs>
                </div>

            </div>


            <div className="bg-white p-5 shadow-xl rounded-xl border-none flex flex-col gap-5">
                {/* LOT 40 P1: grid-cols-2 -> grid-cols-1 md:grid-cols-2 (responsive form) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select {...form.getInputProps("departmentId")}
                        withAsterisk
                        label="Department"
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
                                                onClick={() => addUser(user)}
                                            >
                                                <div className="flex gap-4 items-center ">
                                                    <Avatar name={user.name} color="initials" radius="xl" variant="filled" />
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            {user.empNumber}
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
                                            onClick={() => removeUser(user.employeeId)}
                                        >
                                            <IconX size={25} />
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <Indicator disabled={user.role == "MEMBER"} label="Team Lead" size={25} variant="gradient">
                                                <Avatar radius="xl" size={70} name={user.name} color="initials" variant="filled" />
                                            </Indicator>
                                            <div>
                                                <p className="text-xl">{user.name}</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <IconBriefcase size={14} /> {user.empNumber}
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

export default AddTeam;