package com.teamme.backend.notification;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final NotificationWebSocketService notificationWebSocketService;

    public NotificationWebSocketHandler(NotificationWebSocketService notificationWebSocketService) {
        this.notificationWebSocketService = notificationWebSocketService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String username = (String) session.getAttributes().get("username");

        if (username == null || username.isBlank()) {
            try {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing username"));
            } catch (Exception ignored) {
            }
            return;
        }

        notificationWebSocketService.register(username, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        notificationWebSocketService.unregister(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        notificationWebSocketService.unregister(session);
    }
}