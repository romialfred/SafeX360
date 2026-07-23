package com.minexpert.hns.api.users;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CATALOGUE DES MODULES — source unique cote serveur.
 *
 * <p>Toute la chaine des droits s'appuie sur cette liste : la matrice affichee a
 * l'administrateur (chargee via {@code GET /users/permissions/catalog}), la
 * validation des cles recues a l'enregistrement, et le filtrage du menu cote IHM.
 * Un module absent d'ici n'est pas attribuable ; un module present l'est partout.
 *
 * <p>Pourquoi cette classe existe : la liste des modules etait auparavant ecrite
 * TROIS fois — colonnes SQL de {@code permission_management}, vocabulaire du menu,
 * matrice du formulaire de creation — et les trois avaient diverge. Des modules
 * livres depuis (gestion des erreurs, registre des equipements, opportunites SST,
 * programme d'audit, standards ISO, cibles et previsions…) n'etaient attribuables
 * nulle part, et « gestion des erreurs » etait meme propose par la matrice alors
 * qu'aucune colonne ne pouvait le stocker : le droit etait perdu en silence.
 *
 * <p>AJOUTER UN MODULE : une seule ligne ici. Le stockage (colonne CSV
 * {@code allowed_modules}) n'exige aucune migration.
 */
public final class ModuleCatalog {

    private ModuleCatalog() { }

    /**
     * Un module attribuable.
     *
     * @param key        cle technique, identique cote IHM (camelCase)
     * @param category   regroupement d'affichage
     * @param mineManaged {@code true} si l'acces depend AUSSI de l'activation du
     *                   module sur la mine (Gestion des Modules). Ces modules
     *                   restent attribuables par utilisateur : les deux conditions
     *                   se cumulent.
     */
    public record Module(String key, String category, boolean mineManaged) { }

    private static Module m(String key, String category) {
        return new Module(key, category, false);
    }

    private static Module mine(String key, String category) {
        return new Module(key, category, true);
    }

    /** Ordre volontaire : il est repris tel quel par l'IHM. */
    public static final List<Module> MODULES = List.of(
            m("home", "general"),
            m("notifications", "general"),

            m("incidentManagement", "incidents"),
            m("investigations", "incidents"),
            m("actionPlansInc", "incidents"),
            m("nonConformity", "incidents"),

            m("errorManagement", "errorManagement"),

            m("inspections", "preventive"),
            m("meetings", "preventive"),
            m("managementTour", "preventive"),
            m("equipmentRegistry", "preventive"),

            m("pendingActions", "corrective"),
            m("actionPlan", "corrective"),
            m("recommendations", "corrective"),
            m("adhocActions", "corrective"),

            m("riskOverview", "risks"),
            m("riskRegister", "risks"),
            m("riskAssessment", "risks"),
            m("chemicalRegister", "risks"),
            m("riskOpportunities", "risks"),

            m("ppeOverview", "ppe"),
            m("ppeMonitoring", "ppe"),
            m("ppeRequest", "ppe"),

            m("auditProgram", "audits"),
            m("auditPlan", "audits"),
            m("audits", "audits"),
            m("auditRecommendations", "audits"),

            m("complianceDashboard", "compliance"),
            m("requirements", "compliance"),
            m("positionAssignments", "compliance"),
            m("employeeAssignments", "compliance"),

            m("documents", "documentation"),
            m("documentValidation", "documentation"),
            m("lessonsLearned", "documentation"),
            m("documentManager", "documentation"),
            m("isoDocuments", "documentation"),
            m("processDocs", "documentation"),

            m("commDashboard", "communication"),
            m("employeeComm", "communication"),

            m("targetForecast", "performance"),

            m("usersManagement", "administration"),
            m("settings", "administration"),
            m("modulesManagement", "administration"),

            // Modules dont l'activation depend AUSSI de la mine.
            mine("emergency", "mineManaged"),
            mine("dosimetry", "mineManaged"),
            mine("blast", "mineManaged"),
            mine("planning", "mineManaged"),
            mine("reports", "mineManaged"));

    public static final Set<String> KEYS =
            MODULES.stream().map(Module::key).collect(Collectors.toUnmodifiableSet());

    /**
     * Modules ajoutes APRES la mise en place des colonnes « une par module ».
     * Ils n'ont pas de colonne dediee et n'existent que dans la colonne CSV.
     * Sert au rattrapage des profils existants (voir la migration SQL) : ils
     * etaient visibles pour tout le monde faute de controle, les retirer d'office
     * aurait retire des acces en place.
     */
    public static final Set<String> WITHOUT_LEGACY_COLUMN = Set.of(
            "errorManagement", "equipmentRegistry", "riskOpportunities", "auditProgram",
            "isoDocuments", "processDocs", "targetForecast", "modulesManagement",
            "emergency", "dosimetry", "blast", "planning", "reports");

    /** Ne conserve que les cles connues — une cle inventee par un client est ignoree. */
    public static Set<String> sanitize(Set<String> requested) {
        return requested.stream().filter(KEYS::contains).collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    /** Catalogue serialisable pour l'IHM : categorie -> liste de modules. */
    public static List<Map<String, Object>> asPayload() {
        Map<String, List<Module>> byCategory = new LinkedHashMap<>();
        for (Module module : MODULES) {
            byCategory.computeIfAbsent(module.category(), ignored -> new java.util.ArrayList<>()).add(module);
        }
        return byCategory.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> category = new LinkedHashMap<>();
                    category.put("category", entry.getKey());
                    category.put("modules", entry.getValue().stream()
                            .map(module -> {
                                Map<String, Object> item = new LinkedHashMap<>();
                                item.put("key", module.key());
                                item.put("mineManaged", module.mineManaged());
                                return item;
                            })
                            .collect(Collectors.toList()));
                    return category;
                })
                .collect(Collectors.toList());
    }
}
