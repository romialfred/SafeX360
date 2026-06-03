import { IconDeviceDesktop, IconShield } from "@tabler/icons-react";
import { useState } from "react";

const SystemTabs = () => {
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
    return (
        <div>
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
                            <select
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
                            <select
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
                            <select
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
                            <select
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
                            <input
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
                            <input
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
        </div>
    )
}

export default SystemTabs