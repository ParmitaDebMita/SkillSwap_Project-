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
