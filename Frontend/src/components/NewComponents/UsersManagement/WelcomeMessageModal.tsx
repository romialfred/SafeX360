/**
 * WelcomeMessageModal — Modale « Message de bienvenue » premium.
 *
 * Affichee automatiquement APRES une creation d'utilisateur reussie (CreateUserWizard).
 * Presente, en charte teal SafeX 360 :
 *  - Salutation au nom de l'utilisateur + message de bienvenue professionnel.
 *  - Bloc identifiants (Login + Mot de passe temporaire) avec bouton copier le MDP seul.
 *  - Lien de connexion prod + consigne « changer le MDP sous 24h ».
 *  - Bouton « Copier le message pour Outlook » : copie un HTML riche AUTOPORTEUR
 *    (styles inline, table layout compatible Outlook, logo en <img> URL absolue)
 *    via navigator.clipboard.write([ClipboardItem]) avec fallback execCommand.
 *
 * i18n : useTranslation('navigation'), cles sous t('userMgmt.*').
 */

import { useMemo } from 'react';
import {
    Modal, Stack, Group, Text, Paper, Box, Button, CopyButton, Divider, Anchor, ThemeIcon,
} from '@mantine/core';
import {
    IconCircleCheck, IconCopy, IconCheck, IconClock, IconExternalLink, IconKey, IconUser,
    IconMail,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTES PROD
// ─────────────────────────────────────────────────────────────────────────

/** URL de connexion en production. */
export const LOGIN_URL = 'https://safex360.data-univers.com';
/** Logo SafeX en URL ABSOLUE prod (s'affiche au collage dans Outlook). */
export const LOGO_URL = 'https://safex360.data-univers.com/safex-logo.png';

// Palette teal SafeX
const TEAL = '#0F766E';
const TEAL_DARK = '#047857';
const TEAL_BG = '#F0FDFA';
const TEAL_BORDER = '#99F6E4';

interface Props {
    opened: boolean;
    onClose: () => void;
    /** Nom complet de l'utilisateur (affichage + salutation). */
    name: string;
    /** Login de connexion. */
    login: string;
    /** Mot de passe temporaire en clair (toujours present pour les comptes LOCAL). */
    temporaryPassword: string | null;
    /** Email (optionnel — affiche dans le bloc identifiants). */
    email?: string;
}

export default function WelcomeMessageModal({
    opened, onClose, name, login, temporaryPassword, email,
}: Props) {
    const { t } = useTranslation('navigation');

    // ─────────────────────────────────────────────────────────────────────
    // GENERATION DU MESSAGE (HTML riche + texte brut), memoise
    // ─────────────────────────────────────────────────────────────────────

    const pwd = temporaryPassword || '';

    const buildEmailHtml = useMemo(() => () => {
        // Pre-traduit toutes les chaines (le HTML est autoporteur).
        const subject = t('userMgmt.welcome.emailSubject');
        const hello = t('userMgmt.welcome.hello', { name });
        const intro = t('userMgmt.welcome.intro');
        const credsTitle = t('userMgmt.welcome.credentialsTitle');
        const loginLabel = t('userMgmt.welcome.loginLabel');
        const pwdLabel = t('userMgmt.welcome.passwordLabel');
        const ctaLabel = t('userMgmt.welcome.ctaConnect');
        const expiry = t('userMgmt.welcome.expiryNotice');
        const help = t('userMgmt.welcome.helpNote');
        const signature = t('userMgmt.welcome.signature');
        const teamName = t('userMgmt.welcome.teamName');

        // HTML autoporteur : table layout + styles inline (compatible Outlook/Word).
        return `<!--[if mso]><style>table{border-collapse:collapse}</style><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;border-collapse:collapse;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="background:linear-gradient(135deg,${TEAL} 0%,${TEAL_DARK} 100%);background-color:${TEAL};padding:24px 32px;">
      <img src="${LOGO_URL}" alt="SafeX 360" width="200" style="display:block;height:auto;max-width:200px;border:0;outline:none;text-decoration:none;" />
    </td>
  </tr>
  <tr>
    <td style="padding:32px 32px 8px 32px;">
      <h1 style="margin:0 0 4px 0;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;">${hello}</h1>
      <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#334155;">${intro}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:${TEAL_BG};border:1px solid ${TEAL_BORDER};border-radius:10px;">
        <tr>
          <td style="padding:18px 22px;">
            <p style="margin:0 0 14px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:${TEAL};">${credsTitle}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#475569;width:160px;">${loginLabel}</td>
                <td style="padding:6px 0;font-size:15px;font-weight:700;color:#0f172a;font-family:Consolas,Courier New,monospace;">${login}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#475569;width:160px;">${pwdLabel}</td>
                <td style="padding:6px 0;font-size:15px;font-weight:700;color:#0f172a;font-family:Consolas,Courier New,monospace;letter-spacing:.04em;">${pwd}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 4px 32px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="border-radius:8px;background:${TEAL};background-color:${TEAL};">
            <a href="${LOGIN_URL}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaLabel}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 32px 0 32px;" align="center">
      <p style="margin:0;font-size:13px;color:#64748b;">${LOGIN_URL}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
        <tr>
          <td style="padding:14px 18px;font-size:13px;line-height:1.5;color:#9a3412;">⏱ ${expiry}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:18px 32px 0 32px;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">${help}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 28px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:14px 0 0 0;font-size:14px;color:#334155;">${signature}</p>
      <p style="margin:2px 0 0 0;font-size:14px;font-weight:700;color:${TEAL};">${teamName}</p>
    </td>
  </tr>
</table>`.trim();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, login, pwd, t]);

    const buildEmailText = useMemo(() => () => {
        const lines = [
            t('userMgmt.welcome.hello', { name }),
            '',
            t('userMgmt.welcome.intro'),
            '',
            t('userMgmt.welcome.credentialsTitle'),
            `${t('userMgmt.welcome.loginLabel')} ${login}`,
            `${t('userMgmt.welcome.passwordLabel')} ${pwd}`,
            '',
            `${t('userMgmt.welcome.ctaConnect')} : ${LOGIN_URL}`,
            '',
            t('userMgmt.welcome.expiryNotice'),
            '',
            t('userMgmt.welcome.helpNote'),
            '',
            t('userMgmt.welcome.signature'),
            t('userMgmt.welcome.teamName'),
        ];
        return lines.join('\n');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, login, pwd, t]);

    // ─────────────────────────────────────────────────────────────────────
    // COPIE RICHE OUTLOOK
    // ─────────────────────────────────────────────────────────────────────

    const copyForOutlook = async () => {
        const html = buildEmailHtml();
        const text = buildEmailText();

        // 1) API moderne : ClipboardItem avec text/html + text/plain.
        //    Le collage dans Outlook/Word conserve alors la mise en forme HTML.
        try {
            if (
                typeof ClipboardItem !== 'undefined' &&
                navigator.clipboard &&
                typeof navigator.clipboard.write === 'function'
            ) {
                const item = new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([text], { type: 'text/plain' }),
                });
                await navigator.clipboard.write([item]);
                successNotification(t('userMgmt.welcome.copiedRich'));
                return;
            }
        } catch {
            // tombe sur le fallback ci-dessous
        }

        // 2) Fallback : selectionne un noeud HTML hors-ecran puis document.execCommand('copy').
        //    Copie egalement le HTML mis en forme (la selection porte du rich text).
        try {
            const container = document.createElement('div');
            container.setAttribute('contenteditable', 'true');
            container.style.position = 'fixed';
            container.style.left = '-99999px';
            container.style.top = '0';
            container.style.opacity = '0';
            container.innerHTML = html;
            document.body.appendChild(container);

            const range = document.createRange();
            range.selectNodeContents(container);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            const ok = document.execCommand('copy');
            selection?.removeAllRanges();
            document.body.removeChild(container);

            if (ok) {
                successNotification(t('userMgmt.welcome.copiedRich'));
                return;
            }
            throw new Error('execCommand copy returned false');
        } catch {
            errorNotification(t('userMgmt.welcome.copyError'));
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // RENDU
    // ─────────────────────────────────────────────────────────────────────

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="lg"
            centered
            withCloseButton={false}
            radius="lg"
            padding={0}
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            styles={{ content: { overflow: 'hidden' } }}
        >
            {/* En-tete premium teal + logo */}
            <Box
                style={{
                    background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                    padding: '24px 28px',
                }}
            >
                <Group justify="space-between" align="center" wrap="nowrap">
                    <img
                        src="/safex-logo.png"
                        alt="SafeX 360"
                        style={{ height: 34, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
                    />
                    <ThemeIcon size={40} radius="xl" variant="white" color="teal">
                        <IconCircleCheck size={26} stroke={2} />
                    </ThemeIcon>
                </Group>
            </Box>

            <Box p="xl">
                <Stack gap="md">
                    {/* Salutation + message */}
                    <div>
                        <Text fw={700} size="xl" c="#0f172a">
                            {t('userMgmt.welcome.hello', { name })}
                        </Text>
                        <Text size="sm" c="dimmed" mt={6} style={{ lineHeight: 1.6 }}>
                            {t('userMgmt.welcome.intro')}
                        </Text>
                    </div>

                    {/* Bloc identifiants */}
                    <Paper
                        p="md"
                        radius="md"
                        style={{ background: TEAL_BG, border: `1px solid ${TEAL_BORDER}` }}
                    >
                        <Text
                            size="xs"
                            fw={700}
                            tt="uppercase"
                            c={TEAL}
                            mb={10}
                            style={{ letterSpacing: '0.06em' }}
                        >
                            {t('userMgmt.welcome.credentialsTitle')}
                        </Text>
                        <Stack gap={8}>
                            <Group gap={10} wrap="nowrap">
                                <ThemeIcon size={28} radius="md" variant="light" color="teal">
                                    <IconUser size={16} />
                                </ThemeIcon>
                                <Box>
                                    <Text size="xs" c="dimmed">{t('userMgmt.welcome.loginLabel')}</Text>
                                    <Text size="sm" fw={700} ff="monospace" c="#0f172a">{login}</Text>
                                </Box>
                            </Group>

                            {email && (
                                <Group gap={10} wrap="nowrap">
                                    <ThemeIcon size={28} radius="md" variant="light" color="teal">
                                        <IconMail size={16} />
                                    </ThemeIcon>
                                    <Box>
                                        <Text size="xs" c="dimmed">{t('userMgmt.welcome.emailLabel')}</Text>
                                        <Text size="sm" fw={600} c="#0f172a">{email}</Text>
                                    </Box>
                                </Group>
                            )}

                            <Group gap={10} wrap="nowrap" align="center">
                                <ThemeIcon size={28} radius="md" variant="light" color="orange">
                                    <IconKey size={16} />
                                </ThemeIcon>
                                <Box style={{ flex: 1 }}>
                                    <Text size="xs" c="dimmed">{t('userMgmt.welcome.passwordLabel')}</Text>
                                    <Text size="sm" fw={700} ff="monospace" c="#0f172a" style={{ letterSpacing: '0.04em' }}>
                                        {pwd || '—'}
                                    </Text>
                                </Box>
                                {pwd && (
                                    <CopyButton value={pwd}>
                                        {({ copied, copy }) => (
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color={copied ? 'teal' : 'gray'}
                                                leftSection={copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                                                onClick={() => {
                                                    copy();
                                                    successNotification(t('userMgmt.welcome.passwordCopied'));
                                                }}
                                            >
                                                {copied ? t('userMgmt.welcome.copied') : t('userMgmt.welcome.copyPassword')}
                                            </Button>
                                        )}
                                    </CopyButton>
                                )}
                            </Group>
                        </Stack>
                    </Paper>

                    {/* Lien de connexion + consigne 24h */}
                    <Paper p="sm" radius="md" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                        <Group gap={8} wrap="nowrap" align="flex-start">
                            <ThemeIcon size={26} radius="md" variant="light" color="orange">
                                <IconClock size={15} />
                            </ThemeIcon>
                            <Text size="xs" c="#9A3412" style={{ lineHeight: 1.5 }}>
                                {t('userMgmt.welcome.expiryNotice')}
                            </Text>
                        </Group>
                        <Group gap={6} mt={8} wrap="nowrap" align="center">
                            <IconExternalLink size={14} color={TEAL} />
                            <Anchor href={LOGIN_URL} target="_blank" size="sm" fw={600} c={TEAL}>
                                {LOGIN_URL}
                            </Anchor>
                        </Group>
                    </Paper>

                    <Divider />

                    {/* Actions */}
                    <Group justify="space-between">
                        <Button variant="subtle" color="gray" onClick={onClose}>
                            {t('userMgmt.welcome.close')}
                        </Button>
                        <Button
                            onClick={copyForOutlook}
                            leftSection={<IconMail size={16} />}
                            styles={{
                                root: {
                                    background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                                    fontWeight: 600,
                                },
                            }}
                        >
                            {t('userMgmt.welcome.copyForOutlook')}
                        </Button>
                    </Group>
                </Stack>
            </Box>
        </Modal>
    );
}
