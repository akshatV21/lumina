# Auth Layer - Documentation

The Auth layer is the foundational security and identity management system of the Lumina backend. It handles user onboarding, session management, and secures all other services using a centralized authentication mechanism.

## Overview

The authentication layer is implemented as a microservice in the `apps/auth` directory. It uses **NestJS** as the core framework, providing a robust and scalable architecture for managing user identities.

- **Primary Responsibilities:** User registration, password hashing, JWT-based login, and global route protection.
- **Service Link:** [apps/auth](https://github.com/akshatV21/lumina/tree/master/apps/auth)

## Features & Flow

### 1. User Registration

The registration process ensures that new users can securely create an account with a unique username and an encrypted password.

- **Endpoint:** `POST /auth/register`
- **Controller:** [auth.controller.ts](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/auth.controller.ts#L13)
- **Technical Flow:**
    1. The client sends a `RegisterDto` containing `username`, `password`, and `type`.
    2. The [AuthService.register](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/auth.service.ts#L20) method hashes the password using `bcrypt` with a salt factor of 10.
    3. The user is persisted in the database via **Prisma ORM**.
    4. **Nuance:** If the username already exists, Prisma throws a `P2002` (Unique Constraint) error, which is caught and mapped to a custom `DuplicateUsernameError`.

### 2. User Login & Session Management

Login validates user credentials and issues a JSON Web Token (JWT) for subsequent authenticated requests.

- **Endpoint:** `POST /auth/login`
- **Controller:** [auth.controller.ts](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/auth.controller.ts#L19)
- **Technical Flow:**
    1. The client provides credentials via `LoginDto`.
    2. The [AuthService.login](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/auth.service.ts#L30) method retrieves the user record by username.
    3. The provided password is compared against the stored hash using `bcrypt.compare`.
    4. If valid, a JWT is signed using a secret key (`AUTH_KEY`) with an expiration of 10 hours.
    5. The response includes the user details and the token.

### 3. Global Authentication Guard

Lumina employs a "Secure by Default" strategy. All routes are protected by the `Authorize` guard unless explicitly marked otherwise.

- **Guard Implementation:** [authorize.guard.ts](https://github.com/akshatV21/lumina/blob/master/libs/utils/src/auth/authorize.guard.ts)
- **Mechanism:**
    - The guard is registered as a global `APP_GUARD` in the [AuthModule](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/auth.module.ts#L30).
    - It uses **Reflector** to check for the `@Auth` decorator's metadata.
    - If a route is marked with `isOpen: true`, the guard allows access.
    - Otherwise, it extracts the JWT from the `Authorization: Bearer <token>` header, validates it, and attaches the payload to the request object.

## Technical Choices & Advantages

### Packages

| Package | Purpose | Why chosen? |
| :--- | :--- | :--- |
| **bcrypt** | Password Hashing | Industry standard for secure hashing with built-in salt handling to prevent rainbow table attacks. |
| **jsonwebtoken** | Token management | Standard for stateless authentication in microservices, allowing other services to verify identity without a central DB check (though currently Lumina uses a shared DB/secret approach). |
| **class-validator** | Data Integrity | Ensures that all incoming DTOs match the required schema (e.g., strong passwords, non-empty usernames) before reaching the business logic. |
| **Prisma** | ORM | Provides type-safe database access and easy-to-use migration tools, reducing the overhead of writing raw SQL. |

### Architectural Nuances

- **Custom Decorators:** The use of `@Auth()` and `@AuthUser()` decorators simplifies the development process. Developers can easily protect routes or inject the current user into controller methods without repetitive code.
    - [Auth Decorator](https://github.com/akshatV21/lumina/blob/master/libs/utils/src/auth/auth.decorator.ts)
    - [AuthUser Decorator](https://github.com/akshatV21/lumina/blob/master/libs/utils/src/auth/auth-user.decorator.ts)
- **Error Abstraction:** By mapping Prisma errors and bcrypt results to custom exception classes (e.g., `InvalidCredentialsError`, `DuplicateUsernameError`), the service maintains clean separation between infrastructure and business logic.
- **Statelessness:** The use of JWTs allows the system to remain stateless at the HTTP level, facilitating easier scaling and potentially moving to a decentralized auth verification in the future.

## Interactions with other Layers

While Auth is primarily self-contained for registration and login, it provides the identity context (user ID) used by all other layers:
- **Media Processing:** To know which user is uploading an avatar or post.
- **User Relations:** To identify who is following whom.
- **Notifications:** To route alerts to the correct user.

The identity established here flows through the entire system via the `request.user` object populated by the `Authorize` guard.
