package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.FitnessAssessmentFullDTO;
import com.minexpert.hns.dosimetry.dto.FitnessAssessmentPublicDTO;
import com.minexpert.hns.dosimetry.entity.FitnessAssessment;
import com.minexpert.hns.dosimetry.enums.FitnessLevel;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;

/**
 * Tests unitaires de {@link FitnessAssessmentServiceImpl} (Phase 7).
 *
 * <p>Couverture cible :
 * <ul>
 *   <li>Creation : entite persistee non signee + audit CREATE_FITNESS_ASSESSMENT.</li>
 *   <li>UNFIT / TEMPORARILY_UNFIT declenche audit FITNESS_NOTIFY_PCR_RH supplementaire.</li>
 *   <li>signAssessment : verrouille en signed=true ; double signature -&gt; IllegalStateException.</li>
 *   <li>RBAC : DTO Public n'expose pas restrictions ; DTO Full les expose + audit VIEW_FITNESS_DETAIL.</li>
 *   <li>checkExpiringAssessments : audit FITNESS_EXPIRING_DETECTED par fiche.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class FitnessAssessmentServiceTest {

    @Mock
    private FitnessAssessmentRepository repository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private FitnessAssessmentServiceImpl service;

    private FitnessAssessment fitness(Long id, FitnessLevel level, boolean signed) {
        return FitnessAssessment.builder()
                .id(id)
                .workerId(7L)
                .mineId(1L)
                .assessmentDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(180))
                .fitness(level)
                .restrictions("RESTRICTIONS CLINIQUES SENSIBLES - confidentielles")
                .publicRestrictionsSummary("Eviter zone CONTROLEE 6 mois")
                .physicianId(99L)
                .physicianName("Dr Test")
                .signed(signed)
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // createAssessment
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createAssessment FIT : non signe + audit CREATE_FITNESS_ASSESSMENT (pas notify)")
    void create_fit() {
        when(repository.save(any(FitnessAssessment.class))).thenAnswer(inv -> {
            FitnessAssessment f = inv.getArgument(0);
            f.setId(42L);
            return f;
        });

        Long id = service.createAssessment(7L, 1L, 50L, FitnessLevel.FIT, null,
                null, LocalDate.now(), LocalDate.now().plusYears(1), null, 99L,
                "Dr X", 200L);

        assertThat(id).isEqualTo(42L);
        ArgumentCaptor<FitnessAssessment> captor =
                ArgumentCaptor.forClass(FitnessAssessment.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().isSigned()).isFalse();

        verify(auditService).log(eq("CREATE_FITNESS_ASSESSMENT"), eq("FitnessAssessment"),
                eq(42L), eq(200L), eq("DOSIMETRY_MEDICAL"), contains("FIT"));
        // Pas de FITNESS_NOTIFY_PCR_RH pour un FIT.
        verify(auditService, never()).log(eq("FITNESS_NOTIFY_PCR_RH"), anyString(),
                anyLong(), anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("createAssessment UNFIT : declenche audit FITNESS_NOTIFY_PCR_RH")
    void create_unfit_notifies() {
        when(repository.save(any(FitnessAssessment.class))).thenAnswer(inv -> {
            FitnessAssessment f = inv.getArgument(0);
            f.setId(43L);
            return f;
        });

        service.createAssessment(7L, 1L, null, FitnessLevel.UNFIT,
                "Pathologie incompatible", "Inaptitude definitive",
                LocalDate.now(), null, null, 99L, "Dr X", 200L);

        verify(auditService).log(eq("FITNESS_NOTIFY_PCR_RH"), eq("FitnessAssessment"),
                eq(43L), eq(200L), eq("DOSIMETRY_MEDICAL"), contains("UNFIT"));
    }

    @Test
    @DisplayName("createAssessment TEMPORARILY_UNFIT : declenche audit FITNESS_NOTIFY_PCR_RH")
    void create_temporarily_unfit_notifies() {
        when(repository.save(any(FitnessAssessment.class))).thenAnswer(inv -> {
            FitnessAssessment f = inv.getArgument(0);
            f.setId(44L);
            return f;
        });

        service.createAssessment(7L, 1L, null, FitnessLevel.TEMPORARILY_UNFIT,
                "x", "y", LocalDate.now(), null, LocalDate.now().plusDays(60),
                99L, "Dr X", 200L);

        verify(auditService).log(eq("FITNESS_NOTIFY_PCR_RH"), eq("FitnessAssessment"),
                eq(44L), eq(200L), eq("DOSIMETRY_MEDICAL"),
                contains("TEMPORARILY_UNFIT"));
    }

    @Test
    @DisplayName("createAssessment : workerId null -> IllegalArgumentException")
    void create_workerNull_throws() {
        assertThatThrownBy(() -> service.createAssessment(null, 1L, null,
                FitnessLevel.FIT, null, null, LocalDate.now(), null, null,
                99L, "Dr", 200L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any());
    }

    // ────────────────────────────────────────────────────────────────────────
    // signAssessment - lock APPEND-ONLY
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("signAssessment : passe a signed=true + signedAt + audit")
    void sign_ok() {
        FitnessAssessment f = fitness(42L, FitnessLevel.FIT_WITH_RESTRICTIONS, false);
        when(repository.findById(42L)).thenReturn(Optional.of(f));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.signAssessment(42L, 99L, "ip");

        assertThat(f.isSigned()).isTrue();
        assertThat(f.getSignedAt()).isNotNull();
        verify(auditService).log(eq("SIGN_FITNESS_ASSESSMENT"), eq("FitnessAssessment"),
                eq(42L), eq(99L), eq("DOSIMETRY_MEDICAL"), eq("ip"),
                contains("FIT_WITH_RESTRICTIONS"));
    }

    @Test
    @DisplayName("signAssessment double : second appel -> IllegalStateException (lock)")
    void sign_alreadySigned_throws() {
        FitnessAssessment f = fitness(42L, FitnessLevel.FIT, true);
        when(repository.findById(42L)).thenReturn(Optional.of(f));

        assertThatThrownBy(() -> service.signAssessment(42L, 99L, "ip"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already signed");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("signAssessment : physicianId null -> IllegalArgumentException")
    void sign_nullPhysician_throws() {
        FitnessAssessment f = fitness(42L, FitnessLevel.FIT, false);
        when(repository.findById(42L)).thenReturn(Optional.of(f));

        assertThatThrownBy(() -> service.signAssessment(42L, null, "ip"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // RBAC : DTO restriction selon role
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getCurrentFitnessPublic : DTO sans restrictions cliniques + audit non-medical")
    void getCurrent_public() {
        FitnessAssessment f = fitness(42L, FitnessLevel.FIT_WITH_RESTRICTIONS, true);
        when(repository.findCurrentSigned(7L)).thenReturn(Optional.of(f));

        Optional<FitnessAssessmentPublicDTO> dto = service.getCurrentFitnessPublic(7L,
                300L, "10.0.0.1");

        assertThat(dto).isPresent();
        assertThat(dto.get().getPublicRestrictionsSummary())
                .isEqualTo("Eviter zone CONTROLEE 6 mois");
        // Structurel : pas de champ restrictions dans le DTO Public.
        assertThat(dto.get().getClass().getDeclaredFields())
                .extracting("name")
                .doesNotContain("restrictions", "detailedReport");
        verify(auditService).log(eq("READ_CURRENT_FITNESS_PUBLIC"), eq("FitnessAssessment"),
                isNull(), eq(300L), eq("DOSIMETRY_PCR_RPO"), eq("10.0.0.1"),
                anyString());
    }

    @Test
    @DisplayName("getCurrentFitnessFull : DTO contient restrictions + audit VIEW_FITNESS_DETAIL")
    void getCurrent_full() {
        FitnessAssessment f = fitness(42L, FitnessLevel.FIT_WITH_RESTRICTIONS, true);
        when(repository.findCurrentSigned(7L)).thenReturn(Optional.of(f));

        Optional<FitnessAssessmentFullDTO> dto = service.getCurrentFitnessFull(7L,
                300L, "controle perte poids", "10.0.0.1");

        assertThat(dto).isPresent();
        assertThat(dto.get().getRestrictions())
                .contains("RESTRICTIONS CLINIQUES SENSIBLES");
        verify(auditService).log(eq("VIEW_FITNESS_DETAIL"), eq("FitnessAssessment"),
                isNull(), eq(300L), eq("DOSIMETRY_MEDICAL"), eq("10.0.0.1"),
                contains("controle perte poids"));
    }

    @Test
    @DisplayName("getAllAssessmentsPublic ne renvoie QUE les fiches signees")
    void getAll_public_signedOnly() {
        FitnessAssessment signed = fitness(42L, FitnessLevel.FIT, true);
        FitnessAssessment draft = fitness(43L, FitnessLevel.FIT, false);
        when(repository.findByWorkerIdOrderByAssessmentDateDesc(7L))
                .thenReturn(List.of(signed, draft));

        List<FitnessAssessmentPublicDTO> result = service.getAllAssessmentsPublic(7L,
                300L, "ip");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("getAllAssessmentsFull : audit VIEW_FITNESS_DETAIL avec scope=history")
    void getAll_full_audit() {
        when(repository.findByWorkerIdOrderByAssessmentDateDesc(7L))
                .thenReturn(List.of(fitness(42L, FitnessLevel.FIT, true)));

        service.getAllAssessmentsFull(7L, 300L, "audit revue", "ip");

        verify(auditService, times(1)).log(eq("VIEW_FITNESS_DETAIL"),
                eq("FitnessAssessment"), isNull(), eq(300L),
                eq("DOSIMETRY_MEDICAL"), eq("ip"), contains("history"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // checkExpiringAssessments
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("checkExpiringAssessments : audit FITNESS_EXPIRING_DETECTED par fiche")
    void checkExpiring() {
        FitnessAssessment e1 = fitness(1L, FitnessLevel.FIT, true);
        FitnessAssessment e2 = fitness(2L, FitnessLevel.FIT, true);
        when(repository.findExpiringBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(e1, e2));

        int count = service.checkExpiringAssessments(30);

        assertThat(count).isEqualTo(2);
        verify(auditService, times(2)).log(eq("FITNESS_EXPIRING_DETECTED"),
                eq("FitnessAssessment"), anyLong(), eq(0L),
                eq("DOSIMETRY_MEDICAL"), isNull(), anyString());
    }

    @Test
    @DisplayName("checkExpiringAssessments : 0 fiches -> aucun audit")
    void checkExpiring_zero() {
        when(repository.findExpiringBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        int count = service.checkExpiringAssessments(30);

        assertThat(count).isEqualTo(0);
        verify(auditService, never()).log(eq("FITNESS_EXPIRING_DETECTED"),
                anyString(), anyLong(), anyLong(), anyString(), isNull(), anyString());
    }
}
