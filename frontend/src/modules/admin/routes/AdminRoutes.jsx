import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminUniversitiesPage } from "../pages/AdminUniversitiesPage";
import { AdminCollegesPage } from "../pages/AdminCollegesPage";
import { AdminCollegeCoursesPage } from "../pages/AdminCollegeCoursesPage";
import { AdminApplicationsPage } from "../pages/AdminApplicationsPage";
import { AdminFranchiseRequestsPage } from "../pages/AdminFranchiseRequestsPage";
import { AdminBooksPage } from "../pages/AdminBooksPage";

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="universities" element={<AdminUniversitiesPage />} />
        <Route path="colleges" element={<AdminCollegesPage />} />
        <Route path="colleges/:collegeId/courses" element={<AdminCollegeCoursesPage />} />
        <Route path="franchise-requests" element={<AdminFranchiseRequestsPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="books" element={<AdminBooksPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};
