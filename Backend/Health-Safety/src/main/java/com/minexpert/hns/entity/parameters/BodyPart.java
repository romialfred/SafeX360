package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.BodyPartDTO;
import com.minexpert.hns.enums.Status;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BodyPart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Lob
    private byte[] file;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BodyPartDTO toDTO() {
        return new BodyPartDTO(this.id, this.name,
                file != null ? java.util.Base64.getEncoder().encodeToString(file) : null, this.status,
                this.createdAt, this.updatedAt);
    }
}
