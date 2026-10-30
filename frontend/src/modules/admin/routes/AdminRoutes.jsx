import { AdminStaffPage } from '../pages/AdminStaffPage';
import { AdminPolicyQueues } from '../pages/AdminPolicyQueues';
import { AdminResultsPage } from '../pages/AdminResultsPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';
import { AdminCoachingPage, AdminEnrollmentsPage } from '../pages/AdminCoachingPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { AdminRegistrationsPage } from '../pages/AdminRegistrationsPage';
import React from "react";
import { AdminUsersPage, AdminOperationsPage } from '../pages/AdminOperationsPage';
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminUniversitiesPage } from "../pages/AdminUniversitiesPage";
import { AdminCollegesPage } from "../pages/AdminCollegesPage";
import { AdminCollegeCoursesPage } from "../pages/AdminCollegeCoursesPage";
import { AdminApplicationsPage } from "../pages/AdminApplicationsPage";
import { AdminFranchiseRequestsPage } from "../pages/AdminFranchiseRequestsPage";
import { AdminBooksPage } from "../pages/AdminBooksPage";

import { AdminTaxonomiesPage } from '../pages/AdminTaxonomiesPage';
import { RouteGuard } from '../../../shared/auth/RouteGuard';
import { AdminContentPage } from '../pages/AdminContentPage';
import { AdminMediaPage } from '../pages/AdminMediaPage';
import { AdminSiteSettingsPage } from '../pages/AdminSiteSettingsPage';
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
