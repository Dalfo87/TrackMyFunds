# TrackMyFunds Development Guidelines

## Build & Test Commands
- **Setup**: `npm install` - Install all dependencies
- **Start**: `npm run dev` - Run development server
- **Build**: `npm run build` - Create production build
- **Test**: `npm test` - Run all tests
- **Single Test**: `npm test -- -t "test name"` - Run specific test
- **Lint**: `npm run lint` - Run ESLint
- **Type Check**: `npm run typecheck` - Verify TypeScript types

## Code Style Guidelines
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Imports**: Group imports (React, external libraries, internal components, types, styles)
- **Types**: Use TypeScript interfaces for objects, avoid `any` type
- **Error Handling**: Use try/catch with error logging via dedicated service
- **Components**: Functional components with hooks, extract complex logic to custom hooks
- **State Management**: React hooks for local state, Context API for global state
- **Formatting**: 2 space indentation, semicolons required, max line length 100 chars
- **Documentation**: JSDoc comments for functions, components and interfaces
- **File Structure**: One component per file, group related files in directories
- **i18n**: All user-facing text should use translation keys for internationalization