package com.minexpert.hns.entity.inspections;

import com.minexpert.hns.entity.GeneralInspection;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Membre de l'equipe d'inspection : un employe + le role qu'il tient sur
 * CETTE inspection (D4 de la refonte 2026-07).
 *
 * <p><b>Ne pas confondre avec {@link InspectionApproval}</b> : celui-ci porte
 * la DECISION de validation (APPROVE/REJECT) d'un membre sur une inspection
 * soumise. L'equipe (qui participe) et les approbations (qui valide) sont deux
 * notions distinctes, meme si dans la pratique les memes personnes s'y
 * retrouvent. Cette entite remplace le champ {@code participants} (String
 * serialisee, deprecie) qui ne permettait aucun rapprochement avec le
 * referentiel employes.</p>
 *
 * <p><b>Invariant metier</b> (porte par
 * {@code InspectionWorkflowService.schedule()}) : exactement UN membre de role
 * {@code LEAD} par inspection, dont l'{@code employeeId} est recopie dans
 * {@code GeneralInspection.primaryInspectorId}. Un employe donne n'apparait
 * qu'une seule fois (un seul role par personne et par inspection).</p>
 *
 * <p>La table est creee au boot par Hibernate ({@code ddl-auto=update}) :
 * aucune migration DDL n'est requise.</p>
 */
@Entity
@Table(
        name = "inspection_team_member",
        indexes = {
                @Index(name = "idx_team_member_inspection", columnList = "inspection_id"),
                @Index(name = "idx_team_member_employee", columnList = "employee_id"),
                @Index(name = "idx_team_member_company", columnList = "company_id")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionTeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private GeneralInspection inspection;

    /** ID de l'employe (referentiel HRMS). Obligatoire. */
    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    /**
     * Role tenu sur cette inspection. Stocke en String (et non en ordinal) pour
     * qu'un role ajoute plus tard ne decale pas les valeurs existantes.
     * Valeurs valides : voir {@code InspectionTeamRole}
     * (LEAD | INSPECTOR | SPECIALIST | EQUIPMENT_OWNER | OBSERVER).
     */
    @Column(nullable = false, length = 24)
    private String role;

    /**
     * Mine proprietaire (cloisonnement). Recopie depuis l'inspection parente a
     * la creation. Nullable pour tolerer d'eventuelles donnees legacy.
     */
    @Column(name = "company_id")
    private Long companyId;
}
