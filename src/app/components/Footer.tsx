import { Link } from "react-router";
import { Mail, Phone } from "lucide-react";
// Updated to match your file: logo.jpg
import logoUrl from "../../assets/logo.jpg";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {/* XTRA Theme Glassmorphism Styling */}
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="ምርጥ ጣዕም logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight text-primary">ምርጥ ጣዕም</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              ምርጥ ጣዕም connects authentic Ethiopian catering providers with customers
              across Ethiopia. Bringing traditional flavors to your events with professional 
              quality and digital ease.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/providers"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Find Catering
                </Link>
              </li>
              <li>
                <Link
                  to="/login?type=provider"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Become a Provider
                </Link>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="/#about-us"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                <span>contact@mirt-team.et</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>0989840600</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>&copy; 2026 ምርጥ ጣዕም. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}