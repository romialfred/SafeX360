import { Button } from "@mantine/core";
import {
    IconAlertTriangle,
    IconClipboardCheck,
    IconShieldExclamation,
    IconBook,
    IconArrowRight,
    IconShield,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";

/**
 * AddCorrective — Hub de création d'actions correctives.
 *
 * LOT 40 fix : la page précédente était un placeholder vide ("Report Actions"
 * + breadcrumbs, aucun formulaire). Dans SafeX 360, les actions correctives
 * ne sont JAMAIS créées en isolation : elles découlent toujours d'une source
 * (incident, audit, non-conformité, recommandation).
 *
 * Cette page sert d'orientation : elle liste les 4 sources et redirige vers
 * la bonne page de création contextualisée.
 */

const SOURCES = [
    {
        id: 'incident',
        label: 'Depuis un incident',
        description: 'Action issue d\'un événement HSE déclaré (LTI, MTI, FAI, Near Miss).',
        icon: IconAlertTriangle,
        accent: 'bg-rose-50 border-rose-200 text-rose-700',
        route: '/incidents',
        cta: 'Voir les incidents',
    },
    {
        id: 'audit',
        label: 'Depuis un audit',
        description: 'Action issue d\'une recommandation d\'audit interne ISO 45001.',
        icon: IconClipboardCheck,
        accent: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        route: '/audit-recommendations',
        cta: 'Voir les recommandations',
    },
    {
        id: 'non-conformity',
        label: 'Depuis une non-conformité',
        description: 'Action issue d\'un écart constaté (procédure, produit, conformité).',
        icon: IconShieldExclamation,
        accent: 'bg-amber-50 border-amber-200 text-amber-700',
        route: '/non-conformity',
        cta: 'Voir les non-conformités',
    },
    {
        id: 'lesson',
        label: 'Depuis une leçon apprise',
        description: 'Action préventive issue d\'un retour d\'expérience structuré.',
        icon: IconBook,
        accent: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        route: '/lesson-learn',
        cta: 'Voir les leçons apprises',
    },
];

const AddCorrective = () => {
    return (
        <div className="safex-page max-w-6xl mx-auto space-y-6">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions correctives', to: '/corrective' },
                    { label: 'Nouvelle action' },
                ]}
                icon={<IconShield size={22} />}
                iconColor="teal"
                title="Créer une action corrective"
                subtitle="Les actions correctives découlent toujours d'une source HSE. Choisissez l'origine de l'action ci-dessous."
            />

            {/* Grille des 4 sources */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SOURCES.map((src) => (
                    <Link
                        key={src.id}
                        to={src.route}
                        className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                        <div className={`px-5 py-4 border-b ${src.accent} flex items-center gap-3`}>
                            <div className="w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                                <src.icon size={20} />
                            </div>
                            <h3
                                className="text-slate-900 flex-1 min-w-0"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    letterSpacing: '-0.008em',
                                }}
                            >
                                {src.label}
                            </h3>
                            <IconArrowRight
                                size={16}
                                className="text-slate-500 group-hover:translate-x-0.5 transition-transform"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="p-5">
                            <p className="text-[13.5px] text-slate-600 leading-relaxed mb-4">
                                {src.description}
                            </p>
                            <Button
                                component="span"
                                variant="light"
                                size="sm"
                                radius="md"
                                rightSection={<IconArrowRight size={14} />}
                            >
                                {src.cta}
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Aide ISO */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <h4
                    className="text-slate-900 mb-2"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 500,
                        fontSize: '15px',
                    }}
                >
                    Pourquoi cette orientation ?
                </h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                    Selon la norme <span className="text-slate-900">ISO 45001 §10.2</span>, toute action
                    corrective doit être traçable à sa cause racine et à son événement déclencheur.
                    SafeX 360 enforce ce principe en exigeant une source explicite à la création.
                </p>
            </div>
        </div>
    );
};

export default AddCorrective;
