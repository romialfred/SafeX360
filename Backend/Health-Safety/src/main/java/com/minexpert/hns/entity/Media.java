package com.minexpert.hns.entity;

import java.util.Base64;

import com.minexpert.hns.dto.MediaDTO;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String type;
    @Lob
    private byte[] file;

    /**
     * Cloisonnement par mine (audit pré-prod : sans lui, GET/DELETE /media/{id}
     * permettait d'aspirer/supprimer les pièces jointes de toutes les mines).
     * Renseigné à l'enregistrement depuis le contexte de requête ; null = média
     * hérité (avant le correctif) — lecture tolérée, cf. MediaAPI.
     */
    private Long companyId;

    public MediaDTO toDTO() {
        return new MediaDTO(this.id, this.name, this.type,
                file != null ? Base64.getEncoder().encodeToString(file) : null);
    }
}
