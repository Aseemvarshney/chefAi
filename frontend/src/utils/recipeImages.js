// Curated high-resolution culinary photography library for ChefAI
// Delivers mouthwatering visuals for any cuisine or dish name.

const CUISINE_IMAGES = {
  italian: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3d5d628169e?auto=format&fit=crop&w=800&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  indian: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  curry: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  asian: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  chinese: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
  japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  sushi: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80',
  mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  taco: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  steak: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  chicken: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  seafood: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80',
  paneer: 'https://images.unsplash.com/photo-1567184109890-9a4897210e74?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
};

export function getRecipeImage(recipe) {
  if (recipe?.image_url && recipe.image_url.startsWith('http')) {
    return recipe.image_url;
  }

  const queryText = `${recipe?.name || ''} ${recipe?.cuisine || ''} ${recipe?.tags || ''}`.toLowerCase();

  for (const [key, url] of Object.entries(CUISINE_IMAGES)) {
    if (queryText.includes(key)) {
      return url;
    }
  }

  return CUISINE_IMAGES.default;
}

export const CULINARY_VIBES = [
  {
    id: 'comfort',
    name: 'Cozy Comfort',
    icon: '🌧️',
    tagline: 'Warm, soul-nourishing dishes for unwinding',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bgGlow: 'rgba(245, 158, 11, 0.15)',
    presetDish: 'Creamy Tomato Soup with Grilled Cheese'
  },
  {
    id: 'datenight',
    name: 'Date Night Luxury',
    icon: '🕯️',
    tagline: 'Romantic, impressive Michelin-style recipes',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    bgGlow: 'rgba(236, 72, 153, 0.15)',
    presetDish: 'Pan-Seared Ribeye with Truffle Herb Butter'
  },
  {
    id: 'quick',
    name: '15-Min Rush',
    icon: '⚡',
    tagline: 'Lightning fast, minimal dishes, zero hassle',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgGlow: 'rgba(16, 185, 129, 0.15)',
    presetDish: '10-Minute Garlic Chili Crisp Noodles'
  },
  {
    id: 'fitness',
    name: 'Macro Beast',
    icon: '🏋️',
    tagline: 'High-protein, lean macros for serious gains',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    bgGlow: 'rgba(59, 130, 246, 0.15)',
    presetDish: 'Honey-Soy Glazed Salmon & Quinoa Bowl'
  },
  {
    id: 'clean',
    name: 'Clean & Vibrant',
    icon: '🥑',
    tagline: 'Antioxidant-rich, plant-powered detox meals',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
    bgGlow: 'rgba(20, 184, 166, 0.15)',
    presetDish: 'Mediterranean Chickpea & Avocado Bowl'
  },
  {
    id: 'sweet',
    name: 'Midnight Sweet',
    icon: '🍰',
    tagline: 'Decadent desserts & artisanal sweet treats',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    bgGlow: 'rgba(139, 92, 246, 0.15)',
    presetDish: 'Warm Molten Lava Chocolate Mug Cake'
  }
];
