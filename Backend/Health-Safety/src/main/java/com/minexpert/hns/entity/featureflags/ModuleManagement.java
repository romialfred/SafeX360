package com.minexpert.hns.entity.featureflags;

import com.minexpert.hns.dto.featureflags.ModuleManagementDTO;
import com.minexpert.hns.enums.Status;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "module_management")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModuleManagement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module", nullable = false, unique = true, length = 128)
    private String module;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public ModuleManagementDTO toDTO() {
        return new ModuleManagementDTO(
                this.id,
                this.module,
                this.status,
                this.createdAt,
                this.updatedAt
        );
    }
}

