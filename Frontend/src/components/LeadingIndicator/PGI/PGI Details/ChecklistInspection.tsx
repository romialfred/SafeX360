import { Button, Group, Select } from "@mantine/core";
import { IconPaperclip, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import TextEditor from "../../../UtilityComp/TextEditor";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import EmptyState from "../../../UtilityComp/EmptyState";
import { getAllActiveCheckList } from "../../../../services/ChecklistParameterService";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { addInspectionChecklist, getChecklistsByInspectionId, removeInsChecklist } from "../../../../services/InspectionProcessService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import {
    CHECKLIST_STATUS_OPTIONS,
    checklistStatusConfig,
    CHIP_BASE,
    NC_LEVEL_OPTIONS,
    ncLevelConfig,
    SECTION_TITLE_STYLE,
} from "../pgiLabels";

/**
 * Points de checklist contrôlés pendant l'inspection : statut de conformité,
 * niveau de non-conformité éventuel, observation et pièces jointes.
 */
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
            .catch((_err) => console.error(_err))
        fetchData();
    }, [])

    const fetchData = () => {
        getChecklistsByInspectionId(id).then((res) => {
            setChecklistsData(res);
        }).catch((_error) => console.error(_error))
    }

    const handleAddChecklist = async (values: any) => {
        dispatch(showOverlay());
        const docs = await convertFilesToBase64New(values.docs);
        addInspectionChecklist({
            ...values,
            docs: docs,
            generalInspectionId: id,
        }).then((_res) => {
            successNotification("Point de checklist ajouté");
            form.reset();
            setShowAddForm(false);
            fetchData();
        }).catch((error) => {
            errorNotification(error?.response?.data?.errorMessage || "L'ajout du point de checklist a échoué")
        }).finally(() => {
            dispatch(hideOverlay());
        })
    };

    const handleRemove = (rowId: any) => {
        modals.openConfirmModal({
            title: <span className="text-base">Retirer le point de checklist</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous retirer ce point de checklist de l'inspection ? Cette action est définitive.
                </span>
            ),
            labels: { confirm: 'Oui, retirer', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: 'red', variant: 'filled' },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                removeInsChecklist(rowId)
                    .then(() => {
                        setChecklistsData([...checklistsData.filter((x) => x.id != rowId)]);
                        successNotification("Point de checklist retiré");
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Le retrait du point de checklist a échoué");
                    });
            },
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {showAddForm ? (
                <form className="bg-white rounded-xl border border-slate-200 p-4 space-y-4" onSubmit={form.onSubmit(handleAddChecklist)}>
                    <Group grow>
                        <Select
                            label="Point de checklist"
                            placeholder="Sélectionner le point à contrôler"
                            data={checklist
                                .filter((x: any) => !checklistsData.some((item: any) => item.checkListId == x.id))
                                .map((x: any) => ({ value: "" + x.id, label: x.name }))}
                            {...form.getInputProps("checkListId")}
                            withAsterisk
                            size="sm"
                            searchable
                        />
                        <Select
                            label="Constat"
                            data={CHECKLIST_STATUS_OPTIONS}
                            {...form.getInputProps("status")}
                            withAsterisk
                            size="sm"
                        />
                        {form.values.status === "Non-Compliant" && (
                            <Select
                                label="Niveau de non-conformité"
                                data={NC_LEVEL_OPTIONS}
                                {...form.getInputProps("nonConformityLevel")}
                                size="sm"
                            />
                        )}
                    </Group>
                    <TextEditor form={form} id="observation" title="Observation" />
                    <FileUpdateDropzone name="Pièces jointes" id="docs" form={form} />
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button type="button" variant="default" size="sm" onClick={() => setShowAddForm(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" color="teal" size="sm" disabled={!form.values.checkListId}>
                            Ajouter le point
                        </Button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-slate-800" style={SECTION_TITLE_STYLE}>
                            Points de checklist contrôlés
                        </h3>
                        <Button color="teal" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setShowAddForm(true)}>
                            Ajouter un point
                        </Button>
                    </div>
                    {checklistsData?.length === 0 && (
                        <EmptyState
                            title="Aucun point de checklist saisi"
                            description="Ajoutez les points contrôlés sur le terrain avec leur constat de conformité."
                            compact
                        />
                    )}
                    {checklistsData?.map((item: any) => {
                        const statusCfg = checklistStatusConfig(item.status);
                        const ncCfg = ncLevelConfig(item.nonConformityLevel);
                        return (
                            <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-2 flex-wrap">
                                    <div className="min-w-0">
                                        <h4 className="text-slate-800" style={SECTION_TITLE_STYLE}>
                                            {record[item.checkListId]?.name || 'Point de checklist'}
                                        </h4>
                                        {record[item.checkListId]?.description && (
                                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                                {record[item.checkListId]?.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`${CHIP_BASE} ${statusCfg.chip}`}>{statusCfg.label}</span>
                                        {item.status === "Non-Compliant" && item.nonConformityLevel && (
                                            <span className={`${CHIP_BASE} ${ncCfg.chip}`}>{ncCfg.label}</span>
                                        )}
                                        <Button
                                            color="red"
                                            variant="light"
                                            size="xs"
                                            onClick={() => handleRemove(item.id)}
                                            leftSection={<IconTrash size={14} />}
                                        >
                                            Retirer
                                        </Button>
                                    </div>
                                </header>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Observation</p>
                                        {/* LOT 41 P0 XSS fix */}
                                        <SafeHtml html={item.observation} className="text-[13px] text-slate-700 leading-relaxed" />
                                    </div>
                                    {item.docs && item.docs?.length > 0 && (
                                        <div>
                                            <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1.5">Pièces jointes</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item?.docs?.map((doc: any) => (
                                                    <button
                                                        key={doc.name}
                                                        type="button"
                                                        onClick={() => handlePreview(doc)}
                                                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-700 hover:bg-slate-100"
                                                        aria-label={`Prévisualiser la pièce jointe ${doc.name}`}
                                                    >
                                                        <IconPaperclip size={12} aria-hidden="true" />
                                                        {doc.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export default ChecklistInspection;
