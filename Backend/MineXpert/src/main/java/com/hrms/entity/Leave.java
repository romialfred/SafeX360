package com.hrms.entity;


import java.time.LocalDateTime;
import java.util.Base64;

import com.hrms.dto.LeaveDTO;
import com.hrms.dto.LeaveStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "`leave`")
public class Leave {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Long empId;
    private Long type;
    private String reason;
    @Enumerated(EnumType.STRING)
    private LeaveStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime returnDate;
    private Long noOfDays;
    private String comments;
    private String approverName;
    private Long approverId;
    private String approverComment;
    @Lob
    private byte[] doc;
    private LocalDateTime creationDate;
    private Long requestedBy;

    public LeaveDTO toDTO(){
        return new LeaveDTO(this.id, this.name, this.empId, this.type, this.reason,this.status, this.startDate, this.endDate, this.returnDate,this.noOfDays,this.comments, this.approverName, this.approverId,this.approverComment,this.doc!=null?Base64.getEncoder().encodeToString(this.doc):null, this.creationDate, this.requestedBy);
    } 
}
