import { Button, Select, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    IconBolt,
    IconCalendarDue,
    IconClipboardText,
    IconDeviceFloppy,
    IconUserCheck,
} from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import TextEditor from "../../UtilityComp/TextEditor";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getActionById, updateCorrectiveAction } from "../../../services/CorrectiveActionService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { isValidRichText } from "../../../utility/OtherUtilities";
import { toIsoDateLocal } from "./adhocLabels";

/**
 * Modification d'une suggestion d'amélioration. Seules les suggestions en
 * attente d'approbation sont modifiables : l'historique et la progression
 * restent inchangés.
 */

const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
            <span className="inline-flex p-1.5 rounded-md bg-orange-50 text-orange-700">{icon}</span>
            <div>
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const EditAdhocAction = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            actionName: '',
            assignedEmployeeId: '',
            deadline: new Date(),
            description: '',
            ownerId: null as any,
            departmentId: null as any,
            id: null as any,
        },
        validate: {
            actionName: (value) => (value.trim().length < 5 ? "L'intitulé doit compter au moins 5 caractères" : null),
            description: (value) => (isValidRichText(value) ? null : 'La description est obligatoire'),
            deadline: (value) => (value ? null : "L'échéance est obligatoire"),
        },
    });

    useEffect(() => {
        getEmployeeDropdown()
            .then((res) => setEmployees(res))
            .catch(() => { });

        if (!id) return;
        getActionById(id)
            .then((res) => {
                const statusUpper = String(res?.status || '').toUpperCase();
                if (statusUpper !== 'PENDING') {
                    errorNotification('Seules les suggestions en attente peuvent être modifiées.');
                    navigate(`/adhoc-actions/adhocAction-details/${id}`);
                    return;
                }
                form.setValues({
                    ...res,
                    id: res.id,
                    actionName: res.actionName || '',
                    assignedEmployeeId: res.assignedEmployeeId ? String(res.assignedEmployeeId) : '',
                    deadline: res.deadline ? new Date(res.deadline) : new Date(),
                    description: res.description || '',
                    ownerId: res.ownerId ?? null,
                    departmentId: res.departmentId ?? null,
                });
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La suggestion n'a pas pu être chargée");
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = () => {
        setSubmitting(true);
        dispatch(showOverlay());

        const payload = {
            ...form.values,
            id: form.values.id ?? id,
            actionName: form.values.actionName.trim(),
            assignedEmployeeId: form.values.assignedEmployeeId ? Number(form.values.assignedEmployeeId) : null,
            deadline: form.values.deadline instanceof Date
                ? toIsoDateLocal(form.values.deadline)
                : form.values.deadline,
            description: form.values.description,
            ownerId: form.values.ownerId,
            departmentId: form.values.departmentId,
        };
        updateCorrectiveAction(payload)
            .then(() => {
                successNotification('Suggestion mise à jour');
                navigate('/adhoc-actions');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions Correctives' },
                    { label: "Suggestions d'amélioration", to: '/adhoc-actions' },
                    { label: 'Modifier la suggestion' },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title="Modifier la suggestion d'amélioration"
                subtitle="Ajuster l'intitulé, la description, le responsable ou l'échéance avant approbation"
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
                        <SectionCard
                            icon={<IconClipboardText size={15} stroke={1.8} />}
                            title="Description de la suggestion"
                            subtitle="Ce que l'idée doit améliorer, en termes concrets pour les équipes"
                        >
                            <TextInput
                                withAsterisk
                                label="Intitulé"
                                placeholder="ex. Installer un miroir convexe à la sortie de l'atelier maintenance Nord"
                                size="sm"
                                {...form.getInputProps('actionName')}
                            />
                            <TextEditor form={form} id="description" title="Description détaillée" withAsterisk />
                        </SectionCard>

                        <SectionCard
                            icon={<IconUserCheck size={15} stroke={1.8} />}
                            title="Responsabilité et échéance"
                            subtitle="Qui portera l'action et sous quel délai"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    data={employees.map(emp => ({ value: String(emp.id), label: emp.name }))}
                                    label="Assignée à"
                                    placeholder="Choisir un employé"
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('assignedEmployeeId')}
                                />
                                <DateInput
                                    label="Échéance"
                                    placeholder="Choisir une date"
                                    minDate={new Date()}
                                    size="sm"
                                    withAsterisk
                                    leftSection={<IconCalendarDue size={14} />}
                                    {...form.getInputProps('deadline')}
                                />
                            </div>
                        </SectionCard>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                disabled={submitting}
                                onClick={() => navigate('/adhoc-actions')}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                disabled={loading}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </div>

                    {/* ─── Volet informations ─────────────────────────────── */}
                    <aside className="xl:col-span-2">
                        <div className="sticky top-4 flex flex-col gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <h4
                                    className="text-slate-800 mb-2"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Portée de la modification
                                </h4>
                                <p className="text-[12.5px] text-slate-600 leading-relaxed">
                                    La modification ne porte que sur la fiche de la suggestion : l'historique des mises à
                                    jour et la progression restent inchangés. Une fois la suggestion approuvée, sa fiche
                                    n'est plus modifiable.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                    Référence interne : <span className="font-mono text-slate-700">SUG-{String(id)}</span>
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
};

export default EditAdhocAction;
