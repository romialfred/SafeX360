import React from 'react';
import { IconX, IconMail, IconAlertCircle } from '@tabler/icons-react';

interface ModuleSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleName: string;
}

const ModuleSubscriptionModal: React.FC<ModuleSubscriptionModalProps> = ({
    isOpen,
    onClose,
    moduleName
}) => {
    if (!isOpen) return null;

    const handleContactAdmin = () => {
        const subject = encodeURIComponent('New Module Activation Request');
        const body = encodeURIComponent(
            `Hello,\n\nI would like to request activation for the following module:\n\nModule: ${moduleName}\n\nPlease provide information about pricing and activation process.\n\nThank you,`
        );
        const mailtoLink = `mailto:subscription@mine-xpert.com?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3">
                            <IconAlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Module Not Available</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <IconX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-700 mb-4">
                            The module <span className="font-semibold text-gray-900">"{moduleName}"</span> is not included in your current subscription.
                        </p>
                        <p className="text-gray-600 text-sm">
                            To access this module, please contact your administrator to upgrade your subscription or request module activation.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleContactAdmin}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
                        >
                            <IconMail className="w-4 h-4 mr-2" />
                            Contact Administrator
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
                    <div className="flex items-center text-sm text-gray-500">
                        <IconMail className="w-4 h-4 mr-2" />
                        <span>subscription@mine-xpert.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleSubscriptionModal;