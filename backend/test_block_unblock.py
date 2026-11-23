"""
Quick test: block, list blocked users, unblock, verify removed.
"""
import asyncio
import httpx

BASE = "http://localhost:8000/api"


async def run():
    async with httpx.AsyncClient(timeout=15) as c:
        # Login as User A
        r = await c.post(f"{BASE}/auth/login", json={"email": "alex_test_99@test.com", "password": "Test1234!"})
        a = r.json()
        tok_a = a["token"]
        hdrs_a = {"Authorization": f"Bearer {tok_a}"}

        # Login as User B
        r = await c.post(f"{BASE}/auth/login", json={"email": "ananya_test_99@test.com", "password": "Test1234!"})
        b = r.json()
        tok_b = b["token"]
        id_b = b["user"]["id"]

        passed = 0
        failed = 0

        def check(label, cond):
            nonlocal passed, failed
            if cond:
                print(f"  \u2713  {label}")
                passed += 1
            else:
                print(f"  \u2717  FAIL: {label}")
                failed += 1

        print("\n--- Block / Unblock Feature Tests ---\n")

        # 1. Block User B
        r = await c.post(f"{BASE}/moderation/block", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Block User B -> 200", r.status_code == 200)
        check("Block response success", r.json().get("success") is True)

        # 2. GET /moderation/blocked returns User B
        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        check("GET /moderation/blocked -> 200", r.status_code == 200)
        blocked = r.json().get("blockedUsers", [])
        check("User B appears in blocked list", any(u["id"] == id_b for u in blocked))
        if blocked:
            u = next((u for u in blocked if u["id"] == id_b), None)
            check("Blocked user has name field", bool(u and u.get("name")))
            check("Blocked user has avatar field", bool(u and "avatar" in u))
            check("Blocked user has university field", bool(u and "university" in u))

        # 3. Unauthenticated access to /blocked -> 401/403
        r = await c.get(f"{BASE}/moderation/blocked")
        check("No token -> 401 or 403", r.status_code in (401, 403))

        # 4. Duplicate block is idempotent
        r = await c.post(f"{BASE}/moderation/block", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Double block -> 200 (idempotent)", r.status_code == 200)
        r2 = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        blocked2 = r2.json().get("blockedUsers", [])
        check("Still only 1 entry after double block", sum(1 for u in blocked2 if u["id"] == id_b) == 1)

        # 5. Unblock User B
        r = await c.post(f"{BASE}/moderation/unblock", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Unblock User B -> 200", r.status_code == 200)
        check("Unblock response success", r.json().get("success") is True)

        # 6. After unblock, /blocked list should be empty
        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        blocked3 = r.json().get("blockedUsers", [])
        check("User B removed from blocked list after unblock", not any(u["id"] == id_b for u in blocked3))

        # 7. User B can still be blocked again (re-block works)
        r = await c.post(f"{BASE}/moderation/block", json={"blockedUserId": id_b}, headers=hdrs_a)
        check("Re-block after unblock -> 200", r.status_code == 200)
        r = await c.get(f"{BASE}/moderation/blocked", headers=hdrs_a)
        blocked4 = r.json().get("blockedUsers", [])
        check("User B appears again after re-block", any(u["id"] == id_b for u in blocked4))

        # Cleanup: unblock again
        await c.post(f"{BASE}/moderation/unblock", json={"blockedUserId": id_b}, headers=hdrs_a)
        print("\n  (Cleanup: unblocked User B)")

        print(f"\n{'='*50}")
        print(f"  RESULTS: {passed}/{passed + failed} tests passed")
        print("  All tests passed! \u2713" if failed == 0 else f"  {failed} test(s) FAILED \u2717")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(run())
