# Booking Feature – Viva Reference Guide
**IT3030 PAF 2026 | Smart Campus Operations Hub**

---

## 1. What the Booking Feature Does (One Paragraph Answer)

The booking feature lets any authenticated user browse campus resources and request a booking by specifying a date, time slot, number of attendees, and purpose. Every booking starts in **PENDING** status. An admin reviews it and either **APPROVES** or **REJECTS** it (with a reason). If approved, the user can later **CANCEL** it. The system also prevents two users from booking the same resource at the same time slot on the same date (conflict detection). When a booking is created, a **WhatsApp notification** is automatically sent via Twilio.

---

## 2. Frontend Screens

### Screen 1 – Dashboard Page (User)
**File:** `frontend/src/pages/DashboardPage.jsx`

This page has **two tabs** at the top:

#### Tab A – Browse Resources
- Shows all campus resources as cards (lecture halls, labs, meeting rooms, equipment)
- Each card has filters: search by name/location, filter by type/status, min capacity, available now
- Every active resource has a **"Book Now"** button
- Clicking "Book Now" opens the **Booking Modal**

#### Tab B – My Bookings
- Shows a table of all bookings made by the currently logged-in user
- Columns: Resource, Date, Time Slot, Attendees, Purpose, Status, Action
- Status badges with colour coding:
  - **PENDING** → yellow
  - **APPROVED** → green
  - **REJECTED** → red (shows rejection reason below the badge)
  - **CANCELLED** → grey
- A **Cancel** button appears for PENDING and APPROVED bookings

#### The Booking Modal
- Triggered by clicking "Book Now" on a resource card
- Fields:
  - **Date** (date picker, must be today or future)
  - **Time Slot** (dropdown: 08:00–10:00, 10:00–12:00, 12:00–14:00, 14:00–16:00, 16:00–18:00)
  - **Expected Attendees** (number input)
  - **Purpose** (textarea)
- On submit: calls `POST /api/bookings` with the resource ID, date, time slot, attendees, and purpose
- On success: shows a green confirmation screen saying the booking is pending approval
- On conflict: shows the error message returned by the backend (e.g. "This time slot is already booked")

---

### Screen 2 – Admin Dashboard (Admin)
**File:** `frontend/src/pages/AdminDashboard.jsx`

The admin dashboard has a sidebar with multiple sections. The **Bookings** section is where admins manage all bookings.

#### Bookings Section
- **Stats row** at the top showing: Total, Pending, Approved, Rejected counts
- **Status filter** dropdown to filter by PENDING / APPROVED / REJECTED / CANCELLED
- **Table** with columns: User, Resource, Date, Time Slot, Attendees, Purpose, Status, Actions
- For every **PENDING** booking two action buttons appear:
  - **Approve** – immediately sets status to APPROVED
  - **Reject** – opens a modal where the admin types a rejection reason, then sets status to REJECTED with that reason stored
- Rejected bookings show the reason text below the status badge

---

## 3. Backend File Structure

All booking files are inside:
`backend/src/main/java/com/wd32/_5/smart_campus/`

```
entity/
  BookingStatus.java        ← enum: PENDING, APPROVED, REJECTED, CANCELLED
  Booking.java              ← MongoDB document (@Document)

dto/
  BookingRequest.java       ← incoming request body from the frontend

repository/
  BookingRepository.java    ← database queries (extends MongoRepository)

service/
  BookingService.java       ← all business logic
  WhatsAppNotificationService.java  ← Twilio WhatsApp notification

controller/
  BookingController.java    ← REST API endpoints
```

---

## 4. Each File Explained

### `entity/BookingStatus.java`
```java
public enum BookingStatus {
    PENDING, APPROVED, REJECTED, CANCELLED
}
```
A simple Java enum. The four states a booking can be in. Stored as a string in MongoDB.

---

### `entity/Booking.java`
The MongoDB document. Annotated with `@Document(collection = "bookings")`.

| Field | Type | Description |
|---|---|---|
| id | String | Auto-generated MongoDB ObjectId |
| resourceId | String | ID of the resource being booked |
| resourceName | String | Denormalised name (stored so we don't need a join) |
| userId | String | ID of the user who made the booking |
| userName | String | Name or email of the user |
| date | String | e.g. "2026-04-27" |
| timeSlot | String | e.g. "08:00 - 10:00" |
| purpose | String | What the booking is for |
| attendees | int | Expected number of people |
| status | BookingStatus | Defaults to PENDING |
| adminNote | String | Rejection reason (set by admin) |
| createdAt | String | ISO timestamp of when booking was made |

---

### `dto/BookingRequest.java`
The data the frontend sends in the request body when creating a booking:
- `resourceId` – which resource
- `date` – which date
- `timeSlot` – which time slot
- `purpose` – reason
- `attendees` – number of people

---

### `repository/BookingRepository.java`
Extends `MongoRepository<Booking, String>`. Spring Data MongoDB automatically generates the SQL-equivalent queries from method names.

```java
// Get all bookings by a specific user
List<Booking> findByUserId(String userId);

// Get all bookings with a specific status (admin filter)
List<Booking> findByStatus(BookingStatus status);

// Conflict detection: same resource + same date + same time + not cancelled/rejected
List<Booking> findByResourceIdAndDateAndTimeSlotAndStatusIn(
    String resourceId, String date, String timeSlot, List<BookingStatus> statuses);
```

The third method is called with `List.of(BookingStatus.PENDING, BookingStatus.APPROVED)` to check if the slot is already taken.

---

### `service/BookingService.java`
Contains all the business logic. Key methods:

**`create(BookingRequest req, User currentUser)`**
1. Validates that resourceId, date, and timeSlot are present
2. Fetches the resource — throws 404 if not found
3. Checks the resource status is ACTIVE — throws 400 if OUT_OF_SERVICE
4. Runs conflict detection — throws 409 CONFLICT if slot is taken
5. Builds the Booking entity and saves it to MongoDB
6. Calls WhatsApp notification service
7. Returns the saved booking

**`approve(String id)`**
- Only works if status is PENDING, otherwise throws 400
- Sets status to APPROVED

**`reject(String id, String reason)`**
- Only works if status is PENDING, otherwise throws 400
- Sets status to REJECTED and stores the reason in `adminNote`

**`cancel(String id, User currentUser)`**
- Works if the caller is the booking owner OR an admin
- Only cancels PENDING or APPROVED bookings
- Sets status to CANCELLED

---

### `controller/BookingController.java`
Maps HTTP requests to service methods. Base path: `/api/bookings`

| Method | Endpoint | Who can call | What it does |
|---|---|---|---|
| POST | `/api/bookings` | Any logged-in user | Create a booking |
| GET | `/api/bookings/my` | Any logged-in user | Get own bookings |
| GET | `/api/bookings` | Admin only | Get all bookings (optional ?status= filter) |
| PUT | `/api/bookings/{id}/approve` | Admin only | Approve a booking |
| PUT | `/api/bookings/{id}/reject` | Admin only | Reject with a reason |
| PUT | `/api/bookings/{id}/cancel` | Owner or Admin | Cancel a booking |

**How admin check works:**
```java
private void requireAdmin() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getAuthorities().stream()
            .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
}
```
Reads the current user's role from the Spring Security context. The role was set when the JWT token was validated in `TokenAuthFilter`.

**How current user is extracted:**
```java
private User currentUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return (User) auth.getPrincipal();
}
```
The `TokenAuthFilter` stores the full `User` entity as the principal, so we cast it directly.

---

## 5. Booking Status Workflow

```
User submits booking
        │
        ▼
    [PENDING]
    /        \
Admin        Admin
Approves     Rejects (with reason)
    │              │
    ▼              ▼
[APPROVED]    [REJECTED]
    │
User or Admin Cancels
    │
    ▼
[CANCELLED]
```

**Rules:**
- Only PENDING → APPROVED or REJECTED (admin action)
- Only PENDING or APPROVED → CANCELLED (user who made it, or admin)
- REJECTED and CANCELLED are terminal states — no further transitions

---

## 6. Conflict Detection Explained

When a user tries to book a resource, the system checks:

> "Does any booking exist for the **same resource**, **same date**, **same time slot**, with status **PENDING or APPROVED**?"

```java
List<Booking> conflicts = bookingRepository
    .findByResourceIdAndDateAndTimeSlotAndStatusIn(
        req.getResourceId(),
        req.getDate(),
        req.getTimeSlot(),
        List.of(BookingStatus.PENDING, BookingStatus.APPROVED)
    );
if (!conflicts.isEmpty()) {
    throw new ResponseStatusException(HttpStatus.CONFLICT,
        "This time slot is already booked for the selected resource");
}
```

REJECTED and CANCELLED bookings are excluded intentionally — a rejected or cancelled slot should be available for rebooking.

---

## 7. Twilio WhatsApp Notification

**File:** `service/WhatsAppNotificationService.java`

### What it does
Sends a WhatsApp message to a hardcoded number (`+94778402705`) every time a booking is successfully created.

### When it is triggered
Inside `BookingService.create()`, **after** the booking is saved to MongoDB:
```java
Booking saved = bookingRepository.save(booking);
whatsAppNotificationService.sendBookingCreated(
    resource.getName(), req.getDate(), req.getTimeSlot());
return saved;
```

### How it works
```java
@PostConstruct          // runs once when the app starts
public void init() {
    Twilio.init(accountSid, authToken);   // initialise Twilio SDK
}

public void sendBookingCreated(String resourceName, String date, String timeSlot) {
    try {
        String variables = "{\"1\":\"" + date + "\",\"2\":\"" + timeSlot + "\"}";
        Message.creator(new PhoneNumber(TO), new PhoneNumber(FROM), (String) null)
            .setContentSid(CONTENT_SID)         // pre-approved WhatsApp template
            .setContentVariables(variables)      // {1} = date, {2} = time slot
            .create();
    } catch (Exception e) {
        System.err.println("WhatsApp notification failed: " + e.getMessage());
        // booking still succeeds even if notification fails
    }
}
```

### Key values
| What | Value |
|---|---|
| Twilio Account SID | Read from env: `TWILIO_ACCOUNT_SID` |
| Twilio Auth Token | Read from env: `TWILIO_AUTH_TOKEN` |
| From (Twilio Sandbox) | `whatsapp:+14155238886` |
| To (hardcoded) | `whatsapp:+94778402705` |
| Template SID | `HXb5b62575e6e4ff6129ad7c8efe1f983e` |
| Template variable {1} | Booking date |
| Template variable {2} | Booking time slot |

### Where credentials are stored
- **`.env` file** (in backend root): `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- **`application.yml`**: reads them as `${TWILIO_ACCOUNT_SID}` and `${TWILIO_AUTH_TOKEN}`
- **`WhatsAppNotificationService`**: injected via `@Value("${twilio.account-sid}")`

### Why the try/catch?
If Twilio is unavailable or the number is not joined to the sandbox, we don't want the booking to fail. The notification failing is non-critical — the booking itself is still saved to MongoDB and returned to the user.

---

## 8. Security Summary

| Endpoint | Auth Required | Role Required |
|---|---|---|
| POST /api/bookings | Yes (JWT token) | Any user |
| GET /api/bookings/my | Yes | Any user (sees only own) |
| GET /api/bookings | Yes | ADMIN |
| PUT /approve | Yes | ADMIN |
| PUT /reject | Yes | ADMIN |
| PUT /cancel | Yes | Owner of booking OR ADMIN |

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header. The token is validated by `TokenAuthFilter` which sets the user in Spring Security's `SecurityContextHolder`.

---

## 9. Likely Viva Questions and Answers

**Q: What happens if two users try to book the same resource at the same time?**
A: The second request will fail with HTTP 409 Conflict. The conflict detection query checks for any PENDING or APPROVED booking with the same resourceId, date, and timeSlot before saving.

**Q: Why is resourceName stored in the Booking document if you already have resourceId?**
A: This is called denormalisation. MongoDB has no joins. If we only stored the resourceId, we'd have to do a second database query to get the name every time we display a booking. Storing the name directly makes reads faster and simpler.

**Q: What happens if a user tries to approve their own booking?**
A: The `requireAdmin()` check in the controller will throw a 403 Forbidden if the authenticated user doesn't have ROLE_ADMIN. A regular user can never reach the approve or reject endpoints.

**Q: Can a user cancel someone else's booking?**
A: No. In `BookingService.cancel()`, we check `booking.getUserId().equals(currentUser.getId())`. If the caller is not the owner and not an admin, we throw 403 Forbidden.

**Q: What status transitions are allowed?**
A: PENDING → APPROVED (admin), PENDING → REJECTED (admin with reason), PENDING → CANCELLED (owner/admin), APPROVED → CANCELLED (owner/admin). REJECTED and CANCELLED are final.

**Q: Why does the notification failure not break the booking?**
A: The `sendBookingCreated()` call is wrapped in a try/catch inside `WhatsAppNotificationService`. If Twilio throws any exception, it is caught and printed to the server log, but the booking (already saved) is still returned to the user.

**Q: Where is the Twilio Auth Token stored? Is it safe?**
A: It's stored in the `.env` file which is excluded from Git (it's in `.gitignore`). The `application.yml` reads it using `${TWILIO_AUTH_TOKEN}` — the actual secret is never hardcoded in source code.

**Q: How does the system know who is making the request?**
A: Every request includes a `Bearer` token in the Authorization header. `TokenAuthFilter` intercepts the request, validates the token via `AuthService`, looks up the user from MongoDB, and stores the full `User` entity in Spring Security's `SecurityContextHolder`. The controller then calls `currentUser()` which casts the principal to `User`.

---

*Generated for IT3030 PAF 2026 Viva Preparation — Smart Campus Group WD-3.2-75*
