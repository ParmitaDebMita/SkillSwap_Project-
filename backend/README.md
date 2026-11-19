# SkillSwap Backend

FastAPI + MongoDB backend for the SkillSwap student skill exchange platform.

## Prerequisites

- **Python 3.11+** — [Download from python.org](https://www.python.org/downloads/) *(not the Microsoft Store stub)*
- **MongoDB 8.x** — already installed at `C:\Program Files\MongoDB\Server\8.3\bin\`
- **Node.js / Vite frontend** running at `http://localhost:5173`

> [!IMPORTANT]
> Install Python from **python.org** (not the Microsoft Store), and tick **"Add Python to PATH"** during installation.

---

## Project Structure

```
backend/
├── main.py                   # FastAPI app entry point
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template — copy to .env
├── test_api.py               # Integration test script
└── app/
    ├── config.py             # Settings (loads from .env)
    ├── database.py           # Motor MongoDB connection + indexes
    ├── auth/
    │   ├── router.py         # POST /api/auth/signup, /login, GET /me
    │   ├── models.py         # Pydantic schemas + doc_to_user helper
    │   └── utils.py          # bcrypt, JWT helpers, get_current_user dep
    ├── users/
    │   ├── router.py         # PUT /api/users/profile, GET /api/students
    │   └── models.py         # ProfileUpdateRequest schema
    └── exchanges/
        ├── router.py         # GET/POST /api/exchanges, PATCH /{id}/status
        └── models.py         # Exchange schemas + doc_to_exchange helper
```

---

## Quick Start

### 1. Start MongoDB

Open a terminal and run:

```powershell
& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath C:\data\db
```

*(Create `C:\data\db` first if it doesn't exist: `New-Item -ItemType Directory C:\data\db`)*

### 2. Set up the backend

```powershell
cd E:\GitHub\SkillSwap_Project\backend

# Create a virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure environment

The `.env` file is already created with defaults. Edit it to change the JWT secret:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=skillswap
JWT_SECRET_KEY=skillswap-super-secret-jwt-key-2024-change-in-prod
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
FRONTEND_ORIGIN=http://localhost:5173
```

### 4. Start the server

```powershell
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health check:** http://localhost:8000/api/health

### 5. Run integration tests

With the server running, open a second terminal:

```powershell
cd E:\GitHub\SkillSwap_Project\backend
.\venv\Scripts\Activate.ps1
python test_api.py
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register new account |
| POST | `/api/auth/login` | — | Login, receive JWT |
| GET | `/api/auth/me` | Bearer | Current user profile |

**Signup / Login response:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "avatar": "🎓",
    "bio": "...",
    "university": "...",
    "skillsOffered": ["Python"],
    "skillsWanted": ["React"],
    "category": "Technology",
    "rating": 5.0,
    "exchanges": 0
  }
}
```

### Users & Students

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/users/profile` | Bearer | Update profile + skills |
| GET | `/api/students` | — | Browse all students |
| GET | `/api/students?search=python&category=Technology&page=1&limit=20` | — | Search + filter |

### Exchanges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/exchanges` | Bearer | List sent + received |
| POST | `/api/exchanges` | Bearer | Send a new request |
| PATCH | `/api/exchanges/{id}/status` | Bearer | Accept or reject |

**Create exchange body:**
```json
{
  "toId": "user-object-id",
  "skillOffered": "Python",
  "skillWanted": "React",
  "message": "Let's swap skills!"
}
```

**Update status body:**
```json
{ "status": "accepted" }
```

---

## Security

- Passwords hashed with **bcrypt** via `passlib` — never stored plain-text
- **JWT tokens** (HS256) expire after 7 days (configurable)
- Tokens read from `Authorization: Bearer <token>` header
- Password / hashed_password **never** returned in any API response
- Only the **receiver** can accept or reject an exchange request (HTTP 403 otherwise)
- Duplicate email registrations rejected (HTTP 400)
- Duplicate pending exchanges between same pair rejected (HTTP 400)
- Self-requests rejected (HTTP 400)

---

## MongoDB Collections

### `users`

```
{
  _id: ObjectId,
  name: string,
  email: string (unique index),
  hashed_password: string,
  avatar: string,
  bio: string,
  university: string,
  skillsOffered: [string],
  skillsWanted: [string],
  category: string,
  rating: float,
  exchanges: int
}
```

### `exchanges`

```
{
  _id: ObjectId,
  from_id: string,         // sender user _id as string
  to_id: string,           // receiver user _id as string
  from: { id, name, avatar, university, email },
  to:   { id, name, avatar, university, email },
  skillOffered: string,
  skillWanted: string,
  status: "pending"|"accepted"|"rejected",
  date: "YYYY-MM-DD",
  message: string,
  created_at: datetime
}
```

**Indexes:**
- `users.email` — unique
- `exchanges.from_id`
- `exchanges.to_id`
- `exchanges.(from_id, to_id, status)` — compound

---

## Connecting to the Frontend

The frontend currently runs in **demo/localStorage mode**. To switch to the real backend:

1. The `src/services/apiClient.js` already has `apiRequest()` wired to `http://localhost:8000/api`.
2. Update each service (`authService.js`, `exchangeService.js`, `studentService.js`) to call `apiRequest()` instead of localStorage.
3. Store the JWT token returned from login in `skillswap_auth_token` localStorage key — the `apiClient` reads it automatically.

> [!NOTE]
> The frontend is designed for seamless backend integration. The `apiRequest()` utility handles Bearer token injection, error formatting, and JSON parsing to match FastAPI's response shapes.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | `skillswap` | MongoDB database name |
| `JWT_SECRET_KEY` | *(set this!)* | Secret for signing JWT tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | `10080` | Token lifetime (7 days) |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
