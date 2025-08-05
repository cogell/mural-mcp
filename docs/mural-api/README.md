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
*Note: These endpoints are inferred from GitHub examples and may require further verification*

| Method | Endpoint | Description | Notes |
|--------|----------|-------------|-------|
| POST | `/murals/{muralId}/widgets` | Create widgets in a mural | Inferred from examples |
| GET | `/murals/{muralId}/widgets` | Get widgets from a mural | Inferred from examples |
| PATCH | `/murals/{muralId}/widgets/{widgetId}` | Update widget properties | Inferred from examples |
| DELETE | `/murals/{muralId}/widgets/{widgetId}` | Delete a widget | Inferred from examples |

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