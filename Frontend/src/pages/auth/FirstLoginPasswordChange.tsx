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
import { successNotification, errorNotification } from '../../utility/NotificationUtility';

const STRENGTH_LABELS = ['', 'Tres faible', 'Faible', 'Correct', 'Fort'];
const STRENGTH_COLORS = ['gray', 'red', 'orange', 'yellow', 'teal'];

export default function FirstLoginPasswordChange() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [userName, setUserName] = useState<string>('');

    // Charge le nom au montage pour l'afficher
    useMemo(() => {
        getMyProfile().then((p) => setUserName(p.name || p.login)).catch(() => { });
    }, []);

    const form = useForm({
        initialValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            oldPassword: (v) => (v.length === 0 ? 'Le mot de passe temporaire est requis' : null),
            newPassword: (v) => validatePassword(v),
            confirmPassword: (v, values) => (v !== values.newPassword ? 'Les mots de passe ne correspondent pas' : null),
        },
        validateInputOnBlur: true,
    });

    const score = passwordStrengthScore(form.values.newPassword);
    const strengthLabel = STRENGTH_LABELS[score] || '';
    const strengthColor = STRENGTH_COLORS[score];

    const checks = [
        { ok: form.values.newPassword.length >= 10, label: 'Au moins 10 caracteres' },
        { ok: /[A-Z]/.test(form.values.newPassword), label: 'Au moins une majuscule (A-Z)' },
        { ok: /[a-z]/.test(form.values.newPassword), label: 'Au moins une minuscule (a-z)' },
        { ok: /[0-9]/.test(form.values.newPassword), label: 'Au moins un chiffre (0-9)' },
        { ok: /[^A-Za-z0-9]/.test(form.values.newPassword), label: 'Au moins un caractere special (!@#$%...)' },
        { ok: form.values.newPassword !== form.values.oldPassword && form.values.newPassword.length > 0, label: 'Different du mot de passe actuel' },
    ];
    const allOk = checks.every((c) => c.ok);

    const handleSubmit = async (values: typeof form.values) => {
        if (!allOk) {
            errorNotification('Le mot de passe ne respecte pas tous les criteres');
            return;
        }
        setSubmitting(true);
        try {
            await changePasswordFirst(values.oldPassword, values.newPassword);
            successNotification('Mot de passe change avec succes — Bienvenue !');
            // Petit delai pour que la notif s'affiche avant la redirection
            setTimeout(() => navigate('/home'), 600);
        } catch (e: any) {
            const code = e?.response?.data?.error;
            const message = e?.response?.data?.message;
            if (code === 'OLD_PASSWORD_INVALID') {
                form.setFieldError('oldPassword', 'Mot de passe temporaire incorrect');
            } else {
                errorNotification(message || 'Erreur lors du changement de mot de passe');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        // On nettoie le cookie côté serveur via /hrms/auth/logout
        fetch('/hrms/auth/logout', { credentials: 'include' }).finally(() => {
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
                            Definissez votre mot de passe
                        </Title>
                        <Text size="sm" c="dimmed" ta="center">
                            {userName ? `Bienvenue ${userName}, ` : ''}
                            pour proteger votre compte, vous devez changer votre mot de passe temporaire avant de continuer.
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
                            Cette etape est <strong>obligatoire</strong>. Votre nouveau mot de passe doit respecter
                            la politique de securite affichee ci-dessous. Vous ne pourrez pas acceder aux applications
                            tant que cette etape n'est pas validee.
                        </Text>
                    </Alert>

                    {/* Formulaire */}
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <PasswordInput
                                label="Mot de passe temporaire (recu par email)"
                                placeholder="Votre mot de passe actuel"
                                leftSection={<IconLock size={16} />}
                                {...form.getInputProps('oldPassword')}
                                disabled={submitting}
                                required
                            />

                            <div>
                                <PasswordInput
                                    label="Nouveau mot de passe"
                                    placeholder="Choisissez un mot de passe fort"
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
                                label="Confirmer le nouveau mot de passe"
                                placeholder="Retapez votre nouveau mot de passe"
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
                                    Politique de mot de passe
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
                                    Annuler et se deconnecter
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
                                    Valider et continuer
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Stack>
            </Paper>
        </Box>
    );
}
