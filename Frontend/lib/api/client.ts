/**
 * Base API Client
 * Handles authentication, error handling, and request/response formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface ApiError {
  status: number;
  message: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.token || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get pharmacy ID from localStorage
   */
  private getPharmacyId(): string | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.user?.id || userData.pharmacyId || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(includeAuth: boolean = true, customHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<ApiError> {
    let errorMessage = 'An error occurred';
    let errorData: any = {};

    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    return {
      status: response.status,
      message: errorMessage,
      error: errorData.error,
    };
  }

  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add pharmacy_id to params if available
    const pharmacyId = this.getPharmacyId();
    if (pharmacyId && includeAuth) {
      url.searchParams.append('pharmacy_id', pharmacyId);
    }

    // Add other params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: error.message || 'Network error occurred',
      } as ApiError;
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add pharmacy_id to body if available
    const requestBody = body || {};
    const pharmacyId = this.getPharmacyId();
    if (pharmacyId && includeAuth && typeof requestBody === 'object' && !Array.isArray(requestBody)) {
      requestBody.pharmacy_id = pharmacyId;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: error.message || 'Network error occurred',
      } as ApiError;
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add pharmacy_id to body if available
    const requestBody = body || {};
    const pharmacyId = this.getPharmacyId();
    if (pharmacyId && includeAuth && typeof requestBody === 'object' && !Array.isArray(requestBody)) {
      requestBody.pharmacy_id = pharmacyId;
    }

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: error.message || 'Network error occurred',
      } as ApiError;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(
    endpoint: string,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      // DELETE might return 204 No Content
      if (response.status === 204) {
        return { status: 'success' } as ApiResponse<T>;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: error.message || 'Network error occurred',
      } as ApiError;
    }
  }

  /**
   * Upload a file (multipart/form-data)
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add pharmacy_id to formData if available
    const pharmacyId = this.getPharmacyId();
    if (pharmacyId && includeAuth) {
      formData.append('pharmacy_id', pharmacyId);
    }

    const headers: HeadersInit = {};
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    // Don't set Content-Type for FormData, browser will set it with boundary

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: error.message || 'Network error occurred',
      } as ApiError;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

