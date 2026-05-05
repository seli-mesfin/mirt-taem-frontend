import { COMMISSION_PERCENTAGE } from './providers';

export interface Transaction {
  id: number;
  providerId: number;
  providerName: string;
  customerName: string;
  amount: number;
  commission: number;
  netAmount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  eventType: string;
}

export const transactions: Transaction[] = [
  {
    id: 1,
    providerId: 1,
    providerName: "Mama Almaz Kitchen",
    customerName: "Meron Tadesse",
    amount: 70000,
    commission: 70000 * (COMMISSION_PERCENTAGE / 100),
    netAmount: 70000 * (1 - COMMISSION_PERCENTAGE / 100),
    date: "2024-12-15",
    status: "completed",
    eventType: "Wedding"
  },
  {
    id: 2,
    providerId: 2,
    providerName: "Yeshi's Traditional Catering",
    customerName: "Daniel Bekele",
    amount: 17500,
    commission: 17500 * (COMMISSION_PERCENTAGE / 100),
    netAmount: 17500 * (1 - COMMISSION_PERCENTAGE / 100),
    date: "2024-12-03",
    status: "completed",
    eventType: "Corporate Event"
  },
  {
    id: 3,
    providerId: 1,
    providerName: "Mama Almaz Kitchen",
    customerName: "Sara Yohannes",
    amount: 10500,
    commission: 10500 * (COMMISSION_PERCENTAGE / 100),
    netAmount: 10500 * (1 - COMMISSION_PERCENTAGE / 100),
    date: "2024-11-28",
    status: "completed",
    eventType: "Birthday Party"
  },
  {
    id: 4,
    providerId: 3,
    providerName: "Abel Catering Services",
    customerName: "John Doe",
    amount: 25000,
    commission: 25000 * (COMMISSION_PERCENTAGE / 100),
    netAmount: 25000 * (1 - COMMISSION_PERCENTAGE / 100),
    date: "2024-12-20",
    status: "pending",
    eventType: "Graduation"
  },
  {
    id: 5,
    providerId: 4,
    providerName: "Lake Tana Culinary",
    customerName: "Jane Smith",
    amount: 45000,
    commission: 45000 * (COMMISSION_PERCENTAGE / 100),
    netAmount: 45000 * (1 - COMMISSION_PERCENTAGE / 100),
    date: "2024-12-18",
    status: "completed",
    eventType: "Anniversary"
  }
];

export const getTotalRevenue = () => transactions
  .filter(t => t.status === 'completed')
  .reduce((sum, t) => sum + t.amount, 0);

export const getTotalCommission = () => transactions
  .filter(t => t.status === 'completed')
  .reduce((sum, t) => sum + t.commission, 0);

export const getRecentTransactions = (days: number = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return transactions.filter(t => new Date(t.date) >= cutoff);
};