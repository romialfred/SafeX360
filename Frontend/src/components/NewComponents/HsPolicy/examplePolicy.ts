import type { HsPolicy } from '../../../services/HsPolicyService';

/**
 * EXEMPLE de politique SST conforme à l'ISO 45001 §5.2.
 *
 * Point de départ chargeable en un clic dans l'éditeur : la direction l'adapte à
 * son site plutôt que de partir d'une page blanche. Couvre les six engagements
 * attendus par la norme (conditions sûres, exigences légales, élimination des
 * dangers, amélioration continue, consultation des travailleurs, cadre d'objectifs),
 * chacun avec une explication concrète pour le terrain (§5.4).
 */
export const EXAMPLE_POLICY: HsPolicy = {
    title: 'Politique Santé & Sécurité au Travail',
    preamble:
        "La direction place la santé et la sécurité de chaque personne travaillant sur notre site "
        + "au cœur de ses décisions. Aucune production, aucun objectif ne justifie de mettre en danger "
        + "un travailleur. Par la présente politique, la direction s'engage, alloue les moyens "
        + "nécessaires et rend compte des résultats. Cette politique s'applique à l'ensemble du "
        + "personnel, aux sous-traitants et aux visiteurs.",
    effectiveDate: null,
    status: 'DRAFT',
    articles: [
        {
            title: 'Des conditions de travail sûres et saines',
            body: "Nous nous engageons à fournir des conditions de travail sûres et saines afin de "
                + "prévenir les traumatismes et les atteintes à la santé liés au travail.",
            explanation: "Concrètement : équipements protégés, postes ergonomiques, environnement "
                + "maîtrisé (bruit, poussière, chaleur), et le droit de se retirer d'une situation "
                + "de danger grave et imminent sans crainte de sanction.",
        },
        {
            title: 'Le respect des exigences légales et autres',
            body: "Nous nous engageons à satisfaire aux exigences légales applicables et aux autres "
                + "exigences auxquelles nous souscrivons en matière de santé et sécurité.",
            explanation: "Permis à jour, contrôles réglementaires réalisés dans les délais, "
                + "formations obligatoires suivies, engagements clients et de groupe tenus.",
        },
        {
            title: "L'élimination des dangers et la réduction des risques",
            body: "Nous nous engageons à éliminer les dangers et à réduire les risques SST en "
                + "appliquant la hiérarchie des mesures de maîtrise.",
            explanation: "On cherche d'abord à supprimer le danger, puis à le remplacer, puis à "
                + "l'isoler par l'ingénierie, avant de recourir aux consignes et aux EPI. L'EPI "
                + "est la dernière barrière, jamais la première réponse.",
        },
        {
            title: "L'amélioration continue",
            body: "Nous nous engageons à améliorer en continu notre système de management de la "
                + "santé et de la sécurité au travail.",
            explanation: "Chaque incident, presque-accident et audit nourrit des actions "
                + "correctives dont on vérifie l'efficacité. On mesure, on apprend, on progresse.",
        },
        {
            title: 'La consultation et la participation des travailleurs',
            body: "Nous nous engageons à consulter les travailleurs et leurs représentants et à "
                + "favoriser leur participation à tous les niveaux.",
            explanation: "Votre voix compte : signalez les dangers, proposez des améliorations, "
                + "participez aux analyses. Personne ne connaît mieux les risques du terrain que "
                + "ceux qui y travaillent.",
        },
        {
            title: 'Un cadre pour fixer nos objectifs SST',
            body: "Cette politique fournit le cadre dans lequel sont établis et revus nos objectifs "
                + "de santé et de sécurité au travail.",
            explanation: "Nos objectifs annuels (réduction des accidents, taux de fréquence, "
                + "actions préventives) découlent de ces engagements et sont revus en revue de "
                + "direction.",
        },
    ],
};
