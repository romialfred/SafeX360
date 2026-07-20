import { Button, LoadingOverlay, Modal, Select, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { activateWorkArea, createWorkArea, deactivateWorkArea, GetAllWorkArea, updateWorkArea } from "../../../services/WorkAreaService";
import { getAllDepartments } from "../../../services/HrmsService";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';


const WorkAreaData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>("All");


    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            name: '',
            departmentId: ''
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom de la zone de travail est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            departmentId: (value) => (value.trim().length > 0 ? null : "Le département est obligatoire"),


        }
    });

    useEffect(() => {
        setLoading(true);

        // Chargement des départements
        getAllDepartments()
            .then((res) => {
                const deptOptions = res.map((item: any) => ({
                    label: item.name,
                    value: String(item.id),
                }));
                setDepartments(deptOptions);
            })
            .catch(() => {
                errorNotification("Échec du chargement des départements");
            });

        GetAllWorkArea({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                    departmentId: String(item.departmentId),
                    departmentName: item.departmentName || "",
                }));
                setData(formatted);
            })
            .catch(() => {
                errorNotification("Échec du chargement des zones de travail");
            })
            .finally(() => setLoading(false));
    }, []);


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

            const payload = {
                ...selectedRow,
                ...values,
            };

            updateWorkArea(payload)
                .then(() => {
                    successNotification("Zone de travail modifiée avec succès");

                    // Mise à jour locale avec le nom du département résolu
                    const updatedData = data.map(item =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                departmentId: values.departmentId,
                                departmentName: departments.find((dep) => dep.value === values.departmentId)?.label || "",
                                status: item.status
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch(() => {
                    errorNotification("Une erreur est survenue lors de la modification");
                })
                .finally(() => setLoading(false));
        } else {
            // Création d'une nouvelle zone de travail
            createWorkArea(values)
                .then((res) => {
                    successNotification("Zone de travail ajoutée avec succès");

                    const newEntry = {
                        ...values,
                        id: res,
                        status: "ACTIVE",
                        departmentId: values.departmentId,
                        departmentName: departments.find(dep => dep.value === values.departmentId)?.label || ""
                    };

                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch(() => {
                    errorNotification("Une erreur est survenue lors de la création");
                })
                .finally(() => setLoading(false));
        }
    };

    const handleNew = () => {
        setEdit(false);
        setSelectedRow(null);
        form.reset();
        open();
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            departmentId: rowData.departmentId

        });
        open();
    };

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";
        const actionDone = action === "activate" ? "activée" : "désactivée";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'opération</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> la zone : <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'red', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === "activate" ? activateWorkArea : deactivateWorkArea;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Zone ${actionDone} avec succès`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération : impossible de ${actionLabel} la zone`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    const filteredData = data.filter((item) => {

        const departmentMatch = selectedDepartment === 'All' || (item.departmentId && selectedDepartment === "" + item.departmentId);
        return departmentMatch;
    });

    return (
        <>
            <ReferencePanel<any>
                newLabel="Nouvelle zone de travail"
                onNew={handleNew}
                columns={[
                    { key: 'name', label: 'Nom' },
                    { key: 'departmentName', label: 'Département' },
                ]}
                rows={filteredData}
                renderRow={(row) => ({
                    name: row.name,
                    departmentName: row.departmentName || '—',
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) => `${row.name ?? ''} ${row.departmentName ?? ''}`}
                searchPlaceholder="Rechercher une zone…"
                loading={loading}
                emptyTitle="Aucune zone de travail"
                emptyHint="Créez une première zone de travail pour structurer vos activités par département."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
                toolbarExtra={
                    <Select
                        allowDeselect={false}
                        searchable
                        size="xs"
                        className="sm:w-[220px]"
                        aria-label="Filtrer par département"
                        data={[{ label: "Tous les départements", value: "All" }, ...departments]}
                        value={selectedDepartment}
                        onChange={setSelectedDepartment}
                    />
                }
            />

            {/* Modale de création / modification */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Modifier la zone de travail" : "Créer une zone de travail"}
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nom" withAsterisk placeholder='Saisissez le nom' {...form.getInputProps('name')} />
                    <Select
                        label="Département"
                        withAsterisk
                        placeholder="Sélectionnez un département"
                        data={departments}
                        {...form.getInputProps('departmentId')}
                    />


                    <Button type="submit" mt="md" variant="gradient">{edit ? "Modifier" : "Ajouter"}</Button>
                </form>
            </Modal>
        </>
    )
}

export default WorkAreaData
