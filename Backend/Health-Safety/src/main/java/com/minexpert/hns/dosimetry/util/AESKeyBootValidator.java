package com.minexpert.hns.dosimetry.util;

import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * Validateur de la cle de chiffrement AES au demarrage du contexte Spring (Phase 10-A -
 * durcissement RGPD / AIEA GSR Part 3 §3.106).
 *
 * <p><b>Probleme adresse :</b> {@link AESEncryptionConverter} accepte un mode "pass-through"
 * (donnees stockees en clair) lorsque {@code safex.encryption.key} est absente ou invalide,
 * pour faciliter le developpement local. Sans verrou, ce mode peut etre active accidentellement
 * en production -&gt; fuite de donnees medicales en clair.
 *
 * <p><b>Politique :</b>
 * <ul>
 *   <li><b>Profile {@code prod} ou {@code production} actif</b> : la cle doit etre presente,
 *       decodable en base64, et faire exactement 32 octets (256 bits). Sinon
 *       {@link IllegalStateException} -&gt; le boot Spring est avorte.</li>
 *   <li><b>Profile {@code dev}, {@code test}, {@code local}, {@code default} actif</b> :
 *       le pass-through est tolere mais un WARNING explicite est logge.</li>
 *   <li><b>Aucun profile defini</b> : {@link IllegalStateException} pour forcer
 *       l'explicitation du contexte ({@code SPRING_PROFILES_ACTIVE} doit etre positionne).</li>
 * </ul>
 *
 * <p>Conformite : RGPD art. 32 §1.a (encryption of personal data), AIEA GSR Part 3 §3.106
 * (confidentialite des donnees medicales).
 */
@Component
public class AESKeyBootValidator {

    private static final Logger LOGGER = LoggerFactory.getLogger(AESKeyBootValidator.class);

    private static final int AES_KEY_LENGTH_BYTES = 32;

    /** Profils consideres comme "production" (matching insensible a la casse). */
    private static final String[] PRODUCTION_PROFILES = new String[] { "prod", "production" };

    /** Profils consideres comme "developpement / test" (matching insensible a la casse). */
    private static final String[] DEV_PROFILES = new String[] {
            "dev", "development", "test", "testing", "local", "default", "integration"
    };

    @Value("${safex.encryption.key:}")
    private String encryptionKey;

    private final Environment environment;

    public AESKeyBootValidator(Environment environment) {
        this.environment = environment;
    }

    /**
     * Valide la cle apres injection des proprietes Spring. Methode invoquee une seule fois
     * apres construction du bean. Tout {@link IllegalStateException} fait echouer le boot.
     */
    @PostConstruct
    public void validate() {
        String[] activeProfiles = environment.getActiveProfiles();
        Profile profile = classifyProfile(activeProfiles);

        boolean keyValid = isKeyValid(encryptionKey);

        if (profile == Profile.UNDEFINED) {
            throw new IllegalStateException(
                    "[AESKeyBootValidator] No Spring profile is active. "
                            + "Set SPRING_PROFILES_ACTIVE explicitly (dev | test | prod). "
                            + "Aborting boot to prevent ambiguous production deployment.");
        }

        if (profile == Profile.PRODUCTION) {
            if (!keyValid) {
                throw new IllegalStateException(
                        "[AESKeyBootValidator] safex.encryption.key is REQUIRED in production "
                                + "(profile=" + String.join(",", activeProfiles) + ") "
                                + "and must be a base64-encoded 32-byte AES-256 key. "
                                + "Generate one with: openssl rand -base64 32. "
                                + "Aborting boot to prevent plaintext storage of medical data "
                                + "(RGPD art. 32, AIEA GSR Part 3 §3.106).");
            }
            LOGGER.info("[AESKeyBootValidator] Production profile active and valid AES-256 key "
                    + "loaded - encryption ENFORCED for medical data at rest.");
            return;
        }

        // Profile dev/test/local : pass-through tolere.
        if (!keyValid) {
            LOGGER.warn("[AESKeyBootValidator] Profile={} - safex.encryption.key is missing or "
                    + "invalid. AESEncryptionConverter will run in PASS-THROUGH mode "
                    + "(medical data stored in CLEARTEXT). DO NOT USE THIS CONFIGURATION IN "
                    + "PRODUCTION.", String.join(",", activeProfiles));
        } else {
            LOGGER.info("[AESKeyBootValidator] Profile={} - valid AES-256 key loaded.",
                    String.join(",", activeProfiles));
        }
    }

    /**
     * Classifie le set de profils actifs Spring en Production / Dev / Undefined.
     */
    static Profile classifyProfile(String[] activeProfiles) {
        if (activeProfiles == null || activeProfiles.length == 0) {
            return Profile.UNDEFINED;
        }
        for (String p : activeProfiles) {
            if (p == null) continue;
            String lower = p.toLowerCase();
            for (String prod : PRODUCTION_PROFILES) {
                if (lower.equals(prod) || lower.contains(prod)) {
                    return Profile.PRODUCTION;
                }
            }
        }
        for (String p : activeProfiles) {
            if (p == null) continue;
            String lower = p.toLowerCase();
            for (String dev : DEV_PROFILES) {
                if (lower.equals(dev) || lower.contains(dev)) {
                    return Profile.DEVELOPMENT;
                }
            }
        }
        // Profile defini mais ne matche aucun pattern connu : on traite comme "indefini"
        // pour eviter qu'un nom de profile mal cible cache un demarrage prod.
        return Profile.UNDEFINED;
    }

    /**
     * Une cle est valide ssi presente, non vide, decodable en base64 et fait exactement
     * {@value #AES_KEY_LENGTH_BYTES} octets une fois decodee.
     */
    static boolean isKeyValid(String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            return false;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(base64Key);
            return decoded.length == AES_KEY_LENGTH_BYTES;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /** Classification de l'environnement Spring runtime. */
    enum Profile {
        PRODUCTION,
        DEVELOPMENT,
        UNDEFINED
    }
}
