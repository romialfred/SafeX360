package com.hrms.directory;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * LOT 52 — annuaire Active Directory SIMULÉ.
 *
 * Utilisé tant que demoMode=true (aucun serveur LDAP requis) : permet de
 * démontrer le parcours « importer depuis AD » de bout en bout avec un jeu
 * de données réaliste couvrant les deux mines de la plateforme. Le mot de
 * passe de TOUS les comptes démo est « SafeX-AD-2026 » (authentification
 * déléguée simulée).
 */
public final class DemoDirectory {

    public static final String DEMO_PASSWORD = "SafeX-AD-2026";

    private static final List<DirectoryUserDTO> USERS = List.of(
            entry("akone",      "aicha.kone@minexpert-or.ci",        "Aïcha Koné",            "Production",              "Chef de poste extraction"),
            entry("jbouattara", "jb.ouattara@minexpert-or.ci",       "Jean-Baptiste Ouattara","Maintenance",             "Ingénieur maintenance"),
            entry("mdiabate",   "mariam.diabate@minexpert-or.ci",    "Mariam Diabaté",        "HSE",                     "Superviseure HSE"),
            entry("syeo",       "souleymane.yeo@minexpert-or.ci",    "Souleymane Yéo",        "Laboratoire",             "Chimiste analyste"),
            entry("fbamba",     "fatou.bamba@minexpert-or.ci",       "Fatou Bamba",           "Ressources Humaines",     "Chargée de formation"),
            entry("kkouame",    "kofi.kouame@minexpert-or.ci",       "Kofi Kouamé",           "Logistique",              "Coordinateur transport"),
            entry("etremblay",  "emilie.tremblay@canadianmining.ca", "Émilie Tremblay",       "Production",              "Mine Operations Manager"),
            entry("lmacdonald", "liam.macdonald@canadianmining.ca",  "Liam MacDonald",        "Maintenance",             "Reliability Engineer"),
            entry("sgagnon",    "sophie.gagnon@canadianmining.ca",   "Sophie Gagnon",         "HSE",                     "EHS Superintendent"),
            entry("nsingh",     "noah.singh@canadianmining.ca",      "Noah Singh",            "Géologie",                "Senior Geologist"),
            entry("cbouchard",  "camille.bouchard@canadianmining.ca","Camille Bouchard",      "Environnement",           "Environmental Advisor"),
            entry("wfortin",    "william.fortin@canadianmining.ca",  "William Fortin",        "Forage & Dynamitage",     "Blast Supervisor"),
            entry("ndembele",   "nana.dembele@minexpert-or.ci",      "Nana Dembélé",          "Direction",               "Directrice d'exploitation"),
            entry("rthompson",  "ryan.thompson@canadianmining.ca",   "Ryan Thompson",         "Direction",               "General Manager")
    );

    private DemoDirectory() {
    }

    private static DirectoryUserDTO entry(String login, String email, String name, String dept, String title) {
        return new DirectoryUserDTO(login, email, name, dept, title, false);
    }

    /** Recherche insensible à la casse et aux accents sur login, email, nom, département. */
    public static List<DirectoryUserDTO> search(String query) {
        String q = normalize(query);
        return USERS.stream()
                .filter(u -> q.isEmpty()
                        || normalize(u.getLogin()).contains(q)
                        || normalize(u.getEmail()).contains(q)
                        || normalize(u.getDisplayName()).contains(q)
                        || normalize(u.getDepartment()).contains(q))
                .map(u -> new DirectoryUserDTO(u.getLogin(), u.getEmail(), u.getDisplayName(),
                        u.getDepartment(), u.getTitle(), false))
                .collect(Collectors.toList());
    }

    public static boolean authenticate(String login, String password) {
        return USERS.stream().anyMatch(u -> u.getLogin().equalsIgnoreCase(login))
                && DEMO_PASSWORD.equals(password);
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
