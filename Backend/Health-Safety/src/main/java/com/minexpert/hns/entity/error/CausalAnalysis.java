package com.minexpert.hns.entity.error;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.CausalMethod;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Analyse causale rattachee a un {@link ErrorEvent}. Porte la methode employee
 * (5 pourquoi, Ishikawa, arbre des causes, ICAM) et la synthese.
 */
@Entity
@Table(name = "causal_analysis")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CausalAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_event_id")
    private Long errorEventId;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private CausalMethod method;

    @Lob
    private String summary;

    @Column(name = "conducted_by")
    private Long conductedBy;

    private LocalDateTime conductedAt;

    public CausalAnalysis(Long id) {
        this.id = id;
    }
}
