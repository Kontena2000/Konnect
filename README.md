# Konnect - Layout Planner
a Bruru masterpiece
A powerful 3D layout planning tool that helps you design, visualize, and optimize your layouts.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Development Workflows](#development-workflows)
  - [Authentication](#authentication)
  - [Project Management](#project-management)
  - [Layout Editor](#layout-editor)
  - [Module Management](#module-management)
  - [Matrix Calculator](#matrix-calculator)
- [Firebase Integration](#firebase-integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

Konnect is a comprehensive layout planning tool that enables users to design and visualize layouts in 3D. It provides powerful features for efficient layout planning, including a 3D layout editor, matrix calculator, collaboration tools, and customization options.

## Technology Stack

- **Frontend Framework**: Next.js 14 (Page Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui library
- **Icons**: Lucide React
- **3D Visualization**: React Three Fiber (R3F) & Three.js
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Backend/Database**: Firebase
  - Authentication
  - Cloud Firestore
  - Realtime Database
  - Cloud Storage
  - Firebase Admin SDK

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd konnect-layout-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Environment Setup

Create a `.env.local` file in the root directory with the following Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## Project Structure

The project follows a modular structure:

- `/src/pages`: Next.js pages and API routes
- `/src/components`: Reusable UI components
  - `/ui`: shadcn/ui components
  - `/three`: 3D visualization components
  - `/matrix-calculator`: Calculator components
  - `/settings`: Settings and configuration components
  - `/layout`: Layout-related components
  - `/auth`: Authentication components
- `/src/services`: Business logic and Firebase services
  - `/module`: Module management services
  - `/project`: Project management services
  - `/matrixCalculator`: Matrix calculation services
- `/src/contexts`: React contexts for state management
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility libraries and Firebase setup
- `/src/types`: TypeScript type definitions
- `/src/utils`: Helper functions and utilities
- `/public`: Static assets and 3D models

## Key Features

### 3D Layout Editor

The 3D Layout Editor allows users to:
- Design layouts in 3D with an intuitive interface
- Drag and drop modules from the module library
- Connect modules with power, cooling, and other connection types
- Manipulate objects with transform controls
- Save and load layouts

### Module Management

- Create, edit, and delete modules
- Organize modules into categories
- Set module properties and connection points
- Import 3D models for modules

### Matrix Calculator

- Calculate and optimize layout parameters
- Analyze power, cooling, and other requirements
- Generate reports and visualizations
- Save and load calculations

### Project Management

- Create and manage projects
- Add client information
- Share projects with team members
- Export project data

### User Management

- User authentication and authorization
- Role-based access control
- User profile management

## Development Workflows

### Authentication

The application uses Firebase Authentication for user management:

1. User registration and login are handled in `/src/pages/auth/`
2. Authentication state is managed through the `AuthContext` in `/src/contexts/AuthContext.tsx`
3. Protected routes check for authentication status before rendering

```typescript
// Example of accessing auth context
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {user.email}</div>;
}
```

### Project Management

Projects are managed through the project service:

1. Create a new project with `/services/project/operations.ts`
2. List and filter projects in the dashboard
3. View and edit project details
4. Delete projects with confirmation

```typescript
// Example of creating a project
import { createProject } from "@/services/project/operations";

const newProject = await createProject({
  name: "My Project",
  description: "Project description",
  clientName: "Client Name",
  clientEmail: "client@example.com"
});
```

### Layout Editor

The layout editor workflow:

1. Initialize the 3D scene with `SceneContainer`
2. Load modules from the module library
3. Drag and drop modules into the scene
4. Connect modules with connection lines
5. Save layout to Firebase

```typescript
// Example of saving a layout
import { saveLayout } from "@/services/layout";

await saveLayout({
  id: layoutId,
  projectId: currentProjectId,
  name: "My Layout",
  modules: currentModules,
  connections: currentConnections
});
```

### Module Management

Module management workflow:

1. Create and categorize modules in the settings page
2. Define module properties and connection points
3. Upload or select 3D models for visualization
4. Use modules in the layout editor

```typescript
// Example of creating a module
import { createModule } from "@/services/module/operations";

await createModule({
  name: "New Module",
  category: "Cooling",
  dimensions: { width: 1, height: 1, depth: 1 },
  connectionPoints: [
    { type: "POWER", position: { x: 0.5, y: 0, z: 0.5 } }
  ]
});
```

### Matrix Calculator

Matrix calculator workflow:

1. Select calculation parameters
2. Run calculations with the calculator service
3. View and analyze results
4. Generate reports and visualizations
5. Save calculations for future reference

## Firebase Integration

The application uses Firebase for backend services:

### Firestore Collections

- `users`: User profiles and settings
- `projects`: Project metadata and settings
- `layouts`: Layout data including modules and connections
- `modules`: Module definitions and properties
- `calculations`: Saved calculation results

### Security Rules

Firestore security rules are defined in `firestore.rules`:

```
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Projects can be read/written by their owners
    match /projects/{projectId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Admin users have full access
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

### Firebase Admin

The application uses Firebase Admin SDK for server-side operations:

- Custom claims for role-based access
- Server-side validation
- Secure data operations

## Deployment

The application can be deployed using Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy the application

For Firebase deployment:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy database rules
firebase deploy --only database
```

## Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Check your Firebase configuration in `.env.local`
   - Ensure Firebase services are enabled in the Firebase console

2. **3D Rendering Problems**
   - Check for WebGL support in the browser
   - Verify 3D models are in the correct format (GLB/GLTF)

3. **Authentication Errors**
   - Ensure Firebase Authentication is properly configured
   - Check for correct email/password combination

4. **Performance Issues**
   - Optimize 3D models for web use
   - Implement