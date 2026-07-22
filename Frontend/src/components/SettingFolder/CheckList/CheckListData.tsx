import { Button, LoadingOverlay, Modal, Select, Textarea, TextInput } from "@mantine/core";
import { IconListCheck, IconCircleCheck, IconCategory2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { modals } from '@mantine/modals';
import { Z } from '../../../constants/zIndex';
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { activateCheckList, createCheckList, deactivateCheckList, GetAllCheckList, updateCheckList } from "../../../services/ChecklistParameterService";
import { GetAllIncidentCategories } from "../../../services/IncidentCategory";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';


const CheckListData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const dispatch = useDispatch();
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [checklist, setChecklist] = useState<any[]>([]);

    const form = useForm({
        initialValues: {
            name: '',
            description: '',
            incidentCategoryId: '',
            incidentCategoryName: '',
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le titre est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "La description est obligatoire";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "250 caractères maximum" : null;
            },
            incidentCategoryId: (value) => value?.trim()?.length > 0 ? null : "La catégorie est obligatoire",
        }
    });

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
            description: rowData.description,
            incidentCategoryId: "" + rowData.incidentCategoryId,
            incidentCategoryName: rowData.incidentCategoryName
        });
        open();
    };

    useEffect(() => {
        setLoading(true);
        GetAllIncidentCategories({}).then((res) => {
            setChecklist(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des catégories");
            });

        GetAllCheckList({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des check-lists");
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
            title: <span className='text-2xl'>Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> la check-list : <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'green', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === "activate" ? activateCheckList : deactivateCheckList;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(action === "activate" ? "Check-list activée" : "Check-list désactivée");
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Impossible de ${actionLabel} la check-list`);
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
                id: selectedRow.id,
                name: values.name,
                description: values.description,
                incidentCategoryId: parseInt(values.incidentCategoryId)
            };

            const category = checklist.find(cat => cat.value === values.incidentCategoryId);

            updateCheckList(payload)
                .then(() => {
                    successNotification("Check-list mise à jour");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...payload,
                                incidentCategoryName: category?.label || item.incidentCategoryName
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => setLoading(false));
        } else {
            createCheckList({ ...values, incidentCategoryId: parseInt(values.incidentCategoryId) })
                .then((res) => {
                    successNotification("Check-list ajoutée");
                    const category = checklist.find(cat => cat.value === values.incidentCategoryId);

                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                        incidentCategoryName: category?.label || ""
                    };
                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    return (
        <>
            <ReferencePanel<any>
                stats={[
                    { label: 'Check-lists', value: data.length, icon: IconListCheck, tone: 'teal' },
                    { label: 'Actives', value: data.filter((d: any) => String(d.status).toUpperCase() === 'ACTIVE').length, icon: IconCircleCheck, tone: 'emerald' },
                    { label: 'Catégories couvertes', value: new Set(data.map((d: any) => d.incidentCategoryName).filter(Boolean)).size, icon: IconCategory2, tone: 'violet' },
                ]}
                newLabel="Nouvelle check-list"
                onNew={handleNew}
                columns={[
                    { key: 'name', label: 'Titre' },
                    { key: 'incidentCategoryName', label: 'Catégorie' },
                    { key: 'description', label: 'Description', hideOnTablet: true },
                ]}
                rows={data}
                renderRow={(row) => ({
                    name: <span className="font-medium text-slate-900">{row.name}</span>,
                    incidentCategoryName: row.incidentCategoryName || '—',
                    description: (
                        <span className="text-slate-600 line-clamp-2" title={row.description}>
                            {row.description || '—'}
                        </span>
                    ),
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) =>
                    `${row.name ?? ''} ${row.incidentCategoryName ?? ''} ${row.description ?? ''}`
                }
                searchPlaceholder="Rechercher une check-list…"
                loading={loading}
                emptyTitle="Aucune check-list"
                emptyHint="Créez une check-list pour structurer les points de contrôle d'une catégorie d'incident."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
            />

            {/* Modale de création / modification */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Modifier la check-list" : "Créer une check-list"}
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Titre de la check-list" withAsterisk placeholder='Saisissez le titre' {...form.getInputProps('name')} />
                    <Textarea label="Description" placeholder="Saisissez la description" {...form.getInputProps('description')} />
                    <Select label="Catégorie" withAsterisk placeholder="Sélectionnez une catégorie" data={checklist} {...form.getInputProps('incidentCategoryId')} />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Mettre à jour" : "Ajouter"}</Button>
                </form>
            </Modal>
        </>
    );
};

export default CheckListData;
