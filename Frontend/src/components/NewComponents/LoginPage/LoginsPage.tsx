import { useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconUser,
    IconAlertTriangle,
    IconWorld,
    IconArrowRight,
} from '@tabler/icons-react';
import { Button, PasswordInput, TextInput, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { getUser, loginUser } from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';
import SafeXBrandMark from '../../UtilityComp/SafeXBrandMark';

/**
 * SafeX 360 — Page de connexion.
 *
 * Concept "minéral cinématographique" :
 *  - Photo plein écran d'une mine open-pit ouest-africaine au crépuscule
 *  - Overlay diagonal slate-950 → fade vers la droite
 *  - Carte de connexion sobre alignée à droite, glassmorphism léger
 *  - Aucune tagline marketing : la photo raconte l'industrie minière
 *  - Pied de page factuel : pays couverts + normes ISO
 *
 * Le toggle thème a été retiré : la page est intentionnellement
 * dark-cinematic pour donner le ton dès le premier regard.
 * Le toggle langue reste discret en haut à droite.
 */

// Photo de fond — mine open-pit / paysage industriel ouest-africain
// Source : Unsplash (licence libre, attribution non requise mais recommandée en footer)
const HERO_IMAGE =
    'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=2400&q=80';

const LoginsPage = () => {
    const navigate = useNavigate();
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const [error, setError] = useState(false);

    const t = language === 'fr'
        ? {
            loginTitle: 'Connexion à votre console',
            loginSubtitle: 'Accédez à votre espace de pilotage HSE',
            loginLabel: 'Identifiant',
            loginPlaceholder: 'votre identifiant',
            passwordLabel: 'Mot de passe',
            passwordPlaceholder: '••••••••',
            forgotPassword: 'Mot de passe oublié',
            loginButton: 'Se connecter',
            loginProgress: 'Connexion…',
            errorMessage: 'Identifiant ou mot de passe incorrect',
            countries: 'Burkina Faso · Mali · Guinée · Sénégal · Côte d\'Ivoire · Liberia',
            standards: 'Conformité ISO 45001 · 14001 · 9001 · 19011',
        }
        : {
            loginTitle: 'Sign in to your console',
            loginSubtitle: 'Access your HSE operations dashboard',
            loginLabel: 'User ID',
            loginPlaceholder: 'your user ID',
            passwordLabel: 'Password',
            passwordPlaceholder: '••••••••',
            forgotPassword: 'Forgot password',
            loginButton: 'Sign in',
            loginProgress: 'Signing in…',
            errorMessage: 'Incorrect user ID or password',
            countries: 'Burkina Faso · Mali · Guinea · Senegal · Ivory Coast · Liberia',
            standards: 'ISO 45001 · 14001 · 9001 · 19011 compliant',
        };

    const toggleLanguage = () => setLanguage(language === 'fr' ? 'en' : 'fr');

    const form = useForm({
        initialValues: { login: '', password: '' },
        validate: {
            login: (value) => (value.trim().length === 0
                ? (language === 'fr' ? 'Requis' : 'Required')
                : null),
            password: (value) => (!value
                ? (language === 'fr' ? 'Requis' : 'Required')
                : null),
        },
    });

    const handleSubmit = async (values: any) => {
        setError(false);
        form.validate();
        if (!form.isValid()) return;
        setLoading(true);
        try {
            await loginUser({ ...values });
            const res: any = await getUser();
            dispatch(setUser(res));
            navigate('/');
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">

            {/* ═══ Image plein écran ═══ */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${HERO_IMAGE})`,
                    filter: 'saturate(1.05) contrast(1.02)',
                }}
            />

            {/* ═══ Overlay sombre — gradient diagonal pour préserver l'image ═══ */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        linear-gradient(110deg,
                            rgba(2,6,23,0.92) 0%,
                            rgba(2,6,23,0.78) 35%,
                            rgba(2,6,23,0.55) 60%,
                            rgba(2,6,23,0.85) 100%)
                    `,
                }}
            />

            {/* Halo discret derrière la carte (lumière froide) */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: '20%',
                    right: '5%',
                    width: '40%',
                    height: '60%',
                    background:
                        'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* ═══ Toggle langue (haut droit, discret) ═══ */}
            <button
                onClick={toggleLanguage}
                className="absolute top-6 right-6 z-30 flex items-center gap-2 px-3 h-9 rounded-full bg-white/5 border border-white/15 backdrop-blur-md hover:bg-white/10 transition-all text-xs text-slate-200"
                aria-label="Toggle language"
            >
                <IconWorld size={14} className="text-slate-300" />
                <span className="tracking-wide">{language === 'fr' ? 'FR' : 'EN'}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>

            {/* ═══ Container principal ═══ */}
            <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

                {/* ─── Colonne gauche : marque + slogan factuel ─── */}
                <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 w-[55%]">

                    {/* Brand mark en haut */}
                    <SafeXBrandMark variant="full" tone="light" size={44} showTagline={false} />

                    {/* Vide central (la photo respire) */}
                    <div />

                    {/* Pied de page éditorial */}
                    <div className="space-y-3 max-w-md">
                        <p
                            className="text-[11px] uppercase tracking-[0.22em] text-slate-400"
                        >
                            {t.countries}
                        </p>
                        <p
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 400,
                                fontSize: '13px',
                                color: 'rgba(241,245,249,0.72)',
                                lineHeight: 1.6,
                                letterSpacing: '0.005em',
                            }}
                        >
                            {t.standards}
                        </p>
                    </div>
                </div>

                {/* ─── Colonne droite : carte de connexion ─── */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">

                    {/* Logo mobile uniquement */}
                    <div className="lg:hidden absolute top-6 left-6">
                        <SafeXBrandMark variant="icon" tone="light" size={36} />
                    </div>

                    <div className="w-full max-w-[420px]">

                        {/* Carte glassmorphism */}
                        <div
                            className="rounded-2xl border border-white/12 shadow-2xl overflow-hidden"
                            style={{
                                background: 'rgba(15, 23, 42, 0.55)',
                                backdropFilter: 'blur(24px) saturate(140%)',
                                WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                            }}
                        >
                            <div className="p-8 sm:p-10">

                                {/* Titre */}
                                <h1
                                    className="text-white tracking-tight leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 500,
                                        fontSize: '26px',
                                        letterSpacing: '-0.015em',
                                    }}
                                >
                                    {t.loginTitle}
                                </h1>
                                <p className="text-[13px] text-slate-400 mt-1.5">
                                    {t.loginSubtitle}
                                </p>

                                {/* Séparateur fin */}
                                <div className="h-px bg-white/10 my-6" />

                                {/* Erreur */}
                                {error && (
                                    <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-400/30 flex items-center gap-2">
                                        <IconAlertTriangle size={15} className="text-red-300 flex-shrink-0" />
                                        <span className="text-[13px] text-red-200">{t.errorMessage}</span>
                                    </div>
                                )}

                                <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">

                                    <TextInput
                                        label={
                                            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-300">
                                                {t.loginLabel}
                                            </span>
                                        }
                                        placeholder={t.loginPlaceholder}
                                        withAsterisk
                                        size="md"
                                        radius="md"
                                        leftSection={<IconUser size={15} className="text-slate-400" />}
                                        styles={{
                                            input: {
                                                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                                                borderColor: 'rgba(255, 255, 255, 0.10)',
                                                color: '#f1f5f9',
                                                fontSize: '14px',
                                            },
                                        }}
                                        {...form.getInputProps('login')}
                                    />

                                    <PasswordInput
                                        label={
                                            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-300">
                                                {t.passwordLabel}
                                            </span>
                                        }
                                        placeholder={t.passwordPlaceholder}
                                        withAsterisk
                                        size="md"
                                        radius="md"
                                        visibilityToggleIcon={({ reveal }) =>
                                            reveal ? <IconEyeOff size={15} /> : <IconEye size={15} />
                                        }
                                        leftSection={<IconLock size={15} className="text-slate-400" />}
                                        styles={{
                                            input: {
                                                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                                                borderColor: 'rgba(255, 255, 255, 0.10)',
                                                color: '#f1f5f9',
                                                fontSize: '14px',
                                            },
                                        }}
                                        {...form.getInputProps('password')}
                                    />

                                    {/* Mot de passe oublié — discret, sous le champ password */}
                                    <div className="flex justify-end -mt-1">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/forget-password')}
                                            className="text-[12px] text-slate-400 hover:text-slate-200 transition-colors"
                                        >
                                            {t.forgotPassword}
                                        </button>
                                    </div>

                                    {/* CTA principal */}
                                    <Button
                                        type="submit"
                                        fullWidth
                                        loading={loading}
                                        size="md"
                                        radius="md"
                                        rightSection={loading
                                            ? <Loader size="xs" color="white" />
                                            : <IconArrowRight size={16} />
                                        }
                                        styles={{
                                            root: {
                                                background: '#ffffff',
                                                color: '#0f172a',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                letterSpacing: '0.005em',
                                                height: '46px',
                                                marginTop: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                            },
                                            label: {
                                                color: '#0f172a',
                                            },
                                        }}
                                        className="hover:!bg-slate-100 transition-colors"
                                    >
                                        {loading ? t.loginProgress : t.loginButton}
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Pied de page mobile uniquement */}
                        <p className="lg:hidden text-center text-[10px] text-slate-500 mt-6 tracking-wide">
                            ISO 45001 · 14001 · 9001 · 19011
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginsPage;
