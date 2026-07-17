package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.AuditCategory;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditDTO {
    private Long id;
    // Messages metier en FR : un « title is required » brut est une non-conformite
    // documentaire (spec §5.6 — jamais de message technique anglais a l'ecran).
    @NotBlank(message = "Le titre de l'audit est obligatoire.")
    @Size(max = 255, message = "Le titre de l'audit ne doit pas depasser 255 caracteres.")
    private String title;
    private String refNumber;
    private List<String> objectives;
    private List<Long> processes;
    private Long scopeId;
    private List<String> methods;
    private String description;
    @NotNull(message = "La modalite d'audit (interne / externe) est obligatoire.")
    private AuditCategory category;
    private Map<String, List<String>> auditTypes;
    private List<String> references;
    private LocalDate startDate;
    private LocalDate endDate;
    private AuditStatus status;
    private PlanningStatus planningStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** LOT 52 — rattachement optionnel au programme d'audit annuel. */
    private Long programId;

    /** LOT 52 — score de priorité basé risques. */
    private Integer riskScore;

    /** Cloisonnement par mine : identifiant de la société/mine propriétaire. */
    private Long companyId;

    /**
     * Types d'audit HSE retenus (champ OBLIGATOIRE du formulaire, §7.5 : ce que
     * le formulaire promet, le serveur le tient). Auparavant absent du DTO et de
     * l'entité, il était silencieusement jeté : seule la map {@code auditTypes}
     * (type -> critères) survivait, et uniquement si un critère était coché —
     * décocher tous les critères effaçait donc le type.
     *
     * ⚠ Champ ajouté EN DERNIER : le constructeur positionnel Lombok
     * (@AllArgsConstructor) suit l'ordre de déclaration.
     */
    private List<String> types;

    public Audit toEntity() {
        return new Audit(this.id, this.title, this.refNumber,
                com.minexpert.hns.utility.StringListConverter.listToString(objectives),
                com.minexpert.hns.utility.StringListConverter.listToString(processes),
                new AuditAreas(scopeId), com.minexpert.hns.utility.StringListConverter.listToString(methods),
                description, this.category, auditTypes,
                com.minexpert.hns.utility.StringListConverter.listToString(this.references),
                this.startDate,
                this.endDate, this.status, this.planningStatus, this.createdAt, this.updatedAt,
                this.programId, this.riskScore, this.companyId,
                com.minexpert.hns.utility.StringListConverter.listToString(this.types));
    }

    public AuditDetails toDetails() {
        return new AuditDetails(id, title, refNumber, objectives, processes, scopeId, methods, description, category,
                auditTypes, references, startDate, endDate, status, planningStatus,
                createdAt, updatedAt, types);
    }
}
