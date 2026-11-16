const AdminStaffPage = lazyPage(() => import('../pages/AdminStaffPage'), "AdminStaffPage");
const AdminPolicyQueues = lazyPage(() => import('../pages/AdminPolicyQueues'), "AdminPolicyQueues");
const AdminResultsPage = lazyPage(() => import('../pages/AdminResultsPage'), "AdminResultsPage");
const AdminNotificationsPage = lazyPage(() => import('../pages/AdminNotificationsPage'), "AdminNotificationsPage");
const AdminCoachingPage = lazyPage(() => import('../pages/AdminCoachingPage'), "AdminCoachingPage");
const AdminEnrollmentsPage = lazyPage(() => import('../pages/AdminCoachingPage'), "AdminEnrollmentsPage");
const AdminOrdersPage = lazyPage(() => import('../pages/AdminOrdersPage'), "AdminOrdersPage");
const AdminRegistrationsPage = lazyPage(() => import('../pages/AdminRegistrationsPage'), "AdminRegistrationsPage");
import React from "react";
import { lazyPage } from '../../../shared/ui/lazyPage';
const AdminOperationsPage = lazyPage(() => import('../pages/AdminOperationsPage'), "AdminOperationsPage");
const AdminUsersPage = lazyPage(() => import('../pages/AdminUsersPage'), "AdminUsersPage");
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
const AdminDashboardPage = lazyPage(() => import("../pages/AdminDashboardPage"), "AdminDashboardPage");
const AdminUniversitiesPage = lazyPage(() => import("../pages/AdminUniversitiesPage"), "AdminUniversitiesPage");
const AdminCollegesPage = lazyPage(() => import("../pages/AdminCollegesPage"), "AdminCollegesPage");
const AdminCollegeCoursesPage = lazyPage(() => import("../pages/AdminCollegeCoursesPage"), "AdminCollegeCoursesPage");
const AdminApplicationsPage = lazyPage(() => import("../pages/AdminApplicationsPage"), "AdminApplicationsPage");
const AdminFranchiseRequestsPage = lazyPage(() => import("../pages/AdminFranchiseRequestsPage"), "AdminFranchiseRequestsPage");
const AdminBooksPage = lazyPage(() => import("../pages/AdminBooksPage"), "AdminBooksPage");

const AdminTaxonomiesPage = lazyPage(() => import('../pages/AdminTaxonomiesPage'), "AdminTaxonomiesPage");
import { RouteGuard } from '../../../shared/auth/RouteGuard';
const AdminContentPage = lazyPage(() => import('../pages/AdminContentPage'), "AdminContentPage");
const AdminMediaPage = lazyPage(() => import('../pages/AdminMediaPage'), "AdminMediaPage");
const AdminSiteSettingsPage = lazyPage(() => import('../pages/AdminSiteSettingsPage'), "AdminSiteSettingsPage");
import { LoginPage } from '../../user/pages/auth/LoginPage';
export const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<main className="kitss-admin admin-login-page min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4"><LoginPage staff /></main>} />
      <Route element={<RouteGuard staff><AdminLayout /></RouteGuard>}>
        <Route path="refunds" element={<RouteGuard permission="refunds.read"><AdminPolicyQueues /></RouteGuard>} /><Route path="access-requests" element={<RouteGuard permission="access.read"><AdminPolicyQueues access /></RouteGuard>} /><Route path="users" element={<RouteGuard permission="accounts.read"><AdminUsersPage /></RouteGuard>} />
        <Route path="staff" element={<RouteGuard permission="accounts.roles.manage"><AdminStaffPage /></RouteGuard>} />
        <Route path="audit-logs" element={<RouteGuard permission="audit.read"><AdminOperationsPage audit /></RouteGuard>} />
        <Route path="operations" element={<RouteGuard permission="operations.read"><AdminOperationsPage /></RouteGuard>} />
        <Route path="results" element={<RouteGuard permission="results.read"><AdminResultsPage /></RouteGuard>} />
        <Route path="notifications" element={<RouteGuard permission="notifications.read"><AdminNotificationsPage /></RouteGuard>} />
        <Route path="coaching" element={<RouteGuard permission="coaching.read"><AdminCoachingPage /></RouteGuard>} />
        <Route path="enrollments" element={<RouteGuard permission="learning.read"><AdminEnrollmentsPage /></RouteGuard>} />
        <Route path="orders" element={<RouteGuard permission="commerce.read"><AdminOrdersPage /></RouteGuard>} />
        <Route path="registrations" element={<RouteGuard permission="registrations.read"><AdminRegistrationsPage /></RouteGuard>} />
        <Route path="content" element={<RouteGuard permission="content.read"><AdminContentPage /></RouteGuard>} />
        <Route path="media" element={<RouteGuard permission="media.read"><AdminMediaPage /></RouteGuard>} />
        <Route path="settings" element={<RouteGuard permission="settings.read"><AdminSiteSettingsPage /></RouteGuard>} />
        <Route path="taxonomies" element={<RouteGuard permission="content.read"><AdminTaxonomiesPage /></RouteGuard>} />
        <Route index element={<RouteGuard permission="dashboard.read"><AdminDashboardPage /></RouteGuard>} />
        <Route path="universities" element={<RouteGuard permission="institutions.read"><AdminUniversitiesPage /></RouteGuard>} />
        <Route path="colleges" element={<RouteGuard permission="institutions.read"><AdminCollegesPage /></RouteGuard>} />
        <Route path="colleges/:collegeId/courses" element={<RouteGuard permission="institutions.read"><AdminCollegeCoursesPage /></RouteGuard>} />
        <Route path="franchise-requests" element={<RouteGuard permission="franchises.read"><AdminFranchiseRequestsPage /></RouteGuard>} />
        <Route path="applications" element={<RouteGuard permission="admissions.read"><AdminApplicationsPage /></RouteGuard>} />
        <Route path="books" element={<RouteGuard permission="books.read"><AdminBooksPage /></RouteGuard>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};
