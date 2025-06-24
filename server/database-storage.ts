import { db } from "./db";
import { contacts, type Contact } from "@shared/schema";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements Partial<IStorage> {
  // Contacts methods
  async getAllContacts(): Promise<Contact[]> {
    try {
      const result = await db.select().from(contacts).orderBy(contacts.createdAt);
      return result;
    } catch (error) {
      console.error('Error fetching contacts from database:', error);
      return [];
    }
  }

  async getContact(id: number): Promise<Contact | undefined> {
    try {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
      return contact;
    } catch (error) {
      console.error('Error fetching contact from database:', error);
      return undefined;
    }
  }

  async createContact(contactData: any): Promise<Contact> {
    try {
      const [contact] = await db
        .insert(contacts)
        .values({
          ...contactData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return contact;
    } catch (error) {
      console.error('Error creating contact in database:', error);
      throw error;
    }
  }

  async updateContact(id: number, contactData: any): Promise<Contact | undefined> {
    try {
      const [contact] = await db
        .update(contacts)
        .set({
          ...contactData,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, id))
        .returning();
      return contact;
    } catch (error) {
      console.error('Error updating contact in database:', error);
      return undefined;
    }
  }

  async deleteContact(id: number): Promise<boolean> {
    try {
      await db.delete(contacts).where(eq(contacts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting contact from database:', error);
      return false;
    }
  }
}

export const databaseStorage = new DatabaseStorage();