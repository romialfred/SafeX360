import { Badge, Button, Card, Group, Select, Text } from "@mantine/core";
import { IconPhoto, IconTrash } from "@tabler/icons-react";
import TextEditor from "../../../UtilityComp/TextEditor";
import { useEffect, useState } from "react";
import { getAllActiveCheckList } from "../../../../services/ChecklistParameterService";
// import SearchableDropdown from "../../../UtilityComp/SearchableDropdown";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { addInspectionChecklist, getChecklistsByInspectionId, removeInsChecklist } from "../../../../services/InspectionProcessService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { useForm } from "@mantine/form";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";






const ChecklistInspection = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [checklist, setChecklist] = useState<any>([]);
    const [record, setCheckListRecord] = useState<Record<string, any>>({});
    const [checklistsData, setChecklistsData] = useState<any[]>([]);

    const [showAddForm, setShowAddForm] = useState(false);

    const form = useForm({
        initialValues: {
            checkListId: '',
            status: 'Not-Applicable',
            nonConformityLevel: '',
            observation: '',
            docs: [],
            inspectionId: id,
        },
    });

    useEffect(() => {
        getAllActiveCheckList()
            .then((res) => {
                setChecklist(res);
                setCheckListRecord(mapIdToName(res));
            })
            .catch((_err) => { })
        fetchData();
    }, [])

    const fetchData = () => {
        getChecklistsByInspectionId(id).then((res) => {
            setChecklistsData(res);
        }).catch((_error) => {

        })
    }



    const handleAddChecklist = async (values: any) => {
        dispatch(showOverlay());
        const docs = await convertFilesToBase64New(values.docs);
        addInspectionChecklist({
            ...values,
            docs: docs,
            generalInspectionId: id,
        }).then((_res) => {
            successNotification("Checklist added successfully");
            form.reset();
            setShowAddForm(false);
            fetchData();

        }).catch((error) => {
            errorNotification(error?.response?.data?.errorMessage)

        }).finally(() => {
            dispatch(hideOverlay());
        })

    };

    const handleShowAddForm = () => {
        setShowAddForm(true);
    };

    const handleCancelAddForm = () => {

        setShowAddForm(false);
    };

    const handleRemove = (id: any) => {

        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to remove this checklist? This action cannot be undone.
                </span>
            ),
            labels: { confirm: `Yes, Remove`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                removeInsChecklist(id)
                    .then(() => {
                        setChecklistsData([...checklistsData.filter((x) => x.id != id)]);
                        successNotification("Checklist removed successfully");

                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                    });
            },
        });

    };

    return (
        <div className="flex flex-col gap-5">
            {showAddForm ? (
                <form className="bg-white p-6 rounded-lg shadow space-y-4" onSubmit={form.onSubmit(handleAddChecklist)}>
                    <Group grow>
                        <Select
                            label="Checklist"
                            placeholder="Select checklist"
                            data={checklist.filter((x: any) => !checklistsData.some((item: any) => item.checkListId == x.id)).map((x: any) => ({ value: "" + x.id, label: x.name }))}
                            {...form.getInputProps("checkListId")}
                            withAsterisk
                        />
                        <Select
                            label="Status"
                            data={["Compliant", "Non-Compliant", "Not-Applicable"]}
                            {...form.getInputProps("status")}
                            withAsterisk
                        />
                        {form.values.status === "Non-Compliant" && (
                            <Select
                                label="Non-Conformity Level"
                                data={["Critical", "Major", "Minor"]}
                                {...form.getInputProps("nonConformityLevel")}
                            />
                        )}
                    </Group>
                    <TextEditor
                        form={form}
                        id="observation"
                        title="Observation"
                    />
                    <FileUpdateDropzone
                        name="Documents"
                        id="docs"
                        form={form}
                    />
                    <Group justify="end">
                        <Button type="button" color="gray" variant="light" onClick={handleCancelAddForm}>
                            Cancel
                        </Button>
                        <Button type="submit" color="green" disabled={!form.values.checkListId}>
                            Add Checklist
                        </Button>
                    </Group>
                </form>
            ) : (
                <>
                    <Group justify="space-between">
                        <div className="text-lg">Checklists</div>
                        <Button color="green" onClick={handleShowAddForm}>
                            Add Checklist
                        </Button>
                    </Group>
                    {checklistsData?.length === 0 && (
                        <Text color="dimmed" ta="center">No checklists added yet.</Text>
                    )}
                    {checklistsData?.map((item: any) => (
                        <Card
                            key={item.id}
                            shadow="md"
                            radius="lg"
                            withBorder
                            className="bg-white p-6 space-y-6 transition hover:shadow-xl"
                        >
                            <div>
                                <div className="flex justify-between w-full">
                                    <div>
                                        <Text size="lg">
                                            {record[item.checkListId]?.name || "No name"}
                                        </Text>
                                        <Text size="sm" color="dimmed" mt={1}>
                                            {record[item.checkListId]?.description || ""}
                                        </Text>
                                    </div>
                                    <Button
                                        color="red"
                                        variant="light"
                                        onClick={() => handleRemove(item.id)}
                                        leftSection={<IconTrash size={16} />}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 ">

                                    <Text size="sm" mt={8}><b>Status:</b> {item.status}</Text>
                                    {item.status === "Non-Compliant" && (
                                        <>
                                            <Text size="sm" mt={4}><b>Non-Conformity Level:</b> {item.nonConformityLevel}</Text>
                                        </>
                                    )}
                                </div>
                                <Text size="sm" mt={4}><b>Observation</b></Text>
                                {/* LOT 41 P0 XSS fix */}
                                <SafeHtml html={item.observation} />
                                {item.docs && item.docs?.length > 0 && (
                                    <div className="md:col-span-2">
                                        <p className="block text-sm my-2">Attachments:</p>
                                        <Group className="flex flex-wrap flex-col !gap-1">
                                            {item?.docs?.map((doc: any) => (
                                                <Badge
                                                    key={doc.name}
                                                    size="sm"
                                                    className="!cursor-pointer !capitalize !hover:!underline"
                                                    onClick={() => handlePreview(doc)}
                                                    leftSection={<IconPhoto size={12} />}
                                                    color="orange"
                                                    variant="transparent"

                                                >
                                                    {doc.name}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </>
            )}
        </div>
    );
}

export default ChecklistInspection;