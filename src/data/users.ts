export interface User {
  id: number;
  email: string;
  userType: 'customer' | 'provider' | 'admin';
  createdAt: string;
  name?: string;
  phone?: string;
  location?: string;
  category?: string;
  startingPricePerPerson?: number;
  menuItems?: string[];
  imageUrl?: string;
  description?: string;
}

export const users: User[] = [
  {
    id: 1,
    email: "customer1@example.com",
    userType: "customer",
    createdAt: "2024-01-15",
    name: "Meron Tadesse"
  },
  {
    id: 2,
    email: "customer2@example.com",
    userType: "customer",
    createdAt: "2024-02-20",
    name: "Daniel Bekele"
  },
  {
    id: 3,
    email: "customer3@example.com",
    userType: "customer",
    createdAt: "2024-03-10",
    name: "Sara Yohannes"
  },
  {
    id: 4,
    email: "provider1@caterlink.et",
    userType: "provider",
    createdAt: "2024-01-01",
    name: "Mama Almaz Kitchen"
  },
  {
    id: 5,
    email: "provider2@caterlink.et",
    userType: "provider",
    createdAt: "2024-01-05",
    name: "Yeshi's Traditional Catering"
  },
  {
    id: 6,
    email: "admin@caterlink.et",
    userType: "admin",
    createdAt: "2024-01-01",
    name: "System Administrator"
  }
];

export const getTotalUsers = () => users.filter(u => u.userType === 'customer').length;
export const getTotalProviders = () => users.filter(u => u.userType === 'provider').length;
export const getRecentSignups = (days: number = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return users.filter(u => new Date(u.createdAt) >= cutoff);
};