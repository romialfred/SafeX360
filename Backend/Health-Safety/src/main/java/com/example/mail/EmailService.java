package com.example.mail;

import java.io.File;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Contract for sending HTML emails asynchronously.
 */
public interface EmailService {

    /**
     * Sends an HTML email asynchronously using a dedicated executor.
     *
     * @param to       recipient email address
     * @param subject  subject line
     * @param htmlBody HTML content (set as true)
     * @return a CompletableFuture that completes when sending finishes
     */
    CompletableFuture<Void> sendHtml(String to, String subject, String htmlBody);

    /**
     * Sends a MIME email to multiple recipients, supporting CC and BCC lists.
     *
     * @param to          primary recipients (mandatory list, may be empty)
     * @param cc          carbon copy recipients (optional)
     * @param bcc         blind carbon copy recipients (optional)
     * @param subject     message subject
     * @param htmlBody    HTML body content
     * @param attachments files to attach (optional)
     */
    CompletableFuture<Void> sendWithToCcBcc(List<String> to,
                                            List<String> cc,
                                            List<String> bcc,
                                            String subject,
                                            String htmlBody,
                                            List<File> attachments);
}
