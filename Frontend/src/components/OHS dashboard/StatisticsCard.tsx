

const StatisticsCard = ({ incidentSummaryCards }: any) => {
    return (
        <div className={`p-3 rounded-lg shadow-xl flex flex-col gap-2  ${incidentSummaryCards.borderColor}  border transition-all duration-300 transform hover:shadow-lg hover:scale-[1.01] hover:{safetyIndicators.borderColor}`}>
            <div className="flex gap-4 items-center justify-between">
                <div className="rounded-full p-2 bg-white shadow">{incidentSummaryCards.icon}</div>
                <p className={`text-lg ${incidentSummaryCards.text} font-semibold`}>{incidentSummaryCards.type}</p>

            </div>
            <div className="flex flex-col gap-0.5">
                <p className={` ${incidentSummaryCards.text} font-medium`}>{incidentSummaryCards.incident}</p>
            </div>
            <div className="flex items-baseline gap-2">
                <p className={`${incidentSummaryCards.text} text-xl font-bold`}>{incidentSummaryCards.value}</p>
                <p className={`text-xs ${incidentSummaryCards.text}`}>{incidentSummaryCards.unit}</p>
            </div>
        </div>
    )
}

export default StatisticsCard