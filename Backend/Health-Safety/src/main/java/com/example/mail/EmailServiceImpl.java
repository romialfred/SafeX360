package com.example.mail;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

/**
 * JavaMail-based email service implementation.
 */
@Service
@Transactional
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final String DEFAULT_FALLBACK_FROM = "no-reply@example.com";

    private final JavaMailSender mailSender;
    private final String defaultFrom;

    public EmailServiceImpl(JavaMailSender mailSender,
            @Value("${app.mail.from}") String configuredFrom) {
        this.mailSender = Objects.requireNonNull(mailSender, "mailSender must not be null");
        this.defaultFrom = resolveDefaultFrom(mailSender, configuredFrom);
    }

    private String resolveDefaultFrom(JavaMailSender mailSender, String configuredFrom) {
        if (hasText(configuredFrom)) {
            return configuredFrom.trim();
        }

        if (mailSender instanceof JavaMailSenderImpl sender && hasText(sender.getUsername())) {
            return sender.getUsername().trim();
        }

        return DEFAULT_FALLBACK_FROM;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    /**
     * Sends an HTML email using JavaMailSender on a dedicated async executor.
     * Completes the future exceptionally on failure; errors are logged.
     */
    @Override
    @Async("mailExecutor")
    public CompletableFuture<Void> sendHtml(String to, String subject, String htmlBody) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Use UTF-8 to support international characters
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(defaultFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            log.info("Sending HTML email to '{}' with subject '{}'", to, subject);
            mailSender.send(message);
            log.info("HTML email sent to '{}'", to);
            future.complete(null);
        } catch (Exception ex) {
            log.error("Failed to send HTML email to '{}': {}", to, ex.getMessage(), ex);
            future.completeExceptionally(ex);
        }
        return future;
    }

    @Override
    @Async("mailExecutor")
    public CompletableFuture<Void> sendWithToCcBcc(List<String> to,
            List<String> cc,
            List<String> bcc,
            String subject,
            String htmlBody,
            List<File> attachments) {

        CompletableFuture<Void> future = new CompletableFuture<>();

        try {
            List<String> toRecipients = to != null ? to : List.of();
            List<String> ccRecipients = cc != null ? cc : List.of();
            List<String> bccRecipients = bcc != null ? bcc : List.of();
            List<File> files = attachments != null ? attachments : List.of();

            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mime,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(defaultFrom, "Notifications"));

            if (!toRecipients.isEmpty()) {
                helper.setTo(toRecipients.toArray(String[]::new));
            }
            if (!ccRecipients.isEmpty()) {
                helper.setCc(ccRecipients.toArray(String[]::new));
            }
            if (!bccRecipients.isEmpty()) {
                helper.setBcc(bccRecipients.toArray(String[]::new));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            for (File file : files) {
                helper.addAttachment(file.getName(), file);
            }

            log.info("Sending email to={}, cc={}, bcc={} with subject '{}' and {} attachment(s)",
                    toRecipients, ccRecipients, bccRecipients, subject, files.size());

            mailSender.send(mime);

            log.info("Email sent with subject '{}' to {} recipient(s)", subject, toRecipients.size());
            future.complete(null);
        } catch (Exception ex) {
            log.error("Failed to send email with subject '{}': {}", subject, ex.getMessage(), ex);
            future.completeExceptionally(ex);
        }

        return future;
    }
}
