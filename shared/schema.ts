import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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

// Types
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

export type InsertBorrower = z.infer<typeof insertBorrowerSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Extended types for API responses
export type LoanApplicationWithDetails = LoanApplication & {
  borrower: Borrower;
  property: Property;
  documents: Document[];
  tasks: Task[];
};
