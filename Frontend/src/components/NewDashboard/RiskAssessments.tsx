import { Table, Text, Badge } from '@mantine/core';

const riskAssessments = [
    {
        area: 'Production Line A',
        riskLevel: 'High Risk',
        nextDue: '2024-03-15',
        status: 'URGENT',
        riskColor: 'bg-red-500 text-white',
        statusColor: 'bg-red-500 text-white',
    },
    {
        area: 'Warehouse Zone B',
        riskLevel: 'Medium Risk',
        nextDue: '2024-03-20',
        status: 'UPCOMING',
        riskColor: 'bg-orange-500 text-white',
        statusColor: 'bg-yellow-500 text-white',
    },
    {
        area: 'Office Area',
        riskLevel: 'Low Risk',
        nextDue: '2024-03-25',
        status: 'COMPLETED',
        riskColor: 'bg-green-500 text-white',
        statusColor: 'bg-blue-500 text-white',
    },
];

const RiskAssessments = () => {
    return (
        <div className="p-6 flex flex-col gap-5 bg-white rounded-xl shadow-lg border border-gray-200 ">
            {/* Header */}
            <Text size="xl" className="mb-4 text-gray-700">
                Risk Assessments
            </Text>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="p-3 text-gray-600 text-left ">Area</th>
                            <th className="p-3 text-gray-600 text-left" >Risk Level</th>
                            <th className="p-3 text-gray-600 text-left ">Next Due</th>
                            <th className="p-3 text-gray-600 text-left ">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {riskAssessments.map((risk, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-all border-b border-gray-300">
                                <td className="p-3 text-gray-600">{risk.area}</td>
                                <td className="p-3">

                                    <Badge className={`p-3 rounded-lg text-center ${risk.riskColor}`} >
                                        {risk.riskLevel}
                                    </Badge>
                                </td>
                                <td className="p-3 text-gray-600">{risk.nextDue}</td>
                                <td className="p-3">
                                    <Badge className={`p-2 px-4 rounded-lg ${risk.statusColor}`} >
                                        {risk.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default RiskAssessments;
