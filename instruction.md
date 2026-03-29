Create a detailed paper for this project. Explaining each feature, flow, etc through technical terms.
We will go layer by layer. Writing about each layer, its inner workings, nuances, endpoints involved, flow, etc.

Layers:

1. Auth
2. User Relations
3. Media processing (avatars, posts)
4. Notification Layer
5. Real-time Gateway

To attach the particular piece of code, add the github link for it.
Example:
The process method in the avatar processor in the media service would have this link:
https://github.com/akshatV21/lumina/blob/master/apps/media/src/processors/avatar.processor.ts#L21

Add links where you are referencing a file or piece of code from the project.

Explaing why certain packages where chosen, the pros of a peice of code, etc.
Things might not be present just in a single service, like, notifications doesn't just belong in the notification service, we also have to look how the notification was queued in the posts service for likes and comment. Same for other services, features, etc.

Create a layer folder, and create a detailed markdown file, for every layer, one by one.
For now, lets focus on just the Auth layer.
