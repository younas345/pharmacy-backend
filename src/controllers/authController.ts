import { Request, Response, NextFunction } from 'express';
import { signup, signin, refreshToken } from '../services/authService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const signupHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name, pharmacyName, phone } = req.body;

    if (!email || !password || !name || !pharmacyName) {
      throw new AppError('Please provide email, password, name, and pharmacyName', 400);
    }

    const result = await signup({
      email,
      password,
      name,
      pharmacyName,
      phone,
    });

    res.status(201).json({
      status: 'success',
      data: result,
    });
  }
);

export const signinHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const result = await signin({ email, password });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

export const refreshTokenHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken: refreshTokenValue } = req.body;

    if (!refreshTokenValue) {
      throw new AppError('Refresh token is required', 400);
    }

    const result = await refreshToken({ refreshToken: refreshTokenValue });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

