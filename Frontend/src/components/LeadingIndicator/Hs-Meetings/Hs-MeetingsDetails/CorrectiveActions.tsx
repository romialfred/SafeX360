import { useEffect, useState } from "react";
import { formatDateWithDay } from "../../../../utility/DateFormats";
import { Button, LoadingOverlay, Modal, Select, TextInput } from "@mantine/core";
import { createCorrectiveAction, getCorrectiveActionByActivityId } from "../../../../services/CorrectiveActionService";
import { useParams } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import EmptyState from "../../../UtilityComp/EmptyState";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { toLocalDate } from "../../../../utility/dateConversion";
import { IconClipboardCheck, IconPlus } from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { ACTION_PLAN_STATUS_OPTIONS, actionPlanStatusConfig, SERIF } from "../hsMeetingsLabels";

const CorrectiveActions = ({ employee, empMap }: any) => {
    const { id } = useParams();
    const [actions, setActions] = useState<any[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: any) => state.user);

    useEffect(() => {
        fetch();
    }, []);

    const fetch = () => {
        getCorrectiveActionByActivityId(id).then((res) => {
            setActions(res);
        }).catch((_err) => console.error(_err));
    };

    const actionForm = useForm({
        initialValues: {
            actionName: "",
            assignedEmployeeId: "",
            deadline: "",
            status: "",
            description: "",
            hsActivityId: id,
        },
        validate: {
            actionName: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "L'intitulé du plan d'action est requis";
                return trimmed.length > 50 ? "50 caractères maximum" : null;
            },
            assignedEmployeeId: (value) => (!value ? "Le responsable est requis" : null),
            deadline: (value) => (!value ? "L'échéance est requise" : null),
            status: (value) => (!value ? "Le statut est requis" : null),
        }
    });

    const handleSubmit = (values: any) => {
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer l'ajout</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Ajouter le plan d'action <strong>{values.actionName}</strong> à cette activité ?
                </span>
            ),
            labels: { confirm: "Oui, ajouter", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "teal", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                const data = {
                    ...values,
                    deadline: toLocalDate(values.deadline),
                    departmentId: values.assignedEmployeeId ? empMap[values.assignedEmployeeId]?.departmentId : user.departmentId,
                    ownerId: values.assignedEmployeeId ?? user.id,
                    assignedEmployeeId: values.assignedEmployeeId ?? user.id,
                };
                setLoading(true);
                createCorrectiveAction(data)
                    .then(() => {
                        successNotification("Plan d'action ajouté");
                        close();
                        actionForm.reset();
                        fetch();
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "L'ajout du plan d'action a échoué");
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            },
        });
    };

    const onAddActionPlan = () => {
        actionForm.reset();
        open();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14.5px', fontWeight: 600 }}>
                    Actions correctives
                </h4>
                <Button
                    size="sm"
                    color="teal"
                    leftSection={<IconPlus size={15} />}
                    onClick={onAddActionPlan}
                >
                    Ajouter une action
                </Button>
            </div>

            {actions?.length === 0 && (
                <EmptyState
                    icon={<IconClipboardCheck size={22} />}
                    title="Aucune action corrective"
                    description="Les actions décidées lors de cette activité apparaîtront ici."
                    compact
                />
            )}
            {actions?.map((x: any, index: any) => {
                const statusCfg = actionPlanStatusConfig(x.status);
                return (
                    <div
                        key={index}
                        className="border border-slate-200 bg-white rounded-lg p-3 shadow-sm mb-3 flex flex-col gap-1"
                    >
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-[13px] text-slate-800">{x.actionName}</p>
                                <p className="text-[11.5px] text-slate-500">Responsable : <strong>{x.assignedEmployeeName}</strong></p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${statusCfg.chip}`}>
                                {statusCfg.label}
                            </span>
                        </div>

                        <SafeHtml html={x.description} className="text-slate-600 text-[12.5px]" />

                        <div className="text-[12.5px] text-slate-700">
                            <b>Échéance :</b>{' '}
                            <span className="text-teal-700">{formatDateWithDay(x.deadline)}</span>
                        </div>
                    </div>
                );
            })}

            <Modal
                opened={opened}
                size="xl"
                onClose={close}
                centered
                closeOnClickOutside={false}
                closeOnEscape={false}
                title={
                    <span className="text-base text-slate-800" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        Ajouter un plan d'action
                    </span>
                }
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                <form className="grid grid-cols-1 gap-4" onSubmit={actionForm.onSubmit(handleSubmit)}>
                    <TextInput size="sm" withAsterisk {...actionForm.getInputProps('actionName')} label="Intitulé du plan d'action" placeholder="ex. Baliser la zone de stockage des produits chimiques" />
                    <Select size="sm" withAsterisk {...actionForm.getInputProps('assignedEmployeeId')} data={employee} label="Responsable" placeholder="Sélectionner le responsable" />
                    <DateInput size="sm" withAsterisk {...actionForm.getInputProps('deadline')} label="Échéance" placeholder="Sélectionner l'échéance" />
                    <Select size="sm" withAsterisk {...actionForm.getInputProps('status')} data={ACTION_PLAN_STATUS_OPTIONS} label="Statut" placeholder="Sélectionner le statut" />
                    <TextEditor withAsterisk form={actionForm} id="description" title="Description" />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="default" size="sm" onClick={close}>
                            Annuler
                        </Button>
                        <Button type="submit" color="teal" size="sm" loading={loading}>
                            Ajouter
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CorrectiveActions;
