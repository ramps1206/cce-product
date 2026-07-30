package org.cce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.*;

/**
 * Server-side Excel export using Apache POI (replaces the client-side
 * xlsx.full.min.js). Reads the JSONB student payloads for a school and emits
 * a workbook with a stable, human-readable column order.
 */
@Service
public class ExportService {

    /** Preferred leading columns (Marathi keys as used by the app), rest appended alphabetically. */
    private static final List<String> LEAD = List.of("rollNo", "roll", "name", "cls", "div", "gender", "dob");

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public ExportService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public byte[] studentsXlsx(UUID schoolId, String classId) {
        String sql = "SELECT payload FROM students WHERE school_id = ? AND deleted = false"
                + (classId != null ? " AND payload->>'cls' = ?" : "")
                + " ORDER BY client_id";
        List<JsonNode> rows = classId != null
                ? jdbc.query(sql, (rs, i) -> parse(rs.getString(1)), schoolId, classId)
                : jdbc.query(sql, (rs, i) -> parse(rs.getString(1)), schoolId);

        // Build the column set: preferred leads first, then any remaining keys.
        LinkedHashSet<String> cols = new LinkedHashSet<>();
        Set<String> present = new TreeSet<>();
        for (JsonNode n : rows) {
            if (n != null) n.fieldNames().forEachRemaining(present::add);
        }
        for (String c : LEAD) if (present.contains(c)) cols.add(c);
        cols.addAll(present);

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("विद्यार्थी यादी");
            CellStyle header = wb.createCellStyle();
            Font hf = wb.createFont();
            hf.setBold(true);
            header.setFont(hf);

            Row head = sheet.createRow(0);
            int c = 0;
            for (String col : cols) {
                Cell cell = head.createCell(c++);
                cell.setCellValue(col);
                cell.setCellStyle(header);
            }
            int r = 1;
            for (JsonNode n : rows) {
                Row row = sheet.createRow(r++);
                c = 0;
                for (String col : cols) {
                    JsonNode v = n == null ? null : n.get(col);
                    row.createCell(c++).setCellValue(v == null || v.isNull() ? "" : v.asText());
                }
            }
            for (int i = 0; i < cols.size(); i++) sheet.autoSizeColumn(i);
            wb.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("export failed", e);
        }
    }

    private JsonNode parse(String s) {
        try {
            return s == null ? null : mapper.readTree(s);
        } catch (Exception e) {
            return null;
        }
    }
}
