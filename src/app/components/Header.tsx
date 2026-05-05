import { Link, useLocation } from "react-router";
import { Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
// Updated import to reference your new logo.jpg
import logoUrl from "../../assets/logo.jpg";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const existingUsers = JSON.parse(localStorage.getItem('caterlink_users') || '[]');
    if (existingUsers.length > 0) {
      setCurrentUser(existingUsers[0]);
    } else {
      setCurrentUser(null);
    }
  }, [location.pathname, location.search]);

  const getNavigation = () => {
    if (!currentUser) {
      if (location.pathname === "/login") {
        const params = new URLSearchParams(location.search);
        const type = params.get("type");

        if (type !== "provider") {
          return [
            { name: "Home", href: "/" },
            { name: "Find Catering", href: "/providers" },
          ];
        }

        return [
          { name: "Home", href: "/" },
        ];
      }

      return [
        { name: "Home", href: "/" },
        { name: "Find Catering", href: "/providers" },
        { name: "Become a Provider", href: "/login?type=provider" },
        { name: "Admin", href: "/admin" },
      ];
    }

    switch (currentUser.userType) {
      case 'customer':
        return [
          { name: "Home", href: "/" },
          { name: "Find Catering", href: "/providers" },
        ];
      case 'provider':
        return [
          { name: "Home", href: "/" },
          { name: "Dashboard", href: "/dashboard" },
        ];
      case 'admin':
        return [
          { name: "Home", href: "/" },
        ];
      default:
        return [
          { name: "Home", href: "/" },
          { name: "Find Catering", href: "/providers" },
          { name: "Become a Provider", href: "/login?type=provider" },
          { name: "Admin", href: "/admin" },
        ];
    }
  };

  const navigation = getNavigation();

  return (
    // XTRA Style: Added deeper glassmorphism and refined border contrast
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-3 group">
              {/* XTRA Style: Premium logo container with glass effect */}
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg">
                <img
                  src={logoUrl}
                  alt="ምርጥ ጣዕም logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground hidden sm:block">
                ምርጥ ጣዕም
              </span>
            </Link>

            <div className="hidden md:flex gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border bg-background/50 hover:bg-muted transition-all active:scale-95"
            >
              <User className="w-4 h-4" />
              Login
            </Link>
            <Link
              to="/login?type=provider"
              className="px-6 py-2.5 text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              Sign Up
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors border border-border/50"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu with XTRA Theme animation and styling */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-lg font-medium rounded-2xl transition-colors ${
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-4 mt-4 px-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-4 text-center text-sm font-medium rounded-2xl border border-border bg-background/50"
                >
                  Login
                </Link>
                <Link
                  to="/login?type=provider"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-4 text-center text-sm font-semibold rounded-2xl bg-primary text-primary-foreground"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}