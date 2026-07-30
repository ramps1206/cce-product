package org.cce.security;

/** Authenticated caller context carried in the SecurityContext. */
public record CcePrincipal(String userId, String email, String schoolId, String role, String tier) {

    public static CcePrincipal current() {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CcePrincipal p) {
            return p;
        }
        return null;
    }
}
