import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import GroceryPage from './pages/GroceryPage';
import MealPlannerPage from './pages/MealPlannerPage';
import FridgeModePage from './pages/FridgeModePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LoginLogsPage from './pages/LoginLogsPage';
import ReviewsPage from './pages/ReviewsPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';

import LocationMealsPage from './pages/LocationMealsPage';
import SmartFridgePage from './pages/SmartFridgePage';
import { LocationProvider } from './context/LocationContext';
import TopHeader from './components/TopHeader';
import ChatWidget from './components/ChatWidget';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <>
      <Navbar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`app-main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <TopHeader />
        {children}
      </main>
      <ChatWidget />
    </>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/recipe/:id" element={<ProtectedRoute><AppLayout><RecipeDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><AppLayout><FavoritesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/grocery" element={<ProtectedRoute><AppLayout><GroceryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/meal-planner" element={<ProtectedRoute><AppLayout><MealPlannerPage /></AppLayout></ProtectedRoute>} />
      <Route path="/fridge-mode" element={<ProtectedRoute><AppLayout><FridgeModePage /></AppLayout></ProtectedRoute>} />
      <Route path="/smart-fridge" element={<ProtectedRoute><AppLayout><SmartFridgePage /></AppLayout></ProtectedRoute>} />
      <Route path="/location-meals" element={<ProtectedRoute><AppLayout><LocationMealsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><AppLayout><ReviewsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/features" element={<ProtectedRoute><AppLayout><FeaturesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><AppLayout><AboutPage /></AppLayout></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AppLayout><AdminPage /></AppLayout></AdminRoute>} />
      <Route path="/login-logs" element={<ProtectedRoute><AppLayout><LoginLogsPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function ToasterConfig() {
  const { theme } = useTheme();
  
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{
        style: { 
          background: theme === 'dark' ? '#0f1624' : '#ffffff', 
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a', 
          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
          borderRadius: 12 
        },
        success: { iconTheme: { primary: '#10b981', secondary: theme === 'dark' ? '#fff' : '#000' } },
        error: { iconTheme: { primary: '#ef4444', secondary: theme === 'dark' ? '#fff' : '#000' } },
      }} 
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <LocationProvider>
              <ToasterConfig />
              <AppRoutes />
            </LocationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
