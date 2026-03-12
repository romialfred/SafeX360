package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.Company;
import com.hrms.entity.Position;
import com.hrms.entity.PositionCategory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PositionDTO {
   private Long id;
    private String name;
    private String shortName;
    private Company company;
 
    private Long basicSalary;
    private Long housingAllowance;
    private Long performanceAllowance;
    private Long onCallAllowance;
    private Long transportAllowance;
    private Long cashHandlingAllowance;
     private LocalDateTime creationDate;
    private Status status;

    private PositionCategory positionCategory;

    public Position toEntity(){
        return new Position(this.id, this.name, this.shortName, this.company, this.basicSalary, this.housingAllowance, this.performanceAllowance, this.onCallAllowance, this.transportAllowance, this.cashHandlingAllowance,this.creationDate, this.status, this.positionCategory);
    }
}
