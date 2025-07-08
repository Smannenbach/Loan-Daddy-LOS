import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as AppleStrategy } from 'passport-apple';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Express } from 'express';
import { customerUsers, customerSessions } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

const PgSession = connectPgSimple(session);

interface OAuthProfile {
  id: string;
  provider: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  username?: string;
}

interface CustomerOAuthAccount {
  customerId: number;
  provider: string;
  providerId: string;
  email?: string;
  profileData: any;
}

export class CustomerOAuthService {
  private static instance: CustomerOAuthService;
  
  private constructor() {}
  
  public static getInstance(): CustomerOAuthService {
    if (!CustomerOAuthService.instance) {
      CustomerOAuthService.instance = new CustomerOAuthService();
    }
    return CustomerOAuthService.instance;
  }
  
  // Initialize OAuth strategies
  initializeStrategies() {
    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/customer/auth/google/callback"
      }, this.handleOAuthCallback));
    }
    
    // Facebook OAuth Strategy
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/customer/auth/facebook/callback",
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
      }, this.handleOAuthCallback));
    }
    
    // LinkedIn OAuth Strategy
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
      passport.use(new LinkedInStrategy({
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: "/api/customer/auth/linkedin/callback",
        scope: ['r_emailaddress', 'r_liteprofile']
      }, this.handleOAuthCallback));
    }
    
    // Twitter OAuth Strategy
    if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
      passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: "/api/customer/auth/twitter/callback",
        includeEmail: true
      }, this.handleOAuthCallback));
    }
    
    // GitHub OAuth Strategy
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/customer/auth/github/callback"
      }, this.handleOAuthCallback));
    }
    
    // Apple OAuth Strategy
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
      passport.use(new AppleStrategy({
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        callbackURL: "/api/customer/auth/apple/callback"
      }, this.handleOAuthCallback));
    }
    
    // Passport serialization
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });
    
    passport.deserializeUser(async (id: number, done) => {
      try {
        const [customer] = await db
          .select()
          .from(customerUsers)
          .where(eq(customerUsers.id, id));
        done(null, customer);
      } catch (error) {
        done(error, null);
      }
    });
  }
  
  // Handle OAuth callback from all providers
  private handleOAuthCallback = async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any
  ) => {
    try {
      const oauthProfile = this.normalizeProfile(profile);
      
      // Check if user already exists with this OAuth provider
      const existingCustomer = await this.findCustomerByOAuth(oauthProfile.provider, oauthProfile.id);
      
      if (existingCustomer) {
        // Update existing customer's OAuth data
        await this.updateCustomerOAuth(existingCustomer.id, oauthProfile, accessToken, refreshToken);
        return done(null, existingCustomer);
      }
      
      // Check if user exists by email
      if (oauthProfile.email) {
        const [customerByEmail] = await db
          .select()
          .from(customerUsers)
          .where(eq(customerUsers.email, oauthProfile.email));
          
        if (customerByEmail) {
          // Link OAuth account to existing customer
          await this.linkOAuthAccount(customerByEmail.id, oauthProfile, accessToken, refreshToken);
          return done(null, customerByEmail);
        }
      }
      
      // Create new customer
      const newCustomer = await this.createCustomerFromOAuth(oauthProfile, accessToken, refreshToken);
      return done(null, newCustomer);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      return done(error, null);
    }
  };
  
  // Normalize profile data from different providers
  private normalizeProfile(profile: any): OAuthProfile {
    const provider = profile.provider;
    let normalized: OAuthProfile = {
      id: profile.id,
      provider: provider
    };
    
    switch (provider) {
      case 'google':
        normalized.email = profile.emails?.[0]?.value;
        normalized.firstName = profile.name?.givenName;
        normalized.lastName = profile.name?.familyName;
        normalized.profilePicture = profile.photos?.[0]?.value;
        break;
        
      case 'facebook':
        normalized.email = profile.emails?.[0]?.value;
        normalized.firstName = profile.name?.givenName;
        normalized.lastName = profile.name?.familyName;
        normalized.profilePicture = profile.photos?.[0]?.value;
        break;
        
      case 'linkedin':
        normalized.email = profile.emails?.[0]?.value;
        normalized.firstName = profile.name?.givenName;
        normalized.lastName = profile.name?.familyName;
        normalized.profilePicture = profile.photos?.[0]?.value;
        break;
        
      case 'twitter':
        normalized.email = profile.emails?.[0]?.value;
        normalized.firstName = profile.displayName?.split(' ')[0];
        normalized.lastName = profile.displayName?.split(' ').slice(1).join(' ');
        normalized.profilePicture = profile.photos?.[0]?.value;
        normalized.username = profile.username;
        break;
        
      case 'github':
        normalized.email = profile.emails?.[0]?.value;
        normalized.firstName = profile.displayName?.split(' ')[0] || profile.username;
        normalized.lastName = profile.displayName?.split(' ').slice(1).join(' ') || '';
        normalized.profilePicture = profile.photos?.[0]?.value;
        normalized.username = profile.username;
        break;
        
      case 'apple':
        normalized.email = profile.email;
        normalized.firstName = profile.name?.firstName;
        normalized.lastName = profile.name?.lastName;
        break;
    }
    
    return normalized;
  }
  
  // Find customer by OAuth provider and provider ID
  private async findCustomerByOAuth(provider: string, providerId: string) {
    // This would typically be stored in a separate oauth_accounts table
    // For now, we'll store it in the customer's metadata
    const customers = await db
      .select()
      .from(customerUsers);
      
    return customers.find(customer => {
      const oauthAccounts = customer.oauthAccounts || [];
      return oauthAccounts.some((account: any) => 
        account.provider === provider && account.providerId === providerId
      );
    });
  }
  
  // Update existing customer's OAuth data
  private async updateCustomerOAuth(customerId: number, profile: OAuthProfile, accessToken: string, refreshToken: string) {
    const [customer] = await db
      .select()
      .from(customerUsers)
      .where(eq(customerUsers.id, customerId));
      
    if (customer) {
      const oauthAccounts = customer.oauthAccounts || [];
      const existingAccountIndex = oauthAccounts.findIndex((account: any) => 
        account.provider === profile.provider
      );
      
      const accountData = {
        provider: profile.provider,
        providerId: profile.id,
        email: profile.email,
        accessToken,
        refreshToken,
        updatedAt: new Date()
      };
      
      if (existingAccountIndex >= 0) {
        oauthAccounts[existingAccountIndex] = accountData;
      } else {
        oauthAccounts.push(accountData);
      }
      
      await db
        .update(customerUsers)
        .set({
          oauthAccounts: oauthAccounts,
          updatedAt: new Date()
        })
        .where(eq(customerUsers.id, customerId));
    }
  }
  
  // Link OAuth account to existing customer
  private async linkOAuthAccount(customerId: number, profile: OAuthProfile, accessToken: string, refreshToken: string) {
    const [customer] = await db
      .select()
      .from(customerUsers)
      .where(eq(customerUsers.id, customerId));
      
    if (customer) {
      const oauthAccounts = customer.oauthAccounts || [];
      oauthAccounts.push({
        provider: profile.provider,
        providerId: profile.id,
        email: profile.email,
        accessToken,
        refreshToken,
        createdAt: new Date()
      });
      
      await db
        .update(customerUsers)
        .set({
          oauthAccounts: oauthAccounts,
          updatedAt: new Date()
        })
        .where(eq(customerUsers.id, customerId));
    }
  }
  
  // Create new customer from OAuth profile
  private async createCustomerFromOAuth(profile: OAuthProfile, accessToken: string, refreshToken: string) {
    const [newCustomer] = await db
      .insert(customerUsers)
      .values({
        email: profile.email || `${profile.provider}_${profile.id}@temp.com`,
        firstName: profile.firstName || 'User',
        lastName: profile.lastName || '',
        password: '', // No password needed for OAuth users
        profilePicture: profile.profilePicture,
        isEmailVerified: true, // OAuth emails are considered verified
        oauthAccounts: [{
          provider: profile.provider,
          providerId: profile.id,
          email: profile.email,
          accessToken,
          refreshToken,
          createdAt: new Date()
        }]
      })
      .returning();
      
    return newCustomer;
  }
  
  // Setup session middleware
  setupSession(app: Express) {
    const sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'customer_sessions',
      createTableIfMissing: true
    });
    
    app.use(session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
  }
  
  // Get available OAuth providers
  getAvailableProviders() {
    const providers = [];
    
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push({
        name: 'google',
        displayName: 'Google',
        icon: 'google',
        color: '#4285f4'
      });
    }
    
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      providers.push({
        name: 'facebook',
        displayName: 'Facebook',
        icon: 'facebook',
        color: '#1877f2'
      });
    }
    
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
      providers.push({
        name: 'linkedin',
        displayName: 'LinkedIn',
        icon: 'linkedin',
        color: '#0077b5'
      });
    }
    
    if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
      providers.push({
        name: 'twitter',
        displayName: 'Twitter',
        icon: 'twitter',
        color: '#1da1f2'
      });
    }
    
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      providers.push({
        name: 'github',
        displayName: 'GitHub',
        icon: 'github',
        color: '#333'
      });
    }
    
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
      providers.push({
        name: 'apple',
        displayName: 'Apple',
        icon: 'apple',
        color: '#000'
      });
    }
    
    return providers;
  }
}

export const customerOAuth = CustomerOAuthService.getInstance();