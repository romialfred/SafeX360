package com.minexpert.hns.ai.service;

import java.util.List;

import org.springframework.stereotype.Component;

import com.minexpert.hns.ai.dto.AIAnalysisResponse;
import com.minexpert.hns.ai.dto.CorrectiveAction;
import com.minexpert.hns.ai.dto.IdentifiedRisk;

/**
 * AIMockFallback — Réponses simulées réalistes par scénario HSE.
 *
 * Utilisé en mode démo / développement local pour pouvoir tester le workflow
 * complet sans coûts API Anthropic. Plusieurs scénarios sont disponibles et
 * sélectionnés en rotation déterministe basée sur la taille de l'image.
 *
 * Scénarios couverts :
 *  - FALL_FROM_HEIGHT : échafaudage non sécurisé
 *  - EPI_MISSING : opérateur sans casque ou harnais
 *  - CHEMICAL : fuite produit chimique / barils corrodés
 *  - ELECTRICAL : tableau électrique ouvert / câblage exposé
 *  - MECHANICAL : zone non balisée près d'engin
 *  - FIRE : extincteur obstrué / sortie de secours bloquée
 */
@Component
public class AIMockFallback {

    /**
     * Génère une réponse d'analyse simulée mais cohérente.
     * Rotation déterministe entre 6 scénarios HSE selon la taille de l'image.
     */
    public AIAnalysisResponse buildMockResponse(int imageSizeKb, String mineContext) {
        int scenario = Math.abs(imageSizeKb) % 6;
        AIAnalysisResponse r = switch (scenario) {
            case 0 -> buildFallScenario(mineContext);
            case 1 -> buildEpiScenario(mineContext);
            case 2 -> buildChemicalScenario(mineContext);
            case 3 -> buildElectricalScenario(mineContext);
            case 4 -> buildMechanicalScenario(mineContext);
            default -> buildFireScenario(mineContext);
        };

        r.setFromMock(true);
        r.setAiModel("mock-v2-scenario-" + scenario);
        // Variation légère sur durée pour réalisme
        r.setDurationMs(2200 + (imageSizeKb % 9) * 240L);
        return r;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCÉNARIO 1 : Chute de hauteur — échafaudage non sécurisé
    // ─────────────────────────────────────────────────────────────────────
    private AIAnalysisResponse buildFallScenario(String mineContext) {
        AIAnalysisResponse r = new AIAnalysisResponse();
        r.setHseRelevant(true);
        r.setConfidence(0.84);
        r.setIncidentType("QUASI_ACCIDENT");
        r.setCategory("FALL_FROM_HEIGHT");
        r.setTitle("Échafaudage non sécurisé — accès en hauteur");
        r.setDescription(
                "L'image montre une plateforme de travail élevée (>2m) avec un opérateur visible. "
                + "Le garde-corps réglementaire (lisse haute 1m + plinthe + lisse intermédiaire) n'est "
                + "pas en place sur au moins une face. Aucun dispositif d'arrêt de chute (point d'ancrage, "
                + "harnais avec longe) n'est identifiable sur l'opérateur. La surface de travail semble "
                + "encombrée d'outils et matériaux non rangés."
                + (mineContext != null ? " Contexte fourni : " + mineContext : "")
        );
        r.setSeverity("HIGH");
        r.setIdentifiedRisks(List.of(
                new IdentifiedRisk("Chute de hauteur >2m sans dispositif d'arrêt", 4, 3),
                new IdentifiedRisk("Absence de garde-corps réglementaire (NF EN 13374)", 4, 4),
                new IdentifiedRisk("Port d'EPI anti-chute non vérifié", 3, 3),
                new IdentifiedRisk("Encombrement de la zone (trip hazard)", 2, 4)
        ));
        r.setRootCauseHypothesis(
                "Possible défaillance dans la procédure de montage d'échafaudage ou non-respect "
                + "des consignes de port d'EPI lors d'un travail en hauteur. Manque potentiel de "
                + "formation R408 ou supervision insuffisante."
        );
        r.setIsoClauses(List.of(
                "ISO 45001 §8.1.2 — Élimination des dangers et réduction des risques",
                "ISO 45001 §6.1.2.1 — Identification des dangers",
                "ISO 45001 §7.2 — Compétence"
        ));
        r.setCorrectiveActions(List.of(
                new CorrectiveAction("P0", "Évacuer la zone de travail en hauteur immédiatement", "Immédiat", "ELIMINATION"),
                new CorrectiveAction("P1", "Installer des garde-corps conformes NF EN 13374 (lisses + plinthe)", "24h", "ENGINEERING"),
                new CorrectiveAction("P1", "Vérifier l'attribution et le port effectif des harnais anti-chute", "24h", "PPE"),
                new CorrectiveAction("P2", "Former l'équipe de montage d'échafaudage (R408 / formation R457)", "7j", "ADMINISTRATIVE"),
                new CorrectiveAction("P3", "Réviser la procédure interne de travail en hauteur", "30j", "ADMINISTRATIVE")
        ));
        r.setRemediationPlan(
                "Étape 1 — Sécurisation immédiate : interrompre toute activité en hauteur sur cette zone et baliser le périmètre.\n"
                + "Étape 2 — Diagnostic conformité : faire intervenir un préventeur HSE pour vérifier la conformité de l'échafaudage avec la norme R457.\n"
                + "Étape 3 — Mise aux normes : installer garde-corps + plinthe + lisse intermédiaire, vérifier ancrages, contrôle visuel quotidien.\n"
                + "Étape 4 — Formation : organiser une causerie sécurité avec l'équipe concernée (durée 30 min) et tracer la participation dans SafeX 360.\n"
                + "Étape 5 — Revue procédure : mettre à jour le mode opératoire interne et faire signer par tous les opérateurs concernés.\n"
                + "Étape 6 — Vérification efficacité : audit terrain à J+15 et J+30 pour confirmer la fermeture définitive de la non-conformité."
        );
        return r;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCÉNARIO 2 : EPI manquant — opérateur sans casque
    // ─────────────────────────────────────────────────────────────────────
    private AIAnalysisResponse buildEpiScenario(String mineContext) {
        AIAnalysisResponse r = new AIAnalysisResponse();
        r.setHseRelevant(true);
        r.setConfidence(0.91);
        r.setIncidentType("NON_CONFORMITY");
        r.setCategory("EPI_MISSING");
        r.setTitle("Non-port d'EPI obligatoires en zone à risque");
        r.setDescription(
                "Un opérateur est visible en zone d'opération sans port complet des EPI obligatoires. "
                + "Le casque de protection (NF EN 397) ne semble pas porté ou est posé à proximité. "
                + "Les chaussures de sécurité (NF EN ISO 20345) ne sont pas clairement identifiables. "
                + "Le gilet haute-visibilité (EN ISO 20471) est absent malgré la circulation d'engins "
                + "à proximité visible."
                + (mineContext != null ? " Site : " + mineContext : "")
        );
        r.setSeverity("HIGH");
        r.setIdentifiedRisks(List.of(
                new IdentifiedRisk("Chute d'objets sans protection crânienne", 5, 3),
                new IdentifiedRisk("Écrasement par engin en mouvement (faible visibilité)", 5, 2),
                new IdentifiedRisk("Blessure aux pieds (chaussures non conformes)", 3, 3)
        ));
        r.setRootCauseHypothesis(
                "Possible relâchement des contrôles d'accès au site, absence de contrôle EPI à "
                + "l'entrée de zone, ou défaillance dans la sensibilisation. À investiguer : "
                + "disponibilité des EPI au magasin, taille adaptée, état du parc."
        );
        r.setIsoClauses(List.of(
                "ISO 45001 §8.1.2 — Hiérarchie des contrôles (EPI = dernier niveau)",
                "ISO 45001 §7.4.2 — Communication interne",
                "ISO 45001 §7.3 — Sensibilisation"
        ));
        r.setCorrectiveActions(List.of(
                new CorrectiveAction("P0", "Interpeller immédiatement l'opérateur et faire mettre les EPI", "Immédiat", "ADMINISTRATIVE"),
                new CorrectiveAction("P1", "Vérifier le stock EPI au magasin (casques, chaussures, gilets)", "24h", "PPE"),
                new CorrectiveAction("P1", "Mettre en place un contrôle EPI systématique à l'entrée de zone", "72h", "ADMINISTRATIVE"),
                new CorrectiveAction("P2", "Organiser une causerie sécurité sur le port des EPI (toute l'équipe)", "7j", "ADMINISTRATIVE"),
                new CorrectiveAction("P3", "Mettre en place un audit EPI hebdomadaire avec scoring", "30j", "ADMINISTRATIVE")
        ));
        r.setRemediationPlan(
                "Étape 1 — Sanction immédiate : retour au vestiaire avec rappel verbal de la consigne EPI.\n"
                + "Étape 2 — Diagnostic disponibilité : audit du magasin EPI sur les 3 dernières semaines (entrées/sorties, ruptures).\n"
                + "Étape 3 — Renforcement contrôle : déploiement d'un agent de sécurité au point d'accès avec checklist EPI obligatoire.\n"
                + "Étape 4 — Sensibilisation : causerie 15 min sur les conséquences réelles d'un accident sans EPI (cas réels du secteur minier).\n"
                + "Étape 5 — Affichage : panneaux 'EPI OBLIGATOIRE' visibles à toutes les entrées de zone.\n"
                + "Étape 6 — Mesure d'efficacité : indicateur 'taux de port EPI conforme' contrôlé chaque semaine pendant 3 mois."
        );
        return r;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCÉNARIO 3 : Fuite chimique / barils corrodés
    // ─────────────────────────────────────────────────────────────────────
    private AIAnalysisResponse buildChemicalScenario(String mineContext) {
        AIAnalysisResponse r = new AIAnalysisResponse();
        r.setHseRelevant(true);
        r.setConfidence(0.78);
        r.setIncidentType("DANGER");
        r.setCategory("CHEMICAL");
        r.setTitle("Stockage de produits chimiques non conforme");
        r.setDescription(
                "L'image révèle des fûts ou contenants de produits chimiques stockés dans des "
                + "conditions non conformes. Présence de traces de corrosion / fuites visibles sur "
                + "certains contenants. L'étiquetage SGH n'est pas toujours lisible. La rétention "
                + "(bac ou rétention secondaire) ne semble pas en place. Une éventuelle proximité "
                + "avec d'autres produits (incompatibilité chimique) est à vérifier."
                + (mineContext != null ? " Localisation : " + mineContext : "")
        );
        r.setSeverity("CRITICAL");
        r.setIdentifiedRisks(List.of(
                new IdentifiedRisk("Fuite produit chimique dans le sol (pollution)", 4, 4),
                new IdentifiedRisk("Inhalation vapeurs toxiques par opérateurs", 5, 3),
                new IdentifiedRisk("Réaction incompatible entre produits stockés", 5, 2),
                new IdentifiedRisk("Brûlure chimique par contact peau/yeux", 4, 3)
        ));
        r.setRootCauseHypothesis(
                "Probable défaillance dans la procédure de gestion des stocks chimiques : "
                + "non-respect de la durée maximale de stockage, absence de plan de rétention, "
                + "défaut de formation sur SGH/CLP. Le local de stockage n'est peut-être pas "
                + "conforme à la réglementation ICPE."
        );
        r.setIsoClauses(List.of(
                "ISO 14001 §8.1 — Maîtrise opérationnelle (gestion des produits dangereux)",
                "ISO 45001 §8.1.2 — Élimination des dangers",
                "ISO 45001 §6.1.2.2 — Évaluation des risques"
        ));
        r.setCorrectiveActions(List.of(
                new CorrectiveAction("P0", "Évacuer la zone et baliser périmètre de sécurité (10m)", "Immédiat", "ELIMINATION"),
                new CorrectiveAction("P0", "Faire intervenir l'équipe HAZMAT pour confinement des fuites", "Immédiat", "ENGINEERING"),
                new CorrectiveAction("P1", "Identifier précisément les produits et consulter les FDS", "12h", "ADMINISTRATIVE"),
                new CorrectiveAction("P1", "Installer un bac de rétention conforme (110% du volume)", "72h", "ENGINEERING"),
                new CorrectiveAction("P2", "Refondre le plan de stockage chimique selon matrice d'incompatibilité", "7j", "ADMINISTRATIVE"),
                new CorrectiveAction("P3", "Former toute l'équipe maintenance au SGH et port d'EPI chimique", "30j", "ADMINISTRATIVE")
        ));
        r.setRemediationPlan(
                "Étape 1 — URGENCE : confinement immédiat des fuites avec absorbants conformes, port d'EPI chimique (combinaison + masque + gants nitrile).\n"
                + "Étape 2 — Identification : récupération des FDS de chaque produit, contrôle de l'étiquetage SGH, séparation des produits incompatibles.\n"
                + "Étape 3 — Mise en conformité physique : installation de bacs de rétention 110%, ventilation forcée du local, séparation acides/bases.\n"
                + "Étape 4 — Mise à jour DUERP : intégration des risques chimiques avec mesures de prévention conformes (substitution si possible, ventilation, EPI).\n"
                + "Étape 5 — Formation : module obligatoire SGH/CLP pour tous les opérateurs accédant à la zone (durée 2h, validation par QCM).\n"
                + "Étape 6 — Procédure : créer une instruction de travail pour le stockage chimique avec checklist hebdomadaire de vérification."
        );
        return r;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCÉNARIO 4 : Risque électrique
    // ─────────────────────────────────────────────────────────────────────
    private AIAnalysisResponse buildElectricalScenario(String mineContext) {
        AIAnalysisResponse r = new AIAnalysisResponse();
        r.setHseRelevant(true);
        r.setConfidence(0.86);
        r.setIncidentType("DANGER");
        r.setCategory("ELECTRICAL");
        r.setTitle("Armoire électrique ouverte — risque de contact direct");
        r.setDescription(
                "Une armoire ou un tableau électrique est visible ouvert(e), exposant des "
                + "conducteurs sous tension. Aucun signaleur 'consigné / hors service' n'est "
                + "présent. Les protections IP semblent compromises. Aucune barrière ou "
                + "balisage n'isole la zone des passants. Cette situation présente un risque "
                + "immédiat d'électrocution ou d'arc électrique."
                + (mineContext != null ? " Lieu : " + mineContext : "")
        );
        r.setSeverity("CRITICAL");
        r.setIdentifiedRisks(List.of(
                new IdentifiedRisk("Électrocution par contact direct (BT ou HT)", 5, 4),
                new IdentifiedRisk("Arc électrique / flash (brûlures graves)", 5, 3),
                new IdentifiedRisk("Court-circuit avec incendie consécutif", 4, 3)
        ));
        r.setRootCauseHypothesis(
                "Probable intervention de maintenance en cours sans procédure de consignation "
                + "électrique (LOTO). Le technicien a quitté la zone sans refermer l'armoire ou "
                + "sans signalisation. Le titre d'habilitation pourrait ne pas être valide."
        );
        r.setIsoClauses(List.of(
                "ISO 45001 §8.1.2 — Maîtrise opérationnelle (LOTO)",
                "ISO 45001 §7.2 — Compétence (habilitation électrique)",
                "ISO 45001 §6.1.2.1 — Identification des dangers"
        ));
        r.setCorrectiveActions(List.of(
                new CorrectiveAction("P0", "Baliser zone à 3m + interdire passage tant qu'armoire ouverte", "Immédiat", "ENGINEERING"),
                new CorrectiveAction("P0", "Localiser et rappeler le technicien responsable", "Immédiat", "ADMINISTRATIVE"),
                new CorrectiveAction("P1", "Vérifier validité habilitation électrique de l'intervenant", "24h", "ADMINISTRATIVE"),
                new CorrectiveAction("P1", "Mettre en place procédure LOTO (consignation/déconsignation)", "72h", "ADMINISTRATIVE"),
                new CorrectiveAction("P2", "Auditer l'ensemble des armoires électriques du site", "7j", "ADMINISTRATIVE"),
                new CorrectiveAction("P3", "Former tous les électriciens aux principes LOTO/NF C18-510", "30j", "ADMINISTRATIVE")
        ));
        r.setRemediationPlan(
                "Étape 1 — Sécurisation : fermer l'armoire immédiatement (par habilité BR uniquement) ou baliser à 3m avec interdiction de passage.\n"
                + "Étape 2 — Identification : retrouver le titre d'habilitation de la personne qui a ouvert l'armoire et la procédure suivie.\n"
                + "Étape 3 — Audit habilitations : revue de toutes les habilitations électriques B0/BS/BR/BC du site, mise à jour si expirées.\n"
                + "Étape 4 — Procédure LOTO : déploiement du système Lock-Out Tag-Out avec cadenas individuels par habilité.\n"
                + "Étape 5 — Formation : recyclage NF C18-510 pour tous les habilités, validation pratique sur un poste représentatif.\n"
                + "Étape 6 — Contrôle périodique : audit mensuel par le responsable maintenance sur 10 armoires aléatoires, traçabilité dans SafeX 360."
        );
        return r;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCÉNARIO 5 : Risque mécanique — zone non balisée près d'engin
    // ─────────────────────────────────────────────────────────────────────
    private AIAnalysisResponse buildMechanicalScenario(String mineContext) {
        AIAnalysisResponse r = new AIAnalysisResponse();
        r.setHseRelevant(true);
        r.setConfidence(0.81);
        r.setIncidentType("QUASI_ACCIDENT");
        r.setCategory("MECHANICAL");
        r.setTitle("Co-activité piéton/engin sans séparation matérialisée");
        r.setDescription(
                "L'image montre une zone où des piétons circulent à proximité immédiate d'un "
                + "engin de chantier en activité (chargeuse, camion-benne, foreuse...). Aucune "
                + "séparation matérialisée (barrière, glissière, marquage au sol) n'est visible. "
                + "Le champ de vision du conducteur est probablement limité (angles morts). "
                + "Aucun gestionnaire de circulation n'est identifié sur la zone."
                + (mineContext != null ? " Zone : " + mineContext : "")
        );
        r.setSeverity("HIGH");
        r.setIdentifiedRisks(List.of(
                new IdentifiedRisk("Écrasement par engin en marche arrière (angle mort)", 5, 3),
                new IdentifiedRisk("Heurt par chargement instable", 4, 3),
                new IdentifiedRisk("Glissade dans la zone de circulation", 2, 4)
        ));
        r.setRootCauseHypothesis(
                "Plan de circulation site inexistant ou non respecté. Aucune analyse de "
                + "co-activité préalable. Le poste de gestionnaire de circulation n'est "
                + "peut-être pas créé ou n'est pas dans le planning du jour."
        );
        r.setIsoClauses(List.of(
                "ISO 45001 §8.1.2 — Élimination des dangers",
                "ISO 45001 §6.1.2.1 — Identification des dangers",
                "ISO 45001 §8.1.4 — Maîtrise des fournisseurs externes (sous-traitants engins)"
        ));
        r.setCorrectiveActions(List.of(
                new CorrectiveAction("P0", "Arrêter les engins en activité dans la zone immédiatement", "Immédiat", "ELIMINATION"),
                new CorrectiveAction("P0", "Évacuer les piétons hors de la zone d'évolution des engins", "Immédiat", "ADMINISTRATIVE"),
                new CorrectiveAction("P1", "Tracer un plan de circulation séparé piétons/engins", "72h", "ENGINEERING"),
                new CorrectiveAction("P1", "Installer barrières / glissières aux croisements", "7j", "ENGINEERING"),
                new CorrectiveAction("P2", "Affecter un gestionnaire de circulation aux heures de pointe", "7j", "ADMINISTRATIVE"),
                new CorrectiveAction("P3", "Équiper tous les engins de caméras de recul + bip + gyrophare", "30j", "ENGINEERING")
        ));
        r.setRemediationPlan(
                "Étape 1 — Arrêt immédiat : interdire la co-activité piéton/engin sur la zone jusqu'à mise aux normes.\n"
                + "Étape 2 — Audit circulation : cartographier les flux piétons et engins sur le site, identifier les points critiques.\n"
                + "Étape 3 — Aménagement physique : tracer un cheminement piéton balisé (peinture + barrières) à >2m des zones engins.\n"
                + "Étape 4 — Équipement engins : vérifier que tous les engins disposent de bip de recul, caméra, gyrophare jaune.\n"
                + "Étape 5 — Gestionnaire de circulation : créer le poste avec gilet rouge + radio, présent aux heures de forte activité.\n"
                + "Étape 6 — Procédure : créer un mode opératoire 'circulation site' validé par CSE/CSSCT, affichage à toutes les entrées."
        );
        return r;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCÉNARIO 6 : Risque incendie / extincteur obstrué
    // ─────────────────────────────────────────────────────────────────────
    private AIAnalysisResponse buildFireScenario(String mineContext) {
        AIAnalysisResponse r = new AIAnalysisResponse();
        r.setHseRelevant(true);
        r.setConfidence(0.79);
        r.setIncidentType("NON_CONFORMITY");
        r.setCategory("FIRE");
        r.setTitle("Moyens de secours incendie inaccessibles");
        r.setDescription(
                "L'image révèle qu'un extincteur ou un poste de sécurité incendie (RIA, BAES, "
                + "porte coupe-feu) est obstrué par du stockage, des palettes ou du matériel. "
                + "La signalisation au sol (1m libre minimum) n'est pas respectée. En cas de "
                + "départ de feu, le délai d'accès au moyen de secours serait critique."
                + (mineContext != null ? " Zone : " + mineContext : "")
        );
        r.setSeverity("MEDIUM");
        r.setIdentifiedRisks(List.of(
                new IdentifiedRisk("Délai d'intervention rallongé en cas d'incendie", 4, 3),
                new IdentifiedRisk("Propagation d'un départ de feu non maîtrisé", 4, 2),
                new IdentifiedRisk("Évacuation entravée si voies bloquées", 5, 2)
        ));
        r.setRootCauseHypothesis(
                "Probable manque d'espace de stockage qui pousse à occuper les zones réservées "
                + "aux moyens de secours. Absence de contrôle visuel régulier de la part du "
                + "responsable sécurité du bâtiment."
        );
        r.setIsoClauses(List.of(
                "ISO 45001 §8.2 — Préparation et réponse aux situations d'urgence",
                "ISO 45001 §8.1.2 — Maîtrise opérationnelle",
                "ISO 45001 §6.1.2.1 — Identification des dangers"
        ));
        r.setCorrectiveActions(List.of(
                new CorrectiveAction("P0", "Dégager immédiatement l'accès à l'extincteur (zone 1m libre)", "Immédiat", "ELIMINATION"),
                new CorrectiveAction("P1", "Tracer une zone interdite au sol autour des moyens de secours", "24h", "ENGINEERING"),
                new CorrectiveAction("P2", "Mettre en place une ronde quotidienne de contrôle des moyens d'urgence", "7j", "ADMINISTRATIVE"),
                new CorrectiveAction("P2", "Vérifier la pression de l'extincteur et sa date de péremption", "7j", "ENGINEERING"),
                new CorrectiveAction("P3", "Revoir l'organisation du stockage du local concerné", "30j", "ADMINISTRATIVE")
        ));
        r.setRemediationPlan(
                "Étape 1 — Dégagement : libérer immédiatement la zone réglementaire autour de tous les moyens de secours du local.\n"
                + "Étape 2 — Marquage au sol : peindre une zone hachurée rouge/blanc 'NE RIEN STOCKER' d'1m autour de chaque extincteur.\n"
                + "Étape 3 — Audit complet : faire un état des lieux de tous les moyens de secours du site (extincteurs, RIA, BAES, plans d'évacuation).\n"
                + "Étape 4 — Vérification annuelle : valider que la maintenance Q4 a été effectuée par société agréée, archiver les rapports.\n"
                + "Étape 5 — Ronde quotidienne : créer une fiche de contrôle visuel à compléter chaque matin par le responsable sécurité du bâtiment.\n"
                + "Étape 6 — Exercice d'évacuation : planifier un exercice incendie dans les 30 jours avec chronométrage et débriefing."
        );
        return r;
    }
}
