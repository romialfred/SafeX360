package com.minexpert.hns.dto.response;

import java.time.LocalDate;

import com.minexpert.hns.enums.ActionPriority;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.ActionType;
import com.minexpert.hns.enums.ControlHierarchy;
import com.minexpert.hns.enums.EventType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CorrectiveActionResponse {
    private Long id;
    private String actionName;
    private Long incidentId;
    private String incidentTitle;
    private Long assignedEmployeeId;
    private String assignedEmployeeName;
    private Long departmentId;
    private Long ownerId;
    private Long companyId;
    private LocalDate deadline;
    private ActionStatus status;
    private String description;
    private Integer progress;
    private String type;
    // Classification ISO 45001 §8.1.2 / §10.2 (peuplées uniquement par le chemin incident).
    private ControlHierarchy controlHierarchy;
    private ActionType actionType;
    private ActionPriority priority;
    private Long causeId;

    public CorrectiveActionResponse(Long id, String actionName, Long incidentId, String incidentTitle,
            Long assignedEmployeeId, String assignedEmployeeName, Long departmentId, Long ownerId, Long companyId,
            LocalDate deadline, ActionStatus status, String description, Integer progress, EventType type) {
        this.id = id;
        this.actionName = actionName;
        this.incidentId = incidentId;
        this.incidentTitle = incidentTitle;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeName = assignedEmployeeName;
        this.departmentId = departmentId;
        this.ownerId = ownerId;
        this.companyId = companyId;
        this.deadline = deadline;
        this.status = status;
        this.description = description;
        this.progress = progress;
        this.type = type.toString();
    }

    /**
     * Constructeur à 14 arguments dont l'origine ({@code type}) est déjà une CHAÎNE.
     *
     * <p>Les requêtes JPQL de {@code CorrectiveActionRepository} calculent l'origine
     * via une expression {@code CASE} qui renvoie des littéraux String
     * ('INCIDENT', 'HS_ACTIVITY', 'GENERAL_INSPECTION', 'ADHOC', 'NON_CONFORMITY'…),
     * PAS un {@link EventType}. Avant l'ajout des 4 champs de classification ISO
     * (controlHierarchy/actionType/priority/causeId), ce constructeur était fourni
     * IMPLICITEMENT par {@code @AllArgsConstructor} (le DTO avait alors 14 champs) et
     * c'est lui que résolvaient ces requêtes. L'ajout des champs a fait passer
     * {@code @AllArgsConstructor} à 18 arguments : le constructeur 14-args à String a
     * disparu, ne laissant que la variante {@code EventType} — à laquelle une String
     * n'est pas assignable. Résultat : « Validation failed for query » au démarrage,
     * le contexte Spring ne bootait plus (déploiement HNS en échec). On le restaure
     * explicitement. NE PAS supprimer : plusieurs requêtes en dépendent.
     */
    public CorrectiveActionResponse(Long id, String actionName, Long incidentId, String incidentTitle,
            Long assignedEmployeeId, String assignedEmployeeName, Long departmentId, Long ownerId, Long companyId,
            LocalDate deadline, ActionStatus status, String description, Integer progress, String type) {
        this.id = id;
        this.actionName = actionName;
        this.incidentId = incidentId;
        this.incidentTitle = incidentTitle;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeName = assignedEmployeeName;
        this.departmentId = departmentId;
        this.ownerId = ownerId;
        this.companyId = companyId;
        this.deadline = deadline;
        this.status = status;
        this.description = description;
        this.progress = progress;
        this.type = type;
    }

    /** Variante enrichie de la classification (chemin d'édition d'investigation). */
    public CorrectiveActionResponse(Long id, String actionName, Long incidentId, String incidentTitle,
            Long assignedEmployeeId, String assignedEmployeeName, Long departmentId, Long ownerId, Long companyId,
            LocalDate deadline, ActionStatus status, String description, Integer progress, EventType type,
            ControlHierarchy controlHierarchy, ActionType actionType, ActionPriority priority, Long causeId) {
        this(id, actionName, incidentId, incidentTitle, assignedEmployeeId, assignedEmployeeName, departmentId,
                ownerId, companyId, deadline, status, description, progress, type);
        this.controlHierarchy = controlHierarchy;
        this.actionType = actionType;
        this.priority = priority;
        this.causeId = causeId;
    }
}
