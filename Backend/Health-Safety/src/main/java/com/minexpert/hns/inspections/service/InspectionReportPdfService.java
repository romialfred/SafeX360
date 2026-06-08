package com.minexpert.hns.inspections.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;

import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;

/**
 * Service de generation du rapport PDF d'une inspection HSE.
 *
 * <p>Reutilise le HtmlToPdfRenderer (Thymeleaf + Flying Saucer) deja en place
 * pour Dosimetry et Blast. Template : {@code templates/inspection/inspection_report.html}.</p>
 *
 * <p>Reference normative : ISO 45001 §8.1 (Planification et maitrise
 * operationnelle) et §9.1 (Surveillance, mesure, analyse, evaluation). Le
 * rapport doit etre archive 5 ans minimum (politique HSE interne).</p>
 */
@Service
public class InspectionReportPdfService {

    private static final DateTimeFormatter GENERATED_AT_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Autowired
    private InspectionWorkflowService workflowService;

    @Autowired
    private HtmlToPdfRenderer pdfRenderer;

    /**
     * Genere le PDF du rapport pour l'inspection donnee. Si {@code english}
     * est vrai, le rapport est rendu en anglais (subtitle, headers, footer).
     * Par defaut francais.
     */
    public byte[] generate(Long inspectionId, boolean english) {
        InspectionDetailDTO insp = workflowService.getDetail(inspectionId);
        Context ctx = new Context();
        ctx.setVariable("insp", insp);
        ctx.setVariable("brand", "SafeX 360");
        ctx.setVariable("isEnglish", english);
        ctx.setVariable("generatedAt", LocalDateTime.now().format(GENERATED_AT_FMT));
        return pdfRenderer.render("inspection/inspection_report", ctx);
    }
}
