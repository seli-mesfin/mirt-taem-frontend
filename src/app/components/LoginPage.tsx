import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { User, ChefHat, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { createUser, getUserByEmail } from "../../services/api";
import logoUrl from "../../assets/logo.jpg";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false); // Default to signup
  const [userType, setUserType] = useState<"customer" | "provider" | "admin">(
    searchParams.get("type") === "provider" ? "provider" : "customer"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "Bahir Dar, Ethiopia",
    category: "traditional",
    startingPrice: "350",
    menuItems: "Doro Wat,Kitfo,Shiro",
    description: "Authentic Ethiopian catering with fresh traditional plates.",
    imageUrl: "",
    password: "",
    adminCode: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      try {
        const existingUser = await getUserByEmail(formData.email);

        if (!existingUser || existingUser.userType !== userType) {
          setError("Account not found. Please sign up first to create an account.");
          setIsLogin(false);
          return;
        }

        if (userType === 'admin' && existingUser.userType !== 'admin') {
          setError("Access denied. Only authorized administrators can login as admin.");
          return;
        }

        localStorage.setItem('caterlink_users', JSON.stringify([existingUser]));

        if (userType === "provider") {
          navigate("/dashboard");
        } else if (userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/providers");
        }
      } catch (err: any) {
        console.error('Failed to login:', err);
        setError(err.message || "Could not login at this time.");
      }
    } else {
      try {
        const newUser = await createUser({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          category: userType === 'provider' ? formData.category : undefined,
          startingPricePerPerson: userType === 'provider' ? Number(formData.startingPrice) : undefined,
          menuItems: userType === 'provider' ? formData.menuItems.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
          imageUrl: formData.imageUrl || undefined,
          description: userType === 'provider' ? formData.description : undefined,
          userType,
          isActive: true,
          ...(userType === 'admin' ? { adminCode: formData.adminCode } : {}),
        });

        localStorage.setItem('caterlink_users', JSON.stringify([newUser]));

        if (userType === "provider") {
          navigate("/dashboard");
        } else if (userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/providers");
        }
      } catch (err: any) {
        console.error('Failed to sign up:', err);
        setError(err.message || "Could not create account at this time.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#c8502e]/10 via-background to-[#2d7a4e]/10">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-border bg-white flex items-center justify-center mx-auto mb-4">
              <img
                src={logoUrl}
                alt="ምርጥ ጣዕም logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? "Welcome Back" : "Join ምርጥ ጣዕም"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to your existing account"
                : "Create your account to get started"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setUserType("customer")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                userType === "customer"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <User className={`w-6 h-6 ${userType === "customer" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium ${userType === "customer" ? "text-primary" : "text-muted-foreground"}`}>
                Customer
              </span>
            </button>

            <button
              onClick={() => setUserType("provider")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                userType === "provider"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <ChefHat className={`w-6 h-6 ${userType === "provider" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium ${userType === "provider" ? "text-primary" : "text-muted-foreground"}`}>
                Provider
              </span>
            </button>

            <button
              onClick={() => setUserType("admin")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                userType === "admin"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Shield className={`w-6 h-6 ${userType === "admin" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium ${userType === "admin" ? "text-primary" : "text-muted-foreground"}`}>
                Admin
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {userType === "provider" ? "Business Name" : userType === "admin" ? "Administrator Name" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={userType === "provider" ? "Mama Almaz Kitchen" : userType === "admin" ? "Admin User" : "John Doe"}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0989840600"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required={!isLogin}
                />
              </div>
            )}

            {!isLogin && userType === 'provider' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Business Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Bahir Dar, Ethiopia"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catering Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="traditional">Traditional</option>
                    <option value="wedding">Wedding</option>
                    <option value="holiday">Holiday</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Starting Price Per Person</label>
                  <input
                    type="number"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                    placeholder="350"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Food Items / Menu</label>
                  <textarea
                    value={formData.menuItems}
                    onChange={(e) => setFormData({ ...formData, menuItems: e.target.value })}
                    placeholder="Doro Wat, Kitfo, Shiro"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Provider Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your catering specialty."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/food.jpg"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {!isLogin && userType === 'admin' && (
              <div>
                <label className="block text-sm font-medium mb-2">Admin Registration Code</label>
                <input
                  type="text"
                  value={formData.adminCode}
                  onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                  placeholder="Enter the admin code"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <span className="font-medium text-primary">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-medium text-primary">Sign in</span>
                </>
              )}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                <strong>Important:</strong> You must sign up first before you can sign in to access the platform.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
