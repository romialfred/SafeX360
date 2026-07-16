package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.entity.inspections.InspectionTeamMember;

/**
 * Acces a l'equipe d'inspection (employe + role). L'invariant « exactement un
 * LEAD » est porte par le service, pas par une contrainte SQL : une contrainte
 * unique partielle n'est pas portable sur MySQL.
 */
public interface InspectionTeamMemberRepository
        extends JpaRepository<InspectionTeamMember, Long> {

    /** Membres d'une inspection, ordre d'insertion (le LEAD est cree en premier). */
    List<InspectionTeamMember> findByInspection_IdOrderByIdAsc(Long inspectionId);

    /** Purge de l'equipe d'une inspection (re-planification / suppression). */
    void deleteByInspection_Id(Long inspectionId);
}
