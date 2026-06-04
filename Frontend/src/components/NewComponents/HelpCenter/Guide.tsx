import {
    IconAlertTriangle,
    IconClipboardCheck,
    IconShieldExclamation,
    IconHelmet,
    IconCertificate,
    IconChartBar,
    IconBook2,
    IconExternalLink,
    IconBolt,
    IconUsers,
    IconWifi,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import DocsShell, {
    DocSection,
    Callout,
} from '../../UtilityComp/DocsShell';
import { DOCS_NAVIGATION } from '../../../Data/DocsNavigation';

/**
 * Guide — Page d'accueil du Centre de connaissances SafeX 360.
 *
 * LOT 41 : refonte complète avec DocsShell (layout GitBook/Stripe Docs)
 *   - Sidebar navigation hiérarchique
 *   - TOC sticky avec scrollspy
 *   - Breadcrumbs
 *   - Recherche
 *   - Navigation prev/next
 *   - Mobile : drawer pour la sidebar
 *
 * Cette page est la porte d'entrée — elle présente les modules métier
 * et oriente l'utilisateur vers les ressources appropriées.
 */

const HSE_MODULES = [
    {
        id: 'incidents',
        title: 'Gestion des incidents',
        description: 'Déclaration rapide, investigation, lessons learned.',
        icon: IconAlertTriangle,
        color: 'red',
        to: '/incidents',
    },
    {
        id: 'audits',
        title: 'Audits & inspections',
        description: 'Programmation, exécution, recommandations ISO 19011.',
        icon: IconClipboardCheck,
        color: 'indigo',
        to: '/audit-management',
    },
    {
        id: 'risks',
        title: 'Gestion des risques',
        description: 'Identification, évaluation, traitement selon ISO 31000.',
        icon: IconShieldExclamation,
        color: 'amber',
        to: '/risks-overview',
    },
    {
        id: 'ppe',
        title: 'Équipements de protection',
        description: 'Catalogue, dotations, suivi des EPI par employé.',
        icon: IconHelmet,
        color: 'yellow',
        to: '/ppe-management',
    },
    {
        id: 'compliance',
        title: 'Conformité réglementaire',
        description: 'Suivi des exigences légales, documents, attestations.',
        icon: IconCertificate,
        color: 'emerald',
        to: '/compliance-dashboard',
    },
    {
        id: 'reports',
        title: 'Rapports & analytics',
        description: 'KPI HSE, rapports périodiques, analyse de tendances.',
        icon: IconChartBar,
        color: 'teal',
        to: '/monthly-reports',
    },
];

const TOC = [
    { id: 'intro', label: 'Introduction' },
    { id: 'first-login', label: 'Première connexion' },
    { id: 'platform-overview', label: 'Vue d\'ensemble' },
    { id: 'concepts-hse', label: 'Concepts clés HSE' },
    { id: 'modules', label: 'Modules métier' },
    { id: 'next-steps', label: 'Aller plus loin' },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700' },
    indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
    yellow:  { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700' },
};

const Guide = () => {
    return (
        <DocsShell
            navigation={DOCS_NAVIGATION}
            activeId="intro"
            breadcrumbs={[
                { label: 'Accueil', to: '/' },
                { label: 'Centre de connaissances', to: '/how-to' },
                { label: 'Démarrage' },
            ]}
            title="Démarrage avec SafeX 360"
            description="Tout ce qu'il faut savoir pour exploiter pleinement la plateforme HSE. Ce guide est destiné aux nouveaux utilisateurs comme aux référents experts."
            difficulty="beginner"
            toc={TOC}
            nextPage={{
                label: 'Vue d\'ensemble de la plateforme',
                to: '/features-overview',
                description: 'Cartographie fonctionnelle complète',
            }}
        >
            <DocSection id="intro" title="Introduction">
                <p>
                    <strong>SafeX 360</strong> est une plateforme intégrée de management de la santé,
                    de la sécurité et de l'environnement (HSE) conçue pour les exploitations
                    minières d'Afrique de l'Ouest. Elle couvre la totalité du cycle
                    de vie HSE : prévention, déclaration, investigation, action corrective,
                    conformité réglementaire et reporting.
                </p>
                <p>
                    La plateforme s'appuie sur les normes internationales <Link to="/iso-mapping" className="text-teal-700 hover:underline">ISO 45001, 14001, 9001, 19011 et 31000</Link> et
                    sur les bonnes pratiques de l'ICMM.
                </p>

                <Callout tone="info" title="Public cible">
                    Ce guide s'adresse aux <strong>responsables HSE, chefs d'équipe, auditeurs internes
                    et auditeurs externes</strong> des sites miniers. Il ne nécessite aucun prérequis
                    technique particulier.
                </Callout>
            </DocSection>

            <DocSection id="first-login" title="Première connexion">
                <p>
                    Pour vous connecter à la plateforme :
                </p>
                <ol className="list-decimal pl-6 space-y-2 my-4">
                    <li>Rendez-vous sur l'URL fournie par votre administrateur (généralement <code className="text-[13px] px-1 py-0.5 rounded bg-slate-100 text-slate-800">mine-xpert.data-univers.com</code>).</li>
                    <li>Saisissez votre identifiant et votre mot de passe initial.</li>
                    <li>Au premier accès, vous serez invité à <strong>modifier votre mot de passe</strong>.</li>
                    <li>Une fois connecté, vous arrivez sur le tableau de bord HSE.</li>
                </ol>

                <Callout tone="warning" title="Mot de passe oublié ?">
                    Cliquez sur le lien « Mot de passe oublié » sur l'écran de connexion.
                    Un nouveau mot de passe vous sera envoyé par email à l'adresse
                    enregistrée par votre administrateur.
                </Callout>
            </DocSection>

            <DocSection id="platform-overview" title="Vue d'ensemble">
                <p>
                    La plateforme est organisée en trois grandes zones :
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                    <li>
                        <strong>La barre latérale</strong> à gauche : accès rapide aux 12 modules métier
                        et au tableau de bord. Elle se replie pour gagner de l'espace.
                    </li>
                    <li>
                        <strong>L'en-tête</strong> : sélecteur de mine, alertes système, profil utilisateur
                        et bouton SOS en cas d'urgence.
                    </li>
                    <li>
                        <strong>L'espace de travail</strong> au centre : affiche le module sélectionné.
                    </li>
                </ul>
                <p>
                    Pour une cartographie détaillée des fonctionnalités, consultez la
                    <Link to="/features-overview" className="text-teal-700 hover:underline ml-1">vue d'ensemble fonctionnelle</Link>.
                </p>
            </DocSection>

            <DocSection id="concepts-hse" title="Concepts clés HSE">
                <p>
                    Voici les concepts fondamentaux que la plateforme manipule. Une bonne
                    compréhension de ces termes facilitera votre prise en main.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h4 className="text-[14.5px] text-slate-900 mb-1.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            Incident HSE
                        </h4>
                        <p className="text-[13px] text-slate-600">
                            Tout événement non planifié ayant entraîné — ou pouvant entraîner — un
                            dommage corporel, matériel ou environnemental. Inclut : LTI, MTI, FAI,
                            Near Miss, conditions dangereuses.
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h4 className="text-[14.5px] text-slate-900 mb-1.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            Risque
                        </h4>
                        <p className="text-[13px] text-slate-600">
                            Combinaison de la probabilité d'occurrence d'un événement dangereux et de
                            la sévérité de ses conséquences. Évalué selon une matrice 5×5 (ISO 31000).
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h4 className="text-[14.5px] text-slate-900 mb-1.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            Action corrective
                        </h4>
                        <p className="text-[13px] text-slate-600">
                            Action entreprise pour éliminer la cause d'une non-conformité ou d'un
                            incident, et éviter sa récurrence (ISO 45001 §10.2).
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h4 className="text-[14.5px] text-slate-900 mb-1.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                            Audit interne
                        </h4>
                        <p className="text-[13px] text-slate-600">
                            Processus systématique d'évaluation de la conformité aux exigences
                            internes et normatives, mené selon les lignes directrices ISO 19011.
                        </p>
                    </div>
                </div>
            </DocSection>

            <DocSection id="modules" title="Modules métier">
                <p>
                    Voici les 6 modules les plus utilisés. Chacun dispose de sa propre documentation
                    détaillée accessible depuis la barre latérale.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    {HSE_MODULES.map((mod) => {
                        const colors = COLOR_MAP[mod.color];
                        return (
                            <Link
                                key={mod.id}
                                to={mod.to}
                                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-md transition-all"
                            >
                                <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center mb-3`}>
                                    <mod.icon size={18} className={colors.text} aria-hidden="true" />
                                </div>
                                <h4
                                    className="text-slate-900 group-hover:text-teal-700 transition-colors"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 500,
                                        fontSize: '16px',
                                    }}
                                >
                                    {mod.title}
                                </h4>
                                <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">
                                    {mod.description}
                                </p>
                                <span className="inline-flex items-center gap-1 mt-3 text-[12px] text-teal-700 group-hover:text-teal-900">
                                    Ouvrir le module
                                    <IconExternalLink size={11} aria-hidden="true" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </DocSection>

            <DocSection id="next-steps" title="Aller plus loin">
                <p>
                    Une fois cette introduction maîtrisée, nous vous recommandons d'explorer :
                </p>

                <ul className="space-y-3 my-5">
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mt-0.5">
                            <IconBolt size={14} className="text-teal-700" aria-hidden="true" />
                        </span>
                        <div>
                            <Link to="/features-overview" className="text-[14.5px] text-slate-900 hover:text-teal-700 transition-colors" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                                Vue d'ensemble fonctionnelle
                            </Link>
                            <p className="text-[13px] text-slate-600 mt-0.5">
                                Cartographie complète des 200+ fonctionnalités de la plateforme.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center mt-0.5">
                            <IconBook2 size={14} className="text-indigo-700" aria-hidden="true" />
                        </span>
                        <div>
                            <Link to="/iso-mapping" className="text-[14.5px] text-slate-900 hover:text-teal-700 transition-colors" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                                Cartographie ISO ↔ modules
                            </Link>
                            <p className="text-[13px] text-slate-600 mt-0.5">
                                Traçabilité des clauses ISO 45001 / 14001 / 9001 / 19011 / 31000.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center mt-0.5">
                            <IconUsers size={14} className="text-emerald-700" aria-hidden="true" />
                        </span>
                        <div>
                            <Link to="/iso-documents" className="text-[14.5px] text-slate-900 hover:text-teal-700 transition-colors" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                                Documents ISO de référence
                            </Link>
                            <p className="text-[13px] text-slate-600 mt-0.5">
                                Bibliothèque des documents normatifs et internes.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center mt-0.5">
                            <IconWifi size={14} className="text-amber-700" aria-hidden="true" />
                        </span>
                        <div>
                            <Link to="/technical-docs" className="text-[14.5px] text-slate-900 hover:text-teal-700 transition-colors" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                                Documentation technique
                            </Link>
                            <p className="text-[13px] text-slate-600 mt-0.5">
                                Architecture, API REST, modèle de données, intégrations.
                            </p>
                        </div>
                    </li>
                </ul>

                <Callout tone="success" title="Besoin d'aide ?">
                    Notre équipe support est disponible par email à <a href="mailto:support@safex360.com" className="text-emerald-700 hover:underline">support@safex360.com</a> du lundi au vendredi, 8h–17h GMT.
                </Callout>
            </DocSection>
        </DocsShell>
    );
};

export default Guide;
