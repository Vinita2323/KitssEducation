import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { UserLayout } from "../components/layout/UserLayout";
import { AuthLayout } from "../components/layout/AuthLayout";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { RegisterSuccessPage } from "../pages/auth/RegisterSuccessPage";
import { ForgotPasswordPage, ResetPasswordPage } from "../pages/auth/ForgotPasswordPage";

// Main & Domain Pages
import { HomeDashboardPage } from "../pages/dashboard/HomeDashboardPage";
import { BooksHomePage } from "../pages/books/BooksHomePage";
import { BookDetailsPage } from "../pages/books/BookDetailsPage";
import { BookCheckoutPage } from "../pages/books/BookCheckoutPage";
import { PdfReaderPage } from "../pages/books/PdfReaderPage";
import { MyLibraryPage } from "../pages/library/MyLibraryPage";
import { CoachingHomePage } from "../pages/coaching/CoachingHomePage";
import { CourseDetailsPage } from "../pages/coaching/CourseDetailsPage";
import { CourseSubscribePage } from "../pages/coaching/CourseSubscribePage";
import { CoursePlayerPage } from "../pages/coaching/CoursePlayerPage";
import { MySubscriptionsPage } from "../pages/coaching/MySubscriptionsPage";
import { ResultsPage } from "../pages/results/ResultsPage";
import { MyOrdersPage } from "../pages/orders/MyOrdersPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { SettingsPage } from "../pages/profile/SettingsPage";

export const UserRoutes = () => {
  return (
    <Routes>
      {/* Direct landing without Splash or Onboarding */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/splash" element={<Navigate to="/home" replace />} />
      <Route path="/onboarding" element={<Navigate to="/home" replace />} />

      {/* Auth Screens with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-success" element={<RegisterSuccessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Main Student Portal Screens with UserLayout */}
      <Route element={<UserLayout />}>
        <Route path="/home" element={<HomeDashboardPage />} />
        
        {/* Books */}
        <Route path="/books" element={<BooksHomePage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
        <Route path="/books/:id/checkout" element={<BookCheckoutPage />} />
        <Route path="/books/:id/read" element={<PdfReaderPage />} />
        <Route path="/library" element={<MyLibraryPage />} />

        {/* Online Coaching */}
        <Route path="/coaching" element={<CoachingHomePage />} />
        <Route path="/coaching/:id" element={<CourseDetailsPage />} />
        <Route path="/coaching/:id/subscribe" element={<CourseSubscribePage />} />
        <Route path="/coaching/:id/player" element={<CoursePlayerPage />} />
        <Route path="/subscriptions" element={<MySubscriptionsPage />} />

        {/* Results */}
        <Route path="/results" element={<ResultsPage />} />

        {/* Orders */}
        <Route path="/orders" element={<MyOrdersPage />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Profile & Settings */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
