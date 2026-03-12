package com.minexpert.hns.entity.communications;

import com.minexpert.hns.dto.communications.NotificationDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "communication_id", nullable = false)
    private Communication communication;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comm_time_id", nullable = false)
    private CommTime commTime;
    @Column(name = "deduped_key", length = 128)
    private String dedupedKey;
    @Enumerated(EnumType.STRING)
    private NotiRunStatus status;
    @Lob
    @Column(name = "response_message", columnDefinition = "TEXT")
    private String responseMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public NotificationDTO toDTO() {
        return NotificationDTO.fromEntity(this);
    }
}
