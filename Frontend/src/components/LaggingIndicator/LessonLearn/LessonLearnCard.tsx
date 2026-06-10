import { Button } from "@mantine/core";
import { IconEye, IconTag } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateWithDay } from "../../../utility/DateFormats";
import { lessonCategoryLabel, lessonStatusLabel } from "../IncidentManagement/incidentLabels";

interface LessonLearnedData {
    id: number;
    incidentId: number;
    incidentTitle: string;
    category: string;
    description?: string;
    status: string;
    date: string;
    employeeName: string;
}

const categoryColorMap: Record<string, string> = {
    Technical: "bg-blue-100 text-blue-800",
    Procedural: "bg-purple-100 text-purple-800",
    Training: "bg-green-100 text-green-800",
    Communication: "bg-yellow-100 text-yellow-800",
    Other: "bg-gray-100 text-gray-800",
};

// Palette charte R7 : emerald = approuvée, violet = en attente
const getStatusTag = (status: string) => {
    const lower = status.toLowerCase();
    switch (lower) {
        case "approved":
            return { class: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: lessonStatusLabel(status) };
        case "pending":
            return { class: "bg-violet-50 text-violet-700 border border-violet-200", label: lessonStatusLabel(status) };
        default:
            return { class: "bg-slate-100 text-slate-700", label: status };
    }
};

const LessonLearnCard = ({ lessonData }: { lessonData: LessonLearnedData }) => {
    const navigate = useNavigate();
    const categoryClass = categoryColorMap[lessonData.category] || "bg-gray-100 text-gray-800";
    const statusInfo = getStatusTag(lessonData.status);

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-[box-shadow,border-color] duration-200 hover:shadow-md cursor-pointer hover:border-primary">
            <div className="flex gap-3  justify-between">
                <span className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg ${categoryClass}`}>
                    <IconTag size={16} /> {lessonCategoryLabel(lessonData.category)}
                </span>
                <span className={`text-sm px-2 py-1 rounded-lg ${statusInfo.class}`}>
                    {statusInfo.label}
                </span>
            </div>

            <Link to={`/incidents/${lessonData.incidentId}?tab=lessons`} className=" text-blue-700 hover:underline">
                {lessonData.incidentTitle}
            </Link>

            <p className="text-gray-600 text-sm">Responsable : {lessonData.employeeName}</p>

            <div className="text-gray-500 text-sm">
                Date de la leçon : {formatDateWithDay(lessonData.date)}
            </div>

            <div className="flex justify-center grow gap-4">
                <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconEye />}
                    color="primary"
                    onClick={() => navigate(`/incidents/${lessonData.incidentId}?tab=lessons`)}
                >
                    Voir le détail
                </Button>
            </div>
        </div>
    );
};

export default LessonLearnCard;
