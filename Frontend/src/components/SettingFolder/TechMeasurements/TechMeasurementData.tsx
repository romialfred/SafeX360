import {
    Button,
    LoadingOverlay,
    Modal,
    Select,
    Textarea,
    TextInput,
} from "@mantine/core";
import { IconRuler2, IconCircleCheck, IconMathFunction } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import {
    errorNotification,
    successNotification,
} from "../../../utility/NotificationUtility";
import { modals } from "@mantine/modals";
import { useDispatch } from "react-redux";
import {
    hideOverlay,
    showOverlay,
} from "../../../slices/OverlaySlice";
import {
    activateMeasurement,
    createMeasurement,
    deactivateMeasurement,
    GetAllMeasurement,
    updateMeasurement,
} from "../../../services/TechMeasurementService";
import { Z } from '../../../constants/zIndex';
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

const TechMeasurementData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const dispatch = useDispatch();
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            name: "",
            unit: "",
            normalValue: "",
            threshold: "",
            description: "",
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom de la mesure est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            unit: (value) =>
                value ? null : "L'unité est obligatoire",
            normalValue: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "La valeur normale est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            threshold: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le seuil d'alerte est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "La description est obligatoire";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "250 caractères maximum" : null;
            }
        },
    });

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            unit: rowData.unit,
            normalValue: rowData.normalValue,
            threshold: rowData.threshold,
            description: rowData.description,
        });
        open();
    };

    useEffect(() => {
        setLoading(true);
        GetAllMeasurement({})
            .then((res) => {
                setData(res);
            })
            .catch((err) => {
                errorNotification(
                    err.response?.data?.errorMessage || "Échec du chargement des mesures techniques"
                );
            })
            .finally(() => setLoading(false));
    }, []);

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";

        modals.openConfirmModal({
            title: <span className="text-2xl">Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> la mesure technique :{" "}
                    <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: "Annuler" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: {
                color: action === "activate" ? "green" : "red",
                variant: "filled",
            },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall =
                    action === "activate" ? activateMeasurement : deactivateMeasurement;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(
                            action === "activate"
                                ? "Mesure technique activée avec succès"
                                : "Mesure technique désactivée avec succès"
                        );
                        const updatedData = data.map((item) =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(
                            action === "activate"
                                ? "Échec de l'activation de la mesure technique"
                                : "Échec de la désactivation de la mesure technique"
                        );
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            const payload = { ...selectedRow, ...values };
            updateMeasurement(payload)
                .then(() => {
                    successNotification("Mesure technique modifiée avec succès");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id ? { ...item, ...values } : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => setLoading(false));
        } else {
            createMeasurement(values)
                .then((res) => {
                    successNotification("Mesure technique ajoutée avec succès");
                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                    };
                    setData((prev) => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => setLoading(false));
        }
    };

    return (
        <>
            <ReferencePanel<any>
                stats={[
                    { label: 'Mesures', value: data.length, icon: IconRuler2, tone: 'teal' },
                    { label: 'Actives', value: data.filter((d: any) => String(d?.status).toUpperCase() === 'ACTIVE').length, icon: IconCircleCheck, tone: 'emerald' },
                    { label: 'Unités distinctes', value: new Set(data.map((d: any) => d?.unit).filter(Boolean)).size, icon: IconMathFunction, tone: 'sky' },
                ]}
                newLabel="Nouvelle mesure technique"
                onNew={open}
                loading={loading}
                columns={[
                    { key: 'name', label: 'Mesure' },
                    { key: 'unit', label: 'Unité', className: 'w-[90px]' },
                    { key: 'normalValue', label: 'Valeur normale', numeric: true },
                    { key: 'threshold', label: "Seuil d'alerte", numeric: true },
                    { key: 'description', label: 'Description', hideOnTablet: true },
                ]}
                rows={data}
                getRowKey={(row: any, index: number) => row?.id ?? index}
                searchPlaceholder="Rechercher une mesure…"
                searchText={(row: any) =>
                    [row?.name, row?.unit, row?.normalValue, row?.threshold, row?.description]
                        .filter(Boolean)
                        .join(' ')
                }
                renderRow={(row: any) => ({
                    name: <span className="font-medium text-slate-800">{row?.name || '—'}</span>,
                    unit: <span className="text-slate-600">{row?.unit || '—'}</span>,
                    normalValue: row?.normalValue || '—',
                    threshold: (
                        <span className="font-medium text-amber-700">{row?.threshold || '—'}</span>
                    ),
                    description: (
                        <span className="text-slate-600 line-clamp-2">{row?.description || '—'}</span>
                    ),
                })}
                statusOf={(row: any) => row?.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
                emptyTitle="Aucune mesure technique"
                emptyHint="Définissez les mesures suivies sur le terrain (valeur normale attendue et seuil de déclenchement d'alerte)."
            />

            {/* Modale de saisie */}
            <Modal
                opened={opened}
                size="lg"
                onClose={handleClose}
                centered
                title={
                    <h1 className="text-lg text-blue-500">
                        {edit ? "Modifier la mesure technique" : "Créer une mesure technique"}
                    </h1>
                }
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={Z.overlay}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                <form className="flex flex-col gap-4" onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label="Nom de la mesure"
                        withAsterisk
                        placeholder="Saisir le nom"
                        {...form.getInputProps("name")}
                    />
                    <Select withAsterisk
                        label="Unité"
                        placeholder="Sélectionner une unité"
                        data={["ppm", "µg/m³", "%", "dB", "Lux", "m/s", "% LEL", "°C"]}
                        {...form.getInputProps("unit")}
                    />
                    <TextInput
                        label="Valeur normale attendue"
                        withAsterisk
                        placeholder="Saisir la valeur normale"
                        {...form.getInputProps("normalValue")}
                    />
                    <TextInput
                        label="Seuil d'alerte"
                        withAsterisk
                        placeholder="Saisir le seuil d'alerte"
                        {...form.getInputProps("threshold")}
                    />
                    <Textarea
                        withAsterisk
                        label="Description"
                        placeholder="Saisir la description"
                        {...form.getInputProps("description")}
                    />
                    <Button type="submit" mt="md" variant="gradient">
                        {edit ? "Modifier" : "Ajouter"}
                    </Button>
                </form>
            </Modal>
        </>
    );
};

export default TechMeasurementData;
