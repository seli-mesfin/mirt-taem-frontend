import { Link } from "react-router";
import { Search, UtensilsCrossed, Calendar, Users, Star, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fetchAllProviders, Provider } from "../../data/providers";
import React, { useState, useEffect } from "react";
import logoUrl from "../../assets/logo.jpg";

export function LandingPage() {
  const [providersList, setProvidersList] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllProviders().then(setProvidersList).catch((error) => {
      console.error('Failed to load providers:', error);
    });
  }, []);

  const categories = [
    {
      value: "wedding",
      name: "Wedding Catering",
      description: "Traditional Ethiopian wedding feasts",
      icon: Users,
      image: "https://images.unsplash.com/photo-1691826280486-2a7f9a40441c?auto=format&fit=crop&w=600",
    },
    {
      value: "holiday",
      name: "Holiday Meals",
      description: "Celebrate Enkutatash or Ganna authentically",
      icon: Calendar,
      image: "https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?auto=format&fit=crop&w=600",
    },
    {
      value: "corporate",
      name: "Corporate Events",
      description: "Professional service for your business meetings",
      icon: UtensilsCrossed,
      image: "https://images.unsplash.com/photo-1640116345144-8fca02e277b8?auto=format&fit=crop&w=600",
    },
    {
      value: "traditional",
      name: "Traditional Dishes",
      description: "Authentic injera, doro wat, and tibs",
      icon: UtensilsCrossed,
      image: "https://images.unsplash.com/photo-1630861413071-a424a4d6d155?auto=format&fit=crop&w=600",
    },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProviders = normalizedSearch.length
    ? providersList.filter((p) => 
        p.name.toLowerCase().includes(normalizedSearch) || 
        p.specialties.some(s => s.toLowerCase().includes(normalizedSearch))
      )
    : providersList;

  const featuredProviders = filteredProviders.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-muted/20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2d7a4e]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-primary" />
                <span>Bahir Dar's #1 Catering Marketplace</span>
              </div>
              
              {/* UPDATED HEADING */}
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.1]">
                Elevating <span className="text-primary">Culinary Excellence</span> in Bahir Dar
              </h1>
              
              {/* UPDATED DESCRIPTION */}
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Effortlessly coordinate with top-tier caterers for every occasion. From large-scale wedding logistics to private family feasts, we bring the finest local flavors directly to your table.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for doro wat, weddings..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  />
                </div>
                <Link
                  to={normalizedSearch ? `/providers?search=${encodeURIComponent(normalizedSearch)}` : "/providers"}
                  className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Find Food <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?auto=format&fit=crop&w=1200"
                  alt="Traditional Ethiopian Feast"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 glass-card p-6 rounded-3xl shadow-xl border border-white/20 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Verified Quality</p>
                    <p className="text-sm text-muted-foreground">Certified Local Providers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORIES SECTION --- */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Occasion</h2>
              <p className="text-muted-foreground">The right flavor for every moment.</p>
            </div>
            <Link to="/providers" className="text-primary font-semibold flex items-center gap-1 hover:underline">
              View all categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/providers?category=${encodeURIComponent(cat.value)}`}
                className="group relative h-80 rounded-3xl overflow-hidden shadow-md"
              >
                <img src={cat.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <cat.icon className="w-8 h-8 mb-3 text-primary" />
                  <h3 className="text-xl font-bold mb-1">{cat.name}</h3>
                  <p className="text-sm text-white/70">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED SECTION --- */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Caterers</h2>
            <p className="text-muted-foreground">Highly rated professionals in Bahir Dar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProviders.map((provider) => (
              <Link
                key={provider.id}
                to={`/providers/${provider.id}`}
                className="group bg-background rounded-3xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-xl"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={provider.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    {provider.rating}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{provider.name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <MapPin className="w-4 h-4" /> {provider.location}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {provider.specialties.slice(0, 2).map(s => (
                      <span key={s} className="px-3 py-1 bg-muted rounded-full text-xs font-medium uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-primary font-bold text-lg">{provider.price}</span>
                    <span className="text-xs text-muted-foreground">{provider.reviews} reviews</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- ABOUT US SECTION --- */}
      <section id="about-us" className="py-24 bg-background overflow-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <div className="h-64 rounded-3xl overflow-hidden shadow-lg border-4 border-background">
                    <img src="https://images.unsplash.com/photo-1541014741259-df549fa9bc67?auto=format&fit=crop&w=400" className="w-full h-full object-cover" />
                  </div>
                  <div className="h-48 rounded-3xl bg-primary/10 flex items-center justify-center p-6 text-center">
                    <p className="text-primary font-bold text-xl leading-tight">Authentic Heritage</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-48 rounded-3xl bg-[#2d7a4e]/10 flex items-center justify-center p-6 text-center">
                    <p className="text-[#2d7a4e] font-bold text-xl leading-tight">Local Trust</p>
                  </div>
                  <div className="h-64 rounded-3xl overflow-hidden shadow-lg border-4 border-background">
                    <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-background rounded-full border border-border shadow-2xl flex items-center justify-center p-6">
                 <img src={logoUrl} alt="ምርጥ ጣዕም" className="w-full h-full object-contain" />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-6">Serving Bahir Dar with <span className="text-primary">Passion</span></h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  ምርጥ ጣዕም (Mirt Ta’em) was born from a simple mission: to bridge the gap between Bahir Dar’s incredible local culinary talent and the people who need them most.
                </p>
                <p>
                  Whether you're planning a massive wedding at the shores of Lake Tana or a small family gathering for Meskel, our platform ensures you find reliable, high-quality, and authentic catering without the stress.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div>
                    <h4 className="text-foreground font-bold text-2xl mb-1">100%</h4>
                    <p className="text-sm">Authentic Recipes</p>
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-2xl mb-1">50+</h4>
                    <p className="text-sm">Verified Providers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="relative rounded-[3rem] bg-foreground text-background p-12 md:p-20 overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Are You a Catering Professional?</h2>
            <p className="text-xl text-background/70 mb-10">
              Join Bahir Dar’s leading marketplace and grow your business today.
            </p>
            <Link
              to="/login?type=provider"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
            >
              Start Earning Today <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}