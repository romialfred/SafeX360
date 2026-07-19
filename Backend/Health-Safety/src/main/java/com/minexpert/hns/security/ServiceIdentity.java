package com.minexpert.hns.security;

import java.util.Set;

public record ServiceIdentity(String issuer, String audience, Set<String> scopes, String tokenId) {
    public static final String REQUEST_ATTRIBUTE = ServiceIdentity.class.getName();
    public boolean hasScope(String scope) { return scopes.contains(scope); }
}
