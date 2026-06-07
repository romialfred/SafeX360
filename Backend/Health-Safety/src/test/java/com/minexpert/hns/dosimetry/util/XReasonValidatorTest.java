package com.minexpert.hns.dosimetry.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.dosimetry.service.DosimetryAuditService;

/**
 * Tests unitaires de {@link XReasonValidator} (Phase 10-A).
 *
 * <p>Couverture :
 * <ul>
 *   <li>Header absent / vide / blank -&gt; 400 + audit INVALID_REASON.</li>
 *   <li>Header &lt; 10 chars -&gt; 400 + audit.</li>
 *   <li>Litteral interdit ("unspecified", "n/a", "none"...) -&gt; 400 + audit.</li>
 *   <li>Pas de caractere alphabetique ("1234567890") -&gt; 400 + audit.</li>
 *   <li>Raison valide -&gt; trim retourne, AUCUN audit INVALID_REASON.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class XReasonValidatorTest {

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private XReasonValidator validator;

    // ────────────────────────────────────────────────────────────────────────
    // Cas KO : 400 + audit
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Reason null -> 400 + audit MISSING")
    void nullReason_400() {
        assertThatThrownBy(() -> validator.validate(null, 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        verify(auditService).log(eq("INVALID_REASON"), eq("DosimetryEndpoint"), isNull(),
                eq(99L), isNull(), contains("MISSING"));
    }

    @Test
    @DisplayName("Reason vide -> 400 + audit MISSING")
    void emptyReason_400() {
        assertThatThrownBy(() -> validator.validate("", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(99L), isNull(),
                contains("MISSING"));
    }

    @Test
    @DisplayName("Reason blank (espaces) -> 400 + audit MISSING")
    void blankReason_400() {
        assertThatThrownBy(() -> validator.validate("    ", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("Reason trop courte (5 chars) -> 400 + audit TOO_SHORT")
    void tooShort_400() {
        assertThatThrownBy(() -> validator.validate("court", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(99L), isNull(),
                contains("TOO_SHORT"));
    }

    @Test
    @DisplayName("Reason 'unspecified' (litteral interdit) -> 400 + audit FORBIDDEN_LITERAL")
    void forbiddenUnspecified_400() {
        assertThatThrownBy(() -> validator.validate("unspecified", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(99L), isNull(),
                contains("FORBIDDEN_LITERAL"));
    }

    @Test
    @DisplayName("Reason 'n/a' (litteral interdit) -> 400")
    void forbiddenNA_400() {
        assertThatThrownBy(() -> validator.validate("n/a", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("Reason 'NONE' (casse mixte litteral interdit) -> 400")
    void forbiddenNoneCase_400() {
        assertThatThrownBy(() -> validator.validate("  NONE  ", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("Reason '1234567890' (10 chars mais aucune lettre) -> 400 + audit NO_ALPHA")
    void noAlpha_400() {
        assertThatThrownBy(() -> validator.validate("1234567890", 99L, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(99L), isNull(),
                contains("NO_ALPHA"));
    }

    @Test
    @DisplayName("UserId null : audit avec userId=0 (best-effort tracabilite)")
    void userIdNull_auditUserZero() {
        assertThatThrownBy(() -> validator.validate(null, null, "TEST"))
                .isInstanceOf(ResponseStatusException.class);
        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(0L), isNull(),
                anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Cas OK : retourne la valeur trimmed sans audit INVALID
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Reason valide (>=10 chars + alpha + non sentinelle) : retourne valeur trimmed")
    void validReason_returnsTrimmed() {
        String result = validator.validate("  Consultation visite annuelle  ", 99L, "TEST");
        assertThat(result).isEqualTo("Consultation visite annuelle");

        verify(auditService, never()).log(eq("INVALID_REASON"), anyString(), any(), anyLong(),
                any(), anyString());
    }

    @Test
    @DisplayName("Reason valide exactement 10 chars + lettre : OK")
    void validReason_10chars() {
        String result = validator.validate("controle1A", 99L, "TEST");
        assertThat(result).isEqualTo("controle1A");
    }

    @Test
    @DisplayName("Reason francais avec accents : OK")
    void validReason_french() {
        String result = validator.validate("Suivi medical periodique annuel", 99L, "TEST");
        assertThat(result).isEqualTo("Suivi medical periodique annuel");
    }
}
