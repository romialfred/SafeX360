package com.hrms.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

/** Chiffrement authentifie du secret TOTP; aucune cle n'est suivie dans Git. */
@Service
public class MfaCryptoService {

    private static final Logger LOG = LoggerFactory.getLogger(MfaCryptoService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private final SecretKeySpec key;

    public MfaCryptoService(@Value("${MFA_ENCRYPTION_KEY:}") String configuredKey, Environment environment) {
        String material = configuredKey;
        if (material == null || material.isBlank()) {
            if (!environment.acceptsProfiles(Profiles.of("dev", "test", "local"))) {
                throw new IllegalStateException("MFA_ENCRYPTION_KEY_REQUIRED");
            }
            byte[] ephemeral = new byte[32];
            RANDOM.nextBytes(ephemeral);
            material = Base64.getEncoder().encodeToString(ephemeral);
            LOG.warn("MFA_ENCRYPTION_KEY absente: cle ephemere non persistante activee pour le profil local/test");
        }
        try {
            this.key = new SecretKeySpec(MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8)), "AES");
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("MFA_CRYPTO_UNAVAILABLE", ex);
        }
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[12];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return "v1." + Base64.getUrlEncoder().withoutPadding().encodeToString(iv)
                    + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(ciphertext);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("MFA_ENCRYPTION_FAILED", ex);
        }
    }

    public String decrypt(String encoded) {
        try {
            String[] parts = encoded == null ? new String[0] : encoded.split("\\.");
            if (parts.length != 3 || !"v1".equals(parts[0])) throw new IllegalArgumentException("MFA_SECRET_FORMAT");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key,
                    new GCMParameterSpec(128, Base64.getUrlDecoder().decode(parts[1])));
            return new String(cipher.doFinal(Base64.getUrlDecoder().decode(parts[2])), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw new IllegalStateException("MFA_DECRYPTION_FAILED", ex);
        }
    }
}
