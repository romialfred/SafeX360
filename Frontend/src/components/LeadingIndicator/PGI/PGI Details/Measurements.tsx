import { Button, Group, LoadingOverlay, Modal, NumberInput, Select, TextInput, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { useDispatch, useSelector } from "react-redux";
import TextEditor from "../../../UtilityComp/TextEditor";
import EmptyState from "../../../UtilityComp/EmptyState";
import { getAllActiveMeasurement } from "../../../../services/TechMeasurementService";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { successNotification, errorNotification } from "../../../../utility/NotificationUtility";
import { createCorrectiveAction } from "../../../../services/CorrectiveActionService";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { addInspectionMeasurement, getMeasurementsByInspectionId, removeInsMeasurement } from "../../../../services/InspectionProcessService";
import { ACTION_STATUS_OPTIONS, SECTION_TITLE_STYLE } from "../pgiLabels";

/**
 * Mesures techniques rattachées au dossier d'inspection : valeur relevée,
 * comparaison au seuil et plan d'action correctif en cas de dépassement.
 */
const Measurements = ({ employee, empMap }: any) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [measurement, setMeasurement] = useState<any>([]);
    const [record, setMeasurementRecord] = useState<Record<string, any>>({});
    const [measurementsData, setMeasurementsData] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState<any>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);
    const [_actionIndex, setActionIndex] = useState<number | null>(null);
    const user = useSelector((state: any) => state.user)

    const form = useForm({
        initialValues: {
            measurementId: '',
            value: '',
            generalInspectionId: id,
        },
    });
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
    });

    useEffect(() => {
        getAllActiveMeasurement().then((res) => {
            setMeasurement(res);
            setMeasurementRecord(mapIdToName(res));
        }).catch((_err) => console.error(_err));
        fetchData();
    }, []);

    const fetchData = () => {
        getMeasurementsByInspectionId(id).then((res) => {
            setMeasurementsData(res);
        }).catch((_error) => console.error(_error))
    };

    useEffect(() => {
        if (measurementsData && measurementsData.length > 0) {
            const selectedIds = measurementsData.map((item: any) => Number(item.measurementId));
            setSelectedMeasurement(selectedIds);
        } else {
            setSelectedMeasurement([]);
        }
    }, [measurementsData]);

    const handleAddMeasurement = (values: any) => {
        dispatch(showOverlay());
        addInspectionMeasurement(values).then((_res) => {
            successNotification("Mesure ajoutée");
            form.reset();
            setShowAddForm(false);
            fetchData();
        }).catch((error) => {
            errorNotification(error?.response?.data?.errorMessage || "L'ajout de la mesure a échoué")
        }).finally(() => {
            dispatch(hideOverlay());
        })
    };

    const handleRemove = (rowId: any) => {
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
                removeInsMeasurement(rowId)
                    .then(() => {
                        setMeasurementsData([...measurementsData.filter((x) => x.id !== rowId)]);
                        successNotification("Mesure retirée");
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Le retrait de la mesure a échoué");
                    });
            },
        });
    };

    const onAddActionPlan = (index: number) => {
        setActionIndex(index);
        actionForm.reset();
        open();
    };

    const handleClose = () => {
        close();
        setActionIndex(null);
    };

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
                const data = {
                    ...values,
                    departmentId: values.assignedEmployeeId ? empMap[values.assignedEmployeeId]?.departmentId : user.departmentId,
                    ownerId: values.assignedEmployeeId ?? user.id,
                    assignedEmployeeId: values.assignedEmployeeId ?? user.id,
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
                    });
            },
        });
    };

    const isExceeded = typeof form.values.value === 'number' && (form.values.value > record[form.values.measurementId]?.threshold);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-slate-800" style={SECTION_TITLE_STYLE}>
                    Mesures techniques
                </h3>
                {!showAddForm && (
                    <Button color="teal" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setShowAddForm(true)}>
                        Ajouter une mesure
                    </Button>
                )}
            </div>
            {showAddForm && (
                <form className="bg-white rounded-xl border border-slate-200 p-4 space-y-4" onSubmit={form.onSubmit(handleAddMeasurement)}>
                    <Group grow align="start">
                        <Select
                            label="Mesure"
                            placeholder="Sélectionner la mesure à relever"
                            data={measurement.filter((x: any) => !selectedMeasurement.includes(x.id)).map((x: any) => ({ value: "" + x.id, label: x.name }))}
                            {...form.getInputProps("measurementId")}
                            withAsterisk
                            size="sm"
                            searchable
                        />
                        <NumberInput
                            label={
                                form.values.measurementId
                                    ? `Valeur relevée (seuil : ${record[form.values.measurementId]?.threshold ?? '—'}${record[form.values.measurementId]?.unit ?? ''})`
                                    : 'Valeur relevée'
                            }
                            {...form.getInputProps("value")}
                            withAsterisk
                            size="sm"
                            error={isExceeded ? 'Valeur supérieure au seuil autorisé' : undefined}
                        />
                    </Group>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button type="button" variant="default" size="sm" onClick={() => setShowAddForm(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" color="teal" size="sm" disabled={!form.values.measurementId}>
                            Ajouter la mesure
                        </Button>
                    </div>
                </form>
            )}
            {!showAddForm && measurementsData?.length === 0 && (
                <EmptyState
                    title="Aucune mesure relevée"
                    description="Ajoutez les mesures techniques relevées sur le terrain (bruit, poussières, gaz…)."
                    compact
                />
            )}
            {!showAddForm && measurementsData?.map((x: any, index: number) => {
                const value = x.value;
                const threshold = record[x.measurementId]?.threshold;
                const unit = record[x.measurementId]?.unit;
                const exceeded = typeof value === 'number' && (value > threshold);
                return (
                    <div key={x.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-slate-800" style={SECTION_TITLE_STYLE}>
                                {record[x.measurementId]?.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${
                                        exceeded
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                >
                                    Seuil : {threshold}{unit}
                                </span>
                                <Tooltip label="Retirer la mesure" withArrow>
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant="light"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={() => handleRemove(x.id)}
                                    >
                                        Retirer
                                    </Button>
                                </Tooltip>
                            </div>
                        </header>
                        <div className="p-4 space-y-2">
                            <p className="text-[13px] text-slate-700">
                                Valeur relevée :{' '}
                                <span className={`tabular-nums ${exceeded ? 'text-rose-700' : 'text-slate-900'}`}>
                                    {value}{unit}
                                </span>
                            </p>
                            {exceeded && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        leftSection={<IconAlertCircle size={14} />}
                                        color="red"
                                        size="xs"
                                        onClick={() => onAddActionPlan(index)}
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
                        placeholder="ex. Réviser le système d'aspiration de l'atelier de concassage"
                        className="col-span-2"
                    />
                    <Select
                        withAsterisk
                        size="sm"
                        {...actionForm.getInputProps(`assignedEmployeeId`)}
                        data={employee}
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
        </div>
    );
}

export default Measurements;
