import { useEffect, useState } from "react";
import { Badge, Button, Switch, Tooltip } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconFileDownload, IconGavel, IconShieldCheck, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
    exportIncidentPdf,
    markNotifiedToAuthority,
    setRegulatoryStatus,
} from "../../../../services/IncidentService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { notifyError } from "../../../../utility/notifyError";

// E3.1 — Déclaration réglementaire (ISO 45001 §7.5.3) : notifiabilité à
// l'autorité (inspection des mines), minuterie statutaire, déclaration effective,
// et export PDF officiel de l'incident + son enquête.

const toDate = (v: any): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

// Date locale au format ISO court (évite le décalage UTC de toISOString()).
const toIsoLocal = (d: Date | null): string | null => {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const RegulatoryPanel = ({ incident, onChange, canEdit = true }: any) => {
    const { t, i18n } = useTranslation("incidents");
    const fmtDate = (v: any) => new Date(v).toLocaleDateString(i18n.language);
    const [notifiable, setNotifiable] = useState<boolean>(!!incident?.notifiable);
    const [deadline, setDeadline] = useState<Date | null>(toDate(incident?.regulatoryDeadline));
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        setNotifiable(!!incident?.notifiable);
        setDeadline(toDate(incident?.regulatoryDeadline));
    }, [incident?.id, incident?.notifiable, incident?.regulatoryDeadline]);

    const notifiedAt = incident?.notifiedToAuthorityAt;
    const incidentId = incident?.id;

    const daysLeft = (): number | null => {
        if (!deadline) return null;
        const diff = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
        return diff;
    };

    const handleSave = () => {
        if (!incidentId || saving) return;
        setSaving(true);
        setRegulatoryStatus(incidentId, notifiable, notifiable ? toIsoLocal(deadline) : null)
            .then(() => {
                successNotification(t("regulatory.statusSaved"));
                onChange?.();
            })
            .catch((err) => notifyError(err, t("regulatory.statusSaveError")))
            .finally(() => setSaving(false));
    };

    const handleMarkNotified = () => {
        if (!incidentId) return;
        markNotifiedToAuthority(incidentId)
            .then(() => {
                successNotification(t("regulatory.notifiedSaved"));
                onChange?.();
            })
            .catch((err) => notifyError(err, t("regulatory.notifiedSaveError")));
    };

    const handleExport = () => {
        if (!incidentId || exporting) return;
        setExporting(true);
        exportIncidentPdf(incidentId)
            .then((blob) => {
                const href = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = href;
                a.download = `incident-${incident?.number || incidentId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(href);
            })
            .catch(() => {
                // La réponse d'erreur est un Blob (responseType blob) : notifyError ne
                // saurait pas l'extraire → message fixe clair.
                errorNotification(t("regulatory.pdfError"));
            })
            .finally(() => setExporting(false));
    };

    const dl = daysLeft();

    return (
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className="text-base text-gray-800 flex items-center gap-2">
                    <IconGavel size={18} className="text-slate-600" /> {t("regulatory.title")}
                </h4>
                <Tooltip label={t("regulatory.exportTooltip")}>
                    <Button
                        size="xs"
                        variant="light"
                        color="slate"
                        leftSection={<IconFileDownload size={16} />}
                        loading={exporting}
                        onClick={handleExport}
                    >
                        {t("regulatory.exportPdf")}
                    </Button>
                </Tooltip>
            </div>

            {/* Bandeau d'échéance / statut de déclaration */}
            {notifiedAt ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border-l-4 border-green-500 px-3 py-2">
                    <IconShieldCheck size={20} className="text-green-600 shrink-0" />
                    <span className="text-sm text-green-800">
                        {t("regulatory.declaredOn", { date: fmtDate(notifiedAt) })}
                    </span>
                </div>
            ) : incident?.notifiable ? (
                <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg bg-amber-50 border-l-4 border-amber-500 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <IconAlertTriangle size={20} className="text-amber-600 shrink-0" />
                        <span className="text-sm text-amber-800">
                            {t("regulatory.declarationRequired")}
                            {incident?.regulatoryDeadline && (
                                <> {t("regulatory.before", { date: fmtDate(incident.regulatoryDeadline) })}</>
                            )}
                            {dl !== null && (
                                <Badge
                                    ml={8}
                                    size="sm"
                                    color={dl < 0 ? "red" : dl <= 2 ? "orange" : "yellow"}
                                    variant="filled"
                                >
                                    {dl < 0
                                        ? t("regulatory.overdue", { count: Math.abs(dl) })
                                        : t("regulatory.remaining", { count: dl })}
                                </Badge>
                            )}
                        </span>
                    </div>
                    {canEdit && (
                        <Button size="xs" color="amber" variant="filled" onClick={handleMarkNotified}>
                            {t("regulatory.markNotified")}
                        </Button>
                    )}
                </div>
            ) : null}

            {/* Édition de la notifiabilité */}
            {canEdit && (
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <Switch
                        checked={notifiable}
                        onChange={(e) => setNotifiable(e.currentTarget.checked)}
                        label={t("regulatory.notifiableLabel")}
                        color="teal"
                    />
                    {notifiable && (
                        <DateInput
                            size="xs"
                            label={t("regulatory.deadlineLabel")}
                            valueFormat="DD/MM/YYYY"
                            value={deadline}
                            onChange={(v: any) => setDeadline(v ? new Date(v) : null)}
                            clearable
                            className="max-w-[200px]"
                        />
                    )}
                    <Button size="xs" onClick={handleSave} loading={saving} className="!bg-primary-500">
                        {t("regulatory.save")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RegulatoryPanel;
