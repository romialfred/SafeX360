import { Text, Stack } from "@mantine/core";
import { IconCalendar, IconCalendarEvent } from "@tabler/icons-react";

const Holidays = () => {

    const datesData = [
        {
            title: "Easter Monday",
            date: "Apr 22, 2024",

        },
        {
            title: "Labor Day",
            date: "May 1, 2024",

        },
        {
            title: "Ascension Day",
            date: "May 9, 2024",


        },
        {
            title: "Whit Monday",
            date: "Jun 10, 2024",


        },
    ];
    return (
        <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-xl border border-gray-200">

            <div className="flex gap-2 items-center">
                <IconCalendarEvent stroke={2} color="purple" />
                <Text size="xl" className="text-gray-900">Upcoming Holidays</Text>
            </div>


            {/* Cards Section */}
            <Stack gap="md">
                {datesData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center ">
                        {/* Left Section (Icon + Title + Date) */}
                        <div className="flex gap-4 items-center">
                            {/* Dynamic Icon */}
                            <div>
                                <IconCalendar stroke={2} />
                            </div>

                            {/* Title & Date */}
                            <div className="flex flex-col">
                                <Text size="md">{item.title}</Text>
                                <Text size="sm" color="dimmed">{item.date}</Text>
                            </div>
                        </div>

                        {/* Label with Dynamic Colors */}
                        <div >
                            <p className="text-primary bg-hoverbg  text-xs p-2 rounded-4xl">Public Holiday</p>
                        </div>
                    </div>
                ))}
            </Stack>
        </div>
    )
}

export default Holidays