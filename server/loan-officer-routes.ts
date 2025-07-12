import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "./db";
import { organizations, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Signup schema
const signupSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  password: z.string().min(8),
  companyName: z.string(),
  nmls: z.string().optional(),
  website: z.string().optional(),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['starter', 'professional', 'enterprise'])
});

// Check subdomain availability
router.get("/check-subdomain/:subdomain", async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params;
    
    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.subdomain, subdomain.toLowerCase()))
      .limit(1);
    
    res.json({ available: existing.length === 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to check subdomain availability" });
  }
});

// Loan officer signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    // Check subdomain availability
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.subdomain, data.subdomain.toLowerCase()))
      .limit(1);
    
    if (existingOrg.length > 0) {
      return res.status(400).json({ error: "Subdomain already taken" });
    }
    
    // Create organization
    const [org] = await db.insert(organizations).values({
      name: data.companyName,
      subdomain: data.subdomain.toLowerCase(),
      plan: data.plan,
      nmls: data.nmls,
      website: data.website,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    }).returning();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user
    const [user] = await db.insert(users).values({
      organizationId: org.id,
      username: data.email,
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'admin', // First user is admin
      nmlsId: data.nmls
    }).returning();
    
    res.json({ 
      success: true,
      message: "Account created successfully",
      organizationId: org.id,
      userId: user.id,
      subdomain: org.subdomain
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Get organization settings
router.get("/organization/:subdomain", async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params;
    
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.subdomain, subdomain.toLowerCase()))
      .limit(1);
    
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    res.json({
      name: org.name,
      logo: org.logo,
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
      settings: org.settings
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get organization settings" });
  }
});

export default router;