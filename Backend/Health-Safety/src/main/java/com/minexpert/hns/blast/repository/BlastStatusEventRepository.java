package com.minexpert.hns.blast.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastStatusEvent;

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
}
