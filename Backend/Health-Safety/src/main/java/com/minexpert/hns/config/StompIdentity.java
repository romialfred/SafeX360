package com.minexpert.hns.config;

import java.io.Serializable;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Identité STOMP dérivée exclusivement d'un JWT signé et non expiré. */
public record StompIdentity(
        String subject,
        String role,
        Long userId,
        boolean allMines,
        Set<Long> mineIds) implements Serializable {

    public static final String SESSION_KEY = StompIdentity.class.getName();

    public StompIdentity {
        subject = subject == null ? "" : subject.trim();
        role = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
        mineIds = Collections.unmodifiableSet(
                mineIds == null ? Set.of() : new HashSet<>(mineIds));
    }

    public boolean canAccessMine(long mineId) {
        return allMines || mineIds.contains(mineId);
    }
}
