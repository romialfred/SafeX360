const IndicatorCard = ({ safetyIndicators }: any) => {
    return (
        <div className={`p-3 rounded-lg shadow-xl flex flex-col gap-4 ${safetyIndicators.borderColor} border transition-all duration-300 transform hover:shadow-lg hover:scale-[1.01] hover:{safetyIndicators.borderColor}`}>
            <div className="flex gap-4 items-center">
                <div className="rounded-full p-2 bg-white shadow">{safetyIndicators.icon}</div>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-gray-500 font-semibold">{safetyIndicators.type}</p>

                </div>
            </div>

            <div className="flex flex-col items-baseline gap-2">
                <p className=" text-gray-700 text-sm font-semibold ">{safetyIndicators.incident}</p>
                <div className="flex items-center gap-2">
                    <p className={`${safetyIndicators.text} text-2xl font-bold`}>{safetyIndicators.value}</p>
                    <p className=" text-gray-500 text-sm">{safetyIndicators.unit}</p>
                </div>

            </div>

            <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>{safetyIndicators.change}</span>
                <span>{safetyIndicators.target}</span>
            </div>

            {/* <p className="text-xs text-gray-500">{safetyIndicators.description}</p> */}
        </div>
    )
}

export default IndicatorCard