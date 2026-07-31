package org.cce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.cce.web.dto.SyncDtos.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

/**
 * Offline-first sync engine, ported from the original single-file app's
 * part-based Firestore sync (ARRAY_PARTS / MAP_PARTS + tombstones).
 *
 * Merge rule = last-write-wins per item, compared on updatedAt. The five array
 * parts map to their own typed tables; the map + scalar parts live in
 * school_kv. Everything is scoped to the caller's school_id.
 */
@Service
public class SyncService {

    /** Array parts → their tables (whitelist; never interpolate untrusted names). */
    private static final Map<String, String> ARRAY_TABLES = Map.of(
            "students", "students",
            "classes", "classes",
            "teachers", "teachers",
            "generalRegister", "general_register",
            "scholarships", "scholarships");

    /** Map parts + scalar parts, all stored in school_kv. */
    private static final Set<String> KV_PARTS = Set.of(
            "evaluations", "attendance", "descriptiveNotes", "bharansh", "nipun", "lo",
            "school", "workingDays", "settings");

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public SyncService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    // ---- PULL -------------------------------------------------------------

    /** All items (incl. tombstones) changed strictly after {@code since}. */
    public PullResult pull(UUID schoolId, OffsetDateTime since) {
        OffsetDateTime cursor = since == null
                ? OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)
                : since;
        List<SyncItem> out = new ArrayList<>();

        ARRAY_TABLES.forEach((part, table) -> {
            String sql = "SELECT client_id, payload, updated_at, deleted FROM " + table
                    + " WHERE school_id = ? AND updated_at > ? ORDER BY updated_at";
            jdbc.query(sql, (RowCallbackHandler) rs ->
                out.add(new SyncItem(
                        part,
                        String.valueOf(rs.getLong("client_id")),
                        readJson(rs.getString("payload")),
                        rs.getObject("updated_at", OffsetDateTime.class),
                        rs.getBoolean("deleted"))),
                schoolId, cursor);
        });

        jdbc.query(
                "SELECT part, item_key, payload, updated_at, deleted FROM school_kv "
                        + "WHERE school_id = ? AND updated_at > ? ORDER BY updated_at",
                (RowCallbackHandler) rs -> out.add(new SyncItem(
                        rs.getString("part"),
                        rs.getString("item_key"),
                        readJson(rs.getString("payload")),
                        rs.getObject("updated_at", OffsetDateTime.class),
                        rs.getBoolean("deleted"))),
                schoolId, cursor);

        return new PullResult(serverNow(), out);
    }

    // ---- PUSH -------------------------------------------------------------

    @Transactional
    public PushResult push(UUID schoolId, List<SyncItem> items) {
        int applied = 0;
        List<RejectedRef> rejected = new ArrayList<>();
        if (items == null) items = List.of();

        for (SyncItem it : items) {
            OffsetDateTime ts = it.updatedAt() == null ? serverNow() : it.updatedAt();
            String json = writeJson(it.payload());
            int rows;

            if (ARRAY_TABLES.containsKey(it.part())) {
                long clientId;
                try {
                    clientId = Long.parseLong(it.key());
                } catch (NumberFormatException e) {
                    rejected.add(new RejectedRef(it.part(), it.key()));
                    continue;
                }
                String table = ARRAY_TABLES.get(it.part());
                rows = jdbc.update(
                        "INSERT INTO " + table + " (school_id, client_id, payload, updated_at, deleted) "
                                + "VALUES (?, ?, ?::jsonb, ?, ?) "
                                + "ON CONFLICT (school_id, client_id) DO UPDATE SET "
                                + "payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at, deleted = EXCLUDED.deleted "
                                + "WHERE " + table + ".updated_at <= EXCLUDED.updated_at",
                        schoolId, clientId, json, ts, it.deleted());
            } else if (KV_PARTS.contains(it.part())) {
                String key = (it.key() == null || it.key().isBlank()) ? "_" : it.key();
                rows = jdbc.update(
                        "INSERT INTO school_kv (school_id, part, item_key, payload, updated_at, deleted) "
                                + "VALUES (?, ?, ?, ?::jsonb, ?, ?) "
                                + "ON CONFLICT (school_id, part, item_key) DO UPDATE SET "
                                + "payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at, deleted = EXCLUDED.deleted "
                                + "WHERE school_kv.updated_at <= EXCLUDED.updated_at",
                        schoolId, it.part(), key, json, ts, it.deleted());
            } else {
                rejected.add(new RejectedRef(it.part(), it.key()));   // unknown part
                continue;
            }

            if (rows > 0) applied++;
            else rejected.add(new RejectedRef(it.part(), it.key())); // server had newer -> LWW kept it
        }
        return new PushResult(serverNow(), applied, rejected.size(), rejected);
    }

    // ---- helpers ----------------------------------------------------------

    private OffsetDateTime serverNow() {
        return jdbc.queryForObject("SELECT now()", OffsetDateTime.class);
    }

    private JsonNode readJson(String s) {
        try {
            return s == null ? null : mapper.readTree(s);
        } catch (Exception e) {
            return null;
        }
    }

    private String writeJson(JsonNode node) {
        try {
            return node == null ? "null" : mapper.writeValueAsString(node);
        } catch (Exception e) {
            return "null";
        }
    }
}
