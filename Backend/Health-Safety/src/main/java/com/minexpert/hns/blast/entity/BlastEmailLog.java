package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.blast.enums.EmailLogStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Journal des envois e-mail (audit operationnel des rappels de tir).
 *
 * <p>Une ligne par tentative d'envoi a un destinataire. L'erreur SMTP eventuelle
 * est conservee verbatim pour analyse forensique.
 */
@Entity
@Table(name = "blast_email_log",
        indexes = {
                @Index(name = "idx_blast_email_log_job", columnList = "job_id"),
                @Index(name = "idx_blast_email_log_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastEmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Job de notification a l'origine de l'envoi. {@code null} pour les emails
     * de cycle de vie envoyes synchroniquement par {@code BlastService}
     * (CANCELLED / RESCHEDULED), qui ne passent pas par {@code blast_notification_job}.
     * Nullable depuis V017 (P5).
     */
    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "recipient", nullable = false, length = 255)
    private String recipient;

    @Column(name = "subject", length = 512)
    private String subject;

    @Column(name = "language", length = 8)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private EmailLogStatus status;

    @Column(name = "error", columnDefinition = "TEXT")
    private String error;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
