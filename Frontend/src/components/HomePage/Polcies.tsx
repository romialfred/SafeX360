import { Text, Stack } from "@mantine/core";
import { IconArrowNarrowRight, IconBook } from "@tabler/icons-react";

const Polcies = () => {
    const datesData = [
        {
            title: "Code of Conduct",
            date: "Guidelines for professional behavior",

        },
        {
            title: "Safety Protocols",
            date: "Standard safety procedures",

        },
        {
            title: "Environmental Policy",
            date: "Sustainability guidelines",


        },
        {
            title: "HR Policies",
            date: "Employment rules and benefits",


        },
    ];
    return (
        <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-xl  border border-gray-200">

            <div className="flex gap-2 items-center">
                <IconBook stroke={2} />
                <Text size="xl" className="text-gray-900">Company Policies</Text>
            </div>


            {/* Cards Section */}
            <Stack gap="md">
                {datesData.map((item, index) => (
                    <div key={index} className="flex gap-10 items-center justify-between ">
                        {/* Left Section (Icon + Title + Date) */}
                        <div className="flex gap-4 items-center">


                            {/* Title & Date */}
                            <div className="flex flex-col">
                                <Text size="md">{item.title}</Text>
                                <Text size="sm" color="dimmed">{item.date}</Text>
                            </div>
                        </div>

                        {/* Label with Dynamic Colors */}
                        <div className="flex items-center gap-2 hover:bg-primary/30 p-2 rounded">
                            <p className="text-primary  text-sm ">Consulter</p>
                            <IconArrowNarrowRight size={20} className="text-primary" />
                        </div>
                    </div>
                ))}
            </Stack>
        </div>
    )
}

export default Polcies
