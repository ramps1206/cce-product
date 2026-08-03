package org.cce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional email (currently just password-reset links) over SMTP.
 *
 * SMTP is optional: if no mail host is configured (spring.mail.host blank), the
 * sender bean is still present but we skip the send and log the link instead —
 * so the reset flow is testable and never 500s just because email isn't wired
 * up yet. Configure MAIL_* env vars (see application.yml) to actually deliver.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    // Optional: the JavaMailSender bean only exists when spring.mail.host is set.
    private final ObjectProvider<JavaMailSender> senderProvider;
    private final boolean enabled;
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> senderProvider,
                       @Value("${spring.mail.host:}") String host,
                       @Value("${cce.mail.from:CCE Software <no-reply@cce.local>}") String from) {
        this.senderProvider = senderProvider;
        this.enabled = host != null && !host.isBlank();
        this.from = from;
    }

    public void sendPasswordReset(String toEmail, String resetUrl) {
        String subject = "CCE Software — पासवर्ड रीसेट";
        String body = """
                नमस्कार,

                तुमच्या CCE Software खात्याचा पासवर्ड रीसेट करण्याची विनंती आली आहे.
                खालील लिंकवर क्लिक करून नवीन पासवर्ड सेट करा (ही लिंक 30 मिनिटांसाठी वैध आहे):

                %s

                जर ही विनंती तुम्ही केली नसेल, तर हा ईमेल दुर्लक्षित करा — तुमचा पासवर्ड बदलणार नाही.

                — CCE Software
                """.formatted(resetUrl);

        JavaMailSender sender = enabled ? senderProvider.getIfAvailable() : null;
        if (sender == null) {
            log.warn("[MailService] SMTP not configured; password-reset link for {} = {}", toEmail, resetUrl);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
            log.info("[MailService] password-reset email sent to {}", toEmail);
        } catch (Exception e) {
            // Never leak SMTP failures to the caller (would reveal account existence / break UX).
            log.error("[MailService] failed to send reset email to {}: {}", toEmail, e.getMessage());
        }
    }
}
