package com.hrms.dto;

import com.hrms.entity.Company;
import com.hrms.entity.LeaveSetting;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveSettingDTO {
    private Long id;
    private String name;
    private String description;
    private Long maxDays;
    private Boolean reason;
    private Boolean document;
    private String status;
    private Company company;
    
    public LeaveSetting toEntity(){
        return new LeaveSetting(this.id, this.name, this.description, this.maxDays,this.reason, this.document, this.status, this.company);
    }
}

