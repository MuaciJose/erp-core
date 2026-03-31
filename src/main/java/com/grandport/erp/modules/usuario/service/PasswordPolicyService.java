package com.grandport.erp.modules.usuario.service;

import org.springframework.stereotype.Service;

@Service
public class PasswordPolicyService {

    public void validateOrThrow(String senha) {
        if (senha == null || senha.isBlank()) {
            throw new IllegalArgumentException("Senha obrigatória.");
        }
        if (senha.length() < 10) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 10 caracteres.");
        }
        if (!senha.chars().anyMatch(Character::isUpperCase)) {
            throw new IllegalArgumentException("A senha deve conter pelo menos uma letra maiúscula.");
        }
        if (!senha.chars().anyMatch(Character::isLowerCase)) {
            throw new IllegalArgumentException("A senha deve conter pelo menos uma letra minúscula.");
        }
        if (!senha.chars().anyMatch(Character::isDigit)) {
            throw new IllegalArgumentException("A senha deve conter pelo menos um número.");
        }
        boolean hasSpecial = senha.chars().anyMatch(ch ->
                "!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`".indexOf(ch) >= 0
        );
        if (!hasSpecial) {
            throw new IllegalArgumentException("A senha deve conter pelo menos um caractere especial.");
        }
    }
}
