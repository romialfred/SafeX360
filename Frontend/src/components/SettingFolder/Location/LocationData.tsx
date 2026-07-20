import { Button, LoadingOverlay, Modal, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";

import { activateLocation, createLocation, deactivateLocation, getAllLocations, updateLocation } from "../../../services/LocationService";
import { Z } from '../../../constants/zIndex';
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { modals } from "@mantine/modals";
import LocationPicker from "../../UtilityComp/LocationPicker";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

const LocationData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            name: '',
            location: [] as unknown as [number, number],
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            location: (value) => value.length > 0 ? null : "L'emplacement est obligatoire",
        }
    });



    useEffect(() => {
        setLoading(true);
        getAllLocations({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des sites");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            const payload = { ...selectedRow, name: values.name, latitude: values.location[0], longitude: values.location[1] };
            updateLocation(payload)
                .then(() => {
                    successNotification("Site modifié avec succès");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id ? { ...payload } : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => setLoading(false));
        } else {

            createLocation({ name: values.name, latitude: values.location[0], longitude: values.location[1] })

                .then((res) => {
                    successNotification("Site ajouté avec succès");
                    const newEntry = {
                        name: values.name, latitude: values.location[0], longitude: values.location[1],
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
                })
        }
    };



    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";
        const doneLabel = action === "activate" ? "activé" : "désactivé";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'opération</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> le site : <strong>{rowData.name}</strong> ?
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
                const apiCall = action === "activate" ? activateLocation : deactivateLocation;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Site ${doneLabel} avec succès`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération : impossible de ${actionLabel} le site`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };



    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            location: [rowData.latitude, rowData.longitude],
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
                newLabel="Nouveau site"
                onNew={open}
                columns={[
                    { key: 'name', label: 'Nom' },
                    { key: 'latitude', label: 'Latitude', numeric: true, hideOnTablet: true },
                    { key: 'longitude', label: 'Longitude', numeric: true, hideOnTablet: true },
                ]}
                rows={data}
                renderRow={(row) => ({
                    name: row.name,
                    latitude: row.latitude,
                    longitude: row.longitude,
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) => `${row.name ?? ''} ${row.latitude ?? ''} ${row.longitude ?? ''}`}
                searchPlaceholder="Rechercher un site…"
                loading={loading}
                emptyTitle="Aucun site"
                emptyHint="Créez un premier site pour localiser les événements et les inspections."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
            />

            {/* Modale de création / modification */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Modifier le site" : "Créer un site"}
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nom" withAsterisk placeholder='Saisir le nom' {...form.getInputProps('name')} />
                    <LocationPicker label="Emplacement" placeholder="Cliquer pour sélectionner l'emplacement" form={form} id="location" required />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Modifier" : "Ajouter"}</Button>
                </form>
            </Modal>


        </>
    );
};

export default LocationData;
