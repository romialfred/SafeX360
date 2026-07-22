package com.minexpert.hns.repository.incident;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.incident.RiskAssessment;

public interface RiskAssessmentRepository extends CrudRepository<RiskAssessment, Long> {

    /**
     * Recupere l'evaluation de risque d'un incident PAR SON incident_id, en
     * retenant la plus RECENTE si plusieurs existent.
     *
     * Historiquement le service faisait {@code findById(incidentId)} — or le PK de
     * RiskAssessment est auto-genere et ne coincide avec l'incident_id que par
     * hasard sur les premieres lignes (verifie en base : id 23 -> incident 22,
     * id 25 -> incident 62...). Ce lookup renvoyait donc le mauvais enregistrement
     * (risque affiche faux) et, a l'update, faisait un INSERT a chaque edition
     * (isPresent() faux) : des lignes legacy DUPLIQUEES par incident_id ont pu
     * s'accumuler. Un simple findByIncident_Id (cardinalite 1) leverait alors
     * NonUniqueResultException (500). On prend donc defensivement la plus recente
     * (MAX id) : correcte pour le cas nominal (1 ligne) ET robuste aux doublons.
     */
    Optional<RiskAssessment> findFirstByIncident_IdOrderByIdDesc(Long incidentId);

}
