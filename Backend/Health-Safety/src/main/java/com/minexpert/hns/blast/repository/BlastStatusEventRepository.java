package com.minexpert.hns.blast.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastStatusEvent;
import com.minexpert.hns.blast.enums.BlastStatus;

/**
 * Repository APPEND-ONLY sur le journal des transitions de statut.
 *
 * <p><b>Attention :</b> aucune methode {@code delete*} ne doit etre exposee ou
 * appelee. Les triggers BDD {@code trg_blast_status_event_no_update} et
 * {@code trg_blast_status_event_no_delete} rejettent toute mutation. Si une
 * methode de l'API parent {@link JpaRepository} est invoquee par erreur sur ce
 * journal, MySQL leve {@code SQLSTATE 45000} et la transaction est rollback.
 */
@Repository
public interface BlastStatusEventRepository extends JpaRepository<BlastStatusEvent, Long> {

    List<BlastStatusEvent> findByBlastIdOrderByAtDesc(Long blastId);

    /**
     * P7 — Recupere les evenements de transition vers un statut donne (typiquement
     * {@link BlastStatus#FIRED}) survenus dans une fenetre temporelle. Utilise par
     * le dashboard pour calculer le taux de tirs realises a l'heure (delta entre
     * {@code at} et {@code Blast.scheduledAt}).
     */
    @Query("SELECT e FROM BlastStatusEvent e WHERE e.toStatus = :toStatus "
            + "AND e.at BETWEEN :from AND :to ORDER BY e.at ASC")
    List<BlastStatusEvent> findByToStatusAndAtBetween(@Param("toStatus") BlastStatus toStatus,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
