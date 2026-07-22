import { ActionIcon, Button, Fieldset, Select, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import TextEditor from "../../../UtilityComp/TextEditor";
import { useEffect, useState } from "react";
import { getEmployeeDropdown } from "../../../../services/EmployeeService";
import { modals } from "@mantine/modals";
import { removeCorrectiveAction } from "../../../../services/CorrectiveActionService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { adhocStatusConfig } from "../../../NewComponents/AdhocActions/adhocLabels";
import { useTranslation } from "react-i18next";
import ActionClassificationFields from "../../CorrectiveAction/ActionClassificationFields";
import { listCausesByIncident } from "../../../../services/IncidentCauseService";


const InvestigationPlan = ({ form, incident }: any) => {
    const { t } = useTranslation('incidents');
    const [emps, setEmps] = useState([]);
    // Causes structurées de l'incident (E1.2) — pour relier chaque action à LA
    // cause qu'elle traite (traçabilité cause→action, ISO 45001 §10.2 a-b).
    const [causeOptions, setCauseOptions] = useState<{ value: string; label: string }[]>([]);

    const handleAddIncident = () => {
        form.insertListItem('correctiveActions', {
            actionName: '',
            deadline: '',
            assignedEmployeeId: "",
            // Statut par défaut PENDING : une chaîne vide partait telle quelle
            // vers l'enum ActionStatus côté backend → 400 (désérialisation) qui
            // faisait échouer TOUTE la soumission d'investigation.
            status: "PENDING",
            description: "",
            // Classification ISO 45001 §8.1.2 / §10.2.
            controlHierarchy: '',
            actionType: '',
            priority: 'P2',
            causeId: null,
        });
    }

    useEffect(() => {
        getEmployeeDropdown()
            .then((res: any) => {
                const formatted = res
                    ?.filter((emp: any) => emp?.id && emp?.name)
                    .map((emp: any) => ({
                        value: String(emp.id),
                        label: emp.name
                    }));
                setEmps(formatted);
            })
            .catch((_err: any) => { });
    }, []);

    useEffect(() => {
        if (!incident?.id) return;
        listCausesByIncident(incident.id)
            .then((causes) => setCauseOptions(
                (causes || [])
                    .filter((c) => c.id != null)
                    .map((c) => ({ value: String(c.id), label: c.label })),
            ))
            .catch(() => setCauseOptions([]));
    }, [incident?.id]);



    const handleRemoveActionPlan = (index: number, id: any) => {
        if (id) {
            modals.openConfirmModal({
                title: <span className='text-lg'>{t('investigation.plan.deleteModalTitle')}</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        {t('investigation.plan.deleteModalBody')}
                    </span>
                ),
                labels: { confirm: t('investigation.plan.delete'), cancel: t('investigation.plan.cancel') },
                cancelProps: { variant: "default" },
                confirmProps: { color: 'red', variant: "filled" },

                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    form.removeListItem('correctiveActions', index);
                    removeCorrectiveAction(id)
                        .then((_res) => {
                            successNotification(t('investigation.plan.actionDeleted'));
                        }
                        ).catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || t('investigation.plan.deleteError'));
                        }
                        )
                },
            });
        }
        else {
            form.removeListItem('correctiveActions', index);
        }
    }

    return (
        <div className="flex flex-col p-5 gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg text-gray-800 ">{t('investigation.plan.title')}</h3>
                    <p>{t('investigation.plan.subtitle')}</p>
                </div>


                <Button onClick={handleAddIncident} leftSection={<IconPlus />} variant="gradient">{t('investigation.plan.addAction')}</Button>
            </div>
            {form?.values.correctiveActions && form?.values.correctiveActions.map((x: any, index: any) => <Fieldset className="grid grid-cols-2 gap-6" legend={<div className="flex gap-5">
                <div className="text-lg text-blue-500">{t('investigation.plan.actionLabel', { index: index + 1 })}</div>
                <ActionIcon onClick={() => handleRemoveActionPlan(index, x.id)} variant="filled" color="red" aria-label={t('investigation.plan.removeAction')}>
                    <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </div>}>
                <TextInput withAsterisk {...form.getInputProps(`correctiveActions.${index}.actionName`)} label={t('investigation.plan.actionNameLabel')} placeholder={t('investigation.plan.actionNamePlaceholder')} />
                <Select {...form.getInputProps(`correctiveActions.${index}.assignedEmployeeId`)} data={emps} label={t('investigation.plan.ownerLabel')} placeholder={t('investigation.plan.ownerPlaceholder')} />
                <DateInput withAsterisk {...form.getInputProps(`correctiveActions.${index}.deadline`)} minDate={incident?.discoveryDate ? new Date(incident.discoveryDate) : undefined} label={t('investigation.plan.deadlineLabel')} placeholder={t('investigation.plan.deadlinePlaceholder')} />
                {/* Statut : affiché, jamais choisi (spec 2.3). Une action naît « En
                    attente » — addCorrectiveAction impose ActionStatus.PENDING — et
                    son statut transite ensuite par les actions dédiées. Le <Select>
                    précédent était donc décoratif : ce qu'il promettait, le serveur
                    ne le tenait pas. */}
                {(() => {
                    const cfg = adhocStatusConfig(x.id ? x.status : 'PENDING');
                    return (
                        <div>
                            <div className="text-sm text-slate-700 mb-1">{t('investigation.plan.statusLabel')}</div>
                            <div className="flex items-center h-9">
                                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${cfg.chip}`}>
                                    {cfg.label}
                                </span>
                            </div>
                        </div>
                    );
                })()}
                <div className='col-span-2'>

                    <TextEditor withAsterisk form={form} id={`correctiveActions.${index}.description`} title={t('investigation.plan.descriptionLabel')} />
                </div>
                {/* Classification §8.1.2/§10.2 + lien vers LA cause traitée (§10.2 a-b). */}
                <div className='col-span-2 space-y-3 border-t border-slate-200 pt-3'>
                    <ActionClassificationFields form={form} prefix={`correctiveActions.${index}.`} requireHierarchy={false} />
                    {causeOptions.length > 0 && (
                        <Select
                            size="sm"
                            clearable
                            label="Cause traitée par cette action"
                            placeholder="Relier à une cause de l'analyse causale"
                            data={causeOptions}
                            comboboxProps={{ withinPortal: true }}
                            {...form.getInputProps(`correctiveActions.${index}.causeId`)}
                        />
                    )}
                </div>
            </Fieldset>)}

            {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-600 shadow-sm">
                <h2 className="text-lg text-blue-500 mb-4">Action Plans Summary</h2>

                <div className="flex  gap-3">
                    <ul className="space-y-3 flex items-center gap-4 text-gray-700">
                        <li className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <IconClock className="text-yellow-500" size={20} />
                                <span>Pending</span>
                            </div>
                            <span className="font-medium">0</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <IconLoader2 className="text-blue-500" size={20} />
                                <span>In Progress</span>
                            </div>
                            <span className="font-medium">1</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <IconCheck className="text-green-600" size={20} />
                                <span>Completed</span>
                            </div>
                            <span className="font-medium">0</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <IconAlertTriangle className="text-red-500" size={20} />
                                <span>Overdue</span>
                            </div>
                            <span className="font-medium">0</span>
                        </li>
                    </ul>
                </div>
            </div> */}
        </div>
    )
}

export default InvestigationPlan