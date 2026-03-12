import { useEffect, useState } from "react";
import { Button, Card, Divider, Group, Select, Text, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconBook, IconCalendar, IconCircleCheck, IconInfoCircle, IconUser } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { createLessonLearn, getDetailsByIncidentId, updateLessonLearn } from "../../../../services/LessonLearnService";
import { getEmployeeDropdown } from "../../../../services/EmployeeService";
import { lessondata } from "../../../../Data/IncidentsData";
import { formatDateWithDay } from "../../../../utility/DateFormats";

const Lesson = ({
    incidentId,
    setLoading

}: {
    incidentId: number;
    setLoading?: any;

}) => {
    const dispatch = useDispatch();
    const [selectedLesson, setSelectedLesson] = useState<any>(null)
    const [isSubmitted, setIsSubmitted] = useState(!!selectedLesson);
    const [employees, setEmployees] = useState<any[]>([]);

    const form = useForm({
        initialValues: {
            date: '' as any,
            description: '',
            category: '',
            employeeId: '',
            status: ''
        },
        validate: {
            date: (value) => (value ? null : 'Date is required'), // ✅ updated
            employeeId: (value) => (value?.trim()?.length > 0 ? null : 'Owner is required'),
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
            },
            category: (value) => (value?.trim()?.length > 0 ? null : 'Category is required'),
            status: (value) => (value?.trim()?.length > 0 ? null : 'Status is required'),
        }
    });
    const safeDate = (value: any) => {
        const d = new Date(value);
        return value && !isNaN(d.getTime()) ? d : null;
    };
    useEffect(() => {
        if (!selectedLesson && incidentId) {
            if (setLoading) setLoading(true)
            getDetailsByIncidentId(incidentId)
                .then((res) => {
                    setSelectedLesson(res)

                    form.setValues({
                        date: safeDate(res.date), // ✅ converted safely
                        description: res.description || '',
                        category: res.category || '',
                        employeeId: res.employeeId?.toString() || '',
                        status: res.status || ''
                    });
                    setIsSubmitted(true);

                })
                .catch((err) => {
                    console.error("Lesson fetch failed", err);
                })
                .finally(() => {
                    if (setLoading) setLoading(false);
                })
        }
    }, [incidentId]);


    useEffect(() => {
        getEmployeeDropdown()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id), // ensure value is string if form field is string
                }));
                setEmployees(mappedEmployees);
            })
            .catch((_err) => { });
    }, []);


    const handleEdit = () => {
        setIsSubmitted(false);
    };

    const handleSubmit = (values: any) => {
        console.log(form.values)
        dispatch(showOverlay());

        const formattedDate = new Date(values.date).toISOString().split("T")[0]; // ✅ format for backend

        const payload = {
            ...values,
            date: formattedDate,
            status: values.status.toUpperCase(),
            category: values.category,
            description: values.description,
            incidentId,
            employeeId: Number(values.employeeId),
        };

        const apiCall = selectedLesson
            ? updateLessonLearn({ id: selectedLesson.id, ...payload })
            : createLessonLearn(payload);

        apiCall
            .then(() => {
                successNotification(`Lesson ${selectedLesson ? "updated" : "created"} successfully`);

                setIsSubmitted(true);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    const getEmployeeNameById = (id: string | number) => {
        const emp = employees.find((e) => e.value === id);
        return emp ? emp.label : `Employee #${id}`;
    };

    return (
        <div className="p-4 space-y-4">
            {!isSubmitted ? (
                <div className="flex flex-col gap-4">
                    <p className="text-lg font-medium flex gap-2 items-center">
                        <IconBook size={20} /> {selectedLesson ? "Update" : "Add"} Lesson Learned for This Incident
                    </p>
                    <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateInput
                                label="Date"
                                placeholder="Select Date"
                                withAsterisk
                                size="sm"
                                leftSection={<IconCalendar />}
                                valueFormat="DD/MM/YYYY"
                                {...form.getInputProps('date')}
                            />

                            <Select
                                label="Owner"
                                withAsterisk
                                size="sm"
                                data={employees}
                                placeholder="Select Owner"

                                {...form.getInputProps('employeeId')}
                            />

                            <Select
                                label="Category"
                                data={["Technical", "Procedural", "Training", "Communication", "Other"]}
                                withAsterisk
                                size="sm"
                                placeholder="Select Category"

                                {...form.getInputProps('category')}
                            />


                            <Select
                                label="Status"
                                data={lessondata}
                                placeholder="Select Status"
                                withAsterisk
                                size="sm"

                                {...form.getInputProps('status')}
                            />
                        </div>

                        <Textarea
                            label="Description"
                            placeholder="Enter Description"
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('description')}
                        />

                        <Group mt="md" justify="end">
                            <Button variant="filled" size="sm" color="blue" type="submit">
                                {selectedLesson ? "Update" : "Save"} Lesson Learned
                            </Button>
                        </Group>
                    </form>
                </div>
            ) : (
                <div className="bg-blue-50 p-4 border border-gray-300 shadow-lg rounded-lg flex flex-col gap-3">
                    <div className="flex justify-between">
                        <p className="text-lg font-medium">Lesson Learned for This Incident</p>
                        <Button size="xs" onClick={handleEdit}>Edit Lesson</Button>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="bg-blue-100 p-1 rounded-4xl">
                                <p className="text-sm font-medium text-blue-600">{form.values.category}</p>
                            </div>
                            <p className="text-sm text-gray-500">{formatDateWithDay(form.values.date)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-100 p-2 rounded-4xl border border-green-800">
                            <IconCircleCheck size={15} color="darkgreen" />
                            <p className="font-medium text-xs text-green-800">{form.values.status}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-base mb-1 font-medium text-gray-600">Lesson Description</p>
                        <p className="text-sm  text-gray-500">{form.values.description}</p>
                    </div>
                    <Text size="sm" className="!text-blue-700 flex items-center gap-2 !font-medium">
                        <strong className="text-gray-500 flex items-center gap-2"><IconUser size={20} />Owner:</strong>{getEmployeeNameById(form.values.employeeId)}
                    </Text>
                </div>
            )}

            <Card shadow="xs" padding="md" radius="md" className="!bg-blue-50">
                <Group>
                    <IconInfoCircle size={18} color="#0ea5e9" />
                    <Text>About Lessons Learned</Text>
                </Group>
                <Divider my="sm" />
                <Text size="sm" color="dimmed">
                    Each incident can have only one lesson learned entry. This ensures focused, high-quality insights that can be effectively shared across the organization. The lesson should capture the most important learning from this incident that can help prevent similar occurrences in the future.
                </Text>
            </Card>
        </div>
    );
};

export default Lesson;
