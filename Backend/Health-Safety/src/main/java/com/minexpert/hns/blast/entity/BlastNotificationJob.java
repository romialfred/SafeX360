package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tache planifiee de notification : rappels e-mail, popups web/mobile,
 * declenchement de l'Alerte Generale.
 *
 * <p>Persistee pour survivre aux redemarrages applicatifs (cf. §6 du PROMPT).
 * Le scheduler P3 prend toutes les taches {@code SCHEDULED} dont {@code scheduledAt}
 * est passe et tente leur execution avec idempotence.
 */
@Entity
@Table(name = "blast_notification_job",
        indexes = {
                @Index(name = "idx_blast_job_status_scheduled", columnList = "status, scheduled_at"),
                @Index(name = "idx_blast_job_blast", columnList = "blast_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastNotificationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blast_id", nullable = false)
    private Blast blast;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private JobType type;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private JobStatus status;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
