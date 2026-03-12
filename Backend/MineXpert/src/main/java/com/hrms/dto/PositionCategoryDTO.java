package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.PositionCategory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PositionCategoryDTO {
     private Long id;
    private String name;
    private String shortName;
    private String grade;
    private String range;
    private Status status;
    private LocalDateTime creationDate;

    public PositionCategory toEntity(){
        return new PositionCategory(this.id, this.name, this.shortName,this.grade,this.range, this.status, this.creationDate);
    }

}
