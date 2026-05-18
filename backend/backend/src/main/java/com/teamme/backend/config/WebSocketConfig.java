package com.teamme.backend.config;

import com.teamme.backend.notification.NotificationWebSocketService;
import com.teamme.backend.notification.WebSocketAuthInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.Arrays;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    private final String[] allowedOrigins;

    public WebSocketConfig(
            NotificationWebSocketHandler notificationWebSocketHandler,
            WebSocketAuthInterceptor webSocketAuthInterceptor,
            @Value("${cors.allowedOrigins:http://localhost:5173,http://localhost:3000}") String allowedOriginsCsv
    ) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
        this.allowedOrigins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toArray(String[]::new);
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .addInterceptors(webSocketAuthInterceptor)
                .setAllowedOrigins(allowedOrigins);
    }
}