package org.cce.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Single-page-app fallback. In production the built React app is served from
 * classpath:/static/. Client-side routes (/students, /grades, …) have no
 * server mapping, so we forward any top-level, extension-less path to the SPA
 * entry point. The forward target is a fixed literal ("/index.html") — no
 * request data is used to build a file path, so there is no traversal risk.
 * Paths containing a dot (static assets like .js/.css) and /api/** routes are
 * matched by more specific handlers and are not affected.
 */
@Controller
public class SpaController {

    @GetMapping(value = {"/", "/{path:[^\\.]*}"})
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
