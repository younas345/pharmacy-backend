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
              },
              email: {
                type: 'string',
                example: 'pharmacy@example.com',
              },
              name: {
                type: 'string',
                example: 'John Doe',
              },
              pharmacy_name: {
                type: 'string',
                example: 'City Pharmacy',
              },
              phone: {
                type: 'string',
                example: '+1234567890',
                nullable: true,
              },
              created_at: {
                type: 'string',
                format: 'date-time',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'JWT authentication token',
          },
        },
      },
    },
  },
};

