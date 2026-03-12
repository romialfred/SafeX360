package com.minexpert.hns.entity.audit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.*;

@Converter
public class AuditTypeDataConverter implements AttributeConverter<Map<String, List<String>>, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<String, List<String>> auditTypeData) {
        if (auditTypeData == null || auditTypeData.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(auditTypeData);
        } catch (Exception e) {
            throw new RuntimeException("Error converting map to JSON string", e);
        }
    }

    @Override
    public Map<String, List<String>> convertToEntityAttribute(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, List<String>>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Error converting JSON string to map", e);
        }
    }
}