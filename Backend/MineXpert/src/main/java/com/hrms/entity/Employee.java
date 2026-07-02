package com.hrms.entity;

import java.time.LocalDate;
import java.util.List;

import com.hrms.dto.EmployeeDTO;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
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

public class Employee {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // private String name;

  // @ManyToOne
  // @JoinColumn(name = "company_id")
  // private Company company;

  // @ManyToOne
  // @JoinColumn(name = "department_id")
  // private Department department;

  // @ManyToOne
  // @JoinColumn(name = "service_id")
  // private Service service;

  // @ManyToOne
  // @JoinColumn(name = "position_id")
  // private Position position;

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
  @ManyToOne
  @JoinColumn(name = "position_id")
  private Position position;
  private String grade;
  private String echelon;
  private LocalDate startDate;
  private LocalDate endDate;
  private String contractType;
  private String contractCategory;
  private String workLocation;
  @ManyToOne
  @JoinColumn(name = "company_id")
  private Company company;
  private String positionCategory;
  @ManyToOne
  @JoinColumn(name = "roster_id")
  private Roster roster;
  private int hoursPerDay;
  @ManyToOne
  @JoinColumn(name = "department_id")
  private Department department;
  private String service;
  private String login;
  private String professionalPhone;
  private String professionalEmail;

  // Payment Information
  @JsonIgnore
  private String paymentPeriod;
  @JsonIgnore
  private String salaryCurrency;
  @JsonIgnore
  private String basicSalary;
  @JsonIgnore
  private String extraPay;
  @JsonIgnore
  private String expatriationAllowance;
  @JsonIgnore
  private String housingAllowance;
  @JsonIgnore
  private String responsibilityAllowance;
  @JsonIgnore
  private String rosterAllowance;
  @JsonIgnore
  private String smearAllowance;
  @JsonIgnore
  private String onCallAllowance;
  @JsonIgnore
  private String exceptionalAllowance;
  @JsonIgnore
  private String transportAllowance;
  @JsonIgnore
  private String cashHandlingAllowance;
  @JsonIgnore
  private String clothingAllowance;
  @JsonIgnore
  private String individualPerformance;
  @JsonIgnore
  private String performanceRate;
  @JsonIgnore
  private String surcharge;
  @JsonIgnore
  private String sujetionAllowance;
  @JsonIgnore
  private String primeERT;
  @JsonIgnore
  private String riskAllowance;
  @JsonIgnore
  private String vacation;
  @JsonIgnore
  private String securityAllowance;

  // Additional Information
  @JsonIgnore
  private String cnpsNumber;
  @JsonIgnore
  private String bank;
  @JsonIgnore
  private String accountNumber;
  @JsonIgnore
  private String iban;
  @OneToMany(cascade = CascadeType.ALL)
  @JoinColumn(name = "employee_id")
  private List<FamilyDetails> familyDetails;

  private String applicable;
  private Long dayLeavesByYear;
  private Long leaveBalance;
  @OneToMany(cascade = CascadeType.ALL)
  @JoinColumn(name = "employee_id")
  private List<Documents> documents;
  private String profilePicture;
  @OneToMany(cascade = CascadeType.ALL)
  @JoinColumn(name = "employee_id")
  private List<Promotion> promotions;
  private String status;
  private LocalDate effectiveEndDate;

  // public EmployeeDTO toDTO(){
  // return new EmployeeDTO(this.id, this.name, this.company.toDTO(),
  // this.department.toDTO(), this.service.toDTO(), this.position.toDTO());
  // }

  public Employee(Long id) {
    this.id = id;
  }

  public EmployeeDTO toDTO() {
    return new EmployeeDTO(this.id, this.uniqueNumber, this.title, this.familyName, this.firstName, this.middleName,
        this.nickname, this.gender, this.maritalStatus, this.nationality, this.dateOfBirth, this.countryOfBirth,
        this.cityOfBirth, this.region, this.address, this.postalCode, this.phoneNumber, this.email, this.twitterProfile,
        this.linkedinProfile, this.facebookProfile, this.position != null ? this.position.toDTO() : null, this.grade,
        this.echelon, this.startDate, this.endDate, this.contractType, this.contractCategory, this.workLocation,
        this.company != null ? this.company.toDTO() : null, this.positionCategory,
        this.roster != null ? this.roster.toDTO() : null, this.hoursPerDay,
        this.department != null ? this.department.toDTO() : null, this.service, this.login, this.professionalPhone,
        this.professionalEmail, this.paymentPeriod, this.salaryCurrency, this.basicSalary, this.extraPay,
        this.expatriationAllowance, this.housingAllowance, this.responsibilityAllowance, this.rosterAllowance,
        this.smearAllowance, this.onCallAllowance, this.exceptionalAllowance, this.transportAllowance,
        this.cashHandlingAllowance, this.clothingAllowance, this.individualPerformance, this.performanceRate,
        this.surcharge, this.sujetionAllowance, this.primeERT, this.riskAllowance, this.vacation,
        this.securityAllowance, this.cnpsNumber, this.bank, this.accountNumber, this.iban,
        this.familyDetails != null ? this.familyDetails.stream().map(FamilyDetails::toDTO).toList() : null,
        this.applicable, this.dayLeavesByYear, this.leaveBalance,
        this.documents != null ? this.documents.stream().map(Documents::toDTO).toList() : null, this.profilePicture,
        this.promotions != null ? this.promotions.stream().map(Promotion::toDTO).toList() : null, this.status,
        this.effectiveEndDate);
  }

}
