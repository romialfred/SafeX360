package com.minexpert.hns.entity.error;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadonnees d'une piece jointe rattachee a un {@link ErrorEvent}.
 * {@code fileRef} reference le stockage (id media / chemin objet).
 */
@Entity
@Table(name = "error_attachment")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_event_id")
    private Long errorEventId;

    @Column(name = "file_ref")
    private String fileRef;

    private String filename;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    private LocalDateTime uploadedAt;

    public ErrorAttachment(Long id) {
        this.id = id;
    }
}
