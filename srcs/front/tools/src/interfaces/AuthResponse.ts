export interface AuthResponse {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    message?: string;
  };
  message?: string;
}
