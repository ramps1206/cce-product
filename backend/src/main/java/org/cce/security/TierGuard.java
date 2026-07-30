package org.cce.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Server-side tier enforcement (replaces the client-side CCE_FEATURE_TIERS
 * gating, which was bypassable). Trial gets full access so schools can try
 * every feature during the trial window.
 */
@Component
public class TierGuard {

    private static final Map<String, Integer> RANK = Map.of(
            "standard", 1,
            "pro", 2,
            "premium", 3,
            "trial", 99);   // trial = full access

    public void require(String required) {
        CcePrincipal me = CcePrincipal.current();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        int have = RANK.getOrDefault(me.tier() == null ? "" : me.tier(), 0);
        int need = RANK.getOrDefault(required, Integer.MAX_VALUE);
        if (have < need) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "feature requires '" + required + "' tier (current: " + me.tier() + ")");
        }
    }
}
