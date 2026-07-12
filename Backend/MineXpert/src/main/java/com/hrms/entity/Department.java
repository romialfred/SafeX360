package com.hrms.entity;

import java.time.LocalDate;
import java.util.List;

import com.hrms.dto.DepartmentDTO;
import com.hrms.dto.Status;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String shortName;
    private String sector;
    private String direction;
    @Enumerated(EnumType.STRING)
    private Status status;
    private LocalDate creationDate;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "department_id")
    private List<Service> services;
    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;

    public DepartmentDTO toDTO(){
        return new DepartmentDTO(this.id, this.name, this.shortName, this.sector,this.direction, this.status, this.creationDate, this.services!=null?this.services.stream().map(Service::toDTO).toList():null, this.company!=null?this.company.toDTO():null);
    }

}
