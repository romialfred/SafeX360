import {
    ActionIcon,
    Button,
    Modal,
    Select,
    Textarea,
    TextInput,
    Tooltip,
    LoadingOverlay,
    Tabs,
    SegmentedControl,
    Divider,
} from "@mantine/core";
import { IconEye, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { missingFieldsMessage } from "../../../utility/FormErrorUtility";
import { modals } from "@mantine/modals";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import {
    activateSeverityLevel,
    addSeverityExample,
    createMultipleSeverityLevels,
    deactivateSeverityLevel,
    GetAllSeverityLevel,
    removeSeverityExample,
    updateSeverityLevel,
} from "../../../services/SeverityLevelService";
import { GetAllIncidentCategories } from "../../../services/IncidentCategory";
import { mapIdToName } from "../../../utility/OtherUtilities";
import SummaryComponent from "./SummaryComponent";
import MatrixModal from "./MatrixModal";
import { GetAllIncidentType, getCountByCategory, getCountByCategoryAndSeverity, getCountBySeverityLevel } from "../../../services/IncidentTypeService";
import { Z } from '../../../constants/zIndex';
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

type Example = {
    desc: string;
}

type CategoryDesc = {
    incidentCategoryId: number;
    description: string;
    examples: Example[];
}

const levels = [
    { label: "Tous les niveaux", value: "All" },
    { label: "Niveau 1", value: "1" },
    { label: "Niveau 2", value: "2" },
    { label: "Niveau 3", value: "3" },
    { label: "Niveau 4", value: "4" },
    { label: "Niveau 5", value: "5" }
];

/** Options du sélecteur de niveau (mêmes valeurs que severityLevels, libellés français). */
const severityLevelOptions = [
    { label: "Niveau 1", value: "1" },
    { label: "Niveau 2", value: "2" },
    { label: "Niveau 3", value: "3" },
    { label: "Niveau 4", value: "4" },
    { label: "Niveau 5", value: "5" }
];

/** Libellé affiché d'un niveau de gravité (équivalent français de severityMap). */
const severityLabelMap: Record<string, string> = {
    '1': 'Niveau 1',
    '2': 'Niveau 2',
    '3': 'Niveau 3',
    '4': 'Niveau 4',
    '5': 'Niveau 5'
};

const colorMap: Record<string, string> = {
    1: "green",
    4: "red",
    3: "orange",
    2: "yellow",
    5: "brown"
}


const SeverityLevelData = ({ opened, open, close }: any) => {
    const [openedUpdate, { open: openUpdate, close: closeUpdate }] = useDisclosure(false);

    const [openedExample, { open: openExample, close: closeExample }] = useDisclosure(false);
    const [openedMatrix, { open: openMatrix, close: closeMatrix }] = useDisclosure(false);
    // L'écran est monté à deux endroits : la page héritée (qui pilote la modale de
    // création via ses props et fournit son propre bouton) et l'onglet Paramètres
    // (qui ne passe rien). On retombe alors sur une disclosure interne pour que la
    // création reste possible, et le bouton n'est exposé que dans ce second cas.
    const [selfOpened, selfDisclosure] = useDisclosure(false);
    const controlled = typeof open === 'function' && typeof close === 'function';
    const createOpened = controlled ? Boolean(opened) : selfOpened;
    const openCreate = controlled ? open : selfDisclosure.open;
    const closeCreate = controlled ? close : selfDisclosure.close;
    const [segmentedValue, setSegmentedValue] = useState<'Level' | 'Summary'>('Level');

    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [categoryMap, setCategoryMap] = useState<Record<string, any>>({});
    const [categories, setCategories] = useState<any[]>([]);
    const [tab, setTab] = useState<string | null>('all');
    const [severityLevelCount, setSeverityLevelCount] = useState<any[]>([]);
    const [categorySeverityCount, setCategorySeverityCount] = useState<any[]>([]);
    const [categoryCount, setCategoryCount] = useState<any[]>([]);
    const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>("");
    const [selectedLevel, setSelectedLevel] = useState<string | undefined>("All");

    const dispatch = useDispatch();
    const form = useForm({
        initialValues: {
            name: '',
            level: '',
            catDesc: [] as CategoryDesc[],
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            level: (value) => value.trim()?.length > 0 ? null : "Le niveau est obligatoire",
            catDesc: {
                incidentCategoryId: (value) => !value ? "La catégorie est obligatoire" : null,
                description: (value) => value.trim()?.length > 0 ? null : "La description est obligatoire",
                examples: {
                    desc: (value) => value.trim()?.length > 0 ? null : "L'exemple est obligatoire",
                }

            }
        }
    });

    const updateForm = useForm({
        initialValues: {
            name: '',
            level: '',
            incidentCategoryId: "",
            description: '',

        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            level: (value) => value.trim()?.length > 0 ? null : "Le niveau est obligatoire",
            incidentCategoryId: (value) => value ? null : "La catégorie est obligatoire",
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "La description est obligatoire";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "250 caractères maximum" : null;
            },
        }
    })

    const exampleForm = useForm({
        initialValues: {
            id: "",
            example: '',
        },
        validate: {

            example: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "L'exemple est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
        }
    })





    useEffect(() => {
        setLoading(true);
        GetAllIncidentCategories({}).then((res) => {
            setCategoryMap(mapIdToName(res));
            setCategories(res);
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des catégories d'incident");
            })
        getSeverityLevels();
        GetAllIncidentType({}).then((res) => {
            setIncidentTypes(res);
        }).catch((_err) => console.error(_err))

        getCountBySeverityLevel().then((res) => {
            setSeverityLevelCount(res);
        }).catch((_err) => console.error(_err))
        getCountByCategory().then((res) => {
            setCategoryCount(res);
        }).catch((_err) => console.error(_err))
        getCountByCategoryAndSeverity().then((res) => {
            setCategorySeverityCount(res);
        }).catch((_err) => console.error(_err))
    }, []);

    const getSeverityLevels = () => {
        GetAllSeverityLevel({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des niveaux de gravité");
            })
            .finally(() => setLoading(false));
    }

    /**

     * Le SegmentedControl ne monte QU'UNE catégorie à la fois : les erreurs des

     * autres catégories sont posées par la validation mais restent invisibles.

     * Sans ce rappel, la soumission échouait sans rien afficher dès qu'une

     * catégorie non sélectionnée était incomplète. On nomme donc les onglets

     * fautifs, seule information qui permette d'aller les corriger.

     */

    const handleInvalid = (errors: Record<string, unknown>) => {
        const faulty = Array.from(new Set(
            Object.keys(errors)
                .map((path) => /^catDesc\.(\d+)\./.exec(path)?.[1])
                .filter((idx): idx is string => Boolean(idx))
                .map((idx) => categoryMap[form.values.catDesc[Number(idx)]?.incidentCategoryId]?.name)
                .filter(Boolean),
        ));
        errorNotification(
            faulty.length
                ? `Catégories à compléter : ${faulty.join(', ')}`
                : missingFieldsMessage(errors),
        );
    };


    const handleSubmit = (values: any) => {
        setLoading(true);
        let catDesc = values.catDesc.map((item: any) => ({
            incidentCategoryId: item.incidentCategoryId,
            description: item.description,
            examples: item.examples.map((ex: any) => (ex.desc))
        }));
        createMultipleSeverityLevels({ ...values, catDesc: catDesc })
            .then((_res) => {
                successNotification("Niveau de gravité ajouté avec succès");
                getSeverityLevels();
                handleClose();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
            })
            .finally(() => setLoading(false));
    }


    const handleUpdate = (values: any) => {
        setLoading(true);
        const payload = { ...selectedRow, ...values };
        updateSeverityLevel(payload)
            .then(() => {
                successNotification("Niveau de gravité modifié avec succès");
                const updatedData = data.map((item) =>
                    item.id === selectedRow.id
                        ? { ...item, ...values }
                        : item
                );
                setData(updatedData);
                closeUpdate();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
            })
            .finally(() => setLoading(false));
    }


    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";
        const doneLabel = action === "activate" ? "activé" : "désactivé";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'opération</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> le niveau : <strong>{rowData.name}</strong> ?
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
                const apiCall = action === "activate" ? activateSeverityLevel : deactivateSeverityLevel;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Niveau de gravité ${doneLabel} avec succès`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération : impossible de ${actionLabel} le niveau de gravité`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };


    const handleEdit = (rowData: any) => {
        openUpdate();
        setSelectedRow(rowData);
        updateForm.setValues({
            name: rowData.name,
            level: rowData.level,
            incidentCategoryId: rowData.incidentCategoryId,
            description: rowData.description
        });
    };

    const handleClose = () => {
        closeCreate();
        form.reset();
        setSelectedRow(null);
    };



    const handleExample = (item: any) => {
        setSelectedRow(item);
        exampleForm.setValues({ id: item.id, example: '' });
        openExample();
    }

    const handleAddExample = (values: any) => {
        setLoading(true);
        const payload = {
            id: selectedRow.id,
            examples: [values.example]
        };
        addSeverityExample(payload)
            .then(() => {
                successNotification("Exemple ajouté avec succès");
                closeExample();
                getSeverityLevels();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
            })
            .finally(() => setLoading(false));
    };


    const levelColorMap: Record<number, string> = {
        1: "bg-green-100 text-green-700",
        2: "bg-lime-100 text-lime-700",
        3: "bg-yellow-100 text-yellow-700",
        4: "bg-orange-100 text-orange-700",
        5: "bg-red-100 text-red-700"
    };


    const handleRemoveExample = (indexToRemove: number, id: any) => {
        const updatedData = data.map(item =>
            item.id == id
                ? {
                    ...item,
                    examples: item.examples.filter((_: any, index: any) => index != indexToRemove)
                }
                : item
        );
        setData(updatedData);
        removeSeverityExample(indexToRemove, id)
            .then(() => {
                successNotification("Exemple supprimé avec succès");
            }
            )
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec de la suppression de l'exemple");
            }
            );
    };


    useEffect(() => {
        if (form.values.level) {
            const filtData = Array.from(new Set(data.filter((x) => x.level == form.values.level).map((item: any) => (item.incidentCategoryId))));
            const selectedCategories = categories.filter((x) => !filtData.includes(x.id)).map((category: any) => ({
                incidentCategoryId: category.id,
                description: "",
                examples: []
            }));
            form.setFieldValue('catDesc', selectedCategories);
            setSelectedCategoryId(selectedCategories.length > 0 ? selectedCategories[0].incidentCategoryId.toString() : "");
        }
    }, [form.values.level])

    const filteredData = data.filter((x) => tab == "all" || x.incidentCategoryId == tab).filter((x) => selectedLevel == "All" || x.level == selectedLevel);
    return (
        <>
            {/* Bascule Niveaux / Synthèse + accès à la matrice de criticité */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <SegmentedControl
                    color="primary"
                    data={[{ label: 'Niveaux', value: 'Level' }, { label: 'Synthèse', value: 'Summary' }]}
                    value={segmentedValue}
                    size="sm"
                    radius="sm"
                    transitionDuration={500}
                    transitionTimingFunction="linear"
                    onChange={(val) => setSegmentedValue(val as 'Level' | 'Summary')}
                />
                <Button size="sm" variant='gradient' leftSection={<IconEye />} onClick={openMatrix}>Voir la matrice</Button>
            </div>

            {segmentedValue === 'Level' && (
                <Tabs value={tab} variant="pills" autoContrast onChange={setTab}>
                    <Tabs.List>
                        <Tabs.Tab value="all">Toutes</Tabs.Tab>
                        {categories.map((category) => (
                            <Tabs.Tab key={category.id} value={category.id.toString()}>
                                {category.name}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                    <Tabs.Panel value={tab ?? "all"} pt="md">
                        <ReferencePanel<any>
                            newLabel={controlled ? undefined : "Nouveau niveau de gravité"}
                            onNew={controlled ? undefined : openCreate}
                            columns={[
                                { key: 'level', label: 'Gravité', className: 'w-[110px]' },
                                { key: 'name', label: 'Nom' },
                                { key: 'category', label: 'Catégorie', hideOnTablet: true },
                                { key: 'description', label: 'Description' },
                                { key: 'examples', label: 'Exemples', hideOnTablet: true },
                            ]}
                            rows={filteredData}
                            renderRow={(item) => ({
                                level: (
                                    <span className={`${levelColorMap[item.level] ?? 'bg-slate-100 text-slate-700'} text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap`}>
                                        {severityLabelMap[item.level] || "Inconnu"}
                                    </span>
                                ),
                                name: <span className="font-medium text-slate-800">{item.name}</span>,
                                category: (
                                    <span className="text-slate-600">
                                        {categoryMap[item.incidentCategoryId]?.name || "—"}
                                    </span>
                                ),
                                description: <span className="text-slate-600">{item.description}</span>,
                                examples: item.examples && item.examples.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {item.examples.map((example: string, index: number) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]"
                                            >
                                                {example}
                                                <button
                                                    type="button"
                                                    aria-label={`Supprimer l'exemple : ${example}`}
                                                    title={`Supprimer l'exemple : ${example}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveExample(index, item.id);
                                                    }}
                                                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <IconX size={11} stroke={2} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                ),
                            })}
                            getRowKey={(item, index) => item.id ?? index}
                            searchText={(item) => `${item.name ?? ''} ${item.description ?? ''} ${categoryMap[item.incidentCategoryId]?.name ?? ''} ${(item.examples ?? []).join(' ')}`}
                            searchPlaceholder="Rechercher un niveau de gravité…"
                            loading={loading}
                            emptyTitle="Aucun niveau de gravité"
                            emptyHint="Aucun niveau de gravité pour cette catégorie et ce filtre de niveau."
                            statusOf={(item) => item.status}
                            onToggleStatus={handleStatusChange}
                            onEdit={handleEdit}
                            rowActions={(item) => (
                                <Tooltip label="Ajouter un exemple" withArrow openDelay={300}>
                                    <button
                                        type="button"
                                        aria-label="Ajouter un exemple"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExample(item);
                                        }}
                                        className="w-7 h-7 rounded-md flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                    >
                                        <IconPlus size={15} stroke={1.7} />
                                    </button>
                                </Tooltip>
                            )}
                            toolbarExtra={
                                <SegmentedControl
                                    size="xs"
                                    value={selectedLevel}
                                    onChange={setSelectedLevel}
                                    data={levels}
                                    color={colorMap[selectedLevel ?? ""] ?? "primary"}
                                />
                            }
                        />
                    </Tabs.Panel>
                </Tabs>
            )}

            {segmentedValue === 'Summary' && (
                <div className="summary-content p-4 bg-gray-50 rounded-md">
                    <SummaryComponent severityLevelCount={severityLevelCount} categoryCount={categoryCount} categorySeverityCount={categorySeverityCount} categories={categories} incidentTypes={incidentTypes} />
                </div>
            )}
            <Modal opened={createOpened} size="auto" onClose={handleClose} centered title={
                <div className="text-lg text-blue-500">
                    Créer un niveau de gravité
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='grid grid-cols-2 gap-4' onSubmit={form.onSubmit(handleSubmit, handleInvalid)}>
                    <Select label="Niveau" withAsterisk placeholder='Sélectionner un niveau' data={severityLevelOptions} {...form.getInputProps('level')} />
                    <TextInput label="Nom" withAsterisk placeholder='Saisir le nom' {...form.getInputProps('name')} />

                    <div className="col-span-2">
                        <Divider my="sm" />
                        <SegmentedControl
                            color="primary"
                            value={selectedCategoryId}
                            onChange={setSelectedCategoryId}
                            fullWidth
                            data={form.values.catDesc.map((item) => ({
                                label: categoryMap[item.incidentCategoryId]?.name || "Sans nom",
                                value: "" + item.incidentCategoryId,
                            }))}
                        />

                        {form.values.catDesc.map((item, index) =>
                            "" + item.incidentCategoryId === selectedCategoryId ? (
                                <div key={item.incidentCategoryId} className="mt-4 space-y-4"
                                >
                                    <Textarea
                                        label={`Description pour ${categoryMap[item.incidentCategoryId]?.name}`}
                                        withAsterisk
                                        placeholder={`Décrire le niveau de gravité pour ${categoryMap[item.incidentCategoryId]?.name}`}
                                        {...form.getInputProps(`catDesc.${index}.description`)}
                                    />
                                    <div className="space-y-3">

                                        <div className=" ">Exemples</div>
                                        {
                                            item.examples?.map((_x, idx) => < TextInput key={idx} withAsterisk placeholder="Saisir un exemple" {...form.getInputProps(`catDesc.${index}.examples.${idx}.desc`)} rightSection={<ActionIcon onClick={() => form.removeListItem(`catDesc.${index}.examples`, idx)} color="red"><IconTrash /></ActionIcon>} />
                                            )}
                                        <Button onClick={() => form.insertListItem(`catDesc.${index}.examples`, { "desc": "" })} leftSection={<IconPlus size={15} />} type="button" size="compact-sm" variant="subtle">Ajouter un exemple</Button>
                                    </div>
                                </div>
                            ) : null
                        )}

                    </div>
                    <div className="col-span-2 justify-self-end">
                        <Button type="submit" mt="md" variant="gradient">Ajouter le niveau</Button>
                    </div>
                </form>
            </Modal>
            <Modal opened={openedUpdate} size="xl" onClose={closeUpdate} centered title={
                <div className="text-lg text-blue-500">
                    Modifier le niveau de gravité
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='grid grid-cols-1 gap-4' onSubmit={updateForm.onSubmit(handleUpdate)}>
                    <Select disabled label="Niveau" withAsterisk placeholder='Sélectionner un niveau' data={severityLevelOptions} {...updateForm.getInputProps('level')} />
                    <TextInput label="Nom" withAsterisk placeholder='Saisir le nom' {...updateForm.getInputProps('name')} />
                    <Textarea label={categoryMap[updateForm.values.incidentCategoryId]?.name} withAsterisk placeholder="Saisir la description" {...updateForm.getInputProps(`description`)} />
                    <Button type="submit" mt="md" variant="gradient">Mettre à jour</Button>
                </form>
            </Modal>

            <Modal opened={openedExample} size="md" onClose={closeExample} centered title={
                <div className="text-lg text-blue-500">
                    Ajouter un exemple
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='grid grid-cols-1 gap-4' onSubmit={exampleForm.onSubmit(handleAddExample)}>

                    <TextInput label="Exemple" withAsterisk placeholder="Saisir un exemple" {...exampleForm.getInputProps(`example`)} />
                    <Button type="submit" mt="md" variant="gradient">Ajouter un exemple</Button>
                </form>
            </Modal>


            <MatrixModal categories={categories} opened={openedMatrix} onClose={closeMatrix} />

        </>
    );
};

export default SeverityLevelData;
