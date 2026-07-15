package com.minexpert.hns.entity.communications;

import com.minexpert.hns.dto.communications.CommunicationDTO;
import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "communications")
public class Communication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String category;
    private String title;

    private Long senderId;
    private String senderName;
    private String senderEmail;

    @Lob
    private String content;

    @Column(length = 2000)
    private String recipients;

    private Long departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private WorkArea zone;

    private LocalDateTime scheduledAt;
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    private Urgency urgency;

    @Column(length = 2000)
    private String attachments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Cloisonnement multi-tenant par mine (convention plateforme SafeX). */
    private Long companyId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public CommunicationDTO toDTO() {
        return new CommunicationDTO(
                id,
                type,
                category,
                title,
                senderId,
                senderName,
                senderEmail,
                content,
                StringListConverter.convertToLongList(recipients),
                departmentId,
                zone != null ? zone.getId() : null,
                scheduledAt,
                expiresAt,
                urgency,
                null,
                createdAt,
                updatedAt,
                null,
                companyId);
    }

    public enum Urgency {
        URGENT,
        NORMAL
    }
}
