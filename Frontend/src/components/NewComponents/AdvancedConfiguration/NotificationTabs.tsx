import { IconBell, IconDeviceMobile, IconMail } from "@tabler/icons-react";
import { useState } from "react";



interface NotificationSetting {
    id: string;
    name: string;
    description: string;
    email: boolean;
    sms: boolean;
    inApp: boolean;
    category: string;
}

const mockNotificationSettings: NotificationSetting[] = [
    {
        id: 'incident-created',
        name: 'New Incident Created',
        description: 'Notification when a new incident is created',
        email: true,
        sms: false,
        inApp: true,
        category: 'Incidents'
    },
    {
        id: 'incident-overdue',
        name: 'Incident Overdue',
        description: 'Alert when an incident exceeds its deadline',
        email: true,
        sms: true,
        inApp: true,
        category: 'Incidents'
    },
    {
        id: 'ppe-request-approved',
        name: 'PPE Request Approved',
        description: 'Confirmation of PPE request approval',
        email: true,
        sms: false,
        inApp: true,
        category: 'PPE'
    },
    {
        id: 'audit-scheduled',
        name: 'Audit Scheduled',
        description: 'Notification of audit scheduling',
        email: true,
        sms: false,
        inApp: true,
        category: 'Audits'
    },
    {
        id: 'document-expiring',
        name: 'Document Expiring',
        description: 'Alert before document expiration',
        email: true,
        sms: false,
        inApp: true,
        category: 'Documents'
    },
    {
        id: 'training-due',
        name: 'Training Due',
        description: 'Reminder for mandatory training to complete',
        email: true,
        sms: true,
        inApp: true,
        category: 'Training'
    }
];

const NotificationTabs = () => {
    const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(mockNotificationSettings);
    const categories = Array.from(new Set(notificationSettings.map(setting => setting.category)));

    const handleNotificationToggle = (id: string, type: 'email' | 'sms' | 'inApp') => {
        setNotificationSettings(prev =>
            prev.map(setting =>
                setting.id === id ? { ...setting, [type]: !setting[type] } : setting
            )
        );
    };

    return (
        <div>
            <div className="space-y-6">
                {categories.map(category => (
                    <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center mb-6">
                            <IconBell className="w-6 h-6 text-orange-600 mr-3" />
                            <h3 className="text-lg text-gray-900">Notifications - {category}</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                                            Notification
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                                            <IconMail className="w-4 h-4 mx-auto" />
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                                            <IconDeviceMobile className="w-4 h-4 mx-auto" />
                                            SMS
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">
                                            <IconBell className="w-4 h-4 mx-auto" />
                                            In-App
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {notificationSettings
                                        .filter(setting => setting.category === category)
                                        .map(setting => (
                                            <tr key={setting.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm text-gray-900">{setting.name}</div>
                                                        <div className="text-sm text-gray-500">{setting.description}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleNotificationToggle(setting.id, 'email')}
                                                        className={`w-8 h-4 rounded-full transition-colors ${setting.email ? 'bg-blue-500' : 'bg-gray-300'
                                                            } relative`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${setting.email ? 'translate-x-4' : 'translate-x-0.5'
                                                            }`} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleNotificationToggle(setting.id, 'sms')}
                                                        className={`w-8 h-4 rounded-full transition-colors ${setting.sms ? 'bg-green-500' : 'bg-gray-300'
                                                            } relative`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${setting.sms ? 'translate-x-4' : 'translate-x-0.5'
                                                            }`} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleNotificationToggle(setting.id, 'inApp')}
                                                        className={`w-8 h-4 rounded-full transition-colors ${setting.inApp ? 'bg-purple-500' : 'bg-gray-300'
                                                            } relative`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${setting.inApp ? 'translate-x-4' : 'translate-x-0.5'
                                                            }`} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default NotificationTabs