package com.voice2send.controller;

import com.voice2send.dto.AuthDtos.PreferencesRequest;
import com.voice2send.dto.AuthDtos.PreferencesResponse;
import com.voice2send.dto.AuthDtos.UserDto;
import com.voice2send.entity.User;
import com.voice2send.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users", description = "User profile and accessibility preferences")
public class UserController {

    private final AuthService authService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile and preferences")
    public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getCurrentUser(user.getId()));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get current user's saved communication preferences (input & output methods)")
    public ResponseEntity<PreferencesResponse> getPreferences(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getPreferences(user.getId()));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update current user's communication preferences (input & output methods)")
    public ResponseEntity<PreferencesResponse> updatePreferences(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PreferencesRequest request) {
        return ResponseEntity.ok(authService.updatePreferences(user.getId(), request));
    }
}
