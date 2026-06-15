import { Avatar, Modal, Button, Menu, Divider, Text, Badge } from '@mantine/core';
import { useAppSelector } from '../../../slices/hooks';
import {
    IconUser,
    IconSettings,
    IconLogout,
    IconHelp,
    IconBell,
    IconLanguage,
    IconShield,
    IconKey,
    IconChevronDown,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import useLogout from '../../../hooks/useLogout';

/**
 * ProfileMenu v2 — Refonte Phase 2.a
 *
 * Avant : Drawer encombrant ouvert depuis la droite (anti-pattern marché HSE)
 * Maintenant : Mantine Menu dropdown sobre, pattern Cority/Sphera/Linear
 *
 * - Avatar circle cliquable (44×44 conforme WCAG)
 * - Dropdown 280px avec header utilisateur + 6 sections + déconnexion
 * - Modal confirmation déconnexion
 */
const ProfileMenu = ({ drawerOpened, setDrawerOpened }: any) => {
    const user: any = useAppSelector((state) => state.user);
    const logoutUser = useLogout();
    const navigate = useNavigate();
    const [opened, { open, close }] = useDisclosure(false);
    const { t, i18n } = useTranslation('navigation');
    const langBase = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0].toLowerCase();
    const langCode = langBase.toUpperCase();
    const langNative = langBase === 'en' ? 'English' : 'Français';

    const handleLogout = () => {
        open();
    };
    const logout = () => {
        logoutUser();
    };

    return (
        <>
            <Menu
                opened={drawerOpened}
                onChange={setDrawerOpened}
                width={280}
                position="bottom-end"
                offset={8}
                shadow="xl"
                radius="md"
                transitionProps={{ transition: 'pop-top-right', duration: 150 }}
            >
                <Menu.Target>
                    <button
                        type="button"
                        className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 px-2 py-1 rounded-lg transition cursor-pointer"
                        aria-label={t('profileMenu.userMenu')}
                    >
                        <Avatar
                            src=""
                            variant="filled"
                            size={32}
                            name={user?.name}
                            alt={user?.name}
                            color="initials"
                            autoContrast
                        />
                        <div className="hidden lg:flex flex-col items-start leading-tight pr-1">
                            <span className="text-xs text-white max-w-[120px] truncate">
                                {user?.name || t('profileMenu.userFallback')}
                            </span>
                            <span className="text-[10px] text-white/70 uppercase tracking-wider">
                                {user?.role || t('profileMenu.roleFallback')}
                            </span>
                        </div>
                        <IconChevronDown size={14} className="text-white/80 hidden lg:block" />
                    </button>
                </Menu.Target>

                <Menu.Dropdown className="!p-0 overflow-hidden">
                    {/* Header utilisateur */}
                    <div className="bg-gradient-to-br from-teal-700 to-emerald-600 px-4 py-3 flex items-center gap-3">
                        <Avatar
                            size={44}
                            name={user?.name}
                            color="initials"
                            autoContrast
                            variant="filled"
                            className="border-2 border-white/40"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                                {user?.name || t('profileMenu.userFallback')}
                            </p>
                            <p className="text-[11px] text-teal-100 truncate">
                                {user?.username || user?.email || t('profileMenu.emailUnavailable')}
                            </p>
                            <Badge size="xs" color="dark" variant="filled" mt={4} radius="sm" className="!bg-white/20 !text-white">
                                {user?.role || t('profileMenu.roleUndefined')}
                            </Badge>
                        </div>
                    </div>

                    {/* Sections */}
                    <Menu.Label>{t('profileMenu.accountSection')}</Menu.Label>
                    <Menu.Item
                        leftSection={<IconUser size={15} />}
                        onClick={() => { setDrawerOpened(false); navigate('/profile?tab=info'); }}
                    >
                        {t('profileMenu.myProfile')}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconSettings size={15} />}
                        onClick={() => { setDrawerOpened(false); navigate('/profile?tab=preferences'); }}
                    >
                        {t('profileMenu.preferences')}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconKey size={15} />}
                        onClick={() => { setDrawerOpened(false); navigate('/profile?tab=security'); }}
                    >
                        {t('profileMenu.passwordSecurity')}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconBell size={15} />}
                        onClick={() => { setDrawerOpened(false); navigate('/profile?tab=notifications'); }}
                    >
                        {t('profileMenu.notificationPrefs')}
                    </Menu.Item>

                    <Divider />

                    <Menu.Label>{t('profileMenu.systemSection')}</Menu.Label>
                    <Menu.Item
                        leftSection={<IconLanguage size={15} />}
                        rightSection={<Text size="xs" c="dimmed">{langCode}</Text>}
                        onClick={() => { setDrawerOpened(false); navigate('/profile?tab=preferences'); }}
                    >
                        {t('profileMenu.language', { lang: langNative })}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconShield size={15} />}
                        rightSection={<Badge size="xs" color="teal" variant="light">v2.4</Badge>}
                        onClick={() => { setDrawerOpened(false); navigate('/about'); }}
                    >
                        {t('profileMenu.aboutApp')}
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<IconHelp size={15} />}
                        onClick={() => { setDrawerOpened(false); navigate('/how-to'); }}
                    >
                        {t('profileMenu.helpCenter')}
                    </Menu.Item>

                    <Divider />

                    <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={15} />}
                        onClick={handleLogout}
                    >
                        {t('profileMenu.logout')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>

            <Modal
                opened={opened}
                centered
                onClose={close}
                radius="md"
                title={<span className="text-base">{t('profileMenu.logoutConfirmTitle')}</span>}
            >
                <Text size="sm" c="dimmed" mb="md">
                    {t('profileMenu.logoutConfirmBody')}
                </Text>
                <div className="flex gap-2 justify-end">
                    <Button variant="default" onClick={close}>{t('profileMenu.cancel')}</Button>
                    <Button color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
                        {t('profileMenu.logout')}
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default ProfileMenu;
