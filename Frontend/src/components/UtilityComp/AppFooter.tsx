import { Link } from 'react-router-dom';
import { IconShieldCheck } from '@tabler/icons-react';

/**
 * AppFooter — Footer global de la plateforme SafeX 360 (LOT 41).
 *
 * Pleine largeur, sobre, professionnel. Contient :
 *   - Marque + copyright Data Universe
 *   - Liens institutionnels (Centre d'aide / Documentation ISO / Mentions)
 *   - Version + statut système
 */

const AppFooter = () => {
    const year = 2026;

    return (
        <footer
            className="w-full bg-slate-900 text-slate-300 border-t border-slate-800"
            role="contentinfo"
        >
            <div className="w-full px-6 lg:px-10 py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    {/* Marque + copyright */}
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-gradient-to-br from-teal-500 to-red-500 flex-shrink-0">
                            <IconShieldCheck size={14} className="text-white" aria-hidden="true" />
                        </span>
                        <div className="leading-tight">
                            <p className="text-[12.5px] text-white">
                                <span className="font-medium">SafeX</span>
                                <span style={{ color: '#2DD4BF' }}>X</span>
                                <span className="font-medium">&nbsp;360</span>
                                <span className="text-slate-400 ml-2">· Plateforme HSE pour l'industrie minière</span>
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                © {year} <span className="text-slate-300">Data Universe</span> · Tous droits réservés
                            </p>
                        </div>
                    </div>

                    {/* Liens institutionnels */}
                    <nav aria-label="Liens du pied de page" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
                        <Link to="/how-to" className="text-slate-400 hover:text-white transition-colors">
                            Centre d'aide
                        </Link>
                        <Link to="/iso-documents" className="text-slate-400 hover:text-white transition-colors">
                            Documents ISO
                        </Link>
                        <Link to="/technical-docs" className="text-slate-400 hover:text-white transition-colors">
                            Documentation technique
                        </Link>
                        <a href="mailto:support@safex360.com" className="text-slate-400 hover:text-white transition-colors">
                            Support
                        </a>
                    </nav>

                    {/* Version + statut système */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                            Système opérationnel
                        </span>
                        <span className="text-slate-700">|</span>
                        <span>v2.4.1</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default AppFooter;
