# Project Structure

## Root Directory Organization
```
/
├── backend/           # Node.js API server
├── frontend/          # React application
├── shared/            # Shared TypeScript types and utilities
├── docs/              # Project documentation
└── .kiro/             # Kiro configuration and specs
```

## Backend Structure (`/backend`)
```
backend/
├── src/
│   ├── controllers/   # Route handlers and business logic
│   ├── middleware/    # Express middleware (auth, validation, etc.)
│   ├── models/        # Prisma schema and database models
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic and external integrations
│   ├── utils/         # Helper functions and utilities
│   ├── types/         # TypeScript type definitions
│   └── app.ts         # Express app configuration
├── prisma/
│   ├── schema.prisma  # Database schema definition
│   ├── migrations/    # Database migration files
│   └── seed.ts        # Database seeding script
├── tests/             # Backend test files
└── package.json
```

## Frontend Structure (`/frontend`)
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── common/    # Generic components (buttons, forms, etc.)
│   │   ├── layout/    # Layout components (header, sidebar, etc.)
│   │   └── features/  # Feature-specific components
│   ├── pages/         # Route-level page components
│   ├── store/         # Redux store configuration and slices
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API client and external service calls
│   ├── utils/         # Helper functions and utilities
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Main application component
├── public/            # Static assets
├── tests/             # Frontend test files
└── package.json
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `RecognitionForm.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `authService.ts`)
- **Types**: PascalCase with descriptive names (e.g., `User.ts`, `ApiResponse.ts`)
- **Test files**: Same name as source file with `.test.ts` or `.spec.ts` suffix

### Import Organization
1. External libraries (React, Material-UI, etc.)
2. Internal services and utilities
3. Component imports
4. Type imports (using `import type`)
5. Relative imports last

### Component Structure
- Each component in its own folder with index file for clean imports
- Co-locate component-specific styles, tests, and stories
- Use TypeScript interfaces for all component props

### API Route Organization
- Group routes by feature (auth, users, recognitions, rewards, admin)
- Use consistent REST conventions (GET, POST, PUT, DELETE)
- Implement proper error handling and validation middleware
- Document all endpoints with OpenAPI/Swagger comments

### Database Conventions
- Use descriptive table and column names in camelCase
- Include proper indexes for frequently queried fields
- Implement soft deletes where appropriate
- Use UUIDs for primary keys to avoid enumeration attacks