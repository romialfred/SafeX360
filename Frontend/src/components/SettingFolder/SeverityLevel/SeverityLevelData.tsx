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
import { IconCheck, IconEdit, IconEye, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { Toolbar } from "primereact/toolbar";
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
import { severityLevels, severityMap } from "../../../Data/DropdownData";
import { GetAllIncidentCategories } from "../../../services/IncidentCategory";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { Tag } from "primereact/tag";
import SummaryComponent from "./SummaryComponent";
import MatrixModal from "./MatrixModal";
import { GetAllIncidentType, getCountByCategory, getCountByCategoryAndSeverity, getCountBySeverityLevel } from "../../../services/IncidentTypeService";
import { Z } from '../../../constants/zIndex';

type Example = {
    desc: string;
}

type CategoryDesc = {
    incidentCategoryId: number;
    description: string;
    examples: Example[];
}

const levels = [
    { label: "All Levels", value: "All" },
    { label: "Level 1", value: "1" },
    { label: "Level 2", value: "2" },
    { label: "Level 3", value: "3" },
    { label: "Level 4", value: "4" },
    { label: "Level 5", value: "5" }
];
const colorMap: Record<string, string> = {
    1: "green",
    4: "red",
    3: "orange",
    2: "yellow",
    5: "brown"
}


const SeverityLevelData = ({ opened, close }: any) => {
    const [openedUpdate, { open: openUpdate, close: closeUpdate }] = useDisclosure(false);

    const [openedExample, { open: openExample, close: closeExample }] = useDisclosure(false);
    const [openedMatrix, { open: openMatrix, close: closeMatrix }] = useDisclosure(false);
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
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            level: (value) => value.trim()?.length > 0 ? null : "Level is required",
            catDesc: {
                incidentCategoryId: (value) => !value ? "Category is required" : null,
                description: (value) => value.trim()?.length > 0 ? null : "Description is required",
                examples: {
                    desc: (value) => value.trim()?.length > 0 ? null : "Example is required",
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
                if (trimmed.length === 0) return "Name is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            level: (value) => value.trim()?.length > 0 ? null : "Level is required",
            incidentCategoryId: (value) => value ? null : "Category is required",
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
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
                if (trimmed.length === 0) return "Example is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
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
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch Incident types");
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
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch severities");
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
                successNotification("Severity Level added successfully");
                getSeverityLevels();
                handleClose();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => setLoading(false));
    }


    const handleUpdate = (values: any) => {
        setLoading(true);
        const payload = { ...selectedRow, ...values };
        updateSeverityLevel(payload)
            .then(() => {
                successNotification("Severity Level updated successfully");
                const updatedData = data.map((item) =>
                    item.id === selectedRow.id
                        ? { ...item, ...values }
                        : item
                );
                setData(updatedData);
                closeUpdate();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => setLoading(false));
    }


    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the Level: <strong>{rowData.name}</strong>?
                </span>
            ),
            labels: { confirm: `Yes, ${action}`, cancel: 'Cancel' },
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
                        successNotification(`Severity Level ${action}d successfully`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} severity level`);
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
        close();
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
                successNotification("Example added successfully");
                closeExample();
                getSeverityLevels();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => setLoading(false));
    };





    const leftToolbarTemplate = () => (
        <div className="flex gap-5">


            <div>
                <SegmentedControl
                    color="primary"
                    data={['Level', 'Summary']}
                    value={segmentedValue}
                    fullWidth
                    size="sm"
                    radius="sm"
                    transitionDuration={500}
                    transitionTimingFunction="linear"
                    onChange={(val) => setSegmentedValue(val as 'Level' | 'Summary')}
                />
            </div>
        </div>
    );

    const centerToolbarTemplate = () => (
        <SegmentedControl value={selectedLevel} onChange={setSelectedLevel} data={levels} color={colorMap[selectedLevel ?? ""] ?? "primary"} />
    )

    const rightToolbarTemplate = () => (
        <div className='flex gap-5'>
            <Button size="sm" variant='gradient' leftSection={<IconEye />} onClick={openMatrix}>View Matrix</Button>

        </div>
    );

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
                successNotification("Example removed successfully");
            }
            )
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to remove example");
            }
            );
    };


    const Card = ({ item }: { item: any }) => (
        <div className="bg-white p-3 rounded-2xl border flex flex-col gap-4 justify-between border-gray-300 shadow-md mb-4">

            <div className="">
                <div>
                    <div className="flex justify-between items-center gap-3 mb-1">
                        <span className={`${levelColorMap[item.level]} text-sm px-3 py-1 rounded-full`}>
                            {severityMap[item.level] || "Unknown"}
                        </span>
                        <h2 className="text-lg text-gray-800">{item.name}</h2>
                        <Tag severity={item.status === "ACTIVE" ? "success" : item.status === "INACTIVE" ? "danger" : "info"}> {item.status}</Tag>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{item.description}</p>

                </div>

            </div >
            {
                item.examples && item.examples.length > 0 && (
                    <ul className="">
                        {item.examples.map((example: string, index: number) => (
                            <div className="flex items-center justify-between" key={index}>

                                <li className="text-gray-500 mt-1 ">
                                    <span>{example}</span>
                                </li>
                                <ActionIcon
                                    onClick={() => handleRemoveExample(index, item.id)}
                                    color="red"
                                    variant="subtle"
                                    title={`Remove ${example}`}
                                >
                                    <IconTrash size={16} stroke={1.5} />
                                </ActionIcon>
                            </div>
                        ))}
                    </ul>
                )
            }
            <div className='flex gap-3 justify-center'>
                <Tooltip label="Edit">
                    <ActionIcon color="primary" onClick={() => handleEdit(item)} size="sm">
                        <IconEdit className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Add Example ">
                    <ActionIcon color="yellow" onClick={() => handleExample(item)} size="sm">
                        <IconPlus className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={item.status === 'ACTIVE' ? "Deactivate" : "Activate"}>
                    <ActionIcon
                        color={item.status === 'ACTIVE' ? "red" : "green"}
                        onClick={() => handleStatusChange(item)}
                        size="sm"
                    >
                        {item.status === 'ACTIVE'
                            ? <IconX className="!w-4/5 !h-4/5" stroke={1.5} />
                            : <IconCheck className="!w-4/5 !h-4/5" stroke={1.5} />
                        }
                    </ActionIcon>
                </Tooltip>
            </div>
        </div >
    );
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
        <div className="card">
            <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} center={centerToolbarTemplate}></Toolbar>
            {segmentedValue === 'Level' && (
                <Tabs value={tab} variant="pills" autoContrast onChange={setTab}>
                    <Tabs.List>
                        <Tabs.Tab value="all">All</Tabs.Tab>
                        {categories.map((category) => (
                            <Tabs.Tab key={category.id} value={category.id.toString()}>
                                {category.name}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                    <Tabs.Panel value={tab ?? "all"} pt="md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredData.map((item, idx) => (
                                <Card key={idx} item={item} />
                            ))}
                        </div>
                        {filteredData.length === 0 && (
                            <div className="text-center text-gray-500 mt-4">
                                No Severity Levels found for this category.
                            </div>
                        )}
                    </Tabs.Panel>
                </Tabs>
            )}

            {segmentedValue === 'Summary' && (
                <div className="summary-content p-4 bg-gray-50 rounded-md">
                    <SummaryComponent severityLevelCount={severityLevelCount} categoryCount={categoryCount} categorySeverityCount={categorySeverityCount} categories={categories} incidentTypes={incidentTypes} />
                </div>
            )}
            <Modal opened={opened} size="auto" onClose={handleClose} centered title={
                <div className="text-lg text-blue-500">
                    Create Severity Level
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='grid grid-cols-2 gap-4' onSubmit={form.onSubmit(handleSubmit, handleInvalid)}>
                    <Select label="Level" withAsterisk placeholder='Select Level' data={severityLevels} {...form.getInputProps('level')} />
                    <TextInput label="Name" withAsterisk placeholder='Enter name' {...form.getInputProps('name')} />

                    <div className="col-span-2">
                        <Divider my="sm" />
                        <SegmentedControl
                            color="primary"
                            value={selectedCategoryId}
                            onChange={setSelectedCategoryId}
                            fullWidth
                            data={form.values.catDesc.map((item) => ({
                                label: categoryMap[item.incidentCategoryId]?.name || "Unnamed",
                                value: "" + item.incidentCategoryId,
                            }))}
                        />

                        {form.values.catDesc.map((item, index) =>
                            "" + item.incidentCategoryId === selectedCategoryId ? (
                                <div key={item.incidentCategoryId} className="mt-4 space-y-4"
                                >
                                    <Textarea
                                        label={`Description for ${categoryMap[item.incidentCategoryId]?.name}`}
                                        withAsterisk
                                        placeholder={`Describe the severity level for ${categoryMap[item.incidentCategoryId]?.name}`}
                                        {...form.getInputProps(`catDesc.${index}.description`)}
                                    />
                                    <div className="space-y-3">

                                        <div className=" ">Examples</div>
                                        {
                                            item.examples?.map((_x, idx) => < TextInput key={idx} withAsterisk placeholder="Enter example" {...form.getInputProps(`catDesc.${index}.examples.${idx}.desc`)} rightSection={<ActionIcon onClick={() => form.removeListItem(`catDesc.${index}.examples`, idx)} color="red"><IconTrash /></ActionIcon>} />
                                            )}
                                        <Button onClick={() => form.insertListItem(`catDesc.${index}.examples`, { "desc": "" })} leftSection={<IconPlus size={15} />} type="button" size="compact-sm" variant="subtle">Add Example</Button>
                                    </div>
                                </div>
                            ) : null
                        )}

                    </div>
                    <div className="col-span-2 justify-self-end">
                        <Button type="submit" mt="md" variant="gradient">Add Level</Button>
                    </div>
                </form>
            </Modal>
            <Modal opened={openedUpdate} size="xl" onClose={closeUpdate} centered title={
                <div className="text-lg text-blue-500">
                    Update Severity Level
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='grid grid-cols-1 gap-4' onSubmit={updateForm.onSubmit(handleUpdate)}>
                    <Select disabled label="Level" withAsterisk placeholder='Select Level' data={severityLevels} {...updateForm.getInputProps('level')} />
                    <TextInput label="Name" withAsterisk placeholder='Enter name' {...updateForm.getInputProps('name')} />
                    <Textarea label={categoryMap[updateForm.values.incidentCategoryId]?.name} withAsterisk placeholder="Enter Description" {...updateForm.getInputProps(`description`)} />
                    <Button type="submit" mt="md" variant="gradient">Update</Button>
                </form>
            </Modal>

            <Modal opened={openedExample} size="md" onClose={closeExample} centered title={
                <div className="text-lg text-blue-500">
                    Add New Example
                </div>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='grid grid-cols-1 gap-4' onSubmit={exampleForm.onSubmit(handleAddExample)}>

                    <TextInput label="Example" withAsterisk placeholder="Enter example" {...exampleForm.getInputProps(`example`)} />
                    <Button type="submit" mt="md" variant="gradient">Add Example</Button>
                </form>
            </Modal>


            <MatrixModal categories={categories} opened={openedMatrix} onClose={closeMatrix} />

        </div >
    );
};

export default SeverityLevelData;
