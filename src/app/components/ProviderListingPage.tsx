import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useSearchParams } from "react-router";
import { Search, MapPin, Star, SlidersHorizontal, ChevronDown } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fetchAllProviders, Provider } from "../../data/providers";

export function ProviderListingPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("bahir-dar");
  const [showFilters, setShowFilters] = useState(false);
  const [providersList, setProvidersList] = useState<Provider[]>([]);

  useEffect(() => {
    fetchAllProviders().then(setProvidersList).catch((error) => {
      console.error('Failed to load providers from backend:', error);
    });
  }, []);

  useEffect(() => {
    const q = (searchParams.get("search") || "").trim();
    if (q) setSearchTerm(q);
    const category = (searchParams.get("category") || "").trim();
    if (category) setSelectedCategory(category);
    // Only run when query string changes.
  }, [searchParams]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "wedding", label: "Wedding Catering" },
    { value: "holiday", label: "Holiday Meals" },
    { value: "corporate", label: "Corporate Events" },
    { value: "traditional", label: "Traditional Dishes" },
  ];

  const cities = [
    { value: "bahir-dar", label: "Bahir Dar" },
  ];

  const allProviders = providersList;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredProviders = allProviders.filter((provider) => {
    // Search should match provider names only.
    const matchesSearch = normalizedSearchTerm.length === 0
      ? true
      : provider.name.toLowerCase().includes(normalizedSearchTerm);
    const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory;
    const matchesCity = selectedCity === "all" || provider.location.toLowerCase().includes(selectedCity.replace("-", " "));
    return matchesSearch && matchesCategory && matchesCity;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#c8502e] to-[#2d7a4e] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Find Ethiopian Catering</h1>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by provider name..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>

              <div className="hidden md:flex gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
                >
                  {cities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showFilters && (
              <div className="md:hidden mt-4 pt-4 border-t border-border space-y-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {cities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProviders.map((provider) => (
            <Link
              key={provider.id}
              to={`/providers/${provider.id}`}
              className="bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] relative">
                <ImageWithFallback
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-xl mb-1">{provider.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      {provider.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#d4a574]/20 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
                    <span className="font-semibold">{provider.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting from</p>
                    <p className="font-bold text-lg text-primary">{provider.price}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {provider.reviews} reviews
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            {normalizedSearchTerm.length > 0 ? (
              <>
                <h3 className="text-2xl font-bold mb-2">No catering provider found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any catering provider with the name "{searchTerm.trim()}".
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">No providers found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters.
                </p>
              </>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedCity("all");
              }}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
