package com.minexpert.hns.service.communications;

import com.example.mail.EmailService;
import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.dto.request.EmployeeDirection;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.utility.EmailBody;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.validation.constraints.Email;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Builds and dispatches communication messages.
 */
@Service
public class CommunicationSendService {

    private final MessageSender messageSender;
    private final HrmsClient hrmsClient;
    private final MediaService mediaService;
    private final EmailService emailService;

    public CommunicationSendService(MessageSender messageSender,
            HrmsClient hrmsClient,
            MediaService mediaService,
            EmailService emailService) {
        this.messageSender = Objects.requireNonNull(messageSender, "messageSender must not be null");
        this.hrmsClient = Objects.requireNonNull(hrmsClient, "hrmsClient must not be null");
        this.mediaService = Objects.requireNonNull(mediaService, "mediaService must not be null");
        this.emailService = Objects.requireNonNull(emailService, "emailService must not be null");
    }

    /**
     * Sends the communication to all resolved recipients and returns an audit
     * message.
     */
    public String send(Communication communication) throws Exception {
        Objects.requireNonNull(communication, "communication must not be null");

        List<String> recipients = resolveRecipients(communication);
        if (recipients.isEmpty()) {
            return "No recipients resolved; nothing sent";
        }

        List<File> attachments = resolveAttachments(communication.getAttachments()).stream()
                .map(t -> {
                    try {
                        return t.toFile();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .toList();
        String subject = Optional.ofNullable(communication.getTitle()).orElse("");
        // String body = renderBody(communication, recipients, attachments);

        // for (Recipient recipient : recipients) {
        // messageSender.send(recipient.email(), subject, body);
        // }
        System.out.println(recipients);
        String body = EmailBody.buildDemoEmailBody();
        emailService.sendWithToCcBcc(recipients, List.of(), List.of(), subject, body, attachments)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        ex.printStackTrace();
                    } else {
                        System.out.println("Email sent successfully to " + recipients.size() + " recipient(s)");
                    }
                }).join();
        return "Sent to " + recipients.size() + " recipient(s)";
    }

    private List<String> resolveRecipients(Communication communication) {
        List<Long> recipientIds = Optional
                .ofNullable(StringListConverter.convertToLongList(communication.getRecipients()))
                .orElseGet(List::of);
        Set<String> seenEmails = new LinkedHashSet<>();
        List<String> recipients = hrmsClient.getEmailsByIds(recipientIds).stream()
                .filter(Objects::nonNull)
                .map(EmployeeDirection::getEmail)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(email -> seenEmails.add(email))
                .toList();

        // if (recipients.isEmpty() &&
        // StringUtils.hasText(communication.getSenderEmail())) {
        // String email = communication.getSenderEmail().trim();
        // if (seenEmails.add(email)) {
        // recipients.add(new Recipient(communication.getSenderId(),
        // communication.getSenderName(), email, null));
        // }
        // }

        return recipients;
    }

    private List<MediaDTO> resolveAttachments(String attachmentIds) {
        if (!StringUtils.hasText(attachmentIds)) {
            return List.of();
        }
        List<Long> ids = StringListConverter.convertToLongList(attachmentIds);
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return mediaService.getAllMediaByArray(attachmentIds);
    }

    private String renderBody(Communication communication, List<Recipient> recipients, List<MediaDTO> attachments) {
        StringBuilder html = new StringBuilder();
        html.append(Optional.ofNullable(communication.getContent()).orElse(""));

        if (!recipients.isEmpty()) {
            html.append("<hr/><p><strong>Recipients</strong></p><ul>");
            for (Recipient recipient : recipients) {
                html.append("<li>")
                        .append(Optional.ofNullable(recipient.name()).orElse("Recipient"));
                if (StringUtils.hasText(recipient.email())) {
                    html.append(" (" + recipient.email() + ")");
                }
                if (StringUtils.hasText(recipient.department())) {
                    html.append(" - ").append(recipient.department());
                }
                html.append("</li>");
            }
            html.append("</ul>");
        }

        if (!attachments.isEmpty()) {
            html.append("<p><strong>Attachments</strong></p><ul>");
            for (MediaDTO attachment : attachments) {
                html.append("<li>")
                        .append(Optional.ofNullable(attachment.getName()).orElse("Attachment"));
                html.append("</li>");
            }
            html.append("</ul>");
        }

        return html.toString();
    }

    private record Recipient(Long id, String name, String email, String department) {
    }
}
