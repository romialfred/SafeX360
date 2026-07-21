package com.hrms.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.dto.EmergencyContactDTO;
import com.hrms.dto.EmployeeEvacuationDTO;
import com.hrms.entity.Employee;
import com.hrms.entity.EmployeeEmergencyContact;
import com.hrms.entity.EmployeeEvacuation;
import com.hrms.entity.EvacuationPriorityLevel;
import com.hrms.repository.EmployeeEmergencyContactRepository;
import com.hrms.repository.EmployeeEvacuationRepository;
import com.hrms.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

/**
 * Parametres d'evacuation du personnel (SIRH) : priorite, point de
 * rassemblement, contacts d'urgence.
 *
 * <p>Regle metier : tout employe dont l'intitule de poste contient "Directeur"
 * est automatiquement P1 (priorite effective), meme sans priorite enregistree.</p>
 */
@Service
@RequiredArgsConstructor
public class EmployeeEvacuationService {

    private final EmployeeEvacuationRepository evacRepo;
    private final EmployeeEmergencyContactRepository contactRepo;
    private final EmployeeRepository employeeRepo;

    /** Un directeur est reconnu a son intitule de poste. */
    public static boolean isDirector(String positionName) {
        if (positionName == null) return false;
        String n = positionName.toLowerCase();
        return n.contains("directeur") || n.contains("directrice") || n.contains("director");
    }

    private static EvacuationPriorityLevel effective(EvacuationPriorityLevel stored, boolean director) {
        if (stored != null) return stored;
        return director ? EvacuationPriorityLevel.P1 : null;
    }

    @Transactional(readOnly = true)
    public EmployeeEvacuationDTO getProfile(Long employeeId) {
        Employee e = employeeRepo.findById(employeeId).orElse(null);
        EmployeeEvacuation ev = evacRepo.findByEmployeeId(employeeId).orElse(null);
        List<EmergencyContactDTO> contacts = contactRepo.findByEmployeeIdOrderByPriorityAscIdAsc(employeeId)
                .stream().map(this::toContactDto).toList();

        String pos = (e != null && e.getPosition() != null) ? e.getPosition().getName() : null;
        boolean director = isDirector(pos);
        EvacuationPriorityLevel stored = ev != null ? ev.getPriorityLevel() : null;

        return EmployeeEvacuationDTO.builder()
                .employeeId(employeeId)
                .companyId(e != null && e.getCompany() != null ? e.getCompany().getId()
                        : (ev != null ? ev.getCompanyId() : null))
                .employeeName(e != null ? (safe(e.getFirstName()) + " " + safe(e.getFamilyName())).trim() : null)
                .department(e != null && e.getDepartment() != null ? e.getDepartment().getName() : null)
                .positionName(pos)
                .director(director)
                .priorityLevel(stored)
                .effectivePriority(effective(stored, director))
                .assemblyPointId(ev != null ? ev.getAssemblyPointId() : null)
                .specialNeeds(ev != null ? ev.getSpecialNeeds() : null)
                .contacts(contacts)
                .build();
    }

    @Transactional
    public EmployeeEvacuationDTO upsert(Long employeeId, EmployeeEvacuationDTO dto, Long actorId) {
        Employee e = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EMPLOYEE_NOT_FOUND"));
        EmployeeEvacuation ev = evacRepo.findByEmployeeId(employeeId).orElseGet(() -> {
            EmployeeEvacuation x = new EmployeeEvacuation();
            x.setEmployeeId(employeeId);
            return x;
        });
        ev.setCompanyId(e.getCompany() != null ? e.getCompany().getId() : dto.getCompanyId());
        ev.setPriorityLevel(dto.getPriorityLevel());
        ev.setAssemblyPointId(dto.getAssemblyPointId());
        ev.setSpecialNeeds(trimToNull(dto.getSpecialNeeds()));
        ev.setUpdatedBy(actorId);
        ev.setUpdatedAt(LocalDateTime.now());
        evacRepo.save(ev);
        return getProfile(employeeId);
    }

    /** Vue "SIRH" consommee par la salle de crise : priorite effective par employe de la mine. */
    @Transactional(readOnly = true)
    public List<EmployeeEvacuationDTO> listByCompany(Long companyId) {
        Map<Long, EmployeeEvacuation> evMap = evacRepo.findByCompanyId(companyId).stream()
                .collect(Collectors.toMap(EmployeeEvacuation::getEmployeeId, Function.identity(), (a, b) -> a));
        return employeeRepo.findEmployeesForEvacuation(companyId).stream().map(r -> {
            EmployeeEvacuation ev = evMap.get(r.getId());
            boolean director = isDirector(r.getPosition());
            EvacuationPriorityLevel stored = ev != null ? ev.getPriorityLevel() : null;
            return EmployeeEvacuationDTO.builder()
                    .employeeId(r.getId())
                    .companyId(companyId)
                    .employeeName(r.getName())
                    .department(r.getDepartment())
                    .positionName(r.getPosition())
                    .director(director)
                    .priorityLevel(stored)
                    .effectivePriority(effective(stored, director))
                    .assemblyPointId(ev != null ? ev.getAssemblyPointId() : null)
                    .specialNeeds(ev != null ? ev.getSpecialNeeds() : null)
                    .build();
        }).toList();
    }

    // -- Contacts d'urgence --

    @Transactional
    public EmergencyContactDTO addContact(Long employeeId, EmergencyContactDTO dto) {
        Employee e = employeeRepo.findById(employeeId).orElse(null);
        EmployeeEmergencyContact c = new EmployeeEmergencyContact();
        c.setEmployeeId(employeeId);
        c.setCompanyId(e != null && e.getCompany() != null ? e.getCompany().getId() : null);
        applyContact(c, dto);
        c.setCreatedAt(LocalDateTime.now());
        return toContactDto(contactRepo.save(c));
    }

    @Transactional
    public EmergencyContactDTO updateContact(Long id, EmergencyContactDTO dto) {
        EmployeeEmergencyContact c = contactRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTACT_NOT_FOUND"));
        applyContact(c, dto);
        return toContactDto(contactRepo.save(c));
    }

    @Transactional
    public boolean deleteContact(Long id) {
        if (!contactRepo.existsById(id)) return false;
        contactRepo.deleteById(id);
        return true;
    }

    private void applyContact(EmployeeEmergencyContact c, EmergencyContactDTO dto) {
        c.setName(trimToNull(dto.getName()));
        c.setRelationship(trimToNull(dto.getRelationship()));
        c.setPhone(trimToNull(dto.getPhone()));
        c.setAltPhone(trimToNull(dto.getAltPhone()));
        c.setEmail(trimToNull(dto.getEmail()));
        c.setPriority(dto.getPriority());
        c.setNote(trimToNull(dto.getNote()));
    }

    private EmergencyContactDTO toContactDto(EmployeeEmergencyContact c) {
        return EmergencyContactDTO.builder()
                .id(c.getId())
                .employeeId(c.getEmployeeId())
                .name(c.getName())
                .relationship(c.getRelationship())
                .phone(c.getPhone())
                .altPhone(c.getAltPhone())
                .email(c.getEmail())
                .priority(c.getPriority())
                .note(c.getNote())
                .build();
    }

    private static String safe(String s) { return s == null ? "" : s; }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
