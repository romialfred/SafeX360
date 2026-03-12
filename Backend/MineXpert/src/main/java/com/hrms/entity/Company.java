package com.hrms.entity;

import java.time.LocalDateTime;


import com.hrms.dto.CompanyDTO;
import com.hrms.dto.CompanyStatus;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String shortName;
    private String country;
    private String region;
    private String locality;
    private String material;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime creationDate;
    private LocalDateTime statusDate;
    private CompanyStatus status;

    public CompanyDTO toDTO(){
        return new CompanyDTO(this.id, this.name, this.shortName, this.country,this.region, this.locality, this.material, this.startDate, this.endDate,this.creationDate, this.startDate, this.status);
    }
}
