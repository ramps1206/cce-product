package org.cce.web;

import org.cce.security.CcePrincipal;
import org.cce.service.SyncService;
import org.cce.web.dto.SyncDtos.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService sync;

    public SyncController(SyncService sync) {
        this.sync = sync;
    }

    /** Pull all changes (incl. tombstones) since the given cursor; omit for full snapshot. */
    @GetMapping("/pull")
    public PullResult pull(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime since) {
        return sync.pull(schoolId(), since);
    }

    /** Push local changes; server applies last-write-wins and reports rejections. */
    @PostMapping("/push")
    public PushResult push(@RequestBody PushRequest req) {
        return sync.push(schoolId(), req.items());
    }

    private UUID schoolId() {
        CcePrincipal me = CcePrincipal.current();
        if (me == null || me.schoolId() == null || me.schoolId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no school context");
        }
        return UUID.fromString(me.schoolId());
    }
}
