package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.entity.incident.InvestigationTimelineEvent;

public interface InvestigationTimelineEventRepository
        extends JpaRepository<InvestigationTimelineEvent, Long> {

    /**
     * Frise ordonnée : par instant, puis par rang de séquence (départages les
     * faits sans horodatage ou au même instant). Les nuls d'occurredAt viennent
     * en dernier, ce qui place les faits « non datés mais ordonnés » à la suite.
     */
    List<InvestigationTimelineEvent>
            findByInvestigationIdOrderByOccurredAtAscSequenceOrderAsc(Long investigationId);
}
