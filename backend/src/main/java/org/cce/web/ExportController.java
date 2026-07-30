package org.cce.web;

import org.cce.security.CcePrincipal;
import org.cce.security.TierGuard;
import org.cce.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private static final String XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final ExportService export;
    private final TierGuard tier;

    public ExportController(ExportService export, TierGuard tier) {
        this.export = export;
        this.tier = tier;
    }

    /** Class/school student list — 'standard' tier. */
    @GetMapping("/students.xlsx")
    public ResponseEntity<byte[]> students(@RequestParam(required = false) String classId) {
        tier.require("standard");
        byte[] body = export.studentsXlsx(schoolId(), classId);
        String name = classId != null ? "students-" + classId + ".xlsx" : "students-all.xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                .contentType(MediaType.parseMediaType(XLSX))
                .body(body);
    }

    private UUID schoolId() {
        CcePrincipal me = CcePrincipal.current();
        if (me == null || me.schoolId() == null || me.schoolId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no school context");
        }
        return UUID.fromString(me.schoolId());
    }
}
