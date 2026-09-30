package com.voice2send.service;

import com.voice2send.dto.AuthDtos.*;
import com.voice2send.entity.RefreshToken;
import com.voice2send.entity.User;
import com.voice2send.entity.UserProfile;
import com.voice2send.exception.ResourceNotFoundException;
import com.voice2send.exception.UnauthorizedException;
import com.voice2send.repository.RefreshTokenRepository;
import com.voice2send.repository.UserProfileRepository;
import com.voice2send.repository.UserRepository;
import com.voice2send.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("An account with this email address already exists");
        }

        if (req.getConfirmPassword() != null && !req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .fullName(req.getFullName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .active(true)
                .build();

        UserProfile profile = UserProfile.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .preferredLanguage(req.getPreferredLanguage() != null ? req.getPreferredLanguage() : "en")
                .communicationPreference("text")
                .outputPreference("text")
                .inputMethod("text")
                .outputMethod("text")
                .build();

        user.setProfile(profile);
        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = UUID.randomUUID().toString();

        refreshTokenRepository.save(RefreshToken.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .token(refreshToken)
                .expiresAt(Instant.now().plusSeconds(7 * 86400))
                .build());

        return AuthResponse.builder()
                .message("User registered successfully")
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToUserDto(user, profile))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password credentials");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = UUID.randomUUID().toString();

        refreshTokenRepository.save(RefreshToken.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .token(refreshToken)
                .expiresAt(Instant.now().plusSeconds(7 * 86400))
                .build());

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);

        return AuthResponse.builder()
                .message("Login successful")
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToUserDto(user, profile))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        return mapToUserDto(user, profile);
    }

    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences(String userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));

        String in = profile.getInputMethod() != null ? profile.getInputMethod() : profile.getCommunicationPreference();
        String out = profile.getOutputMethod() != null ? profile.getOutputMethod() : profile.getOutputPreference();
        if ("gesture".equalsIgnoreCase(in)) in = "sign";
        if ("gesture".equalsIgnoreCase(out)) out = "sign";

        return PreferencesResponse.builder()
                .inputMethod(in != null ? in : "text")
                .outputMethod(out != null ? out : "text")
                .message("Preferences retrieved successfully")
                .build();
    }

    @Transactional
    public PreferencesResponse updatePreferences(String userId, PreferencesRequest req) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));

        String in = req.getInputMethod() != null ? req.getInputMethod().toLowerCase().trim() : "text";
        String out = req.getOutputMethod() != null ? req.getOutputMethod().toLowerCase().trim() : "text";

        if ("gesture".equals(in)) in = "sign";
        if ("gesture".equals(out)) out = "sign";

        List<String> valid = List.of("text", "voice", "sign");
        if (!valid.contains(in)) {
            throw new IllegalArgumentException("Invalid inputMethod. Only 'text', 'voice', and 'sign' are accepted.");
        }
        if (!valid.contains(out)) {
            throw new IllegalArgumentException("Invalid outputMethod. Only 'text', 'voice', and 'sign' are accepted.");
        }

        profile.setInputMethod(in);
        profile.setOutputMethod(out);
        profile.setCommunicationPreference(in);
        profile.setOutputPreference(out);
        userProfileRepository.save(profile);

        return PreferencesResponse.builder()
                .inputMethod(in)
                .outputMethod(out)
                .message("Communication preferences updated successfully")
                .build();
    }

    public static UserDto mapToUserDto(User user, UserProfile profile) {
        String in = profile != null ? (profile.getInputMethod() != null ? profile.getInputMethod() : profile.getCommunicationPreference()) : "text";
        String out = profile != null ? (profile.getOutputMethod() != null ? profile.getOutputMethod() : profile.getOutputPreference()) : "text";
        if ("gesture".equalsIgnoreCase(in)) in = "sign";
        if ("gesture".equalsIgnoreCase(out)) out = "sign";

        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .preferredLanguage(profile != null ? profile.getPreferredLanguage() : "en")
                .communicationPreference(in)
                .outputPreference(out)
                .inputMethod(in)
                .outputMethod(out)
                .profilePicture(profile != null ? profile.getProfilePictureUrl() : null)
                .voicePitch(profile != null ? profile.getVoicePitch() : null)
                .voiceSpeed(profile != null ? profile.getVoiceSpeed() : null)
                .highContrast(profile != null && profile.isHighContrast())
                .fontSize(profile != null ? profile.getFontSize() : "normal")
                .hapticFeedback(profile == null || profile.isHapticFeedback())
                .screenReaderAnnounce(profile == null || profile.isScreenReaderAnnounce())
                .darkMode(profile != null && profile.isDarkMode())
                .build();
    }
}
