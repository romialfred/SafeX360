package com.minexpert.hns.entity.error;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.ErrorEventStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Piste d'audit d'un {@link ErrorEvent} : une ligne par creation et par
 * transition d'etat. {@code actorLabel} permet de tracer un acteur sans le
 * nommer (ex. « Declarant anonyme ») lorsque l'anonymat est requis.
 */
@Entity
@Table(name = "error_event_history")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorEventHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_event_id")
    private Long errorEventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32)
    private ErrorEventStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 32)
    private ErrorEventStatus toStatus;

    private String action;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_label")
    private String actorLabel;

    @Lob
    private String comment;

    private LocalDateTime timestamp;

    public ErrorEventHistory(Long id) {
        this.id = id;
    }
}
