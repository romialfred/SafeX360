package com.hrms.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_MS = 15 * 60 * 1000L;

    private final ConcurrentMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String login) {
        if (login == null) return false;
        String key = login.toLowerCase();
        AttemptRecord record = attempts.get(key);
        if (record == null) return false;
        if (record.count >= MAX_ATTEMPTS && !record.isExpired()) {
            return true;
        }
        if (record.isExpired()) {
            attempts.remove(key);
        }
        return false;
    }

    public void recordFailure(String login) {
        if (login == null) return;
        String key = login.toLowerCase();
        attempts.compute(key, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new AttemptRecord(1, System.currentTimeMillis());
            }
            existing.count++;
            return existing;
        });
    }

    public void recordSuccess(String login) {
        if (login == null) return;
        attempts.remove(login.toLowerCase());
    }

    public long getRemainingBlockSeconds(String login) {
        if (login == null) return 0;
        AttemptRecord record = attempts.get(login.toLowerCase());
        if (record == null || record.isExpired()) return 0;
        long elapsed = System.currentTimeMillis() - record.firstAttemptTime;
        return Math.max(0, (BLOCK_DURATION_MS - elapsed) / 1000);
    }

    @Scheduled(fixedRate = 30 * 60 * 1000)
    void evictExpired() {
        attempts.entrySet().removeIf(e -> e.getValue().isExpired());
    }

    private static class AttemptRecord {
        int count;
        final long firstAttemptTime;

        AttemptRecord(int count, long firstAttemptTime) {
            this.count = count;
            this.firstAttemptTime = firstAttemptTime;
        }

        boolean isExpired() {
            return System.currentTimeMillis() - firstAttemptTime > BLOCK_DURATION_MS;
        }
    }
}
