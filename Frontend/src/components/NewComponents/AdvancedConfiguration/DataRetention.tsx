import { IconArchive, IconDatabase, IconDownload, IconTrash } from "@tabler/icons-react";
import { useState } from "react";


interface DataRetentionPolicy {
    id: string;
    dataType: string;
    description: string;
    retentionPeriod: number;
    unit: 'days' | 'months' | 'years';
    autoArchive: boolean;
    autoDelete: boolean;
}

const mockDataRetentionPolicies: DataRetentionPolicy[] = [
    {
        id: 'incident-reports',
        dataType: 'Incident Reports',
        description: 'Incident reports and investigation data',
        retentionPeriod: 7,
        unit: 'years',
        autoArchive: true,
        autoDelete: false
    },
    {
        id: 'audit-records',
        dataType: 'Audit Records',
        description: 'Audit reports and recommendations',
        retentionPeriod: 5,
        unit: 'years',
        autoArchive: true,
        autoDelete: false
    },
    {
        id: 'training-records',
        dataType: 'Training Records',
        description: 'Training history and certifications',
        retentionPeriod: 10,
        unit: 'years',
        autoArchive: true,
        autoDelete: false
    },
    {
        id: 'ppe-requests',
        dataType: 'PPE Requests',
        description: 'History of protective equipment requests',
        retentionPeriod: 3,
        unit: 'years',
        autoArchive: true,
        autoDelete: true
    },
    {
        id: 'user-activities',
        dataType: 'User Activities',
        description: 'User activity logs and sessions',
        retentionPeriod: 2,
        unit: 'years',
        autoArchive: true,
        autoDelete: true
    },
    {
        id: 'system-logs',
        dataType: 'System Logs',
        description: 'System logs and errors',
        retentionPeriod: 1,
        unit: 'years',
        autoArchive: true,
        autoDelete: true
    }
];

const DataRetention = () => {
    const [dataRetentionPolicies, setDataRetentionPolicies] = useState<DataRetentionPolicy[]>(mockDataRetentionPolicies);

    const handleRetentionChange = (id: string, field: string, value: any) => {
        setDataRetentionPolicies(prev =>
            prev.map(policy =>
                policy.id === id ? { ...policy, [field]: value } : policy
            )
        );
    };
    return (
        <div>
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                        <IconDatabase className="w-6 h-6 text-purple-600 mr-3" />
                        <h3 className="text-lg text-gray-900">Data Retention Policies</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                                        Data Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                                        Retention Period
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                                        Auto Archive
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                                        Auto Delete
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dataRetentionPolicies.map(policy => (
                                    <tr key={policy.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm text-gray-900">{policy.dataType}</div>
                                                <div className="text-sm text-gray-500">{policy.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={policy.retentionPeriod}
                                                    onChange={(e) => handleRetentionChange(policy.id, 'retentionPeriod', parseInt(e.target.value))}
                                                    min="1"
                                                    max="50"
                                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <select
                                                    value={policy.unit}
                                                    onChange={(e) => handleRetentionChange(policy.id, 'unit', e.target.value)}
                                                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="days">days</option>
                                                    <option value="months">months</option>
                                                    <option value="years">years</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleRetentionChange(policy.id, 'autoArchive', !policy.autoArchive)}
                                                className={`w-8 h-4 rounded-full transition-colors ${policy.autoArchive ? 'bg-blue-500' : 'bg-gray-300'
                                                    } relative`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${policy.autoArchive ? 'translate-x-4' : 'translate-x-0.5'
                                                    }`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleRetentionChange(policy.id, 'autoDelete', !policy.autoDelete)}
                                                className={`w-8 h-4 rounded-full transition-colors ${policy.autoDelete ? 'bg-red-500' : 'bg-gray-300'
                                                    } relative`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${policy.autoDelete ? 'translate-x-4' : 'translate-x-0.5'
                                                    }`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                    <IconArchive className="w-4 h-4" />
                                                </button>
                                                <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <IconDownload className="w-4 h-4" />
                                                </button>
                                                <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DataRetention