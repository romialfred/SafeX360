package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.response.ActionProcessResponse;
import com.minexpert.hns.enums.ActionStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActionProcess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private ActionStatus status;
    private String description;
    private Integer progress;
    private String docs;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corrective_action_id", nullable = false)
    private CorrectiveAction correctiveAction;
    private LocalDateTime createdAt;

    public ActionProcessResponse toResponse() {
        return new ActionProcessResponse(this.id, this.status, this.description, progress,
                null, this.correctiveAction != null ? this.correctiveAction.getId() : null, this.createdAt);
    }
}
