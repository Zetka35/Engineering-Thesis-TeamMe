package com.teamme.backend.notification;

public record NotificationEvent(
        String type,
        String title,
        String message,
        Long teamId,
        String teamName,
        Long requestId,
        String requestType,
        String status
) {}