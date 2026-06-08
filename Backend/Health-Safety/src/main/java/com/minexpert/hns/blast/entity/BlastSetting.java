package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Parametres du module Blast Management par mine.
 *
 * <p>Defauts (cf. §4.7) :
 * <ul>
 *   <li>{@code reminder_24h_offset_minutes} = 1440 (T-24h)</li>
 *   <li>{@code reminder_6h_offset_minutes} = 360 (T-6h)</li>
 *   <li>{@code reminder_30m_offset_minutes} = 30 (T-30 min)</li>
 *   <li>{@code popup_cadence_minutes} = 15</li>
 *   <li>{@code popup_window_minutes} = 120 (fenetre 2h avant le tir)</li>
 *   <li>{@code general_alarm_offset_minutes} = 10 (Alerte Generale a T-10)</li>
 * </ul>
 */
@Entity
@Table(name = "blast_setting",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_blast_setting_mine", columnNames = {"mine_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mine_id", nullable = false)
    private Long mineId;

    @Column(name = "reminder_24h_offset_minutes", nullable = false)
    private int reminder24hOffsetMinutes;

    @Column(name = "reminder_6h_offset_minutes", nullable = false)
    private int reminder6hOffsetMinutes;

    @Column(name = "reminder_30m_offset_minutes", nullable = false)
    private int reminder30mOffsetMinutes;

    @Column(name = "popup_cadence_minutes", nullable = false)
    private int popupCadenceMinutes;

    @Column(name = "popup_window_minutes", nullable = false)
    private int popupWindowMinutes;

    @Column(name = "general_alarm_offset_minutes", nullable = false)
    private int generalAlarmOffsetMinutes;

    @Column(name = "default_timezone", nullable = false, length = 64)
    private String defaultTimezone;

    @Column(name = "smtp_from_address", length = 255)
    private String smtpFromAddress;

    @Column(name = "control_room_label", length = 128)
    private String controlRoomLabel;

    /**
     * Libelle du site utilise en signature des e-mails de tir (ex. "Mine de
     * Boungou — Service HSE"). Resolu par mine pour ne plus dependre d'une
     * property globale. Si {@code null}, fallback sur la property
     * {@code blast.site.label} cote {@link com.minexpert.hns.blast.service.BlastEmailService}.
     */
    @Column(name = "site_label", length = 160)
    private String siteLabel;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;
}
