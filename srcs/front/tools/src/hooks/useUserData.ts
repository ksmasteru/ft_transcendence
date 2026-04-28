import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';

export const useUserData = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/user/me', {
          credentials: 'include',
        });
        
        if (response.status === 401) {
          setError('Your session has expired. Please sign in.');
          setTimeout(() => navigate('/sign-in'), 2000);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch user data (Status: ${response.status})`);
        }
        
        const result = await response.json();
        setUserData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  return { userData, loading, error };
};