package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.blast.entity.BlastStatusEvent;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.repository.BlastStatusEventRepository;

import lombok.RequiredArgsConstructor;

/**
 * Helper d'ecriture des evenements de transition de statut d'un tir.
 *
 * <p>Inspire de {@code DosimetryAuditService} : transaction propre
 * ({@link Propagation#REQUIRES_NEW}) pour ne jamais perdre une trace meme si la
 * transaction parente rollback. Les insertions sur {@code blast_status_event}
 * sont APPEND-ONLY (triggers BDD) — toute tentative d'UPDATE/DELETE leve
 * {@code SQLSTATE 45000}.
 */
@Service
@RequiredArgsConstructor
public class BlastAuditService {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastAuditService.class);

    private final BlastStatusEventRepository statusEventRepository;

    /**
     * Enregistre une transition de statut dans une transaction independante.
     *
     * @param blastId    id du tir concerne
     * @param from       statut precedent (peut etre null lors de la creation initiale)
     * @param to         nouveau statut
     * @param actorId    id utilisateur initiateur de la transition (0 si systeme)
     * @param reason     raison libre (motif d'annulation, contexte de report, etc.)
     * @return l'id de l'evenement cree, ou {@code null} si la persistance a echoue
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long logTransition(Long blastId,
                              BlastStatus from,
                              BlastStatus to,
                              Long actorId,
                              String reason) {
        try {
            BlastStatusEvent event = BlastStatusEvent.builder()
                    .blastId(blastId)
                    .fromStatus(from)
                    .toStatus(to)
                    .actorId(actorId)
                    .reason(reason)
                    .at(LocalDateTime.now())
                    .build();
            return statusEventRepository.save(event).getId();
        } catch (Exception ex) {
            LOGGER.error("[BlastAuditService] Status event persistence FAILED "
                            + "(blastId={}, from={}, to={}, actorId={}) : {}",
                    blastId, from, to, actorId, ex.getMessage(), ex);
            return null;
        }
    }
}
