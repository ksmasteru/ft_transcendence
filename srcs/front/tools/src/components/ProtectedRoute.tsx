// src/components/ProtectedRoute.tsx

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // State to manage the authentication check
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function will call your backend to verify the cookie
    const verifyUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/checkAuthCookie', {
          // This is crucial to send the httpOnly cookie with the request
          credentials: 'include',
        });

        if (response.ok) {
          // If the response is successful (status 200-299), the user is authenticated
          setIsAuthenticated(true);
        } else {
          // If the server responds with an error (like 401), the user is not authenticated
          setIsAuthenticated(false);
        }
      } catch (error) {
        // If there's a network error, treat the user as not authenticated
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        // Stop loading once the check is complete
        setLoading(false);
      }
    };

    verifyUser();
  }, []); // The empty array [] means this effect runs only once when the component mounts

  // 1. While the check is in progress, show a loading message
  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner component
  }

  // 2. If the check is complete and the user is authenticated, show the requested page
  if (isAuthenticated) {
    return <Outlet />;
  }

  // 3. If the check is complete and the user is not authenticated, redirect to sign-in
  return <Navigate to="/sign-in" replace />;
};

export default ProtectedRoute;