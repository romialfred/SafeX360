package com.hrms.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.hrms.dto.PromotionDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Promotion {
      @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long recommendedBy;
    private Long approvedBy;
    private String reason;
     @ManyToOne
    @JoinColumn(name = "prev_company_id")
    private Company prevCompany;
    @ManyToOne
    @JoinColumn(name = "prev_department_id")
    private Department prevDepartment;
    private String prevService;
    @ManyToOne
    @JoinColumn(name = "prev_position_id")
    private Position prevPosition;
    private String prevGrade;
    @ManyToOne
    @JoinColumn(name = "prev_roster_id")
    private Roster prevRoster;
    private String prevPositionCategory;
    private LocalDate prevStartDate;
    private LocalDate prevEndDate;
    @ManyToOne
    @JoinColumn(name = "cur_company_id")
    private Company company;
    @ManyToOne
    @JoinColumn(name = "cur_department_id")
    private Department department;
    private String service;
    @ManyToOne
    @JoinColumn(name = "cur_position_id")
    private Position position;
    private String grade;
    private String positionCategory;
    @ManyToOne
    @JoinColumn(name = "cur_roster_id")
    private Roster roster;

    private String echelon;
    private String  contractCategory;
    private String contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime timestamp;

    public PromotionDTO toDTO(){
        return new PromotionDTO(this.id, this.recommendedBy, this.approvedBy, this.reason, this.prevCompany!=null?this.prevCompany.toDTO():null, this.prevDepartment!=null?this.prevDepartment.toDTO():null, this.prevService, this.prevPosition!=null?this.prevPosition.toDTO():null, this.prevGrade, this.prevRoster!=null?this.prevRoster.toDTO():null, this.prevPositionCategory,this.prevStartDate, this.prevEndDate, this.company!=null?this.company.toDTO():null, this.department!=null?this.department.toDTO():null, this.service, this.position!=null?this.position.toDTO():null, this.grade, this.positionCategory, this.roster!=null?this.roster.toDTO():null, this.echelon, this.contractCategory, this.contractType, this.startDate, this.endDate, this.timestamp);
    }
}
