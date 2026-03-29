# User Relations Layer - Documentation

The User Relations layer manages the social graph of the Lumina platform, handling connections between users, follow requests, and profile visibility.

## Overview

User relations are integrated within the `apps/auth` microservice under the `user/` subdirectory. This allows the system to tightly couple identity with relationship management, ensuring efficient lookups for profile details and connection status.

- **Primary Responsibilities:** Following/Unfollowing, managing follow requests (Accept/Reject), profile retrieval, and account type management (Public vs. Private).
- **Service Link:** [apps/auth/src/user](https://github.com/akshatV21/lumina/tree/master/apps/auth/src/user)

## Features & Flow

### 1. Follow Mechanism (Public vs. Private)

Lumina supports both public and private accounts, which significantly alters the follow flow.

- **Endpoint:** `POST /user/follow`
- **Controller:** [user.controller.ts](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.controller.ts#L45)
- **Technical Flow:**
    1. The [UserService.follow](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.service.ts#L84) method checks if the target user exists and the account type.
    2. **Public Account:** A relationship is created with `status: 'accepted'`. Follower and Following counts are incremented immediately within a **Prisma Transaction**.
    3. **Private Account:** A relationship is created with `status: 'pending'`. No counts are updated at this stage.
    4. **Notification:** Depending on the status, a `followed` or `requested` event is queued via the [NotificationProducer](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/notification-producer.service.ts).

### 2. Follow Request Management

For private accounts, connections must be manually approved.

- **Endpoints:** `POST /user/accept` and `POST /user/reject`
- **Technical Flow (Accept):**
    1. The [UserService.accept](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.service.ts#L182) method updates the relationship status to `accepted`.
    2. It increments the `followerCount` of the target and `followingCount` of the requester in a transaction.
    3. It updates the existing "requested" notification metadata to reflect the 'accepted' action.

### 3. Profile Discovery

Retrieving user profiles requires calculating the relationship between the authenticated user and the target.

- **Endpoint:** `GET /user/profile?username=...`
- **Controller:** [user.controller.ts](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.controller.ts#L22)
- **Technical Flow:**
    1. The [UserService.profile](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.service.ts#L24) method fetches the user's basic info, stats (counts), and the specific relationship status between the viewer and the profile owner.
    2. It determines the `followState` (`none`, `pending`, or `accepted`).
    3. It also returns a `same` flag to indicate if the user is viewing their own profile.

### 4. Paginated Connections

Lumina uses **Cursor-based Pagination** for lists of followers and followings to ensure performance as the social graph grows.

- **Implementation:** [UserService.followers](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.service.ts#L220) and [UserService.followings](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.service.ts#L245)
- **Nuance:** The cursor is based on the `followerId` or `followingId`, allowing the client to fetch the next set of users without risk of duplicates or skipping items when new followers are added.

## Technical Choices & Advantages

### Transactional Integrity

The use of **Prisma Transactions** (`db.$transaction`) is critical in this layer. When a follow occurs or is accepted, multiple records must be updated (the Follow record and two User stat records). Transactions ensure that the system never enters an inconsistent state where a follow exists but the counts are incorrect.

- [Example Transaction in Accept](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/user/user.service.ts#L189)

### Notification Queuing Strategy

Instead of sending notifications directly, the `UserService` interacts with a `NotificationProducer`. This producer uses **Redis and BullMQ** to offload the heavy lifting.

- **Optimization:** To prevent spamming the queue, the [NotificationProducer](https://github.com/akshatV21/lumina/blob/master/apps/auth/src/notification-producer.service.ts#L18) uses a Redis Set (`SADD`) to check if a notification for that specific interaction has already been queued within a certain context.

## Interactions with other Layers

- **Auth Layer:** Supplies the `User` object via the `@AuthUser()` decorator for every request.
- **Notification Layer:** Receives jobs from the `NotificationProducer` to alert users of new followers or requests.
- **Database Layer:** Relying on the `Follow` model which uses a composite primary key `[followerId, followingId]` for efficient querying.
