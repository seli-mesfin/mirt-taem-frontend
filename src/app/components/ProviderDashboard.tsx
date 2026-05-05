import { useEffect, useMemo, useState } from "react";
import { Plus, DollarSign, Calendar, Users, Star, Package, Eye, X, Edit, Trash2, Settings } from "lucide-react";
import { COMMISSION_PERCENTAGE } from "../../data/providers";
import { getTransactions, updateTransactionStatus } from "../../services/api";
import { updateUser } from "../../services/api";

interface Transaction {
  id: number;
  providerId: number;
  providerName: string;
  customerName: string;
  customerEmail: string;
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
  status: "completed" | "pending" | "cancelled";
}

interface MenuItem {
  id: number;
  name: string;
  price: string;
  description: string;
  available: boolean;
}

export function ProviderDashboard() {
  const [selectedTab, setSelectedTab] = useState<"orders" | "menu" | "earnings">("orders");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Transaction | null>(null);
  const [providerOrders, setProviderOrders] = useState<Transaction[]>([]);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [providerProfile, setProviderProfile] = useState<{
    imageUrl: string;
    location: string;
    startingPricePerPerson: string;
  } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, name: "Doro Wat", price: "450 Birr/platter", description: "Traditional spicy chicken stew", available: true },
    { id: 2, name: "Kitfo", price: "550 Birr/platter", description: "Minced raw beef with spices", available: true },
    { id: 3, name: "Tibs", price: "400 Birr/platter", description: "Sautéed meat with vegetables", available: false },
    { id: 4, name: "Shiro", price: "300 Birr/platter", description: "Ground chickpea stew", available: true },
  ]);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [newMenuItem, setNewMenuItem] = useState({ name: "", price: "", description: "" });

  const currentUser = useMemo(() => {
    const users = JSON.parse(localStorage.getItem('caterlink_users') || '[]');
    return users?.[0] ?? null;
  }, []);

  const stats = [
    { label: "Total Earnings", value: "45,600 Birr", icon: DollarSign, color: "text-[#2d7a4e]" },
    { label: "Active Orders", value: providerOrders.filter((order) => order.status === 'pending').length.toString(), icon: Calendar, color: "text-primary" },
    { label: "Total Customers", value: providerOrders.length.toString(), icon: Users, color: "text-[#d4a574]" },
    { label: "Avg Rating", value: "4.9", icon: Star, color: "text-[#d4a574]" },
  ];

  const loadProviderOrders = async () => {
    if (currentUser?.userType !== 'provider') return;
    setProviderId(currentUser.id);
    setProviderProfile({
      imageUrl: currentUser.imageUrl || "",
      location: currentUser.location || "",
      startingPricePerPerson: String(currentUser.startingPricePerPerson ?? ""),
    });

    try {
      const allOrders = await getTransactions();
      const orders = allOrders.filter((order) => order.providerId === currentUser.id);
      setProviderOrders(orders);
    } catch (error) {
      console.error('Failed to load provider orders:', error);
    }
  };

  useEffect(() => {
    loadProviderOrders();
  }, []);

  const handleSaveProfile = async () => {
    if (!currentUser?.id || !providerProfile) return;

    const starting = providerProfile.startingPricePerPerson.trim();
    const parsedStarting = starting.length ? Number(starting) : undefined;
    if (parsedStarting !== undefined && (!Number.isFinite(parsedStarting) || parsedStarting < 0)) {
      alert("Please enter a valid price per person.");
      return;
    }

    setProfileSaving(true);
    try {
      const updates: Record<string, unknown> = {
        imageUrl: providerProfile.imageUrl.trim() || undefined,
        location: providerProfile.location.trim() || undefined,
        startingPricePerPerson: parsedStarting,
      };

      await updateUser(currentUser.id, updates);

      const users = JSON.parse(localStorage.getItem('caterlink_users') || '[]');
      if (users?.length) {
        users[0] = { ...users[0], ...updates };
        localStorage.setItem('caterlink_users', JSON.stringify(users));
      }

      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to update provider profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    const order = providerOrders.find((o) => o.id === orderId);
    try {
      await updateTransactionStatus(orderId, 'completed');
      await loadProviderOrders();
      setSelectedOrder(null);
      if (order) {
        alert(`Order accepted. Contact ${order.customerName} at ${order.customerPhone || 'the provided phone number'} to confirm details.`);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Unable to accept the order at this time. Please try again later.');
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    const order = providerOrders.find((o) => o.id === orderId);
    const customerName = order?.customerName || 'customer';
    try {
      await updateTransactionStatus(orderId, 'cancelled');
      await loadProviderOrders();
      setSelectedOrder(null);
      alert(`Order for ${customerName} has been rejected. The customer will be notified and the request is cancelled.`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Unable to reject the order at this time. Please try again later.');
    }
  };

  const handleDeleteMenu = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      setMenuItems(menuItems.filter(item => item.id !== id));
    }
  };

  const handleEditMenu = (item: MenuItem) => {
    setEditingMenu(item);
    setShowAddMenu(false);
  };

  const handleSaveEdit = () => {
    if (editingMenu) {
      setMenuItems(menuItems.map(item =>
        item.id === editingMenu.id ? editingMenu : item
      ));
      setEditingMenu(null);
    }
  };

  const handleAddMenu = () => {
    if (newMenuItem.name && newMenuItem.price) {
      const newItem: MenuItem = {
        id: Math.max(...menuItems.map(m => m.id)) + 1,
        name: newMenuItem.name,
        price: newMenuItem.price,
        description: newMenuItem.description,
        available: true,
      };
      setMenuItems([...menuItems, newItem]);
      setNewMenuItem({ name: "", price: "", description: "" });
      setShowAddMenu(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#c8502e] to-[#2d7a4e] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-white/90">Manage your catering business</p>
          <p className="text-white/70 text-sm mt-2">Platform Commission: {COMMISSION_PERCENTAGE}% per order</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Business Profile</h2>
              <p className="text-sm text-muted-foreground">Edit your menu image, location, and price per person.</p>
            </div>
            <button
              onClick={() => setIsEditingProfile((v) => !v)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
              {isEditingProfile ? "Close" : "Edit"}
            </button>
          </div>

          {isEditingProfile && providerProfile && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Menu / Profile Image URL</label>
                <input
                  type="text"
                  value={providerProfile.imageUrl}
                  onChange={(e) => setProviderProfile({ ...providerProfile, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price per person (Birr)</label>
                <input
                  type="number"
                  min={0}
                  value={providerProfile.startingPricePerPerson}
                  onChange={(e) => setProviderProfile({ ...providerProfile, startingPricePerPerson: e.target.value })}
                  placeholder="350"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={providerProfile.location}
                  onChange={(e) => setProviderProfile({ ...providerProfile, location: e.target.value })}
                  placeholder="Bahir Dar, ..."
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button
                  disabled={profileSaving}
                  onClick={handleSaveProfile}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {profileSaving ? "Saving..." : "Save"}
                </button>
                <button
                  disabled={profileSaving}
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex gap-4 border-b border-border overflow-x-auto">
              <button
                onClick={() => setSelectedTab("orders")}
                className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  selectedTab === "orders"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Orders
                {selectedTab === "orders" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setSelectedTab("menu")}
                className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  selectedTab === "menu"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Menu
                {selectedTab === "menu" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setSelectedTab("earnings")}
                className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  selectedTab === "earnings"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Earnings
                {selectedTab === "earnings" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>

            {selectedTab === "menu" && (
              <button
                onClick={() => {
                  setShowAddMenu(!showAddMenu);
                  setEditingMenu(null);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Menu Item
              </button>
            )}
          </div>

          {selectedTab === "orders" && (
            <div className="space-y-4">
              {providerOrders.length > 0 ? (
                providerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-muted/30 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{order.customerName}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              order.status === "completed"
                                ? "bg-[#2d7a4e]/20 text-[#2d7a4e]"
                                : order.status === "pending"
                                ? "bg-[#d4a574]/20 text-[#8b6f47]"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Event</p>
                            <p className="font-medium">{order.eventType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">{order.amount.toLocaleString()} Birr</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Net Earnings</p>
                          <p className="text-2xl font-bold text-primary">{order.netAmount.toLocaleString()} Birr</p>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-muted/30 rounded-xl p-6 text-center">
                  <p className="text-muted-foreground">No orders found yet.</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === "menu" && (
            <div>
              {showAddMenu && (
                <div className="bg-muted/30 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4">Add New Menu Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Dish name"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      className="px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Price (e.g., 450 Birr/platter)"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                      className="px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      placeholder="Description"
                      rows={3}
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                      className="md:col-span-2 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleAddMenu}
                      className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Save Item
                    </button>
                    <button
                      onClick={() => setShowAddMenu(false)}
                      className="px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {editingMenu && (
                <div className="bg-muted/30 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4">Edit Menu Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Dish name"
                      value={editingMenu.name}
                      onChange={(e) => setEditingMenu({ ...editingMenu, name: e.target.value })}
                      className="px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Price"
                      value={editingMenu.price}
                      onChange={(e) => setEditingMenu({ ...editingMenu, price: e.target.value })}
                      className="px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      placeholder="Description"
                      rows={3}
                      value={editingMenu.description}
                      onChange={(e) => setEditingMenu({ ...editingMenu, description: e.target.value })}
                      className="md:col-span-2 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingMenu(null)}
                      className="px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted/30 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            item.available ? "bg-[#2d7a4e]" : "bg-muted-foreground"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.price}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleEditMenu(item)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(item.id)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === "earnings" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#c8502e]/10 to-[#2d7a4e]/10 rounded-xl p-8 text-center">
                <p className="text-muted-foreground mb-2">Total Earnings This Month (After Commission)</p>
                <p className="text-5xl font-bold text-primary mb-4">38,760 Birr</p>
                <p className="text-sm text-muted-foreground">
                  Gross: 45,600 Birr - Commission ({COMMISSION_PERCENTAGE}%): 6,840 Birr
                </p>
                <p className="text-sm text-[#2d7a4e] mt-2">+23% from last month</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted/30 rounded-xl p-6 text-center">
                  <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold mb-1">12</p>
                  <p className="text-sm text-muted-foreground">Orders This Month</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-6 text-center">
                  <DollarSign className="w-8 h-8 text-[#2d7a4e] mx-auto mb-2" />
                  <p className="text-2xl font-bold mb-1">3,800 Birr</p>
                  <p className="text-sm text-muted-foreground">Average Order Value</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-6 text-center">
                  <Package className="w-8 h-8 text-[#d4a574] mx-auto mb-2" />
                  <p className="text-2xl font-bold mb-1">8</p>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{selectedOrder.customerPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedOrder.customerLocation || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Type</p>
                    <p className="font-medium">{selectedOrder.eventType}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Date</p>
                      <p className="font-medium">{selectedOrder.eventDate || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Event Time</p>
                      <p className="font-medium">{selectedOrder.eventTime || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Guests</p>
                    <p className="font-medium">{selectedOrder.guestCount ?? 'N/A'} people</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">Payment Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Order Total</span>
                    <span className="font-semibold">{selectedOrder.amount.toLocaleString()} Birr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Platform Commission ({COMMISSION_PERCENTAGE}%)</span>
                    <span className="font-semibold text-destructive">
                      -{selectedOrder.commission.toLocaleString()} Birr
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="font-bold">Your Earnings</span>
                    <span className="text-2xl font-bold text-[#2d7a4e]">
                      {selectedOrder.netAmount.toLocaleString()} Birr
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => selectedOrder && handleAcceptOrder(selectedOrder.id)}
                  className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Accept Order
                </button>
                <button
                  onClick={() => selectedOrder && handleRejectOrder(selectedOrder.id)}
                  className="flex-1 px-6 py-3 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
