package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocationDTO {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private Status status;
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Location toEntity() {
        return new Location(this.id, this.name, this.latitude, this.longitude, this.status, this.companyId,
                this.createdAt, this.updatedAt);
    }
}
