package com.minexpert.hns.dto.documents;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.documents.Document;
import com.minexpert.hns.entity.documents.Document.AccessLevel;
import com.minexpert.hns.entity.documents.Document.DocumentStatus;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentDTO {
    private Long id;
    private String documentName;
    private String description;
    private String category;
    private AccessLevel accessLevel;
    private DocumentStatus status;
    private Long ownerId;
    private Long departmentId;
    private boolean allowDownload;
    private List<String> tags;
    private LocalDateTime reviewDate;
    private LocalDateTime expiryDate;
    private MediaDTO media;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String statusReason;

    public Document toEntity() {
        return new Document(
                id,
                documentName,
                description,
                category,
                accessLevel,
                status,
                ownerId,
                departmentId,
                allowDownload,
                tags.toString(),
                reviewDate,
                expiryDate,

                createdAt,
                updatedAt,
                statusReason);
    }

}
