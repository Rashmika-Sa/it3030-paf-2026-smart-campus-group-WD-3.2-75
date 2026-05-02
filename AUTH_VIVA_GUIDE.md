# Authentication & Notification System – Viva Reference Guide
**IT3030 PAF 2026 | Smart Campus Operations Hub**

---

## 1. What the Authentication System Does (One Paragraph Answer)

The authentication system lets SLIIT students and staff register or log in using only their **`@my.sliit.lk`** email address. Registration and student login both use a **One-Time Password (OTP)** sent by email for verification, so no password is stored until the OTP is confirmed. Admin and Technician accounts skip the OTP and get a session token immediately. A custom **Bearer-token** scheme (not JWT) is used – a UUID token is issued on success and stored in memory on the server. Every subsequent API call must include this token in the `Authorization` header. There is also a **Google OAuth 2.0** login path that validates a Google-issued access token, checks that the email is a valid SLIIT address, and creates or retrieves the user account automatically.

---

## 2. Authentication Flow Diagrams

### 2a – Student / User Registration Flow

```
Frontend                        Backend (AuthService)               Email Server
   │                                    │                                │
   │  POST /api/auth/register/          │                                │
   │       request-otp                  │                                │
   │  { fullName, sliitId,              │                                │
   │    email, password }               │                                │
   │──────────────────────────────────> │                                │
   │                                    │ 1. Validate SLIIT email        │
   │                                    │ 2. Check email not taken       │
   │                                    │ 3. Check sliitId not taken     │
   │                                    │ 4. Store PendingRegistration   │
   │                                    │    (in memory, not DB yet)     │
   │                                    │ 5. Generate 6-digit OTP        │
   │                                    │ 6. Store OtpRecord (in memory) │
   │                                    │──────────────────────────────> │
   │                                    │   sendOtpEmail(email, otp)     │
   │  { message: "OTP sent" }           │ <──────────────────────────────│
   │ <──────────────────────────────────│                                │
   │                                    │                                │
   │  POST /api/auth/verify-otp         │                                │
   │  { email, otp }                    │                                │
   │──────────────────────────────────> │                                │
   │                                    │ 7. Look up OtpRecord           │
   │                                    │ 8. Check OTP not expired       │
   │                                    │ 9. Check OTP matches           │
   │                                    │ 10. Retrieve PendingRegistration│
   │                                    │ 11. Create User in MongoDB     │
   │                                    │ 12. Create UUID token          │
   │  { token: "uuid..." }              │                                │
   │ <──────────────────────────────────│                                │
```

### 2b – Student / User Login Flow

```
Frontend                        Backend (AuthService)               Email Server
   │                                    │                                │
   │  POST /api/auth/login/             │                                │
   │       request-otp                  │                                │
   │  { email, password }               │                                │
   │──────────────────────────────────> │                                │
   │                                    │ 1. Validate SLIIT email format │
   │                                    │ 2. Find user in MongoDB        │
   │                                    │ 3. Check password (BCrypt)     │
   │                                    │ 4. If ADMIN/TECHNICIAN:        │
   │                                    │    → issue token immediately   │
   │                                    │ 5. If USER:                    │
   │                                    │    → generate OTP              │
   │                                    │──────────────────────────────> │
   │  { message: "OTP sent" }           │   sendOtpEmail(email, otp)     │
   │ <──────────────────────────────────│                                │
   │                                    │                                │
   │  POST /api/auth/verify-otp         │                                │
   │  { email, otp }                    │                                │
   │──────────────────────────────────> │                                │
   │                                    │ 6. Validate OTP                │
   │                                    │ 7. Find user in MongoDB        │
   │                                    │ 8. Create UUID token           │
   │  { token: "uuid..." }              │                                │
   │ <──────────────────────────────────│                                │
```

### 2c – Google Login Flow

```
Frontend                        Backend (AuthService)         Google API
   │                                    │                          │
   │  POST /api/auth/google             │                          │
   │  { token: "<google access token>"}│                          │
   │──────────────────────────────────> │                          │
   │                                    │ 1. Call Google userinfo  │
   │                                    │──────────────────────────>
   │                                    │  GET googleapis.com/     │
   │                                    │  oauth2/v3/userinfo      │
   │                                    │ <─────────────────────────
   │                                    │  { email, name, sub,     │
   │                                    │    email_verified }      │
   │                                    │ 2. Check email_verified  │
   │                                    │ 3. Validate SLIIT email  │
   │                                    │ 4. Find or create user   │
   │                                    │    in MongoDB            │
   │                                    │ 5. Create UUID token     │
   │  { token: "uuid..." }              │                          │
   │ <──────────────────────────────────│                          │
```

---

## 3. How OTPs are Sent – File by File

### File 1: `service/AuthService.java`
This is the **only file** responsible for generating and sending OTPs. Two private methods handle it:

```java
private void issueOtp(String email, OtpPurpose purpose) {
    // Generate a random 6-digit number between 100000 and 999999
    String otp = String.valueOf((int) (Math.random() * 900000) + 100000);

    // Store OTP in memory: key = email, value = OtpRecord(otp, expiresAt, purpose)
    otpStore.put(email, new OtpRecord(otp, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS), purpose));

    // Actually send the email
    sendOtpEmail(email, otp);
}

private void sendOtpEmail(String to, String otp) {
    try {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("SLIIT-HUB OTP Verification");
        message.setText("Your OTP is: " + otp + "\nThis OTP expires in 5 minutes.");
        mailSender.send(message);        // <-- Spring JavaMailSender sends SMTP email
    } catch (Exception ex) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Failed to send OTP email. Check MAIL_USERNAME and MAIL_PASSWORD in backend/.env");
    }
}
```

### Where `issueOtp` is called
| Caller method | Purpose enum value | When |
|---|---|---|
| `requestRegisterOtp()` | `OtpPurpose.REGISTER` | User submits registration form |
| `requestLoginOtp()` | `OtpPurpose.LOGIN` | User with role=USER submits login |

**Note:** Admin and Technician users skip the OTP entirely and get a token on the first call.

### In-memory OTP storage
```java
// Three ConcurrentHashMaps (thread-safe, lives in JVM memory, NOT in MongoDB)
private final ConcurrentHashMap<String, OtpRecord>          otpStore              = new ConcurrentHashMap<>();
private final ConcurrentHashMap<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
private final ConcurrentHashMap<String, String>              activeTokens         = new ConcurrentHashMap<>();
```

| Map | Key | Value | Purpose |
|---|---|---|---|
| `otpStore` | email | `OtpRecord(otp, expiresAt, purpose)` | Holds pending OTPs |
| `pendingRegistrations` | email | `PendingRegistration(fullName, sliitId, rawPassword)` | Holds registration data before DB write |
| `activeTokens` | UUID token string | email | Session store – validates every request |

### OTP Expiry
- OTP is valid for **300 seconds (5 minutes)** (`OTP_EXPIRY_SECONDS = 300`)
- If `Instant.now().isAfter(record.expiresAt())` → HTTP 400 "OTP expired"
- Expired and used OTPs are removed from the map with `otpStore.remove(email)`

### Mail configuration (application.yml / .env)
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```
Credentials come from the `.env` file (excluded from Git). Spring Boot auto-configures `JavaMailSender` from these properties.

---

## 4. Backend File Structure for Auth

All auth-related files are in:
`backend/src/main/java/com/wd32/_5/smart_campus/`

```
dto/
  RegisterRequest.java      ← { fullName, sliitId, email, password }
  LoginRequest.java         ← { email, password }
  OtpVerifyRequest.java     ← { email, otp }
  GoogleAuthRequest.java    ← { token }
  AuthResponse.java         ← { token, message }

controller/
  AuthController.java       ← REST endpoints (maps HTTP → AuthService)

service/
  AuthService.java          ← ALL auth business logic + OTP generation + email sending

config/
  TokenAuthFilter.java      ← Spring Security filter that validates Bearer tokens
  SecurityConfig.java       ← Which URLs are public vs protected
  PasswordConfig.java       ← BCryptPasswordEncoder bean

entity/
  User.java                 ← MongoDB document (@Document)
  Role.java                 ← enum: USER, ADMIN, TECHNICIAN

repository/
  UserRepository.java       ← findByEmail(), findBySliitId(), etc.
```

---

## 5. Auth Endpoints

Base path: `/api/auth` — all marked `@RequestMapping("/api/auth")` in `AuthController.java`

| Method | URL | Request Body | Response | Who Can Call | What It Does |
|---|---|---|---|---|---|
| POST | `/api/auth/register/request-otp` | `{ fullName, sliitId, email, password }` | `{ message: "OTP sent" }` | Anyone (public) | Validates email, stores pending registration, sends OTP |
| POST | `/api/auth/login/request-otp` | `{ email, password }` | `{ message: "OTP sent" }` or `{ token }` | Anyone (public) | Validates credentials, sends OTP (or returns token for admin/tech) |
| POST | `/api/auth/verify-otp` | `{ email, otp }` | `{ token, message }` | Anyone (public) | Validates OTP, registers or logs in user, returns session token |
| POST | `/api/auth/google` | `{ token: "<google token>" }` | `{ token, message }` | Anyone (public) | Validates Google token, creates/finds user, returns session token |
| GET | `/api/auth/me` | – | `{ id, name, email, sliitId, provider, role }` | Authenticated user | Returns the currently logged-in user's profile |

All auth endpoints are **publicly accessible** — configured in `SecurityConfig.java`:
```java
.requestMatchers("/api/auth/**").permitAll()
```

---

## 6. Notification Endpoints

Base path: `/api/notifications` — `NotificationController.java`

| Method | URL | Response | Who Can Call | What It Does |
|---|---|---|---|---|
| GET | `/api/notifications` | `List<Notification>` | Any logged-in user | Returns all notifications for the current user, newest first |
| GET | `/api/notifications/unread-count` | `{ count: N }` | Any logged-in user | Returns the number of unread notifications |
| PUT | `/api/notifications/{id}/read` | `204 No Content` | Owner of the notification | Marks a single notification as read |
| PUT | `/api/notifications/read-all` | `204 No Content` | Any logged-in user | Marks all notifications for the user as read |

All notification endpoints require a valid **Bearer token** — the `@AuthenticationPrincipal User user` parameter is injected by Spring Security after `TokenAuthFilter` validates the token.

### How Notifications are Created (Server Side)
Notifications are **never created by the user directly**. They are created internally by `NotificationService`:

```java
// Notify a single user
notificationService.notifyUser(recipientId, message, type, relatedId);

// Notify all admins at once
notificationService.notifyAllAdmins(message, type, relatedId);
```

These are called from `BookingService` whenever a booking is created, approved, or rejected.

---

## 7. Validations in Auth

All validations live in `AuthService.java`. There are **no `@Valid`/`@NotNull` annotations** on the DTO classes — all validation is done programmatically in the service layer.

### 7a – Email Validation (Regex)

```java
private static final Pattern SLIIT_EMAIL_PATTERN =
    Pattern.compile("^((IT|BM|EN)\\d+|[a-zA-Z]+)@my\\.sliit\\.lk$", Pattern.CASE_INSENSITIVE);

private boolean isValidSliitEmail(String email) {
    return email != null && SLIIT_EMAIL_PATTERN.matcher(email).matches();
}
```

**What this allows:**
- `IT21234567@my.sliit.lk` (IT student ID)
- `BM21123456@my.sliit.lk` (BM student ID)
- `EN21987654@my.sliit.lk` (EN student ID)
- `john@my.sliit.lk` (staff alphabetic username)

**What it rejects:**
- Any email not ending in `@my.sliit.lk`
- Gmail, Yahoo, or any other domain
- Numeric-only usernames without the IT/BM/EN prefix

### 7b – Registration Validations (in `requestRegisterOtp`)

| Check | Error |
|---|---|
| Email does not match SLIIT pattern | HTTP 400 "Email must be a valid SLIIT student ID..." |
| Email already registered | HTTP 409 "User already exists" |
| SLIIT ID already registered | HTTP 409 "SLIIT ID already exists" |

### 7c – Login Validations (in `requestLoginOtp`)

| Check | Error |
|---|---|
| Email does not match SLIIT pattern | HTTP 400 "Invalid email format" |
| User not found in DB | HTTP 401 "Invalid credentials" |
| Password doesn't match BCrypt hash | HTTP 401 "Invalid credentials" |

### 7d – OTP Verify Validations (in `verifyOtp`)

| Check | Error |
|---|---|
| Email or OTP is null/blank | HTTP 400 "Email and OTP are required" |
| No OTP request found for that email | HTTP 400 "No OTP request found" |
| OTP has expired (> 5 minutes) | HTTP 400 "OTP expired" |
| OTP string doesn't match | HTTP 400 "Invalid OTP" |
| Registration data missing (edge case) | HTTP 400 "No pending registration found" |

### 7e – Google Login Validations (in `googleLogin`)

| Check | Error |
|---|---|
| Token is null/blank | HTTP 400 "Google token is required" |
| Google API call fails | HTTP 401 "Invalid Google token" |
| Google returns no profile body | HTTP 401 "Failed to fetch Google profile" |
| Profile has no email | HTTP 401 "Google profile does not contain email" |
| Email not verified by Google | HTTP 401 "Google email is not verified" |
| Email is not a SLIIT email | HTTP 403 "Only SLIIT email addresses are allowed" |

### 7f – `/api/auth/me` Validation

| Check | Error |
|---|---|
| Authorization header is missing or doesn't start with "Bearer " | HTTP 401 "Authorization header missing or invalid" |
| Token not found in `activeTokens` map | HTTP 401 "Invalid or expired token" |
| Email from token doesn't map to any User in DB | HTTP 401 "User not found" |

---

## 8. Why We Use the Maven Wrapper (`mvnw`)

The Maven Wrapper is the `mvnw` (Linux/Mac) and `mvnw.cmd` (Windows) script in the `backend/` folder. It is generated by Spring Initializr and committed into the repository.

### The Problem It Solves

Without the wrapper, every developer needs to install the exact same version of Maven globally on their machine. If one developer has Maven 3.8 and another has 3.6, the build could behave differently or fail.

### How It Works

```
backend/
  mvnw           ← Shell script (Linux/Mac)
  mvnw.cmd       ← Batch script (Windows)
  .mvn/
    wrapper/
      maven-wrapper.properties   ← Specifies WHICH version of Maven to download
      maven-wrapper.jar          ← Small JAR that downloads Maven if not cached
```

When you run `./mvnw spring-boot:run`:
1. The script runs `maven-wrapper.jar`
2. The jar reads `.mvn/wrapper/maven-wrapper.properties` to find the Maven version URL
3. If that exact version is not cached in `~/.m2/wrapper/`, it downloads it
4. Then it runs the specified Maven command using that downloaded version

### Why It Matters for This Project

| Reason | Detail |
|---|---|
| **Reproducibility** | Everyone on the team uses the same Maven version — no "works on my machine" issues |
| **No global install needed** | A new developer can clone the repo and run `./mvnw spring-boot:run` immediately |
| **CI/CD friendly** | GitHub Actions can run `./mvnw test` without a `Set up Maven` step |
| **Version pinned** | The Maven version is in source control, not dependent on the developer's environment |

### Common Commands

```bash
# Start the Spring Boot application
./mvnw spring-boot:run

# Build a runnable JAR
./mvnw package

# Run tests
./mvnw test

# Skip tests during build
./mvnw package -DskipTests
```

---

## 9. How TokenAuthFilter Works

`TokenAuthFilter.java` (in `config/`) is a **Spring Security filter** that runs on **every HTTP request** before the controller is reached.

```java
@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, ...) {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);          // Extract the UUID token
            String email = authService.getEmailByToken(token);  // Look up in activeTokens map

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                userRepository.findByEmail(email).ifPresent(user -> {
                    // Build a Spring Security Authentication with ROLE_USER / ROLE_ADMIN / ROLE_TECHNICIAN
                    var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                    var auth = new UsernamePasswordAuthenticationToken(user, null, List.of(authority));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }

        filterChain.doFilter(request, response);  // Continue to the controller
    }
}
```

**Key points:**
- Extends `OncePerRequestFilter` — guaranteed to run exactly once per request
- If the token is invalid or missing, the filter does nothing — the Security config then blocks the request with 401
- The full `User` entity is stored as the **principal**, so controllers can do `@AuthenticationPrincipal User user` to get the logged-in user

---

## 10. Password Hashing

`PasswordConfig.java` declares a single Spring Bean:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

BCrypt is used because:
- It automatically generates a random **salt** for every password, so two identical passwords produce different hashes
- It is intentionally **slow** (configurable cost factor), making brute-force attacks impractical
- The hash includes the salt, so no separate salt column is needed in the database

During registration: `passwordEncoder.encode(pending.rawPassword())`
During login check: `passwordEncoder.matches(request.getPassword(), user.getPassword())`

---

## 11. Likely Viva Questions and Answers

**Q: How does a user log in to this system?**
A: For regular users, login is a two-step process. First, `POST /api/auth/login/request-otp` with email and password — the server validates the credentials and sends a 6-digit OTP to the email. Then, `POST /api/auth/verify-otp` with the email and OTP — the server validates the OTP and returns a UUID Bearer token. Admin and Technician accounts skip the OTP and get a token immediately on the first request.

---

**Q: In which file is the OTP generated and sent?**
A: `AuthService.java` (in `service/`). The `issueOtp()` private method generates the number and the `sendOtpEmail()` private method sends it using Spring's `JavaMailSender`. The `issueOtp()` method is called from `requestRegisterOtp()` and `requestLoginOtp()`.

---

**Q: Where is the OTP stored? Is it in the database?**
A: No. The OTP is stored in a `ConcurrentHashMap<String, OtpRecord>` called `otpStore` — this lives in the JVM's memory (RAM), not in MongoDB. The key is the user's email and the value contains the OTP string, expiry timestamp, and purpose (REGISTER or LOGIN). When the OTP is verified (correctly or expired), it is removed from the map.

---

**Q: What happens if the OTP expires?**
A: `verifyOtp()` checks `Instant.now().isAfter(record.expiresAt())`. If expired, both the OTP and any pending registration data are removed from their respective maps and an HTTP 400 "OTP expired" error is returned. The user must restart the registration or login flow.

---

**Q: What is the OTP expiry time?**
A: 5 minutes (300 seconds), set by the constant `OTP_EXPIRY_SECONDS = 300` in `AuthService.java`.

---

**Q: Why do Admin and Technician users not need an OTP?**
A: In `requestLoginOtp()`, after the password is verified, there is an explicit check: `if (user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICIAN)` — if true, a token is created and returned immediately. The reasoning is that admin/technician accounts are pre-created by a database seeder and considered more trusted; requiring an OTP for them would slow down critical operations.

---

**Q: What kind of token does the system use? Is it JWT?**
A: No, it is not JWT. The system uses a **UUID-based session token**. `UUID.randomUUID().toString()` is called to create a token, and it is stored in a `ConcurrentHashMap<String, String>` (`activeTokens`) where the key is the token and the value is the user's email. It is a simple stateful session, not a stateless JWT.

---

**Q: How does the system know who is making a request?**
A: Every protected request must include `Authorization: Bearer <token>` in the header. `TokenAuthFilter` extracts the token, looks up the email from `activeTokens`, loads the `User` from MongoDB, wraps it in a `UsernamePasswordAuthenticationToken` with the user's role, and stores it in Spring Security's `SecurityContextHolder`. Controllers then access the authenticated user via `@AuthenticationPrincipal User user`.

---

**Q: What email addresses are allowed to register?**
A: Only `@my.sliit.lk` addresses. The regex `^((IT|BM|EN)\d+|[a-zA-Z]+)@my\.sliit\.lk$` allows student IDs like `IT21234567` or alphabetic usernames like `john`, all ending in `@my.sliit.lk`. Any other email is rejected with HTTP 400.

---

**Q: Where is the email validation regex defined?**
A: At the top of `AuthService.java` as a static constant:
```java
private static final Pattern SLIIT_EMAIL_PATTERN =
    Pattern.compile("^((IT|BM|EN)\\d+|[a-zA-Z]+)@my\\.sliit\\.lk$", Pattern.CASE_INSENSITIVE);
```
It is checked by the `isValidSliitEmail()` private method.

---

**Q: What annotations are used for validation in the DTOs?**
A: None. The project does not use `@Valid`, `@NotNull`, or `@Email` annotations on the DTO classes. All validation is done **programmatically** inside `AuthService.java` using explicit `if` checks and `ResponseStatusException` throws.

---

**Q: Why use `ConcurrentHashMap` instead of a regular `HashMap`?**
A: Spring Boot handles multiple HTTP requests concurrently on different threads. A regular `HashMap` is not thread-safe — simultaneous reads and writes from different threads can cause data corruption or `ConcurrentModificationException`. `ConcurrentHashMap` is designed for concurrent access, using internal locking so multiple threads can safely read and write at the same time.

---

**Q: What is the Maven Wrapper and why is it used?**
A: The Maven Wrapper (`mvnw`/`mvnw.cmd`) is a script that downloads and uses a specific version of Maven defined in `.mvn/wrapper/maven-wrapper.properties`. It is used so that every developer and CI system uses the exact same Maven version without needing to install Maven globally. You run `./mvnw spring-boot:run` to start the app or `./mvnw test` to run tests.

---

**Q: What are all the Auth endpoints?**
A: There are 5 endpoints under `/api/auth`:
1. `POST /api/auth/register/request-otp` — start registration, send OTP
2. `POST /api/auth/login/request-otp` — start login, send OTP (or return token for admin/tech)
3. `POST /api/auth/verify-otp` — confirm OTP, get session token
4. `POST /api/auth/google` — Google OAuth login, get session token
5. `GET /api/auth/me` — get current logged-in user's profile (requires Bearer token)

---

**Q: What are all the Notification endpoints?**
A: There are 4 endpoints under `/api/notifications`:
1. `GET /api/notifications` — get all notifications for the current user
2. `GET /api/notifications/unread-count` — get count of unread notifications
3. `PUT /api/notifications/{id}/read` — mark one notification as read
4. `PUT /api/notifications/read-all` — mark all notifications as read

---

**Q: Can a user read another user's notifications?**
A: No. In `markAsRead()`, the service checks `n.getRecipientId().equals(userId)`. If the notification belongs to a different user, it throws HTTP 403 Forbidden. The `getForUser()` method already filters by `recipientId`, so users can only retrieve their own notifications.

---

**Q: How does Google login work at the backend?**
A: The frontend sends a Google-issued access token to `POST /api/auth/google`. The backend calls Google's `https://www.googleapis.com/oauth2/v3/userinfo` API with that token to get the user's profile. It verifies the email is verified and is a SLIIT email. Then it finds or creates the user in MongoDB with `provider="google"`, and returns a session token.

---

*Generated for IT3030 PAF 2026 Viva Preparation — Smart Campus Group WD-3.2-75*
