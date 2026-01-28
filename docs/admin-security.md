# Admin Authentication Security

## Overview

The admin panel uses a two-layer authentication system:

1. **Middleware Layer** - Blocks unauthenticated requests at the edge before they reach the application
2. **Server Action Layer** - Defense-in-depth guards on every admin server action

## Environment Variables

```bash
# Required in production
ADMIN_PASSWORD=<strong-password>
ADMIN_SESSION_SECRET=<32+ character random string>
```

### Generating a Secure Session Secret

```bash
openssl rand -base64 32
```

## Authentication Flow

### Login Process

1. User submits password via `/admin/login`
2. `verifyAdminPassword()` performs timing-safe comparison
3. On success, `setAdminSessionCookie()` creates an HMAC-signed session token
4. User is redirected to the requested admin page

### Session Token Format

```
payload.signature
```

- **Payload**: Base64URL-encoded JSON containing `{ iss, iat, exp }`
- **Signature**: HMAC-SHA256 of the payload using `ADMIN_SESSION_SECRET`

### Session Validation

1. Middleware extracts the session cookie
2. Token is split into payload and signature
3. Signature is verified using HMAC-SHA256
4. Token expiration is checked (24-hour default)
5. Invalid sessions redirect to `/admin/login?next=<original-path>`

## Security Features

### Edge-Compatible Cryptography

Uses WebCrypto API (`crypto.subtle`) for HMAC operations, enabling session verification in Edge Runtime (middleware).

### Timing-Safe Password Comparison

The `verifyAdminPassword()` function uses constant-time string comparison to prevent timing attacks:

```typescript
// Compares character-by-character with XOR, then reduces
// Total time is constant regardless of match position
```

### Defense-in-Depth

Every admin server action includes `await requireAdmin()` as its first line:

```typescript
export async function updatePlace(id: string, formData: FormData) {
  await requireAdmin();
  // ... rest of the action
}
```

This ensures protection even if middleware is bypassed (e.g., direct server action calls).

## Cookie Configuration

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `httpOnly` | `true` | Prevents JavaScript access |
| `secure` | `true` (prod) | HTTPS only in production |
| `sameSite` | `strict` | CSRF protection |
| `path` | `/admin` | Only sent to admin routes |
| `maxAge` | `86400` | 24-hour session lifetime |

## Development Mode

In development without `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET`, login is auto-approved. This allows local development without environment configuration.

**Never deploy without these environment variables set.**

## Protected Routes

All routes under `/admin/*` except `/admin/login` require authentication:

- `/admin` - Dashboard
- `/admin/prayer-points/*` - Prayer points management
- `/admin/places/*` - Places management
- `/admin/situations/*` - Situations management
- `/admin/professions/*` - Professions management
- `/admin/travel-itineraries/*` - Travel itineraries management

## Protected Server Actions

Each admin action file includes the `requireAdmin()` guard:

- `app/admin/prayer-points/[id]/actions.ts` - update, publish, unpublish, delete
- `app/admin/prayer-points/new/actions.ts` - create
- `app/admin/places/[id]/actions.ts` - update, publish, unpublish, delete
- `app/admin/places/new/actions.ts` - create
- `app/admin/situations/[id]/actions.ts` - update, publish, unpublish, delete
- `app/admin/situations/new/actions.ts` - create
- `app/admin/professions/[id]/actions.ts` - update, publish, unpublish, delete
- `app/admin/professions/new/actions.ts` - create
- `app/admin/travel-itineraries/[id]/actions.ts` - update, publish, unpublish, delete
- `app/admin/travel-itineraries/new/actions.ts` - create

## Architecture

```
Request to /admin/*
        │
        ▼
┌─────────────────────┐
│    middleware.ts    │
│  (Edge Runtime)     │
│                     │
│  1. Check cookie    │
│  2. Verify HMAC     │
│  3. Check expiry    │
└─────────┬───────────┘
          │
          ▼ (authenticated)
┌─────────────────────┐
│   Admin Page/API    │
│                     │
│  Server Component   │
│  or Server Action   │
└─────────┬───────────┘
          │
          ▼ (if server action)
┌─────────────────────┐
│  requireAdmin()     │
│  (Defense-in-depth) │
│                     │
│  Re-validates       │
│  session token      │
└─────────────────────┘
```

## Logout

Calling `adminLogout()` clears the session cookie and redirects to `/admin/login`.

## Security Checklist

- [ ] `ADMIN_PASSWORD` is set and strong (16+ characters, mixed case, numbers, symbols)
- [ ] `ADMIN_SESSION_SECRET` is set and random (32+ characters)
- [ ] HTTPS is enforced in production
- [ ] Session cookies use `secure`, `httpOnly`, `sameSite=strict`
- [ ] All admin server actions have `await requireAdmin()` guard
- [ ] No sensitive data logged or exposed in error messages
