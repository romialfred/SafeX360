package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.Company;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompanyDTO {
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

    public Company toEntity(){
        return new Company(this.id, this.name, this.shortName, this.country,this.region, this.locality, this.material, this.startDate, this.endDate,this.creationDate, this.startDate, this.status);
    }

}
