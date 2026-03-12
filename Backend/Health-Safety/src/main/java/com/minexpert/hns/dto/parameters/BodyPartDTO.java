package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;
import java.util.Base64;

import com.minexpert.hns.entity.parameters.BodyPart;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BodyPartDTO {
    private Long id;
    private String name;
    private String file;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BodyPart toEntity() {
        return new BodyPart(this.id, this.name, this.file != null ? Base64.getDecoder().decode(file) : null,
                this.status,
                this.createdAt,
                this.updatedAt);
    }
}
