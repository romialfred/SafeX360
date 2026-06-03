import { Button } from "@mantine/core";
import {
    IconSchool,
    IconClock,
    IconUser,
} from "@tabler/icons-react";

const TrainingCard = ({ trainingSessions }: any) => {
    const statusColors: Record<string, { badge: string; progress: string }> = {
        Upcoming: {
            badge: "bg-green-100 text-green-700",
            progress: "bg-green-500",
        },
        Full: {
            badge: "bg-red-100 text-red-700",
            progress: "bg-red-500",
        },
        Available: {
            badge: "bg-yellow-100 text-yellow-700",
            progress: "bg-yellow-500",
        },
    };

    const status = (trainingSessions?.status || "Upcoming").trim();
    const colors = statusColors[status] || {
        badge: "bg-gray-100 text-gray-700",
        progress: "bg-gray-500",
    };

    const completed = trainingSessions?.enrollment?.completed || 0;
    const total = trainingSessions?.enrollment?.total || 1;
    const percentComplete = Math.round((completed / total) * 100);
    // const action = trainingSessions?.enrollment?.action || "Enroll";

    return (
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out p-4 space-y-4 cursor-pointer border border-gray-300">
            {/* Top badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <span className=" px-2 py-1 flex items-center gap-1 rounded-full bg-blue-100 text-blue-700">
                        <IconSchool size={25} className="text-blue-600" />
                    </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                    {status}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-lg text-gray-800">{trainingSessions.title}</h3>

            {/* Meta Info */}
            <div className="space-y-1  text-gray-700">
                <div className="flex items-center gap-2">
                    <IconClock size={20} className="text-gray-500" />
                    <span>{trainingSessions.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                    <IconUser size={20} className="text-gray-500" />
                    <span>Instructor: {trainingSessions.instructor}</span>
                </div>
            </div>

            {/* Description */}
            <p className=" text-gray-600 pt-1">{trainingSessions.description}</p>

            <hr className="border-gray-200" />

            {/* Progress Bar */}
            <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600 mb-1">
                    Enrollment Progress: {completed}/{total} completed
                </p>
                <div className=" bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                        className={`h-3 ${colors.progress} rounded-full`}
                        style={{ width: `${percentComplete}%` }}
                    />
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* Button */}
            <div className="pt-1">
                {/* <button
                    disabled={status === "Full"}
                    className={`w-full text-sm py-2 rounded-md transition duration-200 ${status === "Full"
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                >
                    {action}
                </button> */}
                <Button disabled={status === "Full"} fullWidth variant="outline" color="blue" size="sm" radius="md">
                    {status === "Full" ? "Training Full" : "Click for details"}
                </Button>
            </div>
        </div>
    );
};

export default TrainingCard;
