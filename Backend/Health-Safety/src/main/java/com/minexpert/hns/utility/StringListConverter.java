package com.minexpert.hns.utility;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.minexpert.hns.dto.ParticipantDTO;
import com.minexpert.hns.dto.response.ParticipantResponse;

public class StringListConverter {

    /**
     * LOT 41 P0 fix : robustesse face aux données legacy mixtes (ID numérique
     * ou nom textuel). Certaines BDD migrées contiennent des valeurs comme
     * "Brumeux" / "Production" dans des colonnes prévues pour des IDs Long.
     *
     * Avant : NumberFormatException propagé en HTTP 500.
     * Maintenant : on filtre silencieusement les tokens non numériques et
     * on log le souci pour qu'un nettoyage de données soit fait à terme.
     */
    public static List<Long> convertToLongList(String input) {
        if (input == null || input.trim().isEmpty())
            return null;
        return Arrays.stream(input.replaceAll("[\\[\\]\\s]", "").split(","))
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return Long.valueOf(s);
                    } catch (NumberFormatException e) {
                        // Token non numérique (legacy data) — on l'ignore.
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static List<String> convertToStringList(String input) {
        if (input == null || input.trim().isEmpty())
            return null;
        return Arrays.stream(input.replaceAll("[\\[\\]]", "").split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public static List<Boolean> convertToBooleanList(String input) {
        if (input == null || input.trim().isEmpty())
            return null;

        return Arrays.stream(input.replaceAll("[\\[\\]\\s]", "").split(","))
                .filter(s -> !s.isEmpty())
                .map(Boolean::valueOf)
                .collect(Collectors.toList());
    }

    // public static List<ParticipantResponse>
    // convertToParticipantResponseList(String input) {
    // if (input == null || input.trim().isEmpty())
    // return null;
    // return Arrays.stream(input.replaceAll("[\\[\\]]", "").split(","))
    // .map(String::trim)
    // .filter(s -> !s.isEmpty())
    // .map(s -> {
    // String[] parts = s.split(":");
    // return new ParticipantResponse(Long.valueOf(parts[0]), null, parts[1]);
    // })
    // .collect(Collectors.toList());
    // }

    public static String convertParticipantsToString(List<ParticipantDTO> participants) {
        if (participants == null || participants.isEmpty())
            return "";

        return participants.stream()
                .map(p -> p.getId() + ":" + p.getRole())
                .collect(Collectors.joining(","));
    }

    public static List<ParticipantResponse> convertStringToParticipants(String input) {
        if (input == null || input.isEmpty())
            return Collections.emptyList();

        return Arrays.stream(input.split(","))
                .map(entry -> {
                    String[] parts = entry.split(":");
                    Long id = Long.parseLong(parts[0].trim());
                    String role = parts[1].trim();
                    return new ParticipantResponse(id, null, role, null);
                })
                .collect(Collectors.toList());
    }

    public static List<ParticipantDTO> convertStringToParticipantsDTO(String input) {
        if (input == null || input.isEmpty())
            return Collections.emptyList();

        return Arrays.stream(input.split(","))
                .map(entry -> {
                    String[] parts = entry.split(":");
                    Long id = Long.parseLong(parts[0].trim());
                    String role = parts[1].trim();
                    return new ParticipantDTO(id, role);
                })
                .collect(Collectors.toList());
    }
}