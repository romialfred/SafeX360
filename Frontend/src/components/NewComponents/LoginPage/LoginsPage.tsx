import { useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconMail,
    IconShield,
    IconAlertTriangle,
    IconCircleCheck,
    IconUsers,
    IconFileText,
    IconWorld,
} from '@tabler/icons-react';
import { Button, Checkbox, PasswordInput, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { getUser, loginUser } from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';


const LoginsPage = () => {

    const navigate = useNavigate();
    const [language, setLanguage] = useState<'fr' | 'en'>('en');
    const [loading, setLoading] = useState(false)
    const dispatch = useAppDispatch();
    const [error, setError] = useState(false);
    const translations = {
        fr: {
            title: 'Système de Management de la Santé & Sécurité',
            loginTitle: 'Connexion Sécurisée',
            loginSubtitle: 'Accédez à votre espace HSE',
            emailLabel: 'Login',
            emailPlaceholder: 'votre.email@company.com',
            passwordLabel: 'Mot de Passe',
            passwordPlaceholder: '••••••••',
            rememberMe: 'Se souvenir de moi',
            forgotPassword: 'Mot de passe oublié ?',
            loginButton: 'Se Connecter',
            loginProgress: 'Connexion en cours...',
            healthSafety: 'Health and Safety',
            epiProtection: 'EPI Protection',
            audit: 'Audit',
            riskManagement: 'Risk Management',
            documentManagement: 'Document Management',
            stakeholderManagement: 'Stakeholder Management',
        },
        en: {
            title: 'Health & Safety Management System',
            loginTitle: 'Secure Login',
            loginSubtitle: 'Access your HSE workspace',
            emailLabel: 'Login',
            emailPlaceholder: 'your.email@company.com',
            passwordLabel: 'Password',
            passwordPlaceholder: '••••••••',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            loginButton: 'Sign In',
            loginProgress: 'Signing in...',
            healthSafety: 'Health and Safety',
            epiProtection: 'PPE Protection',
            audit: 'Audit',
            riskManagement: 'Risk Management',
            documentManagement: 'Document Management',
            stakeholderManagement: 'Stakeholder Management',
        }
    };

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'en' : 'fr');
    };

    const form = useForm({
        initialValues: {
            login: '',
            password: '',

        },
        validate: {
            login: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Login is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            password: (value) => (!value ? "Password is required" : null),

        },
    });

    const handleSubmit = async (values: any) => {
        setError(false)
        form.validate();
        if (!form.isValid()) return;
        setLoading(true)
        try {
            await loginUser({ ...values });
            const res: any = await getUser();
            dispatch(setUser(res));
            navigate("/");
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-screen relative overflow-hidden bg-gradient-to-br from-blue-100 via-green-50 to-blue-50 flex flex-col">
            {/* Professional Background - Plus Visible */}
            <div className="absolute inset-0">
                {/* Single PPE Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                    style={{
                        backgroundImage: `url('https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`
                    }}
                ></div>

                {/* Overlay léger pour lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/15 to-white/25"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">

                {/* Language Toggle Button */}
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-lg hover:bg-white/95 transition-all duration-200 shadow-lg group"
                    >
                        <IconWorld className="w-4 h-4 mr-2 text-blue-600 group-hover:text-blue-700" />
                        <span className="text-sm font-bold text-gray-900">
                            {language === 'fr' ? 'FR' : 'EN'}
                        </span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-gray-600">
                            {language === 'fr' ? 'English' : 'Français'}
                        </span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="w-full max-w-7xl">

                        {/* Login Form - Centered */}
                        <div className="flex justify-center mb-4">
                            {/* Titre Principal - Juste au-dessus de la fenêtre de connexion */}
                            <div className="w-full max-w-sm">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-blue-900 mb-4 drop-shadow-xl">
                                        {t.title}
                                    </h1>
                                </div>

                                <div className="w-full max-w-sm relative">

                                    <div className="bg-blue-50/90 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-blue-200/70 p-4 ring-4 ring-blue-500/20 relative z-10">

                                        {/* Form Header */}
                                        <div className="text-center mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg mx-auto flex items-center justify-center mb-2 shadow-xl border-2 border-white">
                                                <IconLock className="w-5 h-5 text-white drop-shadow-lg" />
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1 drop-shadow-lg">{t.loginTitle}</h3>
                                            <p className="text-xs text-gray-800 font-semibold">{t.loginSubtitle}</p>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="mb-3 p-2 bg-red-50/95 border-2 border-red-400 rounded-lg flex items-center backdrop-blur-sm shadow-lg">
                                                <IconAlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                                                <span className="text-red-800 text-xs font-bold">Incorrect Login ID or Password</span>
                                            </div>
                                        )}

                                        {/* Login Form */}
                                        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-6">
                                            {/* Email Field */}
                                            <div className='flex flex-col gap-5'>
                                                <TextInput
                                                    withAsterisk
                                                    label={t.emailLabel}
                                                    placeholder={t.emailPlaceholder}
                                                    leftSection={<IconMail size={16} />}
                                                    {...form.getInputProps("login")}
                                                />

                                                <PasswordInput
                                                    withAsterisk
                                                    label={t.passwordLabel}
                                                    placeholder={t.passwordPlaceholder}
                                                    visibilityToggleIcon={({ reveal }) => (reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />)}
                                                    leftSection={<IconLock size={16} />}
                                                    {...form.getInputProps("password")}
                                                />

                                            </div>



                                            {/* Remember Me */}
                                            <div className="flex justify-between">
                                                <Checkbox
                                                    label={t.rememberMe}

                                                />
                                                <button
                                                    type="button"
                                                    className="text-xs text-blue-700 hover:text-blue-800 transition-colors font-bold underline drop-shadow-sm cursor-pointer"
                                                    onClick={() => navigate("/forget-password")}
                                                >
                                                    {t.forgotPassword}
                                                </button>
                                            </div>

                                            <Button
                                                type="submit"
                                                fullWidth
                                                loading={loading}

                                                className="!bg-gradient-to-r from-blue-500 via-green-500 to-blue-600 hover:from-blue-600 hover:via-green-600 hover:to-blue-700 shadow-xl text-sm font-bold"
                                                leftSection={<IconShield size={16} />}
                                            >
                                                {loading ? t.loginProgress : t.loginButton}
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logos Row - Déplacés en bas et réduits */}
                        <div className="flex items-center justify-center space-x-6 mb-4" style={{ marginTop: '50px' }}>

                            {/* SafeX 360 Logo - Réduit */}
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <div className="text-white font-bold text-sm drop-shadow-lg">SafeX</div>
                                        <div className="text-cyan-100 font-bold text-sm drop-shadow-lg">360</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-bold text-blue-900 drop-shadow-lg">{t.healthSafety}</div>
                            </div>

                            {/* Shield/Protection Logo - Réduit */}
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <IconShield className="w-7 h-7 text-white drop-shadow-lg" />
                                </div>
                                <div className="mt-2 text-sm font-bold text-green-900 drop-shadow-lg">{t.epiProtection}</div>
                            </div>

                            {/* Audit Logo - Réduit */}
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-indigo-700 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconCircleCheck className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white font-bold text-xs drop-shadow-lg">AUDIT</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-bold text-blue-900 drop-shadow-lg">{t.audit}</div>
                            </div>

                            {/* Risk Management Logo - Réduit */}
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconAlertTriangle className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white font-bold text-xs drop-shadow-lg">RISK</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-bold text-red-900 drop-shadow-lg">{t.riskManagement}</div>
                            </div>

                            {/* Document Management Logo - Réduit */}
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconFileText className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white font-bold text-xs drop-shadow-lg">DOCS</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-bold text-purple-900 drop-shadow-lg">{t.documentManagement}</div>
                            </div>

                            {/* Stakeholder Management Logo - Réduit */}
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-center">
                                        <IconUsers className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-lg" />
                                        <div className="text-white font-bold text-xs drop-shadow-lg">STAKE</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-bold text-indigo-900 drop-shadow-lg">{t.stakeholderManagement}</div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Security Info Footer - Simplifié */}
                <div className="w-full p-2 text-center flex-shrink-0">
                    <div className="text-sm text-blue-900 font-medium drop-shadow-lg">
                        Copyright Mine Xpert © {new Date().getFullYear()} All Rights Reserved
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginsPage;