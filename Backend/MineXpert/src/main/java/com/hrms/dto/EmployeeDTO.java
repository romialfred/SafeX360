package com.hrms.dto;

import java.time.LocalDate;
import java.util.List;

import com.hrms.entity.Employee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDTO {
    private Long id;

    private String uniqueNumber;
    private String title;
    private String familyName;
    private String firstName;
    private String middleName;
    private String nickname;
    private String gender;
    private String maritalStatus;
    private String nationality;
    private LocalDate dateOfBirth;
    private String countryOfBirth;
    private String cityOfBirth;
    private String region;
    private String address;
    private String postalCode;
    private String phoneNumber;
    private String email;
    private String twitterProfile;
    private String linkedinProfile;
    private String facebookProfile;

    // Job Information
    private PositionDTO position;
    private String grade;
    private String echelon;
    private LocalDate startDate;
    private LocalDate endDate;
    private String contractType;
    private String contractCategory;
    private String workLocation;
    private CompanyDTO company;
    private String positionCategory;
    private RosterDTO roster;
    private int hoursPerDay;
    private DepartmentDTO department;
    private String service;
    private String login;
    private String professionalPhone;
    private String professionalEmail;

    // Payment Information
    private String paymentPeriod;
    private String salaryCurrency;
    private String basicSalary;
    private String extraPay;
    private String expatriationAllowance;
    private String housingAllowance;
    private String responsibilityAllowance;
    private String rosterAllowance;
    private String smearAllowance;
    private String onCallAllowance;
    private String exceptionalAllowance;
    private String transportAllowance;
    private String cashHandlingAllowance;
    private String clothingAllowance;
    private String individualPerformance;
    private String performanceRate;

    private String surcharge;
    private String sujetionAllowance;
    private String primeERT;
    private String riskAllowance;
    private String vacation;
    private String securityAllowance;

    // Additional Information
    private String cnpsNumber;
    private String bank;
    private String accountNumber;
    private String iban;
    private List<FamilyDetailsDTO> familyDetails;

    private String applicable;
    private Long dayLeavesByYear;
    private Long leaveBalance;
    private List<DocumentsDTO> documents;
    private String profilePicture;
    private List<PromotionDTO> promotions;
    private String status;
    private LocalDate effectiveEndDate;
    // public Employee toEntity(){
    // return new Employee(this.id, this.name, this.company.toEntity(),
    // this.department.toEntity(), this.service.toEntity(),
    // this.position.toEntity());
    // }

    public Employee toEntity() {
        return new Employee(this.id, this.uniqueNumber, this.title, this.familyName, this.firstName, this.middleName,
                this.nickname, this.gender, this.maritalStatus, this.nationality, this.dateOfBirth, this.countryOfBirth,
                this.cityOfBirth, this.region, this.address, this.postalCode, this.phoneNumber, this.email,
                this.twitterProfile, this.linkedinProfile, this.facebookProfile,
                this.position != null ? this.position.toEntity() : null, this.grade, this.echelon, this.startDate,
                this.endDate, this.contractType, this.contractCategory, this.workLocation,
                this.company != null ? this.company.toEntity() : null, this.positionCategory,
                this.roster != null ? this.roster.toEntity() : null, this.hoursPerDay,
                this.department != null ? this.department.toEntity() : null, this.service, this.login,
                this.professionalPhone, this.professionalEmail, this.paymentPeriod, this.salaryCurrency,
                this.basicSalary, this.extraPay, this.expatriationAllowance, this.housingAllowance,
                this.responsibilityAllowance, this.rosterAllowance, this.smearAllowance, this.onCallAllowance,
                this.exceptionalAllowance, this.transportAllowance, this.cashHandlingAllowance, this.clothingAllowance,
                this.individualPerformance, this.performanceRate, this.surcharge, this.sujetionAllowance, this.primeERT,
                this.riskAllowance, this.vacation, this.securityAllowance, this.cnpsNumber, this.bank,
                this.accountNumber, this.iban,
                this.familyDetails != null ? this.familyDetails.stream().map(FamilyDetailsDTO::toEntity).toList()
                        : null,
                this.applicable, this.dayLeavesByYear, this.leaveBalance,
                this.documents != null ? this.documents.stream().map(DocumentsDTO::toEntity).toList() : null,
                this.profilePicture,
                this.promotions != null ? this.promotions.stream().map(PromotionDTO::toEntity).toList() : null,
                this.status, this.effectiveEndDate);
    }
}
