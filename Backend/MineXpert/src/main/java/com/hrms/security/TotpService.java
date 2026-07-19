package com.hrms.security;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Locale;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

/** RFC 6238 (HMAC-SHA1, 6 chiffres, pas de 30 secondes). */
@Service
public class TotpService {

    private static final char[] BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();
    private static final int PERIOD_SECONDS = 30;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public TotpService() {
        this(Clock.systemUTC());
    }

    TotpService(Clock clock) {
        this.clock = clock;
    }

    public String newSecret() {
        byte[] secret = new byte[20];
        random.nextBytes(secret);
        return encodeBase32(secret);
    }

    /** Retourne le pas valide, ou -1. Une tolerance de +/- 30 secondes est acceptee. */
    public long validate(String base32Secret, String candidate) {
        if (candidate == null || !candidate.matches("\\d{6}")) {
            return -1;
        }
        long currentStep = clock.instant().getEpochSecond() / PERIOD_SECONDS;
        for (long step = currentStep - 1; step <= currentStep + 1; step++) {
            if (constantTimeEquals(generateCode(base32Secret, step), candidate)) {
                return step;
            }
        }
        return -1;
    }

    static String generateCode(String base32Secret, long step) {
        try {
            byte[] key = decodeBase32(base32Secret);
            byte[] counter = ByteBuffer.allocate(Long.BYTES).putLong(step).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(counter);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            return String.format(Locale.ROOT, "%06d", binary % 1_000_000);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("TOTP_UNAVAILABLE", ex);
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        if (expected.length() != actual.length()) return false;
        int diff = 0;
        for (int i = 0; i < expected.length(); i++) {
            diff |= expected.charAt(i) ^ actual.charAt(i);
        }
        return diff == 0;
    }

    static String encodeBase32(byte[] value) {
        StringBuilder out = new StringBuilder((value.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : value) {
            buffer = (buffer << 8) | (b & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                out.append(BASE32[(buffer >> (bitsLeft - 5)) & 31]);
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) out.append(BASE32[(buffer << (5 - bitsLeft)) & 31]);
        return out.toString();
    }

    static byte[] decodeBase32(String encoded) {
        if (encoded == null || encoded.isBlank()) throw new IllegalArgumentException("TOTP_SECRET_INVALID");
        String value = encoded.replace("=", "").replace(" ", "").toUpperCase(Locale.ROOT);
        byte[] out = new byte[value.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;
        for (char c : value.toCharArray()) {
            int digit = c >= 'A' && c <= 'Z' ? c - 'A' : c >= '2' && c <= '7' ? c - '2' + 26 : -1;
            if (digit < 0) throw new IllegalArgumentException("TOTP_SECRET_INVALID");
            buffer = (buffer << 5) | digit;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }
        return out;
    }
}
