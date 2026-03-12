package com.hrms.entity;

import com.hrms.dto.LeaveSettingDTO;

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
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class LeaveSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Long maxDays;
    private Boolean reason;
    private Boolean document;
    
    private String status;
     @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;
     
    public LeaveSettingDTO toDTO(){
        return new LeaveSettingDTO(this.id, this.name, this.description, this.maxDays,this.reason, this.document, this.status, this.company);
    }
}
