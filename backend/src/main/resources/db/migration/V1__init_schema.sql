-- Voice2Sense PostgreSQL Database Schema Migration V1
-- Normalized schema for users, accessibility profiles, conversations, translations, gestures, and audit logs

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    communication_preference VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text' | 'voice' | 'sign'
    output_preference VARCHAR(20) NOT NULL DEFAULT 'text',        -- 'text' | 'voice' | 'sign'
    input_method VARCHAR(20) NOT NULL DEFAULT 'text',             -- 'text' | 'voice' | 'sign'
    output_method VARCHAR(20) NOT NULL DEFAULT 'text',            -- 'text' | 'voice' | 'sign'
    profile_picture_url TEXT,
    voice_pitch NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    voice_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    font_size VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'normal' | 'large' | 'extra-large'
    haptic_feedback BOOLEAN NOT NULL DEFAULT TRUE,
    screen_reader_announce BOOLEAN NOT NULL DEFAULT TRUE,
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    script VARCHAR(50) NOT NULL,
    is_supported BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed initial languages
INSERT INTO languages (code, name, native_name, script, is_supported) VALUES
('en', 'English', 'English', 'Latin', true),
('ta', 'Tamil', 'தமிழ்', 'Tamil', true),
('te', 'Telugu', 'తెలుగు', 'Telugu', true),
('hi', 'Hindi', 'हिन्दी', 'Devanagari', true)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    person_a_name VARCHAR(100) NOT NULL DEFAULT 'Person A',
    person_a_input_method VARCHAR(20) NOT NULL DEFAULT 'voice',
    person_a_language VARCHAR(10) NOT NULL REFERENCES languages(code),
    person_b_name VARCHAR(100) NOT NULL DEFAULT 'Person B',
    person_b_output_method VARCHAR(20) NOT NULL DEFAULT 'text',
    person_b_language VARCHAR(10) NOT NULL REFERENCES languages(code),
    smart_mode BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    original_input TEXT NOT NULL,
    input_type VARCHAR(20) NOT NULL, -- 'voice' | 'text' | 'gesture'
    original_language VARCHAR(10) NOT NULL REFERENCES languages(code),
    target_language VARCHAR(10) NOT NULL REFERENCES languages(code),
    translated_content TEXT NOT NULL,
    output_format VARCHAR(20) NOT NULL, -- 'text' | 'voice' | 'gesture'
    confidence NUMERIC(4, 3) DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS translations (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) REFERENCES messages(id) ON DELETE CASCADE,
    source_language VARCHAR(10) NOT NULL REFERENCES languages(code),
    target_language VARCHAR(10) NOT NULL REFERENCES languages(code),
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    translation_provider VARCHAR(50) NOT NULL DEFAULT 'GEMINI_AI',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gesture_records (
    id VARCHAR(36) PRIMARY KEY,
    sign_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    hand_shape VARCHAR(100) NOT NULL,
    movement_description TEXT NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(36),
    ip_address VARCHAR(50),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
