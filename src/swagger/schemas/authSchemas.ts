export const authSchemas = {
  SignupRequest: {
    type: 'object',
    required: ['email', 'password', 'name', 'pharmacyName'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'pharmacy@example.com',
        description: 'User email address',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'Password123',
        description: 'User password (minimum 8 characters)',
      },
      name: {
        type: 'string',
        example: 'John Doe',
        description: 'User full name',
      },
      pharmacyName: {
        type: 'string',
        example: 'City Pharmacy',
        description: 'Name of the pharmacy',
      },
      phone: {
        type: 'string',
        example: '+1234567890',
        description: 'Contact phone number (optional)',
      },
    },
  },
  SigninRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'pharmacy@example.com',
        description: 'User email address',
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'Password123',
        description: 'User password',
      },
    },
  },
  AuthResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      data: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
                description: 'User ID (linked to Supabase Auth user)',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'pharmacy@example.com',
                description: 'User email address',
              },
              name: {
                type: 'string',
                example: 'John Doe',
                description: 'User full name',
              },
              pharmacy_name: {
                type: 'string',
                example: 'City Pharmacy',
                description: 'Name of the pharmacy',
              },
              phone: {
                type: 'string',
                example: '+1234567890',
                nullable: true,
                description: 'Contact phone number',
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z',
                description: 'Account creation timestamp',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z',
                description: 'Last update timestamp',
              },
            },
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzA1MzI0MDAwfQ...',
            description: 'Supabase access token (JWT) for authentication. Use this token in Authorization header as "Bearer {token}". This token expires after 1 hour.',
          },
          refreshToken: {
            type: 'string',
            example: 'v1.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz...',
            description: 'Refresh token to obtain new access tokens when the current access token expires. Use this token with the /api/auth/refresh endpoint. Refresh tokens typically expire after 7 days.',
          },
          session: {
            type: 'object',
            description: 'Supabase session object containing authentication details',
            properties: {
              access_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                description: 'Access token for API authentication',
              },
              refresh_token: {
                type: 'string',
                example: 'v1.abc123def456...',
                description: 'Refresh token to obtain new access tokens',
              },
              expires_in: {
                type: 'number',
                example: 3600,
                description: 'Token expiration time in seconds',
              },
              expires_at: {
                type: 'number',
                example: 1705324000,
                description: 'Token expiration timestamp',
              },
              token_type: {
                type: 'string',
                example: 'bearer',
                description: 'Token type (always "bearer" for Supabase)',
              },
              user: {
                type: 'object',
                description: 'Supabase Auth user object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid',
                    example: '123e4567-e89b-12d3-a456-426614174000',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'pharmacy@example.com',
                  },
                  email_confirmed_at: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                    example: '2024-01-15T10:30:00Z',
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-15T10:30:00Z',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

