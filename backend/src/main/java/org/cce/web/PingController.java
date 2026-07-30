package org.cce.web;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PingController {

    private final JdbcTemplate jdbc;

    public PingController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        Integer schools = jdbc.queryForObject("SELECT count(*) FROM schools", Integer.class);
        String db = jdbc.queryForObject("SELECT current_database()", String.class);
        return Map.of(
            "status", "ok",
            "service", "cce-backend",
            "database", db,
            "schoolsCount", schools
        );
    }
}
