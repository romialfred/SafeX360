package com.minexpert.hns.inspections.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload pour planifier une nouvelle inspection (web ou mobile).
 *
 * <p>Le service genere automatiquement les findings vides correspondant aux
 * checkpoints du template choisi (statut NOT_APPLICABLE par defaut, prets
 * a etre remplis lors de l'execution terrain).</p>
 */
@Data
@NoArgsConstructor
public class ScheduleInspectionDTO {

    @NotNull(message = "Le template d'inspection est obligatoire")
    private Long templateId;

    /**
     * Lieu physique (Location) de l'inspection. OPTIONNEL : dérivé de la cible
     * côté client (lieu de rattachement de l'équipement, ou la localisation
     * elle-même). La mine est portée par le paramètre {@code companyId} de la
     * requête (cloisonnement), pas par ce champ.
     */
    private Long siteId;

    /**
     * Identifiant de la cible (equipment_id, location_id ou procedure_id
     * selon le type du template). Pour les templates de type LOCATION, on
     * peut reutiliser le siteId si la cible est le site lui-meme.
     */
    @NotNull(message = "La reference de la cible est obligatoire")
    private Long targetRefId;

    /**
     * Libelle affiche de la cible (denormalise, ex : "Camion Volvo A40G #18",
     * "Atelier maintenance Sud", "Procedure LOTO ligne TC-04").
     */
    @NotNull
    @Size(max = 200)
    private String targetLabel;

    @NotNull(message = "La date planifiee est obligatoire")
    private LocalDate plannedDate;

    private LocalTime startTime;

    private LocalTime endTime;

    @Size(max = 500)
    private String description;

    @Size(max = 500)
    private String objectives;

    /** Inspecteur principal en charge de l'execution. */
    private Long primaryInspectorId;

    /**
     * Equipe d'inspection (employe + role). Nullable/vide tolere : dans ce cas
     * le comportement historique s'applique et le seul
     * {@code primaryInspectorId} fait foi (un LEAD est alors cree depuis lui).
     *
     * <p>Invariant applique par le service : exactement UN membre {@code LEAD},
     * dont l'{@code employeeId} alimente {@code primaryInspectorId}.</p>
     */
    private List<InspectionTeamMemberDTO> teamMembers;
}
