import { Button } from "@mantine/core";
import { IconBook, IconEdit, IconEye, IconTag } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { formatDateWithDay } from "../../../utility/DateFormats";

interface LessonLearnedData {
    id: number;
    incidentId: number;
    incidentTitle: string;
    category: string;
    description?: string;
    status: string;
    date: string;
    employeeName: string; // ✅ Add this line
}

const categoryColorMap: Record<string, string> = {
    Technical: "bg-blue-100 text-blue-800",
    Procedural: "bg-purple-100 text-purple-800",
    Training: "bg-green-100 text-green-800",
    Communication: "bg-yellow-100 text-yellow-800",
    Other: "bg-gray-100 text-gray-800",
};

const getStatusTag = (status: string) => {
    const lower = status.toLowerCase();
    switch (lower) {
        case "approved":
            return { class: "bg-green-100 text-green-800", label: "Approved" };
        case "pending":
            return { class: "bg-yellow-100 text-yellow-800", label: "Pending" };
        default:
            return { class: "bg-gray-100 text-gray-800", label: status };
    }
};

const LessonLearnCard = ({ lessonData }: { lessonData: LessonLearnedData }) => {
    const categoryClass = categoryColorMap[lessonData.category] || "bg-gray-100 text-gray-800";
    const statusInfo = getStatusTag(lessonData.status);

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
            <div className="flex gap-3  justify-between">
                <span className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg capitalize ${categoryClass}`}>
                    <IconTag size={16} /> {lessonData.category}
                </span>
                <span className={`text-sm px-2 py-1 rounded-lg ${statusInfo.class}`}>
                    {statusInfo.label}
                </span>
            </div>

            <Link to={`/incidents/viewDetails/${lessonData.incidentId}`} className=" text-blue-700 hover:underline">
                {lessonData.incidentTitle}
            </Link>

            <p className="text-gray-600 text-sm">By: {lessonData.employeeName}</p>

            <div className="text-gray-500 text-sm">
                Lesson Date: {formatDateWithDay(lessonData.date)}
            </div>

            <div className="flex justify-center grow gap-4">
                <Button size="xs" variant="subtle" leftSection={<IconEye />} color="primary">
                    View
                </Button>
                <Button size="xs" variant="subtle" leftSection={<IconEdit />} color="blue">
                    Edit
                </Button>
                <Button size="xs" variant="subtle" leftSection={<IconBook />} color="green">
                    Learn
                </Button>
            </div>
        </div>
    );
};

export default LessonLearnCard;
