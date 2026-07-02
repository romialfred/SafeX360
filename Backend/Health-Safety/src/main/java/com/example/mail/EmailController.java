package com.example.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller to trigger async HTML email sending.
 */
@RestController
@CrossOrigin
@RequestMapping("/api/mail")
public class EmailController {

    private static final Logger log = LoggerFactory.getLogger(EmailController.class);

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Fire-and-forget endpoint. Returns 202 Accepted immediately.
     */
    @PostMapping("/send")
    public ResponseEntity<Void> send(@RequestBody SendMailRequest request) {
        log.info("Accepted email send request to '{}'", request.to());
        // Fire-and-forget: do not block on the CompletableFuture
        emailService.sendHtml(request.to(), request.subject(), request.htmlBody());
        return ResponseEntity.accepted().build();
    }

    /**
     * Request body for email sending. Using a record keeps it concise.
     */
    public static record SendMailRequest(String to, String subject, String htmlBody) { }
}

