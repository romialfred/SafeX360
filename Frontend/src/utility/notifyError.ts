/**
 * notifyError.ts
 * --------------
 * Helper centralise pour la gestion des erreurs cote frontend SafeX360.
 *
 * Objectifs :
 *  - Extraire un message d'erreur lisible depuis une reponse Axios/Fetch,
 *    une `Error` JS, ou n'importe quel objet inconnu.
 *  - Afficher la notification d'erreur Mantine via `errorNotification`.
 *  - Logger les details techniques (status HTTP, stack) en mode dev pour
 *    faciliter le debug.
 */

import { errorNotification } from "./NotificationUtility";

/**
 * Affiche une notification d'erreur en extrayant le message le plus pertinent
 * depuis l'objet erreur passe en argument.
 *
 * Ordre de priorite pour le message :
 *   1. `err.response.data.errorMessage` (format SafeX backend Spring Boot)
 *   2. `err.response.data.message`      (format generique d'erreur HTTP)
 *   3. `err.message`                    (erreur JS native, ex: `new Error("...")`)
 *   4. `fallback`                       (message par defaut fourni par l'appelant)
 *
 * En mode developpement (`import.meta.env.DEV`), un `console.error` detaille
 * est emis avec le status HTTP eventuel et le message brut pour faciliter le
 * diagnostic. Aucun log n'est emis en production pour eviter de polluer la
 * console des utilisateurs finaux.
 *
 * @param err      L'erreur capturee (Axios error, Error JS, objet inconnu...).
 * @param fallback Message a afficher si aucun message exploitable n'est trouve.
 *                 Par defaut : `"Une erreur est survenue"`.
 *
 * @example
 *   try {
 *     await axios.post("/api/incidents", payload);
 *   } catch (err) {
 *     notifyError(err, "Impossible d'enregistrer l'incident");
 *   }
 */
/**
 * Codes d'erreur metier SafeX (HSException) -> message francais lisible.
 * Evite d'exposer les codes techniques bruts a l'utilisateur.
 */
const CODE_MESSAGES: Record<string, string> = {
  COMPANY_ID_REQUIRED:
    "Aucune mine sélectionnée. Choisissez une mine spécifique (au lieu de « Toutes les Mines ») puis réessayez.",
  INCIDENT_NOT_FOUND: "L'incident lié est introuvable. Rechargez la page puis réessayez.",
  INVESTIGATION_NOT_FOUND: "L'investigation est introuvable. Rechargez la page puis réessayez.",
  INVESTIGATION_ALREADY_EXISTS: "Une investigation existe déjà pour cet incident.",
  INVESTIGATION_DETAILS_REQUIRED: "Les informations de l'investigation sont incomplètes.",
  WORK_PROCESS_REQUIRED: "Le processus de travail est obligatoire. Sélectionnez-en un puis réessayez.",
  // Violations d'intégrité base traduites par le handler global HNS (409).
  REFERENCE_DATA_MISSING:
    "Une référence sélectionnée (lieu, processus, catégorie…) n'existe pas pour cette mine. Vérifiez que les données de référence de la mine sont bien renseignées.",
  DUPLICATE_ENTRY: "Cet enregistrement existe déjà (doublon détecté). Vérifiez les données saisies.",
  REQUIRED_FIELD_MISSING: "Un champ obligatoire est manquant. Complétez le formulaire puis réessayez.",
  DATA_INTEGRITY_ERROR: "Les données saisies ne respectent pas une contrainte. Vérifiez le formulaire puis réessayez.",
  PPE_REQUEST_EMPTY: "Sélectionnez au moins un employé et un équipement (EPI) avant d'enregistrer la demande.",
  EXAMPLE_REQUIRED: "Aucun exemple fourni. Saisissez un exemple avant de l'ajouter.",
  // Verrou de clôture d'incident (ISO 45001 §8.1.2 — ré-évaluation du risque).
  RESIDUAL_RISK_REQUIRED_FOR_CLOSURE:
    "Renseignez le risque APRÈS mesures (probabilité et gravité résiduelles) avant de clôturer cet incident.",
  RISK_NOT_REDUCED:
    "Le risque résiduel est supérieur au risque initial : la clôture exige une réduction du risque. Renforcez les mesures.",
  // Hiérarchie des mesures (ISO 45001 §8.1.2) — verrou de clôture.
  CONTROL_HIERARCHY_REQUIRED:
    "Chaque action corrective doit déclarer son niveau dans la hiérarchie des mesures (élimination, substitution, ingénierie, administratif ou EPI — §8.1.2) avant de clôturer l'incident.",
  // Revue d'efficacité des actions (ISO 45001 §10.2 e).
  EFFECTIVENESS_REVIEW_REQUIRES_COMPLETED:
    "La revue d'efficacité n'est possible qu'une fois l'action réalisée (100 %).",
  EFFECTIVENESS_VERDICT_REQUIRED: "Sélectionnez un verdict d'efficacité avant d'enregistrer la revue.",
  // Bean Validation des actions correctives (ISO 45001 §10.2).
  ACTION_NAME_REQUIRED: "Donnez un intitulé à l'action corrective avant de l'enregistrer.",
  ACTION_NAME_TOO_LONG: "L'intitulé de l'action est trop long (255 caractères maximum).",
  ACTION_DESCRIPTION_TOO_LONG: "La description de l'action est trop longue (5000 caractères maximum).",
  EFFECTIVENESS_VERIFIER_MUST_DIFFER:
    "L'efficacité doit être vérifiée par une personne indépendante : le responsable de l'action ne peut pas juger sa propre action efficace (ISO 45001 §10.2 e).",
  EFFECTIVENESS_STATUS_NOT_SETTABLE_HERE:
    "Les statuts « Vérifiée » et « Rouverte » se posent uniquement via la revue d'efficacité.",
  RISK_COMPONENT_OUT_OF_RANGE: "La probabilité et la gravité doivent être comprises entre 1 et 5.",
  // Analyse causale structurée (ISO 45001 §10.2 a-b).
  INCIDENT_LOCKED: "Cet incident est clôturé ou rejeté : son analyse causale n'est plus modifiable.",
  CAUSAL_METHOD_REQUIRED: "Choisissez une méthode d'analyse (5 Pourquoi, Ishikawa, arbre…).",
  CAUSE_LABEL_REQUIRED: "Décrivez la cause avant de l'ajouter.",
  CAUSAL_ANALYSIS_NOT_FOUND: "L'analyse causale est introuvable. Rechargez la page puis réessayez.",
  CAUSE_NOT_FOUND: "La cause est introuvable. Rechargez la page puis réessayez.",
  // Classification des lésions + heures travaillées (ISO 45001 §9.1.1).
  INJURY_OUTCOME_REQUIRED: "Sélectionnez l'issue de la lésion (LTI, MTC, presque-accident…).",
  INJURY_LOST_DAYS_NEGATIVE: "Le nombre de jours perdus ne peut pas être négatif.",
  INJURY_NOT_FOUND: "La lésion est introuvable. Rechargez la page puis réessayez.",
  WORKED_HOURS_PERIOD_INVALID: "Choisissez un mois valide (1 à 12) et une année.",
  WORKED_HOURS_INVALID: "Le nombre d'heures travaillées doit être positif.",
  // Politique SST (ISO 45001 §5.2 · §5.4).
  COMPANY_REQUIRED: "Sélectionnez une mine active avant de continuer.",
  POLICY_NOT_FOUND: "La politique est introuvable. Rechargez la page puis réessayez.",
  POLICY_LOCKED: "Cette politique est publiée : elle n'est plus modifiable. Créez une nouvelle version pour la réviser.",
  POLICY_ALREADY_PUBLISHED: "Cette politique est déjà publiée.",
  POLICY_NOT_PUBLISHED: "Cette politique n'est pas en vigueur : la prise de connaissance n'est possible que sur la version publiée.",
  SIGNATORY_REQUIRED: "Indiquez le nom du signataire (direction) avant de publier.",
  POLICY_HAS_NO_ARTICLE: "Ajoutez au moins un engagement avant de publier : une politique sans engagement n'engage rien.",
  IDENTITY_REQUIRED: "Votre session n'est pas identifiée. Reconnectez-vous puis réessayez.",
  // Intégrité de l'enquête (ISO 45001 §10.2 · SPEC « obligatoire = persisté »).
  INCIDENT_ID_REQUIRED:
    "Cette enquête doit être rattachée à un incident. Rouvrez-la depuis la fiche de l'incident concerné.",
  // Gouvernance d'enquête — validation par un pair (ISO 45001 §10.2).
  INVESTIGATION_NOT_VALIDATED:
    "L'enquête doit d'abord être validée par un pair avant de pouvoir clôturer cet incident (onglet Investigation).",
  HPI_REQUIRES_VALIDATED_INVESTIGATION:
    "Incident à Haut Potentiel (ICMM · ISO 45001 §6.1.2) : une enquête complète, validée par un pair, est obligatoire avant la clôture — même pour un presque-accident.",
  // Gouvernance d'enquête — frise chronologique (ECFC) & témoignages (§10.2).
  TIMELINE_DESCRIPTION_REQUIRED: "Décrivez le fait avant de l'ajouter à la frise chronologique.",
  WITNESS_STATEMENT_REQUIRED: "Saisissez le contenu du témoignage avant de l'enregistrer.",
  TIMELINE_EVENT_NOT_FOUND: "Ce fait de la frise est introuvable. Rechargez la page puis réessayez.",
  WITNESS_STATEMENT_NOT_FOUND: "Ce témoignage est introuvable. Rechargez la page puis réessayez.",
  INVESTIGATION_ALREADY_VALIDATED: "Cette enquête a déjà été validée.",
  VALIDATOR_MUST_BE_INDEPENDENT:
    "La validation doit être réalisée par un pair indépendant : un membre de l'équipe d'enquête ne peut pas valider sa propre enquête.",
  VALIDATION_ACTOR_REQUIRED:
    "Impossible d'identifier le validateur. Reconnectez-vous puis réessayez.",
  VALIDATION_COMMENT_TOO_LONG:
    "Le commentaire de validation est trop long (2000 caractères maximum).",
  // Reporting réglementaire (ISO 45001 §7.5.3 · E3.1).
  INCIDENT_ALREADY_NOTIFIED: "Cet incident a déjà été déclaré à l'autorité.",
  INCIDENT_NOT_NOTIFIABLE:
    "Marquez d'abord l'incident comme notifiable avant d'enregistrer la déclaration à l'autorité.",
};

export function notifyError(err: any, fallback = "Une erreur est survenue"): void {
  // 1) Erreur reseau / timeout : aucune reponse HTTP recue.
  //    On ne renvoie PAS un message vide (l'ancien code affichait alors
  //    « Une erreur est survenue » sans indication actionnable).
  if (!err?.response) {
    const isTimeout =
      err?.code === "ECONNABORTED" || /timeout/i.test(err?.message ?? "");
    errorNotification(
      isTimeout
        ? "Le serveur met trop de temps à répondre (délai dépassé). Vérifiez votre connexion et réessayez."
        : "Service momentanément injoignable. Vérifiez votre connexion internet et réessayez."
    );
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[notifyError] network/timeout code=${err?.code ?? "n/a"}`, err);
    }
    return;
  }

  // 2) Reponse HTTP recue : privilegie le code metier connu, sinon le message brut.
  const raw: string =
    err?.response?.data?.errorMessage ||
    err?.response?.data?.message ||
    err?.message ||
    fallback;
  // 403 sans code metier connu (ex. @PreAuthorize -> « Access denied. ») : message
  // generique d'autorisation plutot que le libelle technique brut. Une RESPONSE
  // portant un code metier connu (mappe ci-dessous) garde son message specifique.
  const status = err?.response?.status;
  const message =
    CODE_MESSAGES[raw] ??
    (status === 403 && !CODE_MESSAGES[raw]
      ? "Vous n'avez pas les droits nécessaires pour effectuer cette action."
      : raw ?? fallback);

  // Affichage de la notification Mantine (rouge)
  errorNotification(message);

  // Logging detaille uniquement en mode developpement.
  // `import.meta.env.DEV` est defini par Vite (true en dev, false en build prod).
  if (import.meta.env?.DEV) {
    // On garde un seul console.error pour rester lisible dans la devtools.
    // eslint-disable-next-line no-console
    console.error(
      `[notifyError] status=${status ?? "n/a"} message="${err?.message ?? "n/a"}"`,
      err
    );
  }
}
