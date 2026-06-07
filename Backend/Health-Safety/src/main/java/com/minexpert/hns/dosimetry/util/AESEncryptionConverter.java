package com.minexpert.hns.dosimetry.util;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter JPA chiffrant transparemment une chaine au repos (column TEXT/VARCHAR) en AES-256-GCM.
 *
 * <p><b>Usage typique :</b> annoter le champ chiffre par
 * {@code @Convert(converter = AESEncryptionConverter.class)} sur l'entite (cf. champ
 * {@code restrictedClinicalDetails} de {@code MedicalSurveillance}).
 *
 * <p><b>Algorithme :</b> AES/GCM/NoPadding avec un IV aleatoire 12 octets par chiffrement,
 * concatene en prefixe du cipher text. Tag d'authentification GCM = 128 bits. Format en base
 * apres encodage base64 : {@code base64( IV || ciphertext || tag )}.
 *
 * <p><b>Clef :</b> lue dans {@code safex.encryption.key} (32 octets base64 attendus,
 * 256 bits). Generation conseillee :
 * <pre>openssl rand -base64 32</pre>
 *
 * <p><b>Mode dev (fallback) :</b> si la propriete est absente ou vide, le converter logge un
 * WARNING au demarrage et retourne la valeur telle quelle (pass-through). Cela permet de
 * developper sans devoir provisionner une clef, mais ne doit JAMAIS etre actif en
 * production : un health check / validateur doit refuser le boot prod si la clef est absente.
 *
 * <p><b>Rotation :</b> non geree par ce converter (mono-clef). En cas de rotation, prevoir un
 * job de re-chiffrement (lire avec ancienne clef, ecrire avec nouvelle).
 *
 * <p>Refs : NIST SP 800-38D (GCM), AIEA GSR Part 3 §3.106 (confidentialite donnees medicales).
 */
@Component
@Converter
public class AESEncryptionConverter implements AttributeConverter<String, String> {

    private static final Logger LOGGER = LoggerFactory.getLogger(AESEncryptionConverter.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int AES_KEY_LENGTH_BYTES = 32; // 256 bits

    /** Cle injectee statiquement pour rester accessible meme quand JPA instancie le converter. */
    private static volatile SecretKeySpec keySpec;
    private static volatile boolean keyAvailable;
    private static volatile boolean warnedOnce;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Spring injection : lit la clef au demarrage. La valeur par defaut vide active le mode dev
     * (pass-through avec warning).
     */
    @Value("${safex.encryption.key:}")
    public void setEncryptionKey(String base64Key) {
        configureKey(base64Key);
    }

    /**
     * Configure la clef de maniere statique. Visible package-private pour les tests qui
     * instancient le converter manuellement.
     */
    static synchronized void configureKey(String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            keyAvailable = false;
            keySpec = null;
            if (!warnedOnce) {
                LOGGER.warn("[AESEncryptionConverter] safex.encryption.key NON DEFINIE - "
                        + "mode dev pass-through actif. NE PAS UTILISER EN PRODUCTION.");
                warnedOnce = true;
            }
            return;
        }
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            if (keyBytes.length != AES_KEY_LENGTH_BYTES) {
                LOGGER.error("[AESEncryptionConverter] safex.encryption.key invalide : "
                        + "attendu {} octets ({} bits) apres decodage base64, recu {} octets. "
                        + "Mode dev pass-through actif.",
                        AES_KEY_LENGTH_BYTES, AES_KEY_LENGTH_BYTES * 8, keyBytes.length);
                keyAvailable = false;
                keySpec = null;
                return;
            }
            keySpec = new SecretKeySpec(keyBytes, ALGORITHM);
            keyAvailable = true;
            LOGGER.info("[AESEncryptionConverter] Clef AES-256-GCM chargee ({} bits).",
                    AES_KEY_LENGTH_BYTES * 8);
        } catch (IllegalArgumentException ex) {
            LOGGER.error("[AESEncryptionConverter] safex.encryption.key non decodable en base64 "
                    + "({}). Mode dev pass-through actif.", ex.getMessage());
            keyAvailable = false;
            keySpec = null;
        }
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        if (!keyAvailable) {
            return attribute;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(cipherText, 0, payload, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("AES encryption failed", ex);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        if (!keyAvailable) {
            return dbData;
        }
        try {
            byte[] payload = Base64.getDecoder().decode(dbData);
            if (payload.length <= IV_LENGTH_BYTES) {
                // Donnees ecrites en mode dev (pass-through) avant activation de la clef.
                LOGGER.warn("[AESEncryptionConverter] Payload trop court pour etre chiffre, "
                        + "renvoi en pass-through (donnees historiques en clair ?).");
                return dbData;
            }
            byte[] iv = new byte[IV_LENGTH_BYTES];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH_BYTES);
            byte[] cipherText = new byte[payload.length - IV_LENGTH_BYTES];
            System.arraycopy(payload, IV_LENGTH_BYTES, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] plain = cipher.doFinal(cipherText);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            // Pas du base64 valide -> probablement donnee legacy en clair.
            LOGGER.warn("[AESEncryptionConverter] Valeur non base64, renvoi en pass-through.");
            return dbData;
        } catch (Exception ex) {
            throw new IllegalStateException("AES decryption failed", ex);
        }
    }
}
