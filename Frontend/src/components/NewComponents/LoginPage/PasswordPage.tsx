import { useState } from 'react';
import {
    IconLock,
    IconMail,
    IconShield,
    IconAlertTriangle,
    IconCircleCheck,
    IconUsers,
    IconFileText,
    IconWorld,
    IconUser,
} from '@tabler/icons-react';
import { Button, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { generatePassword } from '../../../utility/OtherUtilities';
import { resetPassword } from '../../../services/AccountService';
import { successNotification } from '../../../utility/NotificationUtility';



const PasswordPage = () => {

    const [language, setLanguage] = useState<'fr' | 'en'>('en');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const translations = {
        fr: {
            title: 'Système de Management de la Santé & Sécurité',
            forgotTitle: 'Réinitialiser le mot de passe',
            forgotSubtitle: 'Entrez votre email pour recevoir un lien de réinitialisation',
            emailLabel: 'Email',
            emailPlaceholder: 'votre.email@company.com',
            resetButton: 'Réinitialiser',
            resetProgress: 'Envoi en cours...',
            healthSafety: 'Health and Safety',
            epiProtection: 'EPI Protection',
            audit: 'Audit',
            riskManagement: 'Risk Management',
            documentManagement: 'Document Management',
            stakeholderManagement: 'Stakeholder Management',
        },
        en: {
            title: 'Health & Safety Management System',
            forgotTitle: 'Reset Password',
            forgotSubtitle: 'Enter your email to receive a reset link',
            emailLabel: 'Email',
            emailPlaceholder: 'your.email@company.com',
            resetButton: 'Reset Password',
            resetProgress: 'Sending...',
            healthSafety: 'Health and Safety',
            epiProtection: 'PPE Protection',
            audit: 'Audit',
            riskManagement: 'Risk Management',
            documentManagement: 'Document Management',
            stakeholderManagement: 'Stakeholder Management',
        },
    };
    const form = useForm({
        initialValues: {
            email: "",
            login: "",
            password: generatePassword()
        },
        validate: {
            email: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Email is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            login: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Login is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
        },
    });

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'en' : 'fr');
    };

    const handleSubmit = (values: typeof form.values) => {
        console.log(values)
        setLoading(true);
        resetPassword(values).then((_res) => {
            successNotification("Temporary password sent to your email")
            navigate("/login")
        }).catch((err) => {
            setError(err?.response?.data?.errorMessage || "An error occurred");

        }).finally(() => setLoading(false));
    };
    return (
        <div className="h-screen relative overflow-hidden bg-gradient-to-br from-blue-100 via-green-50 to-blue-50 flex flex-col">
            {/* Background */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                    style={{
                        backgroundImage: `url('https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`,
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/25"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col">
                {/* Language Toggle */}
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-lg hover:bg-white/95 transition-all duration-200 shadow-lg group"
                    >
                        <IconWorld className="w-4 h-4 mr-2 text-blue-600 group-hover:text-blue-700" />
                        <span className="text-sm text-gray-900">{language === 'fr' ? 'FR' : 'EN'}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-gray-600">{language === 'fr' ? 'English' : 'Français'}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="w-full max-w-7xl">
                        <div className="flex justify-center mb-4">
                            <div className="w-full max-w-sm">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl text-blue-900 mb-4 drop-shadow-xl">{t.title}</h1>
                                </div>

                                <div className="w-full max-w-sm relative">
                                    <div className="bg-blue-50/90 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-blue-200/70 p-4 ring-4 ring-blue-500/20 relative z-10">
                                        {/* Header */}
                                        <div className="text-center mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg mx-auto flex items-center justify-center mb-2 shadow-xl border-2 border-white">
                                                <IconLock className="w-5 h-5 text-white drop-shadow-lg" />
                                            </div>
                                            <h3 className="text-base text-gray-900 mb-1 drop-shadow-lg">{t.forgotTitle}</h3>
                                            <p className="text-xs text-gray-800">{t.forgotSubtitle}</p>
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div className="mb-3 p-2 bg-red-50/95 border-2 border-red-400 rounded-lg flex items-center backdrop-blur-sm shadow-lg">
                                                <IconAlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                                                <span className="text-red-800 text-xs">{error}</span>
                                            </div>
                                        )}

                                        {/* Form */}
                                        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-6">
                                            <div className='flex flex-col gap-4'>
                                                <TextInput
                                                    withAsterisk
                                                    {...form.getInputProps("email")}
                                                    label={t.emailLabel}
                                                    placeholder={t.emailPlaceholder}
                                                    leftSection={<IconMail size={16}
                                                    />}
                                                />
                                                <TextInput {...form.getInputProps("login")} size="md" leftSection={<IconUser size={16} />} label="Login" withAsterisk placeholder="Enter login" rightSectionWidth="xl" />
                                            </div>

                                            <Button
                                                type="submit"
                                                fullWidth
                                                loading={loading}
                                                className="!bg-gradient-to-r from-blue-500 via-green-500 to-blue-600 hover:from-blue-600 hover:via-green-600 hover:to-blue-700 shadow-xl text-sm"
                                                leftSection={<IconShield size={16} />}
                                            >
                                                {loading ? t.resetProgress : t.resetButton}
                                            </Button>
                                            <div className="text-center ">Remember your password? <span className=" bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:underline cursor-pointer" onClick={() => navigate("/login")}>Login</span> </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Icons Row (same as login) */}
                        <div className="flex items-center justify-center space-x-6 mb-4" style={{ marginTop: '50px' }}>
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <div className="text-white text-sm drop-shadow-lg">SafeX</div>
                                        <div className="text-cyan-100 text-sm drop-shadow-lg">360</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-blue-900 drop-shadow-lg">{t.healthSafety}</div>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <IconShield className="w-7 h-7 text-white drop-shadow-lg" />
                                </div>
                                <div className="mt-2 text-sm text-green-900 drop-shadow-lg">{t.epiProtection}</div>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-indigo-700 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconCircleCheck className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white text-xs drop-shadow-lg">AUDIT</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-blue-900 drop-shadow-lg">{t.audit}</div>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconAlertTriangle className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white text-xs drop-shadow-lg">RISK</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-red-900 drop-shadow-lg">{t.riskManagement}</div>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconFileText className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white text-xs drop-shadow-lg">DOCS</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-purple-900 drop-shadow-lg">{t.documentManagement}</div>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconUsers className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white text-xs drop-shadow-lg">STAKE</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-indigo-900 drop-shadow-lg">{t.stakeholderManagement}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="w-full p-2 text-center flex-shrink-0">
                    <div className="text-sm text-blue-900 drop-shadow-lg">
                        Copyright Mine Xpert © 2025 All Rights Reserved
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PasswordPage