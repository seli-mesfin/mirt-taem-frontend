import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Users, Shield, Store, UserCheck, UserX, BarChart3, AlertTriangle } from "lucide-react";
import { getAuthorizedAdmins } from "../../database/database";
import { getAdminStats, getUsers, getTransactions, updateUser } from "../../services/api";

interface DatabaseUser {
  id: number;
  email: string;
  userType: 'customer' | 'provider' | 'admin';
  createdAt?: string;
  name?: string;
  isActive?: boolean;
  lastLogin?: string;
  loginAttempts?: number;
  accountLocked?: boolean;
}

export function AdminPanel() {
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, dbStats, allTransactions] = await Promise.all([
        getUsers(),
        getAdminStats(),
        getTransactions(),
      ]);
      setUsers(allUsers);
      setStats(dbStats);
      setTransactions(allTransactions);
      setTransactionStats({
        completedTransactions: allTransactions.filter((t) => t.status === 'completed').length,
        totalRevenue: allTransactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
        totalCommission: allTransactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.commission, 0),
        totalTransactions: allTransactions.length,
      });
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load database. You may not have admin privileges.');
    }
  };

  const completedOrders = transactions.filter((transaction) => transaction.status === 'completed');

  const handleToggleUserStatus = async (userId: number, activate: boolean) => {
    try {
      await updateUser(userId, { isActive: activate });
      setSuccess(`User ${activate ? 'activated' : 'deactivated'} successfully!`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      setError(err.message || 'Unable to update user status.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const escapePdfText = (text: string) =>
    text
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r/g, "")
      .replace(/\n/g, "\\n");

  const buildTransactionText = () => {
    const header = [
      'Mirt Team Transaction History',
      `Generated on ${new Date().toLocaleString()}`,
      '',
      'ID | Provider | Customer | Email | Event | Amount | Status | Date',
      '---|---|---|---|---|---|---|---',
    ];

    const rows = transactions.map((transaction) =>
      `${transaction.id} | ${transaction.providerName} | ${transaction.customerName} | ${transaction.customerEmail} | ${transaction.eventType} | ${transaction.amount} | ${transaction.status} | ${new Date(transaction.date).toLocaleString()}`
    );

    return [...header, ...rows].join('\n');
  };

  const createTransactionCanvas = () => {
    const lines = buildTransactionText().split('\n');
    const margin = 20;
    const lineHeight = 24;
    const width = 1200;
    const height = margin * 2 + lineHeight * lines.length;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    ctx.font = '18px Arial';

    lines.forEach((line, index) => {
      const y = margin + (index + 1) * lineHeight;
      ctx.fillText(line, margin, y);
    });

    return canvas;
  };

  const createPdfBlob = async () => {
    const canvas = createTransactionCanvas();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const base64 = dataUrl.split(',')[1] || '';
    const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const width = canvas.width;
    const height = canvas.height;
    const encoder = new TextEncoder();

    const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im1 Do\nQ\n`;
    const contentBytes = encoder.encode(content);

    const objects: Uint8Array[] = [];
    const objectStrings = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
      `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}endstream\nendobj\n`,
      `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
    ];

    for (let i = 0; i < objectStrings.length - 1; i++) {
      objects.push(encoder.encode(objectStrings[i]));
    }
    objects.push(encoder.encode(objectStrings[4]));
    objects.push(imageBytes);
    objects.push(encoder.encode('\nendstream\nendobj\n'));

    let pdfData = encoder.encode('%PDF-1.4\n');
    let position = pdfData.length;
    const offsets: number[] = [];

    for (const object of objects) {
      offsets.push(position);
      const nextBuffer = new Uint8Array(pdfData.length + object.length);
      nextBuffer.set(pdfData, 0);
      nextBuffer.set(object, pdfData.length);
      pdfData = nextBuffer;
      position += object.length;
    }

    const xrefHeader = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    const xrefEntries = offsets
      .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`)
      .join('');
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`;
    const xrefBytes = encoder.encode(`${xrefHeader}${xrefEntries}${trailer}`);

    const finalPdf = new Uint8Array(pdfData.length + xrefBytes.length);
    finalPdf.set(pdfData, 0);
    finalPdf.set(xrefBytes, pdfData.length);

    return new Blob([finalPdf], { type: 'application/pdf' });
  };

  const createTransactionImageBlob = async () => {
    const canvas = createTransactionCanvas();
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadTransactionsAsPdf = async () => {
    const pdfBlob = await createPdfBlob();
    downloadBlob(pdfBlob, 'transaction-history.pdf');
  };

  const downloadTransactionsAsImage = async () => {
    const imageBlob = await createTransactionImageBlob();
    downloadBlob(imageBlob, 'transaction-history.png');
  };

  const authorizedAdmins = getAuthorizedAdmins();
  const currentAdmin = JSON.parse(localStorage.getItem('caterlink_users') || '[]')[0];

  if (!currentAdmin || currentAdmin.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin database. Only authorized administrators can view this page.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#c8502e] to-[#2d7a4e] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Catering Provider Dashboard</h1>
          <p className="text-white/90">Secure user management system</p>
          <p className="text-white/70 text-sm mt-2">
            Logged in as: {currentAdmin?.name} 
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Authorized Admins Info */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Authorized Administrators</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authorizedAdmins.map((admin) => (
              <div key={admin.email} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${admin.accessLevel === 'super_admin' ? 'text-[#c8502e]' : 'text-[#2d7a4e]'}`} />
                  <div>
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{admin.accessLevel.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Users className="w-7 h-7 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stats.activeUsers} active</p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <UserCheck className="w-7 h-7 text-[#2d7a4e]" />
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-3xl font-bold">{stats.customers}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Registered customers</p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Store className="w-7 h-7 text-[#d4a574]" />
                <div>
                  <p className="text-sm text-muted-foreground">Providers</p>
                  <p className="text-3xl font-bold">{stats.providers}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Active providers</p>
            </div>

          </div>
        )}

        {transactionStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <BarChart3 className="w-7 h-7 text-[#2d7a4e]" />
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-3xl font-bold">{transactionStats.totalTransactions}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Total recorded transactions</p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Users className="w-7 h-7 text-[#c8502e]" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{transactionStats.completedTransactions}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Completed orders</p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Store className="w-7 h-7 text-[#d4a574]" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold">{transactionStats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Total transaction value</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Transaction History</h2>
              <p className="text-muted-foreground">All customer and provider transactions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadTransactionsAsPdf}
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={downloadTransactionsAsImage}
                className="px-5 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Export Image
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-sm text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="bg-muted/50 rounded-3xl">
                      <td className="px-4 py-4 text-sm">{transaction.id}</td>
                      <td className="px-4 py-4 text-sm">{transaction.providerName}</td>
                      <td className="px-4 py-4 text-sm">{transaction.customerName}</td>
                      <td className="px-4 py-4 text-sm">{transaction.eventType}</td>
                      <td className="px-4 py-4 text-sm">{transaction.amount.toLocaleString()} Birr</td>
                      <td className="px-4 py-4 text-sm capitalize">{transaction.status}</td>
                      <td className="px-4 py-4 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/30 p-6 text-center text-muted-foreground">
              No transactions have been recorded yet.
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Completed Orders</h2>
              <p className="text-muted-foreground">Orders that have been fulfilled and recorded</p>
            </div>
            <span className="rounded-full bg-[#2d7a4e]/10 px-4 py-2 text-sm font-semibold text-[#2d7a4e]">
              {completedOrders.length} completed
            </span>
          </div>

          {completedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-sm text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map((transaction) => (
                    <tr key={transaction.id} className="bg-muted/50 rounded-3xl">
                      <td className="px-4 py-4 text-sm">{transaction.id}</td>
                      <td className="px-4 py-4 text-sm">{transaction.providerName}</td>
                      <td className="px-4 py-4 text-sm">{transaction.customerName}</td>
                      <td className="px-4 py-4 text-sm">{transaction.eventType}</td>
                      <td className="px-4 py-4 text-sm">{transaction.amount.toLocaleString()} Birr</td>
                      <td className="px-4 py-4 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/30 p-6 text-center text-muted-foreground">
              No completed orders are available yet.
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-[#2d7a4e]/10 border border-[#2d7a4e]/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#2d7a4e]">{success}</p>
          </div>
        )}

        {/* User Management */}
        <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">Manage all users in the system</p>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-sm text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="bg-muted/50 rounded-3xl">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.userType === 'admin'
                          ? 'bg-[#c8502e]/20 text-[#c8502e]'
                          : user.userType === 'provider'
                          ? 'bg-[#d4a574]/20 text-[#8b6f47]'
                          : 'bg-[#2d7a4e]/20 text-[#2d7a4e]'
                      }`}>
                        {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isActive && !user.accountLocked
                          ? 'bg-[#2d7a4e]/20 text-[#2d7a4e]'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.isActive && !user.accountLocked ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {user.userType !== 'admin' && (
                          <>
                            {user.isActive ? (
                              <button
                                onClick={() => handleToggleUserStatus(user.id, false)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                title="Deactivate"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleUserStatus(user.id, true)}
                                className="p-2 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                                title="Activate"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}