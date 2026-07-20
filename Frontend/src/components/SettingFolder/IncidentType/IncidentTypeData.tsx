import { Button, LoadingOverlay, Modal, Select, Tabs, Textarea, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { activateIncidentType, createIncidentsType, deactivateIncidentType, GetAllIncidentType, updateIncidentType } from "../../../services/IncidentTypeService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { GetAllIncidentCategories } from "../../../services/IncidentCategory";
import { getAllActiveSeverityLevel } from "../../../services/SeverityLevelService";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';


const IncidentTypeData = ({ opened, open, close }: any) => {
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [severities, setSeverities] = useState<any[]>([]);
    const [severityLevels, setSeverityLevels] = useState<any[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>("All");
    const [tab, setTab] = useState<string | null>("all");
    const dispatch = useDispatch();

    const [severityMap, setSeverityMap] = useState<Record<string, string>>({});

    // L'écran est monté à deux endroits : la page héritée (qui pilote la modale via
    // ses props) et l'onglet Paramètres (qui ne passe rien). On retombe alors sur
    // une disclosure interne pour que le bouton de création reste opérant.
    const [selfOpened, selfDisclosure] = useDisclosure(false);
    const isOpened = opened ?? selfOpened;
    const openForm = open ?? selfDisclosure.open;
    const closeForm = close ?? selfDisclosure.close;


    const form = useForm({
        initialValues: {
            name: '',
            incidentCategoryId: '',
            severityLevelId: '',
            description: ''
        },

        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            incidentCategoryId: (value) => value ? null : "La catégorie d'incident est obligatoire",
            severityLevelId: (value) => value ? null : "Le niveau de gravité est obligatoire",
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
        GetAllIncidentCategories({}).then((res) => {
            setCategories(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des catégories");
            })

        getAllActiveSeverityLevel().then((res) => {
            setSeverities(res.map((item: any) => ({ ...item, label: item.name, value: "" + item.id })));
            setSeverityLevels(Array.from(["All", ...new Set(res.map((item: any) => item.name))]));
            setSeverityMap(
                res.reduce((acc: Record<string, string>, curr: any) => {
                    acc[curr.name] = curr.level;
                    return acc;
                }, {})
            );
        }
        ).catch((_err) => {

        })

        // Chargement des types d'incident
        GetAllIncidentType({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des types d'incident");
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

            const payload = { ...selectedRow, ...values };

            // Récupère le libellé de la catégorie correspondante
            const category = categories.find(cat => cat.value === values.incidentCategoryId);

            updateIncidentType(payload)
                .then(() => {
                    successNotification("Type d'incident mis à jour");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                incidentCategoryName: category?.label || item.incidentCategoryName,
                                severityLevelName: severities.find(sev => sev.value === values.severityLevelId)?.label
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
            createIncidentsType(values)
                .then((res) => {
                    successNotification("Type d'incident ajouté");

                    // Récupère le libellé de la catégorie depuis la liste déroulante
                    const category = categories.find(cat => cat.value === values.incidentCategoryId);

                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                        incidentCategoryName: category?.label || "",
                        severityLevelName: severities.find(sev => sev.value === values.severityLevelId)?.label

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

    const handleNew = () => {
        setEdit(false);
        setSelectedRow(null);
        form.reset();
        openForm();
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            incidentCategoryId: "" + rowData.incidentCategoryId,
            severityLevelId: "" + rowData.severityLevelId,
            description: rowData.description
        });
        openForm();
    };

    const handleClose = () => {
        closeForm();
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
                    Voulez-vous <strong>{actionLabel}</strong> le type : <strong>{rowData.name}</strong> ?
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
                const apiCall = action === "activate" ? activateIncidentType : deactivateIncidentType;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(action === "activate" ? "Type activé" : "Type désactivé");
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Impossible de ${actionLabel} le type`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };

    useEffect(() => {
        if (!edit) form.setFieldValue('severityLevelId', '');
    }, [form.values.incidentCategoryId]);

    useEffect(() => {
        setSelectedSeverity("All");
    }, [tab]);

    const filteredData = data.filter((item) => {
        if (tab === "all") return true;
        return item.incidentCategoryName === tab;
    }).filter((item) => {
        if (selectedSeverity === "All") return true;
        return item.severityLevelName === selectedSeverity;
    });

    const severityFilter = (
        <Select
            size="sm"
            w={240}
            value={selectedSeverity}
            onChange={(v) => setSelectedSeverity(v ?? "All")}
            data={severityLevels.map((level: any) => ({
                value: String(level),
                label: String(level) === "All" ? "Toutes les gravités" : String(level),
            }))}
            allowDeselect={false}
            checkIconPosition="right"
            placeholder="Niveau de gravité"
            aria-label="Filtrer par niveau de gravité"
            comboboxProps={{ zIndex: Z.modal + 10 }}
        />
    );

    return (
        <>
            <Tabs value={tab} fw={400} variant="outline" autoContrast onChange={setTab} mb="sm">
                <Tabs.List>
                    <Tabs.Tab value="all">Toutes</Tabs.Tab>
                    {categories.map((category) => (
                        <Tabs.Tab key={category.value} value={category.label.toString()}>
                            {category.label}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            <ReferencePanel<any>
                newLabel="Nouveau type d'incident"
                onNew={handleNew}
                columns={[
                    { key: 'name', label: 'Nom' },
                    { key: 'incidentCategoryName', label: 'Catégorie' },
                    { key: 'severityLevelName', label: 'Gravité' },
                    { key: 'description', label: 'Description', hideOnTablet: true },
                ]}
                rows={filteredData}
                renderRow={(row) => ({
                    name: <span className="font-medium text-slate-900">{row.name}</span>,
                    incidentCategoryName: row.incidentCategoryName || '—',
                    severityLevelName: row.severityLevelName || '—',
                    description: (
                        <span className="text-slate-600 line-clamp-2" title={row.description}>
                            {row.description || '—'}
                        </span>
                    ),
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) =>
                    `${row.name ?? ''} ${row.incidentCategoryName ?? ''} ${row.severityLevelName ?? ''} ${row.description ?? ''}`
                }
                searchPlaceholder="Rechercher un type d'incident…"
                loading={loading}
                emptyTitle="Aucun type d'incident"
                emptyHint="Créez un type d'incident pour l'ajouter à la liste proposée au déclarant."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
                toolbarExtra={severityFilter}
            />

            {/* Modale de création / modification */}
            <Modal opened={isOpened} size="lg" onClose={handleClose} centered title={
                <div className="text-lg text-blue-500">
                    {edit ? "Modifier le type d'incident" : "Créer un type d'incident"}
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nom" withAsterisk placeholder='Saisissez le nom' {...form.getInputProps('name')} />
                    <Select readOnly={edit}
                        withAsterisk
                        label="Catégorie d'incident"
                        placeholder="Sélectionnez une catégorie"
                        data={categories}
                        {...form.getInputProps('incidentCategoryId')}
                    />
                    <Select
                        withAsterisk
                        label="Niveau de gravité"
                        placeholder="Sélectionnez un niveau de gravité"
                        data={severities.filter((item) => item.incidentCategoryId == form.values.incidentCategoryId)}
                        {...form.getInputProps('severityLevelId')}
                    />
                    <Textarea label="Description" withAsterisk placeholder="Saisissez la description" {...form.getInputProps('description')} />
                    <Button type="submit" mt="md" variant="gradient">{edit ? "Mettre à jour" : "Ajouter"}</Button>
                </form>
            </Modal>
        </>
    )
}

export default IncidentTypeData;
