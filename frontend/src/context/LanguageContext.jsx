import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    favorites: 'Favorites', 
    grocery: 'Grocery',
    mealPlan: 'Meal Plan',
    fridgeMode: 'Fridge Mode',
    profile: 'Profile',
    adminPanel: 'Admin Panel',
    reviews: 'Reviews',
    logout: 'Logout',
    
    // Dashboard
    hello: 'Hello',
    whatToCook: 'What would you like to cook today?',
    dishName: 'Dish Name',
    dishPlaceholder: 'e.g. Chicken Biryani, Pasta, Pizza...',
    servings: 'Servings',
    cookIt: '🍳 Cook It!',
    searching: '🔍 Searching...',
    aiCooking: 'AI is cooking your recipe',
    recentSearches: 'Recent Searches',
    aiRecommendations: '🤖 AI Recommendations',
    trendingRecipes: '🔥 Recently Generated Recipes',
    noRecipesYet: 'No recipes yet',
    searchFirst: 'Search for your first dish above to get started!',
    
    // Stats
    searches: 'Searches',
    mealPlans: 'Meal Plans',
    groceryLists: 'Grocery Lists',
    
    // Recipe details
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium', 
    hard: 'Hard',
    calories: 'kcal',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    fiber: 'Fiber',
    
    // Reviews
    writeReview: 'Write a Review',
    reviewTitle: 'Review Title',
    reviewText: 'Your Review',
    rating: 'Rating',
    submitReview: 'Submit Review',
    allReviews: 'All Reviews',
    userReviews: 'User Reviews & Feedback',
    noReviews: 'No reviews yet',
    beFirst: 'Be the first to share your feedback!',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Success!',
  },

  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    favorites: 'पसंदीदा', 
    grocery: 'किराना',
    mealPlan: 'भोजन योजना',
    fridgeMode: 'फ्रिज मोड',
    profile: 'प्रोफाइल',
    adminPanel: 'एडमिन पैनल',
    reviews: 'समीक्षाएं',
    logout: 'लॉगआउट',
    
    // Dashboard
    hello: 'नमस्ते',
    whatToCook: 'आज आप क्या पकाना चाहेंगे?',
    dishName: 'व्यंजन का नाम',
    dishPlaceholder: 'जैसे चिकन बिरयानी, पास्ता, पिज्जा...',
    servings: 'सर्विंग्स',
    cookIt: '🍳 पकाएं!',
    searching: '🔍 खोजा जा रहा है...',
    aiCooking: 'AI आपकी रेसिपी तैयार कर रहा है',
    recentSearches: 'हाल की खोजें',
    aiRecommendations: '🤖 AI सुझाव',
    trendingRecipes: '🔥 हाल में बनी रेसिपीज',
    noRecipesYet: 'अभी तक कोई रेसिपी नहीं',
    searchFirst: 'शुरुआत करने के लिए ऊपर अपना पहला व्यंजन खोजें!',
    
    // Stats
    searches: 'खोजें',
    mealPlans: 'भोजन योजनाएं',
    groceryLists: 'किराना सूची',
    
    // Recipe details
    difficulty: 'कठिनाई',
    easy: 'आसान',
    medium: 'मध्यम', 
    hard: 'कठिन',
    calories: 'कैलोरी',
    protein: 'प्रोटीन',
    carbs: 'कार्बोहाइड्रेट',
    fat: 'वसा',
    fiber: 'फाइबर',
    
    // Reviews
    writeReview: 'समीक्षा लिखें',
    reviewTitle: 'समीक्षा शीर्षक',
    reviewText: 'आपकी समीक्षा',
    rating: 'रेटिंग',
    submitReview: 'समीक्षा जमा करें',
    allReviews: 'सभी समीक्षाएं',
    userReviews: 'उपयोगकर्ता समीक्षा और फीडबैक',
    noReviews: 'अभी तक कोई समीक्षा नहीं',
    beFirst: 'अपना फीडबैक साझा करने वाले पहले व्यक्ति बनें!',
    
    // Common
    save: 'सेव करें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि हुई',
    success: 'सफलता!',
  },
  
  es: {
    // Navigation
    dashboard: 'Panel',
    favorites: 'Favoritos',
    grocery: 'Compras',
    mealPlan: 'Plan de Comidas',
    fridgeMode: 'Modo Nevera',
    profile: 'Perfil',
    adminPanel: 'Panel Admin',
    reviews: 'Reseñas',
    logout: 'Cerrar Sesión',
    
    // Dashboard
    hello: 'Hola',
    whatToCook: '¿Qué te gustaría cocinar hoy?',
    dishName: 'Nombre del Plato',
    dishPlaceholder: 'ej. Pollo Biryani, Pasta, Pizza...',
    servings: 'Porciones',
    cookIt: '🍳 ¡A Cocinar!',
    searching: '🔍 Buscando...',
    aiCooking: 'IA está preparando tu receta',
    recentSearches: 'Búsquedas Recientes',
    aiRecommendations: '🤖 Recomendaciones IA',
    trendingRecipes: '🔥 Recetas Recientes',
    noRecipesYet: 'No hay recetas aún',
    searchFirst: '¡Busca tu primer plato arriba para comenzar!',
    
    // Stats
    searches: 'Búsquedas',
    mealPlans: 'Planes de Comida',
    groceryLists: 'Listas de Compras',
    
    // Recipe details
    difficulty: 'Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    calories: 'kcal',
    protein: 'Proteína',
    carbs: 'Carbohidratos',
    fat: 'Grasa',
    fiber: 'Fibra',
    
    // Reviews
    writeReview: 'Escribir Reseña',
    reviewTitle: 'Título de Reseña',
    reviewText: 'Tu Reseña',
    rating: 'Calificación',
    submitReview: 'Enviar Reseña',
    allReviews: 'Todas las Reseñas',
    userReviews: 'Reseñas y Comentarios de Usuarios',
    noReviews: 'No hay reseñas aún',
    beFirst: '¡Sé el primero en compartir tu opinión!',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando...',
    error: 'Error ocurrido',
    success: '¡Éxito!',
  },
  
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    favorites: 'Favoris',
    grocery: 'Courses',
    mealPlan: 'Plan Repas',
    fridgeMode: 'Mode Frigo',
    profile: 'Profil',
    adminPanel: 'Panel Admin',
    reviews: 'Avis',
    logout: 'Déconnexion',
    
    // Dashboard  
    hello: 'Salut',
    whatToCook: 'Que voulez-vous cuisiner aujourd\'hui?',
    dishName: 'Nom du Plat',
    dishPlaceholder: 'ex. Poulet Biryani, Pâtes, Pizza...',
    servings: 'Portions',
    cookIt: '🍳 Cuisiner!',
    searching: '🔍 Recherche...',
    aiCooking: 'L\'IA prépare votre recette',
    recentSearches: 'Recherches Récentes',
    aiRecommendations: '🤖 Recommandations IA',
    trendingRecipes: '🔥 Recettes Récentes',
    noRecipesYet: 'Pas encore de recettes',
    searchFirst: 'Recherchez votre premier plat ci-dessus pour commencer!',
    
    // Stats
    searches: 'Recherches',
    mealPlans: 'Plans Repas',
    groceryLists: 'Listes Courses',
    
    // Recipe details
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    calories: 'kcal',
    protein: 'Protéine',
    carbs: 'Glucides',
    fat: 'Graisse',
    fiber: 'Fibre',
    
    // Reviews
    writeReview: 'Écrire un Avis',
    reviewTitle: 'Titre de l\'Avis',
    reviewText: 'Votre Avis',
    rating: 'Note',
    submitReview: 'Soumettre l\'Avis',
    allReviews: 'Tous les Avis',
    userReviews: 'Avis et Commentaires des Utilisateurs',
    noReviews: 'Pas encore d\'avis',
    beFirst: 'Soyez le premier à partager votre avis!',
    
    // Common
    save: 'Sauvegarder',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Erreur survenue',
    success: 'Succès!',
  }
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('chefai-language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('chefai-language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}