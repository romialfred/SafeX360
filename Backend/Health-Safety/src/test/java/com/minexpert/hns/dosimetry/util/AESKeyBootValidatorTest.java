package com.minexpert.hns.dosimetry.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Field;
import java.util.Base64;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.mock.env.MockEnvironment;

/**
 * Tests unitaires de {@link AESKeyBootValidator} (Phase 10-A).
 *
 * <p>Couverture :
 * <ul>
 *   <li>Profile prod sans cle -&gt; IllegalStateException (boot avorte).</li>
 *   <li>Profile prod cle vide -&gt; IllegalStateException.</li>
 *   <li>Profile prod cle non base64 -&gt; IllegalStateException.</li>
 *   <li>Profile prod cle &lt; 32 octets -&gt; IllegalStateException.</li>
 *   <li>Profile prod cle valide 32 octets base64 -&gt; OK.</li>
 *   <li>Profile dev sans cle -&gt; WARN seulement, validate() OK (pas de throw).</li>
 *   <li>Profile test sans cle -&gt; WARN seulement, OK.</li>
 *   <li>Aucun profile defini -&gt; IllegalStateException (force explicitation).</li>
 *   <li>Profile inconnu -&gt; traite comme UNDEFINED, IllegalStateException.</li>
 *   <li>{@link AESKeyBootValidator#classifyProfile(String[])} : matrice de classification.</li>
 *   <li>{@link AESKeyBootValidator#isKeyValid(String)} : validation de cle isolee.</li>
 * </ul>
 */
class AESKeyBootValidatorTest {

    private static final String VALID_KEY_B64 = Base64.getEncoder()
            .encodeToString(new byte[32]); // 32 octets a zero - taille valide

    /**
     * Construit un validator avec environnement + cle injectes via reflection
     * (evite la dependance Spring pour le test unitaire).
     */
    private AESKeyBootValidator buildValidator(Environment env, String key) throws Exception {
        AESKeyBootValidator v = new AESKeyBootValidator(env);
        Field f = AESKeyBootValidator.class.getDeclaredField("encryptionKey");
        f.setAccessible(true);
        f.set(v, key);
        return v;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Profile prod
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Profile prod + cle absente -> IllegalStateException")
    void prod_missingKey_throws() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        AESKeyBootValidator v = buildValidator(env, null);

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("REQUIRED in production");
    }

    @Test
    @DisplayName("Profile prod + cle vide -> IllegalStateException")
    void prod_emptyKey_throws() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        AESKeyBootValidator v = buildValidator(env, "  ");

        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Profile prod + cle non base64 -> IllegalStateException")
    void prod_invalidBase64_throws() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        AESKeyBootValidator v = buildValidator(env, "!!!not-base64!!!");

        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Profile prod + cle 16 octets (pas 32) -> IllegalStateException")
    void prod_wrongKeyLength_throws() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        // 16 octets base64
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
        AESKeyBootValidator v = buildValidator(env, shortKey);

        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Profile prod + cle valide 32 octets -> OK (pas de throw)")
    void prod_validKey_ok() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        AESKeyBootValidator v = buildValidator(env, VALID_KEY_B64);

        // Ne doit pas lever.
        v.validate();
    }

    @Test
    @DisplayName("Profile 'production' (long form) + cle valide -> OK")
    void productionLongForm_validKey_ok() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        AESKeyBootValidator v = buildValidator(env, VALID_KEY_B64);

        v.validate();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Profile dev/test : WARN seulement, OK
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Profile dev + cle absente -> WARN seulement, OK")
    void dev_missingKey_warnOnly() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        AESKeyBootValidator v = buildValidator(env, null);

        // Pas de throw.
        v.validate();
    }

    @Test
    @DisplayName("Profile test + cle absente -> WARN seulement, OK")
    void test_missingKey_warnOnly() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");
        AESKeyBootValidator v = buildValidator(env, null);

        v.validate();
    }

    @Test
    @DisplayName("Profile dev + cle valide -> OK (log info)")
    void dev_validKey_ok() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        AESKeyBootValidator v = buildValidator(env, VALID_KEY_B64);

        v.validate();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Profile UNDEFINED : throw pour forcer explicitation
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Aucun profile defini -> IllegalStateException (force SPRING_PROFILES_ACTIVE)")
    void noProfile_throws() throws Exception {
        MockEnvironment env = new MockEnvironment();
        // pas de setActiveProfiles
        AESKeyBootValidator v = buildValidator(env, VALID_KEY_B64);

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No Spring profile is active");
    }

    @Test
    @DisplayName("Profile inconnu (ex. 'staging') -> traite UNDEFINED -> IllegalStateException")
    void unknownProfile_throws() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("staging");
        AESKeyBootValidator v = buildValidator(env, VALID_KEY_B64);

        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // classifyProfile : matrice
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("classifyProfile : 'prod' -> PRODUCTION")
    void classifyProd() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] { "prod" }))
                .isEqualTo(AESKeyBootValidator.Profile.PRODUCTION);
    }

    @Test
    @DisplayName("classifyProfile : 'production' -> PRODUCTION")
    void classifyProduction() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] { "production" }))
                .isEqualTo(AESKeyBootValidator.Profile.PRODUCTION);
    }

    @Test
    @DisplayName("classifyProfile : 'PROD' (uppercase) -> PRODUCTION")
    void classifyProdUppercase() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] { "PROD" }))
                .isEqualTo(AESKeyBootValidator.Profile.PRODUCTION);
    }

    @Test
    @DisplayName("classifyProfile : 'dev' -> DEVELOPMENT")
    void classifyDev() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] { "dev" }))
                .isEqualTo(AESKeyBootValidator.Profile.DEVELOPMENT);
    }

    @Test
    @DisplayName("classifyProfile : 'test' -> DEVELOPMENT")
    void classifyTest() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] { "test" }))
                .isEqualTo(AESKeyBootValidator.Profile.DEVELOPMENT);
    }

    @Test
    @DisplayName("classifyProfile : tableau vide -> UNDEFINED")
    void classifyEmpty() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] {}))
                .isEqualTo(AESKeyBootValidator.Profile.UNDEFINED);
    }

    @Test
    @DisplayName("classifyProfile : null -> UNDEFINED")
    void classifyNull() {
        assertThat(AESKeyBootValidator.classifyProfile(null))
                .isEqualTo(AESKeyBootValidator.Profile.UNDEFINED);
    }

    @Test
    @DisplayName("classifyProfile : prod prend la priorite sur dev (cas multi-profiles)")
    void classifyProdAndDev_prodWins() {
        assertThat(AESKeyBootValidator.classifyProfile(new String[] { "dev", "prod" }))
                .isEqualTo(AESKeyBootValidator.Profile.PRODUCTION);
    }

    // ────────────────────────────────────────────────────────────────────────
    // isKeyValid : matrice
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isKeyValid : null -> false")
    void isKeyValid_null() {
        assertThat(AESKeyBootValidator.isKeyValid(null)).isFalse();
    }

    @Test
    @DisplayName("isKeyValid : blank -> false")
    void isKeyValid_blank() {
        assertThat(AESKeyBootValidator.isKeyValid("   ")).isFalse();
    }

    @Test
    @DisplayName("isKeyValid : non base64 -> false")
    void isKeyValid_invalidBase64() {
        assertThat(AESKeyBootValidator.isKeyValid("!!!!!")).isFalse();
    }

    @Test
    @DisplayName("isKeyValid : 16 octets (cle AES-128) -> false (on exige 32)")
    void isKeyValid_16bytes() {
        String key16 = Base64.getEncoder().encodeToString(new byte[16]);
        assertThat(AESKeyBootValidator.isKeyValid(key16)).isFalse();
    }

    @Test
    @DisplayName("isKeyValid : 32 octets base64 -> true")
    void isKeyValid_32bytes() {
        assertThat(AESKeyBootValidator.isKeyValid(VALID_KEY_B64)).isTrue();
    }
}
