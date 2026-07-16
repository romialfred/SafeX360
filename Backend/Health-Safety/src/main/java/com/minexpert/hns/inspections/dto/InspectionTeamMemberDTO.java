package com.minexpert.hns.inspections.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Membre de l'equipe d'inspection (employe + role), a la planification comme
 * en relecture dans le detail d'inspection.
 *
 * <p>Contrat fige (refonte Inspections, D4) : {@code { id, employeeId, role }}.</p>
 *
 * <p>Regles appliquees par {@code InspectionWorkflowService.schedule()} :</p>
 * <ul>
 *   <li>Un membre sans {@code employeeId} est ignore silencieusement (ligne
 *       vide laissee par l'IHM).</li>
 *   <li>Exactement un membre de role {@code LEAD} : s'il en manque un mais que
 *       {@code primaryInspectorId} est fourni, le LEAD est cree depuis lui ;
 *       s'il y en a plusieurs, la planification est refusee.</li>
 *   <li>Doublons par {@code employeeId} rejetes (un seul role par personne).</li>
 * </ul>
 */
@Data
@NoArgsConstructor
public class InspectionTeamMemberDTO {

    private Long id;

    /** ID de l'employe (referentiel HRMS). Requis. */
    private Long employeeId;

    /** LEAD | INSPECTOR | SPECIALIST | EQUIPMENT_OWNER | OBSERVER. */
    @Size(max = 24)
    private String role;
}
