# Braniel Singian Assestment

AdminFlow is a production-focused **Admin Dashboard & Management Portal** built with Next.js, React, TypeScript, and REST API routes.

The application provides dashboard analytics, user management, role-based access control, advanced forms, activity tracking, responsive UI, and secure API access.

## Features

### Dashboard

* Dynamic analytics
* KPI cards
* User statistics
* Department analytics chart
* Date-range filtering
* Loading states
* Error handling and retry functionality
* Responsive dashboard layout
* Lazy-loaded analytics chart

### User Management

* Server-side pagination
* User search
* Role filtering
* Status filtering
* Column sorting
* URL-synchronized filters
* Create users
* View user details
* Edit users
* Delete users
* Bulk user selection
* Bulk deletion
* Confirmation modals
* Optimistic deletion
* Error recovery

### User Detail Module

Each user has a dedicated dynamic route:

```text
/users/[id]
```

The detail page includes:

* Account information
* User role and status
* Department
* Job title
* Phone number
* Notes
* Activity and history timeline
* Related account records
* Permission information
* Editable user information

### Advanced User Form

The user creation workflow includes:

* Multi-step form
* Account information step
* Additional details step
* Review step
* Client-side validation
* Server-side validation
* Conditional fields
* Administrator access justification
* Draft/autosave using localStorage
* Draft restoration
* Loading state
* Success state
* Error state

Administrator accounts require an access justification before the account can be created.

## Role-Based Access Control

AdminFlow implements role-based UI and API authorization.

Supported roles:

* Administrator
* Manager
* User

### Administrator

Administrators have elevated user-management permissions, including user deletion and bulk deletion.

Administrator account creation also requires an access justification.

### Manager

Managers can perform permitted user-management operations but do not receive Administrator-only deletion permissions.

### User

Standard users have restricted management permissions.

Authorization is enforced both in the interface and in API routes.

## REST API

The application uses Next.js Route Handlers for REST-style API functionality.

### Users

```text
GET /api/users
POST /api/users
```

The GET endpoint supports:

* Pagination
* Search
* Role filtering
* Status filtering
* Sorting

Example query:

```text
/api/users?page=1&pageSize=10&status=Active&role=Manager&sortField=name&sortDirection=asc
```

### Individual Users

```text
GET /api/users/[id]
PUT/PATCH /api/users/[id]
DELETE /api/users/[id]
```

Individual routes are used for user-specific operations.

### Bulk Delete

```text
DELETE /api/users/bulk-delete
```

Allows authorized users to delete multiple selected accounts.

### Dashboard

```text
GET /api/dashboard
```

Dashboard analytics can be requested using a date range.

Example:

```text
/api/dashboard?range=30
```

## Security

AdminFlow includes several security controls:

* Authentication using NextAuth/Auth.js
* Role-based UI authorization
* Role-based API authorization
* Server-side input validation
* Client-side form validation
* Restricted Administrator operations
* Administrator access justification
* Duplicate email protection
* Validated user roles
* Validated account statuses
* Environment-based configuration
* No credentials should be committed to the repository

Sensitive values must be stored in environment variables.

## Technology Stack

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* NextAuth/Auth.js
* React Hook Form
* Zod
* TanStack React Query
* Recharts
* Lucide React
* Vitest
* Prisma

## Project Structure

A simplified project structure:

```text
adminflow/
├── app/
│   ├── api/
│   │   ├── dashboard/
│   │   └── users/
│   │       ├── [id]/
│   │       └── bulk-delete/
│   ├── dashboard/
│   └── users/
│       └── [id]/
│
├── components/
│   ├── dashboard/
│   ├── layout/
│   └── ui/
│
├── data/
│   └── users.json
│
├── lib/
│   ├── auth/
│   │   ├── permissions.ts
│   │   └── permissions.test.ts
│   ├── user-activity.ts
│   └── users.ts
│
├── public/
├── auth.ts
├── package.json
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd adminflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env.local
```

Do not commit this file to Git.

Add the environment variables required by your authentication and application configuration.

For example:

```env
AUTH_SECRET=your-secret-value
```

If additional database or authentication providers are configured, add their credentials to `.env.local` as required.

Never place production secrets directly inside source files.

### 4. Start development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

Start development:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Run ESLint:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Testing

AdminFlow uses **Vitest** for critical application tests.

Current tests include role-based permission helpers covering:

* Administrator management permissions
* Manager management permissions
* Standard user restrictions
* Administrator deletion permissions
* Manager deletion restrictions
* Standard user deletion restrictions
* Undefined/unauthenticated role behavior

Run the test suite with:

```bash
npm test
```

## Performance

Performance considerations implemented in the project include:

* Lazy-loaded analytics chart
* Efficient API filtering and pagination
* Server-side pagination
* Controlled client-side state
* Request cancellation where appropriate
* Skeleton/loading states
* Optimistic UI updates
* Reduced unnecessary data loading
* Appropriate separation of Server and Client Components

## UI and Accessibility

The interface includes:

* Responsive layouts
* Mobile-friendly tables
* Reusable components
* Clear visual hierarchy
* Loading indicators
* Skeleton loaders
* Empty states
* Error states
* Confirmation dialogs
* Form labels
* Accessible button controls
* Keyboard-accessible native controls
* Focus states
* Responsive navigation and content

## Data Handling

User information is currently persisted through the application's user data layer.

The development implementation uses:

```text
data/users.json
```

through:

```text
lib/users.ts
```

This keeps data access separated from the UI and API route logic.

For a larger production deployment, this data layer can be replaced with persistent database storage without requiring the UI to directly manage database operations.

## Error Handling

AdminFlow provides error handling across major workflows, including:

* API request failures
* Invalid form submissions
* Unauthorized requests
* Forbidden operations
* Missing users
* Duplicate email addresses
* Invalid request bodies
* Failed deletion operations
* Dashboard loading failures

Optimistic delete operations restore previous UI state when the server request fails.

## Production Build

Before deployment, verify the application:

```bash
npm test
npm run lint
npm run build
```

The application should only be deployed after tests, linting, and the production build complete successfully.

## Deployment

AdminFlow can be deployed to a platform that supports Next.js applications.

Before deployment:

1. Configure production environment variables.
2. Do not expose secrets in the repository.
3. Run the test suite.
4. Run ESLint.
5. Create a production build.
6. Verify authentication and API permissions.
7. Deploy the application.
8. Test the production URL.

## Engineering Practices

The project demonstrates:

* Component-based architecture
* TypeScript typing
* REST API design
* Client/server separation
* Reusable UI components
* Role-based authorization
* Input validation
* Async state management
* Optimistic updates
* Error recovery
* Responsive design
* Unit testing
* Performance optimization

## Git

Use meaningful commits when submitting changes.

Examples:

```text
feat: add dashboard analytics and date filtering
feat: implement user management CRUD
feat: add role-based access control
feat: add multi-step user form with autosave
feat: add optimistic bulk deletion
test: add RBAC permission tests
perf: lazy load dashboard analytics chart
docs: add project documentation
```

Before submission, verify that sensitive files such as `.env.local` are excluded from Git.

## License

This project was created as an Admin Dashboard and Management Portal technical assessment.
