package com.minexpert.hns.entity.audit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class EmpInterviewConverter implements AttributeConverter<List<EmpInterview>, String> {

    private final ObjectMapper objectMapper;

    public EmpInterviewConverter() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
    }

    @Override
    public String convertToDatabaseColumn(List<EmpInterview> attribute) {
        if (attribute == null || attribute.isEmpty())
            return null;
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new RuntimeException("Error converting EmpInterview list to JSON", e);
        }
    }

    @Override
    public List<EmpInterview> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty())
            return null;
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<EmpInterview>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Error converting JSON to EmpInterview list", e);
        }
    }
}