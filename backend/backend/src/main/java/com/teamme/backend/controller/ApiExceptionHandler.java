package com.teamme.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {

    public record ValidationErrorDto(
            String field,
            String message,
            Object rejectedValue
    ) {}

    public record ErrorDto(
            String code,
            String message,
            int status,
            String error,
            String path,
            String timestamp,
            List<ValidationErrorDto> fieldErrors,
            Map<String, Object> details
    ) {}

    @ExceptionHandler(NoSuchElementException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleNoSuchElement(
            NoSuchElementException ex,
            HttpServletRequest request
    ) {
        String raw = ex.getMessage();

        if ("NO_SUCH_USER".equals(raw) || "User not found".equals(raw)) {
            return build(
                    HttpStatus.NOT_FOUND,
                    "NO_SUCH_USER",
                    "Nie ma użytkownika o takiej nazwie.",
                    request,
                    null,
                    Map.of("exception", ex.getClass().getSimpleName())
            );
        }

        return build(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                raw != null && !raw.isBlank() ? raw : "Nie znaleziono zasobu.",
                request,
                null,
                Map.of("exception", ex.getClass().getSimpleName())
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        String raw = ex.getMessage() == null ? "" : ex.getMessage().trim();

        if ("BAD_PASSWORD".equals(raw)) {
            return build(
                    HttpStatus.BAD_REQUEST,
                    "BAD_PASSWORD",
                    "Nieprawidłowe hasło.",
                    request,
                    null,
                    Map.of("exception", ex.getClass().getSimpleName())
            );
        }

        if ("Użytkownik o tej nazwie już istnieje".equals(raw)) {
            return build(
                    HttpStatus.BAD_REQUEST,
                    "USERNAME_TAKEN",
                    "Użytkownik o tej nazwie już istnieje.",
                    request,
                    List.of(new ValidationErrorDto("username", "Ta nazwa użytkownika jest już zajęta.", null)),
                    Map.of("exception", ex.getClass().getSimpleName())
            );
        }

        return build(
                HttpStatus.BAD_REQUEST,
                classifyBusinessCode(raw),
                !raw.isBlank() ? raw : "Nieprawidłowe dane wejściowe.",
                request,
                extractFieldErrorsFromMessage(raw),
                Map.of("exception", ex.getClass().getSimpleName())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<ValidationErrorDto> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toValidationError)
                .toList();

        String message = fieldErrors.isEmpty()
                ? "Formularz zawiera nieprawidłowe dane."
                : "Popraw zaznaczone pola i spróbuj ponownie.";

        return build(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                message,
                request,
                fieldErrors,
                Map.of(
                        "exception", ex.getClass().getSimpleName(),
                        "objectName", ex.getBindingResult().getObjectName()
                )
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        List<ValidationErrorDto> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(v -> new ValidationErrorDto(
                        v.getPropertyPath() == null ? null : v.getPropertyPath().toString(),
                        v.getMessage(),
                        v.getInvalidValue()
                ))
                .toList();

        return build(
                HttpStatus.BAD_REQUEST,
                "CONSTRAINT_VIOLATION",
                "Niektóre dane wejściowe naruszają ograniczenia walidacyjne.",
                request,
                fieldErrors,
                Map.of("exception", ex.getClass().getSimpleName())
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        String rootMessage = rootMessage(ex);

        return build(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_REQUEST",
                "Nie udało się odczytać danych żądania. Sprawdź format JSON oraz typy pól.",
                request,
                null,
                Map.of(
                        "exception", ex.getClass().getSimpleName(),
                        "rootCause", rootMessage
                )
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.CONFLICT,
                "DATA_INTEGRITY_VIOLATION",
                "Operacja nie mogła zostać wykonana, ponieważ narusza ograniczenia danych w bazie.",
                request,
                null,
                Map.of(
                        "exception", ex.getClass().getSimpleName(),
                        "rootCause", rootMessage(ex)
                )
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "Nie masz uprawnień do wykonania tej operacji.",
                request,
                null,
                Map.of("exception", ex.getClass().getSimpleName())
        );
    }

    @ExceptionHandler(Exception.class)
    public org.springframework.http.ResponseEntity<ErrorDto> handleGeneric(
            Exception ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "Wystąpił nieoczekiwany błąd serwera.",
                request,
                null,
                Map.of(
                        "exception", ex.getClass().getSimpleName(),
                        "rootCause", rootMessage(ex)
                )
        );
    }

    private ValidationErrorDto toValidationError(FieldError fieldError) {
        return new ValidationErrorDto(
                fieldError.getField(),
                fieldError.getDefaultMessage(),
                fieldError.getRejectedValue()
        );
    }

    private org.springframework.http.ResponseEntity<ErrorDto> build(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            List<ValidationErrorDto> fieldErrors,
            Map<String, Object> details
    ) {
        ErrorDto body = new ErrorDto(
                code,
                message,
                status.value(),
                status.getReasonPhrase(),
                request.getRequestURI(),
                OffsetDateTime.now().toString(),
                fieldErrors == null ? List.of() : fieldErrors,
                details == null ? Map.of() : details
        );

        return org.springframework.http.ResponseEntity.status(status).body(body);
    }

    private String classifyBusinessCode(String message) {
        if (message == null || message.isBlank()) {
            return "BAD_REQUEST";
        }

        String lower = message.toLowerCase();

        if (lower.contains("nazwa użytkownika")) return "INVALID_USERNAME";
        if (lower.contains("hasło")) return "INVALID_PASSWORD";
        if (lower.contains("data")) return "INVALID_DATE";
        if (lower.contains("umiejętności")) return "INVALID_SKILLS";
        if (lower.contains("języka")) return "INVALID_LANGUAGE";
        if (lower.contains("edukacji")) return "INVALID_EDUCATION";
        if (lower.contains("doświadczenia")) return "INVALID_EXPERIENCE";
        if (lower.contains("zespołu")) return "INVALID_TEAM_DATA";

        return "BAD_REQUEST";
    }

    private List<ValidationErrorDto> extractFieldErrorsFromMessage(String message) {
        if (message == null || message.isBlank()) {
            return List.of();
        }

        String lower = message.toLowerCase();
        String field = null;

        if (lower.contains("imi")) field = "firstName";
        else if (lower.contains("nazwisk")) field = "lastName";
        else if (lower.contains("bio") || lower.contains("opis")) field = "bio";
        else if (lower.contains("headline")) field = "headline";
        else if (lower.contains("lokal")) field = "location";
        else if (lower.contains("github")) field = "githubUrl";
        else if (lower.contains("linkedin")) field = "linkedinUrl";
        else if (lower.contains("portfolio")) field = "portfolioUrl";
        else if (lower.contains("doświadczenia") || lower.contains("firmy") || lower.contains("stanowisko")) field = "experiences";
        else if (lower.contains("edukacji") || lower.contains("szkoły") || lower.contains("uczelni")) field = "educations";
        else if (lower.contains("umiejętności")) field = "skills";
        else if (lower.contains("języka")) field = "languages";
        else if (lower.contains("nazwa zespołu")) field = "name";
        else if (lower.contains("spotkania")) field = "meeting";
        else if (lower.contains("zadania")) field = "task";

        if (field == null) {
            return List.of();
        }

        return List.of(new ValidationErrorDto(field, message, null));
    }

    private String rootMessage(Throwable ex) {
        Throwable current = ex;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage();
    }
}