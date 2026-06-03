import { Text, Group } from "@mantine/core";
import { DonutChart } from "@mantine/charts";

const Leave = () => {
    const data = [
        { name: "Total Leaves", value: 21, chartColor: "#4F46E5", dotColor: "bg-indigo-500", textColor: "text-gray-900", numberColor: "text-indigo-600" },
        { name: "Leaves Taken", value: 7, chartColor: "#0D9488", dotColor: "bg-teal-500", textColor: "text-gray-900", numberColor: "text-teal-600" },
        { name: "Exceptional Leave", value: 2, chartColor: "#9333EA", dotColor: "bg-purple-500", textColor: "text-gray-900", numberColor: "text-purple-600" },
        { name: "Pending Approval", value: 1, chartColor: "#DC2626", dotColor: "bg-red-500", textColor: "text-gray-900", numberColor: "text-red-600" },
    ];

    return (
        <div className=" bg-white rounded-lg shadow-xl p-4 flex flex-col gap-2  border border-gray-200">
            <Text size="xl" mb="md">
                Leave Statistics
            </Text>
            <div className="flex  items-center gap-5 p-2">
                {/* Left Section: Donut Chart */}
                <DonutChart
                    data={data.map((item) => ({
                        name: item.name,
                        value: item.value,
                        color: item.chartColor,
                    }))}
                    size={130}
                    chartLabel="73%"
                />

                {/* Right Section: Styled Details */}
                <div className="">
                    {data.map((item, index) => (
                        <Group key={index}  >
                            <div className="flex  gap-4  items-center">

                                <div className={`w-3 h-3 rounded-full ${item.dotColor}`} />


                                <div className="flex flex-col gap-2 ">
                                    <Text size="sm" >
                                        {item.name}
                                    </Text>

                                    <Text size="sm" color='blue'>
                                        {item.value}
                                    </Text>


                                </div>



                            </div>
                        </Group>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leave;
