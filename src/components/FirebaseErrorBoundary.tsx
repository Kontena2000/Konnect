
import React from "react";
import { bootstrapFirebase } from "@/utils/firebaseBootstrap";

interface FirebaseErrorBoundaryProps {
  children: React.ReactNode;
}

interface FirebaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class FirebaseErrorBoundary extends React.Component<
  FirebaseErrorBoundaryProps,
  FirebaseErrorBoundaryState
> {
  constructor(props: FirebaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error("Firebase error caught:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    this.setState({ errorInfo });
    
    // Try to re-initialize Firebase if it's a Firebase initialization error
    if (
      error.message.includes("No Firebase App has been created") ||
      error.message.includes("Firebase not initialized") ||
      error.message.includes("Firebase app not initialized")
    ) {
      this.handleFirebaseError();
    }
  }

  handleFirebaseError = async () => {
    if (this.state.retryCount >= 3) {
      console.error("Maximum retry attempts reached for Firebase initialization");
      return;
    }

    console.log(`Attempting to recover from Firebase error (attempt ${this.state.retryCount + 1}/3)`);
    
    try {
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * (this.state.retryCount + 1)));
      
      // Try to bootstrap Firebase
      const success = await bootstrapFirebase();
      
      if (success) {
        console.log("Successfully re-initialized Firebase, resetting error state");
        this.setState({ 
          hasError: false, 
          error: null,
          errorInfo: null
        });
      } else {
        // Increment retry count
        this.setState(prevState => ({ 
          retryCount: prevState.retryCount + 1 
        }));
        
        // Try again with exponential backoff
        if (this.state.retryCount < 3) {
          this.handleFirebaseError();
        }
      }
    } catch (error) {
      console.error("Error during Firebase recovery:", error);
      this.setState(prevState => ({ 
        retryCount: prevState.retryCount + 1 
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="p-6 bg-card border rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-xl font-semibold mb-2">Firebase Error</h2>
            <p className="text-destructive mb-4">
              {this.state.error?.message || "An unknown Firebase error occurred"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              The application encountered an error while connecting to Firebase. This might be due to network issues or initialization problems.
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                onClick={() => {
                  this.setState({ 
                    hasError: false, 
                    error: null, 
                    errorInfo: null,
                    retryCount: 0
                  });
                  this.handleFirebaseError();
                }}
              >
                Retry Connection
              </button>
              <button
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
            {this.state.retryCount > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Retry attempts: {this.state.retryCount}/3
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
