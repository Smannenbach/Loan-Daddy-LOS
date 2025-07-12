import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { realtorAuth } from '../shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'realtor-secret-key-change-this';

export interface RealtorRequest extends Request {
  realtor?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    referralCode: string;
  };
}

export const createRealtorToken = (realtor: any) => {
  return jwt.sign(
    { 
      id: realtor.id, 
      email: realtor.email,
      firstName: realtor.firstName,
      lastName: realtor.lastName,
      referralCode: realtor.referralCode,
      type: 'realtor'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const realtorMiddleware = async (
  req: RealtorRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'realtor') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const [realtor] = await db
      .select()
      .from(realtorAuth)
      .where(eq(realtorAuth.id, decoded.id));

    if (!realtor || !realtor.isActive || !realtor.isApproved) {
      return res.status(401).json({ message: 'Realtor not found, inactive, or not approved' });
    }

    req.realtor = {
      id: realtor.id,
      email: realtor.email,
      firstName: realtor.firstName,
      lastName: realtor.lastName,
      referralCode: realtor.referralCode
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const realtorAuthRoutes = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const [realtor] = await db
        .select()
        .from(realtorAuth)
        .where(eq(realtorAuth.email, email.toLowerCase()));

      if (!realtor) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, realtor.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!realtor.isActive) {
        return res.status(401).json({ message: 'Account is inactive' });
      }

      if (!realtor.isApproved) {
        return res.status(401).json({ 
          message: 'Account pending approval. Please wait for admin approval.' 
        });
      }

      // Update last login
      await db
        .update(realtorAuth)
        .set({ lastLogin: new Date() })
        .where(eq(realtorAuth.id, realtor.id));

      const token = createRealtorToken(realtor);

      res.json({
        token,
        realtor: {
          id: realtor.id,
          email: realtor.email,
          firstName: realtor.firstName,
          lastName: realtor.lastName,
          phone: realtor.phone,
          brokerageName: realtor.brokerageName,
          licenseNumber: realtor.licenseNumber,
          referralCode: realtor.referralCode,
          isEmailVerified: realtor.isEmailVerified,
          totalReferrals: realtor.totalReferrals,
          totalCommissionsEarned: realtor.totalCommissionsEarned
        }
      });
    } catch (error) {
      console.error('Realtor login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  signup: async (req: Request, res: Response) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        phone,
        brokerageName,
        licenseNumber,
        licenseState,
        website,
        bio
      } = req.body;

      if (!email || !password || !firstName || !lastName || !brokerageName || !licenseNumber || !licenseState) {
        return res.status(400).json({ 
          message: 'Required fields: email, password, name, brokerage, license number, and state' 
        });
      }

      // Check if realtor already exists
      const [existing] = await db
        .select()
        .from(realtorAuth)
        .where(eq(realtorAuth.email, email.toLowerCase()));

      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate unique referral code
      const referralCode = `${firstName.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;

      const [newRealtor] = await db
        .insert(realtorAuth)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          brokerageName,
          licenseNumber,
          licenseState,
          website,
          bio,
          referralCode,
          isActive: true,
          isEmailVerified: false,
          isApproved: false, // Requires admin approval
          totalReferrals: 0,
          totalCommissionsEarned: '0'
        })
        .returning();

      res.json({
        message: 'Account created successfully. Pending admin approval.',
        realtor: {
          id: newRealtor.id,
          email: newRealtor.email,
          firstName: newRealtor.firstName,
          lastName: newRealtor.lastName,
          referralCode: newRealtor.referralCode,
          isApproved: newRealtor.isApproved
        }
      });
    } catch (error) {
      console.error('Realtor signup error:', error);
      res.status(500).json({ message: 'Signup failed' });
    }
  },

  getProfile: async (req: RealtorRequest, res: Response) => {
    try {
      if (!req.realtor) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [realtor] = await db
        .select()
        .from(realtorAuth)
        .where(eq(realtorAuth.id, req.realtor.id));

      if (!realtor) {
        return res.status(404).json({ message: 'Realtor not found' });
      }

      res.json({
        id: realtor.id,
        email: realtor.email,
        firstName: realtor.firstName,
        lastName: realtor.lastName,
        phone: realtor.phone,
        brokerageName: realtor.brokerageName,
        licenseNumber: realtor.licenseNumber,
        licenseState: realtor.licenseState,
        website: realtor.website,
        bio: realtor.bio,
        referralCode: realtor.referralCode,
        isEmailVerified: realtor.isEmailVerified,
        totalReferrals: realtor.totalReferrals,
        totalCommissionsEarned: realtor.totalCommissionsEarned,
        createdAt: realtor.createdAt
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  }
};