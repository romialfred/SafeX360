package com.minexpert.hns.entity.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.ContributorDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Contributor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String role;
    private String section;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Contributor(Long id) {
        this.id = id;
    }

    public ContributorDTO toDTO() {
        return new ContributorDTO(this.id, this.name, this.role, this.section,
                this.audit != null ? this.audit.getId() : null, this.createdAt, this.updatedAt);
    }
}
