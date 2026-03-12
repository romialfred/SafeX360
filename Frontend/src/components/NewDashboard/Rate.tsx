import { Text } from "@mantine/core";
import { IconCircleCheck, IconExclamationCircle, IconTrendingUp } from "@tabler/icons-react";


const Rate = () => {
    const cardData = [

        {
            icon: <IconExclamationCircle size={30} className="text-red-700" />,
            incident: "High Risk Areas",
            days: 3,
            label: "Requires immediate attention",
            bgColor: "bg-red-100",
            textColor: "text-red-700",
            incrementColor: "text-red-700",
            borderColor: "border-red-700"
        },
        {
            icon: <IconTrendingUp size={30} className="text-yellow-700" />,
            incident: "Safety Score",
            days: "85%",
            label: "+5% from last month",
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-700",
            incrementColor: "text-yellow-700",
            borderColor: "border-yellow-700"
        },
        {
            icon: <IconCircleCheck size={30} className="text-green-700" />,
            incident: "Compliance Rate",
            days: "92%",
            label: "Above target (90%)",
            bgColor: "bg-green-100",
            textColor: "text-green-700",
            incrementColor: "text-green-700",
            borderColor: "border-green-700"
        }
    ];

    return (
        <div className='grid grid-cols-3  gap-4 '>
            {cardData.map((card, index) => (
                <div key={index} className={`${card.bgColor} ${card.textColor} ${card.borderColor} border-l-4 p-10 rounded-lg shadow-xl   flex flex-col gap-4 `}>
                    <div className='flex gap-5 items-center'>
                        <div>{card.icon}</div>
                        <div className="flex flex-col gap-2">
                            <p className="text-2xl font-bold">{card.incident}</p>
                            <p className="text-4xl font-bold">{card.days}</p>
                            <Text color={card.incrementColor} size="md" >{card.label}</Text>
                        </div>

                    </div>






                </div>
            ))}
        </div>
    )
}

export default Rate