import { Button, LoadingOverlay, Modal, NumberInput, Select, TextInput, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { getAllActiveMeasurement } from "../../../../services/TechMeasurementService";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import SearchableObjectDropdown from "../../../UtilityComp/SearchableDropdown";
import { removeInsMeasurement } from "../../../../services/InspectionProcessService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import TextEditor from "../../../UtilityComp/TextEditor";
import { createCorrectiveAction } from "../../../../services/CorrectiveActionService";
import { ACTION_STATUS_OPTIONS } from "../pgiLabels";
import { useSelector } from "react-redux";
import { toLocalDate } from "../../../../utility/dateConversion";

/**
 * Mesures techniques relevées en cours d'inspection (brouillon) : saisie de
 * la valeur, comparaison au seuil et création d'un plan d'action si dépassé.
 */
const Measurement = ({ form, employee }: any) => {
    const { id } = useParams();
    const [measurement, setMeasurement] = useState<any>([]);
    const [record, setMeasurementRecord] = useState<Record<string, any>>({});
    const [selectedMeasurement, setSelectedMeasurement] = useState<any>([]);

    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: any) => state.user);

    useEffect(() => {
        getAllActiveMeasurement().then((res) => {
            setMeasurement(res);
            setMeasurementRecord(mapIdToName(res));
        }).catch((_err) => console.error(_err))
    }, [])

    useEffect(() => {
        if (form.values.measurements && form.values.measurements.length > 0) {
            const selectedIds = form.values.measurements.map((item: any) => Number(item.measurementId));
            setSelectedMeasurement(selectedIds);
        }
    }, [form.values.measurements]);

    const handleItemSelect = (item: any) => {
        form.insertListItem('measurements', {
            measurementId: item.id,
            value: "",
            generalInspectionId: id
        });
    }

    const handleItemDelete = (index: number) => {
        form.removeListItem('measurements', index);
        setSelectedMeasurement((prev: any) => {
            const newSelectedChecklist = [...prev];
            newSelectedChecklist.splice(index, 1);
            return newSelectedChecklist;
        });
    }

    const onAddActionPlan = () => {
        actionForm.reset();
        open();
    }

    const handleRemove = (index: number, measurementRowId: any) => {
        if (measurementRowId) {
            modals.openConfirmModal({
                title: <span className="text-base">Retirer la mesure</span>,
                centered: true,
                children: (
                    <span className="text-sm">
                        Souhaitez-vous retirer cette mesure de l'inspection ? Cette action est définitive.
                    </span>
                ),
                labels: { confirm: 'Oui, retirer', cancel: 'Annuler' },
                cancelProps: { color: 'gray', variant: 'default' },
                confirmProps: { color: 'red', variant: 'filled' },
                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    handleItemDelete(index);
                    removeInsMeasurement(measurementRowId)
                        .then(() => {
                            successNotification("Mesure retirée");
                        })
                        .catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Le retrait de la mesure a échoué");
                        })
                },
            });
        } else {
            handleItemDelete(index);
        }
    }

    const actionForm = useForm({
        initialValues: {
            actionName: "",
            assignedEmployeeId: "",
            deadline: "",
            status: "",
            description: "",
            generalInspectionId: id,
        },
        validate: {
            actionName: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom du plan d'action est obligatoire";
                return trimmed.length > 50 ? '50 caractères maximum' : null;
            },
            assignedEmployeeId: (value) => (!value ? 'Sélectionnez un responsable' : null),
            deadline: (value) => (!value ? 'Sélectionnez une échéance' : null),
            status: (value) => (!value ? 'Sélectionnez un statut' : null),
        }
    })

    const handleClose = () => {
        close();
    }

    const handleSubmit = (values: any) => {
        modals.openConfirmModal({
            title: <span className="text-base">Créer le plan d'action</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Confirmer la création de ce plan d'action correctif ?
                </span>
            ),
            labels: { confirm: 'Oui, créer', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: 'teal', variant: 'filled' },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                // Sérialiser l'échéance en LocalDate + renseigner owner/département
                // (aligné sur CorrectiveActions.tsx ; le DTO attend ces champs).
                const data = {
                    ...values,
                    deadline: toLocalDate(values.deadline),
                    departmentId: user?.departmentId,
                    ownerId: values.assignedEmployeeId ?? user?.id,
                    assignedEmployeeId: values.assignedEmployeeId ?? user?.id,
                };
                setLoading(true);
                createCorrectiveAction(data)
                    .then(() => {
                        successNotification("Plan d'action créé");
                        close();
                        actionForm.reset();
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "La création du plan d'action a échoué");
                    })
                    .finally(() => {
                        setLoading(false);
                    })
            },
        });
    }

    return (
        <div className="flex flex-col gap-4">
            {form.values.measurements.map((x: any, index: any) => {
                const value = form.values.measurements[index].value;
                // Coercition : Mantine NumberInput peut émettre un string en cours de saisie ;
                // le seuil doit déclencher dans les deux cas dès qu'on a un nombre valide.
                const numericValue = typeof value === 'number' ? value : (value !== '' && value !== null && value !== undefined ? Number(value) : NaN);
                const threshold = record[x.measurementId]?.threshold;
                const isExceeded = Number.isFinite(numericValue) && Number.isFinite(threshold) && (numericValue > threshold);

                return (
                    <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
                            <h3
                                className="text-slate-800"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                            >
                                {record[x.measurementId]?.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${
                                        isExceeded
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                >
                                    Seuil : {record[x.measurementId]?.threshold}{record[x.measurementId]?.unit}
                                </span>
                                <Tooltip label="Retirer la mesure" withArrow>
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant="light"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={() => handleRemove(index, x.id)}
                                    >
                                        Retirer
                                    </Button>
                                </Tooltip>
                            </div>
                        </header>
                        <div className="p-4 space-y-3">
                            <NumberInput
                                label={`Valeur relevée (${record[x.measurementId]?.unit})`}
                                size="sm"
                                {...form.getInputProps(`measurements.${index}.value`)}
                                error={isExceeded ? 'Valeur supérieure au seuil autorisé' : undefined}
                            />
                            {isExceeded && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        leftSection={<IconAlertCircle size={14} />}
                                        color="red"
                                        size="xs"
                                        onClick={onAddActionPlan}
                                    >
                                        Créer un plan d'action
                                    </Button>
                                    <p className="text-[11.5px] text-slate-500">
                                        Seuil dépassé : un plan d'action correctif est attendu.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <Modal
                opened={opened}
                size="xl"
                onClose={handleClose}
                centered
                closeOnClickOutside={false}
                closeOnEscape={false}
                title={<span className="text-base text-slate-900">Nouveau plan d'action</span>}
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                <form className="grid grid-cols-2 gap-4" onSubmit={actionForm.onSubmit(handleSubmit)}>
                    <TextInput
                        withAsterisk
                        size="sm"
                        {...actionForm.getInputProps(`actionName`)}
                        label="Nom du plan d'action"
                        placeholder="ex. Remplacer le silencieux du compresseur de l'atelier Nord"
                        className="col-span-2"
                    />
                    <Select
                        withAsterisk
                        size="sm"
                        {...actionForm.getInputProps(`assignedEmployeeId`)}
                        data={employee?.map((x: any) => ({ value: "" + x.id, label: x.name }))}
                        label="Responsable"
                        placeholder="Sélectionner le responsable"
                        searchable
                    />
                    <DateInput
                        withAsterisk
                        size="sm"
                        {...actionForm.getInputProps(`deadline`)}
                        label="Échéance"
                        placeholder="JJ/MM/AAAA"
                        valueFormat="DD/MM/YYYY"
                    />
                    <Select
                        withAsterisk
                        size="sm"
                        {...actionForm.getInputProps(`status`)}
                        data={ACTION_STATUS_OPTIONS}
                        label="Statut"
                        placeholder="Sélectionner le statut"
                        className="col-span-2"
                    />
                    <div className="col-span-2">
                        <TextEditor withAsterisk form={actionForm} id={`description`} title="Description" />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button type="button" variant="default" size="sm" onClick={close}>
                            Annuler
                        </Button>
                        <Button type="submit" color="teal" size="sm">
                            Créer le plan d'action
                        </Button>
                    </div>
                </form>
            </Modal>

            <SearchableObjectDropdown items={measurement.filter((x: any) => !selectedMeasurement.includes(x.id))} onItemSelect={handleItemSelect} />
        </div>
    )
}

export default Measurement
