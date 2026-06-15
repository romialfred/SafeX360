import { ActionIcon, Button, Fieldset, Select, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import TextEditor from "../../../UtilityComp/TextEditor";
import { useEffect, useState } from "react";
import { getEmployeeDropdown } from "../../../../services/EmployeeService";
import { modals } from "@mantine/modals";
import { removeCorrectiveAction } from "../../../../services/CorrectiveActionService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { ACTION_STATUS_OPTIONS } from "../incidentLabels";
import { useTranslation } from "react-i18next";


const InvestigationPlan = ({ form, incident }: any) => {
    const { t } = useTranslation('incidents');
    const [emps, setEmps] = useState([]);

    const handleAddIncident = () => {
        form.insertListItem('correctiveActions', {
            actionName: '',
            deadline: '',
            assignedEmployeeId: "",
            status: "",
            description: ""
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
                <Select withAsterisk {...form.getInputProps(`correctiveActions.${index}.status`)} data={ACTION_STATUS_OPTIONS} label={t('investigation.plan.statusLabel')} placeholder={t('investigation.plan.statusPlaceholder')} />
                <div className='col-span-2'>

                    <TextEditor withAsterisk form={form} id={`correctiveActions.${index}.description`} title={t('investigation.plan.descriptionLabel')} />
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