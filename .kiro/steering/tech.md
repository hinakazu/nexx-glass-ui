# Technology Stack

## Architecture
Three-tier architecture with React frontend, Node.js backend, and PostgreSQL database.

## Frontend Stack
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **Material-UI** for component library
- **Socket.io Client** for real-time features

## Backend Stack
- **Node.js** with Express.js and TypeScript
- **Prisma ORM** for database operations
- **Socket.io** for WebSocket connections
- **JWT** authentication with refresh token rotation
- **Redis** for caching and session management

## Database & Storage
- **PostgreSQL** as primary database
- **Redis** for caching and real-time features
- **Local filesystem** or cloud storage for file uploads

## Development Tools
- **TypeScript** for type safety across the stack
- **ESLint** and **Prettier** for code formatting
- **Jest** for unit testing
- **React Testing Library** for component testing
- **Playwright** for end-to-end testing

## Common Commands

### Development
```bash
# Backend development
npm run dev          # Start backend with hot reload
npm run build        # Build TypeScript to JavaScript
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode

# Frontend development
npm start            # Start React development server
npm run build        # Create production build
npm run test         # Run component tests
npm run storybook    # Start Storybook for component development

# Database operations
npx prisma migrate dev    # Run database migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open database GUI
npx prisma db seed       # Seed database with test data
```

### Testing
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests with Playwright
npm run test:coverage    # Generate coverage report
```

## Security Requirements
- All API endpoints require authentication except login/register
- Input validation using Zod schemas
- Rate limiting on all endpoints
- HTTPS enforcement in production
- SQL injection prevention through parameterized queries