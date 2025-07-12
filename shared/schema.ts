import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Organizations table - for companies/loan officer businesses
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  customDomain: text("custom_domain"),
  plan: text("plan").notNull().default('starter'), // starter, professional, enterprise
  status: text("status").notNull().default('trial'), // trial, active, suspended, cancelled
  trialEndsAt: timestamp("trial_ends_at"),
  logo: text("logo"),
  primaryColor: text("primary_color").default('#4f46e5'),
  secondaryColor: text("secondary_color").default('#3730a3'),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  nmls: text("nmls"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("loan_officer"),
  profilePicture: text("profile_picture"),
  phone: text("phone"),
  nmlsId: text("nmls_id"),
  realEstateLicense: text("real_estate_license"),
  licenseState: text("license_state"),
  bio: text("bio"),
  emailSignature: text("email_signature"),
  socialMediaLinks: jsonb("social_media_links"), // {linkedin, facebook, instagram, twitter, website}
  customDomain: text("custom_domain"), // e.g., johnsmith.loandaddy.com
  websiteEnabled: boolean("website_enabled").default(false),
  websiteTheme: text("website_theme").default("professional"),
  websiteContent: jsonb("website_content"),
  calendarSettings: jsonb("calendar_settings"),
  timeZone: text("time_zone").default("America/New_York"),
  workingHours: jsonb("working_hours"), // {monday: {start: "09:00", end: "17:00"}, ...}
  permissions: text("permissions").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  permissions: text("permissions").array().notNull(),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const userCalendars = pgTable("user_calendars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  isDefault: boolean("is_default").default(false),
  isPublic: boolean("is_public").default(false),
  bookingSettings: jsonb("booking_settings"), // meeting duration, buffer time, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  calendarId: integer("calendar_id").references(() => userCalendars.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAllDay: boolean("is_all_day").default(false),
  location: text("location"),
  meetingLink: text("meeting_link"),
  attendees: jsonb("attendees"), // array of email addresses
  eventType: text("event_type").default("meeting"), // meeting, call, appointment, deadline
  loanApplicationId: integer("loan_application_id").references(() => loanApplications.id),
  contactId: integer("contact_id"),
  reminderMinutes: integer("reminder_minutes").default(15),
  recurrence: jsonb("recurrence"), // recurrence rules
  status: text("status").default("confirmed"), // confirmed, tentative, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const borrowers = pgTable("borrowers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  linkedinProfile: text("linkedin_profile"),
  company: text("company"),
  jobTitle: text("job_title"),
  investmentExperience: text("investment_experience"), // beginner, intermediate, experienced
  portfolioSize: text("portfolio_size"), // 1-5, 6-10, 11-25, 25+
  preferredLoanTypes: text("preferred_loan_types").array(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: text("property_type").notNull(),
  propertyValue: decimal("property_value", { precision: 12, scale: 2 }),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  rehabCost: decimal("rehab_cost", { precision: 12, scale: 2 }),
  arv: decimal("arv", { precision: 12, scale: 2 }), // After Repair Value
});

export const loanApplications = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  borrowerId: integer("borrower_id").notNull(),
  propertyId: integer("property_id").notNull(),
  loanOfficerId: integer("loan_officer_id").notNull(),
  loanType: text("loan_type").notNull(), // 'dscr', 'fix-n-flip', 'hard-money', 'commercial-real-estate', 'private-money', 'bridge', 'construction', 'multifamily'
  requestedAmount: decimal("requested_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("application"), // application, document_review, underwriting, approved, declined
  ltv: decimal("ltv", { precision: 5, scale: 2 }), // Loan to Value ratio
  dscr: decimal("dscr", { precision: 5, scale: 2 }), // Debt Service Coverage Ratio
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  termMonths: integer("term_months"),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }),
  monthlyExpenses: decimal("monthly_expenses", { precision: 10, scale: 2 }),
  loanPurpose: text("loan_purpose"), // purchase, refinance, construction, renovation
  exitStrategy: text("exit_strategy"), // sale, refinance, hold
  experienceLevel: text("experience_level"), // beginner, intermediate, experienced
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  loanApplicationId: integer("loan_application_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  category: text("category").notNull(), // income, bank_statements, property_docs, etc.
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  loanApplicationId: integer("loan_application_id").notNull(),
  assignedToId: integer("assigned_to_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, completed
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  loanApplicationId: integer("loan_application_id").notNull(),
  borrowerId: integer("borrower_id").notNull(),
  type: text("type").notNull(), // email, sms
  recipient: text("recipient").notNull(), // email address or phone number
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // email, sms
  subject: text("subject"), // for email templates
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  loanApplicationId: integer("loan_application_id").notNull(),
  borrowerId: integer("borrower_id").notNull(),
  userId: integer("user_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  duration: integer("duration"), // in seconds
  callType: text("call_type").notNull(), // inbound, outbound
  status: text("status").notNull(), // completed, missed, busy, failed
  notes: text("notes"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  profilePhoto: text("profile_photo"),
  dateOfBirth: text("date_of_birth"),
  ssn: text("ssn"),
  relationshipStatus: text("relationship_status"),
  company: text("company"),
  title: text("title"),
  contactType: text("contact_type").notNull(), // borrower, agent, vendor, lender, referral_partner
  notes: text("notes"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  linkedInUrl: text("linkedin_url"),
  website: text("website"),
  licenseNumber: text("license_number"),
  mlsId: text("mls_id"),
  source: text("source").notNull(),
  tags: text("tags").array().default([]),
  linkedInProfile: text("linkedin_profile"),
  linkedInData: jsonb("linkedin_data").$type<{
    headline?: string;
    summary?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      location: string;
    }>;
    education?: Array<{
      school: string;
      degree: string;
      fieldOfStudy: string;
    }>;
    skills?: string[];
    connections?: number;
  }>(),
  emailGuesses: jsonb("email_guesses").$type<Array<{
    email: string;
    confidence: number;
    source: string;
    isValid?: boolean;
  }>>(),
  lastLinkedInSync: timestamp("last_linkedin_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer authentication and portal tables
export const customerUsers = pgTable("customer_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"), // Now optional for OAuth users
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  profilePicture: text("profile_picture"),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  oauthAccounts: jsonb("oauth_accounts").default([]), // Store OAuth provider info
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerSessions = pgTable("customer_sessions", {
  id: text("id").primaryKey(),
  customerId: integer("customer_id").references(() => customerUsers.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerLoanApplications = pgTable("customer_loan_applications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customerUsers.id).notNull(),
  applicationNumber: text("application_number").notNull().unique(),
  
  // Basic Information
  loanType: text("loan_type").notNull(), // 'dscr', 'fix-and-flip', 'bridge', 'commercial'
  requestedAmount: decimal("requested_amount", { precision: 12, scale: 2 }).notNull(),
  loanPurpose: text("loan_purpose").notNull(), // purchase, refinance, cash-out, construction
  
  // Property Information
  propertyAddress: text("property_address").notNull(),
  propertyCity: text("property_city").notNull(),
  propertyState: text("property_state").notNull(),
  propertyZip: text("property_zip").notNull(),
  propertyType: text("property_type").notNull(), // single-family, multi-family, commercial, etc.
  propertyValue: decimal("property_value", { precision: 12, scale: 2 }),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  downPayment: decimal("down_payment", { precision: 12, scale: 2 }),
  
  // Financial Information
  annualIncome: decimal("annual_income", { precision: 12, scale: 2 }),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  monthlyDebts: decimal("monthly_debts", { precision: 12, scale: 2 }),
  liquidAssets: decimal("liquid_assets", { precision: 12, scale: 2 }),
  creditScore: integer("credit_score"),
  
  // Experience
  investmentExperience: text("investment_experience"), // beginner, intermediate, experienced
  numberOfProperties: integer("number_of_properties"),
  experienceYears: integer("experience_years"),
  
  // Contact Information
  workPhone: text("work_phone"),
  cellPhone: text("cell_phone"),
  workEmail: text("work_email"),
  
  // Employment Information
  employmentStatus: text("employment_status"), // employed, self-employed, retired, other
  employerName: text("employer_name"),
  jobTitle: text("job_title"),
  workAddress: text("work_address"),
  employmentYears: integer("employment_years"),
  
  // Additional Details
  hasCoApplicant: boolean("has_co_applicant").default(false),
  coApplicantInfo: jsonb("co_applicant_info"),
  additionalComments: text("additional_comments"),
  
  // Application Status
  status: text("status").notNull().default("draft"), // draft, submitted, under_review, approved, declined, incomplete
  submittedAt: timestamp("submitted_at"),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
  
  // Document Tracking
  requiredDocuments: text("required_documents").array().default([]),
  uploadedDocuments: text("uploaded_documents").array().default([]),
  missingDocuments: text("missing_documents").array().default([]),
  
  // Communication Preferences
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, phone, text
  bestTimeToCall: text("best_time_to_call"),
  communicationNotes: text("communication_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerDocuments = pgTable("customer_documents", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customerUsers.id).notNull(),
  applicationId: integer("application_id").references(() => customerLoanApplications.id),
  
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  category: text("category").notNull(), // income, bank_statements, tax_returns, property_docs, etc.
  documentType: text("document_type").notNull(), // w2, paystub, bank_statement, tax_return, etc.
  
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileHash: text("file_hash"), // for duplicate detection
  
  // Document Status
  status: text("status").default("uploaded"), // uploaded, processing, verified, rejected
  verificationNotes: text("verification_notes"),
  isRequired: boolean("is_required").default(true),
  
  // Metadata
  documentDate: timestamp("document_date"), // date of the document (e.g., statement date)
  expirationDate: timestamp("expiration_date"), // for documents that expire
  
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentRequirements = pgTable("document_requirements", {
  id: serial("id").primaryKey(),
  loanType: text("loan_type").notNull(),
  category: text("category").notNull(),
  documentType: text("document_type").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  sortOrder: integer("sort_order").default(0),
  acceptedFormats: text("accepted_formats").array().default(['pdf', 'jpg', 'png', 'doc', 'docx']),
  maxFileSize: integer("max_file_size").default(10485760), // 10MB in bytes
  validationRules: jsonb("validation_rules"), // custom validation rules
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas
export const insertBorrowerSchema = createInsertSchema(borrowers);
export const insertPropertySchema = createInsertSchema(properties);
export const insertLoanApplicationSchema = createInsertSchema(loanApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});
export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});
export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Customer schemas
export const insertCustomerUserSchema = createInsertSchema(customerUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  emailVerificationToken: true,
  passwordResetToken: true,
  passwordResetExpires: true,
});

export const insertCustomerLoanApplicationSchema = createInsertSchema(customerLoanApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  lastModified: true,
  applicationNumber: true,
});

export const insertCustomerDocumentSchema = createInsertSchema(customerDocuments).omit({
  id: true,
  uploadedAt: true,
  verifiedAt: true,
  createdAt: true,
});

export const insertDocumentRequirementSchema = createInsertSchema(documentRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for organizations
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Borrower = typeof borrowers.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type CallLog = typeof callLogs.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

// Customer types
export type CustomerUser = typeof customerUsers.$inferSelect;
export type CustomerSession = typeof customerSessions.$inferSelect;
export type CustomerLoanApplication = typeof customerLoanApplications.$inferSelect;
export type CustomerDocument = typeof customerDocuments.$inferSelect;
export type DocumentRequirement = typeof documentRequirements.$inferSelect;

export type InsertBorrower = z.infer<typeof insertBorrowerSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Customer insert types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// Customer insert types
export type InsertCustomerUser = z.infer<typeof insertCustomerUserSchema>;
export type InsertCustomerLoanApplication = z.infer<typeof insertCustomerLoanApplicationSchema>;
export type InsertCustomerDocument = z.infer<typeof insertCustomerDocumentSchema>;
export type InsertDocumentRequirement = z.infer<typeof insertDocumentRequirementSchema>;

// Extended types for API responses
export type LoanApplicationWithDetails = LoanApplication & {
  borrower: Borrower;
  property: Property;
  documents: Document[];
  tasks: Task[];
};
