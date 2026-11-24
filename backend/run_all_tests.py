"""
Unified test runner:
1. Waits for MongoDB (port 27017) and FastAPI (http://localhost:8000/api/health)
2. Runs test_block_unblock.py
3. Runs test_api.py
"""
import sys
import time
import subprocess
import httpx

BASE = "http://localhost:8000/api"

# Wait for backend to be ready
print("Checking backend readiness...")
ready = False
for attempt in range(15):
    try:
        r = httpx.get(f"{BASE}/health", timeout=2.0)
        if r.status_code == 200:
            ready = True
            print("  Backend is ready!")
            break
    except Exception:
        pass
    time.sleep(1)

if not ready:
    print("ERROR: Backend did not become ready in 15 seconds.")
    sys.exit(1)

# 1. Run block/unblock tests
print("\n" + "=" * 60)
print("  STEP 1: RUNNING BLOCK & UNBLOCK TESTS")
print("=" * 60)
res_block = subprocess.run([sys.executable, "e:/GitHub/SkillSwap_Project/backend/test_block_unblock.py"])
if res_block.returncode != 0:
    print(f"Block/Unblock tests failed with code {res_block.returncode}")
    sys.exit(res_block.returncode)

# 2. Run full test_api.py
print("\n" + "=" * 60)
print("  STEP 2: RUNNING COMPLETE test_api.py (86 assertions)")
print("=" * 60)
res_api = subprocess.run([sys.executable, "e:/GitHub/SkillSwap_Project/backend/test_api.py"])
if res_api.returncode != 0:
    print(f"test_api.py failed with code {res_api.returncode}")
    sys.exit(res_api.returncode)

print("\n" + "=" * 60)
print("  ALL TESTS (BLOCK/UNBLOCK + FULL API) COMPLETED SUCCESSFULLY!")
print("=" * 60)
