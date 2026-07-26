package com.hrms.governance;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/**
 * Garde anti-divergence du secret JWT (recommandation d'audit).
 *
 * <p>Le secret JWT est injecté séparément dans plusieurs classes (JwtHelper,
 * AuthAPI, MeController, AccountAPI, EmployeeAPI, SecretsBootValidator…). Chaque
 * copie DOIT lire exactement la même propriété {@code ${JWT_SECRET:}} — sinon une
 * rotation qui n'en couvre qu'une partie, ou un défaut codé en dur, casse les
 * connexions ou réintroduit un secret. Ce test lit les sources et casse le build
 * à la moindre divergence.
 */
class JwtSecretConsistencyTest {

    /** Forme canonique unique attendue partout : propriété JWT_SECRET, défaut VIDE. */
    private static final String CANONICAL = "${JWT_SECRET:}";

    // Toute annotation @Value(...) qui mentionne JWT_SECRET.
    private static final Pattern JWT_VALUE =
            Pattern.compile("@(?:[\\w.]*\\.)?Value\\(\\s*\"([^\"]*JWT_SECRET[^\"]*)\"\\s*\\)");

    private List<Path> javaSources() throws IOException {
        Path root = Paths.get("src", "main", "java");
        assertTrue(Files.isDirectory(root), "Répertoire des sources introuvable : " + root.toAbsolutePath());
        try (Stream<Path> s = Files.walk(root)) {
            return s.filter(p -> p.toString().endsWith(".java")).toList();
        }
    }

    @Test
    void everyJwtSecretInjectionUsesTheSameCanonicalProperty() throws IOException {
        List<String> offenders = new ArrayList<>();
        int found = 0;
        for (Path p : javaSources()) {
            String content = Files.readString(p);
            Matcher m = JWT_VALUE.matcher(content);
            while (m.find()) {
                found++;
                String expr = m.group(1);
                if (!CANONICAL.equals(expr)) {
                    offenders.add(p.getFileName() + " → \"" + expr + "\"");
                }
            }
        }
        assertTrue(found >= 2,
                "Attendu au moins 2 injections de JWT_SECRET ; trouvé " + found
                        + " (le test n'a peut-être pas trouvé les sources).");
        assertTrue(offenders.isEmpty(),
                "Injection(s) de JWT_SECRET divergente(s) — toutes doivent utiliser "
                        + CANONICAL + " : " + offenders);
    }

    @Test
    void noHardcodedJwtSecretDefault() throws IOException {
        // Un défaut non vide (${JWT_SECRET:xxxx}) réintroduirait un secret en dur.
        Pattern hardcoded = Pattern.compile("\\$\\{JWT_SECRET:[^}]+}");
        List<String> offenders = new ArrayList<>();
        for (Path p : javaSources()) {
            if (hardcoded.matcher(Files.readString(p)).find()) {
                offenders.add(p.getFileName().toString());
            }
        }
        assertEquals(List.of(), offenders,
                "Défaut de JWT_SECRET codé en dur (doit rester vide, validé au boot) : " + offenders);
    }
}
