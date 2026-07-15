package com.minexpert.hns.entity.documents;

import com.minexpert.hns.dto.documents.DocumentDTO;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String documentName;

    @Column(length = 2000)
    private String description;
    private String category;

    @Enumerated(EnumType.STRING)
    private AccessLevel accessLevel;

    @Enumerated(EnumType.STRING)
    private DocumentStatus status;

    private Long ownerId;

    private Long departmentId;

    private boolean allowDownload;

    private String tags;

    private LocalDateTime reviewDate;

    private LocalDateTime expiryDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Traçabilité ISO : motif du dernier changement de statut (approbation,
    // archivage, rejet...). Renseigné via /documents/status/{id}?reason=...
    @Column(length = 1000)
    private String statusReason;

    /** Cloisonnement multi-tenant par mine (convention plateforme SafeX). */
    private Long companyId;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum AccessLevel {
        PUBLIC,
        INTERNAL,
        CONFIDENTIAL,
        RESTRICTED
    }

    public enum DocumentStatus {
        DRAFT,
        UNDER_REVIEW,
        APPROVED,
        ARCHIVED
    }

    public DocumentDTO toDTO() {
        return new DocumentDTO(
                id,
                documentName,
                description,
                category,
                accessLevel,
                status,
                ownerId,
                departmentId,
                allowDownload,
                StringListConverter.convertToStringList(tags),
                reviewDate,
                expiryDate,
                null,
                createdAt,
                updatedAt,
                statusReason,
                companyId);
    }

    public Document(Long id) {
        this.id = id;
    }
}
