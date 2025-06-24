import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'application':
      return 'bg-blue-100 text-blue-800';
    case 'document_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'underwriting':
      return 'bg-orange-100 text-orange-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'declined':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'application':
      return 'Application';
    case 'document_review':
      return 'Document Review';
    case 'underwriting':
      return 'Underwriting';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
}

export function getLoanTypeColor(loanType: string): string {
  switch (loanType) {
    case 'dscr':
      return 'bg-blue-100 text-blue-800';
    case 'fix-n-flip':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getLoanTypeLabel(loanType: string): string {
  switch (loanType) {
    case 'dscr':
      return 'DSCR';
    case 'fix-n-flip':
      return 'Fix-N-Flip';
    default:
      return loanType;
  }
}

export function calculateLTV(loanAmount: number, propertyValue: number): number {
  if (propertyValue === 0) return 0;
  return (loanAmount / propertyValue) * 100;
}

export function calculateDSCR(monthlyRent: number, monthlyExpenses: number, monthlyPayment: number): number {
  const netOperatingIncome = monthlyRent - monthlyExpenses;
  if (monthlyPayment === 0) return 0;
  return netOperatingIncome / monthlyPayment;
}

export function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  
  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}
