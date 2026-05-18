package com.teamme.backend.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationWebSocketService {

    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<String, Set<WebSocketSession>> sessionsByUsername =
            new ConcurrentHashMap<>();

    public NotificationWebSocketService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(String username, WebSocketSession session) {
        sessionsByUsername
                .computeIfAbsent(username, ignored -> ConcurrentHashMap.newKeySet())
                .add(session);
    }

    public void unregister(WebSocketSession session) {
        for (Set<WebSocketSession> sessions : sessionsByUsername.values()) {
            sessions.remove(session);
        }
    }

    public void sendToUser(String username, NotificationEvent event) {
        Set<WebSocketSession> sessions = sessionsByUsername.get(username);

        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            return;
        }

        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                unregister(session);
                continue;
            }

            try {
                session.sendMessage(new TextMessage(payload));
            } catch (IOException e) {
                unregister(session);
            }
        }
    }
}