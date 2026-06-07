package com.minexpert.hns.dosimetry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resultat d'une generation de document (PDF ou export reglementaire).
 *
 * <p>Contient le payload binaire ({@code content}), le nom de fichier suggere et le mime type
 * (pour positionner correctement les en-tetes HTTP {@code Content-Type} et
 * {@code Content-Disposition}).
 *
 * <p><b>Aucun champ nominatif dans le DTO lui-meme :</b> le contenu binaire reste opaque cote
 * controller et n'est consulte qu'en flux sortant (avec audit RGPD prealable cote service).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryReportDocumentDTO {

    /** Nom de fichier suggere (sera utilise dans Content-Disposition: attachment). */
    private String filename;

    /** MIME type (ex. application/pdf, application/xml, text/csv). */
    private String contentType;

    /** Contenu binaire complet. */
    private byte[] content;
}
