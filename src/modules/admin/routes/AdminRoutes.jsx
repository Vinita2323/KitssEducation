import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminCollegesPage } from "../pages/AdminCollegesPage";
import { AdminCollegeCoursesPage } from "../pages/AdminCollegeCoursesPage";
import { AdminApplicationsPage } from "../pages/AdminApplicationsPage";
import { AdminBooksPage } from "../pages/AdminBooksPage";

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="books" element={<AdminBooksPage />} />
        <Route path="colleges" element={<AdminCollegesPage />} />
        <Route path="colleges/:collegeId/courses" element={<AdminCollegeCoursesPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};
