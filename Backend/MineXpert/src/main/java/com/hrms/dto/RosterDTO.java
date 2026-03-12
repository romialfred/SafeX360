package com.hrms.dto;

import com.hrms.entity.Roster;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RosterDTO {
    private Long id;
    private String name;
    private String description;
    private String category;
    private Status status;
    private String creationDate;

    public Roster toEntity(){
        return new Roster(this.id, this.name,  this.description, this.category, this.status, this.creationDate);
    }
}
