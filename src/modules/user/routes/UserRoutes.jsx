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
import { AboutPage } from "../pages/about/AboutPage";
import { CategoriesPage } from "../pages/categories/CategoriesPage";
import { CollegesListingPage } from "../pages/college/CollegesListingPage";
import { BooksHomePage } from "../pages/books/BooksHomePage";
import { BookDetailsPage } from "../pages/books/BookDetailsPage";
import { BookCheckoutPage } from "../pages/books/BookCheckoutPage";
import { PdfReaderPage } from "../pages/books/PdfReaderPage";

// Online Coaching Module Pages
import { CoachingHomePage } from "../pages/coaching/CoachingHomePage";
import { CourseDetailsPage } from "../pages/coaching/CourseDetailsPage";
import { CourseRegistrationPage } from "../pages/coaching/CourseRegistrationPage";
import { CourseSelectorPage } from "../pages/coaching/CourseSelectorPage";
import { MyCoursesPage } from "../pages/coaching/MyCoursesPage";
import { CourseDashboardPage } from "../pages/coaching/CourseDashboardPage";
import { LecturePlayerPage } from "../pages/coaching/LecturePlayerPage";
import { BookReaderPage } from "../pages/coaching/BookReaderPage";
import { CourseSubscribePage } from "../pages/coaching/CourseSubscribePage";
import { CoursePlayerPage } from "../pages/coaching/CoursePlayerPage";
import { MySubscriptionsPage } from "../pages/coaching/MySubscriptionsPage";

// Other Pages
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
        <Route path="/about" element={<AboutPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        
        {/* Partner Colleges & Admissions */}
        <Route path="/colleges" element={<CollegesListingPage />} />
        <Route path="/colleges/:id" element={<Navigate to="/colleges" replace />} />

        {/* Books */}
        <Route path="/books" element={<BooksHomePage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
        <Route path="/books/:id/checkout" element={<BookCheckoutPage />} />
        <Route path="/books/:id/read" element={<PdfReaderPage />} />
        <Route path="/library" element={<Navigate to="/home" replace />} />

        {/* Online Coaching Hub */}
        <Route path="/coaching" element={<CoachingHomePage />} />
        <Route path="/coaching/register" element={<CourseRegistrationPage />} />
        <Route path="/coaching/select" element={<CourseSelectorPage />} />
        <Route path="/coaching/my-courses" element={<MyCoursesPage />} />
        <Route path="/coaching/:id" element={<CourseDetailsPage />} />
        <Route path="/coaching/:id/dashboard" element={<CourseDashboardPage />} />
        <Route path="/coaching/:id/lecture/:lectureId" element={<LecturePlayerPage />} />
        <Route path="/coaching/:id/book/:bookId" element={<BookReaderPage />} />
        <Route path="/coaching/:id/subscribe" element={<CourseSubscribePage />} />
        <Route path="/coaching/:id/player" element={<CoursePlayerPage />} />
        <Route path="/subscriptions" element={<MyCoursesPage />} />

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
