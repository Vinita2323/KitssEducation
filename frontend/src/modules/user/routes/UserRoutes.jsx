import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { RouteGuard } from '../../../shared/auth/RouteGuard';
import { IdentityPage } from '../pages/auth/IdentityPage';
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
import { MyPurchasedBooksPage } from "../pages/books/MyPurchasedBooksPage";

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

// Other Pages
import { ResultsPage } from "../pages/results/ResultsPage";
import { MyOrdersPage } from "../pages/orders/MyOrdersPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { SettingsPage } from "../pages/profile/SettingsPage";

import { useAuth } from "../context/AuthContext";
export const UserRoutes = () => {
  const {user}=useAuth();
  return (
    <Routes>
      {/* Direct landing without Splash or Onboarding */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/splash" element={<Navigate to="/home" replace />} />
      <Route path="/onboarding" element={<Navigate to="/home" replace />} />

      {/* Auth Screens with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/account/create" element={<IdentityPage />} />
        <Route path="/account/verify" element={<IdentityPage verify />} />
        <Route path="/staff/accept" element={<IdentityPage invitation />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-success" element={<Navigate to="/account/verify" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Main Student Portal Screens with UserLayout */}
      <Route element={<UserLayout />}>
        <Route path="/home" element={<HomeDashboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        
        {/* Former institutes directory; colleges now lists every institution */}
        <Route path="/institutes" element={<Navigate to="/colleges" replace />} />
        <Route path="/institutes/:id" element={<Navigate to="/colleges" replace />} />

        {/* Partner Colleges & Admissions */}
        <Route path="/colleges" element={<CollegesListingPage />} />
        <Route path="/colleges/:id" element={<Navigate to="/colleges" replace />} />

        {/* Books */}
        <Route path="/books" element={<BooksHomePage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
        <Route path="/books/:id/checkout" element={<RouteGuard><BookCheckoutPage /></RouteGuard>} />
        <Route path="/books/:id/read" element={<RouteGuard><PdfReaderPage key={user?.id || "guest"} /></RouteGuard>} />
        <Route path="/my-books" element={<RouteGuard><MyPurchasedBooksPage /></RouteGuard>} />
        <Route path="/library" element={<Navigate to="/my-books" replace />} />

        {/* Online Coaching Hub */}
        <Route path="/coaching" element={<CoachingHomePage />} />
        <Route path="/coaching/register" element={<RouteGuard><CourseRegistrationPage /></RouteGuard>} />
        <Route path="/coaching/select" element={<CourseSelectorPage key={user?.id || "guest"} />} />
        <Route path="/coaching/my-courses" element={<RouteGuard><MyCoursesPage key={user?.id || "guest"} /></RouteGuard>} />
        <Route path="/coaching/:id" element={<CourseDetailsPage key={user?.id || "guest"} />} />
        <Route path="/coaching/:id/dashboard" element={<RouteGuard><CourseDashboardPage key={user?.id || "guest"} /></RouteGuard>} />
        <Route path="/coaching/:id/lecture/:lectureId" element={<LecturePlayerPage key={user?.id || "guest"} />} />
        <Route path="/coaching/:id/book/:bookId" element={<RouteGuard><BookReaderPage key={user?.id || "guest"} /></RouteGuard>} />
        <Route path="/coaching/:id/subscribe" element={<RouteGuard><CourseSubscribePage /></RouteGuard>} />
        <Route path="/coaching/:id/player" element={<RouteGuard><CoursePlayerPage key={user?.id || "guest"} /></RouteGuard>} />
        <Route path="/subscriptions" element={<RouteGuard><MyCoursesPage key={user?.id || "guest"} /></RouteGuard>} />

        {/* Results */}
        <Route path="/results" element={<ResultsPage />} />

        {/* Orders */}
        <Route path="/orders" element={<RouteGuard><MyOrdersPage /></RouteGuard>} />

        {/* Notifications */}
        <Route path="/notifications" element={<RouteGuard><NotificationsPage /></RouteGuard>} />

        {/* Profile & Settings */}
        <Route path="/profile" element={<RouteGuard><ProfilePage /></RouteGuard>} />
        <Route path="/settings" element={<RouteGuard><SettingsPage /></RouteGuard>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
