package com.voice2send;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voice2send.dto.AuthDtos.LoginRequest;
import com.voice2send.dto.AuthDtos.RegisterRequest;
import com.voice2send.entity.User;
import com.voice2send.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUp() {
        userRepository.findByEmailIgnoreCase("testuser@voice2sense.org").ifPresent(userRepository::delete);
    }

    @Test
    @DisplayName("Should successfully register a new user and return JWT token")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Accessibility Test User")
                .email("testuser@voice2sense.org")
                .password("Password@123")
                .confirmPassword("Password@123")
                .preferredLanguage("ta")
                .communicationPreference("gesture")
                .outputPreference("voice")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("testuser@voice2sense.org"))
                .andExpect(jsonPath("$.user.preferredLanguage").value("ta"));
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void testInvalidPasswordLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("testuser@voice2sense.org")
                .password("WrongPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
