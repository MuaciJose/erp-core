package com.grandport.erp.config.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.grandport.erp.modules.admin.service.AuditoriaService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Tratamento global de exceções da API
 * Garante respostas padronizadas em todos os erros
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    // ==================== VALIDAÇÃO ====================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("Validação falhou")
                .details(errors)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        log.warn("❌ Erro de validação: {} | Path: {}", errors, request.getDescription(false));
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // ==================== ACESSO NEGADO ====================
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            WebRequest request) {
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error("ACCESS_DENIED")
                .message("Você não tem permissão para acessar este recurso")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        log.warn("🚫 Acesso negado: {} | Path: {}", ex.getMessage(), request.getDescription(false));
        try {
            if (auditoriaService != null) {
                auditoriaService.registrar("SEGURANÇA", "ACESSO_NEGADO", ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Erro ao registrar auditoria", e);
        }
        
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    // ==================== NÃO ENCONTRADO ====================
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request) {
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        log.info("ℹ️ Recurso não encontrado: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // ==================== ERRO GENÉRICO ====================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex,
            WebRequest request) {
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("Erro interno do servidor. ID do erro: " + System.nanoTime())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        log.error("🔥 ERRO NÃO TRATADO!", ex);
        try {
            if (auditoriaService != null) {
                auditoriaService.registrar("ERRO", "EXCEPTION", 
                    "Erro não tratado: " + ex.getClass().getName() + " - " + ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Erro ao registrar auditoria", e);
        }
        
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

