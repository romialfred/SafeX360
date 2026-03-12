package com.hrms.entity;

import java.time.LocalDate;

import com.hrms.dto.FamilyDetailsDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class FamilyDetails {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String familyName;
    private String firstName;
    private String middleName;
    private String gender;
    private String nationality;
    private LocalDate dateOfBirth;
    private String jobTitle;
    private String relation;  // e.g., Spouse, Child
    private String employer;
    private String school;
    private String familyClass;  // using 'class' as a reserved keyword in Java, renamed to 'familyClass'
    private String insurance;  // e.g., Yes, No
    private String primaryPhone;  // storing as String to handle different phone formats
    private String secondPhone;  // storing as String for consistency
    private String email;

    public FamilyDetailsDTO toDTO(){
        return new FamilyDetailsDTO(this.id, this.familyName, this.firstName, this.middleName, this.gender, this.nationality, this.dateOfBirth, this.jobTitle, this.relation, this.employer, this.school, this.familyClass, this.insurance, this.primaryPhone, this.secondPhone, this.email);
    }
    
}
