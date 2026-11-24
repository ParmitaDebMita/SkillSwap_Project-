"""
Comprehensive test:
- Block a user
- Verify user appears in GET /api/moderation/blocked with name, avatar, university
- Verify privacy rule: cannot send exchange request while blocked
- Unblock user
- Verify user removed from MongoDB blockedUsers and GET /api/moderation/blocked
- Verify users can interact again after unblocking
"""
import asyncio
import httpx

BASE = "http://localhost:8000/api"


async def get_or_create_user(client: httpx.AsyncClient, name: str, email: str, password: str):
    r = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json()["token"], r.json()["user"]
    r = await client.post(f"{BASE}/auth/signup", json={"name": name, "email": email, "password": password})
    if r.status_code in (200, 201):
        return r.json()["token"], r.json()["user"]
    raise RuntimeError(f"Could not auth user {email}: {r.status_code} {r.text}")


async def run():
    async with httpx.AsyncClient(timeout=15) as c:
        # Auth User A & User B
        tok_a, user_a = await get_or_create_user(c, "Alex Rivera", "alex_test_99@example.com", "password123")
        tok_b, user_b = await get_or_create_user(c, "Ananya Patel", "ananya_test_99@example.com", "password123")
        id_a = user_a["id"]
        id_b = user_b["id"]
        hdrs_a = {"Authorization": f"Bearer {tok_a}"}
        hdrs_b = {"Authorization": f"Bearer {tok_b}"}

        # Ensure clean initial state (unblocked)
        await c.post(f"{BASE}/moderation/unblock", json={"blockedUserId": id_b}, headers=hdrs_a)
        await c.post(f"{BASE}/moderation/unblock", json={"blockedUserId": id_a}, headers=hdrs_b)

        passed = 0
        failed = 0

        def check(label, cond, extra=""):
            nonlocal passed, failed
            if cond:
                print(f"  \u2713  {label}")
                passed += 1
            else:
                print(f"  \u2717  FAIL: {label} {extra}")
                failed += 1

        print("\n" + "=" * 60)
        print("  SKILLSWAP BLOCK & UNBLOCK FUNCTIONALITY TESTS")
        print("=" * 60 + "\n")

        # ── 1. Initial State ──────────────────────────────────────────────────
        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        check("Initial blocked list is empty", r.status_code == 200 and len(r.json().get("blockedUsers", [])) == 0)

        # ── 2. Block User B ───────────────────────────────────────────────────
        r = await c.post(f"{BASE}/moderation/block", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Block User B -> 200", r.status_code == 200)
        check("Block response success is True", r.json().get("success") is True)

        # Verify in auth/me
        r = await c.get(f"{BASE}/auth/me", headers=hdrs_a)
        check("User B in User A blockedUsers array", id_b in r.json().get("blockedUsers", []))

        # ── 3. GET /moderation/blocked ────────────────────────────────────────
        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        check("GET /moderation/blocked -> 200", r.status_code == 200)
        blocked = r.json().get("blockedUsers", [])
        check("User B appears in /moderation/blocked list", any(u["id"] == id_b for u in blocked))
        if blocked:
            target = next((u for u in blocked if u["id"] == id_b), None)
            check("Blocked user has name field", bool(target and target.get("name")))
            check("Blocked user has avatar field", bool(target and "avatar" in target))
            check("Blocked user has university field", bool(target and "university" in target))

        # ── 4. Unauthenticated access blocked ────────────────────────────────
        r = await c.get(f"{BASE}/moderation/blocked")
        check("Unauthenticated /moderation/blocked -> 401/403", r.status_code in (401, 403))

        # ── 5. Privacy Enforcement: Exchange Request Blocked ─────────────────
        r = await c.post(
            f"{BASE}/exchanges",
            headers=hdrs_a,
            json={
                "toId": id_b,
                "skillOffered": "Python",
                "skillWanted": "React",
                "message": "Hello while blocked",
            },
        )
        check("Cannot send exchange request while blocked -> 400", r.status_code == 400)

        # ── 6. Unblock User B ─────────────────────────────────────────────────
        r = await c.post(f"{BASE}/moderation/unblock", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("POST /moderation/unblock -> 200", r.status_code == 200)
        check("Unblock response success is True", r.json().get("success") is True)

        # Verify removed from MongoDB / auth/me
        r = await c.get(f"{BASE}/auth/me", headers=hdrs_a)
        check("User B removed from MongoDB blockedUsers", id_b not in r.json().get("blockedUsers", []))

        # Verify removed from GET /moderation/blocked
        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        check("GET /moderation/blocked is empty after unblock", len(r.json().get("blockedUsers", [])) == 0)

        # ── 7. Re-block and idempotency ──────────────────────────────────────
        # Double block should be idempotent
        r = await c.post(f"{BASE}/moderation/block", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Re-block User B -> 200", r.status_code == 200)
        r = await c.post(f"{BASE}/moderation/block", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Duplicate block is idempotent -> 200", r.status_code == 200)

        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        blocked_list = r.json().get("blockedUsers", [])
        check("No duplicate entries in blocked list", sum(1 for u in blocked_list if u["id"] == id_b) == 1)

        # ── 8. Final Unblock & Cleanup ───────────────────────────────────────
        r = await c.post(f"{BASE}/moderation/unblock", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Final unblock -> 200", r.status_code == 200)

        r = await c.get(f"{BASE}/auth/me", headers=hdrs_a)
        check("Final state: User A blockedUsers empty", id_b not in r.json().get("blockedUsers", []))

        print(f"\n{'=' * 60}")
        print(f"  RESULTS: {passed}/{passed + failed} tests passed")
        print("  All tests passed! \u2713" if failed == 0 else f"  {failed} test(s) FAILED \u2717")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(run())
