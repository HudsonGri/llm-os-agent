# Authentication System Specification
## Classroom Chatbot Access Control

### Overview
This document outlines the specifications for a secure access control system for a classroom AI chatbot built with Next.js. The system will provide a way to share access with students via URL parameters that set secure cookies, while keeping unauthorized users out and protecting admin functionality.

### Objectives
- Allow students to access the chatbot via a shared URL without requiring individual accounts
- Store access codes in a PostgreSQL database with expiration dates
- Enable access code revocation when needed
- Protect admin routes with a separate authentication system
- Track and audit access code usage

### Database Schema

#### Table: access_codes
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier |
| code | VARCHAR(64) NOT NULL | Unique access code string |
| expires_at | TIMESTAMP NOT NULL | When the code becomes invalid |
| revoked | BOOLEAN DEFAULT false | Flag to manually invalidate a code |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When the code was generated |
| last_used_at | TIMESTAMP | When the code was last used |
| description | TEXT | Optional notes about this code (e.g., "Spring 2025 Class") |

#### Table: sessions
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier |
| session_token | VARCHAR(64) UNIQUE NOT NULL | Session cookie value |
| access_code_id | INTEGER REFERENCES access_codes(id) | Which access code created this session |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When session started |
| expires_at | TIMESTAMP NOT NULL | When session expires |
| ip_address | VARCHAR(45) | Client IP address |
| user_agent | TEXT | Client browser info |

### Core Functionality

#### 1. Public Access Page
- Simple page with a form to enter an access code
- Alternatively, accepts access code via URL parameter (e.g., `/access?code=xxx`)
- Validates the code against the database
- If valid, sets a secure session cookie and redirects to the chatbot

#### 2. Session Verification
- Next.js middleware that checks for a valid session
- Validates the session against the database
- Ensures the associated access code is not expired or revoked
- Redirects to the access page if no valid session exists

#### 3. Admin Routes Protection
- Separate middleware for `/admin/*` and `/api/admin/*` routes
- Uses Supabase email verification for authentication (do not have to implement this, we will do this later) (for now just prevent anyone using /admin or /api/admin/* routes)
- Completely blocks access to these routes for non-admin users

#### 4. Admin Access Code Management
- API endpoints to:
  - Create new access codes with custom expiration dates
  - View existing access codes and their usage statistics
  - Revoke access codes
  - View active sessions

### API Endpoints

#### Public Endpoints
- `GET /access` - Displays the access form
- `POST /api/auth` - Validates access code and creates session

#### Protected Endpoints (require valid session)
- `GET /chatbot` - Main chatbot interface
- `POST /api/chat` - Chatbot messaging API

#### Admin Endpoints (require admin auth)
- `GET /admin` - Admin dashboard
- `GET /api/admin/access-codes` - List all access codes
- `POST /api/admin/access-codes` - Create new access code
- `PATCH /api/admin/access-codes` - Update access code (revoke/un-revoke)
- `GET /api/admin/sessions` - List active sessions
- `DELETE /api/admin/sessions/:id` - Terminate a specific session

### Security Requirements

#### Cookie Security
- HTTP-only flag must be set
- Secure flag required in production
- SameSite=Strict policy
- 7-day expiration for session cookies

#### Access Code Generation
- Must use cryptographically secure random generation (UUID v4)
- Minimum 64 characters in length for access codes
- Default 90-day expiration, configurable at creation time

#### Session Management
- New session created on each successful access code use
- IP address and user agent logged for audit purposes
- Sessions automatically expire after 7 days

### Implementation Notes
- Use parameterized queries for all database interactions
- Implement rate limiting on auth endpoints
- Log all authentication attempts, successful or failed
- Ensure detailed error logging for debugging
- Store all timestamps in UTC format

### Future Considerations
- Analytics dashboard for tracking usage patterns
- Individual student tracking (optional)
- IP-based restrictions for additional security
- Multi-factor authentication for admin access