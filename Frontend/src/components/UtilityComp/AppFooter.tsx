import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSparkles } from '@tabler/icons-react';
import SafeXLogoColor from './SafeXLogoColor';
import IsoBadge from './IsoBadge';
import { useAppDispatch } from '../../slices/hooks';
import { openAiAssistant } from '../../slices/AiAssistantSlice';

/**
 * AppFooter — Footer global de la plateforme SafeX 360 (LOT 45 v2 — refonte mono-ligne).
 *
 *   ┌──────────────────────────────────────────────────────────────────────────────┐
 *   │ [🛡] SafeX 360 · © 2026 Data Universe   Aide  ISO  Tech  Support  ● Opérationnel · v2.4.1 │
 *   └──────────────────────────────────────────────────────────────────────────────┘
 *
 *   • Une seule ligne flex justify-between
 *   • Vrai logo officiel SafeX 360 (bouclier teal→rouge avec coche, identique à la sidebar)
 *   • Padding vertical réduit (py-3) pour barre fine pro
 *   • Pleine largeur (collée aux bords)
 *   • Bilingue (FR / EN)
 */

const AppFooter = () => {
    const { t } = useTranslation('navigation');
    const dispatch = useAppDispatch();
    const year = 2026;

    return (
        <footer
            // LOT 48 P6.c — Footer "freeze" : reste collé au bas du viewport pendant le scroll
            // sticky bottom-0 fonctionne car le parent direct est `flex flex-col min-h-screen`
            // et qu'aucun ancêtre n'a overflow:auto (le viewport sert d'ancêtre scrollable).
            className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 sticky bottom-0 z-40"
            role="contentinfo"
        >
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3">
                {/* LOT 48 P6.j — Responsive : stack vertical sur mobile pour eviter wrap chaotique */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-y-2 sm:gap-x-6">

                    {/* Bloc marque : logo officiel + wordmark + copyright sur UNE seule ligne */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <SafeXLogoColor variant="icon" size={22} />
                        <span
                            className="text-white text-[13px] leading-none"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            <span>Safe</span>
                            <span style={{ color: '#2DD4BF' }}>X</span>
                            <span style={{ marginLeft: '0.18em', color: '#EF4444' }}>360</span>
                        </span>
                        <span className="text-slate-600 text-[11px]" aria-hidden="true">·</span>
                        {/* Copyright + lien du site JUSTE EN DESSOUS (le lien vivait
                            auparavant à droite du footer, il rejoint sa marque). */}
                        <span className="flex flex-col leading-tight min-w-0">
                            <span className="text-[11.5px] text-slate-400 truncate">
                                © {year} <span className="text-slate-300">Data Universe</span>
                            </span>
                            <a
                                href="https://datauniverse.bf/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10.5px] text-slate-500 hover:text-slate-300 transition-colors truncate"
                            >
                                datauniverse.bf
                            </a>
                        </span>
                    </div>

                    {/* Liens institutionnels — alignés au centre/droite */}
                    <nav
                        aria-label={t('footer.documentation')}
                        className="flex items-center gap-x-5 text-[12px] whitespace-nowrap"
                    >
                        <Link to="/how-to" className="text-slate-400 hover:text-white transition-colors">
                            {t('footer.helpCenter')}
                        </Link>
                        <Link to="/iso-documents" className="text-slate-400 hover:text-white transition-colors">
                            {t('footer.isoDocuments')}
                        </Link>
                        <Link to="/technical-docs" className="text-slate-400 hover:text-white transition-colors">
                            {t('footer.technicalDocs')}
                        </Link>
                        <a href="mailto:contact@datauniverse.bf" className="text-slate-400 hover:text-white transition-colors">
                            {t('footer.support')}
                        </a>
                    </nav>

                    {/* Repères des référentiels pris en compte, sans valeur d'attestation. */}
                    <div className="flex items-center gap-2" aria-label="Référentiels ISO pris en compte par certains modules">
                        {(['ISO 45001', 'ISO 14001', 'ISO 9001', 'ISO 19011'] as const).map((norm) => (
                            <IsoBadge key={norm} norm={norm} theme="dark" size="sm" />
                        ))}
                    </div>

                    {/* À droite du footer : déclencheur de l'Assistant SafeX 360.
                        Remplace l'ancienne bulle flottante, qui recouvrait les
                        boutons d'action des formulaires (même coin bas-droit). */}
                    <button
                        type="button"
                        onClick={() => dispatch(openAiAssistant())}
                        aria-label={t('footer.aiAssistant', { defaultValue: 'Assistant SafeX 360' })}
                        className="group inline-flex items-center gap-2 rounded-full pl-2 pr-3.5 py-1.5 bg-gradient-to-r from-teal-500/15 to-sky-500/15 border border-teal-400/30 text-teal-200 hover:text-white hover:border-teal-300/60 hover:from-teal-500/25 hover:to-sky-500/25 transition-all whitespace-nowrap"
                    >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex-shrink-0">
                            <IconSparkles size={13} stroke={1.9} className="text-white group-hover:rotate-12 transition-transform" />
                        </span>
                        <span className="text-[12px] font-medium">
                            {t('footer.aiAssistant', { defaultValue: 'Assistant SafeX 360' })}
                        </span>
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default AppFooter;
