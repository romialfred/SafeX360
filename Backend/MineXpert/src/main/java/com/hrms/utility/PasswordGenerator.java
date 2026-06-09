package com.hrms.utility;

import java.security.SecureRandom;

/**
 * Generateur de mots de passe temporaires forts conformes a la politique OWASP ASVS V2.1.
 *
 * Garanties :
 * - Longueur configurable (min 12, defaut 14)
 * - Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractere special
 * - Utilise SecureRandom (CSPRNG)
 * - Pas de caracteres ambigus (0, O, 1, l, I) pour faciliter la lecture dans l'email
 */
public final class PasswordGenerator {

    private static final String UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans I, O
    private static final String LOWERCASE = "abcdefghijkmnpqrstuvwxyz"; // sans l, o
    private static final String DIGITS = "23456789"; // sans 0, 1
    private static final String SPECIALS = "!@#$%^&*()-_=+";
    private static final String ALL = UPPERCASE + LOWERCASE + DIGITS + SPECIALS;

    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordGenerator() {
        // utility class
    }

    /** Genere un MDP temporaire de longueur 14 conforme OWASP. */
    public static String generate() {
        return generate(14);
    }

    /** Genere un MDP temporaire de longueur souhaitee (min 12). */
    public static String generate(int length) {
        if (length < 12) length = 12;

        char[] chars = new char[length];
        // Garantie 1 char de chaque categorie en debut, puis shuffle.
        chars[0] = UPPERCASE.charAt(RANDOM.nextInt(UPPERCASE.length()));
        chars[1] = LOWERCASE.charAt(RANDOM.nextInt(LOWERCASE.length()));
        chars[2] = DIGITS.charAt(RANDOM.nextInt(DIGITS.length()));
        chars[3] = SPECIALS.charAt(RANDOM.nextInt(SPECIALS.length()));
        for (int i = 4; i < length; i++) {
            chars[i] = ALL.charAt(RANDOM.nextInt(ALL.length()));
        }
        // Fisher-Yates shuffle pour ne pas avoir un pattern fixe en debut.
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp;
        }
        return new String(chars);
    }
}
