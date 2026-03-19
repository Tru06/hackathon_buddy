// Auth domain types

export interface AuthResult {
  accessToken: string
  userId: string
}

export interface AuthError {
  status: number
  message: string
}

// Request shapes
export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

// Response shapes
export interface AuthResponse {
  accessToken: string
  userId: string
}
