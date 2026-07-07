import { useState } from 'react';
import {
    IconLock,
    IconMail,
    IconUser,
    IconWorld,
    IconArrowRight,
} from '@tabler/icons-react';
import { Button, TextInput, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { generatePassword } from '../../../utility/OtherUtilities';
import { resetPassword } from '../../../services/AccountService';
import { successNotification } from '../../../utility/NotificationUtility';
import SafeXBrandMark from '../../UtilityComp/SafeXBrandMark';
import ErrorBanner from '../../UtilityComp/ErrorBanner';

/**
 * LOT 40 P1: SafeX 360 — Forgot password page.
 * Aligned with LoginsPage.tsx (LOT 34 style):
 *   - Source Serif 4 editorial typography
 *   - Cream background, sober card layout
 *   - No heavy multi-color gradients
 */
const PasswordPage = () => {
    const [language, setLanguage] = useState<'fr' | 'en'>('en');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | false>(false);

    const translations = {
        fr: {
            kicker: 'SafeX 360 · Plateforme HSE Minière',
            forgotTitle: 'Réinitialiser le mot de passe',
            forgotSubtitle: 'Saisissez votre identifiant et votre email — un mot de passe temporaire vous sera envoyé.',
            emailLabel: 'Email',
            emailPlaceholder: 'votre.email@company.com',
            loginLabel: 'Identifiant',
            loginPlaceholder: 'votre identifiant',
            resetButton: 'Envoyer le lien',
            resetProgress: 'Envoi…',
            backToLogin: 'Retour à la connexion',
            remember: 'Vous vous souvenez de votre mot de passe ?',
            standards: 'Conformité ISO 45001 · 14001 · 9001 · 19011',
        },
        en: {
            kicker: 'SafeX 360 · Mining HSE Platform',
            forgotTitle: 'Reset password',
            forgotSubtitle: 'Enter your user ID and email — a temporary password will be sent.',
            emailLabel: 'Email',
            emailPlaceholder: 'your.email@company.com',
            loginLabel: 'User ID',
            loginPlaceholder: 'your user ID',
            resetButton: 'Send reset link',
            resetProgress: 'Sending…',
            backToLogin: 'Back to sign in',
            remember: 'Remember your password?',
            standards: 'ISO 45001 · 14001 · 9001 · 19011 compliant',
        },
    };

    const form = useForm({
        initialValues: {
            email: '',
            login: '',
            password: generatePassword(),
        },
        validate: {
            email: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return language === 'fr' ? 'Email requis' : 'Email is required';
                return trimmed.length > 50 ? 'Maximum 50 characters allowed' : null;
            },
            login: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return language === 'fr' ? 'Identifiant requis' : 'Login is required';
                return trimmed.length > 50 ? 'Maximum 50 characters allowed' : null;
            },
        },
    });

    const t = translations[language];
    const toggleLanguage = () => setLanguage(language === 'fr' ? 'en' : 'fr');

    const handleSubmit = (values: typeof form.values) => {
        setError(false);
        setLoading(true);
        resetPassword(values)
            .then(() => {
                successNotification('Temporary password sent to your email');
                navigate('/login');
            })
            .catch((err) => {
                setError(err?.response?.data?.errorMessage || 'An error occurred');
            })
            .finally(() => setLoading(false));
    };

    return (
        // LOT 40 P1: cream background — sober editorial layout matching LoginsPage typographic system
        // overflow-x-hidden seulement : le halo décoratif déborde en largeur, mais un
        // overflow-hidden total bloquait le scroll vertical (bouton hors d'atteinte
        // sur petit écran avec clavier ouvert).
        <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: '#faf7f2' }}>
            {/* Subtle teal halo for visual warmth */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: '-10%',
                    right: '-10%',
                    width: '45%',
                    height: '70%',
                    background: 'radial-gradient(circle, rgba(94,234,212,0.18) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* Language toggle */}
            <button
                type="button"
                onClick={toggleLanguage}
                aria-label="Toggle language"
                className="absolute top-6 right-6 z-30 flex items-center gap-2 px-3 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-all text-xs text-slate-700 shadow-sm"
            >
                <IconWorld size={14} className="text-slate-500" />
                <span className="tracking-wide">{language === 'fr' ? 'FR' : 'EN'}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-[460px]">
                    {/* Brand mark */}
                    <div className="flex justify-center mb-8">
                        <SafeXBrandMark variant="full" tone="dark" size={38} />
                    </div>

                    {/* Kicker */}
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 text-center mb-3">
                        {t.kicker}
                    </p>

                    {/* Title — Source Serif 4 */}
                    <h1
                        className="text-slate-900 text-center leading-tight mb-2"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 500,
                            fontSize: 'clamp(26px, 3vw, 32px)',
                            letterSpacing: '-0.015em',
                        }}
                    >
                        {t.forgotTitle}
                    </h1>
                    <p className="text-[13px] text-slate-600 text-center mb-8 max-w-sm mx-auto">
                        {t.forgotSubtitle}
                    </p>

                    {/* Form card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-9">
                        {/* LOT 41 E: ErrorBanner unifié */}
                        {error && (
                            <div className="mb-5">
                                <ErrorBanner tone="error" compact>{error}</ErrorBanner>
                            </div>
                        )}

                        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
                            <TextInput
                                label={
                                    <span className="text-[11px] uppercase tracking-[0.12em] text-slate-600">
                                        {t.loginLabel}
                                    </span>
                                }
                                placeholder={t.loginPlaceholder}
                                withAsterisk
                                size="md"
                                radius="md"
                                leftSection={<IconUser size={15} className="text-slate-400" />}
                                {...form.getInputProps('login')}
                            />

                            <TextInput
                                label={
                                    <span className="text-[11px] uppercase tracking-[0.12em] text-slate-600">
                                        {t.emailLabel}
                                    </span>
                                }
                                placeholder={t.emailPlaceholder}
                                withAsterisk
                                size="md"
                                radius="md"
                                leftSection={<IconMail size={15} className="text-slate-400" />}
                                {...form.getInputProps('email')}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                loading={loading}
                                size="md"
                                radius="md"
                                rightSection={
                                    loading ? <Loader size="xs" color="white" /> : <IconArrowRight size={16} />
                                }
                                styles={{
                                    root: {
                                        background: '#0f172a',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        letterSpacing: '0.005em',
                                        height: '46px',
                                        marginTop: '8px',
                                        border: 'none',
                                    },
                                    label: { color: '#ffffff' },
                                }}
                                className="hover:!bg-slate-800 transition-colors"
                            >
                                {loading ? t.resetProgress : t.resetButton}
                            </Button>

                            <div className="text-center text-[13px] text-slate-600 pt-2">
                                {t.remember}{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-teal-700 hover:text-teal-800 hover:underline cursor-pointer font-medium"
                                >
                                    {t.backToLogin}
                                </button>
                            </div>
                        </form>

                        {/* Card footer — security note */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                            <IconLock size={11} className="text-slate-400" />
                            <span className="text-[10.5px] text-slate-500">
                                {language === 'fr' ? 'Connexion chiffrée' : 'Encrypted connection'}
                            </span>
                        </div>
                    </div>

                    {/* Bottom standards */}
                    <p
                        className="text-center text-[11px] text-slate-500 mt-8 tracking-wide"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {t.standards}
                    </p>
                </div>
            </div>

            <div className="relative z-10 w-full py-3 text-center">
                <div className="text-[11px] text-slate-500">
                    Copyright Mine Xpert © 2025 All Rights Reserved
                </div>
            </div>
        </div>
    );
};

export default PasswordPage;
