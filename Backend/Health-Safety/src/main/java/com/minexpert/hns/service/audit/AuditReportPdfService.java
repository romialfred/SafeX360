package com.minexpert.hns.service.audit;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.AuditChecklistItem;
import com.minexpert.hns.entity.audit.Auditor;
import com.minexpert.hns.entity.audit.Meeting;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.entity.audit.Report;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditChecklistItemRepository;
import com.minexpert.hns.repository.audit.AuditRepository;
import com.minexpert.hns.repository.audit.AuditorRepository;
import com.minexpert.hns.repository.audit.MeetingRepository;
import com.minexpert.hns.repository.audit.ObservationRepository;
import com.minexpert.hns.repository.audit.ReportRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Génération du rapport d'audit PDF structuré ISO 19011 §6.5 :
 * identification de l'audit, critères/référentiels, équipe, réunions tenues,
 * synthèse de la checklist par référentiel, constats classés, conclusions et
 * circuit d'approbation. Rendu via l'infrastructure XHTML→PDF existante.
 */
@Service
@RequiredArgsConstructor
public class AuditReportPdfService {

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String> CLASSIFICATION_LABELS = Map.of(
            "NC_MAJEURE", "Non-conformité majeure",
            "NC_MINEURE", "Non-conformité mineure",
            "OBSERVATION", "Observation",
            "OPPORTUNITE", "Opportunité d'amélioration");

    private final AuditRepository auditRepository;
    private final AuditorRepository auditorRepository;
    private final MeetingRepository meetingRepository;
    private final AuditChecklistItemRepository checklistItemRepository;
    private final ObservationRepository observationRepository;
    private final ReportRepository reportRepository;
    private final HtmlToPdfRenderer htmlToPdfRenderer;

    public byte[] generatePdf(Long auditId) throws HSException {
        Audit audit = auditRepository.findById(auditId)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        List<Auditor> team = auditorRepository.findByAudit_Id(auditId);
        List<Meeting> meetings = meetingRepository.findByAudit_Id(auditId);
        List<AuditChecklistItem> checklist = checklistItemRepository.findByAuditIdOrderByReferentialAscIdAsc(auditId);
        List<Observation> observations = observationRepository.findByAudit_Id(auditId);
        Report report = reportRepository.findByAudit_Id(auditId).orElse(null);

        return htmlToPdfRenderer.convertHtmlToPdf(buildHtml(audit, team, meetings, checklist, observations, report));
    }

    private String buildHtml(Audit audit, List<Auditor> team, List<Meeting> meetings,
                             List<AuditChecklistItem> checklist, List<Observation> observations, Report report) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><head>")
            .append("<meta charset=\"UTF-8\"/><style>")
            .append("body{font-family:Helvetica,Arial,sans-serif;font-size:10pt;color:#1e293b;margin:28px}")
            .append("h1{font-size:16pt;color:#0F766E;border-bottom:2px solid #0F766E;padding-bottom:6px;margin-bottom:2px}")
            .append(".sub{color:#64748b;font-size:9pt;margin-bottom:18px}")
            .append("h2{font-size:11.5pt;color:#0F766E;margin:18px 0 6px;border-bottom:1px solid #e2e8f0;padding-bottom:3px}")
            .append("table{width:100%;border-collapse:collapse;margin:6px 0}")
            .append("th{background:#f1f5f9;text-align:left;padding:5px 7px;font-size:8.5pt;text-transform:uppercase;color:#475569;border:1px solid #e2e8f0}")
            .append("td{padding:5px 7px;border:1px solid #e2e8f0;vertical-align:top}")
            .append(".badge{font-size:8pt;padding:1px 6px;border:1px solid #cbd5e1}")
            .append(".ncmaj{color:#b91c1c}.ncmin{color:#c2410c}.obs{color:#1d4ed8}.opp{color:#047857}")
            .append(".sign{margin-top:30px;width:100%}.sign td{border:none;padding-top:36px;border-top:1px solid #94a3b8;width:50%;text-align:center;font-size:9pt}")
            .append("</style></head><body>");

        // ── En-tête ──
        html.append("<h1>Rapport d'audit — ").append(esc(audit.getTitle())).append("</h1>")
            .append("<div class=\"sub\">SafeX 360 · Référence ").append(esc(audit.getRefNumber()))
            .append(" · Catégorie ").append(audit.getCategory() != null ? esc(audit.getCategory().name()) : "—")
            .append(" · Du ").append(fmt(audit.getStartDate())).append(" au ").append(fmt(audit.getEndDate()))
            .append("</div>");

        // ── Identification ──
        html.append("<h2>1. Identification et critères d'audit</h2><table>")
            .append(row("Objectifs", audit.getObjectives()))
            .append(row("Processus audités", audit.getProcesses()))
            .append(row("Critères / référentiels", audit.getReferences()))
            .append(row("Méthodes", audit.getMethods()))
            .append(row("Description", audit.getDescription()))
            .append("</table>");

        // ── Équipe ──
        html.append("<h2>2. Équipe d'audit</h2><table><tr><th>Nom</th><th>Rôle</th><th>Organisation</th></tr>");
        for (Auditor auditor : team) {
            html.append("<tr><td>").append(esc(auditor.getName())).append("</td><td>")
                .append(esc(auditor.getRole())).append("</td><td>")
                .append(esc(auditor.getCompany())).append("</td></tr>");
        }
        if (team.isEmpty()) html.append("<tr><td colspan=\"3\">—</td></tr>");
        html.append("</table>");

        // ── Réunions ──
        html.append("<h2>3. Réunions d'ouverture et de clôture</h2><table><tr><th>Type</th><th>Date</th><th>Ordre du jour</th></tr>");
        for (Meeting meeting : meetings) {
            String type = meeting.getType() == null ? "—"
                    : "OPENING".equals(meeting.getType()) ? "Ouverture"
                    : "CLOSING".equals(meeting.getType()) ? "Clôture" : "Autre";
            html.append("<tr><td>").append(type).append("</td><td>")
                .append(meeting.getDate() != null ? esc(meeting.getDate().toString()) : "—").append("</td><td>")
                .append(esc(meeting.getAgenda())).append("</td></tr>");
        }
        if (meetings.isEmpty()) html.append("<tr><td colspan=\"3\">Aucune réunion enregistrée</td></tr>");
        html.append("</table>");

        // ── Synthèse checklist par référentiel ──
        html.append("<h2>4. Synthèse des checklists par référentiel</h2>");
        Map<String, List<AuditChecklistItem>> byReferential = checklist.stream()
                .collect(Collectors.groupingBy(i -> i.getReferential() != null ? i.getReferential() : "—"));
        if (byReferential.isEmpty()) {
            html.append("<p>Aucune checklist initialisée pour cet audit.</p>");
        } else {
            html.append("<table><tr><th>Référentiel</th><th>Conformes</th><th>Non conformes</th><th>N.A.</th><th>À évaluer</th></tr>");
            byReferential.forEach((referential, items) -> html.append("<tr><td>")
                    .append(esc(referential.replace("_", " "))).append("</td><td>")
                    .append(count(items, "CONFORME")).append("</td><td>")
                    .append(count(items, "NON_CONFORME")).append("</td><td>")
                    .append(count(items, "NON_APPLICABLE")).append("</td><td>")
                    .append(count(items, "A_EVALUER")).append("</td></tr>"));
            html.append("</table>");
        }

        // ── Constats classés ──
        html.append("<h2>5. Constats d'audit (classification ISO 19011)</h2>")
            .append("<table><tr><th>Classification</th><th>Clause</th><th>Constat / fait observé</th></tr>");
        for (Observation obs : observations) {
            String cls = obs.getClassification();
            String label = cls != null ? CLASSIFICATION_LABELS.getOrDefault(cls, cls) : "Non classé";
            String cssClass = "NC_MAJEURE".equals(cls) ? "ncmaj" : "NC_MINEURE".equals(cls) ? "ncmin"
                    : "OPPORTUNITE".equals(cls) ? "opp" : "obs";
            html.append("<tr><td class=\"").append(cssClass).append("\">").append(esc(label))
                .append("</td><td>").append(esc(obs.getClause()))
                .append("</td><td><b>").append(esc(obs.getTitle())).append("</b> — ")
                .append(esc(obs.getObservedFact())).append("</td></tr>");
        }
        if (observations.isEmpty()) html.append("<tr><td colspan=\"3\">Aucun constat enregistré</td></tr>");
        html.append("</table>");

        // ── Conclusions ──
        html.append("<h2>6. Conclusions et approbation</h2><table>")
            .append(row("Conclusions", report != null ? report.getDescription() : null))
            .append(row("Préparé par", report != null
                    ? join(report.getPreparerName(), report.getPreparerRole()) : null))
            .append(row("Validé par", report != null
                    ? join(report.getValidatorName(), report.getValidatorRole()) : null))
            .append(row("Statut du rapport", report != null && report.getStatus() != null
                    ? report.getStatus().name() : null))
            .append("</table>");

        // ── Signatures ──
        html.append("<table class=\"sign\"><tr><td>Responsable d'audit</td><td>Direction / Validateur</td></tr></table>");

        html.append("</body></html>");
        return html.toString();
    }

    private long count(List<AuditChecklistItem> items, String result) {
        return items.stream().filter(i -> result.equals(i.getResult())).count();
    }

    private String row(String label, String value) {
        return "<tr><th style=\"width:28%\">" + esc(label) + "</th><td>"
                + (value == null || value.isBlank() ? "—" : esc(value)) + "</td></tr>";
    }

    private String join(String a, String b) {
        if (a == null && b == null) return null;
        return (a != null ? a : "") + (b != null && !b.isBlank() ? " (" + b + ")" : "");
    }

    private String fmt(java.time.LocalDate date) {
        return date != null ? date.format(DATE_FR) : "—";
    }

    /** Échappement XHTML strict (flying-saucer exige un document bien formé). */
    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
