package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.WorkProcessDTO;
import com.minexpert.hns.enums.Status;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkProcess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Long departmentId;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WorkProcess(Long id) {
        this.id = id;
    }

    public WorkProcessDTO toDTO() {
        return new WorkProcessDTO(id, name, departmentId, null, status, createdAt, updatedAt);
    }
}
