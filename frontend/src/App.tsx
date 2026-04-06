import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import PublicLayout from "@/layouts/PublicLayout";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";

import LandingPage from "@/pages/LandingPage";
import ImpactPage from "@/pages/ImpactPage";
import LoginPage from "@/pages/LoginPage";
import PrivacyPage from "@/pages/PrivacyPage";
import CookiesPage from "@/pages/CookiesPage";

import AdminDashboard from "@/pages/app/AdminDashboard";
import CaseloadPage from "@/pages/app/CaseloadPage";
import ProcessRecordingPage from "@/pages/app/ProcessRecordingPage";
import HomeVisitsPage from "@/pages/app/HomeVisitsPage";
import CaseConferencesPage from "@/pages/app/CaseConferencesPage";
import DonorsPage from "@/pages/app/DonorsPage";
import ReportsPage from "@/pages/app/ReportsPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
            </Route>

            {/* Login (standalone layout) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated routes */}
            <Route path="/app" element={<AuthenticatedLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="caseload" element={<CaseloadPage />} />
              <Route path="process-recording" element={<ProcessRecordingPage />} />
              <Route path="home-visits" element={<HomeVisitsPage />} />
              <Route path="case-conferences" element={<CaseConferencesPage />} />
              <Route path="donors" element={<DonorsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
