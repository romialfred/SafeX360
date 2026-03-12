package com.minexpert.hns.service.communications;

import com.example.mail.EmailService;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.concurrent.CompletionException;

/**
 * MessageSender backed by the shared EmailService (JavaMailSender based).
 */
@Service
public class MailMessageSender implements MessageSender {

    private final EmailService emailService;

    public MailMessageSender(EmailService emailService) {
        this.emailService = Objects.requireNonNull(emailService, "emailService must not be null");
    }

    @Override
    public void send(String toEmail, String subject, String body) throws Exception {
        try {
            emailService.sendHtml(toEmail, subject, body).join();
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof Exception exception) {
                throw exception;
            }
            throw ex;
        }
    }
}

