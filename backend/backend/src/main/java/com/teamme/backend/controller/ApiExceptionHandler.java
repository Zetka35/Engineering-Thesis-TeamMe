package com.teamme.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {

    public record ErrorDto(String code, String message) {}

    @ExceptionHandler(NoSuchElementException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorDto handleNoSuchElement(NoSuchElementException ex) {
        if ("NO_SUCH_USER".equals(ex.getMessage())) {
            return new ErrorDto("NO_SUCH_USER", "Nie ma użytkownika o takiej nazwie.");
        }
        return new ErrorDto("NOT_FOUND", "Nie znaleziono zasobu.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorDto handleIllegalArgument(IllegalArgumentException ex) {
        // login
        if ("BAD_PASSWORD".equals(ex.getMessage())) {
            return new ErrorDto("BAD_PASSWORD", "Nieprawidłowe hasło.");
        }

        // register
        if ("Użytkownik o tej nazwie już istnieje".equals(ex.getMessage())) {
            return new ErrorDto("USERNAME_TAKEN", "Użytkownik o tej nazwie już istnieje.");
        }

        return new ErrorDto("BAD_REQUEST", ex.getMessage());
    }
}