package org.cce.web.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.List;

/** Payloads for the offline-first sync engine (pull/push, last-write-wins). */
public final class SyncDtos {
    private SyncDtos() {}

    /**
     * One synced unit.
     *  - array parts (students/classes/teachers/generalRegister/scholarships):
     *      key = the app's numeric client id (as string)
     *  - map parts (evaluations/attendance/descriptiveNotes/bharansh):
     *      key = the map key
     *  - scalar parts (school/workingDays/settings): key = "_"
     */
    public record SyncItem(
            String part,
            String key,
            JsonNode payload,
            OffsetDateTime updatedAt,
            boolean deleted) {}

    public record PushRequest(List<SyncItem> items) {}

    public record RejectedRef(String part, String key) {}

    public record PushResult(
            OffsetDateTime serverTime,
            int applied,
            int rejected,
            List<RejectedRef> rejectedItems) {}

    public record PullResult(
            OffsetDateTime serverTime,
            List<SyncItem> items) {}
}
