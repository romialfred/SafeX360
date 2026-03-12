package com.hrms.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.hrms.entity.Promotion;
import com.hrms.entity.Roster;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionDTO {
    private Long id;
    private Long recommendedBy;
    private Long approvedBy;
    private String reason;
    private CompanyDTO prevCompany;      // Use DTO for Company
    private DepartmentDTO prevDepartment; // Use DTO for Department
    private String prevService;      // Use DTO for Service
    private PositionDTO prevPosition;    // Use DTO for Position
    private String prevGrade;
    private RosterDTO prevRoster;     // Use DTO for PositionCategory
    private String prevPositionCategory; // Use DTO for PositionCategory
    private LocalDate prevStartDate;
    private LocalDate prevEndDate;
    private CompanyDTO company;         // Use DTO for Company
    private DepartmentDTO department;   // Use DTO for Department
    private String service;         // Use DTO for Service
    private PositionDTO position;       // Use DTO for Position
    private String grade;
    private String positionCategory;  // Use DTO for PositionCategory
    private RosterDTO roster;           // Use DTO for PositionCategory
    private String echelon;
    private String contractCategory;
    private String contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime timestamp;

    public Promotion toEntity(){
        return new Promotion(this.id, this.recommendedBy, this.approvedBy, this.reason, this.prevCompany!=null?this.prevCompany.toEntity():null, this.prevDepartment!=null?this.prevDepartment.toEntity():null, this.prevService, this.prevPosition!=null?this.prevPosition.toEntity():null, this.prevGrade, this.prevRoster!=null?this.prevRoster.toEntity():null, this.prevPositionCategory, this.prevStartDate, this.prevEndDate, this.company!=null?this.company.toEntity():null, this.department!=null?this.department.toEntity():null, this.service, this.position!=null?this.position.toEntity():null, this.grade, this.positionCategory, this.roster!=null?this.roster.toEntity():null, this.echelon, this.contractCategory, this.contractType, this.startDate, this.endDate, this.timestamp);
    }
}

