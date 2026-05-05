import { User } from "../data/users";

// Admin credentials - only this administrator can access the system
const AUTHORIZED_ADMINS = [
  {
    email: 'admin@caterlink.et',
    name: 'System Administrator',
    accessLevel: 'super_admin'
  }
];

const ADMIN_REGISTRATION_CODE = 'CATERLINK-ADMIN-2026';

// Database interface
interface DatabaseUser extends User {
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  loginAttempts: number;
  accountLocked: boolean;
}

interface Transaction {
  id: number;
  providerId: number;
  providerName: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerLocation?: string;
  eventType: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: number;
  amount: number;
  commission: number;
  netAmount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface Review {
  id: number;
  providerId: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

class CaterLinkDatabase {
  private users: DatabaseUser[] = [];
  private transactions: Transaction[] = [];
  private reviews: Review[] = [];
  private currentAdmin: DatabaseUser | null = null;

  constructor() {
    this.initializeDatabase();
    this.initializeTransactions();
    this.initializeReviews();
  }

  private initializeDatabase() {
    // Load from localStorage or initialize with default data
    const storedUsers = localStorage.getItem('caterlink_database_users');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    } else {
      // Initialize with default users
      this.users = [
        {
          id: 1,
          email: "customer1@example.com",
          userType: "customer",
          createdAt: "2024-01-15",
          name: "Meron Tadesse",
          isActive: true,
          loginAttempts: 0,
          accountLocked: false
        },
        {
          id: 2,
          email: "customer2@example.com",
          userType: "customer",
          createdAt: "2024-02-20",
          name: "Daniel Bekele",
          isActive: true,
          loginAttempts: 0,
          accountLocked: false
        },
        {
          id: 3,
          email: "customer3@example.com",
          userType: "customer",
          createdAt: "2024-03-10",
          name: "Sara Yohannes",
          isActive: true,
          loginAttempts: 0,
          accountLocked: false
        },
        {
          id: 4,
          email: "provider1@caterlink.et",
          userType: "provider",
          createdAt: "2024-01-01",
          name: "Mama Almaz Kitchen",
          isActive: true,
          loginAttempts: 0,
          accountLocked: false
        },
        {
          id: 5,
          email: "provider2@caterlink.et",
          userType: "provider",
          createdAt: "2024-01-05",
          name: "Yeshi's Traditional Catering",
          isActive: true,
          loginAttempts: 0,
          accountLocked: false
        },
        {
          id: 6,
          email: "admin@caterlink.et",
          userType: "admin",
          createdAt: "2024-01-01",
          name: "System Administrator",
          isActive: true,
          loginAttempts: 0,
          accountLocked: false
        }
      ];
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    localStorage.setItem('caterlink_database_users', JSON.stringify(this.users));
    localStorage.setItem('caterlink_database_transactions', JSON.stringify(this.transactions));
    localStorage.setItem('caterlink_database_reviews', JSON.stringify(this.reviews));
  }

  private initializeReviews() {
    const storedReviews = localStorage.getItem('caterlink_database_reviews');
    if (storedReviews) {
      this.reviews = JSON.parse(storedReviews);
    } else {
      this.reviews = [];
      this.saveToStorage();
    }
  }

  private initializeTransactions() {
    const storedTransactions = localStorage.getItem('caterlink_database_transactions');
    if (storedTransactions) {
      this.transactions = JSON.parse(storedTransactions);
    } else {
      this.transactions = [];
      this.saveToStorage();
    }
  }

  // Admin authentication - only authorized admins can access
  authenticateAdmin(email: string): boolean {
    const user = this.users.find(u => u.email === email && u.userType === 'admin');
    if (!user) {
      return false;
    }

    this.currentAdmin = user;
    user.lastLogin = new Date().toISOString();
    user.loginAttempts = 0;
    this.saveToStorage();
    return true;
  }

  // Check if current user is an authorized admin
  isAuthorizedAdmin(): boolean {
    return this.currentAdmin !== null && this.currentAdmin.userType === 'admin';
  }

  // Get current admin info
  getCurrentAdmin(): DatabaseUser | null {
    return this.currentAdmin;
  }

  // Admin-only functions
  getAllUsers(): DatabaseUser[] {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access user database');
    }
    return [...this.users];
  }

  getUsersByType(userType: 'customer' | 'provider' | 'admin'): DatabaseUser[] {
    return this.users.filter(u => u.userType === userType);
  }

  getUserById(id: number): DatabaseUser | null {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access user database');
    }
    return this.users.find(u => u.id === id) || null;
  }

  updateUser(id: number, updates: Partial<DatabaseUser>): boolean {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access user database');
    }

    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    // Prevent modification of admin accounts by non-super admins
    const user = this.users[userIndex];
    if (user.userType === 'admin' && this.currentAdmin?.email !== 'admin@caterlink.et') {
      throw new Error('Unauthorized: Only super admin can modify admin accounts');
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    this.saveToStorage();
    return true;
  }

  deactivateUser(id: number): boolean {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access user database');
    }

    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    const user = this.users[userIndex];
    if (user.userType === 'admin') {
      throw new Error('Cannot deactivate admin accounts');
    }

    this.users[userIndex].isActive = false;
    this.saveToStorage();
    return true;
  }

  activateUser(id: number): boolean {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access user database');
    }

    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    this.users[userIndex].isActive = true;
    this.users[userIndex].loginAttempts = 0;
    this.users[userIndex].accountLocked = false;
    this.saveToStorage();
    return true;
  }

  // User authentication (for regular users)
  authenticateUser(email: string, userType: 'customer' | 'provider' | 'admin'): DatabaseUser | null {
    const user = this.users.find(u => u.email === email && u.userType === userType);

    if (!user) return null;

    if (!user.isActive || user.accountLocked) {
      return null;
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveToStorage();

    return user;
  }

  // Create new user. Customers and providers can self-register; admin creation is restricted.
  createUser(userData: Omit<DatabaseUser, 'id' | 'createdAt' | 'loginAttempts' | 'accountLocked'> & { adminCode?: string }): DatabaseUser {
    // Admin accounts require the unique admin registration code.
    if (userData.userType === 'admin') {
      if (userData.adminCode !== ADMIN_REGISTRATION_CODE) {
        throw new Error('Invalid admin registration code. Only users with the admin code can be registered as admin.');
      }
    }

    // Check if email already exists
    if (this.users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser: DatabaseUser = {
      ...userData,
      id: Math.max(...this.users.map(u => u.id)) + 1,
      createdAt: new Date().toISOString(),
      loginAttempts: 0,
      accountLocked: false
    };

    this.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  recordTransaction(transactionData: Omit<Transaction, 'id' | 'date'>): Transaction {
    const newTransaction: Transaction = {
      ...transactionData,
      id: this.transactions.length > 0 ? Math.max(...this.transactions.map(t => t.id)) + 1 : 1,
      date: new Date().toISOString(),
    };

    this.transactions.push(newTransaction);
    this.saveToStorage();
    return newTransaction;
  }

  recordReview(reviewData: Omit<Review, 'id' | 'date'>): Review {
    const newReview: Review = {
      ...reviewData,
      id: this.reviews.length > 0 ? Math.max(...this.reviews.map(r => r.id)) + 1 : 1,
      date: new Date().toISOString(),
    };

    this.reviews.push(newReview);
    this.saveToStorage();
    return newReview;
  }

  getReviewsByProvider(providerId: number): Review[] {
    return this.reviews.filter((review) => review.providerId === providerId);
  }

  getAllReviews(): Review[] {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access reviews');
    }
    return [...this.reviews];
  }

  getCompletedTransactions(): Transaction[] {
    return this.transactions.filter((transaction) => transaction.status === 'completed');
  }

  updateTransactionStatus(transactionId: number, status: 'completed' | 'pending' | 'cancelled'): boolean {
    const transactionIndex = this.transactions.findIndex((t) => t.id === transactionId);
    if (transactionIndex === -1) return false;
    this.transactions[transactionIndex].status = status;
    this.saveToStorage();
    return true;
  }

  getTransactionsByProvider(providerId: number): Transaction[] {
    return this.transactions.filter((t) => t.providerId === providerId);
  }

  getAllTransactions(): Transaction[] {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access transactions');
    }
    return [...this.transactions];
  }

  getTransactionStats() {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access transactions');
    }

    const completed = this.transactions.filter((t) => t.status === 'completed');
    const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = completed.reduce((sum, t) => sum + t.commission, 0);

    return {
      totalTransactions: this.transactions.length,
      completedTransactions: completed.length,
      totalRevenue,
      totalCommission,
    };
  }

  // Get database statistics (admin only)
  getDatabaseStats() {
    if (!this.isAuthorizedAdmin()) {
      throw new Error('Unauthorized: Only administrators can access database statistics');
    }

    const customers = this.users.filter(u => u.userType === 'customer').length;
    const providers = this.users.filter(u => u.userType === 'provider').length;

    return {
      totalUsers: customers + providers,
      activeUsers: this.users.filter(u => u.isActive).length,
      customers,
      providers,
      admins: this.users.filter(u => u.userType === 'admin').length,
      lockedAccounts: this.users.filter(u => u.accountLocked).length,
      recentSignups: this.users.filter(u => {
        const signupDate = new Date(u.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return signupDate >= thirtyDaysAgo;
      }).length
    };
  }

  // Logout admin
  logoutAdmin() {
    this.currentAdmin = null;
  }
}

// Export singleton instance
export const database = new CaterLinkDatabase();

// Export authorized admins list (read-only)
export const getAuthorizedAdmins = () => [...AUTHORIZED_ADMINS];