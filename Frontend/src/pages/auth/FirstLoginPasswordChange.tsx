/**
 * FirstLoginPasswordChange — Page BLOQUANTE de changement de mot de passe
 * lors de la premiere connexion.
 *
 * Route : /first-login
 *
 * Comportement :
 *  - Affichee automatiquement par le FirstLoginGuard si /me/profile retourne firstLogin=true
 *  - L'utilisateur ne peut PAS naviguer vers une autre page (pas de sidebar/topbar)
 *  - Seules les actions disponibles : changer le MDP OU se deconnecter
 *  - Apres succes, redirige vers /home
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Paper, PasswordInput, Button, Title, Text, Stack, Progress, Alert, List, Group, Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconLock, IconShieldLock, IconAlertCircle, IconLogout, IconCheck, IconX,
} from '@tabler/icons-react';
import {
    changePasswordFirst, getMyProfile, validatePassword, passwordStrengthScore,
} from '../../services/UserManagementService';
import { logoutUser } from '../../services/LoginService';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';

const STRENGTH_COLORS = ['gray', 'red', 'orange', 'yellow', 'teal'];

export default function FirstLoginPasswordChange() {
    const navigate = useNavigate();
    const { t } = useTranslation('navigation');
    const [submitting, setSubmitting] = useState(false);
    const [userName, setUserName] = useState<string>('');

    // Charge le nom au montage pour l'afficher
    useMemo(() => {
        getMyProfile().then((p) => setUserName(p.name || p.login)).catch((err) => console.error(err));
    }, []);

    const form = useForm({
        initialValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            oldPassword: (v) => (v.length === 0 ? t('userMgmt.firstLogin.oldRequired') : null),
            newPassword: (v) => validatePassword(v),
            confirmPassword: (v, values) => (v !== values.newPassword ? t('userMgmt.firstLogin.mismatch') : null),
        },
        validateInputOnBlur: true,
    });

    const score = passwordStrengthScore(form.values.newPassword);
    const strengthLabel = score > 0 ? t(`userMgmt.firstLogin.strength.${score}`) : '';
    const strengthColor = STRENGTH_COLORS[score];

    const checks = [
        { ok: form.values.newPassword.length >= 10, label: t('userMgmt.firstLogin.checks.minLength') },
        { ok: /[A-Z]/.test(form.values.newPassword), label: t('userMgmt.firstLogin.checks.upper') },
        { ok: /[a-z]/.test(form.values.newPassword), label: t('userMgmt.firstLogin.checks.lower') },
        { ok: /[0-9]/.test(form.values.newPassword), label: t('userMgmt.firstLogin.checks.digit') },
        { ok: /[^A-Za-z0-9]/.test(form.values.newPassword), label: t('userMgmt.firstLogin.checks.special') },
        { ok: form.values.newPassword !== form.values.oldPassword && form.values.newPassword.length > 0, label: t('userMgmt.firstLogin.checks.different') },
    ];
    const allOk = checks.every((c) => c.ok);

    const handleSubmit = async (values: typeof form.values) => {
        if (!allOk) {
            errorNotification(t('userMgmt.firstLogin.errorPolicy'));
            return;
        }
        setSubmitting(true);
        try {
            await changePasswordFirst(values.oldPassword, values.newPassword);
            successNotification(t('userMgmt.firstLogin.successChanged'));
            // Petit delai pour que la notif s'affiche avant la redirection
            // « /home » n'existe pas (page blanche 404) — la racine « / » mène au dashboard.
            setTimeout(() => navigate('/'), 600);
        } catch (e: any) {
            const code = e?.response?.data?.error;
            const message = e?.response?.data?.message;
            if (code === 'OLD_PASSWORD_INVALID') {
                form.setFieldError('oldPassword', t('userMgmt.firstLogin.errorOldInvalid'));
            } else {
                errorNotification(message || t('userMgmt.firstLogin.errorGeneric'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        // logoutUser passe par axiosInstance : indispensable dans l'APK où un
        // fetch relatif partirait vers le serveur local Capacitor (localhost)
        // au lieu du gateway — le cookie ne serait jamais invalidé.
        logoutUser().finally(() => {
            window.location.href = '/login';
        });
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <Paper
                shadow="xl"
                radius="lg"
                p="xl"
                style={{
                    maxWidth: 540,
                    width: '100%',
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Stack gap="lg">
                    {/* Header */}
                    <Stack gap={4} align="center">
                        <Box
                            style={{
                                width: 64, height: 64, borderRadius: 16,
                                background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 12px 28px -8px rgba(15, 118, 110, 0.4)',
                            }}
                        >
                            <IconShieldLock size={32} color="white" stroke={1.8} />
                        </Box>
                        <Title order={2} ta="center" style={{ color: '#0F172A', fontWeight: 600 }}>
                            {t('userMgmt.firstLogin.title')}
                        </Title>
                        {/*
                          Un SEUL nœud texte (pas deux expressions adjacentes) : le nom
                          d'utilisateur arrive de façon asynchrone (getMyProfile) APRÈS le
                          montage. Avec deux nœuds texte frères, cette mise à jour post-montage
                          déclenche un `insertBefore` de réconciliation React qui plante
                          (« NotFoundError ») dès qu'une couche de traduction navigateur
                          (Google Translate) a enveloppé les nœuds dans des <font>. En
                          concaténant en une seule chaîne, React met à jour le texte en place
                          (nodeValue) sans opération sur les frères → robuste. `translate="no"`
                          en ceinture-bretelles sur ce texte dynamique.
                        */}
                        <Text size="sm" c="dimmed" ta="center" translate="no">
                            {userName
                                ? t('userMgmt.firstLogin.welcomeName', { name: userName }) + t('userMgmt.firstLogin.subtitle')
                                : t('userMgmt.firstLogin.subtitle')}
                        </Text>
                    </Stack>

                    {/* Alerte info */}
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="teal"
                        variant="light"
                        styles={{ root: { border: '1px solid #99F6E4' } }}
                    >
                        <Text size="xs">
                            {t('userMgmt.firstLogin.mandatoryNotice')}
                        </Text>
                    </Alert>

                    {/* Formulaire */}
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <PasswordInput
                                label={t('userMgmt.firstLogin.fieldOld')}
                                placeholder={t('userMgmt.firstLogin.fieldOldPlaceholder')}
                                leftSection={<IconLock size={16} />}
                                {...form.getInputProps('oldPassword')}
                                disabled={submitting}
                                required
                            />

                            <div>
                                <PasswordInput
                                    label={t('userMgmt.firstLogin.fieldNew')}
                                    placeholder={t('userMgmt.firstLogin.fieldNewPlaceholder')}
                                    leftSection={<IconLock size={16} />}
                                    {...form.getInputProps('newPassword')}
                                    disabled={submitting}
                                    required
                                />
                                {form.values.newPassword.length > 0 && (
                                    <Group gap="xs" mt={6} align="center">
                                        <Progress
                                            value={(score / 4) * 100}
                                            color={strengthColor}
                                            size="xs"
                                            style={{ flex: 1 }}
                                            animated={score > 0 && score < 4}
                                        />
                                        <Text size="xs" c={strengthColor === 'gray' ? 'dimmed' : strengthColor}>
                                            {strengthLabel}
                                        </Text>
                                    </Group>
                                )}
                            </div>

                            <PasswordInput
                                label={t('userMgmt.firstLogin.fieldConfirm')}
                                placeholder={t('userMgmt.firstLogin.fieldConfirmPlaceholder')}
                                leftSection={<IconLock size={16} />}
                                {...form.getInputProps('confirmPassword')}
                                disabled={submitting}
                                required
                            />

                            {/* Checklist des criteres */}
                            <Paper
                                p="sm"
                                radius="md"
                                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                            >
                                <Text size="xs" fw={600} c="dimmed" mb={6} tt="uppercase">
                                    {t('userMgmt.firstLogin.policyTitle')}
                                </Text>
                                <List spacing={3} size="xs" listStyleType="none">
                                    {checks.map((c, i) => (
                                        <List.Item
                                            key={i}
                                            icon={
                                                c.ok
                                                    ? <IconCheck size={14} color="#0F766E" />
                                                    : <IconX size={14} color="#94A3B8" />
                                            }
                                        >
                                            <Text
                                                size="xs"
                                                c={c.ok ? 'teal' : 'dimmed'}
                                                style={{ textDecoration: c.ok ? 'none' : 'none' }}
                                            >
                                                {c.label}
                                            </Text>
                                        </List.Item>
                                    ))}
                                </List>
                            </Paper>

                            {/* Boutons */}
                            <Group justify="space-between" mt="md">
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<IconLogout size={14} />}
                                    onClick={handleLogout}
                                    disabled={submitting}
                                    size="sm"
                                >
                                    {t('userMgmt.firstLogin.logout')}
                                </Button>
                                <Button
                                    type="submit"
                                    loading={submitting}
                                    disabled={!allOk || submitting}
                                    styles={{
                                        root: {
                                            background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                            fontWeight: 600,
                                            boxShadow: '0 8px 16px -4px rgba(15,118,110,0.4)',
                                        },
                                    }}
                                    size="sm"
                                >
                                    {t('userMgmt.firstLogin.submit')}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Stack>
            </Paper>
        </Box>
    );
}
