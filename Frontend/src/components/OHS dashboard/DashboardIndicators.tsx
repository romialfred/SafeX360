import {
    IconActivity,
    IconAlertTriangle,
    IconClipboardCheck,
    IconReportAnalytics,
    IconUserCheck,
} from '@tabler/icons-react';
import IndicatorCard from './IndicatorCard';

const safetyIndicators = [
    {
        icon: <IconAlertTriangle size={25} className="text-red-600" />,
        type: "Lagging Indicator",
        incident: "Lost Time Injury Frequency Rate",
        value: "1.2",
        unit: "per 200,000 hours",
        change: "-0.8",
        target: "Target: 2",
        description: "Number of lost time injuries per 200,000 hours worked",
        text: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
    },
    {
        icon: <IconClipboardCheck size={25} className="text-orange-600" />,
        type: "Lagging Indicator",
        incident: "Total Recordable Incident Rate",
        value: "2.8",
        unit: "per 200,000 hours",
        change: "-0.3",
        target: "Target: 3.5",
        description: "Total recordable incidents per 200,000 hours worked",
        text: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-300",
    },
    {
        icon: <IconReportAnalytics size={25} className="text-blue-600" />,
        type: "Leading Indicator",
        incident: "Near Miss Reporting Rate",
        value: "45",
        unit: "per month",
        change: "+12",
        target: "Target: 40",
        description: "Number of near miss reports submitted monthly",
        text: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
    },
    {
        icon: <IconUserCheck size={25} className="text-green-600" />,
        type: "Leading Indicator",
        incident: "Safety Training Completion",
        value: "96",
        unit: "%",
        change: "+4",
        target: "Target: 95",
        description: "Percentage of mandatory safety training completed",
        text: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
    },
    {
        icon: <IconActivity size={25} className="text-teal-600" />,
        type: "Lagging Indicator",
        incident: "Days Without Incident",
        value: "47",
        unit: "days",
        change: "+47",
        target: "Target: 30",
        description: "Consecutive days without recordable incidents",
        text: "text-teal-600",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-300",
    },
];


const DashboardIndicators = () => {
    return (
        <div className="grid grid-cols-5 gap-5 ">
            {safetyIndicators.map((safetyIndicators, index) => (
                <IndicatorCard key={index} safetyIndicators={safetyIndicators} />
            ))}
        </div>
    )
}

export default DashboardIndicators