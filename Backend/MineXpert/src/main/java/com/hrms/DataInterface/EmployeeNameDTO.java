package com.hrms.DataInterface;

public interface EmployeeNameDTO {
    Long getId();

    String getName();

    String getEmpNumber();

    Long getCompId();

    String getEmail();

    /** Téléphone personnel (peut être null) — utilisé par la console d'intervention SOS. */
    String getPhone();
}