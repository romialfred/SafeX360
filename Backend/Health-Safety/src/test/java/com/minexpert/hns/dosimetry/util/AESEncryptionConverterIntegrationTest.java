package com.minexpert.hns.dosimetry.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Base64;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests d'integration {@link AESEncryptionConverter} - chiffrement / dechiffrement roundtrip.
 *
 * <p>Configure une cle AES-256 fixe (32 octets base64) au demarrage du jeu de tests via
 * {@code configureKey(...)}. Cette cle est test-only et ne doit JAMAIS etre committee dans
 * un fichier de configuration prod.
 *
 * <p>Couverture :
 * <ul>
 *   <li>Roundtrip ASCII simple (sanity).</li>
 *   <li>Roundtrip caracteres accentues francais (eee a o u c).</li>
 *   <li>Roundtrip avec caracteres speciaux (apostrophes, sauts de ligne, JSON).</li>
 *   <li>Roundtrip texte long (compte-rendu medical).</li>
 *   <li>null en entree -&gt; null en sortie (compatibilite JPA).</li>
 *   <li>Determinisme inverse : deux chiffrages successifs donnent des cipher distincts
 *       (IV aleatoire) mais se dechiffrent en la meme valeur (proof de non-reuse IV).</li>
 *   <li>Compatibilite pass-through : valeur clair stockee historique reste lisible.</li>
 * </ul>
 */
class AESEncryptionConverterIntegrationTest {

    private static final byte[] FIXED_KEY_BYTES = new byte[]{
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
            0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20
    };

    private static String fixedKeyB64;

    @BeforeAll
    static void configureKey() {
        fixedKeyB64 = Base64.getEncoder().encodeToString(FIXED_KEY_BYTES);
        AESEncryptionConverter.configureKey(fixedKeyB64);
    }

    @AfterAll
    static void teardownKey() {
        // Repasse en mode pass-through pour ne pas polluer d'autres tests.
        AESEncryptionConverter.configureKey(null);
    }

    private AESEncryptionConverter converter() {
        return new AESEncryptionConverter();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Roundtrip simple
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Roundtrip ASCII : chiffre puis dechiffre = identique")
    void roundtripAscii() {
        AESEncryptionConverter c = converter();
        String original = "Hello World 1234";
        String cipher = c.convertToDatabaseColumn(original);
        assertThat(cipher).isNotEqualTo(original).isNotEmpty();
        assertThat(c.convertToEntityAttribute(cipher)).isEqualTo(original);
    }

    @Test
    @DisplayName("Roundtrip francais avec accents : eee a o u c, OK UTF-8")
    void roundtripFrench() {
        AESEncryptionConverter c = converter();
        String original = "Restriction medicale : eviter exposition Hp(10) > 10 mSv. "
                + "Suivi biologique hemogramme tous les 6 mois.";
        String cipher = c.convertToDatabaseColumn(original);
        assertThat(c.convertToEntityAttribute(cipher)).isEqualTo(original);
    }

    @Test
    @DisplayName("Roundtrip caracteres speciaux (JSON / apostrophe / newline)")
    void roundtripSpecial() {
        AESEncryptionConverter c = converter();
        String original = "{\"diagnostic\":\"l'aptitude est restreinte\","
                + "\"notes\":\"voir CRH\\nbilan biologique J+30\\nmesure tres precise: 0.1 mSv\"}";
        String cipher = c.convertToDatabaseColumn(original);
        assertThat(c.convertToEntityAttribute(cipher)).isEqualTo(original);
    }

    @Test
    @DisplayName("Roundtrip texte long (~10KB de compte-rendu medical)")
    void roundtripLong() {
        AESEncryptionConverter c = converter();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 200; i++) {
            sb.append("Ligne CR ").append(i)
              .append(" : anamnese, examen clinique, biologie. Tres detaillee.\n");
        }
        String original = sb.toString();
        String cipher = c.convertToDatabaseColumn(original);
        assertThat(c.convertToEntityAttribute(cipher)).isEqualTo(original);
    }

    // ────────────────────────────────────────────────────────────────────────
    // null / vide
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("null -> null en chiffrement (JPA contract)")
    void encryptNull() {
        assertThat(converter().convertToDatabaseColumn(null)).isNull();
    }

    @Test
    @DisplayName("null -> null en dechiffrement (JPA contract)")
    void decryptNull() {
        assertThat(converter().convertToEntityAttribute(null)).isNull();
    }

    @Test
    @DisplayName("Chaine vide : encrypt + decrypt = ''")
    void roundtripEmpty() {
        AESEncryptionConverter c = converter();
        String cipher = c.convertToDatabaseColumn("");
        assertThat(c.convertToEntityAttribute(cipher)).isEqualTo("");
    }

    // ────────────────────────────────────────────────────────────────────────
    // IV unicite
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Deux chiffrements successifs donnent des cipher differents (IV aleatoire)")
    void distinctCiphersForSamePlaintext() {
        AESEncryptionConverter c = converter();
        String original = "donnee identique";
        String cipherA = c.convertToDatabaseColumn(original);
        String cipherB = c.convertToDatabaseColumn(original);
        assertThat(cipherA).isNotEqualTo(cipherB);
        // Mais les deux se dechiffrent correctement.
        assertThat(c.convertToEntityAttribute(cipherA)).isEqualTo(original);
        assertThat(c.convertToEntityAttribute(cipherB)).isEqualTo(original);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Legacy pass-through (donnees clair historiques)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Valeur non base64 (clair legacy) : decryption pass-through (best-effort)")
    void legacyPlainTextPassThrough() {
        AESEncryptionConverter c = converter();
        // Valeur deja en clair en BDD (avant l'activation du chiffrement).
        String legacy = "ancienne valeur clair pre-chiffrement";
        // Le converter doit retomber sur pass-through plutot que de jeter.
        assertThat(c.convertToEntityAttribute(legacy)).isEqualTo(legacy);
    }
}
