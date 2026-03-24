# Project Context for Whitepaper Generation

**Origin & Goal:** Initially started as a Social Media Clone to master large-scale media processing (avatars, posts, asset storage).
**System Evolution:** Evolved into a fully decoupled, scalable microservices architecture. 

**Tech Stack:**
* Backend Framework: NestJS
* Database & File Storage: Supabase
* Message Broker & Cache: Redis (Pub/Sub)
* Queue Processing: BullMQ

**Key Architectural Achievements to Highlight:**
1. **Unified Real-Time Gateway:** Centralized WebSocket connections into a single gateway. Messaging and Notification services route through this, preventing client-side connection bloat and saving server resources.
2. **Event-Driven Communication:** Services communicate seamlessly via Redis Pub/Sub, ensuring decoupling.
3. **Asynchronous Heavy Lifting:** Heavy processes (like media handling) are offloaded to queues using BullMQ.
4. **Frictionless Scalability:** The microservices are stateless and container-ready. Scaling is as simple as increasing replicas—no complex configuration changes required.
