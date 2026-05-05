import React, { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router";
import { MapPin, Star, Phone, Mail, Clock, Users, ChevronRight, Heart, Pencil, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fetchProviderById, Provider } from "../../data/providers";
import { createReview, getReviewsByProvider } from "../../services/api";

type MenuSection = {
  category: string;
  items: Array<{
    name: string;
    description: string;
    price: string;
    image: string;
  }>;
};

export function ProviderProfilePage() {
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState<"menu" | "reviews">("menu");
  const providerId = id ? parseInt(id, 10) : NaN;
  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const currentSession = JSON.parse(localStorage.getItem('caterlink_users') || '[]')[0];
  const isCustomer = currentSession?.userType === 'customer';
  const isProvider = currentSession?.userType === 'provider';
  const [reviews, setReviews] = useState<Array<{ name: string; rating: number; date: string; comment: string }>>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [editingMenuImage, setEditingMenuImage] = useState<{
    sectionIndex: number;
    itemIndex: number;
    value: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (isNaN(providerId)) {
        if (isMounted) setIsLoadingProvider(false);
        return;
      }

      if (isMounted) setIsLoadingProvider(true);
      try {
        const result = await fetchProviderById(providerId);
        if (isMounted) setProvider(result);
      } catch (error) {
        console.error('Failed to load provider:', error);
        if (isMounted) setProvider(undefined);
      } finally {
        if (isMounted) setIsLoadingProvider(false);
      }

      try {
        const backendReviews = await getReviewsByProvider(providerId);
        if (!isMounted) return;
        setReviews(
          backendReviews.map((review) => ({
            name: review.customerName,
            rating: review.rating,
            date: new Date(review.date).toLocaleDateString(),
            comment: review.comment,
          }))
        );
      } catch (error) {
        console.error('Failed to load reviews:', error);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [providerId]);

  const canEditMenuImages = Boolean(provider && isProvider && currentSession?.id === provider.id);

  const defaultMenuItems = [
    {
      category: "Signature Dishes",
      items: [
        {
          name: "Doro Wat",
          description: "Traditional spicy chicken stew with hard-boiled eggs, served with injera",
          price: "450 Birr/platter",
          image: "https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
        {
          name: "Kitfo",
          description: "Minced raw beef mixed with mitmita and Ethiopian butter",
          price: "550 Birr/platter",
          image: "https://images.unsplash.com/photo-1640116345144-8fca02e277b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
      ],
    },
    {
      category: "Traditional Favorites",
      items: [
        {
          name: "Tibs",
          description: "Sautéed meat with onions, peppers, and Ethiopian spices",
          price: "400 Birr/platter",
          image: "https://images.unsplash.com/photo-1679917010073-ead631d41d91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
        {
          name: "Shiro",
          description: "Ground chickpea stew with Ethiopian spices",
          price: "300 Birr/platter",
          image: "https://images.unsplash.com/photo-1630861413071-a424a4d6d155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
      ],
    },
    {
      category: "Extras",
      items: [
        {
          name: "Coffee Ceremony",
          description: "Traditional Ethiopian coffee ceremony for your guests",
          price: "200 Birr/session",
          image: "https://images.unsplash.com/photo-1630861412229-67e2acb44b7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
      ],
    },
  ];

  const baseMenuItems = provider?.menuItems?.length
    ? [
        {
          category: "Menu",
          items: provider.menuItems,
        },
      ]
    : defaultMenuItems;

  const providerStorageId = provider?.id ?? providerId;
  const menuImageStorageKey = Number.isFinite(providerStorageId)
    ? `caterlink_provider_menu_images_${providerStorageId}`
    : null;

  const loadMenuImageOverrides = (): Record<string, string> => {
    try {
      if (!menuImageStorageKey) return {};
      const raw = localStorage.getItem(menuImageStorageKey);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  };

  const saveMenuImageOverrides = (overrides: Record<string, string>) => {
    if (!menuImageStorageKey) return;
    localStorage.setItem(menuImageStorageKey, JSON.stringify(overrides));
  };

  useEffect(() => {
    if (!provider) {
      setMenuSections([]);
      setEditingMenuImage(null);
      return;
    }

    const overrides = loadMenuImageOverrides();
    const withOverrides: MenuSection[] = baseMenuItems.map((section) => ({
      category: section.category,
      items: section.items.map((item) => ({
        ...item,
        image: overrides[item.name] || item.image,
      })),
    }));
    setMenuSections(withOverrides);
    setEditingMenuImage(null);
  }, [provider?.id]);

  const handleSaveMenuImage = () => {
    if (!editingMenuImage) return;

    const nextUrl = editingMenuImage.value.trim();
    const { sectionIndex, itemIndex } = editingMenuImage;
    const target = menuSections[sectionIndex]?.items?.[itemIndex];
    if (!target) return;

    const nextSections = menuSections.map((section, sIdx) => {
      if (sIdx !== sectionIndex) return section;
      return {
        ...section,
        items: section.items.map((item, iIdx) => (iIdx === itemIndex ? { ...item, image: nextUrl } : item)),
      };
    });

    setMenuSections(nextSections);

    const overrides = loadMenuImageOverrides();
    if (nextUrl) {
      overrides[target.name] = nextUrl;
    } else {
      delete overrides[target.name];
    }
    saveMenuImageOverrides(overrides);
    setEditingMenuImage(null);
  };

  const reviewsData = [
    {
      name: "Meron Tadesse",
      rating: 5,
      date: "2 weeks ago",
      comment: "Amazing food for my wedding! Mama Almaz and her team made our special day perfect. The doro wat was the best I've ever had. Highly recommend!",
    },
    {
      name: "Daniel Bekele",
      rating: 5,
      date: "1 month ago",
      comment: "Perfect for our corporate event. Professional service and authentic Ethiopian cuisine that impressed all our international guests.",
    },
    {
      name: "Sara Yohannes",
      rating: 4,
      date: "2 months ago",
      comment: "Great food and friendly service. The portions were generous and everything was delicious. Will definitely book again!",
    },
  ];

  if (isLoadingProvider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Loading provider...</h1>
          <p className="text-muted-foreground">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Provider not found</h1>
          <p className="text-muted-foreground mb-6">
            The provider you are looking for does not exist or is not available in Bahir Dar.
          </p>
          <Link
            to="/providers"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  const storedReviewItems = [...reviewsData, ...reviews];
  const totalReviews = provider.reviews + reviews.length;

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentSession?.name) {
      alert('Please log in as a customer before submitting a review.');
      return;
    }

    if (!provider) {
      alert('Provider is not loaded yet. Please try again in a moment.');
      return;
    }

    try {
      await createReview({
        providerId: provider.id,
        customerName: currentSession.name,
        rating,
        comment,
      });

      setReviews((prev) => [
        {
          name: currentSession.name,
          rating,
          date: new Date().toLocaleDateString(),
          comment,
        },
        ...prev,
      ]);
      setRating(5);
      setComment('');
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 md:h-96 bg-gradient-to-br from-[#c8502e] to-[#2d7a4e]">
        <ImageWithFallback
          src={provider.coverImage}
          alt={provider.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 pb-12">
          <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-card">
                <ImageWithFallback
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{provider.name}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {provider.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
                        <span className="font-semibold text-foreground">{provider.rating}</span>
                        <span>({provider.reviews} reviews)</span>
                      </div>
                    </div>
                    <p className="text-foreground/80">{provider.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {provider.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {provider.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Available 7 days a week
                  </div>
                </div>

                <Link
                  to={isProvider ? "/dashboard" : `/booking/${provider.id}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  {isProvider ? "Dashboard" : "Dashboard"}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <div className="flex gap-4 mb-8 border-b border-border">
                <button
                  onClick={() => setSelectedTab("menu")}
                  className={`px-6 py-3 font-medium transition-colors relative ${
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
                  onClick={() => setSelectedTab("reviews")}
                  className={`px-6 py-3 font-medium transition-colors relative ${
                    selectedTab === "reviews"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Reviews ({totalReviews})
                  {selectedTab === "reviews" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>

              {selectedTab === "menu" && (
                <div className="space-y-12">
                  {menuSections.map((section, sectionIndex) => (
                    <div key={section.category}>
                      <h2 className="text-2xl font-bold mb-6">{section.category}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={item.name}
                            className="bg-muted/30 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                          >
                            <div className="aspect-[16/9] relative">
                              <ImageWithFallback
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />

                              {canEditMenuImages && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingMenuImage({
                                      sectionIndex,
                                      itemIndex,
                                      value: item.image || "",
                                    })
                                  }
                                  className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-white text-sm hover:bg-black/70 transition-colors"
                                  title="Edit menu image"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Edit image
                                </button>
                              )}
                            </div>
                            <div className="p-6">
                              {canEditMenuImages &&
                                editingMenuImage?.sectionIndex === sectionIndex &&
                                editingMenuImage?.itemIndex === itemIndex && (
                                  <div className="mb-4 rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <div>
                                        <p className="font-semibold">Update image for {item.name}</p>
                                        <p className="text-sm text-muted-foreground">Paste a new image URL and save.</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setEditingMenuImage(null)}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        title="Close"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>
                                    <input
                                      type="url"
                                      value={editingMenuImage.value}
                                      onChange={(e) =>
                                        setEditingMenuImage((prev) =>
                                          prev ? { ...prev, value: e.target.value } : prev
                                        )
                                      }
                                      placeholder="https://..."
                                      className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <div className="flex gap-3 mt-3">
                                      <button
                                        type="button"
                                        onClick={handleSaveMenuImage}
                                        className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingMenuImage(null)}
                                        className="px-5 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg">{item.name}</h3>
                                <span className="text-primary font-bold whitespace-nowrap ml-2">
                                  {item.price}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === "reviews" && (
                <div className="space-y-6">
                  {isCustomer && (
                    <div className="rounded-2xl border border-border bg-muted/50 p-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                          <h2 className="text-xl font-bold">Share a review</h2>
                          <p className="text-sm text-muted-foreground">Rate this provider and leave a comment.</p>
                        </div>
                        <button
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          {showReviewForm ? 'Close' : 'Write Review'}
                        </button>
                      </div>

                      {showReviewForm && (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Rating</label>
                            <div className="flex items-center gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setRating(i + 1)}
                                  className={`text-2xl ${
                                    i < rating ? 'text-[#d4a574]' : 'text-muted-foreground'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Review</label>
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Tell us what you liked about this provider"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Submit Review
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {storedReviewItems.length > 0 ? (
                    storedReviewItems.map((review, index) => (
                      <div key={index} className="bg-muted/30 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold mb-1">{review.name}</h3>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-[#d4a574] fill-[#d4a574]'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-foreground/80">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-muted/30 p-6 text-center text-muted-foreground">
                      No reviews yet. Be the first to leave feedback.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
