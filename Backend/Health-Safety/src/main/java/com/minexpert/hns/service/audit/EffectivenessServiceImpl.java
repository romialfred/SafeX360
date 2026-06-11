package com.minexpert.hns.service.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.EffectivenessCheckDTO;
import com.minexpert.hns.entity.audit.EffectivenessCheck;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.entity.audit.RecommendationFollowup;
import com.minexpert.hns.enums.RecommendationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.EffectivenessCheckRepository;
import com.minexpert.hns.repository.audit.RecommendationFollowupRepository;
import com.minexpert.hns.repository.audit.RecommendationRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Vérification d'efficacité (ISO 19011:2018 §6.6).
 *
 * Règle de rigueur : on ne planifie une vérification que pour une
 * recommandation TERMINÉE (COMPLETED) — l'efficacité ne se vérifie qu'après
 * la mise en œuvre. Un verdict INEFFICACE rouvre la recommandation.
 */
@Service
@RequiredArgsConstructor
public class EffectivenessServiceImpl implements EffectivenessService {

    private static final Set<String> VERDICTS =
            Set.of("EFFICACE", "PARTIELLEMENT_EFFICACE", "INEFFICACE");

    private final EffectivenessCheckRepository effectivenessCheckRepository;
    private final RecommendationRepository recommendationRepository;
    private final RecommendationFollowupRepository recommendationFollowupRepository;

    @Override
    @Transactional
    public Long planCheck(Long recommendationId, LocalDate dueDate, Long evaluatorEmployeeId) throws HSException {
        Recommendation recommendation = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new HSException("RECOMMENDATION_NOT_FOUND"));
        if (recommendation.getStatus() != RecommendationStatus.COMPLETED) {
            throw new HSException("EFFECTIVENESS_REQUIRES_COMPLETED_RECOMMENDATION");
        }
        if (dueDate == null) {
            throw new HSException("DUE_DATE_REQUIRED");
        }
        EffectivenessCheck check = new EffectivenessCheck();
        check.setRecommendation(recommendation);
        check.setDueDate(dueDate);
        check.setEvaluatorEmployeeId(evaluatorEmployeeId);
        check.setCreatedAt(LocalDateTime.now());
        return effectivenessCheckRepository.save(check).getId();
    }

    @Override
    @Transactional
    public void concludeCheck(Long checkId, String verdict, String comment) throws HSException {
        EffectivenessCheck check = effectivenessCheckRepository.findById(checkId)
                .orElseThrow(() -> new HSException("EFFECTIVENESS_CHECK_NOT_FOUND"));
        if (check.getVerdict() != null) {
            throw new HSException("EFFECTIVENESS_ALREADY_CONCLUDED");
        }
        if (verdict == null || !VERDICTS.contains(verdict)) {
            throw new HSException("VERDICT_INVALID");
        }
        check.setVerdict(verdict);
        check.setComment(comment);
        check.setCheckedAt(LocalDateTime.now());
        effectivenessCheckRepository.save(check);

        if ("INEFFICACE".equals(verdict)) {
            // Réouverture automatique : la recommandation repasse en cours avec
            // un followup explicite — traçabilité ISO du suivi d'audit.
            Recommendation recommendation = check.getRecommendation();
            recommendation.setStatus(RecommendationStatus.IN_PROGRESS);
            recommendation.setProgress(recommendation.getProgress() != null
                    ? Math.min(recommendation.getProgress(), 80) : 0);
            recommendationRepository.save(recommendation);

            RecommendationFollowup followup = new RecommendationFollowup();
            followup.setRecommendation(recommendation);
            followup.setStatus(RecommendationStatus.IN_PROGRESS);
            followup.setProgress(recommendation.getProgress());
            followup.setComment("Réouverture automatique : vérification d'efficacité conclue INEFFICACE"
                    + (comment != null && !comment.isBlank() ? " — " + comment : ""));
            followup.setCreatedAt(LocalDateTime.now());
            recommendationFollowupRepository.save(followup);
        }
    }

    @Override
    public List<EffectivenessCheckDTO> getPendingChecks() throws HSException {
        return effectivenessCheckRepository.findByVerdictIsNullOrderByDueDateAsc()
                .stream().map(this::toDtoWithTitle).collect(Collectors.toList());
    }

    @Override
    public List<EffectivenessCheckDTO> getChecksByRecommendation(Long recommendationId) throws HSException {
        return effectivenessCheckRepository.findByRecommendation_Id(recommendationId)
                .stream().map(this::toDtoWithTitle).collect(Collectors.toList());
    }

    private EffectivenessCheckDTO toDtoWithTitle(EffectivenessCheck check) {
        EffectivenessCheckDTO dto = check.toDTO();
        if (check.getRecommendation() != null) {
            dto.setRecommendationTitle(check.getRecommendation().getTitle());
        }
        return dto;
    }
}
