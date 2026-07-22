package com.minexpert.hns.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentAnalysis;
import com.minexpert.hns.entity.incident.RiskAssessment;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.IncidentStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentDTO {
    private Long id;
    private String number;
    @NotBlank(message = "Le titre de l'incident est obligatoire.")
    @Size(max = 255, message = "Le titre de l'incident ne doit pas dépasser 255 caractères.")
    private String title;
    private List<String> ppe;
    private Long locationId;
    private List<Long> weatherConditions;
    /**
     * PAS de @NotNull ICI, volontairement — et c'est une decision de conception, pas
     * un oubli. Cette contrainte existait mais n'a JAMAIS ete evaluee (aucun @Valid
     * sur le corps de la requete). L'activer telle quelle transformerait en 400 des
     * declarations aujourd'hui acceptees : la colonne est nullable, et les ecrans
     * terrain (MobileIncidentQuickDeclare / MobileAIIncidentDeclare) derivent le
     * departement du profil utilisateur — il vaut null si l'employe n'en a pas et
     * ces ecrans n'offrent aucun selecteur de repli.
     *
     * Or une declaration d'incident ne doit JAMAIS etre freinee (ISO 45001 §10.2 /
     * spec formulaires §4) : bloquer produit de la sous-declaration, le pire echec
     * d'un SMS. Un incident au departement manquant reste rattrapable a l'edition ;
     * un incident jamais declare est perdu.
     *
     * Le departement est donc exige la ou il est REELLEMENT collectable (formulaires
     * web de declaration : champ obligatoire cote client), et persiste dans tous les
     * cas ou il est fourni.
     */
    private Long departmentId;
    /**
     * Renseigne par le SERVEUR depuis le @RequestParam companyId (mine active du
     * header) — jamais porte par le corps de la requete. Aucune contrainte @NotNull
     * ici : elle s'evaluerait AVANT setCompanyId() et rejetterait toute declaration
     * (l'absence de mine est deja traitee par HSException COMPANY_ID_REQUIRED).
     */
    private Long companyId;
    private IncidentStatus status;
    private LocalDateTime occurredAt;
    private LocalDateTime discoveryTime;
    private Long workAreaId;
    private Long workProcessId;
    private List<IncidentDetailDTO> incidentDetails;

    private Long reporterId;
    private List<Long> involvedPersons;
    private List<Long> witnesses;
    private List<MediaDTO> evidence;

    private String factualDescription;
    private String immediateCauses;
    private String rootCauses;
    private String contributingFactors;
    private String immediateConsequences;
    private String potentialConsequences;
    private String immediateActions;

    private Integer probability;
    private Integer severity;
    // Risque APRES mesures (ISO 45001 §8.1.2) — ré-évaluation structurée.
    private Integer postProbability;
    private Integer postSeverity;
    // Sévérité POTENTIELLE — pire scénario crédible (ICMM / ISO 45001 §6.1.2).
    private Integer potentialProbability;
    private Integer potentialSeverity;
    /** Incident à Haut Potentiel — dérivé serveur de la gravité potentielle. */
    private Boolean highPotential;
    private String existingControlMeasures;
    private String residualRiskAssessment;
    private String departmentName;

    /**
     * Origine de la declaration : "EMPLOYEE" (par defaut) ou "AI" (Wizard Declaration IA Vision).
     * Permet le filtre Source sur la page Gestion des incidents.
     */
    private String source;
    /** Confiance de l'analyse IA, entre 0 et 1 (uniquement si source=AI). */
    private Double aiConfidence;
    /** Modele IA utilise (ex: "claude-sonnet-4-5"). */
    private String aiModel;

    // Finitions E3.2 : engin/équipement, quart, signalement confidentiel.
    private String equipment;
    private String shift;
    private Boolean confidential;

    // Reporting réglementaire (E3.1) — LECTURE seule côté DTO : ces champs sont
    // gérés par les endpoints dédiés /regulatory et /mark-notified, JAMAIS écrits
    // par toIncident() (sinon une édition de contenu les effacerait). Exposés ici
    // pour le bandeau d'échéance réglementaire du détail incident.
    private Boolean notifiable;
    private java.time.LocalDate regulatoryDeadline;
    private java.time.LocalDate notifiedToAuthorityAt;

    public Incident toIncident() {
        Incident incident = new Incident();
        incident.setId(id);
        incident.setNumber(number);
        incident.setTitle(title);
        incident.setPpe(ppe != null ? ppe.toString() : null);
        incident.setLocation(locationId != null ? new Location(locationId) : null);
        incident.setWeatherConditions(weatherConditions != null ? weatherConditions.toString() : null);
        incident.setDepartmentId(departmentId);
        incident.setCompanyId(companyId);
        incident.setOccurredAt(occurredAt);
        incident.setDiscoveryTime(discoveryTime);
        incident.setWorkArea(workAreaId != null ? new WorkArea(workAreaId) : null);
        incident.setWorkProcess(workProcessId != null ? new WorkProcess(workProcessId) : null);
        incident.setReporterId(reporterId);
        incident.setStatus(status);
        incident.setInvolvedPersons(involvedPersons != null ? involvedPersons.toString() : null);
        incident.setWitnesses(witnesses != null ? witnesses.toString() : null);
        // Trace l'origine : par defaut EMPLOYEE si non specifie (saisie classique).
        incident.setSource(source != null && !source.isBlank() ? source.toUpperCase() : "EMPLOYEE");
        incident.setAiConfidence(aiConfidence);
        incident.setAiModel(aiModel);
        // Haut Potentiel (ICMM / ISO 45001 §6.1.2) dérivé de la gravité POTENTIELLE :
        // un pire scénario crédible >= 4/5 (grave à mortel) classe l'incident HPI,
        // qui impose alors une enquête approfondie même pour un simple presque-accident.
        incident.setHighPotential(potentialSeverity != null && potentialSeverity >= 4);
        // E3.2 : contexte terrain + confidentialité (posés à la déclaration ;
        // PRÉSERVÉS à l'édition de contenu, cf. updateIncident).
        incident.setEquipment(equipment);
        incident.setShift(shift);
        incident.setConfidential(confidential);
        return incident;
    }

    public IncidentAnalysis toIncidentAnalysis() {
        return new IncidentAnalysis(null, factualDescription, immediateCauses, rootCauses, contributingFactors,
                immediateConsequences, potentialConsequences, immediateActions, null,
                null, null);
    }

    public RiskAssessment toRiskAssessment() {
        // Construction par setters (et non par le constructeur positionnel
        // @AllArgsConstructor) : l'entité gagne des colonnes (risque post-mesures
        // ISO 45001 §8.1.2...) et un mapping positionnel casserait à chaque ajout.
        RiskAssessment ra = new RiskAssessment();
        ra.setProbability(probability);
        ra.setSeverity(severity);
        ra.setPostProbability(postProbability);
        ra.setPostSeverity(postSeverity);
        ra.setPotentialProbability(potentialProbability);
        ra.setPotentialSeverity(potentialSeverity);
        ra.setExistingControlMeasures(existingControlMeasures);
        ra.setResidualRiskAssessment(residualRiskAssessment);
        return ra;
    }
}
