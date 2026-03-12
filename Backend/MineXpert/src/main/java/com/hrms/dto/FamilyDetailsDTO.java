package com.hrms.dto;

import java.time.LocalDate;

import com.hrms.entity.FamilyDetails;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FamilyDetailsDTO {
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

    public FamilyDetails toEntity(){
        return new FamilyDetails(this.id, this.familyName, this.firstName, this.middleName, this.gender, this.nationality, this.dateOfBirth, this.jobTitle, this.relation, this.employer, this.school, this.familyClass, this.insurance, this.primaryPhone, this.secondPhone, this.email);
    }
}
