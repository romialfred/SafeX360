package com.hrms.directory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * LOT 52 — chiffrement AES-256-GCM du mot de passe du compte de service LDAP
 * stocké en base. Clé dérivée de SAFEX_ENCRYPTION_KEY (ou à défaut JWT_SECRET,
 * toujours présent) via SHA-256 : aucun secret en clair en base, aucun nouveau
 * paramètre obligatoire.
 */
@Component
public class DirectoryCrypto {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec key;

    public DirectoryCrypto(@Value("${SAFEX_ENCRYPTION_KEY:}") String encryptionKey,
                           @Value("${jwt.secret:}") String jwtSecret) throws Exception {
        String material = (encryptionKey != null && !encryptionKey.isBlank()) ? encryptionKey : jwtSecret;
        if (material == null || material.isBlank()) {
            throw new IllegalStateException("Aucune clé disponible (SAFEX_ENCRYPTION_KEY ou jwt.secret) pour DirectoryCrypto");
        }
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(material.getBytes(StandardCharsets.UTF_8));
        this.key = new SecretKeySpec(digest, "AES");
    }

    public String encrypt(String plain) {
        if (plain == null || plain.isEmpty()) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cipherText = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(cipherText, 0, out, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("Echec chiffrement annuaire", e);
        }
    }

    public String decrypt(String encoded) {
        if (encoded == null || encoded.isEmpty()) return null;
        try {
            byte[] in = Base64.getDecoder().decode(encoded);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, in, 0, IV_LENGTH));
            byte[] plain = cipher.doFinal(in, IV_LENGTH, in.length - IV_LENGTH);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Echec dechiffrement annuaire", e);
        }
    }
}
