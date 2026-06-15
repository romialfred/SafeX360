import { Button, Select, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation('adhoc');
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
            actionName: (value) => (value.trim().length < 5 ? t('edit.validationActionNameMin') : null),
            description: (value) => (isValidRichText(value) ? null : t('edit.validationDescriptionRequired')),
            deadline: (value) => (value ? null : t('edit.validationDeadlineRequired')),
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
                    errorNotification(t('edit.pendingOnly'));
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
                errorNotification(err.response?.data?.errorMessage || t('edit.loadFailed'));
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
                successNotification(t('edit.updatedToast'));
                navigate('/adhoc-actions');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('edit.saveFailed'));
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
                    { label: t('edit.breadcrumbHome'), to: '/' },
                    { label: t('edit.breadcrumbCorrective') },
                    { label: t('edit.breadcrumbSuggestions'), to: '/adhoc-actions' },
                    { label: t('edit.breadcrumbEdit') },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title={t('edit.title')}
                subtitle={t('edit.subtitle')}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
                        <SectionCard
                            icon={<IconClipboardText size={15} stroke={1.8} />}
                            title={t('edit.descriptionSectionTitle')}
                            subtitle={t('edit.descriptionSectionSubtitle')}
                        >
                            <TextInput
                                withAsterisk
                                label={t('edit.actionNameLabel')}
                                placeholder={t('edit.actionNamePlaceholder')}
                                size="sm"
                                {...form.getInputProps('actionName')}
                            />
                            <TextEditor form={form} id="description" title={t('edit.descriptionLabel')} withAsterisk />
                        </SectionCard>

                        <SectionCard
                            icon={<IconUserCheck size={15} stroke={1.8} />}
                            title={t('edit.responsibilitySectionTitle')}
                            subtitle={t('edit.responsibilitySectionSubtitle')}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    data={employees.map(emp => ({ value: String(emp.id), label: emp.name }))}
                                    label={t('edit.assignedToLabel')}
                                    placeholder={t('edit.assignedToPlaceholder')}
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('assignedEmployeeId')}
                                />
                                <DateInput
                                    label={t('edit.deadlineLabel')}
                                    placeholder={t('edit.deadlinePlaceholder')}
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
                                {t('edit.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                disabled={loading}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                {t('edit.submit')}
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
                                    {t('edit.scopeTitle')}
                                </h4>
                                <p className="text-[12.5px] text-slate-600 leading-relaxed">
                                    {t('edit.scopeText')}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                    {t('edit.internalReference')} <span className="font-mono text-slate-700">SUG-{String(id)}</span>
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
