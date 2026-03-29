# Real-time Gateway Layer - Documentation

The Real-time Gateway layer provides a persistent, bidirectional communication channel between the Lumina backend and its clients. It is the final link in the delivery chain for live updates like notifications.

## Overview

Implemented in the `apps/rt-gateway` microservice, this layer acts as a stateless "Post Office." It doesn't generate data itself but routes messages from internal services (via Redis) to specific connected users (via WebSockets).

- **Primary Responsibilities:** WebSocket connection management, real-time authentication, Redis Pub/Sub subscription, and targeted message broadcasting.
- **Service Link:** [apps/rt-gateway](https://github.com/akshatV21/lumina/tree/master/apps/rt-gateway)

## Features & Flow

### 1. Secure WebSocket Handshake

Every connection to the gateway must be authenticated to ensure that users only receive their own private data.

- **Gateway Implementation:** [gateway.service.ts](https://github.com/akshatV21/lumina/blob/master/apps/rt-gateway/src/gateway.service.ts)
- **Technical Flow:**
    1. The client initiates a connection to `/ws/gateway` using **Socket.io**.
    2. In the [handleConnection](https://github.com/akshatV21/lumina/blob/master/apps/rt-gateway/src/gateway.service.ts#L29) method, the gateway extracts the JWT from the handshake's `auth` object or headers.
    3. It reuses the [Authorize.validateToken](https://github.com/akshatV21/lumina/blob/master/libs/utils/src/auth/authorize.guard.ts#L36) utility from the shared library to verify the token.
    4. If valid, the socket joins a virtual room named `user_${userId}`. This room-based approach allows the server to target a specific user even if they are connected from multiple devices.

### 2. Redis Pub/Sub Bridge

Since Lumina is a microservice architecture, a notification might be generated in the `notifications` service, but the user is connected to the `rt-gateway` service. Redis Pub/Sub acts as the bridge between these services.

- **Subscriber Implementation:** [redis-subscriber.service.ts](https://github.com/akshatV21/lumina/blob/master/apps/rt-gateway/src/redis-subscriber.service.ts)
- **Technical Flow:**
    1. The [RedisSubscriberService](https://github.com/akshatV21/lumina/blob/master/apps/rt-gateway/src/redis-subscriber.service.ts#L17) subscribes to a global `REALTIME_CHANNEL` upon module initialization.
    2. When a message arrives (published by the [NotificationProcessor](https://github.com/akshatV21/lumina/blob/master/apps/notifications/src/notifications.processor.ts#L68)), the subscriber parses the JSON payload.
    3. It extracts the `userId`, the `event` name, and the `data`.
    4. It then instructs the WebSocket server to emit that event only to the room associated with that `userId`.

### 3. Connection Life-cycle

The gateway tracks connection and disconnection events, providing hooks for logging and potentially extending to "Online Status" tracking in the future.

- [handleDisconnect](https://github.com/akshatV21/lumina/blob/master/apps/rt-gateway/src/gateway.service.ts#L50): Cleanly logs when a user goes offline.

## Technical Choices & Advantages

### Socket.io vs. Raw WebSockets

| Choice | Why? |
| :--- | :--- |
| **Socket.io** | Provides automatic reconnection, heartbeats (ping/pong), and an easy-to-use "Rooms" abstraction out of the box. It handles the complexities of maintaining stable connections better than raw WebSockets. |
| **Statelessness** | The gateway service is designed to be stateless. You can spin up multiple instances behind a load balancer (with sticky sessions or a Redis adapter) to handle thousands of concurrent connections. |
| **Room-based Routing** | Using `user_${userId}` as a room identifier is a highly efficient way to handle "Private" messages. It abstracts away the need for the gateway to keep a manual mapping of `userId -> socketId`. |

## Interactions with other Layers

- **Auth Layer:** Uses the same JWT secret and validation logic to verify identities.
- **Notification Layer:** The primary source of messages for the gateway. The processor in the notification layer "publishes" the events that the gateway "subscribes" to.
- **Shared Utils:** Utilizes constants like `REALTIME_CHANNEL` to ensure consistency across microservices.

## Example Flow: Notification Delivery

1. **Auth Service:** User A follows User B.
2. **Notification Service:** Processor aggregates the follow and saves it to the DB.
3. **Redis:** Notification Service publishes `{ userId: 'UserB_ID', event: 'notification', data: { ... } }` to `REALTIME_CHANNEL`.
4. **RT-Gateway:** Subscriber receives the message.
5. **WebSocket:** RT-Gateway emits `'notification'` to all sockets in the `user_UserB_ID` room.
6. **Client:** User B's mobile/web app receives the event and shows a live toast or badge.
