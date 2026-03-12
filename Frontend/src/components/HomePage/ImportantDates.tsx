import { Text, Stack } from "@mantine/core";
import { IconCalendarTime, IconClipboardText, IconUserCheck, IconWifi } from "@tabler/icons-react";

const datesData = [
    {
        title: "Monthly Salary Payment",
        date: "March 30, 2024",
        salary: "Salary",
        textColor: "text-green-700",
        bgColor: "bg-green-100",
        icon: <IconCalendarTime size={20} />
    },
    {
        title: "Timesheet Submission Deadline",
        date: "March 25, 2024",
        salary: "Timesheet",
        textColor: "text-blue-700",
        bgColor: "bg-blue-100",
        icon: <IconClipboardText size={20} />
    },
    {
        title: "Annual Leave Request (Pending)",
        date: "April 15-20, 2024",
        salary: "Leave",
        textColor: "text-red-700",
        bgColor: "bg-red-100",
        icon: <IconUserCheck size={20} />
    },
    {
        title: "Upcoming Internet Audit",
        date: "April 1, 2024",
        salary: "Audit",
        textColor: "text-purple-700",
        bgColor: "bg-purple-100",
        icon: <IconWifi size={20} />
    },
];

const ImportantDates = () => {
    return (
        <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-xl border border-gray-200 ">
            {/* Heading */}
            <Text size="xl" fw={700} className="text-gray-900">Important Dates</Text>

            {/* Cards Section */}
            <Stack gap="md">
                {datesData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
                        {/* Left Section (Icon + Title + Date) */}
                        <div className="flex gap-4 items-center">
                            {/* Dynamic Icon */}
                            <div>
                                {item.icon}
                            </div>

                            {/* Title & Date */}
                            <div className="flex flex-col">
                                <Text size="md" fw={600}>{item.title}</Text>
                                <Text size="sm" color="dimmed">{item.date}</Text>
                            </div>
                        </div>

                        {/* Label with Dynamic Colors */}
                        <div className={`px-4 py-2 rounded-full ${item.textColor} ${item.bgColor} font-bold`}>
                            {item.salary}
                        </div>
                    </div>
                ))}
            </Stack>
        </div>
    );
};

export default ImportantDates;
