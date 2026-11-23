"""
SkillSwap API Integration Test Script
======================================
Tests the full two-user exchange workflow against a running server.

Prerequisites:
  1. MongoDB is running (mongod --port 27017)
  2. Server is running: uvicorn main:app --reload --port 8000

Run with:
  python test_api.py
"""

import sys
import httpx

BASE = "http://localhost:8000/api"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

results = []


def check(label: str, condition: bool, detail: str = ""):
    icon = PASS if condition else FAIL
    msg = f"  {icon}  {label}"
    if detail:
        msg += f"  →  {detail}"
    print(msg)
    results.append((label, condition))
    return condition


def section(title: str):
    print(f"\n{'─' * 55}")
    print(f"  {title}")
    print(f"{'─' * 55}")


# ── 1. Health ─────────────────────────────────────────────────────────────────
section("1 · Health Check")
r = httpx.get(f"{BASE}/health")
check("GET /api/health → 200", r.status_code == 200)
check("Returns status ok", r.json().get("status") == "ok")

# ── 2. Signup ─────────────────────────────────────────────────────────────────
section("2 · Signup")

r = httpx.post(f"{BASE}/auth/signup", json={
    "name": "Alex Rivera",
    "email": "alex_test_99@example.com",
    "password": "password123",
})
# May already exist from a previous run — that's fine
if r.status_code == 400 and "already exists" in r.json().get("detail", ""):
    print("  (alex_test_99 already registered — continuing)")
    # Login to get token
    r = httpx.post(f"{BASE}/auth/login", json={
        "email": "alex_test_99@example.com",
        "password": "password123",
    })

check("Signup / login User A → 2xx", r.status_code in (200, 201), str(r.status_code))
token_a = r.json().get("token", "")
user_a = r.json().get("user", {})
check("Token returned for User A", bool(token_a))
check("User A id present", bool(user_a.get("id")))
check("No password in response", "password" not in user_a and "hashed_password" not in user_a)
user_a_id = user_a.get("id", "")

r = httpx.post(f"{BASE}/auth/signup", json={
    "name": "Ananya Patel",
    "email": "ananya_test_99@example.com",
    "password": "password123",
})
if r.status_code == 400 and "already exists" in r.json().get("detail", ""):
    print("  (ananya_test_99 already registered — continuing)")
    r = httpx.post(f"{BASE}/auth/login", json={
        "email": "ananya_test_99@example.com",
        "password": "password123",
    })

check("Signup / login User B → 2xx", r.status_code in (200, 201), str(r.status_code))
token_b = r.json().get("token", "")
user_b = r.json().get("user", {})
check("Token returned for User B", bool(token_b))
user_b_id = user_b.get("id", "")

# ── 3. Duplicate email ─────────────────────────────────────────────────────────
section("3 · Duplicate Email Prevention")
r = httpx.post(f"{BASE}/auth/signup", json={
    "name": "Duplicate",
    "email": "alex_test_99@example.com",
    "password": "password123",
})
check("Duplicate signup → 400", r.status_code == 400)
check("Detail message present", bool(r.json().get("detail")))

# ── 4. Login ──────────────────────────────────────────────────────────────────
section("4 · Login Validation")
r = httpx.post(f"{BASE}/auth/login", json={
    "email": "alex_test_99@example.com",
    "password": "wrongpassword",
})
check("Wrong password → 401", r.status_code == 401)

r = httpx.post(f"{BASE}/auth/login", json={
    "email": "nobody@nowhere.com",
    "password": "password123",
})
check("Unknown email → 401", r.status_code == 401)

# ── 5. GET /auth/me ───────────────────────────────────────────────────────────
section("5 · GET /api/auth/me")
headers_a = {"Authorization": f"Bearer {token_a}"}
r = httpx.get(f"{BASE}/auth/me", headers=headers_a)
check("GET /auth/me → 200", r.status_code == 200)
check("Returns correct user", r.json().get("id") == user_a_id)

r = httpx.get(f"{BASE}/auth/me")
check("No token → 403", r.status_code in (401, 403))

# ── 6. Update Profile ─────────────────────────────────────────────────────────
section("6 · PUT /api/users/profile")
r = httpx.put(f"{BASE}/users/profile", headers=headers_a, json={
    "university": "MIT",
    "bio": "Full-stack developer and open-source contributor.",
    "skillsOffered": ["Python", "FastAPI", "React"],
    "skillsWanted": ["Machine Learning", "DevOps"],
    "category": "Technology",
})
check("Update profile → 200", r.status_code == 200)
updated = r.json()
check("University updated", updated.get("university") == "MIT")
check("SkillsOffered updated", "Python" in updated.get("skillsOffered", []))
check("No password in profile response", "hashed_password" not in updated)

# ── 7. GET /students ──────────────────────────────────────────────────────────
section("7 · GET /api/students")
r = httpx.get(f"{BASE}/students")
check("GET /students → 200", r.status_code == 200)
students = r.json()
check("Returns a list", isinstance(students, list))

r = httpx.get(f"{BASE}/students", params={"search": "Alex"})
check("Search by name → 200", r.status_code == 200)
check("Search results filtered", any("Alex" in s.get("name", "") for s in r.json()))

r = httpx.get(f"{BASE}/students", params={"category": "Technology"})
check("Category filter → 200", r.status_code == 200)

# ── 8. Create Exchange ────────────────────────────────────────────────────────
section("8 · POST /api/exchanges")
headers_b = {"Authorization": f"Bearer {token_b}"}

r = httpx.post(f"{BASE}/exchanges", headers=headers_b, json={
    "toId": user_a_id,
    "skillOffered": "Machine Learning",
    "skillWanted": "React",
    "message": "Hi Alex! Would love to swap skills.",
})
# May already have a pending — that's ok
if r.status_code == 400 and "already exists" in r.json().get("detail", ""):
    print("  (Pending exchange already exists — skipping duplicate tests)")
    exchange_id = None
else:
    check("Create exchange → 201", r.status_code == 201, str(r.status_code))
    exchange = r.json()
    exchange_id = exchange.get("id")
    check("Exchange id returned", bool(exchange_id))
    check("Status is pending", exchange.get("status") == "pending")
    check("fromId correct", exchange.get("fromId") == user_b_id)
    check("toId correct", exchange.get("toId") == user_a_id)
    check("from.name present", bool(exchange.get("from", {}).get("name")))

    # ── 9. Duplicate prevention ──────────────────────────────────────────────
    section("9 · Duplicate Exchange Prevention")
    r2 = httpx.post(f"{BASE}/exchanges", headers=headers_b, json={
        "toId": user_a_id,
        "skillOffered": "Machine Learning",
        "skillWanted": "React",
        "message": "Duplicate attempt",
    })
    check("Duplicate exchange → 400", r2.status_code == 400)

# ── 10. Self-request prevention ───────────────────────────────────────────────
section("10 · Self-Request Prevention")
r = httpx.post(f"{BASE}/exchanges", headers=headers_a, json={
    "toId": user_a_id,
    "skillOffered": "React",
    "skillWanted": "React",
    "message": "To myself",
})
check("Self-request → 400", r.status_code == 400)

# ── 11. List Exchanges ────────────────────────────────────────────────────────
section("11 · GET /api/exchanges")
r = httpx.get(f"{BASE}/exchanges", headers=headers_a)
check("User A list → 200", r.status_code == 200)
exchanges_a = r.json()
check("Returns a list", isinstance(exchanges_a, list))
# User A should see the exchange as receiver
if exchange_id:
    ids = [e.get("id") for e in exchanges_a]
    check("Exchange visible to receiver", exchange_id in ids)

r = httpx.get(f"{BASE}/exchanges", headers=headers_b)
check("User B list → 200", r.status_code == 200)
exchanges_b = r.json()
if exchange_id:
    ids_b = [e.get("id") for e in exchanges_b]
    check("Exchange visible to sender", exchange_id in ids_b)

# ── 12. Accept / Reject ───────────────────────────────────────────────────────
section("12 · PATCH /api/exchanges/{id}/status")

# Find an exchange where A is receiver to test with
target_id = exchange_id
if not target_id:
    # Find from the list
    for ex in exchanges_a:
        if ex.get("toId") == user_a_id and ex.get("status") == "pending":
            target_id = ex.get("id")
            break

if target_id:
    # Sender (B) should NOT be able to accept
    r = httpx.patch(f"{BASE}/exchanges/{target_id}/status", headers=headers_b, json={"status": "accepted"})
    check("Sender cannot accept own request → 403", r.status_code == 403)

    # Receiver (A) accepts
    r = httpx.patch(f"{BASE}/exchanges/{target_id}/status", headers=headers_a, json={"status": "accepted"})
    check("Receiver accepts → 200", r.status_code == 200)
    check("Status is accepted", r.json().get("status") == "accepted")

    # Already accepted — cannot change again
    r = httpx.patch(f"{BASE}/exchanges/{target_id}/status", headers=headers_a, json={"status": "rejected"})
    check("Double status update → 400", r.status_code == 400)

    # Exchanges counter should have incremented
    r = httpx.get(f"{BASE}/auth/me", headers=headers_a)
    check("User A exchanges counter incremented", r.json().get("exchanges", 0) >= 1)
else:
    print("  (No pending exchange found to test accept/reject — skipped)")

# ── 13. Invalid token ─────────────────────────────────────────────────────────
section("13 · Invalid / Missing Auth")
r = httpx.get(f"{BASE}/exchanges", headers={"Authorization": "Bearer invalidtoken"})
check("Invalid token → 401", r.status_code == 401)
r = httpx.get(f"{BASE}/exchanges")
check("Missing token → 401/403", r.status_code in (401, 403))

# ── 14. Connect & Chat Feature ────────────────────────────────────────────────
section("14 · Connect & Chat Feature")
if target_id:
    # 1. User A lists conversations
    r = httpx.get(f"{BASE}/chat/conversations", headers=headers_a)
    check("GET /chat/conversations → 200", r.status_code == 200)
    convos_a = r.json()
    check("Accepted exchange in conversations", any(c.get("exchangeId") == target_id for c in convos_a))
    if convos_a:
        peer = convos_a[0].get("peer", {})
        check("Conversation has peer info", bool(peer.get("name") and peer.get("avatar")))

    # 2. User B lists conversations
    r = httpx.get(f"{BASE}/chat/conversations", headers=headers_b)
    check("User B GET /chat/conversations → 200", r.status_code == 200)
    convos_b = r.json()
    check("User B sees conversation", any(c.get("exchangeId") == target_id for c in convos_b))

    # 3. User A gets conversation details
    r = httpx.get(f"{BASE}/chat/{target_id}", headers=headers_a)
    check("GET /chat/{id} → 200", r.status_code == 200)
    check("Details contain correct exchangeId", r.json().get("exchangeId") == target_id)

    # 4. User B sends message to User A
    msg_text_1 = "Hi Alex! Excited to connect and start exchanging skills."
    r = httpx.post(f"{BASE}/chat/{target_id}/messages", headers=headers_b, json={"text": msg_text_1})
    check("User B sends message → 201", r.status_code == 201)
    msg1 = r.json()
    check("Message text matches", msg1.get("text") == msg_text_1)
    check("Message senderId matches User B", msg1.get("senderId") == user_b_id)
    check("Message receiverId matches User A", msg1.get("receiverId") == user_a_id)
    check("Message has timestamp", bool(msg1.get("timestamp")))

    # 5. User A replies
    msg_text_2 = "Hey Ananya! Ready whenever you are. Let's learn together!"
    r = httpx.post(f"{BASE}/chat/{target_id}/messages", headers=headers_a, json={"text": msg_text_2})
    check("User A replies → 201", r.status_code == 201)

    # 6. Retrieve messages
    r = httpx.get(f"{BASE}/chat/{target_id}/messages", headers=headers_a)
    check("GET /chat/{id}/messages → 200", r.status_code == 200)
    messages = r.json()
    check("Messages retrieved in order", len(messages) >= 2 and messages[-1].get("text") == msg_text_2)

    # 7. Empty message validation
    r = httpx.post(f"{BASE}/chat/{target_id}/messages", headers=headers_a, json={"text": "   "})
    check("Empty message rejected → 422", r.status_code == 422)

    # 8. Unauthenticated access to messages rejected
    r = httpx.get(f"{BASE}/chat/{target_id}/messages")
    check("Unauthenticated chat access → 401/403", r.status_code in (401, 403))

    # ── 15. Session Scheduling ────────────────────────────────────────────────
    section("15 · Session Scheduling")
    r = httpx.post(f"{BASE}/exchanges/{target_id}/schedule", headers=headers_a, json={
        "date": "2026-12-01",
        "time": "15:00",
        "note": "Let's review React components first.",
    })
    check("Schedule session → 200", r.status_code == 200)
    session_data = r.json().get("session", {})
    check("Session date set", session_data.get("date") == "2026-12-01")
    check("Session status scheduled", session_data.get("status") in ("scheduled", "rescheduled"))

    # Reschedule
    r = httpx.post(f"{BASE}/exchanges/{target_id}/schedule", headers=headers_b, json={
        "date": "2026-12-02",
        "time": "16:00",
        "note": "Moved to Wednesday 4 PM.",
    })
    check("Reschedule session → 200", r.status_code == 200)
    check("Session rescheduled date", r.json().get("session", {}).get("date") == "2026-12-02")

    # Cancel session
    r = httpx.post(f"{BASE}/exchanges/{target_id}/schedule/cancel", headers=headers_a)
    check("Cancel session → 200", r.status_code == 200)
    check("Session cancelled", r.json().get("session", {}).get("status") == "cancelled")

    # ── 16. Exchange Completion ───────────────────────────────────────────────
    section("16 · Exchange Completion")
    r = httpx.patch(f"{BASE}/exchanges/{target_id}/status", headers=headers_a, json={"status": "completed"})
    check("Mark exchange completed → 200", r.status_code == 200)
    check("Exchange status completed", r.json().get("status") == "completed")

    # ── 17. Rating and Feedback ───────────────────────────────────────────────
    section("17 · Rating and Feedback")
    r = httpx.post(f"{BASE}/reviews/{target_id}", headers=headers_a, json={
        "rating": 5.0,
        "feedback": "Amazing peer! Learned a ton of Machine Learning.",
    })
    check("Submit review User A → 201", r.status_code == 201)
    check("Review rating stored", r.json().get("rating") == 5.0)

    # Duplicate review prevention
    r = httpx.post(f"{BASE}/reviews/{target_id}", headers=headers_a, json={
        "rating": 4.0,
        "feedback": "Duplicate attempt.",
    })
    check("Duplicate review rejected → 400", r.status_code == 400)

    # User B reviews User A
    r = httpx.post(f"{BASE}/reviews/{target_id}", headers=headers_b, json={
        "rating": 5.0,
        "feedback": "Great React teacher! Very patient and knowledgeable.",
    })
    check("Submit review User B → 201", r.status_code == 201)

    # Get reviews for exchange
    r = httpx.get(f"{BASE}/reviews/{target_id}", headers=headers_a)
    check("Get exchange reviews → 200", r.status_code == 200)
    check("Both reviews listed", len(r.json()) >= 2)

    # ── 18. Notifications ─────────────────────────────────────────────────────
    section("18 · Notifications")
    r = httpx.get(f"{BASE}/notifications", headers=headers_a)
    check("Get notifications → 200", r.status_code == 200)
    notifs_a = r.json()
    check("Notifications received", isinstance(notifs_a, list) and len(notifs_a) > 0)

    # Mark all read
    r = httpx.patch(f"{BASE}/notifications/read-all", headers=headers_a)
    check("Mark all read → 200", r.status_code == 200)

    # ── 19. Moderation: Report & Block ────────────────────────────────────────
    section("19 · Moderation (Report & Block)")
    r = httpx.post(f"{BASE}/moderation/report", headers=headers_a, json={
        "reportedUserId": user_b_id,
        "reason": "Spam behavior",
        "details": "Testing report flow.",
    })
    check("Report user → 200", r.status_code == 200)

    r = httpx.post(f"{BASE}/moderation/block", headers=headers_a, json={
        "blockedUserId": user_b_id,
    })
    check("Block user → 200", r.status_code == 200)

    # Verify blocked in auth/me
    r = httpx.get(f"{BASE}/auth/me", headers=headers_a)
    check("Blocked user in user profile", user_b_id in r.json().get("blockedUsers", []))

    # Unblock user
    r = httpx.post(f"{BASE}/moderation/unblock", headers=headers_a, json={
        "blockedUserId": user_b_id,
    })
    check("Unblock user → 200", r.status_code == 200)

    # ── 20. Student Availability & Skill Levels ───────────────────────────────
    section("20 · Student Availability & Skill Levels")
    r = httpx.put(f"{BASE}/users/profile", headers=headers_a, json={
        "availability": ["Mon 2-5 PM", "Wed 4-6 PM", "Weekends"],
        "skillsOffered": ["React (Advanced)", "JavaScript (Intermediate)"],
        "skillsWanted": ["Machine Learning (Beginner)", "Python (Intermediate)"],
    })
    check("Update availability & skills with levels → 200", r.status_code == 200)
    updated_profile = r.json()
    check("Availability saved", "Mon 2-5 PM" in updated_profile.get("availability", []))
    check("Skill levels saved", any("Advanced" in s for s in updated_profile.get("skillsOffered", [])))
else:
    print("  (No accepted exchange available — skipped chat tests)")

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'═' * 55}")
passed = sum(1 for _, ok in results if ok)
total = len(results)
print(f"  RESULTS: {passed}/{total} tests passed")
print(f"{'═' * 55}\n")

if passed < total:
    failed = [name for name, ok in results if not ok]
    print("  Failed tests:")
    for f in failed:
        print(f"    {FAIL} {f}")
    sys.exit(1)
else:
    print("  All tests passed! ✓")
    sys.exit(0)
