package com.hrms.entity;

import com.hrms.dto.RosterDTO;
import com.hrms.dto.Status;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Roster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String category;
    @Enumerated(EnumType.STRING)
    private Status status;
    private String creationDate;

    public RosterDTO toDTO(){
        return new RosterDTO(this.id, this.name, this.description, this.category, this.status, this.creationDate);
    }
}
