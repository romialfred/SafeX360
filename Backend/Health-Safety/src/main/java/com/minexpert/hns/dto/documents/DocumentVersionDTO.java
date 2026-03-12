package com.minexpert.hns.dto.documents;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.minexpert.hns.entity.documents.DocumentVersion;
import com.minexpert.hns.entity.documents.Document;
import com.minexpert.hns.dto.MediaDTO;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentVersionDTO {
    private Long id;
    private String version;
    private String description;
    private MediaDTO media;
    private Long documentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DocumentVersion toEntity() {
        return new DocumentVersion(id, version, description, media != null ? media.toEntity() : null,
                documentId != null ? new Document(documentId) : null, createdAt, updatedAt);
    }

}
