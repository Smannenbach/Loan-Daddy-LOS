import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { borrowerAuth } from '../shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'borrower-secret-key-change-this';

export interface BorrowerRequest extends Request {
  borrower?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const createBorrowerToken = (borrower: any) => {
  return jwt.sign(
    { 
      id: borrower.id, 
      email: borrower.email,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
      type: 'borrower'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const borrowerMiddleware = async (
  req: BorrowerRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'borrower') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const [borrower] = await db
      .select()
      .from(borrowerAuth)
      .where(eq(borrowerAuth.id, decoded.id));

    if (!borrower || !borrower.isActive) {
      return res.status(401).json({ message: 'Borrower not found or inactive' });
    }

    req.borrower = {
      id: borrower.id,
      email: borrower.email,
      firstName: borrower.firstName,
      lastName: borrower.lastName
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const borrowerAuthRoutes = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const [borrower] = await db
        .select()
        .from(borrowerAuth)
        .where(eq(borrowerAuth.email, email.toLowerCase()));

      if (!borrower) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, borrower.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!borrower.isActive) {
        return res.status(401).json({ message: 'Account is inactive' });
      }

      // Update last login
      await db
        .update(borrowerAuth)
        .set({ lastLogin: new Date() })
        .where(eq(borrowerAuth.id, borrower.id));

      const token = createBorrowerToken(borrower);

      res.json({
        token,
        borrower: {
          id: borrower.id,
          email: borrower.email,
          firstName: borrower.firstName,
          lastName: borrower.lastName,
          phone: borrower.phone,
          isEmailVerified: borrower.isEmailVerified
        }
      });
    } catch (error) {
      console.error('Borrower login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  signup: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          message: 'Email, password, first name and last name are required' 
        });
      }

      // Check if borrower already exists
      const [existing] = await db
        .select()
        .from(borrowerAuth)
        .where(eq(borrowerAuth.email, email.toLowerCase()));

      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newBorrower] = await db
        .insert(borrowerAuth)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          isActive: true,
          isEmailVerified: false
        })
        .returning();

      const token = createBorrowerToken(newBorrower);

      res.json({
        token,
        borrower: {
          id: newBorrower.id,
          email: newBorrower.email,
          firstName: newBorrower.firstName,
          lastName: newBorrower.lastName,
          phone: newBorrower.phone,
          isEmailVerified: newBorrower.isEmailVerified
        }
      });
    } catch (error) {
      console.error('Borrower signup error:', error);
      res.status(500).json({ message: 'Signup failed' });
    }
  },

  getProfile: async (req: BorrowerRequest, res: Response) => {
    try {
      if (!req.borrower) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [borrower] = await db
        .select()
        .from(borrowerAuth)
        .where(eq(borrowerAuth.id, req.borrower.id));

      if (!borrower) {
        return res.status(404).json({ message: 'Borrower not found' });
      }

      res.json({
        id: borrower.id,
        email: borrower.email,
        firstName: borrower.firstName,
        lastName: borrower.lastName,
        phone: borrower.phone,
        isEmailVerified: borrower.isEmailVerified,
        createdAt: borrower.createdAt
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  }
};