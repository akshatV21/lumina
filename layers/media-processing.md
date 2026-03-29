# Media Processing Layer - Documentation

The Media Processing layer handles all file uploads, image transformations, and video processing. It ensures that user-generated content is optimized for different devices and stored securely.

## Overview

Implemented in the `apps/media` microservice, this layer uses a **Two-Step Upload Strategy** to minimize server load and improve user experience. It leverages background workers to perform heavy computations like image resizing and video thumbnail extraction.

- **Primary Responsibilities:** Signed URL generation, image optimization (resizing, WebP conversion), video processing, and blurhash generation.
- **Service Link:** [apps/media](https://github.com/akshatV21/lumina/tree/master/apps/media)

## Features & Flow

### 1. Two-Step Upload Pattern

To avoid bottlenecking the API with large file transfers, Lumina uses signed URLs.

- **Step 1 (Signed URL):** The client requests a signed upload URL via `GET /media/avatar/url` or `GET /media/post/url`. The [MediaService](https://github.com/akshatV21/lumina/blob/master/apps/media/src/media.service.ts#L22) generates a temporary path in the `temp/` directory of the Supabase bucket.
- **Step 2 (Direct Upload):** The client uploads the file directly to Supabase Storage using the signed URL.
- **Step 3 (Processing Trigger):** Once the upload is complete, the client notifies the backend via `POST /media/avatar/uploaded` or `POST /media/post/uploaded`. This adds a job to the **BullMQ** queue.

### 2. Avatar Processing

When a user updates their profile picture, the system generates multiple variants for different UI components.

- **Processor:** [avatar.processor.ts](https://github.com/akshatV21/lumina/blob/master/apps/media/src/processors/avatar.processor.ts)
- **Technical Flow:**
    1. Downloads the raw image from the temporary storage.
    2. Uses **Sharp** to rotate and resize the image into three variants: `sm` (96px), `md` (256px), and `lg` (512px).
    3. Converts all variants to **WebP** format for optimal compression.
    4. Updates the user's `avatar` field with a content-based hash.
    5. **Nuance:** Automatically deletes old avatar variants from storage to save space.

### 3. Post Media & Blurhash Generation

Posts can contain multiple images or videos. The processing for posts is more complex as it involves state management and visual optimizations.

- **Processor:** [post.processor.ts](https://github.com/akshatV21/lumina/blob/master/apps/media/src/processors/post.processor.ts)
- **Key Features:**
    - **Blurhash:** For every image and video, the system generates a [Blurhash](https://blurhash.com/), a compact string representation of a placeholder image. This allows the frontend to show a smooth blur while the high-res media loads.
    - **Image Derivatives:** Creates a 300x300 thumbnail (`thumb`) and a 1080px wide feed-optimized version (`feed`).
    - **Video Processing:** Uses **FFmpeg** to extract a frame at 0.1s to use as a cover image and thumbnail.
    - **Transactional Finalization:** Only after all media items for a post are successfully processed, the post status is updated to `completed` and the user's `postCount` is incremented in a single [database transaction](https://github.com/akshatV21/lumina/blob/master/apps/media/src/processors/post.processor.ts#L61).

## Technical Choices & Advantages

### Packages

| Package | Purpose | Why chosen? |
| :--- | :--- | :--- |
| **sharp** | Image Processing | High-performance Node.js image processing library, significantly faster than ImageMagick or Jimp. |
| **fluent-ffmpeg** | Video Handling | Provides a clean API for FFmpeg, essential for extracting thumbnails and validating video files. |
| **blurhash** | Placeholders | Extremely small (20-30 chars) strings that represent a blurred version of an image, improving perceived performance. |
| **bullmq** | Queue Management | Robust Redis-based queue system for handling long-running background tasks with retry logic and concurrency control. |

### Error Handling & Rollback

The [PostProcessor](https://github.com/akshatV21/lumina/blob/master/apps/media/src/processors/post.processor.ts#L78) includes a robust rollback mechanism. If any stage of media processing fails (e.g., corrupted file, network error during upload):
1. The entire post record is deleted.
2. Any permanently uploaded media for that specific job are cleaned up from storage.
3. This prevents "ghost posts" or orphaned files in the storage bucket.

## Interactions with other Layers

- **Storage Layer (Supabase):** Acts as the source of truth for all binary data. The [StorageService](https://github.com/akshatV21/lumina/blob/master/apps/media/src/storage.service.ts) abstracts the Supabase SDK.
- **Database Layer (Prisma):** Stores the metadata (URLs, dimensions, blurhashes) and links media items to Users and Posts.
- **Auth Layer:** Provides the `userId` to ensure users can only trigger processing for their own uploads.
