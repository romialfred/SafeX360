package com.minexpert.hns.blast.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Destinataire d'e-mail de rappel pour un tir : soit un employe (FK virtuelle
 * vers le module RH), soit une adresse externe (riverains, autorites, etc.).
 *
 * <p>{@code preferredLanguage} permet d'envoyer le rappel dans la langue
 * choisie ({@code "FR"} ou {@code "EN"}, par defaut FR).
 */
@Entity
@Table(name = "blast_recipient",
        indexes = {
                @Index(name = "idx_blast_recipient_blast", columnList = "blast_id"),
                @Index(name = "idx_blast_recipient_employee", columnList = "employee_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blast_id", nullable = false)
    private Blast blast;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "external_email", length = 255)
    private String externalEmail;

    /** {@code FR} ou {@code EN}. */
    @Column(name = "preferred_language", length = 8)
    private String preferredLanguage;
}
