package com.voice2send.controller;

import com.voice2send.dto.ConversationDtos.*;
import com.voice2send.entity.User;
import com.voice2send.service.ConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Conversations", description = "Conversation sessions and multimodal message streams")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    @Operation(summary = "Get list of conversations for current authenticated user")
    public ResponseEntity<List<ConversationResponse>> getConversations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(conversationService.getUserConversations(user.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a new conversation with participant configurations")
    public ResponseEntity<ConversationResponse> createConversation(
            @AuthenticationPrincipal User user,
            @RequestBody CreateConversationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conversationService.createConversation(user.getId(), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get conversation by ID")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(conversationService.getConversation(id, user.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete conversation and all messages")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        conversationService.deleteConversation(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send multimodal message with real-time translation and sign token extraction")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable String id,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conversationService.sendMessage(id, user.getId(), request));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get all messages for conversation")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(conversationService.getMessages(id, user.getId()));
    }
}
