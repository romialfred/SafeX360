package com.minexpert.hns.service.incident;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentInjury;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.entity.incident.RiskAssessment;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.repository.incident.IncidentInjuryRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.repository.incident.RiskAssessmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * E3.1 — Export PDF officiel d'un incident + son enquête (ISO 45001 §7.5.3 :
 * informations documentées). Réutilise l'infrastructure XHTML→PDF existante
 * ({@link HtmlToPdfRenderer}). Cloisonné mine via {@code findByIdWithCompanyContext}.
 */
@Service
@RequiredArgsConstructor
public class IncidentReportPdfService {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String> INJURY_LABELS = Map.of(
            "FATALITY", "Décès", "LTI", "Accident avec arrêt", "RWC", "Travail restreint",
            "MTC", "Soins médicaux", "FAC", "Premiers soins", "NEAR_MISS", "Presque-accident");

    private final IncidentRepository incidentRepository;
    private final InvestigationRepository investigationRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final IncidentInjuryRepository incidentInjuryRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final HrmsClient hrmsClient;
    private final HtmlToPdfRenderer htmlToPdfRenderer;

    public byte[] generatePdf(Long companyId, Long incidentId) throws HSException {
        Incident inc = incidentRepository.findByIdWithCompanyContext(incidentId, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        Investigation inv = investigationRepository.findByIncidentIdWithCompanyContext(incidentId, companyId)
                .orElse(null);
        List<CorrectiveAction> actions = correctiveActionRepository.findByIncidentId(companyId, incidentId);
        List<IncidentInjury> injuries = incidentInjuryRepository.findByIncidentId(incidentId);
        RiskAssessment risk = riskAssessmentRepository.findFirstByIncident_IdOrderByIdDesc(incidentId).orElse(null);
        String reporter = resolveName(inc.getReporterId());

        StringBuilder b = new StringBuilder();
        b.append("<html xmlns=\"http://www.w3.org/1999/xhtml\"><head><style>")
                .append("body{font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#1f2937}")
                .append("h1{font-size:18px;color:#0f172a;margin:0 0 2px 0}")
                .append("h2{font-size:13px;color:#0f766e;border-bottom:1px solid #cbd5e1;padding-bottom:3px;margin:16px 0 6px}")
                .append(".sub{color:#64748b;font-size:11px;margin:0 0 10px}")
                .append(".hp{color:#b91c1c;font-weight:bold}")
                .append("table{width:100%;border-collapse:collapse;margin-top:4px}")
                .append("th,td{border:1px solid #cbd5e1;padding:4px 6px;text-align:left;vertical-align:top}")
                .append("th{background:#f1f5f9}")
                .append(".kv td:first-child{width:38%;color:#475569;background:#f8fafc}")
                .append(".foot{margin-top:24px;color:#94a3b8;font-size:9px;border-top:1px solid #e2e8f0;padding-top:6px}")
                .append("</style></head><body>");

        b.append("<h1>Rapport officiel d'incident</h1>");
        b.append("<p class=\"sub\">SafeX360 — Santé &amp; Sécurité (ISO 45001 §7.5.3) · N° ")
                .append(esc(inc.getNumber())).append("</p>");
        if (Boolean.TRUE.equals(inc.getHighPotential())) {
            b.append("<p class=\"hp\">(!) Incident à HAUT POTENTIEL (ICMM / §6.1.2)</p>");
        }

        // Identification
        b.append("<h2>Identification</h2><table class=\"kv\">");
        row(b, "Numéro", inc.getNumber());
        row(b, "Intitulé", inc.getTitle());
        row(b, "Date de survenue", inc.getOccurredAt() != null ? inc.getOccurredAt().format(DT) : "—");
        row(b, "Date de découverte", inc.getDiscoveryTime() != null ? inc.getDiscoveryTime().format(DT) : "—");
        row(b, "Statut", inc.getStatus() != null ? inc.getStatus().name() : "—");
        row(b, "Origine", "AI".equalsIgnoreCase(inc.getSource()) ? "Assistée par IA" : "Déclaration manuelle");
        row(b, "Déclarant", Boolean.TRUE.equals(inc.getConfidential()) ? "Confidentiel" : reporter);
        row(b, "Engin / équipement", inc.getEquipment());
        row(b, "Quart", inc.getShift());
        b.append("</table>");

        // Réglementaire
        b.append("<h2>Statut réglementaire</h2><table class=\"kv\">");
        row(b, "Notifiable à l'autorité", Boolean.TRUE.equals(inc.getNotifiable()) ? "Oui" : "Non");
        row(b, "Échéance statutaire",
                inc.getRegulatoryDeadline() != null ? inc.getRegulatoryDeadline().format(D) : "—");
        row(b, "Déclaré à l'autorité le",
                inc.getNotifiedToAuthorityAt() != null ? inc.getNotifiedToAuthorityAt().format(D) : "Non déclaré");
        b.append("</table>");

        // Risque
        b.append("<h2>Évaluation du risque</h2><table class=\"kv\">");
        row(b, "Risque initial (P×G)", risk != null ? score(risk.getProbability(), risk.getSeverity()) : "—");
        row(b, "Risque résiduel (après mesures)",
                risk != null ? score(risk.getPostProbability(), risk.getPostSeverity()) : "—");
        row(b, "Sévérité potentielle (pire scénario)",
                risk != null ? score(risk.getPotentialProbability(), risk.getPotentialSeverity()) : "—");
        b.append("</table>");

        // Enquête
        b.append("<h2>Enquête</h2>");
        if (inv == null) {
            b.append("<p>Aucune enquête enregistrée.</p>");
        } else {
            b.append("<table class=\"kv\">");
            row(b, "Méthode", inv.getMethod());
            row(b, "Période", (inv.getStartDate() != null ? inv.getStartDate().format(D) : "—")
                    + " -> " + (inv.getEndDate() != null ? inv.getEndDate().format(D) : "en cours"));
            row(b, "Statut", inv.getStatus() != null ? inv.getStatus().name() : "—");
            row(b, "Validée (revue par un pair)", Boolean.TRUE.equals(inv.getValidated())
                    ? "Oui" + (inv.getReviewedAt() != null ? " le " + inv.getReviewedAt().format(D) : "")
                    : "Non");
            b.append("</table>");
            String report = stripHtml(inv.getReport());
            if (!report.isBlank()) {
                b.append("<p><strong>Rapport :</strong> ").append(esc(report)).append("</p>");
            }
        }

        // Actions correctives
        b.append("<h2>Actions correctives (").append(actions.size()).append(")</h2>");
        if (actions.isEmpty()) {
            b.append("<p>Aucune action corrective.</p>");
        } else {
            b.append("<table><tr><th>Intitulé</th><th>Échéance</th><th>Statut</th><th>Hiérarchie</th></tr>");
            for (CorrectiveAction a : actions) {
                b.append("<tr><td>").append(esc(a.getActionName()))
                        .append("</td><td>").append(a.getDeadline() != null ? a.getDeadline().format(D) : "—")
                        .append("</td><td>").append(a.getStatus() != null ? a.getStatus().name() : "—")
                        .append("</td><td>").append(a.getControlHierarchy() != null ? a.getControlHierarchy().name() : "—")
                        .append("</td></tr>");
            }
            b.append("</table>");
        }

        // Lésions
        if (!injuries.isEmpty()) {
            b.append("<h2>Lésions (").append(injuries.size()).append(")</h2>");
            b.append("<table><tr><th>Personne</th><th>Issue</th><th>Partie du corps</th><th>Jours perdus</th></tr>");
            for (IncidentInjury in : injuries) {
                String outcome = in.getOutcome() != null
                        ? INJURY_LABELS.getOrDefault(in.getOutcome().name(), in.getOutcome().name()) : "—";
                b.append("<tr><td>").append(esc(in.getPersonName()))
                        .append("</td><td>").append(esc(outcome))
                        .append("</td><td>").append(esc(in.getBodyPart()))
                        .append("</td><td>").append(in.getLostDays() != null ? in.getLostDays() : 0)
                        .append("</td></tr>");
            }
            b.append("</table>");
        }

        b.append("<p class=\"foot\">Document généré par SafeX360. Rapport à valeur d'information documentée (ISO 45001 §7.5.3). "
                + "Toute déclaration réglementaire relève de la responsabilité de l'exploitant.</p>");
        b.append("</body></html>");

        return htmlToPdfRenderer.convertHtmlToPdf(b.toString());
    }

    private String resolveName(Long employeeId) {
        if (employeeId == null) {
            return "—";
        }
        try {
            List<EmployeeNameDTO> names = hrmsClient.getEmployeeNameByIds(List.of(employeeId));
            if (names != null && !names.isEmpty() && names.get(0).getName() != null) {
                return names.get(0).getName();
            }
        } catch (Exception ignored) {
            // best-effort : le rapport reste valide sans le nom résolu.
        }
        return "#" + employeeId;
    }

    // row() est le POINT D'ÉCHAPPEMENT unique : la valeur est toujours passée par
    // esc(). Les appelants passent donc des chaînes BRUTES (pas de double-échappement).
    private static void row(StringBuilder b, String k, String v) {
        b.append("<tr><td>").append(esc(k)).append("</td><td>").append(esc(v)).append("</td></tr>");
    }

    private static String score(Integer p, Integer s) {
        if (p == null || s == null) {
            return "—";
        }
        return p + " x " + s + " = " + (p * s);
    }

    /** Aplati un contenu HTML riche en texte (le rapport d'enquête est du HTML). */
    private static String stripHtml(String html) {
        if (html == null) {
            return "";
        }
        return html.replaceAll("<[^>]+>", " ").replaceAll("&nbsp;", " ").replaceAll("\\s+", " ").trim();
    }

    /** Échappe pour insertion en contenu XHTML strict (Flying Saucer). */
    private static String esc(String s) {
        if (s == null || s.isBlank()) {
            return "—";
        }
        // Retire les caractères de contrôle INTERDITS en XML 1.0 (collés depuis Word,
        // saisies IA/mobile non filtrées) : sinon setDocumentFromString lève une
        // XRRuntimeException -> 500 à l'export. Puis on échappe les entités.
        return s.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "")
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
