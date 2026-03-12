import {
    ActionIcon,
    Breadcrumbs,
    Button,
    Fieldset,
    Select,
    Text,
    TextInput,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { IconClock, IconPlus, IconTrash } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

type Task = {
    type: string;
    description: string;
};

type Location = {
    name: string;
    area: string;
    remarks: string;
};

type Answer = {
    worker: string;
    supervisor: string;
};

const AddCard = () => {
    const ref1 = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLInputElement>(null);
    const [tasks, setTasks] = useState<Task[]>([{ type: "", description: "" }]);
    const [locations, setLocations] = useState<Location[]>([{ name: "", area: "", remarks: "" }]);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});

    const inspectionItems = [
        { question: "Do I need to define my work area?", category: "workplace" },
        { question: "Do I need help?", category: "safety" },
        { question: "Do I need to notify someone before completing my task?", category: "safety" },
        { question: "Am I exposed to a fall?", category: "safety" },
        { question: "Is there a fire risk?", category: "safety" },
        { question: "Is there anything different today? (shift change, new colleague, etc.)", category: "workplace" },
        {
            question: "Do I have the appropriate tools/equipment/ladders/PPE and are they in good condition?",
            category: "equipment"
        },
        {
            question: "Do I need to control energy sources? (electrical, pneumatic, hydraulic, residual, etc.)",
            category: "safety"
        },
        {
            question: "Are my hands at risk of being crushed, pinched and/or caught?",
            category: "safety"
        },
        { question: "Is the workplace clean and tidy?", category: "workplace" },
    ];

    const handleAnswerChange = (
        question: string,
        role: "worker" | "supervisor",
        value: string
    ) => {
        setAnswers((prev) => ({
            ...prev,
            [question]: {
                ...prev[question],
                [role]: value,
            },
        }));
    };

    const addTask = () => {
        setTasks((prev) => [...prev, { type: "", description: "" }]);
    };

    const updateTask = (index: number, key: keyof Task, value: string) => {
        const updatedTasks = [...tasks];
        updatedTasks[index] = {
            ...updatedTasks[index],
            [key]: value,
        };
        setTasks(updatedTasks);
    };

    const removeTask = (index: number) => {
        setTasks((prev) => prev.filter((_, i) => i !== index));
    };

    const addLocation = () => {
        setLocations((prev) => [...prev, { name: "", area: "", remarks: "" }]);
    };

    const updateLocation = (index: number, key: keyof Location, value: string) => {
        const updatedLocations = [...locations];
        updatedLocations[index] = {
            ...updatedLocations[index],
            [key]: value,
        };
        setLocations(updatedLocations);
    };

    const removeLocation = (index: number) => {
        setLocations((prev) => prev.filter((_, i) => i !== index));
    };

    const pickerControl1 = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref1.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );
    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    return (
        <div className="flex flex-col gap-10">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">New MBA Card</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>
                        <Link className="hover:!underline" to="/mba-management"><Text variant="gradient">MBA Cards</Text></Link>
                        <Text variant="gradient">New MBA Card</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="p-4 bg-white shadow-lg border border-gray-300 rounded-lg flex flex-col gap-5">
                <Fieldset
                    className="[&>legend]:w-fit gap-5 flex-wrap flex flex-col"
                    legend={<div className="text-lg font-medium text-blue-500">MBA Informations</div>}
                >
                    <div className="grid grid-cols-3 gap-4">
                        <TextInput label="Company" placeholder="Enter Company" withAsterisk />
                        <DateInput label="Date" placeholder="Enter Date" withAsterisk />
                        <Select label="Shift" placeholder="Select Shift" data={["Day Shift", "Night Shift"]} withAsterisk />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <TextInput label="Worker Name" placeholder="Enter Worker Name" withAsterisk />
                        <TextInput label="Supervisor Name" placeholder="Enter Supervisor Name" withAsterisk />
                        <TextInput label="Department" placeholder="Enter Department" withAsterisk />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Location" placeholder="Enter Location" withAsterisk />
                        <TimeInput
                            label="Time"
                            placeholder="Enter Time"
                            ref={ref1}
                            rightSection={pickerControl1}
                            withAsterisk
                        />
                    </div>
                </Fieldset>

                <div className="flex justify-between">
                    <p className="text-xl font-medium text-gray-700">Tasks to Accomplish</p>
                    <Button leftSection={<IconPlus />} onClick={addTask}>Add Task</Button>
                </div>

                {tasks.map((task, index) => (
                    <Fieldset
                        key={index}
                        legend={
                            <div className="flex gap-4 items-center">
                                <span className="text-lg font-medium text-blue-500">Task {index + 1}</span>
                                <ActionIcon variant="filled" color="red" onClick={() => removeTask(index)}>
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </div>
                        }
                    >
                        <TextInput
                            value={task.description}
                            onChange={(e) => updateTask(index, "description", e.target.value)}
                            label="Description"
                            placeholder="Enter Task Description"
                            className="col-span-2"
                            withAsterisk
                        />
                    </Fieldset>
                ))}

                <div className="flex flex-col gap-5">
                    <p className="text-xl font-medium text-gray-700">Inspection Items</p>
                    {inspectionItems.map((item) => (
                        <div
                            key={item.question}
                            className="p-4 bg-blue-50 shadow-lg border border-gray-300 rounded-lg flex justify-between items-center"
                        >
                            <div className="flex flex-col">
                                <p className="text-md font-medium text-gray-600">{item.question}</p>
                                <p className="text-blue-500">{item.category}</p>
                            </div>
                            <div className="flex gap-4 w-[400px]">
                                {["worker", "supervisor"].map((role) => (
                                    <div key={role} className="flex flex-col">
                                        <p className="font-medium capitalize">{role}</p>
                                        <div className="flex items-center border border-primary rounded px-2 py-1 bg-white shadow-sm">
                                            <Select
                                                data={["Yes", "No"]}
                                                placeholder="Select"
                                                value={answers[item.question]?.[role as "worker" | "supervisor"] || ""}
                                                onChange={(val) =>
                                                    handleAnswerChange(item.question, role as "worker" | "supervisor", val || "")
                                                }
                                                variant="outline"
                                                classNames={{ input: "w-[80px]" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between">
                    <p className="text-xl font-medium text-gray-700">Work Locations</p>
                    <Button leftSection={<IconPlus />} onClick={addLocation}>Add Location</Button>
                </div>

                {locations.map((location, index) => (
                    <Fieldset
                        key={index}
                        legend={
                            <div className="flex gap-4 items-center">
                                <span className="text-lg font-medium text-blue-500">Location {index + 1}</span>
                                <ActionIcon variant="filled" color="red" onClick={() => removeLocation(index)}>
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-3 gap-4">
                            <TextInput
                                value={location.name}
                                onChange={(e) => updateLocation(index, "name", e.target.value)}
                                label="Place"
                                placeholder="Enter Place"
                                withAsterisk
                            />
                            <TimeInput label="Start Time" ref={ref} rightSection={pickerControl} withAsterisk />
                            <TextInput
                                withAsterisk
                                label="Intials"
                                placeholder="Intials"
                            />
                        </div>
                    </Fieldset>
                ))}
            </div>
        </div>
    );
};

export default AddCard;
