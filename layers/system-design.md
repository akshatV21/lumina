# Lumina: System Design & Architecture Paper

## 1. Introduction
Lumina is a modern, high-performance social media backend designed for scalability, responsiveness, and rich media experiences. This paper details the architectural decisions and infrastructure choices that enable a seamless flow from user interaction to background processing and real-time delivery.

## 2. Architectural Pattern: Distributed Microservices
Lumina is built using a **Microservices Architecture** powered by the **NestJS** framework. Each core domain (Auth, Media, Notifications, RT-Gateway, Posts) is an independent service.

### Benefits of this Approach:
- **Independent Scalability:** The `media` service, which is CPU-intensive (FFmpeg/Sharp), can be scaled independently of the `auth` service.
- **Fault Isolation:** A failure in the `notifications` worker does not prevent users from logging in or uploading posts.
- **Technological Agility:** While all services currently use Node.js/TypeScript, the modular nature allows for future services to be written in Go or Rust if performance requirements dictate.

## 3. Infrastructure Stack

### 3.1 Reverse Proxy & API Gateway (Nginx)
[Nginx](https://github.com/akshatV21/lumina/blob/master/nginx.conf) acts as the entry point for all traffic. It handles:
- **Path-based Routing:** Routing `/api/auth` to the auth service, `/ws/gateway` to the real-time gateway, etc.
- **CORS Management:** Centralized handling of cross-origin requests.
- **WebSocket Upgrades:** Managing the transition from HTTP to persistent WS connections.

### 3.2 Database Layer (PostgreSQL & Prisma)
- **PostgreSQL:** Chosen for its ACID compliance and robust support for relational data (follows, posts, comments).
- **Prisma ORM:** Provides a type-safe interface to the database. It enables complex features like **Transactional Updates** (e.g., updating a post status and incrementing user post counts simultaneously) with high reliability.

### 3.3 Messaging & State (Redis)
Redis serves three critical roles in the Lumina ecosystem:
1. **Job Queue (BullMQ):** Managing background tasks for media processing and notification aggregation.
2. **Pub/Sub:** A low-latency bridge between microservices and the Real-time Gateway.
3. **De-duplication Buffer:** Using Redis Sets to prevent redundant notification jobs.

### 3.4 Object Storage (Supabase Storage)
Instead of storing binary data in the database, Lumina uses Supabase (S3-compatible) storage. This allows for:
- **Offloaded Uploads:** Clients upload directly to Supabase via signed URLs, saving backend bandwidth.
- **CDN Integration:** Faster asset delivery to end-users.

## 4. Communication Patterns

### 4.1 Synchronous (REST)
Used for immediate request-response cycles like user login or profile fetching. These are routed through Nginx directly to the relevant service.

### 4.2 Asynchronous (Job Queues)
Crucial for non-blocking operations. When a user uploads a video, the request returns immediately while the `media` worker processes the file in the background.
- [Post Processing Logic](https://github.com/akshatV21/lumina/blob/master/apps/media/src/processors/post.processor.ts)

### 4.3 Real-time (Redis Pub/Sub -> WebSockets)
Cross-service events follow a "Fan-out" pattern:
1. A service (e.g., Notifications) publishes an event to Redis.
2. The `rt-gateway` service, which maintains thousands of persistent WebSocket connections, receives the event from Redis.
3. The gateway "emits" the event to the specific user's socket room.

## 5. Deployment Strategy (Docker)
The entire system is containerized using **Docker**. The [docker-compose.yml](https://github.com/akshatV21/lumina/blob/master/docker-compose.yml) file defines the network and environment for all services, ensuring:
- **Environment Parity:** The system runs identically on a developer's machine and in production.
- **Service Discovery:** Services communicate using container names (e.g., `http://auth:3000`) rather than brittle IP addresses.

## 6. Resilience & Performance
- **Transactional Integrity:** Use of Prisma transactions ensures that data never becomes inconsistent during multi-step updates.
- **Exponential Backoff:** Background jobs (media/notifications) are configured with retries and exponential backoff to handle transient failures.
- **WebP & Blurhash:** Visual performance is optimized by converting all images to WebP and generating Blurhashes to improve the "perceived" speed of the application.

## 7. Conclusion
The Lumina system design prioritizes **Decoupling** and **Efficiency**. By separating heavy processing from the request-response cycle and using a robust messaging bridge for real-time updates, Lumina provides a scalable foundation capable of supporting a growing social media community.
