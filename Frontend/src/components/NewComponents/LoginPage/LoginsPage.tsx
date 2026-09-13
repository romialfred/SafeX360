import { useEffect, useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconUser,
    IconWorld,
    IconArrowRight,
    IconArrowLeft,
    IconDeviceMobile,
    IconCopy,
    IconCheck,
    IconKey,
    IconX,
    IconChevronDown,
} from '@tabler/icons-react';
import SafeXLogoColor from '../../UtilityComp/SafeXLogoColor';
import OtpQrCode from '../../UtilityComp/OtpQrCode';
import { Button, Menu, Modal, PasswordInput, TextInput, Loader } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ensureLanguageResources, LANGUAGE_LABELS } from '../../../i18n';
import { isNativePlatform } from '../../../m/utils/capacitorBridge';
import {
    confirmMfaEnrollment,
    getUser,
    loginUser,
    startMfaEnrollment,
    verifyMfa,
    firstLoginChangePassword,
    type MfaEnrollment,
} from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';
import LoginHeroPanel, { BrandLockup } from './LoginHeroPanel';
import MicrosoftSignInButton from './MicrosoftSignInButton';
import { getLoginCopy, type LoginCopy, type LoginLanguage } from './loginCopy';
import { resolveRedirect } from './safeRedirect';

/**
 * SafeX 360 — Page de connexion v5.
 *
 * Mise en page en deux zones sur desktop :
 *   - gauche  : visuel minier + surcouche analytique (voir LoginHeroPanel)
 *   - droite  : carte de connexion sur fond bleu nuit (#061A22)
 * Sous 768 px, la photo devient un arrière-plan sombre et le formulaire prend
 * la priorité.
 *
 * La logique d'authentification est INCHANGÉE : mot de passe, double
 * authentification TOTP (enrôlement, vérification, codes de récupération),
 * première connexion (mot de passe temporaire avant 2FA), réveil du serveur,
 * limitation des tentatives (429) et invitation expirée.
 *
 * Langue : pilotée par le système i18n existant (react-i18next), les libellés
 * de cet écran public venant de `loginCopy.ts` (convention *Labels.ts).
 */

/**
 * Style commun des champs du formulaire — hauteur 56 px, rayon 10 px, bordure
 * 1 px, et TOUS les états visibles (survol, focus, saisie, désactivé, erreur).
 * Factorisé : deux définitions divergeraient au premier ajustement.
 */
const LOGIN_FIELD_STYLES = {
    label: {
        color: '#0B2A38',
        fontSize: '14.5px',
        fontWeight: 500,
        marginBottom: '8px',
    },
    input: {
        height: '56px',
        backgroundColor: '#FFFFFF',
        // La couleur de bordure vit dans LOGIN_PAGE_CSS : posée ici en style
        // en ligne, elle l'emporterait sur les états survol / focus / erreur.
        color: '#0B2A38',
        fontSize: '15px',
    },
    section: { color: '#7C8C93' },
    error: { color: '#C93A3F', fontSize: '12.5px', marginTop: '6px' },
};

/**
 * États des champs et polices de l'écran.
 *
 * Les pseudo-classes ne passent pas par la prop `styles` de Mantine 7 (elle
 * n'accepte que des propriétés CSS simples) : elles vivent donc ici, dans une
 * feuille scopée à la page. La famille sans-serif est imposée explicitement —
 * le thème global applique une serif aux titres, absente de cette maquette.
 */
/** Concepteur de la plateforme, crédité dans le pied de page. */
const DESIGNER_NAME = 'Data Universe';
const DESIGNER_URL = 'https://www.datauniverse.bf';

const LOGIN_PAGE_CSS = `
.sx-login, .sx-login h1, .sx-login h2, .sx-login input, .sx-login button {
    font-family: Inter, 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif;
}
.sx-login .sx-input { border-color: #DCE5E6 !important; }
.sx-login .sx-input:hover:not(:disabled) { border-color: #9FC9C4 !important; }
.sx-login .sx-input:focus { border-color: #17B3A6 !important; box-shadow: 0 0 0 3px rgba(23,179,166,0.15); }
.sx-login .sx-input[data-error], .sx-login .sx-input[aria-invalid='true'] { border-color: #C93A3F !important; }
.sx-login .sx-input:disabled { opacity: .6; background-color: #F1F5F5; }
.sx-login .sx-input::placeholder { color: #94A5AB; }
.sx-login :focus-visible { outline: 2px solid #17B3A6; outline-offset: 2px; }

/* Filet turquoise vertical à gauche du bloc formulaire (maquette). */
.sx-login .sx-card { position: relative; animation: sxCardIn .45s ease-out both; }
.sx-login .sx-accent { display: none; }
@media (min-width: 1024px) {
    .sx-login .sx-accent {
        display: block;
        position: absolute;
        left: 0; top: 4px; bottom: 4px;
        width: 3px;
        border-radius: 2px;
        background: #17B3A6;
    }
}
@keyframes sxCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .sx-login .sx-card { animation: none; } }

/* ── Zéro défilement sur ordinateur ──────────────────────────────────────
   La page occupe exactement la fenêtre. Le rythme vertical se resserre par
   paliers de hauteur d'écran (1440x900, 1366x768, 1280x720…) : rien n'est
   masqué, tout tient dans le viewport. Sous 1024 px de large, le défilement
   reste autorisé — le formulaire y est empilé et doit pouvoir remonter
   au-dessus du clavier virtuel. */
@media (min-width: 1024px) {
    .sx-login { overflow: hidden; }
    .sx-login .sx-right { height: 100dvh; min-height: 0; overflow: hidden; }
    .sx-login .sx-main { min-height: 0; }
}
@media (min-width: 1024px) and (max-height: 940px) {
    .sx-login .sx-main { padding-top: 8px; padding-bottom: 8px; }
    .sx-login .sx-form { margin-top: 18px; }
    .sx-login .sx-sep, .sx-login .sx-mobile { margin-top: 16px; }
}
@media (min-width: 1024px) and (max-height: 860px) {
    .sx-login .sx-topbar { padding-top: 12px; }
    .sx-login .sx-footer { padding-bottom: 12px; }
    .sx-login .sx-main { padding-top: 2px; padding-bottom: 2px; }
    .sx-login .sx-card h1 { font-size: 30px; margin-top: 14px; }
    .sx-login .sx-card h1 + div { margin-top: 8px; }
    .sx-login .sx-form { margin-top: 14px; }
    .sx-login .sx-form > * + * { margin-top: 10px; }
    .sx-login .sx-input { height: 50px !important; }
    .sx-login .sx-submit { height: 52px; }
    .sx-login .sx-ms-btn { height: 50px; }
    .sx-login .sx-sep, .sx-login .sx-mobile { margin-top: 12px; }
    .sx-login .sx-mobile > div:last-child { margin-top: 8px; }
}
@media (min-width: 1024px) and (max-height: 760px) {
    .sx-login .sx-topbar { padding-top: 8px; }
    .sx-login .sx-footer { padding-bottom: 8px; }
    .sx-login .sx-main { padding-top: 2px; padding-bottom: 2px; }
    .sx-login .sx-card h1 { font-size: 26px; margin-top: 8px; }
    .sx-login .sx-card > p { margin-top: 8px; }
    .sx-login .sx-form { margin-top: 8px; }
    .sx-login .sx-form > * + * { margin-top: 8px; }
    .sx-login .sx-input { height: 44px !important; }
    .sx-login .sx-submit { height: 46px; }
    .sx-login .sx-ms-btn { height: 44px; }
    .sx-login .sx-sep, .sx-login .sx-mobile { margin-top: 8px; }
    .sx-login .sx-mobile a, .sx-login .sx-mobile [role='img'] { height: 38px; }
    .sx-login .sx-mobile > div:last-child { margin-top: 6px; }
}
/* Tablette : une seule colonne, resserrée pour tenir dans la fenêtre sur les
   formats courants (768x1024, 900x1000). */
@media (min-width: 768px) and (max-width: 1023px) {
    .sx-login .sx-main { padding-top: 8px; padding-bottom: 8px; }
    .sx-login .sx-form { margin-top: 18px; }
}
/* Soupape de sécurité : sur un écran vraiment court, la colonne de droite
   défile SEULE plutôt que de laisser le contenu chevaucher le pied de page. */
@media (min-width: 1024px) and (max-height: 640px) {
    .sx-login .sx-main { overflow-y: auto; }
}
`;

/* ── Tuiles de téléchargement — style « badge store » compact ─────────────
   Android : télécharge l'APK signé. iOS : annonce (pas encore de build IPA).
   Réutilisées en bas à gauche (desktop) et sous les badges ISO (mobile). */

type StoreT = Pick<
    LoginCopy,
    'mobileVersion' | 'storeAndroidTop' | 'storeAndroidBottom' | 'storeAndroidMeta'
    | 'storeIosTop' | 'storeIosBottom' | 'mobileDownloadAria' | 'iosSoonAria'
>;

const StoreTileAndroid = ({ t }: { t: StoreT }) => (
    <a
        href="/downloads/SafexMobile.apk"
        download="SafeX 360 HSE.apk"
        aria-label={t.mobileDownloadAria}
        title={t.storeAndroidMeta}
        className="group flex items-center gap-2.5 px-4 h-[44px] rounded-[10px] border transition-colors"
        style={{
            background: '#FFFFFF',
            borderColor: '#DCE5E6',
            color: '#0B2A38',
        }}
    >
        {/* Logo officiel Google Play (triangle quadricolore) */}
        <svg viewBox="0 0 512 512" className="w-6 h-6 flex-shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" />
            <path fill="#34A853" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z" />
            <path fill="#FBBC04" d="m472.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
            <path fill="#EA4335" d="m104.6 499 280.8-161.2-60.1-60.1L104.6 499z" />
        </svg>
        <span className="text-[14px] font-medium">{t.storeAndroidBottom}</span>
        <span className="text-[9.5px] px-1.5 py-px rounded-full font-medium" style={{ background: '#DFF3F0', color: '#0B6B63' }}>{t.mobileVersion}</span>
    </a>
);

const StoreTileIos = ({ t }: { t: StoreT }) => (
    <div
        role="img"
        aria-label={t.iosSoonAria}
        title={t.iosSoonAria}
        className="flex items-center gap-2.5 px-4 h-[44px] rounded-[10px] border cursor-not-allowed select-none"
        style={{
            background: '#F1F5F5',
            borderColor: '#E2E9EA',
            color: '#7C8C93',
        }}
    >
        {/* Pomme Apple */}
        <svg viewBox="0 0 384 512" className="w-4 h-5 flex-shrink-0" fill="#7C8C93" aria-hidden="true">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        <span className="text-[14px] font-medium">{`${t.storeIosBottom} — ${t.storeIosTop.toLowerCase()}`}</span>
    </div>
);

const LoginsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Langue pilotée par le système i18n existant (persistance localStorage
    // `safex360-lang`, synchronisation de <html lang>) : le choix fait ici
    // reste actif une fois dans l'application.
    const { i18n } = useTranslation();
    // On lit `language` (le choix explicite) et non `resolvedLanguage` : tant
    // que le bundle EN n'est pas enregistré, i18next « résout » encore vers le
    // français et la page resterait bloquée en FR après un clic sur EN.
    const language: LoginLanguage =
        (i18n.language || i18n.resolvedLanguage || 'fr').split('-')[0] === 'en' ? 'en' : 'fr';
    const [loading, setLoading] = useState(false);
    // Destination initialement demandée (posée par ProtectedRoute) — assainie
    // contre les redirections ouvertes.
    const redirectTo = resolveRedirect(location.state, location.search);
    const dispatch = useAppDispatch();
    type LoginErrorKind = 'credentials' | 'network' | 'server' | 'waking' | 'rateLimit' | 'invitationExpired' | null;
    const [errorKind, setErrorKind] = useState<LoginErrorKind>(null);
    // Détail technique renvoyé par le serveur (code d'erreur MFA notamment) —
    // affiché sous le message générique pour ne plus masquer la cause réelle.
    const [serverDetail, setServerDetail] = useState('');
    const [wakingStep, setWakingStep] = useState(0);
    type MfaMode = 'verify' | 'enroll' | 'recoveryCodes' | 'firstLoginPassword' | null;
    const [mfaMode, setMfaMode] = useState<MfaMode>(null);
    // Première connexion (pré-session) : changement du mot de passe temporaire AVANT la 2FA.
    const [pwdChallenge, setPwdChallenge] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [mfaChallenge, setMfaChallenge] = useState('');
    const [mfaEnrollment, setMfaEnrollment] = useState<MfaEnrollment | null>(null);
    const [mfaCode, setMfaCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
    const [mfaError, setMfaError] = useState('');
    // Le defi MFA expire cote serveur (expiresInSeconds, 300 s par defaut).
    // Sans compte a rebours ni sortie, l'utilisateur decouvrait l'expiration
    // par un echec sec et ne pouvait que recharger la page.
    const [mfaDeadline, setMfaDeadline] = useState<number | null>(null);
    const [mfaRemaining, setMfaRemaining] = useState<number>(0);
    const [keyCopied, setKeyCopied] = useState(false);
    const [showManualKey, setShowManualKey] = useState(false);
    // Visibilité du mot de passe pilotée ici pour nommer correctement le bouton
    // bascule auprès des lecteurs d'écran (« afficher » / « masquer »).
    const [showPassword, setShowPassword] = useState(false);

    const copyManualKey = async (key: string) => {
        // Copie robuste : l'API presse-papiers moderne exige un contexte
        // sécurisé (HTTPS/localhost) ET peut être bloquée par la Permissions
        // Policy. On tente d'abord clipboard.writeText, puis on REPLIE sur la
        // sélection + execCommand('copy') — sinon la clé restait « incopiable ».
        let ok = false;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(key);
                ok = true;
            }
        } catch {
            ok = false;
        }
        if (!ok) {
            try {
                const ta = document.createElement('textarea');
                ta.value = key;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                ok = document.execCommand('copy');
                document.body.removeChild(ta);
            } catch {
                ok = false;
            }
        }
        if (ok) {
            setKeyCopied(true);
            window.setTimeout(() => setKeyCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (mfaDeadline === null || mfaMode === null || mfaMode === 'recoveryCodes') return;
        const tick = () => setMfaRemaining(Math.max(0, Math.ceil((mfaDeadline - Date.now()) / 1000)));
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [mfaDeadline, mfaMode]);

    /** Abandon du parcours MFA : retour a l'ecran de connexion, etat purge. */
    const cancelMfa = () => {
        setMfaMode(null);
        setMfaChallenge('');
        setMfaEnrollment(null);
        setMfaCode('');
        setMfaError('');
        setUseRecoveryCode(false);
        setMfaDeadline(null);
        setShowManualKey(false);
        setKeyCopied(false);
    };

    const t = getLoginCopy(language);

    /** Bascule de langue — passe par i18n (chargement du bundle EN à la demande). */
    const changeLanguage = async (lng: LoginLanguage) => {
        if (lng === language) return;
        await ensureLanguageResources(lng);
        await i18n.changeLanguage(lng);
        // Les ressources peuvent arriver après la bascule (import dynamique) :
        // i18next garde alors sa résolution précédente. Une seconde bascule,
        // une fois les bundles enregistrés, réaligne toute l'application.
        if ((i18n.resolvedLanguage || '').split('-')[0] !== lng) {
            await i18n.changeLanguage(lng);
        }
    };

    const form = useForm({
        initialValues: { login: '', password: '' },
        validate: {
            login: (value) => (value.trim().length === 0 ? t.loginRequired : null),
            password: (value) => (!value ? t.passwordRequired : null),
        },
    });

    // Enclenche l'étape 2FA depuis une réponse serveur 428 (MFA_REQUIRED /
    // MFA_ENROLLMENT_REQUIRED). Réutilisé par le login ET par la première connexion.
    const beginMfa = async (data: any): Promise<boolean> => {
        const errCode = data?.errorCode ?? '';
        const challenge = String(data?.challenge ?? '');
        if (!challenge || (errCode !== 'MFA_REQUIRED' && errCode !== 'MFA_ENROLLMENT_REQUIRED')) return false;
        setMfaChallenge(challenge);
        setMfaCode('');
        setMfaError('');
        const ttl = Number(data?.expiresInSeconds) || 300;
        setMfaDeadline(Date.now() + ttl * 1000);
        if (errCode === 'MFA_ENROLLMENT_REQUIRED') {
            try {
                const enrollment = await startMfaEnrollment(challenge);
                setMfaEnrollment(enrollment);
                setMfaMode('enroll');
            } catch (e: any) {
                // NE PAS AVALER L'ERREUR : le serveur exige l'enrôlement mais le
                // démarrage échoue → sans ce détail, l'utilisateur ne voyait qu'un
                // « erreur technique » générique et le compte semblait simplement
                // refuser la connexion (c'est ainsi que le verrou mfaEnabled-sans-secret
                // est resté invisible). On remonte le code/message du serveur.
                const d = e?.response?.data;
                setServerDetail(String(d?.errorCode || d?.errorMessage || e?.message || '')
                    .slice(0, 120));
                return false;
            }
        } else {
            setMfaMode('verify');
        }
        return true;
    };

    // Première connexion : pose du nouveau MDP (pré-session) puis enchaînement 2FA/session.
    const handleFirstLoginPassword = async () => {
        if (newPwd !== confirmPwd) {
            setPwdError(language === 'fr' ? 'Les deux mots de passe ne correspondent pas.' : 'Passwords do not match.');
            return;
        }
        const policyOk = newPwd.length >= 10 && /[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd)
            && /[0-9]/.test(newPwd) && /[^A-Za-z0-9]/.test(newPwd);
        if (!policyOk) {
            setPwdError(language === 'fr'
                ? '10 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.'
                : 'At least 10 characters incl. uppercase, lowercase, digit and special character.');
            return;
        }
        setLoading(true);
        setPwdError('');
        try {
            const res: any = await firstLoginChangePassword(pwdChallenge, newPwd);
            // 200 = session ouverte (rôle sans 2FA) → on entre.
            setMfaMode(null);
            await completeAuthenticatedSession();
            void res;
        } catch (err: any) {
            const data = err?.response?.data;
            // 428 = le rôle exige la 2FA → on enchaîne sur l'enrôlement / la vérification.
            if (err?.response?.status === 428 && await beginMfa(data)) return;
            setPwdError(data?.errorMessage
                || (language === 'fr' ? 'Échec du changement de mot de passe.' : 'Password change failed.'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        // Protection contre les doubles soumissions : le bouton est désactivé
        // pendant l'appel, mais la touche Entrée soumettrait quand même le
        // formulaire.
        if (loading) return;
        setErrorKind(null);
        setServerDetail('');
        setWakingStep(0);
        form.validate();
        if (!form.isValid()) return;
        setLoading(true);

        const MAX_RETRIES = 8;
        let finalErrorKind: LoginErrorKind = null;

        const attempt = async (retriesLeft: number): Promise<void> => {
            let loginSucceeded = false;
            try {
                await loginUser({ ...values });
                loginSucceeded = true;
                setWakingStep(4);
                const res: any = await getUser();
                dispatch(setUser(res));
                navigate(isNativePlatform() ? '/m/home' : redirectTo, { replace: true });
            } catch (err: any) {
                const isNetwork = !err?.response;
                const status = err?.response?.status;
                const errMsg = err?.response?.data?.errorMessage ?? '';
                const errCode = err?.response?.data?.errorCode ?? '';

                // Première connexion : le MDP temporaire doit être changé AVANT la 2FA.
                if (status === 428 && errCode === 'PASSWORD_CHANGE_REQUIRED') {
                    const challenge = String(err?.response?.data?.challenge ?? '');
                    if (!challenge) { finalErrorKind = 'server'; setErrorKind('server'); return; }
                    setPwdChallenge(challenge);
                    setNewPwd(''); setConfirmPwd(''); setPwdError('');
                    const ttl = Number(err?.response?.data?.expiresInSeconds) || 300;
                    setMfaDeadline(Date.now() + ttl * 1000);
                    setMfaMode('firstLoginPassword');
                    return;
                }

                if (status === 428 && (errCode === 'MFA_REQUIRED' || errCode === 'MFA_ENROLLMENT_REQUIRED')) {
                    const ok = await beginMfa(err?.response?.data);
                    if (!ok) { finalErrorKind = 'server'; setErrorKind('server'); }
                    return;
                }

                if (status === 429) {
                    finalErrorKind = 'rateLimit';
                    setErrorKind('rateLimit');
                    return;
                }
                if (errMsg === 'INVITATION_EXPIRED') {
                    finalErrorKind = 'invitationExpired';
                    setErrorKind('invitationExpired');
                    return;
                }

                if (loginSucceeded) {
                    finalErrorKind = 'server';
                    setErrorKind('server');
                    return;
                }

                const isAuthError = status === 401 || status === 403
                    || errMsg === 'Incorrect username or password'
                    || errMsg === 'Authentication failed';
                if (isAuthError) {
                    finalErrorKind = 'credentials';
                    setErrorKind('credentials');
                    return;
                }

                const isColdStart = isNetwork || status === 502 || status === 503 || status === 504;
                if (isColdStart && retriesLeft > 0) {
                    const elapsed = MAX_RETRIES - retriesLeft;
                    const step = Math.min(Math.floor((elapsed / MAX_RETRIES) * 4) + 1, 4);
                    setWakingStep(step);
                    setErrorKind('waking');
                    finalErrorKind = 'waking';
                    await new Promise((r) => setTimeout(r, 5000));
                    return attempt(retriesLeft - 1);
                }

                finalErrorKind = isNetwork ? 'network' : 'server';
                setErrorKind(finalErrorKind);
            }
        };

        try {
            await attempt(MAX_RETRIES);
        } finally {
            setLoading(false);
            if (finalErrorKind !== 'waking') setWakingStep(0);
        }
    };

    const completeAuthenticatedSession = async () => {
        const res = await getUser();
        dispatch(setUser(res));
        navigate(isNativePlatform() ? '/m/home' : redirectTo, { replace: true });
    };

    const handleMfaVerification = async () => {
        if (!mfaCode.trim()) return;
        setLoading(true);
        setMfaError('');
        try {
            await verifyMfa(mfaChallenge, useRecoveryCode ? '' : mfaCode, useRecoveryCode ? mfaCode : undefined);
            setMfaMode(null);
            await completeAuthenticatedSession();
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            setMfaError(status === 429
                ? (language === 'fr' ? 'Challenge bloqué après cinq essais. Recommencez la connexion.' : 'Challenge locked after five attempts. Start sign-in again.')
                : (language === 'fr' ? 'Code invalide, expiré ou déjà utilisé.' : 'Invalid, expired, or previously used code.'));
        } finally {
            setLoading(false);
        }
    };

    const handleMfaEnrollment = async () => {
        if (!mfaCode.trim()) return;
        setLoading(true);
        setMfaError('');
        try {
            const result = await confirmMfaEnrollment(mfaChallenge, mfaCode);
            setMfaRecoveryCodes(result.recoveryCodes);
            setMfaMode('recoveryCodes');
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            setMfaError(status === 429
                ? (language === 'fr' ? 'Challenge bloqué. Recommencez la connexion.' : 'Challenge locked. Start sign-in again.')
                : (language === 'fr' ? 'Code de vérification incorrect.' : 'Incorrect verification code.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        // Page plein écran en deux zones : visuel minier à gauche, portail
        // employé sur fond clair à droite. Aucun défilement au-delà de 1024 px.
        <div className="sx-login fixed inset-0 w-screen overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(440px,41%)]" style={{ background: '#F7FAF9', color: '#0B2A38' }}>
            <style>{LOGIN_PAGE_CSS}</style>

            {/* ═══ Zone visuelle gauche (à partir de 1024 px) ═══ */}
            <div className="relative hidden lg:block min-h-[100dvh]">
                <LoginHeroPanel t={t} />
            </div>

            {/* ═══ Portail employé ═══ */}
            <div className="sx-right relative flex min-h-[100dvh] flex-col" style={{ background: '#F7FAF9' }}>

                {/* ── Barre haute : retour au site + sélecteur de langue ── */}
                <div className="sx-topbar relative z-10 flex items-center justify-between gap-3 px-6 pt-5 sm:px-10">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-[14px] font-medium transition-opacity hover:opacity-75"
                        style={{ color: '#0E9E93' }}
                    >
                        <IconArrowLeft size={17} aria-hidden="true" />
                        <span>{t.backToSite}</span>
                    </button>

                    {/* Sélecteur de langue — globe + langue active + menu */}
                    <Menu position="bottom-end" offset={6} radius="md" width={190} withinPortal>
                        <Menu.Target>
                            <button
                                type="button"
                                aria-label={t.languageGroupLabel}
                                className="inline-flex h-[46px] items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors"
                                style={{ borderColor: '#D7E1E2', background: '#FFFFFF', color: '#0B2A38' }}
                            >
                                <IconWorld size={17} aria-hidden="true" style={{ color: '#5A6B72' }} />
                                <span>{language.toUpperCase()}</span>
                                <IconChevronDown size={15} aria-hidden="true" style={{ color: '#5A6B72' }} />
                            </button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {(['fr', 'en'] as const).map((lng) => (
                                <Menu.Item
                                    key={lng}
                                    onClick={() => { void changeLanguage(lng); }}
                                    aria-label={lng === 'fr' ? t.languageSwitchFr : t.languageSwitchEn}
                                    rightSection={language === lng
                                        ? <IconCheck size={15} style={{ color: '#0E9E93' }} aria-hidden="true" />
                                        : null}
                                >
                                    {LANGUAGE_LABELS[lng].native}
                                </Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    </Menu>
                </div>

                {/* ── Formulaire, centré verticalement ── */}
                <div className="sx-main relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-5 sm:px-10">
                    {/* Marque — la zone visuelle gauche n'existe pas sous 1024 px. */}
                    <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
                        <BrandLockup t={t} tone="dark" size={38} />
                        <p className="text-center text-[13px]" style={{ color: '#5A6B72' }}>{t.tagline}</p>
                    </div>

                    <div className="sx-card w-full max-w-[560px] lg:pl-8">
                        {/* Filet turquoise vertical, repris de la maquette */}
                        <div className="sx-accent" aria-hidden="true" />

                        <div className="flex justify-center">
                            <span
                                className="rounded-full px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em]"
                                style={{ background: '#DFF3F0', color: '#0B6B63' }}
                            >
                                {t.portalBadge}
                            </span>
                        </div>

                        <h1
                            className="mt-5 text-center"
                            style={{ color: '#0B2A38', fontWeight: 700, fontSize: 'clamp(30px, 2.6vw, 40px)', letterSpacing: '-0.02em' }}
                        >
                            {t.welcomeTitle}
                        </h1>
                        <div className="mx-auto mt-3 h-[3px] w-14 rounded-full" style={{ background: '#17B3A6' }} aria-hidden="true" />
                        <p className="mt-4 text-center text-[15.5px]" style={{ color: '#4A5C64' }}>{t.welcomeSubtitle}</p>

                        {/* Annonce accessible des erreurs générales (hors modale) */}
                        <p className="sr-only" role="status" aria-live="polite">
                            {errorKind === 'credentials' ? t.errorCredentials
                                : errorKind === 'rateLimit' ? t.errorRateLimit
                                    : errorKind === 'network' ? t.errorNetwork
                                        : errorKind === 'server' ? t.errorServer
                                            : errorKind === 'waking' ? t.errorWaking
                                                : ''}
                        </p>

                        <form onSubmit={form.onSubmit(handleSubmit)} className="sx-form mt-6 space-y-4 text-left" noValidate>
                            <TextInput
                                label={t.loginLabel}
                                placeholder={t.loginPlaceholder}
                                size="md"
                                radius={10}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                                disabled={loading}
                                leftSection={<IconUser size={18} aria-hidden="true" />}
                                classNames={{ input: 'sx-input' }}
                                styles={LOGIN_FIELD_STYLES}
                                {...form.getInputProps('login')}
                            />

                            <PasswordInput
                                label={t.passwordLabel}
                                placeholder={t.passwordPlaceholder}
                                size="md"
                                radius={10}
                                autoComplete="current-password"
                                disabled={loading}
                                leftSection={<IconLock size={18} aria-hidden="true" />}
                                visibilityToggleIcon={({ reveal }) =>
                                    reveal ? <IconEyeOff size={18} aria-hidden="true" /> : <IconEye size={18} aria-hidden="true" />
                                }
                                visibilityToggleButtonProps={{
                                    'aria-label': showPassword ? t.passwordHide : t.passwordShow,
                                }}
                                visible={showPassword}
                                onVisibilityChange={setShowPassword}
                                classNames={{ input: 'sx-input' }}
                                styles={LOGIN_FIELD_STYLES}
                                {...form.getInputProps('password')}
                            />

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forget-password')}
                                    className="rounded text-[13.5px] underline underline-offset-4"
                                    style={{ color: '#0E9E93' }}
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                aria-busy={loading}
                                className="sx-submit flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[10px] text-[16px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                style={{ background: '#0B2432', color: '#FFFFFF' }}
                            >
                                {loading ? <Loader size="xs" color="#FFFFFF" /> : null}
                                <span>{loading ? t.loginProgress : t.loginButton}</span>
                                {loading ? null : <IconArrowRight size={19} aria-hidden="true" />}
                            </button>
                        </form>

                        {/* Séparateur « OU » */}
                        <div className="sx-sep mt-6 flex items-center gap-3" aria-hidden="true">
                            <span className="h-px flex-1" style={{ background: '#DDE6E7' }} />
                            <span className="text-[11.5px] uppercase tracking-[0.16em]" style={{ color: '#7C8C93' }}>{t.separatorOr}</span>
                            <span className="h-px flex-1" style={{ background: '#DDE6E7' }} />
                        </div>

                        <MicrosoftSignInButton t={t} redirectTo={redirectTo} disabled={loading} />
                    </div>

                    {/* ── Application mobile ── */}
                    {!isNativePlatform() && (
                        <div className="sx-mobile mt-6 w-full max-w-[560px]">
                            <p className="text-center text-[13px]" style={{ color: '#5A6B72' }}>{t.mobileTitle}</p>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-3" role="group" aria-label={t.storeGroupLabel}>
                                <StoreTileAndroid t={t} />
                                <StoreTileIos t={t} />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Pied de page ── */}
                <footer className="sx-footer relative z-10 flex flex-wrap items-center justify-between gap-2 px-6 pb-5 text-[12.5px] sm:px-10" style={{ color: '#5A6B72' }}>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{t.footerCopyright}</span>
                        <span aria-hidden="true" style={{ color: '#C3D0D2' }}>|</span>
                        {/* Concepteur de la plateforme */}
                        <a
                            href={DESIGNER_URL}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="transition-opacity hover:opacity-70"
                            style={{ color: '#0E9E93' }}
                        >
                            {`${t.designedBy} ${DESIGNER_NAME}`}
                        </a>
                    </span>
                    <span className="flex items-center gap-2.5">
                        {/* Aucune page « Confidentialité » n'existe à ce jour :
                            mention affichée sans lien plutôt qu'un lien mort. */}
                        <span>{t.footerPrivacy}</span>
                        <span aria-hidden="true" style={{ color: '#C3D0D2' }}>|</span>
                        <a href="/#demo" className="transition-opacity hover:opacity-70" style={{ color: '#5A6B72' }}>{t.footerSupport}</a>
                    </span>
                </footer>

                {/* ═══ Modale MFA SafeX — en-tête de marque + QR d'enrôlement ═══ */}
                <Modal
                    opened={mfaMode !== null}
                    /* Echappable — SAUF pendant l'affichage unique des codes de
                       recuperation : les fermer sans les avoir enregistres les
                       perdrait definitivement. */
                    onClose={() => { if (mfaMode !== 'recoveryCodes') cancelMfa(); }}
                    closeOnClickOutside={false}
                    closeOnEscape={mfaMode !== 'recoveryCodes'}
                    withCloseButton={false}
                    centered
                    radius="lg"
                    size="md"
                    padding={0}
                    overlayProps={{ backgroundOpacity: 0.65, blur: 6 }}
                    styles={{ body: { padding: 0 } }}
                >
                    {/* En-tête de marque : VRAI logo SafeX (bouclier dégradé
                        teal→rouge + wordmark Safe[X]360), l'identité unifiée de
                        la plateforme — plus aucune fenêtre générique. Bouton de
                        fermeture réintégré ici (sauf sur l'écran des codes de
                        récupération). */}
                    <div className="relative flex items-center gap-3 px-6 py-4 bg-[#0a1f1d] text-white rounded-t-[14px]">
                        <SafeXLogoColor variant="full" tone="light" size={34} />
                        <span className="hidden sm:block h-8 w-px bg-white/15" aria-hidden="true" />
                        <p className="hidden sm:block text-[11px] tracking-[0.16em] uppercase text-white/60">
                            {mfaMode === 'firstLoginPassword'
                                ? (language === 'fr' ? 'Sécurisation du compte' : 'Account security')
                                : (language === 'fr' ? 'Vérification multifacteur' : 'Multi-factor verification')}
                        </p>
                        {mfaMode !== 'recoveryCodes' && (
                            <button
                                type="button"
                                onClick={cancelMfa}
                                aria-label={language === 'fr' ? 'Fermer' : 'Close'}
                                className="absolute top-3 right-3 w-7 h-7 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
                            >
                                <IconX size={16} stroke={2} />
                            </button>
                        )}
                    </div>

                    <div className="px-6 py-5">
                    {mfaMode === 'firstLoginPassword' && (
                        <div className="space-y-3 text-sm text-slate-800">
                            <p className="text-slate-600 leading-relaxed">
                                {language === 'fr'
                                    ? 'Première connexion : définissez votre nouveau mot de passe personnel. Vous serez ensuite invité à activer la double authentification si votre rôle l’exige.'
                                    : 'First sign-in: set your new personal password. You will then be asked to enable two-factor authentication if your role requires it.'}
                            </p>
                            <PasswordInput
                                label={language === 'fr' ? 'Nouveau mot de passe' : 'New password'}
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.currentTarget.value)}
                                autoComplete="new-password"
                            />
                            <PasswordInput
                                label={language === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password'}
                                value={confirmPwd}
                                onChange={(e) => setConfirmPwd(e.currentTarget.value)}
                                autoComplete="new-password"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleFirstLoginPassword(); }}
                            />
                            <p className="text-xs text-slate-500">
                                {language === 'fr'
                                    ? '10 caractères min. · majuscule · minuscule · chiffre · caractère spécial'
                                    : 'Min 10 chars · uppercase · lowercase · digit · special'}
                            </p>
                            {pwdError && <p role="alert" className="text-red-700">{pwdError}</p>}
                            <Button
                                fullWidth
                                loading={loading}
                                onClick={handleFirstLoginPassword}
                                disabled={!newPwd.trim() || !confirmPwd.trim()}
                            >
                                {language === 'fr' ? 'Valider et continuer' : 'Confirm and continue'}
                            </Button>
                        </div>
                    )}
                    {mfaMode === 'enroll' && mfaEnrollment && (
                        <div className="space-y-5 text-sm text-slate-800">
                            <p className="text-slate-600 leading-relaxed">
                                {language === 'fr'
                                    ? 'Ce rôle sensible exige un second facteur. Scannez ce QR code avec Microsoft Authenticator (ou une application TOTP) pour ajouter votre compte SafeX 360.'
                                    : 'This sensitive role requires a second factor. Scan this QR code with Microsoft Authenticator (or any TOTP app) to add your SafeX 360 account.'}
                            </p>

                            {/* Étape 1 — le QR, élément principal */}
                            <div className="flex flex-col items-center gap-3">
                                <OtpQrCode
                                    value={mfaEnrollment.otpAuthUri}
                                    size={208}
                                    ariaLabel={language === 'fr'
                                        ? 'QR code d’enrôlement à scanner avec votre application d’authentification'
                                        : 'Enrollment QR code to scan with your authenticator app'}
                                />
                                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                                    <IconDeviceMobile size={14} stroke={1.8} />
                                    <span>
                                        {language === 'fr'
                                            ? 'Microsoft Authenticator → « + » → Compte professionnel → Scanner un code QR'
                                            : 'Microsoft Authenticator → “+” → Work account → Scan a QR code'}
                                    </span>
                                </div>
                            </div>

                            {/* Repli — saisie manuelle de la clé, replié par défaut */}
                            <div className="border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowManualKey((v) => !v)}
                                    className="inline-flex items-center gap-1.5 text-[12.5px] text-teal-700 hover:text-teal-900 font-medium"
                                >
                                    <IconKey size={14} stroke={1.8} />
                                    {language === 'fr'
                                        ? 'Impossible de scanner ? Saisir la clé manuellement'
                                        : 'Can’t scan? Enter the key manually'}
                                </button>
                                {showManualKey && (
                                    <div className="mt-2 flex items-stretch gap-2">
                                        <code
                                            className="flex-1 rounded-md bg-slate-100 px-3 py-2 font-mono text-[12.5px] text-slate-700 break-all leading-relaxed select-all cursor-text"
                                            style={{ userSelect: 'all' }}
                                            onClick={(e) => {
                                                // Sélectionne toute la clé au clic — l'utilisateur
                                                // peut copier au clavier même si le bouton échoue.
                                                const sel = window.getSelection();
                                                if (sel) { sel.removeAllRanges(); const r = document.createRange(); r.selectNodeContents(e.currentTarget); sel.addRange(r); }
                                            }}
                                            aria-label={language === 'fr' ? 'Clé MFA manuelle' : 'Manual MFA key'}
                                        >
                                            {mfaEnrollment.manualKey}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => copyManualKey(mfaEnrollment.manualKey)}
                                            title={language === 'fr' ? 'Copier la clé' : 'Copy the key'}
                                            aria-label={language === 'fr' ? 'Copier la clé' : 'Copy the key'}
                                            className="flex-shrink-0 inline-flex items-center justify-center w-10 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                                        >
                                            {keyCopied ? <IconCheck size={16} className="text-emerald-600" /> : <IconCopy size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Étape 2 — le code à 6 chiffres */}
                            <div>
                                <TextInput
                                    label={language === 'fr'
                                        ? 'Code à 6 chiffres affiché par l’application'
                                        : '6-digit code shown by the app'}
                                    placeholder="000000"
                                    value={mfaCode}
                                    onChange={(event) => setMfaCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    size="md"
                                    styles={{ input: { letterSpacing: '0.3em', fontFamily: 'monospace', textAlign: 'center', fontSize: 18 } }}
                                />
                                {mfaError && <p role="alert" className="text-red-700 text-[12.5px] mt-1.5">{mfaError}</p>}
                            </div>

                            <Button fullWidth size="md" color="teal" loading={loading} onClick={handleMfaEnrollment} disabled={mfaCode.length !== 6}>
                                {language === 'fr' ? 'Activer la double authentification' : 'Enable two-factor authentication'}
                            </Button>
                        </div>
                    )}

                    {mfaMode === 'verify' && (
                        <div className="space-y-4 text-sm text-slate-800">
                            <p>{useRecoveryCode
                                ? (language === 'fr' ? 'Saisissez un code de récupération non encore utilisé.' : 'Enter an unused recovery code.')
                                : (language === 'fr' ? 'Saisissez le code à six chiffres de votre application TOTP.' : 'Enter the six-digit code from your TOTP app.')}</p>
                            <TextInput
                                label={useRecoveryCode
                                    ? (language === 'fr' ? 'Code de récupération' : 'Recovery code')
                                    : (language === 'fr' ? 'Code de vérification' : 'Verification code')}
                                value={mfaCode}
                                onChange={(event) => setMfaCode(useRecoveryCode
                                    ? event.currentTarget.value.toUpperCase().slice(0, 20)
                                    : event.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode={useRecoveryCode ? 'text' : 'numeric'}
                                autoComplete="one-time-code"
                            />
                            <button
                                type="button"
                                className="text-teal-700 underline"
                                onClick={() => { setUseRecoveryCode(!useRecoveryCode); setMfaCode(''); setMfaError(''); }}
                            >
                                {useRecoveryCode
                                    ? (language === 'fr' ? 'Utiliser l’application TOTP' : 'Use the TOTP app')
                                    : (language === 'fr' ? 'Utiliser un code de récupération' : 'Use a recovery code')}
                            </button>
                            {mfaError && <p role="alert" className="text-red-700">{mfaError}</p>}
                            {/* Le defi expire cote serveur : l'utilisateur doit le VOIR
                                venir, pas le decouvrir par un echec sec. */}
                            {mfaDeadline !== null && mfaRemaining > 0 && (
                                <p className={`text-xs tabular-nums ${mfaRemaining <= 60 ? 'text-amber-700' : 'text-slate-500'}`}>
                                    {language === 'fr'
                                        ? `Défi valable encore ${Math.floor(mfaRemaining / 60)}:${String(mfaRemaining % 60).padStart(2, '0')}`
                                        : `Challenge valid for ${Math.floor(mfaRemaining / 60)}:${String(mfaRemaining % 60).padStart(2, '0')}`}
                                </p>
                            )}
                            {mfaDeadline !== null && mfaRemaining <= 0 ? (
                                <div className="space-y-2">
                                    <p role="alert" className="text-amber-800">
                                        {language === 'fr'
                                            ? 'Défi expiré. Reconnectez-vous pour en obtenir un nouveau.'
                                            : 'Challenge expired. Sign in again to get a new one.'}
                                    </p>
                                    <Button fullWidth variant="default" onClick={cancelMfa}>
                                        {language === 'fr' ? 'Revenir à la connexion' : 'Back to sign in'}
                                    </Button>
                                </div>
                            ) : (
                                <Button fullWidth loading={loading} onClick={handleMfaVerification} disabled={!mfaCode.trim()}>
                                    {language === 'fr' ? 'Vérifier et se connecter' : 'Verify and sign in'}
                                </Button>
                            )}
                        </div>
                    )}

                    {mfaMode === 'recoveryCodes' && (
                        <div className="space-y-4 text-sm text-slate-800">
                            <p className="font-semibold">{language === 'fr'
                                ? 'Conservez ces codes hors ligne. Chacun ne fonctionne qu’une fois et ne sera plus affiché.'
                                : 'Store these codes offline. Each works once and will not be shown again.'}</p>
                            <ul className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-3 font-mono" aria-label={language === 'fr' ? 'Codes de récupération' : 'Recovery codes'}>
                                {mfaRecoveryCodes.map((code) => <li key={code}>{code}</li>)}
                            </ul>
                            <Button fullWidth onClick={() => {
                                setMfaMode(null);
                                setMfaRecoveryCodes([]);
                                setMfaCode('');
                                form.setFieldValue('password', '');
                            }}>
                                {language === 'fr' ? 'J’ai conservé les codes — me reconnecter' : 'I saved the codes — sign in again'}
                            </Button>
                        </div>
                    )}
                    </div>
                </Modal>

                <Modal
                    opened={errorKind !== null && errorKind !== 'waking'}
                    onClose={() => { setErrorKind(null); setServerDetail(''); }}
                    centered
                    withCloseButton={false}
                    radius="lg"
                    size="sm"
                    overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
                    styles={{
                        content: {
                            backgroundColor: '#0a1f1d',
                            border: 'none',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(20,184,166,0.08)',
                        },
                        body: { padding: 0 },
                    }}
                >
                    <div className="flex flex-col items-center text-center px-6 py-7">
                        {/* Logo officiel SafeX 360 — identique à la page de login */}
                        <div style={{ filter: 'drop-shadow(0 6px 20px rgba(20,184,166,0.45))' }}>
                            <svg
                                width="48" height="48"
                                viewBox="0 0 64 64"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-label="SafeX 360"
                            >
                                <defs>
                                    <linearGradient id="popupShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#5EEAD4" />
                                        <stop offset="55%" stopColor="#14B8A6" />
                                        <stop offset="100%" stopColor="#EF4444" />
                                    </linearGradient>
                                    <linearGradient id="popupShieldHL" x1="0%" y1="0%" x2="0%" y2="60%">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#popupShieldGrad)"
                                    stroke="rgba(255,255,255,0.35)"
                                    strokeWidth="0.8"
                                />
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#popupShieldHL)"
                                />
                                <path
                                    d="M 20 31 L 29 40 L 45 21"
                                    stroke="white" strokeWidth="5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </div>
                        {/* Wordmark SafeX 360 */}
                        <div className="flex items-baseline gap-0.5 mt-2" style={{ userSelect: 'none' }}>
                            <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Safe</span>
                            <span style={{ color: '#5EEAD4', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>X</span>
                            <span style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600, marginLeft: '3px' }}>360</span>
                        </div>

                        <h3
                            style={{ color: '#ffffff', fontSize: '17px', fontWeight: 600, marginTop: '14px', letterSpacing: '-0.01em' }}
                        >
                            {errorKind === 'rateLimit' ? t.popupTitleBlocked
                                : (errorKind === 'server' || errorKind === 'network') ? t.popupTitleTechnical
                                : t.popupTitleError}
                        </h3>

                        <p
                            style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13.5px', maxWidth: '300px', marginTop: '12px', lineHeight: '1.6' }}
                        >
                            {/* UN SEUL nœud texte (concat ternaire) : des nœuds texte
                                frères mis à jour après le montage font planter
                                insertBefore sous Google Translate. */}
                            {errorKind === 'credentials' ? t.popupCredentials
                                : errorKind === 'rateLimit' ? t.popupRateLimit
                                    : errorKind === 'network' ? t.popupNetwork
                                        : errorKind === 'server' ? t.popupServer
                                            : errorKind === 'invitationExpired' ? t.popupInvitationExpired
                                                : ''}
                        </p>
                        {serverDetail && (
                            <p
                                translate="no"
                                style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', maxWidth: '300px', marginTop: '6px', fontFamily: 'monospace' }}
                            >
                                {serverDetail}
                            </p>
                        )}

                        <Button
                            onClick={() => { setErrorKind(null); setServerDetail(''); }}
                            size="md"
                            radius="md"
                            mt={24}
                            styles={{
                                root: {
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    border: 'none',
                                    height: '40px',
                                    fontSize: '13.5px',
                                    fontWeight: 500,
                                    paddingLeft: '32px',
                                    paddingRight: '32px',
                                    boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                                },
                            }}
                            className="hover:brightness-110 transition-all"
                        >
                            {t.popupClose}
                        </Button>
                    </div>
                </Modal>

                {/* Popup immersif : réveil serveur avec étapes progressives */}
                <Modal
                    opened={errorKind === 'waking'}
                    onClose={() => {}}
                    centered
                    withCloseButton={false}
                    closeOnClickOutside={false}
                    closeOnEscape={false}
                    radius="lg"
                    size="sm"
                    overlayProps={{ backgroundOpacity: 0.6, blur: 8 }}
                    styles={{
                        content: {
                            backgroundColor: '#0a1f1d',
                            border: 'none',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(20,184,166,0.08)',
                        },
                        body: { padding: 0 },
                    }}
                >
                    <div className="flex flex-col items-center text-center px-6 py-7">
                        {/* Logo SafeX 360 animé */}
                        <div className="animate-pulse">
                            <svg
                                width="44" height="44"
                                viewBox="0 0 64 64"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-label="SafeX 360"
                            >
                                <defs>
                                    <linearGradient id="wakingShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#5EEAD4" />
                                        <stop offset="55%" stopColor="#14B8A6" />
                                        <stop offset="100%" stopColor="#EF4444" />
                                    </linearGradient>
                                    <linearGradient id="wakingShieldHL" x1="0%" y1="0%" x2="0%" y2="60%">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#wakingShieldGrad)"
                                    stroke="rgba(255,255,255,0.35)"
                                    strokeWidth="0.8"
                                />
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#wakingShieldHL)"
                                />
                                <path
                                    d="M 20 31 L 29 40 L 45 21"
                                    stroke="white" strokeWidth="5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-0.5 mt-2" style={{ userSelect: 'none' }}>
                            <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>Safe</span>
                            <span style={{ color: '#5EEAD4', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>X</span>
                            <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600, marginLeft: '3px' }}>360</span>
                        </div>

                        <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, marginTop: '16px' }}>
                            {language === 'fr' ? 'Préparation de votre espace' : 'Preparing your workspace'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12.5px', marginTop: '6px', lineHeight: 1.5 }}>
                            {language === 'fr'
                                ? 'Première connexion du jour — cela prend quelques instants'
                                : 'First connection of the day — this takes a moment'}
                        </p>

                        {/* Étapes avec barres de progression */}
                        <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { fr: 'Connexion aux serveurs SafeX', en: 'Connecting to SafeX servers' },
                                { fr: 'Initialisation des services', en: 'Initializing services' },
                                { fr: 'Chargement des modules de sécurité', en: 'Loading security modules' },
                                { fr: 'Préparation de votre session sécurisée', en: 'Preparing your secure session' },
                            ].map((step, i) => {
                                const isDone = wakingStep > i + 1;
                                const isActive = wakingStep === i + 1;
                                const isPending = wakingStep < i + 1;
                                return (
                                    <div key={i} style={{ textAlign: 'left', opacity: isPending ? 0.35 : 1, transition: 'opacity 0.5s ease' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                background: isDone ? 'linear-gradient(135deg, #14B8A6, #0D9488)' : isActive ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.08)',
                                                border: isActive ? '2px solid #14B8A6' : isDone ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                            }}>
                                                {isDone && (
                                                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                                        <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                                {isActive && <Loader size={10} color="teal" />}
                                            </div>
                                            <span style={{ color: isDone ? '#5EEAD4' : isActive ? '#ffffff' : 'rgba(255,255,255,0.4)', fontSize: '12.5px', fontWeight: isActive ? 500 : 400 }}>
                                                {language === 'fr' ? step.fr : step.en}
                                            </span>
                                        </div>
                                        {(isActive || isDone) && (
                                            <div style={{ marginLeft: '26px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '2px',
                                                    background: 'linear-gradient(90deg, #14B8A6, #5EEAD4)',
                                                    width: isDone ? '100%' : '70%',
                                                    transition: 'width 4s ease-out',
                                                    animation: isActive ? 'none' : 'none',
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Barre de progression globale */}
                        <div style={{ width: '100%', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                                    {language === 'fr' ? 'Progression globale' : 'Overall progress'}
                                </span>
                                <span style={{ color: '#5EEAD4', fontSize: '11px', fontWeight: 500 }}>
                                    {Math.min(Math.round((wakingStep / 4) * 100), 100)}%
                                </span>
                            </div>
                            <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: '3px',
                                    background: 'linear-gradient(90deg, #0D9488, #14B8A6, #5EEAD4)',
                                    width: `${Math.min((wakingStep / 4) * 100, 100)}%`,
                                    transition: 'width 1s ease-out',
                                    boxShadow: '0 0 12px rgba(20,184,166,0.4)',
                                }} />
                            </div>
                        </div>
                    </div>
                </Modal>

            </div>
        </div>
    );
};

export default LoginsPage;
