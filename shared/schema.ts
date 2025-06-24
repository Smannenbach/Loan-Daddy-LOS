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
  loanType: text("loan_type").notNull(), // 'dscr' or 'fix-n-flip'
  requestedAmount: decimal("requested_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("application"), // application, document_review, underwriting, approved, declined
  ltv: decimal("ltv", { precision: 5, scale: 2 }), // Loan to Value ratio
  dscr: decimal("dscr", { precision: 5, scale: 2 }), // Debt Service Coverage Ratio
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  termMonths: integer("term_months"),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }),
  monthlyExpenses: decimal("monthly_expenses", { precision: 10, scale: 2 }),
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

// Types
export type User = typeof users.$inferSelect;
export type Borrower = typeof borrowers.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Task = typeof tasks.$inferSelect;

export type InsertBorrower = z.infer<typeof insertBorrowerSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Extended types for API responses
export type LoanApplicationWithDetails = LoanApplication & {
  borrower: Borrower;
  property: Property;
  documents: Document[];
  tasks: Task[];
};
