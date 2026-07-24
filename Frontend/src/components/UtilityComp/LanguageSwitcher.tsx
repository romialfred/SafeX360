import { useTranslation } from 'react-i18next';
import { Menu } from '@mantine/core';
import { IconChevronDown, IconWorld } from '@tabler/icons-react';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, ensureLanguageResources, type SupportedLanguage } from '../../i18n';

/**
 * LanguageSwitcher — Sélecteur de langue (LOT 44 — P0).
 *
 * Dropdown compact dans le header avec drapeau + libellé natif.
 * Persistance automatique en localStorage via i18next-browser-languagedetector.
 *
 * Variants :
 *   - default : pill arrondi avec drapeau + code langue (FR / EN) + chevron
 *   - icon-only : juste le drapeau (sidebar collapsée par exemple)
 */

interface Props {
    variant?: 'default' | 'icon-only';
    /** Style : light pour fond sombre, dark pour fond clair */
    tone?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'default', tone = 'light' }: Props) {
    const { i18n, t } = useTranslation('common');
    const current = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0] as SupportedLanguage;
    const currentInfo = LANGUAGE_LABELS[current] || LANGUAGE_LABELS.fr;

    const change = async (lng: SupportedLanguage) => {
        // On charge les ressources de la langue AVANT de basculer : ainsi l'IHM ne
        // montre jamais de clés brutes (l'anglais est téléchargé à la demande).
        await ensureLanguageResources(lng);
        i18n.changeLanguage(lng);
        // Mettre à jour <html lang="..."> pour l'accessibilité
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lng;
        }
    };

    const toneClasses = tone === 'light'
        ? 'text-white/95 hover:bg-white/15 ring-white/25'
        : 'text-slate-700 hover:bg-slate-100 ring-slate-200';

    return (
        <Menu position="bottom-end" offset={6} shadow="md" radius="md" width={180}>
            <Menu.Target>
                <button
                    type="button"
                    aria-label={t('languageSwitcher.label')}
                    className={`inline-flex items-center gap-1.5 ${variant === 'icon-only' ? 'px-1.5 py-1' : 'px-2 py-1'} rounded-full ring-1 transition-colors ${toneClasses}`}
                >
                    {variant === 'icon-only' ? (
                        <IconWorld size={14} stroke={1.8} />
                    ) : (
                        <>
                            <span className="text-[13px] leading-none" aria-hidden="true">{currentInfo.flag}</span>
                            <span className="text-[11.5px] font-medium uppercase tracking-[0.08em]">
                                {current}
                            </span>
                            <IconChevronDown size={11} stroke={2} className="opacity-70" aria-hidden="true" />
                        </>
                    )}
                </button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>{t('languageSwitcher.label')}</Menu.Label>
                {SUPPORTED_LANGUAGES.map((lng) => {
                    const info = LANGUAGE_LABELS[lng];
                    const isActive = lng === current;
                    return (
                        <Menu.Item
                            key={lng}
                            onClick={() => change(lng)}
                            leftSection={<span className="text-[14px]" aria-hidden="true">{info.flag}</span>}
                            rightSection={
                                isActive ? (
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-teal-700">
                                        ✓
                                    </span>
                                ) : null
                            }
                            className={isActive ? '!bg-teal-50' : ''}
                        >
                            <span className={isActive ? 'text-teal-800 font-medium' : 'text-slate-700'}>
                                {info.native}
                            </span>
                        </Menu.Item>
                    );
                })}
            </Menu.Dropdown>
        </Menu>
    );
}
