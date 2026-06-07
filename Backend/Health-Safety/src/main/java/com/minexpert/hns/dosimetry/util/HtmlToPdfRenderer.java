package com.minexpert.hns.dosimetry.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import lombok.RequiredArgsConstructor;

/**
 * Helper "HTML -> PDF" : combine Thymeleaf (pour rendre les templates en XHTML strict) et
 * Flying Saucer / OpenPDF (XHTML/CSS -> PDF). Centralise au meme endroit pour eviter la
 * duplication entre {@code DosimetryReportServiceImpl} et d'eventuels autres services
 * generateurs.
 *
 * <p><b>Pourquoi un composant Spring :</b> permet de mocker dans les tests unitaires des
 * services consommateurs sans avoir a embarquer Flying Saucer dans le contexte de test.
 *
 * <p><b>Robustesse :</b> Flying Saucer attend du XHTML strict (auto-close, attributs entre
 * guillemets, etc.). Les templates Thymeleaf doivent etre ecrits en xmlns conforme - cf.
 * fichiers {@code src/main/resources/templates/dosimetry/*.html}.
 */
@Component
@RequiredArgsConstructor
public class HtmlToPdfRenderer {

    private final TemplateEngine templateEngine;

    /**
     * Rend un template Thymeleaf puis le convertit en PDF.
     *
     * @param templateName nom du template (sans extension) sous {@code templates/}
     * @param context      contexte Thymeleaf rempli par l'appelant
     * @return tableau d'octets PDF
     */
    public byte[] render(String templateName, Context context) {
        String html = templateEngine.process(templateName, context);
        return convertHtmlToPdf(html);
    }

    /**
     * Convertit une chaine XHTML stricte en PDF.
     */
    public byte[] convertHtmlToPdf(String xhtml) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(xhtml);
            renderer.layout();
            renderer.createPDF(out);
            renderer.finishPDF();
            return out.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to render PDF from HTML", ex);
        }
    }
}
