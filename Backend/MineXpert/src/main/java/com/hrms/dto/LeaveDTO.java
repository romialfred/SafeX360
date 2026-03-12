package com.hrms.dto;

import java.time.LocalDateTime;
import java.util.Base64;

import com.hrms.entity.Leave;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveDTO {
    private Long id;
    private String name;
    private Long empId;
    private Long type;
    private String reason;
    private LeaveStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime returnDate;
    private Long noOfDays;
    private String comments;
    private String approverName;
    private Long approverId;
    private String approverComment;
    private String doc;
    private LocalDateTime creationDate;
    private Long requestedBy;

    public Leave toEntity(){
        return new Leave(this.id, this.name, this.empId, this.type, this.reason, this.status, this.startDate, this.endDate,this.returnDate, this.noOfDays,this.comments, this.approverName, this.approverId,this.approverComment, this.doc!=null?Base64.getDecoder().decode(this.doc):null, this.creationDate, this.requestedBy);
    } 
}
