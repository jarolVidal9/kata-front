export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ErrorResponse {
  status: string;
  message: string;
}
