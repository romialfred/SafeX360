import { useEffect, useState } from "react";
import { Button, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCalendar, IconEdit, IconFilePencil, IconPaperclip } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import TextEditor from "../../../UtilityComp/TextEditor";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { formatDateShort } from "../../../../utility/DateFormats";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { addInspectionReport, getInspectionReportByInspectionId } from "../../../../services/PgiReportService";
import { SECTION_TITLE_STYLE } from "../pgiLabels";

interface InspectionReportProps {
    /** Options de Select { value, label } des employés (rédacteur du rapport). */
    employee?: any[];
    /** Correspondance id → employé pour afficher le nom du rédacteur. */
    empMap?: Record<string, any>;
}

/**
 * Rapport de synthèse de l'inspection : rédacteur, date, compte rendu et
 * pièces justificatives.
 */
const InspectionReport = ({ employee = [], empMap = {} }: InspectionReportProps) => {
    const dispatch = useDispatch();
    const { id } = useParams(); // identifiant de l'inspection
    const [isEditing, setIsEditing] = useState(true);
    const [report, setReport] = useState<any>(null);

    const form = useForm({
        initialValues: {
            reportedId: "",
            reportDate: "",
            description: "",
            docs: [],
            generalInspectionId: '',
        },
        validate: {
            reportedId: (value) => (value ? null : 'Sélectionnez le rédacteur du rapport'),
            reportDate: (value) => (value ? null : 'La date du rapport est obligatoire'),
        },
    });

    useEffect(() => {
        dispatch(showOverlay());
        getInspectionReportByInspectionId(id)
            .then((res: any) => {
                setReport(res);
                setIsEditing(false);
            })
            .catch(() => {
                setIsEditing(true);
            })
            .finally(() => dispatch(hideOverlay()));
    }, [id]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        form.validate();
        if (!form.isValid()) return;

        const values = form.values;

        modals.openConfirmModal({
            title: <span className="text-base">Soumettre le rapport</span>,
            centered: true,
            children: <span className="text-sm">Confirmer la soumission du rapport d'inspection ?</span>,
            labels: { confirm: 'Oui, soumettre', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: 'teal', variant: 'filled' },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                dispatch(showOverlay());
                try {
                    const evidence = await convertFilesToBase64New(values.docs);
                    const payload = {
                        generalInspectionId: parseInt(id || ""),
                        reportDate: dayjs(values.reportDate).format("YYYY-MM-DD"),
                        reportedId: Number(values.reportedId),
                        description: values.description,
                        docs: evidence,
                    };

                    await addInspectionReport(payload);
                    successNotification("Rapport d'inspection enregistré");

                    form.reset();
                    setIsEditing(false);
                    getInspectionReportByInspectionId(id).then(setReport);
                } catch (err: any) {
                    errorNotification(err.response?.data?.errorMessage || "L'enregistrement du rapport a échoué");
                } finally {
                    dispatch(hideOverlay());
                }
            },
        });
    };

    const reporterName = (reporterId: any) => empMap[reporterId]?.name || (reporterId ? `Employé #${reporterId}` : '—');

    return (
        <form onSubmit={handleSubmit}>
            {isEditing ? (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <IconFilePencil stroke={1.5} size={16} className="text-slate-600" aria-hidden="true" />
                            <h3 className="text-slate-800" style={SECTION_TITLE_STYLE}>
                                Rapport d'inspection
                            </h3>
                        </header>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                size="sm"
                                {...form.getInputProps("reportedId")}
                                label="Rédacteur du rapport"
                                placeholder="Sélectionner le rédacteur"
                                data={employee}
                                searchable
                                withAsterisk
                            />
                            <DateInput
                                size="sm"
                                leftSection={<IconCalendar size={14} />}
                                label="Date du rapport"
                                placeholder="JJ/MM/AAAA"
                                valueFormat="DD/MM/YYYY"
                                {...form.getInputProps("reportDate")}
                                withAsterisk
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <TextEditor form={form} id="description" title="Compte rendu" />
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-slate-800 mb-2" style={SECTION_TITLE_STYLE}>Pièces justificatives</p>
                        <FileUpdateDropzone name="Pièces justificatives" id="docs" form={form} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button onClick={handleSubmit} color="teal" size="sm">
                            Soumettre le rapport
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                        <h3 className="text-slate-800" style={SECTION_TITLE_STYLE}>
                            Synthèse du rapport d'inspection
                        </h3>
                        <Button onClick={() => setIsEditing(true)} size="xs" variant="default" leftSection={<IconEdit size={14} />}>
                            Modifier
                        </Button>
                    </header>

                    <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Rédigé par</p>
                                <p className="text-[13px] text-slate-800">{reporterName(report?.reportedId)}</p>
                            </div>
                            <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Date du rapport</p>
                                <p className="text-[13px] text-slate-800">{formatDateShort(report?.reportDate) || '—'}</p>
                            </div>
                            <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Inspection</p>
                                <p className="text-[13px] text-slate-800 tabular-nums">N° {report?.generalInspectionId ?? '—'}</p>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-md px-4 py-3">
                            {/* LOT 41 P0 XSS fix */}
                            <SafeHtml html={report?.description || ""} className="text-[13px] text-slate-700 leading-relaxed" />
                        </div>

                        {report?.docs?.length > 0 && (
                            <div>
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1.5">Pièces justificatives</p>
                                <div className="flex flex-wrap gap-2">
                                    {report.docs.map((doc: any) => (
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
            )}
        </form>
    );
};

export default InspectionReport;
