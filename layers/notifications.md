# Notification Layer - Documentation

The Notification Layer is responsible for aggregating and delivering updates to users. It is designed to handle high volumes of interactions (likes, follows, comments) without overwhelming the user with redundant alerts.

## Overview

Lumina uses an **Aggregation-First** approach. Instead of sending a separate notification for every single "Like," it groups them (e.g., "User A and 5 others liked your post"). This logic is encapsulated in the `apps/notifications` microservice.

- **Primary Responsibilities:** Notification aggregation, persistent storage, unread tracking, and real-time delivery triggers.
- **Service Link:** [apps/notifications](https://github.com/akshatV21/lumina/tree/master/apps/notifications)

## Features & Flow

### 1. The Producer-Consumer Pattern

Notifications are not created synchronously during an API request. Instead, they follow a distributed flow:

1. **Production:** When an event occurs (e.g., a follow or a like), a `NotificationProducer` (found in [Auth](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/notification-producer.service.ts) or [Posts](https://github.com/akshatV21/lumina/blob/master/apps/posts/src/notification-producer.service.ts) services) pushes a job to **BullMQ**.
2. **De-duplication:** To prevent multiple jobs for the same interaction, the Producer uses a Redis Set (`SADD`). If the actor is already in the set, a new job is not queued immediately, allowing the background worker to process them in batches.
3. **Processing:** The [NotificationProcessor](https://github.com/akshatV21/lumina/blob/master/apps/notifications/src/notifications.processor.ts) picks up the job.

### 2. Intelligent Aggregation

The core strength of the notification layer lies in the [process method](https://github.com/akshatV21/lumina/blob/master/apps/notifications/src/notifications.processor.ts#L22):

- **Actor Merging:** It retrieves new "actors" (users who performed the action) from Redis and merges them with existing actors stored in the database for that specific notification.
- **Actor Count:** It maintains an `actorsCount` to show "User A and X others...".
- **Metadata Context:** For likes and comments, it automatically fetches the thumbnail of the post to include in the notification metadata, providing visual context to the user.
- **Upsert Logic:** Using Prisma's `upsert`, it either creates a new notification or updates an existing one, marking it as `unread: false` so it pops back to the top of the user's feed.

### 3. Real-time Delivery (Pub/Sub)

Once a notification is persisted or updated in the database, the system must notify the user immediately if they are online.

- **Mechanism:** The processor publishes a message to a Redis channel (`REALTIME_CHANNEL`).
- **Payload:** Contains the `userId` and the serialized notification data.
- **Consumer:** The `rt-gateway` service listens to this channel and pushes the data to the user via WebSockets (explained in the next layer).

### 4. Consumption API

Users interact with their notifications through the [NotificationsController](https://github.com/akshatV21/lumina/blob/master/apps/notifications/src/notifications.controller.ts).

- **Paginated List:** Returns notifications with the latest actors and unread status.
- **Mark as Read:** A simple endpoint to clear all unread flags for the current user.

## Technical Choices & Advantages

### Redis as a Buffer

Using Redis Sets (`spop`) before processing allows the system to handle "bursty" traffic (e.g., a viral post getting thousands of likes). The worker pops all actors currently in the buffer and processes them as a single database update, significantly reducing DB write IOPS.

### Polymorphic Metadata

The `Notification` model includes a JSON `metadata` field. This allows the system to store different types of data without changing the schema:
- **Likes/Comments:** Stores the `thumb` URL of the post.
- **Follow Requests:** Stores actions like `accepted` or `rejected`.

## Interactions with other Layers

- **Auth & Posts Layers:** Act as **Producers**, identifying when a notification-worthy event has occurred.
- **Database Layer:** Stores the aggregated notification state.
- **Real-time Gateway:** Acts as the **Delivery Mechanism**, bridging the gap between the backend and the connected client.
- **Media Layer:** Provides the thumbnails used in notification metadata.
