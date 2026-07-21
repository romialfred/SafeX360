package com.hrms.DataInterface;

/** Projection : employé actif d'une mine avec son intitulé de poste (détection Directeur). */
public interface EmployeeEvacRow {
    Long getId();
    String getName();
    String getDepartment();
    String getPosition();
}
