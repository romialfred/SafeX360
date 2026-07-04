package com.minexpert.hns.api.emergency.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.mail.EmailService;

import lombok.RequiredArgsConstructor;

/**
 * Service d'envoi d'emails pour les alertes d'urgence (SOS + Alerte Generale).
 *
 * <p>Envoie des notifications HTML aux coordinateurs HSE configures via
 * {@code emergency.email.recipients}. Degrade gracieusement : si la liste
 * est vide ou si l'envoi echoue, le workflow principal n'est jamais impacte.</p>
 *
 * <p>Les emails sont envoyes de maniere asynchrone via le {@link EmailService}
 * existant (pool mail dediee).</p>
 */
@Service
@RequiredArgsConstructor
public class EmergencyEmailService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyEmailService.class);
    private static final DateTimeFormatter FR_DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final EmailService emailService;

    @Value("${emergency.email.recipients:}")
    private String recipientsCsv;

    // ── Public API ──────────────────────────────────────────────────────────

    /**
     * Notifie les coordinateurs de la creation d'un SOS.
     */
    public void notifySosCreated(Long sosId, String employeeName, String reasonCode,
                                  String description, Long companyId) {
        List<String> recipients = getRecipients();
        if (recipients.isEmpty()) return;

        String subject = "[URGENCE SOS] "
                + (reasonCode != null ? reasonCode : "SOS")
                + " — Intervention immediate requise";
        String body = buildSosHtml(sosId, employeeName, reasonCode, description);
        sendToAll(recipients, subject, body);
    }

    /**
     * Notifie les coordinateurs d'une escalade SOS non prise en charge.
     */
    public void notifySosEscalated(Long sosId, String employeeName, String reasonCode,
                                    int stepOrder) {
        List<String> recipients = getRecipients();
        if (recipients.isEmpty()) return;

        String subject = "[ESCALADE SOS] Alerte #" + sosId
                + " non prise en charge — Niveau " + stepOrder;
        String body = buildEscalationHtml(sosId, employeeName, reasonCode, stepOrder);
        sendToAll(recipients, subject, body);
    }

    /**
     * Notifie les coordinateurs du declenchement d'une alerte generale.
     */
    public void notifyGeneralAlertTriggered(Long alertId, String reasonCode, String message,
                                             boolean drillMode, Long companyId) {
        List<String> recipients = getRecipients();
        if (recipients.isEmpty()) return;

        String prefix = drillMode ? "[EXERCICE]" : "[ALERTE GENERALE]";
        String subject = prefix + " Evacuation — " + (reasonCode != null ? reasonCode : "Alerte");
        String body = buildGeneralAlertHtml(alertId, reasonCode, message, drillMode);
        sendToAll(recipients, subject, body);
    }

    /**
     * Notifie les coordinateurs de la fin d'une alerte generale avec les stats.
     */
    public void notifyGeneralAlertEnded(Long alertId, int safeCount, int injuredCount,
                                         int missingCount) {
        List<String> recipients = getRecipients();
        if (recipients.isEmpty()) return;

        String subject = "[FIN ALERTE] Alerte #" + alertId
                + " terminee — " + safeCount + " safe, " + injuredCount + " blesses";
        String body = buildAlertEndedHtml(alertId, safeCount, injuredCount, missingCount);
        sendToAll(recipients, subject, body);
    }

    // ── Envoi ───────────────────────────────────────────────────────────────

    private void sendToAll(List<String> recipients, String subject, String body) {
        for (String to : recipients) {
            try {
                emailService.sendHtml(to, subject, body);
            } catch (Exception e) {
                log.warn("Failed to send emergency email to {}: {}", to, e.getMessage());
            }
        }
    }

    // ── Destinataires ───────────────────────────────────────────────────────

    private List<String> getRecipients() {
        if (recipientsCsv == null || recipientsCsv.isBlank()) return List.of();
        return List.of(recipientsCsv.split(",")).stream()
                .map(String::trim)
                .filter(s -> s.contains("@"))
                .toList();
    }

    // ── HTML Builders ───────────────────────────────────────────────────────

    private String buildSosHtml(Long sosId, String employeeName, String reasonCode,
                                 String description) {
        String name = employeeName != null ? employeeName : "Non identifie";
        String reason = reasonCode != null ? reasonCode : "Non precise";
        String desc = description != null ? description : "Aucune description fournie";

        return wrapInLayout("SOS — Intervention immediate requise", "#E74C3C",
                "<tr>"
              + "  <td style=\"padding:20px 30px;\">"
              + "    <h2 style=\"color:#E74C3C;margin:0 0 15px 0;font-size:20px;\">Alerte SOS #" + sosId + "</h2>"
              + "    <table style=\"width:100%;border-collapse:collapse;\">"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;width:140px;\">Employe</td>"
              + "          <td style=\"padding:8px 0;font-weight:bold;\">" + esc(name) + "</td></tr>"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Motif</td>"
              + "          <td style=\"padding:8px 0;font-weight:bold;\">" + esc(reason) + "</td></tr>"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Description</td>"
              + "          <td style=\"padding:8px 0;\">" + esc(desc) + "</td></tr>"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Date / Heure</td>"
              + "          <td style=\"padding:8px 0;\">" + LocalDateTime.now().format(FR_DATETIME) + "</td></tr>"
              + "    </table>"
              + "  </td>"
              + "</tr>"
        );
    }

    private String buildEscalationHtml(Long sosId, String employeeName, String reasonCode,
                                        int stepOrder) {
        String name = employeeName != null ? employeeName : "Non identifie";
        String reason = reasonCode != null ? reasonCode : "Non precise";

        return wrapInLayout("Escalade SOS — Niveau " + stepOrder, "#E74C3C",
                "<tr>"
              + "  <td style=\"padding:20px 30px;\">"
              + "    <h2 style=\"color:#E74C3C;margin:0 0 15px 0;font-size:20px;\">Escalade — SOS #" + sosId + "</h2>"
              + "    <p style=\"margin:0 0 15px 0;color:#E74C3C;font-weight:bold;\">"
              + "      Cette alerte n'a pas ete prise en charge dans le delai imparti.</p>"
              + "    <table style=\"width:100%;border-collapse:collapse;\">"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;width:140px;\">Niveau d'escalade</td>"
              + "          <td style=\"padding:8px 0;font-weight:bold;color:#E74C3C;\">Niveau " + stepOrder + "</td></tr>"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Employe</td>"
              + "          <td style=\"padding:8px 0;font-weight:bold;\">" + esc(name) + "</td></tr>"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Motif</td>"
              + "          <td style=\"padding:8px 0;\">" + esc(reason) + "</td></tr>"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Date / Heure</td>"
              + "          <td style=\"padding:8px 0;\">" + LocalDateTime.now().format(FR_DATETIME) + "</td></tr>"
              + "    </table>"
              + "  </td>"
              + "</tr>"
        );
    }

    private String buildGeneralAlertHtml(Long alertId, String reasonCode, String message,
                                          boolean drillMode) {
        String reason = reasonCode != null ? reasonCode : "Non precise";
        String msg = message != null ? message : "";
        String headerColor = drillMode ? "#F39C12" : "#E74C3C";
        String typeLabel = drillMode ? "EXERCICE D'EVACUATION" : "ALERTE GENERALE — EVACUATION";

        return wrapInLayout(typeLabel, headerColor,
                "<tr>"
              + "  <td style=\"padding:20px 30px;\">"
              + "    <h2 style=\"color:" + headerColor + ";margin:0 0 15px 0;font-size:20px;\">"
              + typeLabel + " #" + alertId + "</h2>"
              + (drillMode
                    ? "<p style=\"margin:0 0 15px 0;padding:10px;background:#FFF3CD;border-left:4px solid #F39C12;color:#856404;\">"
                      + "Ceci est un exercice. Aucune urgence reelle.</p>"
                    : "<p style=\"margin:0 0 15px 0;padding:10px;background:#F8D7DA;border-left:4px solid #E74C3C;color:#721C24;\">"
                      + "URGENCE REELLE — Evacuation immediate requise.</p>")
              + "    <table style=\"width:100%;border-collapse:collapse;\">"
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;width:140px;\">Motif</td>"
              + "          <td style=\"padding:8px 0;font-weight:bold;\">" + esc(reason) + "</td></tr>"
              + (msg.isEmpty() ? ""
                    : "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Message</td>"
                      + "          <td style=\"padding:8px 0;\">" + esc(msg) + "</td></tr>")
              + "      <tr><td style=\"padding:8px 0;color:#7f8c8d;\">Date / Heure</td>"
              + "          <td style=\"padding:8px 0;\">" + LocalDateTime.now().format(FR_DATETIME) + "</td></tr>"
              + "    </table>"
              + "  </td>"
              + "</tr>"
        );
    }

    private String buildAlertEndedHtml(Long alertId, int safeCount, int injuredCount,
                                        int missingCount) {
        int total = safeCount + injuredCount + missingCount;

        return wrapInLayout("Fin d'alerte — Bilan", "#27AE60",
                "<tr>"
              + "  <td style=\"padding:20px 30px;\">"
              + "    <h2 style=\"color:#27AE60;margin:0 0 15px 0;font-size:20px;\">Alerte #" + alertId + " — Terminee</h2>"
              + "    <p style=\"margin:0 0 20px 0;\">L'alerte a ete cloturee. Voici le bilan d'evacuation :</p>"
              + "    <table style=\"width:100%;border-collapse:collapse;text-align:center;\">"
              + "      <tr>"
              + "        <td style=\"padding:15px;background:#D5F5E3;border-radius:4px;\">"
              + "          <div style=\"font-size:28px;font-weight:bold;color:#27AE60;\">" + safeCount + "</div>"
              + "          <div style=\"color:#27AE60;font-size:12px;text-transform:uppercase;\">Safe</div>"
              + "        </td>"
              + "        <td style=\"padding:15px;background:#FADBD8;border-radius:4px;\">"
              + "          <div style=\"font-size:28px;font-weight:bold;color:#E74C3C;\">" + injuredCount + "</div>"
              + "          <div style=\"color:#E74C3C;font-size:12px;text-transform:uppercase;\">Blesses</div>"
              + "        </td>"
              + "        <td style=\"padding:15px;background:#FEF9E7;border-radius:4px;\">"
              + "          <div style=\"font-size:28px;font-weight:bold;color:#F39C12;\">" + missingCount + "</div>"
              + "          <div style=\"color:#F39C12;font-size:12px;text-transform:uppercase;\">Manquants</div>"
              + "        </td>"
              + "      </tr>"
              + "    </table>"
              + "    <p style=\"margin:15px 0 0 0;color:#7f8c8d;font-size:13px;\">Total pointes : " + total + "</p>"
              + "  </td>"
              + "</tr>"
        );
    }

    // ── Layout HTML commun ──────────────────────────────────────────────────

    private String wrapInLayout(String title, String headerColor, String contentRows) {
        return "<!DOCTYPE html>"
             + "<html><head><meta charset=\"UTF-8\"></head>"
             + "<body style=\"margin:0;padding:0;background-color:#F4F6F7;font-family:Arial,Helvetica,sans-serif;\">"
             + "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;\">"
             + "  <tr><td style=\"padding:20px 0;\" align=\"center\">"
             + "    <table role=\"presentation\" style=\"width:600px;max-width:100%;border-collapse:collapse;"
             + "           background:#ffffff;border-radius:8px;overflow:hidden;"
             + "           box-shadow:0 2px 8px rgba(0,0,0,0.08);\">"
             // Header
             + "      <tr><td style=\"background:" + headerColor + ";padding:20px 30px;\">"
             + "        <table style=\"width:100%;\">"
             + "          <tr>"
             + "            <td style=\"color:#ffffff;font-size:22px;font-weight:bold;\">SafeX 360</td>"
             + "            <td style=\"color:#ffffff;font-size:12px;text-align:right;opacity:0.85;\">" + esc(title) + "</td>"
             + "          </tr>"
             + "        </table>"
             + "      </td></tr>"
             // Content
             + contentRows
             // CTA
             + "      <tr><td style=\"padding:10px 30px 25px 30px;\" align=\"center\">"
             + "        <a href=\"https://safex360.vercel.app\" style=\"display:inline-block;padding:12px 28px;"
             + "           background:#E67E22;color:#ffffff;text-decoration:none;border-radius:6px;"
             + "           font-weight:bold;font-size:14px;\">Connectez-vous a SafeX 360</a>"
             + "      </td></tr>"
             // Footer
             + "      <tr><td style=\"padding:15px 30px;background:#F8F9FA;border-top:1px solid #EAECEE;"
             + "                     text-align:center;color:#AEB6BF;font-size:11px;\">"
             + "        SafeX 360 — Plateforme HSE / QHSE | Ceci est un message automatique"
             + "      </td></tr>"
             + "    </table>"
             + "  </td></tr>"
             + "</table>"
             + "</body></html>";
    }

    /** Echappe les caracteres HTML dangereux. */
    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
