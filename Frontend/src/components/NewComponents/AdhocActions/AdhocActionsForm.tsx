import { Button, Select, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { createCorrectiveAction } from "../../../services/CorrectiveActionService";
import ActionClassificationFields from "../../LaggingIndicator/CorrectiveAction/ActionClassificationFields";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { isValidRichText } from "../../../utility/OtherUtilities";
import { adhocStatusConfig, toIsoDateLocal } from "./adhocLabels";

/**
 * Création d'une suggestion d'amélioration : saisie sectionnée à gauche,
 * rappel du circuit d'approbation à droite. La suggestion est créée en
 * attente puis transmise au responsable pour validation.
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

const AdhocActionsForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const user = useSelector((state: any) => state.user);
    const { t } = useTranslation('adhoc');
    // Libellé bilingue du statut : clé i18n `adhoc:state.*`, repli sur le libellé FR centralisé (adhocLabels.ts).
    const tState = (state?: string | null, fallback?: string) =>
        t(`state.${(state ?? '').toUpperCase()}`, { defaultValue: fallback ?? (state ?? '—') });

    const form = useForm({
        initialValues: {
            actionName: '',
            assignedEmployeeId: '',
            deadline: new Date(),
            status: 'PENDING',
            description: '',
            ownerId: user?.id || null,
            departmentId: user?.departmentId || null,
            // Classification ISO 45001 §8.1.2 / §10.2 (hiérarchie obligatoire).
            controlHierarchy: '',
            actionType: '',
            priority: 'P2',
        },
        validate: {
            actionName: (value) => (value.trim().length < 5 ? t('form.validationActionNameMin') : null),
            description: (value) => (isValidRichText(value) ? null : t('form.validationDescriptionRequired')),
            deadline: (value) => (value ? null : t('form.validationDeadlineRequired')),
            controlHierarchy: (value) => (value ? null : 'La hiérarchie de maîtrise est requise (§8.1.2).'),
        },
    });

    useEffect(() => {
        getEmployeeDropdown()
            .then((res) => setEmployees(res))
            .catch((err) => console.error(err));
    }, []);

    const handleSubmit = () => {
        // Garde hydratation Redux : ownerId/departmentId sont figés dans initialValues
        // au montage ; si l'utilisateur n'est pas encore résolu ils partiraient null
        // (400 backend). On bloque et on relit l'utilisateur courant au submit.
        if (!user?.id) {
            errorNotification(t('form.createFailed'));
            return;
        }
        setSubmitting(true);
        dispatch(showOverlay());

        const payload = {
            ...form.values,
            ownerId: user.id,
            departmentId: user.departmentId ?? null,
            actionName: form.values.actionName.trim(),
            deadline: form.values.deadline instanceof Date
                ? toIsoDateLocal(form.values.deadline)
                : null,
            // Enums : '' (non renseigné) → null pour éviter un 400 Jackson.
            controlHierarchy: form.values.controlHierarchy || null,
            actionType: form.values.actionType || null,
            priority: form.values.priority || null,
        };

        createCorrectiveAction(payload)
            .then(() => {
                successNotification(t('form.createdToast'));
                navigate("/adhoc-actions");
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('form.createFailed'));
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    const pendingCfg = adhocStatusConfig('PENDING');

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('form.breadcrumbHome'), to: '/' },
                    { label: t('form.breadcrumbCorrective') },
                    { label: t('form.breadcrumbSuggestions'), to: '/adhoc-actions' },
                    { label: t('form.breadcrumbNew') },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title={t('form.title')}
                subtitle={t('form.subtitle')}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
                        <SectionCard
                            icon={<IconClipboardText size={15} stroke={1.8} />}
                            title={t('form.descriptionSectionTitle')}
                            subtitle={t('form.descriptionSectionSubtitle')}
                        >
                            <TextInput
                                withAsterisk
                                label={t('form.actionNameLabel')}
                                placeholder={t('form.actionNamePlaceholder')}
                                size="sm"
                                {...form.getInputProps('actionName')}
                            />
                            <TextEditor form={form} id="description" title={t('form.descriptionLabel')} withAsterisk />
                        </SectionCard>

                        <SectionCard
                            icon={<IconClipboardText size={15} stroke={1.8} />}
                            title="Classification de l'action (ISO 45001 §8.1.2)"
                            subtitle="Hiérarchie de maîtrise, nature et priorité"
                        >
                            <ActionClassificationFields form={form} />
                        </SectionCard>

                        <SectionCard
                            icon={<IconUserCheck size={15} stroke={1.8} />}
                            title={t('form.responsibilitySectionTitle')}
                            subtitle={t('form.responsibilitySectionSubtitle')}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    data={employees.map(emp => ({ value: "" + emp.id, label: emp.name }))}
                                    label={t('form.assignedToLabel')}
                                    placeholder={t('form.assignedToPlaceholder')}
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('assignedEmployeeId')}
                                />
                                {/* Échéance ≥ date de création (règle portée par le
                                    serveur : ACTION_DEADLINE_BEFORE_CREATION). L'IHM
                                    se contente de l'annoncer en interdisant la
                                    sélection d'une date passée. */}
                                <DateInput
                                    label={t('form.deadlineLabel')}
                                    placeholder={t('form.deadlinePlaceholder')}
                                    size="sm"
                                    withAsterisk
                                    minDate={new Date()}
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
                                {t('form.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                {t('form.submit')}
                            </Button>
                        </div>
                    </div>

                    {/* ─── Volet circuit d'approbation ─────────────────────── */}
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
                                    {t('form.approvalCircuitTitle')}
                                </h4>
                                <p className="text-[12.5px] text-slate-600 leading-relaxed">
                                    {t('form.approvalCircuitPrefix')}{' '}
                                    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider align-middle ${pendingCfg.chip}`}>
                                        {tState('PENDING', pendingCfg.label)}
                                    </span>{' '}
                                    {t('form.approvalCircuitSuffix')}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <h5 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">{t('form.tipsTitle')}</h5>
                                <ul className="text-[11.5px] text-slate-600 space-y-1 list-disc list-inside">
                                    <li>{t('form.tip1')}</li>
                                    <li>{t('form.tip2')}</li>
                                    <li>{t('form.tip3')}</li>
                                    <li>{t('form.tip4')}</li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
};

export default AdhocActionsForm;
