import { Button, LoadingOverlay, Modal, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";

import { activateWeatherConditions, createWeatherConditions, deactivateWeatherConditions, GetAllWeatherConditions, updateWeatherConditions } from "../../../services/WeatherService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { useDispatch } from "react-redux";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

const WeatherConditionData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            name: '',
            description: '',
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "La description est obligatoire";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "250 caractères maximum" : null;
            }
        }
    });


    useEffect(() => {
        setLoading(true);
        GetAllWeatherConditions({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des conditions environnementales");
            })
            .finally(() => setLoading(false));
    }, []);


    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";
        const doneLabel = action === "activate" ? "activée" : "désactivée";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'opération</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> la condition environnementale : <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'green', variant: "filled" },

            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay())
                const apiCall = action === "activate" ? activateWeatherConditions : deactivateWeatherConditions;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Condition environnementale ${doneLabel} avec succès`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération : impossible de ${actionLabel} la condition environnementale`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };
    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            // Vérifie qu'au moins un champ a changé
            const changed = Object.keys(values).some((key) => {
                const newValue = values[key]?.trim?.() ?? values[key];
                const oldValue = selectedRow[key]?.trim?.() ?? selectedRow[key];
                return newValue !== oldValue;
            });

            if (!changed) {
                form.setErrors({ name: "Modifiez au moins un champ avant d'enregistrer" });
                setLoading(false);
                return;
            }

            const payload = { ...selectedRow, ...values };
            updateWeatherConditions(payload)
                .then(() => {
                    successNotification("Condition environnementale modifiée avec succès");
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
            createWeatherConditions(values)
                .then((res) => {
                    successNotification("Condition environnementale ajoutée avec succès");
                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res
                    };
                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => {
                    setLoading(false)
                });
        }
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            description: rowData.description,
        });
        open();
    };

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    return (
        <>
            <ReferencePanel<any>
                newLabel="Nouvelle condition"
                onNew={open}
                columns={[
                    { key: 'name', label: 'Nom' },
                    { key: 'description', label: 'Description', hideOnTablet: true },
                ]}
                rows={data}
                renderRow={(row) => ({
                    name: row.name,
                    description: row.description,
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) => `${row.name ?? ''} ${row.description ?? ''}`}
                searchPlaceholder="Rechercher une condition…"
                loading={loading}
                emptyTitle="Aucune condition environnementale"
                emptyHint="Décrivez les conditions rencontrées sur site (pluie, brouillard, forte chaleur…) pour les rattacher aux événements."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
            />

            {/* Modale de création / modification */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Modifier la condition environnementale" : "Créer une condition environnementale"}
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nom" withAsterisk placeholder='Saisir le nom' {...form.getInputProps('name')} />
                    <TextInput label="Description" withAsterisk placeholder="Saisir la description" {...form.getInputProps('description')} />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Modifier" : "Ajouter"}</Button>
                </form>
            </Modal>

        </>
    );
}

export default WeatherConditionData;
