import { useEffect, useState } from "react";
import { Button, Group, Select, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconBook, IconCalendar, IconCircleCheck, IconInfoCircle, IconUser } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { createLessonLearn, getDetailsByIncidentId, updateLessonLearn } from "../../../../services/LessonLearnService";
import { getEmployeeDropdown } from "../../../../services/EmployeeService";
import { LESSON_STATUS_OPTIONS, lessonCategoryLabel, lessonStatusLabel, toIsoDateLocal } from "../incidentLabels";
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
            date: (value) => (value ? null : "La date est requise"),
            employeeId: (value) => (value?.trim()?.length > 0 ? null : "Le responsable est requis"),
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "La description est requise";
                return trimmed.length > 250 ? "Maximum 250 caractères" : null;
            },
            category: (value) => (value?.trim()?.length > 0 ? null : "La catégorie est requise"),
            status: (value) => (value?.trim()?.length > 0 ? null : "Le statut est requis"),
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
        dispatch(showOverlay());

        // Sérialisation LocalDate en fuseau local (évite le décalage d'un jour via UTC)
        const formattedDate = toIsoDateLocal(new Date(values.date));

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
                successNotification(`Leçon ${selectedLesson ? "mise à jour" : "créée"} avec succès`);
                setIsSubmitted(true);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    const getEmployeeNameById = (id: string | number) => {
        const emp = employees.find((e) => e.value === id);
        return emp ? emp.label : `Employé #${id}`;
    };

    return (
        <div className="space-y-4">
            {/* === Section principale Leçon apprise === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100">
                        <IconBook size={14} className="text-blue-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Leçon apprise de l'incident
                    </h2>
                    <span className="ml-auto text-[10px] text-slate-500">
                        ISO 45001 §10.2.1.e
                    </span>
                </header>

                <div className="p-4">
                    {!isSubmitted ? (
                        <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <DateInput
                                    label="Date d'analyse"
                                    placeholder="Sélectionner la date"
                                    withAsterisk
                                    size="sm"
                                    leftSection={<IconCalendar size={14} />}
                                    valueFormat="DD/MM/YYYY"
                                    {...form.getInputProps('date')}
                                />
                                <Select
                                    label="Responsable"
                                    withAsterisk
                                    size="sm"
                                    data={employees}
                                    placeholder="Sélectionner le responsable"
                                    searchable
                                    {...form.getInputProps('employeeId')}
                                />
                                <Select
                                    label="Catégorie"
                                    data={[
                                        { value: "Technical", label: "Technique" },
                                        { value: "Procedural", label: "Procédurale" },
                                        { value: "Training", label: "Formation" },
                                        { value: "Communication", label: "Communication" },
                                        { value: "Other", label: "Autre" },
                                    ]}
                                    withAsterisk
                                    size="sm"
                                    placeholder="Sélectionner la catégorie"
                                    {...form.getInputProps('category')}
                                />
                                <Select
                                    label="Statut"
                                    data={LESSON_STATUS_OPTIONS}
                                    placeholder="Sélectionner le statut"
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('status')}
                                />
                            </div>
                            <Textarea
                                label="Description de la leçon"
                                placeholder="Décrivez l'enseignement principal de cet incident, applicable à toute l'organisation"
                                withAsterisk
                                size="sm"
                                minRows={4}
                                {...form.getInputProps('description')}
                            />
                            <Group mt="xs" justify="end">
                                <Button size="sm" color="blue" type="submit">
                                    {selectedLesson ? "Mettre à jour la leçon" : "Enregistrer la leçon"}
                                </Button>
                            </Group>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded bg-blue-100 text-blue-800 border border-blue-200">
                                        {lessonCategoryLabel(form.values.category)}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        {form.values.date ? formatDateWithDay(form.values.date) : '—'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                                        <IconCircleCheck size={11} />
                                        {lessonStatusLabel(form.values.status)}
                                    </span>
                                </div>
                                <Button size="xs" variant="default" onClick={handleEdit}>Modifier</Button>
                            </div>
                            <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Description</p>
                                <p className="text-xs text-slate-700 leading-relaxed">{form.values.description || '—'}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <IconUser size={14} className="text-slate-400" />
                                <span className="text-slate-500">Responsable :</span>
                                <span className="text-slate-800">{getEmployeeNameById(form.values.employeeId)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* === Note explicative — sobre === */}
            <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3 flex items-start gap-2">
                <IconInfoCircle size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-xs text-slate-700 mb-0.5">À propos des leçons apprises</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Chaque incident peut avoir une leçon apprise unique pour garantir des enseignements
                        ciblés et de haute qualité, partageables dans toute l'organisation. La leçon doit capturer
                        l'apprentissage principal permettant de prévenir des incidents similaires.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Lesson;
