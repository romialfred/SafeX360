package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.WeatherConditionDTO;
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
public class WeatherCondition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Long companyId;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WeatherCondition(Long id) {
        this.id = id;
    }

    public WeatherConditionDTO toDTO() {
        return new WeatherConditionDTO(this.id, this.name, this.description, this.companyId, this.status,
                this.createdAt,
                this.updatedAt);
    }
}
