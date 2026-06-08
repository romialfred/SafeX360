package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastEmailLog;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastRecipient;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.enums.EmailLogStatus;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastEmailLogRepository;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastSettingRepository;
import com.minexpert.hns.service.communications.MessageSender;

/**
 * Tests unitaires de {@link BlastEmailService} (Phase 3).
 *
 * <p>Couvre :
 * <ul>
 *   <li>Selection bilingue : un recipient FR recoit le template FR / sujet FR.</li>
 *   <li>Un recipient EN recoit le template EN / sujet EN.</li>
 *   <li>Le log {@code blast_email_log} est ecrit (SENT) sur succes.</li>
 *   <li>Le log est ecrit (FAILED) avec l'erreur si SMTP throw.</li>
 *   <li>Mode degrade : si SMTP non configure (smtp.example.com), aucun envoi
 *       n'est tente et le service retourne true.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BlastEmailServiceTest {

    @Mock
    private BlastNotificationJobRepository jobRepository;

    @Mock
    private BlastSettingRepository settingRepository;

    @Mock
    private BlastEmailLogRepository emailLogRepository;

    @Mock
    private SpringTemplateEngine templateEngine;

    @Mock
    private MessageSender messageSender;

    @InjectMocks
    private BlastEmailService emailService;

    private Blast buildBlast(List<BlastRecipient> recipients) {
        return Blast.builder()
                .id(42L)
                .reference("BLT-2026-0001")
                .scheduledAt(LocalDateTime.of(2026, 6, 18, 14, 0))
                .timezone("Africa/Ouagadougou")
                .type(BlastType.PRODUCTION)
                .status(BlastStatus.CONFIRMED)
                .pit("FOSSE_NORD")
                .bench("1080")
                .exclusionRadiusM(500.0)
                .assemblyPoints("R-Nord-1, R-Nord-2")
                .blasterId(11L)
                .mineId(7L)
                .guards(new ArrayList<>())
                .recipients(recipients)
                .notificationJobs(new ArrayList<>())
                .build();
    }

    private BlastNotificationJob buildJob(JobType type, Blast blast) {
        return BlastNotificationJob.builder()
                .id(100L)
                .blast(blast)
                .type(type)
                .status(JobStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.now())
                .attempts(0)
                .build();
    }

    private void configureSmtp(BlastEmailService svc, String host) {
        ReflectionTestUtils.setField(svc, "mailHost", host);
        ReflectionTestUtils.setField(svc, "fromAddress", "hse-noreply@safex360.com");
        ReflectionTestUtils.setField(svc, "defaultSiteLabel", "Mine Test");
    }

    @Test
    @DisplayName("send: recipient FR -> template FR utilise + sujet FR + log SENT")
    void sendFrenchRecipientUsesFrenchTemplate() throws Exception {
        BlastRecipient r = BlastRecipient.builder()
                .id(1L).externalEmail("foreman@mine.test").preferredLanguage("FR").build();
        Blast blast = buildBlast(List.of(r));
        r.setBlast(blast);
        BlastNotificationJob job = buildJob(JobType.EMAIL_24H, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());
        when(templateEngine.process(anyString(), any())).thenReturn("<html>FR body</html>");
        configureSmtp(emailService, "smtp.minexpert.local");

        boolean ok = emailService.send(100L);

        assertThat(ok).isTrue();
        verify(templateEngine).process(eq("blast/reminder_24h_fr"), any());
        // Sujet FR : "Tir prevu demain"
        verify(messageSender).send(eq("foreman@mine.test"),
                contains("Tir prevu demain"), eq("<html>FR body</html>"));

        ArgumentCaptor<BlastEmailLog> logCap = ArgumentCaptor.forClass(BlastEmailLog.class);
        verify(emailLogRepository).save(logCap.capture());
        BlastEmailLog log = logCap.getValue();
        assertThat(log.getJobId()).isEqualTo(100L);
        assertThat(log.getRecipient()).isEqualTo("foreman@mine.test");
        assertThat(log.getLanguage()).isEqualTo("FR");
        assertThat(log.getStatus()).isEqualTo(EmailLogStatus.SENT);
        assertThat(log.getError()).isNull();
    }

    @Test
    @DisplayName("send: recipient EN -> template EN utilise + sujet EN")
    void sendEnglishRecipientUsesEnglishTemplate() throws Exception {
        BlastRecipient r = BlastRecipient.builder()
                .id(2L).externalEmail("crew@mine.test").preferredLanguage("EN").build();
        Blast blast = buildBlast(List.of(r));
        r.setBlast(blast);
        BlastNotificationJob job = buildJob(JobType.EMAIL_6H, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());
        when(templateEngine.process(anyString(), any())).thenReturn("<html>EN body</html>");
        configureSmtp(emailService, "smtp.minexpert.local");

        emailService.send(100L);

        verify(templateEngine).process(eq("blast/reminder_6h_en"), any());
        verify(messageSender).send(eq("crew@mine.test"),
                argThat(s -> s != null && s.contains("Reminder")), anyString());
    }

    @Test
    @DisplayName("send: recipient sans langue precisee = FR par defaut")
    void sendDefaultsToFrench() throws Exception {
        BlastRecipient r = BlastRecipient.builder()
                .id(3L).externalEmail("hse@mine.test").preferredLanguage(null).build();
        Blast blast = buildBlast(List.of(r));
        r.setBlast(blast);
        BlastNotificationJob job = buildJob(JobType.EMAIL_30M, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());
        when(templateEngine.process(anyString(), any())).thenReturn("<html>FR body</html>");
        configureSmtp(emailService, "smtp.minexpert.local");

        emailService.send(100L);

        verify(templateEngine).process(eq("blast/reminder_30m_fr"), any());
    }

    @Test
    @DisplayName("send: SMTP echec -> log FAILED avec l'erreur verbatim")
    void sendSmtpFailureLogged() throws Exception {
        BlastRecipient r = BlastRecipient.builder()
                .id(4L).externalEmail("riverain@mine.test").preferredLanguage("FR").build();
        Blast blast = buildBlast(List.of(r));
        r.setBlast(blast);
        BlastNotificationJob job = buildJob(JobType.EMAIL_24H, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());
        when(templateEngine.process(anyString(), any())).thenReturn("<html>FR body</html>");
        configureSmtp(emailService, "smtp.minexpert.local");
        Exception boom = new RuntimeException("Connection refused");
        org.mockito.Mockito.doThrow(boom).when(messageSender)
                .send(anyString(), anyString(), anyString());

        boolean ok = emailService.send(100L);

        assertThat(ok).isFalse();
        ArgumentCaptor<BlastEmailLog> logCap = ArgumentCaptor.forClass(BlastEmailLog.class);
        verify(emailLogRepository).save(logCap.capture());
        BlastEmailLog log = logCap.getValue();
        assertThat(log.getStatus()).isEqualTo(EmailLogStatus.FAILED);
        assertThat(log.getError()).isEqualTo("Connection refused");
    }

    @Test
    @DisplayName("send: mode degrade (SMTP non configure) — aucun envoi tente, retour OK")
    void sendDegradedModeNoSmtp() throws Exception {
        BlastRecipient r = BlastRecipient.builder()
                .id(5L).externalEmail("ops@mine.test").preferredLanguage("FR").build();
        Blast blast = buildBlast(List.of(r));
        r.setBlast(blast);
        BlastNotificationJob job = buildJob(JobType.EMAIL_24H, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        configureSmtp(emailService, "smtp.example.com");

        boolean ok = emailService.send(100L);

        assertThat(ok).isTrue();
        verify(messageSender, never()).send(anyString(), anyString(), anyString());
        verify(templateEngine, never()).process(anyString(), any());
        verify(emailLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("send: SMTP host vide = mode degrade")
    void sendDegradedModeBlankHost() throws Exception {
        BlastRecipient r = BlastRecipient.builder()
                .id(6L).externalEmail("a@b.c").preferredLanguage("FR").build();
        Blast blast = buildBlast(List.of(r));
        BlastNotificationJob job = buildJob(JobType.EMAIL_24H, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        configureSmtp(emailService, "");

        boolean ok = emailService.send(100L);

        assertThat(ok).isTrue();
        verify(messageSender, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("send: blast sans recipients -> noop OK")
    void sendNoRecipientsIsOk() throws Exception {
        Blast blast = buildBlast(new ArrayList<>());
        BlastNotificationJob job = buildJob(JobType.EMAIL_24H, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));
        configureSmtp(emailService, "smtp.minexpert.local");

        boolean ok = emailService.send(100L);

        assertThat(ok).isTrue();
        verify(messageSender, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("send: job non-email (POPUP_15M) -> skip silencieux")
    void sendSkipsNonEmailJob() throws Exception {
        Blast blast = buildBlast(new ArrayList<>());
        BlastNotificationJob job = buildJob(JobType.POPUP_15M, blast);
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job));

        boolean ok = emailService.send(100L);

        assertThat(ok).isTrue();
        verify(messageSender, never()).send(anyString(), anyString(), anyString());
    }
}
