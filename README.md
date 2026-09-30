# Voice2Sense — Multimodal Accessibility Communication Platform

[![Java](https://img.shields.io/badge/Java-17%20%7C%2021-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Android](https://img.shields.io/badge/Android-Java%20SDK%2034-3DDC84?logo=android&logoColor=white)](https://developer.android.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. Project Overview & Problem Statement

Millions of individuals worldwide experience communication challenges due to hearing loss, speech difficulties, vocal impairment, or linguistic differences. Traditional translation and messaging applications make an implicit, restrictive assumption: that both participants communicate through the same modality (either both speaking or both reading/typing) and share compatible sensory abilities.

**Voice2Sense** eliminates this barrier with a flexible, multimodal architecture:

$$\text{ANY INPUT} \longrightarrow \text{AI / PROCESSING} \longrightarrow \text{LANGUAGE CONVERSION} \longrightarrow \text{ANY OUTPUT}$$

### Core Capabilities:
- **Input Modalities:** Voice (Microphone), Text (Keyboard), Sign Language Gestures (Camera)
- **Output Modalities:** Text (Native Scripts), Voice (Text-to-Speech), Sign Representation (Animated Hand Gestures)
- **Supported Languages:** English, Tamil (தமிழ்), Telugu (తెలుగు), Hindi (हिन्दी)
- **Smart Mode:** Remembers individual preferences and automatically routes bidirectional translation without reconfiguring settings.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              Voice2Sense CLIENTS                                  |
|   +------------------------------------+   +----------------------------------+   |
|   |       Android Java Mobile App      |   |       Mobile Web SPA Preview     |   |
|   | (CameraX, SpeechRecognizer, TTS)   |   | (Web Speech, Web MediaDevices)   |   |
|   +-----------------+------------------+   +-----------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      | HTTPS / REST APIs                      |
                      v                                        v
+-----------------------------------------------------------------------------------+
|                           Voice2Sense BACKEND ENGINE                              |
|                                                                                   |
|   [ Spring Security Filter Chain ] <---> [ JWT Token & Rate Limiter ]            |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                             REST Controllers                              |   |
|   |  /api/auth  |  /api/conversations  |  /api/translate  |  /api/gesture     |   |
|   +---------------------------------------------------------------------------+   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                             Service Layer                                 |   |
|   |  • AuthService          • ConversationService     • TranslationService    |   |
|   |  • GestureService       • SignRepresentation      • AuditService          |   |
|   +---------------------------------------------------------------------------+   |
|                                                                                   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|   |  Google Gemini 3.8    |   |  MediaPipe / CameraX  |   | Lexical Offline   |   |
|   |  Multimodal Provider  |   |  Gesture Recognizer   |   | Phrase Matrix     |   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                     Spring Data JPA & Hibernate ORM                       |   |
|   +---------------------------------------------------------------------------+   |
+--------------------------------------|--------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                         PostgreSQL Relational Database                             |
|  • users         • user_profiles     • refresh_tokens   • languages               |
|  • conversations • messages          • translations     • gesture_records         |
|  • audit_logs    • indexes & constraints (Flyway Migration V1)                   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

### Mobile Application
- **Language:** Java (Android SDK 34)
- **Architecture:** MVVM (Model-View-ViewModel)
- **UI:** Material Design 3, XML Layouts
- **Hardware Integration:** CameraX, Android `SpeechRecognizer`, Android `TextToSpeech`
- **Networking:** Retrofit 2, OkHttp 3, Gson

### Backend
- **Language:** Java 17 / 21
- **Framework:** Spring Boot 3.2.3 (Spring Web, Spring Security, Spring Data JPA)
- **Authentication:** Stateless JWT (HMAC-SHA256), Refresh Tokens, BCrypt password hashing
- **Database:** PostgreSQL 16 with Flyway Database Migrations
- **Resilience & Rate Limiting:** Bucket4j Token Bucket Algorithm, HikariCP Connection Pool
- **Documentation:** SpringDoc OpenAPI 3 / Swagger UI (`/swagger-ui.html`)
- **Monitoring:** Spring Boot Actuator (`/actuator/health`, `/actuator/metrics`)

### Mobile Web SPA
- **Runtime:** Node.js, Express (`server.ts`), Vite, TypeScript, React 19, Tailwind CSS
- **Design System:** Material 3 Mobile Shell with Google Pixel device frame preview

---

## 4. Database Schema (Normalized Relational Design)

The database schema is managed via Flyway migration script `V1__init_schema.sql`:

1. `users`: Stores user identity, authentication credentials, and timestamps.
2. `user_profiles`: Stores communication preferences (voice, text, gesture), output preference, voice speed, pitch, and accessibility settings (high-contrast, font size, haptic feedback).
3. `refresh_tokens`: Stores rotating refresh tokens with expirations.
4. `languages`: Stores supported ISO language codes (`en`, `ta`, `te`, `hi`), native scripts, and display names.
5. `conversations`: Manages two-way communication sessions between Person A and Person B.
6. `messages`: Stores original input, input method, source language, target language, translated content, and output format.
7. `translations`: Audit trail of translation operations, original texts, and providers.
8. `gesture_records`: Recognized gesture tokens, hand shapes, and confidence scores.
9. `audit_logs`: Security and access logs.

---

## 5. REST API Documentation

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user with accessibility profile | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT access + refresh token | No |
| `POST` | `/api/auth/refresh` | Rotate expired JWT access token | No |
| `POST` | `/api/auth/logout` | Revoke refresh token and invalidate session | Yes |
| `GET` | `/api/users/me` | Fetch authenticated user profile & accessibility config | Yes |
| `PUT` | `/api/users/me` | Update name, preferences, voice pitch, or high-contrast | Yes |
| `DELETE` | `/api/users/me` | Permanently erase user account and history (Section 27) | Yes |
| `GET` | `/api/languages` | List supported languages (English, Tamil, Telugu, Hindi) | No |
| `GET` | `/api/sign-vocabulary` | List 16+ supported accessibility gesture signs | No |
| `GET` | `/api/conversations` | List current user's conversations with pagination | Yes |
| `POST` | `/api/conversations` | Create new two-way multimodal conversation | Yes |
| `GET` | `/api/conversations/{id}` | Get conversation detail and message history | Yes |
| `DELETE` | `/api/conversations/{id}`| Delete conversation | Yes |
| `POST` | `/api/conversations/{id}/messages` | Send multimodal message with translation | Yes |
| `POST` | `/api/translate` | Direct translation endpoint between any 2 languages | No |
| `POST` | `/api/gesture/recognize` | Process camera frame / gesture ID and return sign token | No |
| `GET` | `/api/health` | Health check endpoint (Status UP, DB, AI engine) | No |

---

## 6. Supported Sign Vocabulary Library

Voice2Sense defines a standardized, medically and socially grounded accessibility sign vocabulary:

1. **Hospital:** Cross motion on upper arm (`மருத்துவமனை`, `ఆసుపత్రి`, `अस्पताल`)
2. **Help:** Thumbs-up resting on flat palm lifted upward (`உதவி`, `సహాయం`, `मदद`)
3. **Doctor:** Two fingers tapping pulse on inside wrist (`மருத்துவர்`, `వైద్యుడు`, `डॉक्टर`)
4. **Water:** W-hand shape tapping index finger to chin (`தண்ணீர்`, `నీరు`, `पानी`)
5. **Food:** Fingertips touching mouth repeatedly (`உணவு`, `ఆహారం`, `भोजन`)
6. **Emergency:** Shaking E-fist side to side rapidly (`அவசரம்`, `అత్యవసరం`, `आपातकाल`)
7. **Pain:** Pointing index fingers twisting inward (`வலி`, `నొప్పి`, `दर्द`)
8. **Medicine:** Bent middle finger grinding in opposite palm (`மருந்து`, `మందు`, `दवा`)
9. **Hello:** Open palm waving outward from temple (`வணக்கம்`, `నమస్కారం`, `नमस्ते`)
10. **Thank You:** Flat fingertips moving forward from chin (`நன்றி`, `ధన్యవాదాలు`, `धन्यवाद`)
11. **Yes:** Closed fist nodding up and down (`ஆம்`, `అవును`, `हाँ`)
12. **No:** Snapping index and middle fingers onto thumb (`இல்லை`, `కాదు`, `नहीं`)
13. **Please:** Flat hand rubbing center of chest clockwise (`தயவுசெய்து`, `దయచేసి`, `कृपया`)
14. **Stop:** Blade of right hand chopping onto flat palm (`நில்லுங்கள்`, `ఆగండి`, `रुकिए`)
15. **Restroom:** T-hand shape shaken gently at shoulder level (`கழிப்பறை`, `మరుగుదொడ్డి`, `शौचालय`)
16. **Goodbye:** Open hand folding fingers up and down (`சென்று வருகிறேன்`, `వెళ్లి వస్తాను`, `अलविदा`)

---

## 7. Setup & Running Locally

### Prerequisites
- Java 17 or Java 21
- Maven 3.9+
- Docker & Docker Compose
- Node.js 20+

### Option A: Running with Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-username/voice2sense.git
cd voice2sense

# Start PostgreSQL, Redis, and Spring Boot Backend
docker-compose up --build -d

# Verify services
docker-compose ps
```

### Option B: Running the Spring Boot Java Backend
```bash
cd backend
mvn clean package
java -jar target/voice2send-backend-1.0.0.jar
```
Access Swagger UI at: `http://localhost:8080/swagger-ui.html`

### Option C: Running the Full-Stack Preview App
```bash
# In project root
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 8. Environment Variables

Configure `.env` using `.env.example`:

```env
# AI & Translation Keys
GEMINI_API_KEY="your_gemini_api_key_here"
TRANSLATION_API_KEY=""

# Security Keys
JWT_SECRET="voice2sense_production_jwt_secret_key_change_me_in_prod_min_32_chars"
JWT_REFRESH_SECRET="voice2sense_production_refresh_jwt_secret_key_change_me_in_prod"

# Database Configuration (PostgreSQL)
DATABASE_URL="jdbc:postgresql://localhost:5432/voice2sense_db"
DATABASE_USERNAME="postgres"
DATABASE_PASSWORD="postgrespassword"

# Server Port
PORT=3000
```

---

## 9. Testing

```bash
# Run Spring Boot backend tests
cd backend
mvn test

# Run Web client linting and compilation
cd ..
npm run lint
npm run build
```

---

## 10. Accessibility Standards (WCAG 2.1 AAA)
- **High Contrast Theme:** Pitch-black background with vibrant #FACC15 yellow accents.
- **Dynamic Text Scaling:** Normal (14px), Large (18px), Extra Large (22px).
- **Haptic Tactile Feedback:** Vibration confirmation on gesture capture and message reception.
- **Auditory Cues:** Audio tones and screen-reader compliant aria-labels on every action.
- **Color Independence:** Icons and text labels accompany all color-coded indicators.

---

## 11. License
Licensed under the Apache License, Version 2.0.
