package com.hrms.directory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Annuaire synthétique réservé aux profils dev/test.
 *
 * Les identifiants sont générés en mémoire à chaque démarrage et utilisent le
 * domaine non routable {@code example.invalid}. Le mot de passe est injecté à
 * l'exécution ; aucune donnée d'authentification n'est persistée dans le dépôt.
 */
public final class DemoDirectory {

    private static final int USER_COUNT = 14;
    private static final List<String> DEPARTMENTS = List.of(
            "Safety", "Operations", "Maintenance", "Environment", "Human Resources",
            "Finance", "Laboratory"
    );
    private static final List<String> TITLES = List.of(
            "Coordinateur HSE", "Superviseur", "Technicien", "Auditeur"
    );
    private static final List<DirectoryUserDTO> USERS = generateUsers();

    private DemoDirectory() {
    }

    private static List<DirectoryUserDTO> generateUsers() {
        String processId = UUID.randomUUID().toString().substring(0, 8);
        return IntStream.range(0, USER_COUNT)
                .mapToObj(index -> {
                    String login = "safex-demo-" + String.format("%02d", index + 1) + "-" + processId;
                    return entry(
                            login,
                            login + "@example.invalid",
                            "Utilisateur démonstration " + String.format("%02d", index + 1),
                            DEPARTMENTS.get(index % DEPARTMENTS.size()),
                            TITLES.get(index % TITLES.size())
                    );
                })
                .toList();
    }

    private static DirectoryUserDTO entry(String login, String email, String name, String dept, String title) {
        return new DirectoryUserDTO(login, email, name, dept, title, false);
    }

    /** Recherche insensible à la casse et aux accents sur login, email, nom, département. */
    public static List<DirectoryUserDTO> search(String query) {
        String q = normalize(query);
        return USERS.stream()
                .filter(user -> q.isEmpty()
                        || normalize(user.getLogin()).contains(q)
                        || normalize(user.getEmail()).contains(q)
                        || normalize(user.getDisplayName()).contains(q)
                        || normalize(user.getDepartment()).contains(q))
                .map(user -> new DirectoryUserDTO(
                        user.getLogin(), user.getEmail(), user.getDisplayName(),
                        user.getDepartment(), user.getTitle(), false))
                .collect(Collectors.toList());
    }

    public static boolean authenticate(String login, String password, String expectedPassword) {
        if (login == null || password == null || expectedPassword == null || expectedPassword.isBlank()) {
            return false;
        }
        boolean validPassword = MessageDigest.isEqual(
                password.getBytes(StandardCharsets.UTF_8),
                expectedPassword.getBytes(StandardCharsets.UTF_8));
        return USERS.stream().anyMatch(user -> user.getLogin().equalsIgnoreCase(login))
                && validPassword;
    }

    private static String normalize(String value) {
        if (value == null) return "";
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
