package com.hrms.dto;

import java.time.LocalDate;
import java.util.List;

import com.hrms.entity.Department;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentDTO {
     private Long id;

    private String name;
    private String shortName;
    private String sector;
    private String direction;
    private Status status;
    private LocalDate creationDate;
    private List<ServiceDTO> services;
    private CompanyDTO company;
    public Department toEntity(){
        return new Department(this.id, this.name, this.shortName, this.sector,this.direction, this.status, this.creationDate, this.services!=null?this.services.stream().map(ServiceDTO::toEntity).toList():null, this.company !=null?this.company.toEntity():null);
    }

}
