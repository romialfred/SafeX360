package com.minexpert.hns.dto.ppe.dotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Page de résultats du tableau + options de filtres disponibles. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DotationListDTO {
    private List<DotationEmployeeDTO> content;
    private int total;
    private int page;
    private int size;
    private List<String> departments; // options de filtre
    private List<String> functions;   // options de filtre (postes)
}
