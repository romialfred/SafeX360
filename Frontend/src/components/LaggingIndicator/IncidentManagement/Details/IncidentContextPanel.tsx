import { useEffect, useState } from "react";
import { Badge } from "@mantine/core";
import { IconTruck, IconClockHour4, IconEyeOff, IconGitCompare, IconChevronRight } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSimilarIncidents } from "../../../../services/IncidentService";
import { incidentStatusLabel } from "../incidentLabels";

// E3.2 — Contexte terrain (engin/quart), signalement confidentiel, et
// recherche « incidents similaires » (récurrence, ISO 45001 §10.2 apprentissage).

const IncidentContextPanel = ({ incident }: any) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation("incidents");
    const [similar, setSimilar] = useState<any[]>([]);
    const incidentId = incident?.id;

    useEffect(() => {
        if (!incidentId) return;
        getSimilarIncidents(incidentId)
            .then((res: any) => setSimilar(Array.isArray(res) ? res : []))
            .catch(() => setSimilar([]));
    }, [incidentId]);

    const hasContext = incident?.equipment || incident?.shift || incident?.confidential;
    const shiftLabel = (s: string) => t(`context.shift.${s}`, { defaultValue: s });

    return (
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 flex flex-col gap-4">
            {/* Contexte terrain + confidentialité */}
            {hasContext && (
                <div className="flex flex-wrap items-center gap-2">
                    {incident?.equipment && (
                        <Badge size="sm" color="cyan" variant="light" leftSection={<IconTruck size={13} />}>
                            {incident.equipment}
                        </Badge>
                    )}
                    {incident?.shift && (
                        <Badge size="sm" color="grape" variant="light" leftSection={<IconClockHour4 size={13} />}>
                            {t("context.shiftPrefix")} {shiftLabel(incident.shift)}
                        </Badge>
                    )}
                    {incident?.confidential && (
                        <Badge size="sm" color="gray" variant="filled" leftSection={<IconEyeOff size={13} />}>
                            {t("context.confidential")}
                        </Badge>
                    )}
                </div>
            )}

            {/* Incidents similaires */}
            <div>
                <h4 className="text-sm text-gray-700 flex items-center gap-2 mb-2">
                    <IconGitCompare size={16} className="text-slate-500" /> {t("context.similarTitle")}
                </h4>
                {similar.length === 0 ? (
                    <p className="text-xs text-slate-400">{t("context.similarEmpty")}</p>
                ) : (
                    <div className="flex flex-col divide-y divide-gray-100">
                        {similar.map((s: any) => (
                            <button
                                type="button"
                                key={s.id}
                                onClick={() => navigate(`/incidents/${s.id}`)}
                                className="text-left flex items-center justify-between gap-2 py-2 hover:bg-slate-50 rounded px-1 transition-colors"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-800 truncate">{s.title || t("context.untitled")}</span>
                                        {s.sameLocation && <Badge size="xs" color="teal" variant="light">{t("context.sameLocation")}</Badge>}
                                        {s.sameProcess && <Badge size="xs" color="indigo" variant="light">{t("context.sameProcess")}</Badge>}
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {s.number}
                                        {s.occurredAt ? ` · ${new Date(s.occurredAt).toLocaleDateString(i18n.language)}` : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Badge size="xs" variant="outline" color="gray">{incidentStatusLabel(s.status)}</Badge>
                                    <IconChevronRight size={14} className="text-slate-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncidentContextPanel;
