package com.minexpert.hns.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.policy.entity.HsPolicy;
import com.minexpert.hns.policy.entity.HsPolicyAcknowledgement;
import com.minexpert.hns.policy.entity.HsPolicyArticle;
import com.minexpert.hns.policy.enums.HsPolicyStatus;
import com.minexpert.hns.policy.repository.HsPolicyAcknowledgementRepository;
import com.minexpert.hns.policy.repository.HsPolicyArticleRepository;
import com.minexpert.hns.policy.repository.HsPolicyRepository;
import com.minexpert.hns.policy.service.HsPolicyServiceImpl;
import com.minexpert.hns.utility.AuthUtils;

/**
 * Règles métier de la politique SST (ISO 45001 §5.2/§5.4), testées dans les deux
 * sens : ce qui doit être refusé ET ce qui doit passer.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HsPolicyServiceTest {

    private static final Long COMPANY = 1L;

    @Mock private HsPolicyRepository policyRepository;
    @Mock private HsPolicyArticleRepository articleRepository;
    @Mock private HsPolicyAcknowledgementRepository ackRepository;

    @InjectMocks private HsPolicyServiceImpl service;

    private HsPolicy draft(Long id) {
        HsPolicy p = new HsPolicy();
        p.setId(id);
        p.setCompanyId(COMPANY);
        p.setStatus(HsPolicyStatus.DRAFT);
        return p;
    }

    private HsPolicyArticle article() {
        HsPolicyArticle a = new HsPolicyArticle();
        a.setTitle("Respect des exigences légales");
        return a;
    }

    // ── PUBLICATION ──────────────────────────────────────────────────────────

    @Test
    void publishRefusesWithoutArticle() {
        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(draft(9L)));
        when(articleRepository.findByPolicyIdOrderByOrderIndexAsc(9L)).thenReturn(List.of());
        assertThatThrownBy(() -> service.publish(COMPANY, 9L, "Mme la Directrice", "DG", null))
                .isInstanceOf(HSException.class).hasMessage("POLICY_HAS_NO_ARTICLE");
        verify(policyRepository, never()).save(any());
    }

    @Test
    void publishRefusesWithoutSignatory() {
        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(draft(9L)));
        assertThatThrownBy(() -> service.publish(COMPANY, 9L, "  ", "DG", null))
                .isInstanceOf(HSException.class).hasMessage("SIGNATORY_REQUIRED");
    }

    @Test
    void publishArchivesPreviousAndBumpsVersion() throws HSException {
        HsPolicy target = draft(9L);
        HsPolicy previousPublished = draft(4L);
        previousPublished.setStatus(HsPolicyStatus.PUBLISHED);
        previousPublished.setVersion(2);

        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(target));
        when(articleRepository.findByPolicyIdOrderByOrderIndexAsc(9L)).thenReturn(List.of(article()));
        when(policyRepository.findFirstByCompanyIdAndStatusOrderByVersionDesc(COMPANY, HsPolicyStatus.PUBLISHED))
                .thenReturn(Optional.of(previousPublished));
        when(policyRepository.findFirstByCompanyIdOrderByVersionDesc(COMPANY))
                .thenReturn(Optional.of(previousPublished));
        when(policyRepository.save(any(HsPolicy.class))).thenAnswer(inv -> inv.getArgument(0));

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(AuthUtils::currentEmpId).thenReturn(55L);
            service.publish(COMPANY, 9L, "Mme la Directrice", "Directrice Générale", "data:image/png;base64,AAAA");
        }

        // La version précédente est archivée, la cible devient PUBLISHED en version 3.
        assertThat(previousPublished.getStatus()).isEqualTo(HsPolicyStatus.ARCHIVED);
        assertThat(target.getStatus()).isEqualTo(HsPolicyStatus.PUBLISHED);
        assertThat(target.getVersion()).isEqualTo(3);
        assertThat(target.getSignedByEmpId()).isEqualTo(55L);
        verify(policyRepository, times(2)).save(any(HsPolicy.class)); // archivée + publiée
    }

    @Test
    void publishRefusesAnAlreadyPublishedPolicy() {
        HsPolicy already = draft(9L);
        already.setStatus(HsPolicyStatus.PUBLISHED);
        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(already));
        assertThatThrownBy(() -> service.publish(COMPANY, 9L, "X", "Y", null))
                .isInstanceOf(HSException.class).hasMessage("POLICY_ALREADY_PUBLISHED");
    }

    // ── IMMUTABILITÉ ─────────────────────────────────────────────────────────

    @Test
    void saveDraftRefusesToRewriteAPublishedPolicy() {
        HsPolicy published = draft(9L);
        published.setStatus(HsPolicyStatus.PUBLISHED);
        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(published));
        com.minexpert.hns.policy.dto.HsPolicyDTO dto = new com.minexpert.hns.policy.dto.HsPolicyDTO();
        dto.setId(9L);
        assertThatThrownBy(() -> service.saveDraft(COMPANY, dto))
                .isInstanceOf(HSException.class).hasMessage("POLICY_LOCKED");
    }

    // ── PRISE DE CONNAISSANCE (§5.4) ─────────────────────────────────────────

    @Test
    void acknowledgeIsIdempotent() throws HSException {
        HsPolicy published = draft(9L);
        published.setStatus(HsPolicyStatus.PUBLISHED);
        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(published));
        when(policyRepository.findFirstByCompanyIdAndStatusOrderByVersionDesc(COMPANY, HsPolicyStatus.PUBLISHED))
                .thenReturn(Optional.of(published));
        // Déjà pris connaissance : la seconde fois ne réécrit pas.
        when(ackRepository.findByPolicyIdAndAccountId(9L, 77L))
                .thenReturn(Optional.of(new HsPolicyAcknowledgement()));

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(AuthUtils::currentActorId).thenReturn(77L);
            service.acknowledge(COMPANY, 9L, "Jean Ouvrier");
        }
        verify(ackRepository, never()).save(any());
    }

    @Test
    void acknowledgeRefusedOnNonPublishedPolicy() {
        when(policyRepository.findByIdAndCompanyId(9L, COMPANY)).thenReturn(Optional.of(draft(9L)));
        assertThatThrownBy(() -> service.acknowledge(COMPANY, 9L, "Jean"))
                .isInstanceOf(HSException.class).hasMessage("POLICY_NOT_PUBLISHED");
    }

    @Test
    void companyIsMandatory() {
        assertThatThrownBy(() -> service.getPublished(null))
                .isInstanceOf(HSException.class).hasMessage("COMPANY_REQUIRED");
        assertThatThrownBy(() -> service.getPublished(0L))
                .isInstanceOf(HSException.class).hasMessage("COMPANY_REQUIRED");
    }
}
