import React from "react";
import { lazyPage } from '../../../shared/ui/lazyPage';
import { Routes, Route, Navigate } from "react-router-dom";

import { RouteGuard } from '../../../shared/auth/RouteGuard';
import { IdentityPage } from '../pages/auth/IdentityPage';
// Layouts
import { UserLayout } from "../components/layout/UserLayout";
import { AuthLayout } from "../components/layout/AuthLayout";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterSuccessPage } from "../pages/auth/RegisterSuccessPage";
import { ForgotPasswordPage, ResetPasswordPage } from "../pages/auth/ForgotPasswordPage";

// Main & Domain Pages
import { HomeDashboardPage } from "../pages/dashboard/HomeDashboardPage";
const AboutPage = lazyPage(() => import("../pages/about/AboutPage"), "AboutPage");
const CategoriesPage = lazyPage(() => import("../pages/categories/CategoriesPage"), "CategoriesPage");
const CollegesListingPage = lazyPage(() => import("../pages/college/CollegesListingPage"), "CollegesListingPage");
const BooksHomePage = lazyPage(() => import("../pages/books/BooksHomePage"), "BooksHomePage");
const BookDetailsPage = lazyPage(() => import("../pages/books/BookDetailsPage"), "BookDetailsPage");
const BookCheckoutPage = lazyPage(() => import("../pages/books/BookCheckoutPage"), "BookCheckoutPage");
const PdfReaderPage = lazyPage(() => import("../pages/books/PdfReaderPage"), "PdfReaderPage");
const MyPurchasedBooksPage = lazyPage(() => import("../pages/books/MyPurchasedBooksPage"), "MyPurchasedBooksPage");

// Online Coaching Module Pages
const CoachingHomePage = lazyPage(() => import("../pages/coaching/CoachingHomePage"), "CoachingHomePage");
const CourseDetailsPage = lazyPage(() => import("../pages/coaching/CourseDetailsPage"), "CourseDetailsPage");
const CourseRegistrationPage = lazyPage(() => import("../pages/coaching/CourseRegistrationPage"), "CourseRegistrationPage");
const CourseSelectorPage = lazyPage(() => import("../pages/coaching/CourseSelectorPage"), "CourseSelectorPage");
const MyCoursesPage = lazyPage(() => import("../pages/coaching/MyCoursesPage"), "MyCoursesPage");
const CourseDashboardPage = lazyPage(() => import("../pages/coaching/CourseDashboardPage"), "CourseDashboardPage");
const LecturePlayerPage = lazyPage(() => import("../pages/coaching/LecturePlayerPage"), "LecturePlayerPage");
const BookReaderPage = lazyPage(() => import("../pages/coaching/BookReaderPage"), "BookReaderPage");
const CourseSubscribePage = lazyPage(() => import("../pages/coaching/CourseSubscribePage"), "CourseSubscribePage");
const CoursePlayerPage = lazyPage(() => import("../pages/coaching/CoursePlayerPage"), "CoursePlayerPage");

// Other Pages
const ResultsPage = lazyPage(() => import("../pages/results/ResultsPage"), "ResultsPage");
const MyOrdersPage = lazyPage(() => import("../pages/orders/MyOrdersPage"), "MyOrdersPage");
const NotificationsPage = lazyPage(() => import("../pages/notifications/NotificationsPage"), "NotificationsPage");
const ProfilePage = lazyPage(() => import("../pages/profile/ProfilePage"), "ProfilePage");
const SettingsPage = lazyPage(() => import("../pages/profile/SettingsPage"), "SettingsPage");

const MyApplicationsPage = lazyPage(() => import('../pages/auth/MyApplicationsPage'), "MyApplicationsPage");
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
        <Route path="/register-success" element={<Navigate to="/account/verify" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Main Student Portal Screens with UserLayout */}
      <Route element={<UserLayout />}>
        <Route path="/home" element={<HomeDashboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        
        {/* Legacy directory links open the franchise filter on the combined listing. */}
        <Route path="/institutes" element={<Navigate to="/colleges?network=franchise" replace />} />
        <Route path="/franchises" element={<Navigate to="/colleges?network=franchise" replace />} />
        <Route path="/my-applications" element={<RouteGuard><MyApplicationsPage key={user?.id || "guest"} /></RouteGuard>} />
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
        <Route path="/results" element={<ResultsPage key={user?.id || "guest"} />} />

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
