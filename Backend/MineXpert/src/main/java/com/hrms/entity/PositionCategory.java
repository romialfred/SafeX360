package com.hrms.entity;

import java.time.LocalDateTime;

import com.hrms.dto.PositionCategoryDTO;
import com.hrms.dto.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class PositionCategory {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String shortName;
    private String grade;
      @Column(name = "`range`")
    private String range;
    @Enumerated(EnumType.STRING)
    private Status status;
    private LocalDateTime creationDate;

    public PositionCategoryDTO toDTO(){
        return new PositionCategoryDTO(this.id, this.name, this.shortName,this.grade,this.range, this.status, this.creationDate);
    }
}
