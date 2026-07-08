package com.minexpert.hns.dosimetry.health;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * HealthIndicator dedie aux triggers d'immutabilite de la migration V004
 * ({@code V004__dosimetry_audit_triggers.sql}).
 *
 * <p>Verifie que les triggers garantissant l'append-only sur
 * {@code dosimetry_audit_log} et {@code dosimetry_dose_record} sont bien installes
 * (3 triggers livres par V004 : NO_UPDATE + NO_DELETE sur l'audit log,
 * APPEND_ONLY sur dose_record).
 *
 * <p>Si moins de 3 triggers sont presents, la base risque de tolerer des
 * UPDATE/DELETE sur des tables censees etre immuables, ce qui briserait la
 * chaine d'audit AIEA GSR Part 3 §3.106.
 *
 * <p>Exposition : {@code GET /actuator/health/dosimetryAuditTriggers}.
 *
 * <p>Au demarrage, un WARNING est logge si les triggers sont absents pour alerter l'ops.
 */
@Component("dosimetryAuditTriggers")
public class DosimetryAuditTriggersHealthIndicator implements HealthIndicator {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(DosimetryAuditTriggersHealthIndicator.class);

    /**
     * Seuil minimal de triggers attendus pour considerer le module sain.
     * ALIGNE sur ce que V004 cree REELLEMENT (3) : l'ancien seuil de 4
     * comptait un « trigger complementaire phase 2 » jamais livre, rendant
     * le health DOWN meme apres application complete des migrations.
     */
    static final int EXPECTED_MIN_TRIGGERS = 3;

    /** Tables auditees par les triggers d'immutabilite. */
    private static final List<String> AUDITED_TABLES =
            List.of("dosimetry_audit_log", "dosimetry_dose_record");

    private final JdbcTemplate jdbcTemplate;

    public DosimetryAuditTriggersHealthIndicator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Health health() {
        int count = countTriggers();
        if (count < 0) {
            return Health.down()
                    .withDetail("error", "Unable to query SHOW TRIGGERS — check DB privileges")
                    .build();
        }
        if (count < EXPECTED_MIN_TRIGGERS) {
            return Health.down()
                    .withDetail("expectedMinTriggers", EXPECTED_MIN_TRIGGERS)
                    .withDetail("foundTriggers", count)
                    .withDetail("missingTriggers", EXPECTED_MIN_TRIGGERS - count)
                    .withDetail("tables", AUDITED_TABLES)
                    .withDetail("hint", "Run flyway migrate to apply V004__dosimetry_audit_triggers.sql")
                    .build();
        }
        return Health.up()
                .withDetail("triggers", count)
                .withDetail("tables", AUDITED_TABLES)
                .build();
    }

    /**
     * Logue un avertissement au demarrage si les triggers d'immutabilite ne sont pas tous
     * presents. Permet a l'equipe ops de detecter immediatement une base de donnees mal
     * provisionnee sans devoir consulter /actuator/health.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void warnIfTriggersMissingOnStartup() {
        int count = countTriggers();
        if (count < 0) {
            LOGGER.warn("[DosimetryAuditTriggersHealthIndicator] Impossible de verifier les "
                    + "triggers d'immutabilite (erreur d'execution SHOW TRIGGERS).");
            return;
        }
        if (count < EXPECTED_MIN_TRIGGERS) {
            LOGGER.warn("[DosimetryAuditTriggersHealthIndicator] Triggers d'immutabilite "
                    + "INCOMPLETS : {} trouve(s) sur {} attendus (tables {}). "
                    + "La migration V004__dosimetry_audit_triggers.sql doit etre appliquee, "
                    + "sinon la chaine d'audit AIEA GSR Part 3 §3.106 n'est pas garantie.",
                    count, EXPECTED_MIN_TRIGGERS, AUDITED_TABLES);
        } else {
            LOGGER.info("[DosimetryAuditTriggersHealthIndicator] Triggers d'immutabilite OK "
                    + "({} actifs sur tables {}).", count, AUDITED_TABLES);
        }
    }

    /**
     * @return nombre de triggers MySQL definis sur les tables auditees, ou -1 en cas d'erreur.
     */
    private int countTriggers() {
        try {
            // SHOW TRIGGERS WHERE Table IN ('dosimetry_audit_log', 'dosimetry_dose_record')
            // Compatible MySQL/MariaDB. Sur d'autres SGBD, ce health renverra "error".
            String sql = "SHOW TRIGGERS WHERE `Table` IN ('dosimetry_audit_log', 'dosimetry_dose_record')";
            List<?> rows = jdbcTemplate.queryForList(sql);
            return rows != null ? rows.size() : 0;
        } catch (Exception ex) {
            LOGGER.warn("[DosimetryAuditTriggersHealthIndicator] SHOW TRIGGERS a echoue : {}",
                    ex.getMessage());
            return -1;
        }
    }
}
