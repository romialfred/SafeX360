package com.hrms.entity;

import java.time.LocalDateTime;

import com.hrms.dto.PositionDTO;
import com.hrms.dto.Status;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "`position`")
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String shortName;
    @ManyToOne
    @JoinColumn(name = "company_id") 
    private Company company;
 
    private Long basicSalary;
    private Long housingAllowance;
    private Long performanceAllowance;
    private Long onCallAllowance;
    private Long transportAllowance;
    private Long cashHandlingAllowance;
    private LocalDateTime   creationDate;
    private Status status;

    @ManyToOne
    @JoinColumn(name = "position_category_id") 
    private PositionCategory positionCategory;

    public PositionDTO toDTO(){
        return new PositionDTO(this.id, this.name, this.shortName, this.company, this.basicSalary, this.housingAllowance, this.performanceAllowance, this.onCallAllowance, this.transportAllowance, this.cashHandlingAllowance, this.creationDate, this.status , this.positionCategory);
    }
}
