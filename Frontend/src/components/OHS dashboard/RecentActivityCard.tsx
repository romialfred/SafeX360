import { IconActivity, IconAlertCircle, IconCheck, IconClipboardText } from "@tabler/icons-react";

const activities = [
    {
        icon: <IconCheck size={26} className="text-green-600" />,
        title: "Positive Safety Observation",
        severity: "Low",
        description: "Proper PPE usage noted in production",
        time: "4 hours ago",
    },
    {
        icon: <IconClipboardText size={26} className="text-blue-600" />,
        title: "Safety Training Completed",
        severity: "Medium",
        description: "15 employees completed OH&S orientation",
        time: "1 day ago",
    },
    {
        icon: <IconActivity size={26} className="text-yellow-600" />,
        title: "Monthly Safety Audit",
        severity: "Medium",
        description: "Workplace inspection scheduled",
        time: "2 days ago",
    },
    {
        icon: <IconAlertCircle size={26} className="text-red-600" />,
        title: "Near Miss Reported",
        severity: "High",
        description: "Equipment malfunction prevented",
        time: "3 days ago",
    },
    {
        icon: <IconClipboardText size={26} className="text-blue-600" />,
        title: "Risk Assessment Updated",
        severity: "Medium",
        description: "Chemical storage area reassessed",
        time: "5 days ago",
    },
    {
        icon: <IconCheck size={26} className="text-green-600" />,
        title: "Emergency Drill Completed",
        severity: "Low",
        description: "Fire evacuation drill successful",
        time: "1 week ago",
    },
];

const getSeverityStyle = (severity: string) => {
    switch (severity) {
        case "High":
            return "bg-red-100 text-red-700 border-red-300";
        case "Medium":
            return "bg-yellow-100 text-yellow-700 border-yellow-300";
        case "Low":
            return "bg-green-100 text-green-700 border-green-300";
        default:
            return "bg-gray-100 text-gray-700 border-gray-300";
    }
};

const RecentActivityCard = () => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-5   border border-gray-300  h-[500px] flex flex-col col-span-2">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <IconActivity size={30} className="text-blue-600" />
                <h2 className="text-lg text-gray-800">Recent Activities</h2>
            </div>

            {/* Scrollable Area */}
            <div className="overflow-y-auto flex flex-col gap-4 pr-2">
                {activities.map((item, index) => (
                    <div key={index} className="bg-gray-50 hover:bg-blue-50 cursor-pointer border border-gray-200 rounded-md p-4 flex flex-col gap-2 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div>{item.icon}</div>
                                <p className="text-gray-800">{item.title}</p>
                            </div>
                            <span
                                className={`text-xs px-3 py-1 rounded-full border ${getSeverityStyle(item.severity)}`}
                            >
                                {item.severity}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-xs text-gray-400">{item.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivityCard;
