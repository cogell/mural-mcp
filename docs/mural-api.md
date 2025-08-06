# Mural API Endpoints Reference

This document provides a comprehensive overview of all available Mural API endpoints based on their official documentation and OpenAPI specification.

## Base URL
```
https://app.mural.co/api/public/v1
```

## Authentication
All endpoints require OAuth 2.0 authentication with appropriate scopes.

## API Endpoints

### Workspaces

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| GET | `/workspaces` | Retrieve a list of workspaces | `workspaces:read` |
| GET | `/workspaces/{workspaceId}` | Retrieve details for a specific workspace | `workspaces:read` |
| POST | `/workspace/{workspaceId}/invite` | Invite users to a workspace | - |

### Rooms

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| POST | `/rooms` | Create a room in a workspace | `rooms:write` |
| GET | `/rooms/{roomId}` | Retrieve information about a specific room | `rooms:read` |
| DELETE | `/rooms/{roomId}` | Remove a specific room from a workspace | `rooms:write` |
| PATCH | `/rooms/{roomId}` | Modify details of an existing room | `rooms:write` |
| POST | `/createroomfolder` | Add a new folder within a room | - |
| GET | `/getroomfolders` | Retrieve all folders in a specific room | - |
| DELETE | `/deletefolderbyid` | Remove a specific folder from a room | - |
| GET | `/getworkspacerooms` | List all rooms in a workspace | - |
| GET | `/getworkspaceopenrooms` | Retrieve currently open rooms in a workspace | - |
| GET | `/room/{roomId}/members` | Get users for a room | - |
| PATCH | `/room/{roomId}/members` | Update room's members' permissions | - |
| POST | `/room/{roomId}/invite` | Invite users to a room | - |
| POST | `/room/{roomId}/remove-users` | Remove users from a room | - |

### Murals

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| POST | `/murals` | Create a mural in a room | `murals:write` |
| GET | `/murals/{muralId}` | Retrieve details of a single mural | `murals:read` |
| DELETE | `/murals/{muralId}` | Delete a specific mural | `murals:write` |
| PATCH | `/murals/{muralId}` | Update a mural's details | `murals:write` |
| POST | `/murals/{muralId}/duplicate` | Create a duplicate of an existing mural | `murals:write` |
| POST | `/createmural` | Create a new mural | - |
| GET | `/getmuralbyid` | Retrieve details of a specific mural | - |
| DELETE | `/deletemuralbyid` | Remove a specific mural | - |
| PATCH | `/updatemuralbyid` | Modify mural details | - |
| POST | `/muralaccessinfo` | Retrieve access details for a mural | - |
| POST | `/duplicatemural` | Create a copy of an existing mural | - |
| POST | `/exportmural` | Export mural to a file | - |
| GET | `/getworkspacemurals` | Retrieve murals within a workspace | - |
| GET | `/getworkspacerecentmurals` | Fetch recently accessed murals in a workspace | - |
| GET | `/getroommurals` | Retrieve murals within a specific room | - |
| GET | `/mural/{muralId}/users` | Retrieve users of a mural | - |
| PATCH | `/mural/{muralId}/members` | Update mural member permissions | - |
| POST | `/mural/{muralId}/invite` | Invite users to a mural | - |
| POST | `/mural/{muralId}/remove-users` | Remove users from a mural | - |

### Templates

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| GET | `/templates` | Retrieve default templates | `templates:read` |
| POST | `/templates` | Create a custom template from a mural | `templates:write` |
| DELETE | `/templates/{templateId}` | Delete a specific template | `templates:write` |
| GET | `/getdefaulttemplates` | Retrieve default templates | - |
| POST | `/createcustomtemplate` | Create a custom template from a mural | - |
| DELETE | `/deletetemplatebyid` | Delete a single template | - |
| POST | `/createmuralfromtemplate` | Create a mural from a template | - |
| GET | `/gettemplatesbyworkspace` | Get default and custom templates for a workspace | - |
| GET | `/getrecenttemplates` | Get the recent templates for a workspace | - |
| GET | `/searchtemplates` | Search templates | - |

### Users

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| GET | `/users/me` | Get information about the current authenticated user | `identity:read` |
| GET | `/members/me` | Get current user | - |

### Content & Widgets

The Mural Contents API provides comprehensive CRUD operations for managing mural content, including widgets, chat, tags, voting, and timers.

#### Widget Operations

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| GET | `/murals/{muralId}/widgets` | Get all widgets from a mural | `murals:read` |
| GET | `/murals/{muralId}/widgets/{widgetId}` | Get details of a specific widget by ID | `murals:read` |
| DELETE | `/murals/{muralId}/widgets/{widgetId}` | Delete a widget by ID | `murals:write` |

#### Widget Creation

| Method | Endpoint | Description | Required Scope | Max Per Request |
|--------|----------|-------------|----------------|-----------------|
| POST | `/murals/{muralId}/widgets/sticky-note` | Create sticky notes | `murals:write` | 1000 |
| POST | `/murals/{muralId}/widgets/text-box` | Create text boxes | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/title` | Create title widgets | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/shape` | Create shape widgets | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/image` | Create image widgets | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/file` | Create file widgets | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/table` | Create table widgets | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/area` | Create area widgets (for grouping) | `murals:write` | - |
| POST | `/murals/{muralId}/widgets/arrow` | Create arrow connector widgets | `murals:write` | - |

#### Widget Updates

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| PATCH | `/murals/{muralId}/widgets/sticky-note/{widgetId}` | Update a sticky note widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/text-box/{widgetId}` | Update a text box widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/title/{widgetId}` | Update a title widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/shape/{widgetId}` | Update a shape widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/image/{widgetId}` | Update an image widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/file/{widgetId}` | Update a file widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/area/{widgetId}` | Update an area widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/arrow/{widgetId}` | Update an arrow widget | `murals:write` |
| PATCH | `/murals/{muralId}/widgets/comment/{widgetId}` | Update a comment widget | `murals:write` |

#### Mural Content

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| GET | `/murals/{muralId}/chat` | Get chat messages from a mural | `murals:read` |
| GET | `/murals/{muralId}/tags` | Get tags associated with a mural | `murals:read` |
| POST | `/murals/{muralId}/tags` | Create a tag for a mural | `murals:write` |
| PATCH | `/murals/{muralId}/tags/{tagId}` | Update a tag on a mural | `murals:write` |
| POST | `/murals/{muralId}/comments` | Create comments on widgets | `murals:write` |

#### Interactive Features

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| POST | `/murals/{muralId}/voting-sessions` | Start voting session on widgets | `murals:write` |
| DELETE | `/murals/{muralId}/voting-sessions/{sessionId}` | End voting session | `murals:write` |
| GET | `/murals/{muralId}/voting-sessions/{sessionId}` | Get voting session details | `murals:read` |
| POST | `/murals/{muralId}/voting-sessions/{sessionId}/votes` | Vote for specific widgets | `murals:write` |
| POST | `/murals/{muralId}/timer` | Start timer in mural | `murals:write` |
| DELETE | `/murals/{muralId}/timer` | Stop timer in mural | `murals:write` |
| PATCH | `/murals/{muralId}/timer` | Pause/resume timer | `murals:write` |
| GET | `/murals/{muralId}/timer` | Get timer status | `murals:read` |

#### Asset Management

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| POST | `/murals/{muralId}/assets` | Create asset URL for file uploads | `murals:write` |

#### Visitor Management

| Method | Endpoint | Description | Required Scope |
|--------|----------|-------------|----------------|
| PATCH | `/murals/{muralId}/visitor-settings` | Update mural visitor settings | `murals:write` |

### Supported Widget Types

The Contents API supports the following widget types for creation and manipulation:

| Widget Type | Description | Key Properties |
|-------------|-------------|----------------|
| **Sticky Note** | Text notes with colored backgrounds | `text`, `x`, `y`, `width`, `height`, `style` |
| **Text Box** | Formatted text containers | `text`, `x`, `y`, `width`, `height`, `style` |
| **Title** | Header/title text widgets | `text`, `x`, `y`, `style` |
| **Shape** | Geometric shapes (rectangle, circle, etc.) | `x`, `y`, `width`, `height`, `shape`, `style` |
| **Image** | Image widgets from URLs or uploads | `x`, `y`, `width`, `height`, `url`, `title` |
| **File** | File attachment widgets | `x`, `y`, `filename`, `url` |
| **Table** | Structured data tables | `x`, `y`, `rows`, `columns`, `data` |
| **Area** | Grouping containers for other widgets | `x`, `y`, `width`, `height`, `title`, `style` |
| **Arrow** | Connectors between widgets | `startWidget`, `endWidget`, `style` |
| **Comment** | Comments attached to specific widgets | `targetWidget`, `text`, `x`, `y` |

### Widget Properties

Common properties across most widget types:

- **Position**: `x`, `y` coordinates on the mural canvas
- **Size**: `width`, `height` dimensions (where applicable)
- **Style**: Visual styling properties (colors, fonts, etc.)
- **Content**: Text content or references to external resources

### Content Limits

- **Sticky Notes**: Maximum 1000 per request
- **Text Content**: Character limits vary by widget type
- **File Uploads**: Size limits apply (refer to API documentation)

## API Scopes

The following OAuth scopes are available:

- `workspaces:read` - Read workspace information
- `rooms:read` - Read room information  
- `rooms:write` - Create, update, and delete rooms
- `murals:read` - Read mural information
- `murals:write` - Create, update, and delete murals
- `templates:read` - Read template information
- `templates:write` - Create and delete templates
- `identity:read` - Read user profile information

## Rate Limiting

The Mural API implements rate limiting. Refer to the official documentation for current limits.

## Pagination

Many list endpoints support pagination using query parameters like `limit` and `offset`.

## Additional Resources

- [Official Mural API Documentation](https://developers.mural.co/public/docs)
- [OpenAPI Specification](https://developers.mural.co/public/openapi/60959cbc7ff8b600451a3da6)
- [GitHub API Examples](https://github.com/spackows/Mural-API-Samples)

## Notes

This documentation is based on the official Mural API documentation as of the research date. Some endpoints may be deprecated or new ones may have been added. Always refer to the official documentation for the most up-to-date information.

The API appears to have two different endpoint naming conventions:
1. RESTful paths (e.g., `/murals/{muralId}`) - likely newer/preferred
2. Action-based paths (e.g., `/getmuralbyid`) - possibly legacy

When implementing, prefer the RESTful endpoints where available.

## Contents API Implementation Notes

The Contents API uses a consistent RESTful architecture for programmatic mural content manipulation:

1. **RESTful Design**: All endpoints follow RESTful conventions with resource-based URLs (e.g., `/murals/{muralId}/widgets`, `/murals/{muralId}/chat`). This provides predictable and intuitive API patterns.

2. **Hierarchical Structure**: Content resources are nested under their parent mural using the pattern `/murals/{muralId}/{resource}` for clear resource relationships.

3. **Batch Operations**: Widget creation endpoints support batch operations (especially sticky notes with up to 1000 per request) for efficient bulk content creation.

4. **Coordinate System**: Widget positioning uses an x,y coordinate system on the mural canvas, with (0,0) typically at the top-left.

5. **Interactive Features**: Advanced collaboration features like voting sessions, timers, and real-time chat are supported through dedicated resource endpoints.

6. **Content Management**: Full CRUD operations are supported for most widget types, enabling comprehensive mural content lifecycle management.