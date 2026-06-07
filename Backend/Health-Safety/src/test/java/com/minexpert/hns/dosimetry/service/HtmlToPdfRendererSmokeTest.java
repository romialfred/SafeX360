package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;

/**
 * Smoke test integration : verifie qu'un PDF est genere bout-en-bout (template Thymeleaf +
 * Flying Saucer + OpenPDF) pour chacun des 4 templates Phase 9.
 *
 * <p>Pour rester rapide et isole, on construit ici un {@link TemplateEngine} a la main
 * (resolver classpath sur {@code templates/}, mode HTML), sans demarrer le contexte Spring
 * complet (qui exigerait JPA + Eureka + autres). Cela permet de tester EXACTEMENT le pipeline
 * Thymeleaf -&gt; Flying Saucer -&gt; OpenPDF.
 */
class HtmlToPdfRendererSmokeTest {

    private static HtmlToPdfRenderer renderer;

    @BeforeAll
    static void buildRenderer() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        renderer = new HtmlToPdfRenderer(engine);
    }

    private void assertIsValidPdf(byte[] pdf) {
        assertThat(pdf).isNotEmpty();
        // Magic bytes "%PDF"
        assertThat(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII))
                .isEqualTo("%PDF");
    }

    private Map<String, Object> defaultWorker() {
        Map<String, Object> w = new LinkedHashMap<>();
        w.put("id", 1L);
        w.put("employeeId", 1001L);
        w.put("mineId", 1L);
        w.put("category", "A");
        w.put("specialStatus", "NONE");
        w.put("active", true);
        w.put("classificationDate", "2024-01-15");
        w.put("kpiCategory", "WORKER_A");
        return w;
    }

    @Test
    @DisplayName("Smoke : template attestation_individual rend un PDF valide")
    void smoke_attestation() {
        Context ctx = new Context();
        ctx.setVariable("brand", "SafeX 360");
        ctx.setVariable("generatedAt", "2026-06-07 12:00");
        ctx.setVariable("regulationFootnote", "CIPR 103");
        ctx.setVariable("watermark", "CONFIDENTIEL");
        ctx.setVariable("reason", "Inspection");
        ctx.setVariable("worker", defaultWorker());
        ctx.setVariable("year", 2026);
        ctx.setVariable("annualRows", List.<Map<String, Object>>of());
        ctx.setVariable("svgPoints", "0,0 10,10");
        ctx.setVariable("currentFitness", null);

        byte[] pdf = renderer.render("dosimetry/attestation_individual", ctx);
        assertIsValidPdf(pdf);
    }

    @Test
    @DisplayName("Smoke : template career_summary rend un PDF valide")
    void smoke_career() {
        Context ctx = new Context();
        ctx.setVariable("brand", "SafeX 360");
        ctx.setVariable("generatedAt", "2026-06-07 12:00");
        ctx.setVariable("regulationFootnote", "CIPR 103");
        ctx.setVariable("watermark", "CONFIDENTIEL");
        ctx.setVariable("reason", "Self-service");
        ctx.setVariable("worker", defaultWorker());
        ctx.setVariable("cumulRows", List.<Map<String, Object>>of());
        ctx.setVariable("fitRows", List.<Map<String, Object>>of());
        ctx.setVariable("lifetime", null);

        byte[] pdf = renderer.render("dosimetry/career_summary", ctx);
        assertIsValidPdf(pdf);
    }

    @Test
    @DisplayName("Smoke : template annual_register rend un PDF valide")
    void smoke_register() {
        Context ctx = new Context();
        ctx.setVariable("brand", "SafeX 360");
        ctx.setVariable("generatedAt", "2026-06-07 12:00");
        ctx.setVariable("regulationFootnote", "CIPR 103");
        ctx.setVariable("mineId", 1L);
        ctx.setVariable("year", 2026);
        ctx.setVariable("rows", List.<Map<String, Object>>of());
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalWorkers", 0);
        stats.put("countA", 0);
        stats.put("countB", 0);
        stats.put("workersOver100Pct", 0);
        stats.put("avgAnnualHp10", java.math.BigDecimal.ZERO);
        stats.put("fitnessCounts", new LinkedHashMap<>());
        ctx.setVariable("stats", stats);

        byte[] pdf = renderer.render("dosimetry/annual_register", ctx);
        assertIsValidPdf(pdf);
    }

    @Test
    @DisplayName("Smoke : template overexposure_report rend un PDF valide")
    void smoke_overexposure() {
        Context ctx = new Context();
        ctx.setVariable("brand", "SafeX 360");
        ctx.setVariable("generatedAt", "2026-06-07 12:00");
        ctx.setVariable("regulationFootnote", "CIPR 103");
        ctx.setVariable("watermark", "CONFIDENTIEL");
        ctx.setVariable("reason", "ASN");
        ctx.setVariable("worker", defaultWorker());
        Map<String, Object> caseData = new LinkedHashMap<>();
        caseData.put("id", 42L);
        caseData.put("level", "EXCEEDED");
        caseData.put("alertId", null);
        caseData.put("cause", "Cause text");
        caseData.put("correctiveActions", "Actions text");
        caseData.put("medicalDecision", "Decision text");
        caseData.put("authorityDeclaration", true);
        caseData.put("authorityDeclarationDate", "2026-05-01");
        caseData.put("status", "INVESTIGATING");
        caseData.put("openedAt", "2026-05-01 10:00");
        caseData.put("closedAt", "");
        ctx.setVariable("caseData", caseData);

        byte[] pdf = renderer.render("dosimetry/overexposure_report", ctx);
        assertIsValidPdf(pdf);
    }
}
