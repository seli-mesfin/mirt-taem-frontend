import { database } from "../database/database";
import { getProviders } from "../services/api";

export const COMMISSION_PERCENTAGE = 3;

export interface ProviderMenuItem {
  name: string;
  description: string;
  price: string;
  image: string;
}

export interface Provider {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  specialties: string[];
  price: string;
  pricePerPerson: number;
  image: string;
  category: string;
  phone: string;
  email: string;
  coverImage: string;
  description: string;
  menuItems?: ProviderMenuItem[];
  isRegistered?: boolean;
}

const foodImageMap: Record<string, string> = {
  doro: "https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  kitfo: "https://images.unsplash.com/photo-1640116345144-8fca02e277b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  tibs: "https://images.unsplash.com/photo-1679917010073-ead631d41d91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  shiro: "https://images.unsplash.com/photo-1630861413071-a424a4d6d155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  coffee: "https://images.unsplash.com/photo-1630861412229-67e2acb44b7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  default: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
};

const getFoodImageForDish = (dish: string) => {
  const normalized = dish.toLowerCase();
  for (const key of Object.keys(foodImageMap)) {
    if (normalized.includes(key)) {
      return foodImageMap[key] || foodImageMap.default;
    }
  }

  return foodImageMap.default;
};

const buildMenuItems = (menuItems?: string[], category?: string, startingPrice?: number) => {
  if (!menuItems || menuItems.length === 0) {
    return [
      {
        name: `${category ? category.charAt(0).toUpperCase() + category.slice(1) : "Traditional"} Feast`,
        description: `A popular ${category || "Ethiopian"} catering package with seasonal favorites.`,
        price: `${startingPrice ?? 350} Birr/platter`,
        image: getFoodImageForDish(category || "default"),
      },
    ];
  }

  return menuItems.map((name, index) => ({
    name,
    description: `Fresh ${name} prepared in authentic Ethiopian style.`,
    price: `${Math.max(150, (startingPrice ?? 350) + (index * 50))} Birr/platter`,
    image: getFoodImageForDish(name),
  }));
};

export const providers: Provider[] = [
  {
    id: 1,
    name: "Mama Almaz Kitchen",
    location: "Bahir Dar, Tana Plaza",
    rating: 4.9,
    reviews: 156,
    specialties: ["Doro Wat", "Injera", "Kitfo"],
    price: "350 Birr/person",
    pricePerPerson: 350,
    image: "https://images.unsplash.com/photo-1765338915553-6e02fe63ff4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "wedding",
    phone: "+251 911 234 567",
    email: "almaz@caterlink.et",
    coverImage: "https://images.unsplash.com/photo-1691826280718-b365d22809e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: "Family-owned Bahir Dar catering service with over 15 years of experience offering authentic Ethiopian cuisine.",
    menuItems: [
      {
        name: "Doro Wat",
        description: "Traditional spicy chicken stew with hard-boiled eggs.",
        price: "450 Birr/platter",
        image: foodImageMap.doro,
      },
      {
        name: "Kitfo",
        description: "Minced raw beef with mitmita and Ethiopian butter.",
        price: "550 Birr/platter",
        image: foodImageMap.kitfo,
      },
    ],
  },
  {
    id: 2,
    name: "Yeshi's Traditional Catering",
    location: "Bahir Dar, Haile Gebreselassie Avenue",
    rating: 4.8,
    reviews: 89,
    specialties: ["Tibs", "Shiro", "Coffee Ceremony"],
    price: "280 Birr/person",
    pricePerPerson: 280,
    image: "https://images.unsplash.com/photo-1640116345144-8fca02e277b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "holiday",
    phone: "+251 916 345 789",
    email: "yeshi@caterlink.et",
    coverImage: "https://images.unsplash.com/photo-1630861413071-a424a4d6d155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: "A beloved Bahir Dar caterer specializing in holiday meals and traditional feasts for large events.",
    menuItems: [
      {
        name: "Tibs",
        description: "Sautéed meat with onions, peppers, and Ethiopian spices.",
        price: "400 Birr/platter",
        image: foodImageMap.tibs,
      },
      {
        name: "Shiro",
        description: "Ground chickpea stew with rich Ethiopian spices.",
        price: "300 Birr/platter",
        image: foodImageMap.shiro,
      },
    ],
  },
  {
    id: 3,
    name: "Habesha Feast Catering",
    location: "Bahir Dar, Alem Tena",
    rating: 4.7,
    reviews: 124,
    specialties: ["Wedding Platters", "Fasting Food", "Beyaynetu"],
    price: "400 Birr/person",
    pricePerPerson: 400,
    image: "https://images.unsplash.com/photo-1691826280486-2a7f9a40441c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "wedding",
    phone: "+251 911 987 654",
    email: "feast@caterlink.et",
    coverImage: "https://images.unsplash.com/photo-1630861413071-a424a4d6d155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: "Experienced providers of large wedding and celebration catering in the heart of Bahir Dar.",
    menuItems: [
      {
        name: "Beyaynetu",
        description: "Colorful Ethiopian platter with multiple stews and vegetables.",
        price: "480 Birr/platter",
        image: foodImageMap.default,
      },
      {
        name: "Fasting Feast",
        description: "Vegetarian fasting dishes prepared with traditional spices.",
        price: "360 Birr/platter",
        image: foodImageMap.default,
      },
    ],
  },
  {
    id: 4,
    name: "Fana Bahir Dar Catering",
    location: "Bahir Dar, Mikea Street",
    rating: 4.6,
    reviews: 67,
    specialties: ["Corporate Platters", "Vegetarian Options", "Firfir"],
    price: "320 Birr/person",
    pricePerPerson: 320,
    image: "https://images.unsplash.com/photo-1679917010073-ead631d41d91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "corporate",
    phone: "+251 915 678 123",
    email: "fana@caterlink.et",
    coverImage: "https://images.unsplash.com/photo-1630861412229-67e2acb44b7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: "Reliable Bahir Dar corporate catering with a strong focus on fresh, locally sourced menu items.",
    menuItems: [
      {
        name: "Vegetarian Firfir",
        description: "Spiced shredded injera with hearty vegetarian toppings.",
        price: "340 Birr/platter",
        image: foodImageMap.default,
      },
      {
        name: "Corporate Platter",
        description: "A polished menu for conferences and office events.",
        price: "420 Birr/platter",
        image: foodImageMap.default,
      },
    ],
  },
  {
    id: 5,
    name: "Selam Traditional Food",
    location: "Bahir Dar, Alem Tena",
    rating: 4.8,
    reviews: 201,
    specialties: ["Gomen", "Misir Wat", "Alicha"],
    price: "290 Birr/person",
    pricePerPerson: 290,
    image: "https://images.unsplash.com/photo-1630861413071-a424a4d6d155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "traditional",
    phone: "+251 914 222 333",
    email: "selam@caterlink.et",
    coverImage: "https://images.unsplash.com/photo-1691826280486-2a7f9a40441c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: "Bahir Dar specialist in traditional Ethiopian platters for weddings, holidays, and family events.",
    menuItems: [
      {
        name: "Gomen",
        description: "Slow-cooked collard greens with mild spices.",
        price: "290 Birr/platter",
        image: foodImageMap.default,
      },
      {
        name: "Misir Wat",
        description: "Red lentil stew with berbere and clarified butter.",
        price: "290 Birr/platter",
        image: foodImageMap.default,
      },
    ],
  },
];

const buildProviderFromUser = (user: {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  category?: string;
  startingPricePerPerson?: number;
  menuItems?: string[];
  imageUrl?: string;
  description?: string;
}): Provider => {
  const pricePerPerson = user.startingPricePerPerson ?? 350;
  const category = user.category ?? "traditional";
  const menuItems = buildMenuItems(user.menuItems, category, pricePerPerson);

  return {
    id: user.id,
    name: user.name || "New Provider",
    location: user.location || "Bahir Dar, Ethiopia",
    rating: 4.5,
    reviews: 0,
    specialties: menuItems.map((item) => item.name),
    price: `${pricePerPerson} Birr/person`,
    pricePerPerson,
    image: user.imageUrl || foodImageMap.default,
    category,
    phone: user.phone || "+251 911 000 000",
    email: user.email,
    coverImage: user.imageUrl || foodImageMap.default,
    description: user.description || `Registered provider offering ${category} catering packages.`,
    menuItems,
    isRegistered: true,
  };
};

export const getAllProviders = (): Provider[] => {
  try {
    return [
      ...providers,
      ...database.getUsersByType('provider').map(buildProviderFromUser),
    ];
  } catch (error) {
    console.error('Failed to load providers from database:', error);
    return providers;
  }
};

export const getProviderById = (id: number): Provider | undefined => {
  const staticProvider = providers.find((provider) => provider.id === id);
  if (staticProvider) return staticProvider;

  try {
    const rawProvider = database.getUsersByType('provider').find((provider) => provider.id === id);
    return rawProvider ? buildProviderFromUser(rawProvider) : undefined;
  } catch (error) {
    console.error('Failed to load provider by ID:', error);
    return undefined;
  }
};

export const fetchAllProviders = async (): Promise<Provider[]> => {
  try {
    const backendProviders = await getProviders();
    const providerFromBackend = backendProviders.map(buildProviderFromUser);
    return [...providers, ...providerFromBackend];
  } catch (error) {
    console.error('Failed to fetch providers from backend:', error);
    return getAllProviders();
  }
};

export const fetchProviderById = async (id: number): Promise<Provider | undefined> => {
  const allProviders = await fetchAllProviders();
  return allProviders.find((provider) => provider.id === id);
};
