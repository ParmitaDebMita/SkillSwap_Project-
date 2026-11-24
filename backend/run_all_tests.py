"""
Self-contained unified test runner:
1. Runs JWT secret security tests
2. Ensures MongoDB and FastAPI backend are running
3. Runs test_block_unblock.py (20 tests)
4. Runs test_api.py (90 tests)
5. Exits cleanly with code 0
"""
import os
import sys
import time
import subprocess
import httpx

BASE = "http://localhost:8000/api"

# Step 0: JWT secret enforcement test
print("\n" + "=" * 60)
print("  STEP 0: RUNNING JWT SECRET SECURITY TESTS")
print("=" * 60)
res_jwt = subprocess.run([sys.executable, "e:/GitHub/SkillSwap_Project/backend/test_jwt_secret.py"])
if res_jwt.returncode != 0:
    print(f"JWT secret security tests failed with code {res_jwt.returncode}")
    sys.exit(res_jwt.returncode)

# Check if backend is already listening
backend_proc = None
try:
    r = httpx.get(f"{BASE}/health", timeout=1.0)
    backend_ready = (r.status_code == 200)
except Exception:
    backend_ready = False

if not backend_ready:
    print("\nStarting uvicorn backend process...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"],
        cwd="e:/GitHub/SkillSwap_Project/backend",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    # Wait for readiness
    for _ in range(15):
        time.sleep(1)
        try:
            r = httpx.get(f"{BASE}/health", timeout=1.0)
            if r.status_code == 200:
                backend_ready = True
                print("  Backend is ready!")
                break
        except Exception:
            pass

    if not backend_ready:
        print("ERROR: Backend failed to start.")
        if backend_proc:
            backend_proc.kill()
        sys.exit(1)
else:
    print("\nBackend is already running and ready!")

try:
    # Step 1: Run block/unblock tests
    print("\n" + "=" * 60)
    print("  STEP 1: RUNNING BLOCK & UNBLOCK TESTS")
    print("=" * 60)
    res_block = subprocess.run([sys.executable, "e:/GitHub/SkillSwap_Project/backend/test_block_unblock.py"])
    if res_block.returncode != 0:
        print(f"Block/Unblock tests failed with code {res_block.returncode}")
        sys.exit(res_block.returncode)

    # Step 2: Run full test_api.py
    print("\n" + "=" * 60)
    print("  STEP 2: RUNNING COMPLETE test_api.py")
    print("=" * 60)
    res_api = subprocess.run([sys.executable, "e:/GitHub/SkillSwap_Project/backend/test_api.py"])
    if res_api.returncode != 0:
        print(f"test_api.py failed with code {res_api.returncode}")
        sys.exit(res_api.returncode)

    print("\n" + "=" * 60)
    print("  ALL VERIFICATION SUITES COMPLETED SUCCESSFULLY!")
    print("=" * 60)

finally:
    if backend_proc:
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
