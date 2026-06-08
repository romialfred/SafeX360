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
 * Garde de tir (sentinelle) postee a un point d'acces du perimetre d'exclusion.
 * FK virtuelle {@code employeeId} -&gt; module RH.
 */
@Entity
@Table(name = "blast_guard",
        indexes = {
                @Index(name = "idx_blast_guard_blast", columnList = "blast_id"),
                @Index(name = "idx_blast_guard_employee", columnList = "employee_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastGuard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blast_id", nullable = false)
    private Blast blast;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    /** Poste tenu par le garde (ex. "Acces nord", "Piste 1080"). */
    @Column(name = "position", length = 128)
    private String position;
}
