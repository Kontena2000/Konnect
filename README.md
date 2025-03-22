
# Konnect - Subtitle Layout Planner

A powerful web application for designing and visualizing subtitle layouts, built with Next.js 14, Firebase, and Three.js.

## Features

- 3D Layout Editor with drag-and-drop functionality
- Real-time collaboration
- Module library with customizable components
- Project management system
- User authentication and role-based access
- Theme customization
- Grid system with adjustable settings

## Tech Stack

- Next.js 14 (Pages Router)
- Firebase (Authentication, Firestore, Storage)
- Three.js / React Three Fiber
- shadcn/ui components
- Tailwind CSS
- TypeScript

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file with your Firebase configuration

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

Build and deploy using Docker:
```bash
docker build --no-cache -t kortixmarko/sg-firebase-nextjs:2.0.4 .
docker push kortixmarko/sg-firebase-nextjs:2.0.4
```

## Contributing

Please read our [Contributing Guidelines](.github/CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
