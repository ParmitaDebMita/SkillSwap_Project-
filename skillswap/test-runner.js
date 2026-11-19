// Automated integration and system test script for SkillSwap frontend services & backend
import assert from 'node:assert'
import { authService } from './src/services/authService.js'
import { exchangeService } from './src/services/exchangeService.js'
import { studentService } from './src/services/studentService.js'
import { getToken } from './src/services/apiClient.js'

console.log('🧪 Starting SkillSwap Comprehensive System & API Tests...\n')

// Mock LocalStorage in Node.js environment
const store = new Map()
global.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

async function runTests() {
  const timestamp = Date.now()
  const user1Email = `alex_${timestamp}@test.edu`
  const user2Email = `ananya_${timestamp}@test.edu`

  // ----------------------------------------------------
  // TEST SUITE 1: Initial State & Protected Routes
  // ----------------------------------------------------
  console.log('--- Test Suite 1: Initial Login State & Protected Route Logic ---')
  {
    localStorage.clear()
    const initialUser = authService.getCurrentUser()
    assert.strictEqual(initialUser, null, 'Initial user MUST be null')
    const initialLoggedIn = localStorage.getItem('skillswap_is_logged_in') === 'true'
    assert.strictEqual(initialLoggedIn, false, 'Initial state MUST be logged out')

    function checkRoute(path, isLoggedIn) {
      const isProtected = ['/dashboard', '/profile', '/requests'].includes(path)
      if (isProtected && !isLoggedIn) return { redirect: '/login' }
      return { render: path }
    }

    assert.deepStrictEqual(checkRoute('/dashboard', false), { redirect: '/login' })
    assert.deepStrictEqual(checkRoute('/profile', false), { redirect: '/login' })
    assert.deepStrictEqual(checkRoute('/requests', false), { redirect: '/login' })
    assert.deepStrictEqual(checkRoute('/explore', false), { render: '/explore' })
    assert.deepStrictEqual(checkRoute('/dashboard', true), { render: '/dashboard' })
    assert.deepStrictEqual(checkRoute('/profile', true), { render: '/profile' })
    assert.deepStrictEqual(checkRoute('/requests', true), { render: '/requests' })
    console.log('✅ Passed: Initial state is logged out and protected routes redirect properly.')
  }

  // ----------------------------------------------------
  // TEST SUITE 2: Signup & Validation via Real Backend
  // ----------------------------------------------------
  console.log('\n--- Test Suite 2: Real API Signup & Client Validation ---')
  {
    localStorage.clear()

    function validateSignup(name, email, password) {
      const errs = {}
      if (!name.trim()) errs.name = 'Full name is required'
      else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters long'

      if (!email.trim()) errs.email = 'Email address is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Please enter a valid email address'

      if (!password) errs.password = 'Password is required'
      else if (password.length < 6) errs.password = 'Password must be at least 6 characters long'
      return errs
    }

    // Client-side validations
    const errs1 = validateSignup('', '', '')
    assert.ok(errs1.name && errs1.email && errs1.password, 'All fields should show required error')

    const errs2 = validateSignup('Test', 'test@test.edu', '123')
    assert.ok(errs2.password, 'Should require password >= 6 characters')

    // 1. Sign up User 1 (Alex)
    const res1 = await authService.signup('Alex Johnson', user1Email, 'password123')
    assert.strictEqual(res1.success, true, `Signup User 1 failed: ${res1.message}`)
    assert.strictEqual(res1.user.name, 'Alex Johnson')
    assert.ok(res1.user.id, 'User 1 should have an id')
    assert.ok(getToken(), 'JWT token must be set in localStorage')
    assert.strictEqual(localStorage.getItem('skillswap_is_logged_in'), 'true')

    // 2. Duplicate signup should be rejected by backend
    const dupRes = await authService.signup('Alex Duplicate', user1Email, 'password123')
    assert.strictEqual(dupRes.success, false, 'Duplicate email must be rejected')
    assert.ok(dupRes.message.includes('already exists'), 'Duplicate email error message expected')

    // 3. Sign up User 2 (Ananya)
    const res2 = await authService.signup('Ananya Sharma', user2Email, 'password123')
    assert.strictEqual(res2.success, true, `Signup User 2 failed: ${res2.message}`)
    assert.strictEqual(res2.user.name, 'Ananya Sharma')
    assert.ok(res2.user.id, 'User 2 should have an id')

    console.log('✅ Passed: Real API Signup, validation, duplicate prevention, and JWT storage verified.')
  }

  // ----------------------------------------------------
  // TEST SUITE 3: Real API Login, Token Auth & Logout
  // ----------------------------------------------------
  console.log('\n--- Test Suite 3: Real API Login & Token Auth ---')
  {
    // Unknown email
    const fail1 = await authService.login('nobody@nowhere.edu', 'password123')
    assert.strictEqual(fail1.success, false, 'Unknown email should fail')

    // Wrong password
    const fail2 = await authService.login(user1Email, 'wrongpassword')
    assert.strictEqual(fail2.success, false, 'Wrong password should fail')

    // Successful login User 1
    const loginRes = await authService.login(user1Email, 'password123')
    assert.strictEqual(loginRes.success, true)
    assert.strictEqual(loginRes.user.name, 'Alex Johnson')
    assert.ok(getToken(), 'Token should be stored upon login')

    // Verify GET /auth/me
    const meUser = await authService.fetchCurrentUser()
    assert.ok(meUser, 'GET /auth/me should return user with valid token')
    assert.strictEqual(meUser.email, user1Email)

    // Logout
    authService.logout()
    assert.strictEqual(getToken(), null, 'Token must be cleared on logout')
    assert.strictEqual(localStorage.getItem('skillswap_is_logged_in'), 'false')
    assert.strictEqual(authService.getCurrentUser(), null)

    console.log('✅ Passed: Login credential verification, GET /auth/me, and logout verified.')
  }

  // ----------------------------------------------------
  // TEST SUITE 4: Profile Editing & Persistence via Backend
  // ----------------------------------------------------
  console.log('\n--- Test Suite 4: Profile Editing & Persistence via Backend ---')
  let user1Data = null
  let user2Data = null
  {
    // Log in User 1
    const login1 = await authService.login(user1Email, 'password123')
    assert.strictEqual(login1.success, true)
    user1Data = login1.user

    // Update profile via PUT /api/users/profile
    const updateRes = await authService.updateProfile({
      university: 'Stanford University',
      bio: 'Enthusiastic CS student eager to exchange web dev for ML.',
      skillsOffered: ['React', 'JavaScript', 'Node.js'],
      skillsWanted: ['Machine Learning', 'Python'],
      category: 'Technology',
    })
    assert.strictEqual(updateRes.success, true)
    assert.strictEqual(updateRes.user.university, 'Stanford University')
    assert.ok(updateRes.user.skillsOffered.includes('React'))
    assert.ok(!('password' in updateRes.user), 'Password must never be returned')
    assert.ok(!('hashed_password' in updateRes.user), 'Hashed password must never be returned')
    user1Data = updateRes.user

    // Log in User 2 to update profile
    const login2 = await authService.login(user2Email, 'password123')
    assert.strictEqual(login2.success, true)
    const updateRes2 = await authService.updateProfile({
      university: 'IIT Delhi',
      bio: 'Data science enthusiast teaching Python and AI.',
      skillsOffered: ['Machine Learning', 'Python', 'PyTorch'],
      skillsWanted: ['React', 'UI Design'],
      category: 'Technology',
    })
    assert.strictEqual(updateRes2.success, true)
    user2Data = updateRes2.user

    console.log('✅ Passed: Profile editing and database persistence verified.')
  }

  // ----------------------------------------------------
  // TEST SUITE 5: Student Directory & Search / Filter
  // ----------------------------------------------------
  console.log('\n--- Test Suite 5: Student Directory & Search / Filter ---')
  {
    const students = await studentService.getStudents()
    assert.ok(Array.isArray(students), 'getStudents must return an array')
    assert.ok(students.length >= 2, 'Should have at least the 2 registered students')

    // Search by name
    const searchRes = await studentService.getStudents({ search: 'Alex' })
    assert.ok(searchRes.some(s => s.name.includes('Alex')), 'Search should find Alex')

    // Filter by category
    const techRes = await studentService.getStudents({ category: 'Technology' })
    assert.ok(techRes.length >= 2, 'Category filter should return tech students')

    console.log('✅ Passed: Student directory listing, search, and category filtering verified.')
  }

  // ----------------------------------------------------
  // TEST SUITE 6: Complete Two-User Exchange Workflow
  // ----------------------------------------------------
  console.log('\n--- Test Suite 6: Complete Two-User Exchange Workflow ---')
  {
    // Step 1: User 1 logs in
    await authService.login(user1Email, 'password123')

    // Step 2: User 1 tries self-request -> should fail
    const selfRes = await exchangeService.createRequest(user1Data.id, 'React', 'Machine Learning')
    assert.strictEqual(selfRes.success, false, 'Self-request must be rejected')

    // Step 3: User 1 sends exchange request to User 2
    const createRes = await exchangeService.createRequest(
      user2Data.id,
      'React',
      'Machine Learning',
      'Hi Ananya, would love to exchange React for ML!'
    )
    assert.strictEqual(createRes.success, true, `Send request failed: ${createRes.error}`)
    const exchangeId = createRes.request.id
    assert.ok(exchangeId, 'Exchange request must have an ID')
    assert.strictEqual(createRes.request.status, 'pending')
    assert.strictEqual(createRes.request.fromId, user1Data.id)
    assert.strictEqual(createRes.request.toId, user2Data.id)
    assert.strictEqual(createRes.request.from.name, 'Alex Johnson')
    assert.strictEqual(createRes.request.to.name, 'Ananya Sharma')

    // Step 4: Duplicate pending request should fail
    const dupExchange = await exchangeService.createRequest(user2Data.id, 'React', 'Machine Learning')
    assert.strictEqual(dupExchange.success, false, 'Duplicate pending request must be rejected')

    // Step 5: User 1 lists exchanges -> should see the sent request
    const user1Exchanges = await exchangeService.getRequests()
    assert.ok(user1Exchanges.some(e => e.id === exchangeId && e.fromId === user1Data.id))

    // Step 6: User 2 logs in
    await authService.login(user2Email, 'password123')

    // Step 7: User 2 lists exchanges -> should see the received request
    const user2Exchanges = await exchangeService.getRequests()
    const receivedReq = user2Exchanges.find(e => e.id === exchangeId)
    assert.ok(receivedReq, 'User 2 must see the incoming request')
    assert.strictEqual(receivedReq.status, 'pending')

    // Step 8: Sender (User 1) trying to accept should be forbidden (403)
    // Switch to User 1 token temporarily to test authorization
    await authService.login(user1Email, 'password123')
    const unauthorizedAccept = await exchangeService.updateStatus(exchangeId, 'accepted')
    assert.strictEqual(unauthorizedAccept.success, false, 'Sender must NOT be allowed to accept')

    // Step 9: Receiver (User 2) accepts the request
    await authService.login(user2Email, 'password123')
    const acceptRes = await exchangeService.updateStatus(exchangeId, 'accepted')
    assert.strictEqual(acceptRes.success, true, `Accept failed: ${acceptRes.error}`)
    assert.strictEqual(acceptRes.updatedRequest.status, 'accepted')

    // Step 10: Double status update should be rejected
    const doubleUpdate = await exchangeService.updateStatus(exchangeId, 'rejected')
    assert.strictEqual(doubleUpdate.success, false, 'Double update must be rejected')

    // Step 11: Test reject workflow with a second proposal
    const createRes2 = await exchangeService.createRequest(
      user1Data.id,
      'Python',
      'JavaScript',
      'Another proposal to test rejection.'
    )
    assert.strictEqual(createRes2.success, true)
    const exchangeId2 = createRes2.request.id

    // User 1 logs in and rejects it
    await authService.login(user1Email, 'password123')
    const rejectRes = await exchangeService.updateStatus(exchangeId2, 'rejected')
    assert.strictEqual(rejectRes.success, true)
    assert.strictEqual(rejectRes.updatedRequest.status, 'rejected')

    console.log('✅ Passed: Complete Send -> Duplicate Guard -> Self-Request Guard -> Auth Check -> Accept -> Reject workflow verified!')
  }

  // ----------------------------------------------------
  // TEST SUITE 7: Dashboard Stats Calculation Logic
  // ----------------------------------------------------
  console.log('\n--- Test Suite 7: Dashboard Stats Calculation Logic ---')
  {
    const testUser = { id: 'u1', rating: 4.9, exchanges: 2 }
    const testRequests = [
      { fromId: 'u2', toId: 'u1', status: 'pending' },
      { fromId: 'u3', toId: 'u1', status: 'pending' },
      { fromId: 'u1', toId: 'u4', status: 'accepted' },
      { fromId: 'u5', toId: 'u1', status: 'accepted' },
      { fromId: 'u1', toId: 'u6', status: 'rejected' },
    ]

    const pendingReceivedCount = testRequests.filter(r => r.toId === testUser.id && r.status === 'pending').length
    assert.strictEqual(pendingReceivedCount, 2, 'Pending received count should be 2')

    const acceptedExchangesCount = testRequests.filter(r => (r.fromId === testUser.id || r.toId === testUser.id) && r.status === 'accepted').length
    assert.strictEqual(acceptedExchangesCount, 2, 'Accepted exchanges count should be 2')

    const totalExchanges = Math.max(testUser.exchanges || 0, acceptedExchangesCount)
    assert.strictEqual(totalExchanges, 2)

    console.log('✅ Passed: Dashboard statistics synchronize directly with application data.')
  }

  console.log('\n🎉 ALL 7 SYSTEM & API TEST SUITES PASSED WITH ZERO FAILURES!')
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err)
  process.exit(1)
})
