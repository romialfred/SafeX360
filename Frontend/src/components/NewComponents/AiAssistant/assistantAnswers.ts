/**
 * assistantAnswers — composition des réponses « mesures » de l'Assistant SafeX.
 *
 * CONTRAT D'HONNÊTETÉ (aligné sur DashboardService) :
 *  - Tout chiffre présenté comme la performance de LA mine active provient d'un
 *    appel réel à `getOhsDashboard`. Aucune valeur de repli, aucune moyenne
 *    « plausible », aucun arrondi inventé.
 *  - `null` ≠ 0 : « aucun incident grave enregistré » n'est PAS « 0 jour »,
 *    « LTIFR non déclaré » n'est PAS « LTIFR = 0 ».
 *  - Une métrique sans source dans SafeX (TRIR, taux de formation, budget,
 *    heures travaillées) est REFUSÉE explicitement, jamais fabriquée.
 *  - En cas d'échec de chargement : on le dit. Aucun chiffre.
 *
 * Le SAVOIR (procédures HSE, définitions/formules) vit ailleurs et reste
 * inchangé : il est vrai indépendamment des données de la mine.
 */

import { getOhsDashboard, type DashboardOhsDTO } from '../../../services/DashboardService';

/** Phrase de transparence affichée dans l'en-tête / l'accueil de l'assistant. */
export const TRANSPARENCY_NOTE =
    "Je réponds à partir des données réelles de la mine active et de ma base de procédures HSE. Je ne fais pas d'analyse prédictive.";

export const WELCOME_MESSAGE =
    "Bonjour ! Je suis l'Assistant SafeX. " + TRANSPARENCY_NOTE +
    " Posez-moi une question sur vos indicateurs, vos incidents, vos alertes ou une procédure HSE.";

/** Nature de la question — détermine la source (données, savoir, refus). */
export type AnswerKind =
    | 'kpi'
    | 'incidents'
    | 'alerts'
    | 'ppe'
    | 'ltifr-definition'
    | 'not-tracked'
    | 'help'
    | 'unknown';

const MONTHS_FR = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const has = (input: string, words: string[]) => words.some((w) => input.includes(w));

/**
 * Classe la question. L'ordre compte : une question DÉFINITIONNELLE sur le
 * LTIFR (« qu'est-ce que… », « comment se calcule… ») relève du savoir, pas
 * des données de la mine — il ne faut pas la confondre avec « quel est notre
 * LTIFR ? ».
 */
export function classifyQuestion(userInput: string): AnswerKind {
    const input = userInput.toLowerCase();

    const definitional = has(input, [
        "qu'est-ce", 'qu est-ce', 'définition', 'definition', 'définis', 'defini',
        'comment se calcule', 'comment calculer', 'formule', 'formula',
        'what is', 'how is it calculated', 'signifie', 'veut dire',
    ]);
    if (definitional && input.includes('ltifr')) return 'ltifr-definition';

    // Métriques sans aucune source dans SafeX : refus explicite et argumenté.
    if (has(input, [
        'trir', 'dart', 'taux de formation', 'formation', 'training', 'habilitation',
        'budget', 'coût', 'cout', 'coûts', 'couts', 'cost', 'dépense', 'depense',
        'heures travaillées', 'heures travaillees', 'hours worked', 'masse salariale',
    ])) return 'not-tracked';

    if (has(input, ['epi', 'ppe', 'équipement de protection', 'equipement de protection'])) return 'ppe';
    if (has(input, ['alerte', 'alert', 'retard', 'overdue', 'en retard'])) return 'alerts';
    if (has(input, ['incident', 'quasi-accident', 'quasi accident', 'presque accident', 'near miss', 'accident'])) return 'incidents';
    if (has(input, ['kpi', 'indicateur', 'performance', 'ltifr', 'analyse', 'analyze', 'analysis', 'metric', 'métrique', 'metrique', 'bilan', 'situation'])) return 'kpi';
    if (has(input, ['aide', 'help', 'utiliser', 'guide', 'comment faire', 'que peux-tu', 'que sais-tu'])) return 'help';

    return 'unknown';
}

/** Résultat de chargement : soit les données réelles, soit une erreur assumée. */
export type OhsSnapshot =
    | { ok: true; data: DashboardOhsDTO }
    | { ok: false; error: string };

export async function loadOhsSnapshot(): Promise<OhsSnapshot> {
    try {
        const data = await getOhsDashboard(new Date().getFullYear());
        return { ok: true, data };
    } catch (e: any) {
        const detail = e?.response?.status
            ? `erreur ${e.response.status}`
            : (e?.message ?? 'erreur réseau');
        return { ok: false, error: detail };
    }
}

/** Réponse d'échec — JAMAIS de chiffres de repli. */
export function buildLoadErrorAnswer(error: string): { markdown: string; speech: string } {
    return {
        markdown: `⚠️ **Données indisponibles**

Je n'ai pas pu récupérer les données de la mine (${error}).

Je préfère ne rien afficher plutôt que des chiffres approximatifs : aucune valeur de ce message ne serait vérifiable. Réessayez dans un instant, ou consultez directement le tableau de bord.`,
        speech: "Je n'ai pas pu récupérer les données de la mine. Je préfère ne pas avancer de chiffres.",
    };
}

/* ------------------------------------------------------------------ */
/* Fragments réutilisables                                             */
/* ------------------------------------------------------------------ */

/** `null` = aucun incident grave enregistré. Ce n'est PAS « 0 jour ». */
function daysWithoutText(days: number | null): string {
    return days === null
        ? 'aucun incident grave enregistré à ce jour'
        : `${days} jour${days > 1 ? 's' : ''}`;
}

/** Évolution N/N-1 — pas de pourcentage si N-1 vaut 0 (division par zéro). */
function evolutionText(current: number, previous: number): string {
    if (previous === 0) return `N-1 : 0 (pas d'évolution calculable)`;
    const delta = Math.round(((current - previous) / previous) * 100);
    const sign = delta > 0 ? '+' : '';
    return `N-1 : ${previous} (${sign}${delta} %)`;
}

/** Le LTIFR est SAISI dans le module Indicateurs : on l'annonce comme déclaré. */
function ltifrText(dto: DashboardOhsDTO): string {
    const m = dto.kpis.ltifr;
    if (!m) {
        return "**Taux de fréquence LTI** : non défini — aucune valeur déclarée. Pour l'obtenir, créez un indicateur de code `LTIFR` dans le module Indicateurs et renseignez ses relevés mensuels.";
    }
    const target = m.target !== null ? ` — cible : ${m.target}` : ' — aucune cible définie';
    return `**Taux de fréquence LTI** : ${m.value} (période « ${m.period} »)${target}. Valeur **déclarée** dans le module Indicateurs, et non calculée : SafeX n'enregistre pas les heures travaillées.`;
}

function alertsBlock(dto: DashboardOhsDTO): string {
    if (dto.alerts.length === 0) return "**Alertes actives** : aucune.";
    const icon = (p: string) => (p === 'high' ? '🔴' : p === 'medium' ? '🟠' : '🟡');
    const lines = dto.alerts.map((a) => `• ${icon(a.priority)} **${a.title}** : ${a.value} — ${a.description}`);
    return `**Alertes actives (${dto.alerts.length})**\n${lines.join('\n')}`;
}

function listOrNone(rows: { label: string; count: number }[], empty: string): string {
    const kept = rows.filter((r) => r.count > 0);
    if (kept.length === 0) return empty;
    return kept.map((r) => `• ${r.label} : ${r.count}`).join('\n');
}

/* ------------------------------------------------------------------ */
/* Réponses « mesures » — 100 % issues du serveur                      */
/* ------------------------------------------------------------------ */

export function buildKpiAnswer(dto: DashboardOhsDTO): { markdown: string; speech: string } {
    const k = dto.kpis;
    const markdown = `📊 **Situation HSE — ${dto.year}**

• **Incidents déclarés** : ${k.totalIncidentsYtd} — ${evolutionText(k.totalIncidentsYtd, k.totalIncidentsPreviousYtd)}
• **Quasi-accidents** : ${k.nearMissCount}
• **Jours sans incident grave** : ${daysWithoutText(k.daysWithoutSeriousIncident)}
• ${ltifrText(dto)}

${alertsBlock(dto)}

_Ces valeurs proviennent des données de la mine active. SafeX ne suit ni le TRIR, ni les heures travaillées, ni les taux de formation : je ne peux donc pas les commenter._`;

    return {
        markdown,
        speech: `Sur ${dto.year} : ${k.totalIncidentsYtd} incidents déclarés, ${k.nearMissCount} quasi-accidents, et ${daysWithoutText(k.daysWithoutSeriousIncident)}.`,
    };
}

export function buildIncidentsAnswer(dto: DashboardOhsDTO): { markdown: string; speech: string } {
    const k = dto.kpis;
    const trend = dto.monthlyTrend
        .filter((p) => p.incidents > 0 || p.nearMiss > 0)
        .map((p) => `• ${MONTHS_FR[p.month - 1] ?? `mois ${p.month}`} : ${p.incidents} incident(s), ${p.nearMiss} quasi-accident(s)`);

    const markdown = `🚨 **Incidents — ${dto.year}**

• **Total déclaré** : ${k.totalIncidentsYtd} — ${evolutionText(k.totalIncidentsYtd, k.totalIncidentsPreviousYtd)}
• **Quasi-accidents** : ${k.nearMissCount}
• **Jours sans incident grave** : ${daysWithoutText(k.daysWithoutSeriousIncident)}

**Par catégorie**
${listOrNone(dto.incidentsByCategory, '• Aucun incident catégorisé sur la période.')}

**Par gravité**
${listOrNone(dto.incidentsBySeverity, '• Aucune gravité renseignée sur la période.')}

**Répartition mensuelle**
${trend.length > 0 ? trend.join('\n') : '• Aucun événement enregistré sur les mois écoulés.'}

_Le détail des enquêtes (statut, causes, actions) n'est pas exposé à l'assistant : consultez le module Incidents._`;

    return {
        markdown,
        speech: `${k.totalIncidentsYtd} incidents déclarés en ${dto.year} et ${k.nearMissCount} quasi-accidents.`,
    };
}

export function buildAlertsAnswer(dto: DashboardOhsDTO): { markdown: string; speech: string } {
    const markdown = `🔔 **Alertes HSE — ${dto.year}**

${alertsBlock(dto)}

_Les alertes sont calculées sur des décomptes réels (actions correctives en retard, stocks d'EPI sous seuil). S'il n'y en a aucune, c'est qu'aucun seuil n'est franchi — pas que le suivi est absent._`;

    return {
        markdown,
        speech: dto.alerts.length === 0
            ? 'Aucune alerte active actuellement.'
            : `${dto.alerts.length} alerte(s) active(s).`,
    };
}

export function buildPpeAnswer(dto: DashboardOhsDTO): { markdown: string; speech: string } {
    const ppeAlerts = dto.alerts.filter((a) => /epi|ppe|stock/i.test(`${a.title} ${a.description}`));
    const block = ppeAlerts.length > 0
        ? ppeAlerts.map((a) => `• **${a.title}** : ${a.value} — ${a.description}`).join('\n')
        : "• Aucune alerte de stock d'EPI sous seuil actuellement.";

    const markdown = `🦺 **EPI — ce que je peux voir**

${block}

**Ce que je ne peux pas vous dire :** le budget, les dépenses et le détail des demandes en attente ne sont pas exposés à l'assistant — et SafeX ne gère aucun budget EPI. Le module EPI reste la source pour les demandes, les dotations et les stocks.`;

    return {
        markdown,
        speech: ppeAlerts.length > 0
            ? `${ppeAlerts.length} alerte(s) EPI à traiter.`
            : "Aucune alerte EPI actuellement.",
    };
}

/* ------------------------------------------------------------------ */
/* Refus honnête — métriques sans source                               */
/* ------------------------------------------------------------------ */

export function buildNotTrackedAnswer(): { markdown: string; speech: string } {
    return {
        markdown: `ℹ️ **Cette donnée n'est pas suivie dans SafeX aujourd'hui**

Le TRIR, les taux de formation et d'habilitation, les budgets/coûts et les heures travaillées n'ont **aucune source** dans la plateforme. Je préfère vous le dire plutôt que d'avancer un chiffre invérifiable.

**Ce que je peux vous donner, en revanche :**
• Le nombre d'incidents déclarés de l'année et sa comparaison avec N-1
• Le nombre de quasi-accidents
• Les jours sans incident grave
• Le taux de fréquence LTI, s'il a été **déclaré** dans le module Indicateurs
• La répartition des incidents par catégorie, par gravité et par mois
• Les alertes actives (actions correctives en retard, EPI sous seuil)

Demandez-moi par exemple « Quelle est la situation HSE cette année ? ».`,
        speech: "Cette donnée n'est pas suivie dans SafeX. Je peux en revanche vous donner les incidents, les quasi-accidents et les alertes de la mine.",
    };
}

export function buildHelpAnswer(): { markdown: string; speech: string } {
    return {
        markdown: `💡 **Ce que je sais faire**

**À partir des données réelles de la mine active :**
• Situation HSE de l'année : incidents, quasi-accidents, jours sans incident grave
• Répartition des incidents par catégorie, par gravité et par mois
• Taux de fréquence LTI, lorsqu'il est déclaré dans le module Indicateurs
• Alertes actives : actions correctives en retard, EPI sous seuil

**À partir de ma base de connaissances HSE :**
• Procédures détaillées (travail en hauteur, évacuation en atmosphère toxique)
• Définitions et formules des indicateurs (LTIFR, etc.)

**Ce que je ne fais pas :**
• Aucune analyse prédictive
• Aucune recherche documentaire dans la plateforme
• Aucun chiffre sur le TRIR, la formation, les budgets ou les heures travaillées — ces données n'existent pas dans SafeX`,
        speech: 'Je peux vous donner la situation HSE de la mine et les procédures HSE de ma base de connaissances.',
    };
}

export function buildUnknownAnswer(userInput: string): { markdown: string; speech: string } {
    return {
        markdown: `Je n'ai pas de réponse fiable à « ${userInput} ».

**Reformulez plutôt vers ce que je sais faire :**
• « Quelle est la situation HSE cette année ? »
• « Combien d'incidents et de quasi-accidents cette année ? »
• « Quelles sont les alertes en cours ? »
• « Quelle est la procédure de travail en hauteur ? »
• « Qu'est-ce que le LTIFR et comment se calcule-t-il ? »

Je préfère vous dire que je ne sais pas plutôt que d'inventer une réponse.`,
        speech: "Je n'ai pas de réponse fiable à cette question. Reformulez vers les indicateurs, les incidents, les alertes ou une procédure HSE.",
    };
}

/** SAVOIR de référence : vrai indépendamment des données de la mine. */
export function buildLtifrDefinitionAnswer(): { markdown: string; speech: string } {
    return {
        markdown: `📚 **LTIFR — Taux de fréquence des accidents avec arrêt**

**Définition**
Le LTIFR (*Lost Time Injury Frequency Rate*) mesure le nombre d'accidents avec arrêt de travail rapporté à un volume d'heures travaillées de référence.

**Formule**
LTIFR = (Nombre d'accidents avec arrêt × 200 000) ÷ Heures travaillées totales

Le facteur 200 000 correspond à 100 salariés travaillant 2 000 heures par an. Certaines organisations utilisent 1 000 000 d'heures : les valeurs ne sont alors pas comparables sans conversion.

**Exemple de calcul**
3 accidents avec arrêt pour 500 000 heures travaillées → (3 × 200 000) ÷ 500 000 = **1,2**

**Repères usuels du secteur**
• Excellent : < 1,0
• Bon : 1,0 – 2,0
• Moyen : 2,0 – 5,0
• À améliorer : > 5,0

**Dans SafeX**
Les heures travaillées ne sont pas enregistrées : le LTIFR n'y est donc **jamais calculé**. Il est **déclaré** manuellement dans le module Indicateurs (code \`LTIFR\`). Demandez-moi « quel est notre taux de fréquence LTI ? » pour connaître la valeur déclarée de la mine active.`,
        speech: "Le LTIFR est le nombre d'accidents avec arrêt multiplié par 200 000, divisé par les heures travaillées. Dans SafeX il est déclaré manuellement, jamais calculé.",
    };
}
