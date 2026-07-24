package com.minexpert.hns.policy.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.policy.entity.HsPolicy;
import com.minexpert.hns.policy.enums.HsPolicyStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vue complète d'une politique : en-tête + signature + articles. Sert à la fois
 * à l'édition (management) et à la lecture (travailleur). Les champs de
 * consultation ({@code acknowledged}, {@code acknowledgedAt}, {@code stats})
 * sont posés par le service selon l'appelant.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsPolicyDTO {
    private Long id;
    private Long companyId;
    private String title;
    private String preamble;
    private Integer version;
    private HsPolicyStatus status;
    private LocalDate effectiveDate;

    private String signatoryName;
    private String signatoryTitle;
    private LocalDateTime signedAt;
    private String signatureImage;

    /** PDF officiel joint (facultatif) : nom + contenu base64 (data-URL). */
    private String attachmentName;
    private String attachmentData;

    private List<HsPolicyArticleDTO> articles;

    // ── Consultation (§5.4), renseigné à la lecture ──
    /** L'utilisateur courant a-t-il déjà pris connaissance de cette politique ? */
    private Boolean acknowledged;
    private LocalDateTime acknowledgedAt;

    public static HsPolicyDTO fromEntity(HsPolicy p, List<HsPolicyArticleDTO> articles) {
        HsPolicyDTO dto = new HsPolicyDTO();
        dto.id = p.getId();
        dto.companyId = p.getCompanyId();
        dto.title = p.getTitle();
        dto.preamble = p.getPreamble();
        dto.version = p.getVersion();
        dto.status = p.getStatus();
        dto.effectiveDate = p.getEffectiveDate();
        dto.signatoryName = p.getSignatoryName();
        dto.signatoryTitle = p.getSignatoryTitle();
        dto.signedAt = p.getSignedAt();
        dto.signatureImage = p.getSignatureImage();
        dto.attachmentName = p.getAttachmentName();
        dto.attachmentData = p.getAttachmentData();
        dto.articles = articles;
        return dto;
    }
}
