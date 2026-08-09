import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicLayout } from '../layouts/PublicLayout';

import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

import { DashboardPage } from '../pages/DashboardPage';
import { InterviewsPage } from '../pages/InterviewsPage';
import { CreateInterviewPage } from '../pages/CreateInterviewPage';
import { CalendarPage } from '../pages/CalendarPage';
import { CandidatesPage } from '../pages/CandidatesPage';
import { TemplatesPage } from '../pages/TemplatesPage';
import { SettingsPage } from '../pages/SettingsPage';

import { CandidateLoginPage } from '../pages/CandidateLoginPage';
import { CandidateDashboardPage } from '../pages/CandidateDashboardPage';
import { PublicSchedulePage } from '../pages/PublicSchedulePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Candidate Portal & Public Candidate Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/schedule/:token" element={<PublicSchedulePage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/candidate/login" element={<CandidateLoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/candidate/portal" element={<CandidateDashboardPage />} />

      {/* Recruiter Protected Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/interviews/new" element={<CreateInterviewPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
