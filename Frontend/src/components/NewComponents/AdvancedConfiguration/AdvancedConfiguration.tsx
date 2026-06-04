import React, { useState } from 'react';
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconSettings,
    IconBell,
    IconDatabase,
    IconWorld,
    IconAlertTriangle,
    IconFileText,
    IconShield,
    IconCircleCheck,
    IconHelmet,
    IconSearch,
    IconClipboardCheck,
    IconUsers,
    IconMail,
    IconDeviceMobile,
    IconDeviceDesktop,
    IconTrash,
    IconArchive,
    IconDownload
} from '@tabler/icons-react';

interface AdvancedConfigurationProps {
    onBackToSettings: () => void;
}

interface GlobalParameter {
    id: string;
    name: string;
    description: string;
    value: number;
    unit: string;
    category: string;
    minValue: number;
    maxValue: number;
}

interface NotificationSetting {
    id: string;
    name: string;
    description: string;
    email: boolean;
    sms: boolean;
    inApp: boolean;
    category: string;
}

interface DataRetentionPolicy {
    id: string;
    dataType: string;
    description: string;
    retentionPeriod: number;
    unit: 'days' | 'months' | 'years';
    autoArchive: boolean;
    autoDelete: boolean;
}

const mockGlobalParameters: GlobalParameter[] = [
    {
        id: 'incident-processing-duration',
        name: 'Incident Processing Duration',
        description: 'Maximum time allocated to process an incident',
        value: 7,
        unit: 'days',
        category: 'Incident Management',
        minValue: 1,
        maxValue: 30
    },
    {
        id: 'ppe-request-duration',
        name: 'PPE Request Duration',
        description: 'Processing time for personal protective equipment requests',
        value: 3,
        unit: 'days',
        category: 'PPE Management',
        minValue: 1,
        maxValue: 14
    },
    {
        id: 'hazard-processing-duration',
        name: 'Hazard Processing Duration',
        description: 'Time allocated to process a hazard identification',
        value: 5,
        unit: 'days',
        category: 'Risk Management',
        minValue: 1,
        maxValue: 21
    },
    {
        id: 'document-validation-duration',
        name: 'Document Validation Duration',
        description: 'Maximum time to validate a document',
        value: 10,
        unit: 'days',
        category: 'Document Management',
        minValue: 1,
        maxValue: 30
    },
    {
        id: 'audit-execution-duration',
        name: 'Audit Execution Duration',
        description: 'Time allocated to execute a complete audit',
        value: 14,
        unit: 'days',
        category: 'Audit Management',
        minValue: 1,
        maxValue: 60
    },
    {
        id: 'training-completion-duration',
        name: 'Training Completion Duration',
        description: 'Time limit to complete mandatory training',
        value: 30,
        unit: 'days',
        category: 'Training Management',
        minValue: 7,
        maxValue: 90
    },
    {
        id: 'investigation-duration',
        name: 'Investigation Duration',
        description: 'Maximum time to conduct an incident investigation',
        value: 21,
        unit: 'days',
        category: 'Investigation',
        minValue: 7,
        maxValue: 60
    },
    {
        id: 'corrective-action-duration',
        name: 'Corrective Action Duration',
        description: 'Time limit to implement a corrective action',
        value: 45,
        unit: 'days',
        category: 'Action Management',
        minValue: 7,
        maxValue: 180
    }
];

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

const AdvancedConfiguration: React.FC<AdvancedConfigurationProps> = ({ onBackToSettings }) => {
    const [activeTab, setActiveTab] = useState<'system' | 'notifications' | 'retention' | 'global'>('system');
    const [globalParameters, setGlobalParameters] = useState<GlobalParameter[]>(mockGlobalParameters);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(mockNotificationSettings);
    const [dataRetentionPolicies, setDataRetentionPolicies] = useState<DataRetentionPolicy[]>(mockDataRetentionPolicies);

    // System Preferences State
    const [systemPrefs, setSystemPrefs] = useState({
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        theme: 'light',
        autoSave: true,
        sessionTimeout: 30,
        maxFileSize: 10,
        enableAuditLog: true,
        enableBackup: true,
        backupFrequency: 'daily'
    });

    const handleGlobalParameterChange = (id: string, value: number) => {
        setGlobalParameters(prev =>
            prev.map(param =>
                param.id === id ? { ...param, value } : param
            )
        );
    };

    const handleNotificationToggle = (id: string, type: 'email' | 'sms' | 'inApp') => {
        setNotificationSettings(prev =>
            prev.map(setting =>
                setting.id === id ? { ...setting, [type]: !setting[type] } : setting
            )
        );
    };

    const handleRetentionChange = (id: string, field: string, value: any) => {
        setDataRetentionPolicies(prev =>
            prev.map(policy =>
                policy.id === id ? { ...policy, [field]: value } : policy
            )
        );
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            // Category icons
            case 'Incident Management': return <IconAlertTriangle className="w-4 h-4" />;
            case 'PPE Management': return <IconHelmet className="w-4 h-4" />;
            case 'Risk Management': return <IconShield className="w-4 h-4" />;
            case 'Document Management': return <IconFileText className="w-4 h-4" />;
            case 'Audit Management': return <IconClipboardCheck className="w-4 h-4" />;
            case 'Training Management': return <IconUsers className="w-4 h-4" />;
            case 'Investigation': return <IconSearch className="w-4 h-4" />;
            case 'Action Management': return <IconCircleCheck className="w-4 h-4" />;
            default: return <IconSettings className="w-4 h-4" />;
        }
    };

    const renderSystemPreferences = () => (
        <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                    <IconDeviceDesktop className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg text-gray-900">General Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-gray-700 mb-2">
                            System Language
                        </label>
                        {/* LOT 40 P1: aria-label for select */}
                        <select
                            aria-label="System Language"
                            value={systemPrefs.language}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-2">
                            Time Zone
                        </label>
                        {/* LOT 40 P1: aria-label for select */}
                        <select
                            aria-label="Time Zone"
                            value={systemPrefs.timezone}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, timezone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                            <option value="Europe/London">Europe/London (GMT+0)</option>
                            <option value="America/New_York">America/New_York (GMT-5)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-2">
                            Date Format
                        </label>
                        {/* LOT 40 P1: aria-label for select */}
                        <select
                            aria-label="Date Format"
                            value={systemPrefs.dateFormat}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, dateFormat: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-2">
                            Time Format
                        </label>
                        {/* LOT 40 P1: aria-label for select */}
                        <select
                            aria-label="Time Format"
                            value={systemPrefs.timeFormat}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, timeFormat: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="24h">24 hours</option>
                            <option value="12h">12 hours (AM/PM)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Security & Session Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                    <IconShield className="w-6 h-6 text-green-600 mr-3" />
                    <h3 className="text-lg text-gray-900">Security & Sessions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-gray-700 mb-2">
                            Session Timeout (minutes)
                        </label>
                        {/* LOT 40 P1: aria-label for raw number input */}
                        <input
                            aria-label="Session Timeout (minutes)"
                            type="number"
                            value={systemPrefs.sessionTimeout}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                            min="5"
                            max="480"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-2">
                            Max File Size (MB)
                        </label>
                        {/* LOT 40 P1: aria-label for raw number input */}
                        <input
                            aria-label="Max File Size (MB)"
                            type="number"
                            value={systemPrefs.maxFileSize}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="autoSave"
                            checked={systemPrefs.autoSave}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, autoSave: e.target.checked }))}
                            className="mr-3"
                        />
                        <label htmlFor="autoSave" className="text-sm text-gray-700">
                            Auto-save forms
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="enableAuditLog"
                            checked={systemPrefs.enableAuditLog}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, enableAuditLog: e.target.checked }))}
                            className="mr-3"
                        />
                        <label htmlFor="enableAuditLog" className="text-sm text-gray-700">
                            Enable audit logs
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="enableBackup"
                            checked={systemPrefs.enableBackup}
                            onChange={(e) => setSystemPrefs(prev => ({ ...prev, enableBackup: e.target.checked }))}
                            className="mr-3"
                        />
                        <label htmlFor="enableBackup" className="text-sm text-gray-700">
                            Enable automatic backups
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNotificationSettings = () => {
        const categories = Array.from(new Set(notificationSettings.map(setting => setting.category)));

        return (
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
        );
    };

    const renderDataRetention = () => (
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
                                        {/* LOT 40 P1: aria-labels for retention inputs */}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                aria-label={`Retention period for ${policy.dataType}`}
                                                type="number"
                                                value={policy.retentionPeriod}
                                                onChange={(e) => handleRetentionChange(policy.id, 'retentionPeriod', parseInt(e.target.value))}
                                                min="1"
                                                max="50"
                                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <select
                                                aria-label={`Retention unit for ${policy.dataType}`}
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
                                        {/* LOT 40 P1: aria-label for toggle button */}
                                        <button
                                            aria-label={`Toggle auto-archive for ${policy.dataType}`}
                                            onClick={() => handleRetentionChange(policy.id, 'autoArchive', !policy.autoArchive)}
                                            className={`w-8 h-4 rounded-full transition-colors ${policy.autoArchive ? 'bg-blue-500' : 'bg-gray-300'
                                                } relative`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${policy.autoArchive ? 'translate-x-4' : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {/* LOT 40 P1: aria-label for toggle button */}
                                        <button
                                            aria-label={`Toggle auto-delete for ${policy.dataType}`}
                                            onClick={() => handleRetentionChange(policy.id, 'autoDelete', !policy.autoDelete)}
                                            className={`w-8 h-4 rounded-full transition-colors ${policy.autoDelete ? 'bg-red-500' : 'bg-gray-300'
                                                } relative`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${policy.autoDelete ? 'translate-x-4' : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {/* LOT 40 P1: aria-labels for icon-only action buttons */}
                                        <div className="flex items-center justify-center space-x-2">
                                            <button aria-label={`Archive ${policy.dataType}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                <IconArchive className="w-4 h-4" />
                                            </button>
                                            <button aria-label={`Download ${policy.dataType}`} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                <IconDownload className="w-4 h-4" />
                                            </button>
                                            <button aria-label={`Delete ${policy.dataType}`} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
    );

    const renderGlobalParameters = () => {
        const categories = Array.from(new Set(globalParameters.map(param => param.category)));

        return (
            <div className="space-y-6">
                {categories.map(category => (
                    <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                {getCategoryIcon(category)}
                            </div>
                            <h3 className="text-lg text-gray-900">{category}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {globalParameters
                                .filter(param => param.category === category)
                                .map(param => (
                                    <div key={param.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="text-sm text-gray-900 mb-1">{param.name}</h4>
                                                <p className="text-xs text-gray-600">{param.description}</p>
                                            </div>
                                            <div className="ml-4 text-right">
                                                <div className="text-lg text-blue-600">{param.value}</div>
                                                <div className="text-xs text-gray-500">{param.unit}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs text-gray-500 w-8">{param.minValue}</span>
                                                {/* LOT 40 P1: aria-label for range slider */}
                                                <input
                                                    aria-label={`${param.name} slider`}
                                                    type="range"
                                                    min={param.minValue}
                                                    max={param.maxValue}
                                                    value={param.value}
                                                    onChange={(e) => handleGlobalParameterChange(param.id, parseInt(e.target.value))}
                                                    className="flex-1"
                                                />
                                                <span className="text-xs text-gray-500 w-8">{param.maxValue}</span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {/* LOT 40 P1: aria-label for number input */}
                                                <input
                                                    aria-label={`${param.name} value`}
                                                    type="number"
                                                    value={param.value}
                                                    onChange={(e) => handleGlobalParameterChange(param.id, parseInt(e.target.value))}
                                                    min={param.minValue}
                                                    max={param.maxValue}
                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <span className="text-sm text-gray-600">{param.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={onBackToSettings}
                                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
                            >
                                <IconArrowLeft className="w-5 h-5 mr-2" />
                                Back to Settings
                            </button>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Advanced Configuration</h1>
                                <p className="text-gray-600">System settings and advanced configurations</p>
                            </div>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <IconDeviceFloppy className="w-4 h-4 mr-2" />
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-8">
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`px-6 py-3 rounded-md transition-colors flex items-center ${activeTab === 'system'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconSettings className="w-4 h-4 mr-2" />
                        System Preferences
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-6 py-3 rounded-md transition-colors flex items-center ${activeTab === 'notifications'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconBell className="w-4 h-4 mr-2" />
                        Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('retention')}
                        className={`px-6 py-3 rounded-md transition-colors flex items-center ${activeTab === 'retention'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconDatabase className="w-4 h-4 mr-2" />
                        Data Retention
                    </button>
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`px-6 py-3 rounded-md transition-colors flex items-center ${activeTab === 'global'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconWorld className="w-4 h-4 mr-2" />
                        Global Parameters
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'system' && renderSystemPreferences()}
                {activeTab === 'notifications' && renderNotificationSettings()}
                {activeTab === 'retention' && renderDataRetention()}
                {activeTab === 'global' && renderGlobalParameters()}
            </div>
        </div>
    );
};

export default AdvancedConfiguration;