package com.grandport.erp.modules.assinatura.service;

public class TenantAccessBlockedException extends RuntimeException {
    public TenantAccessBlockedException(String message) {
        super(message);
    }
}
