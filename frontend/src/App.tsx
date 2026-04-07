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
import DonatePage from "@/pages/DonatePage";
import LoginPage from "@/pages/LoginPage";
import PrivacyPage from "@/pages/PrivacyPage";
import CookiesPage from "@/pages/CookiesPage";

import AdminDashboard from "@/pages/app/AdminDashboard";
import CaseloadPage from "@/pages/app/CaseloadPage";
import ResidentDetailPage from "@/pages/app/ResidentDetailPage";
import ProcessRecordingPage from "@/pages/app/ProcessRecordingPage";
import HomeVisitsPage from "@/pages/app/HomeVisitsPage";
import CaseConferencesPage from "@/pages/app/CaseConferencesPage";
import DonorsPage from "@/pages/app/DonorsPage";
import SupporterProfilePage from "@/pages/app/SupporterProfilePage";
import ReportsPage from "@/pages/app/ReportsPage";
import NewIntakePage from "@/pages/app/NewIntakePage";
import NewVisitPage from "@/pages/app/NewVisitPage";
import NewDonationPage from "@/pages/app/NewDonationPage";
import NewConferencePage from "@/pages/app/NewConferencePage";
import NewProcessRecordingPage from "@/pages/app/NewProcessRecordingPage";
import GenerateReportPage from "@/pages/app/GenerateReportPage";
import SocialMediaInsightsPage from "@/pages/app/SocialMediaInsightsPage";

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
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
            </Route>

            {/* Login (standalone layout) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated routes */}
            <Route path="/app" element={<AuthenticatedLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="caseload" element={<CaseloadPage />} />
              <Route path="caseload/:residentId" element={<ResidentDetailPage />} />
              <Route path="process-recording" element={<ProcessRecordingPage />} />
              <Route path="home-visits" element={<HomeVisitsPage />} />
              <Route path="case-conferences" element={<CaseConferencesPage />} />
              <Route path="donors" element={<DonorsPage />} />
              <Route path="donors/:supporterId" element={<SupporterProfilePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="intake/new" element={<NewIntakePage />} />
              <Route path="visits/new" element={<NewVisitPage />} />
              <Route path="donations/new" element={<NewDonationPage />} />
              <Route path="conferences/new" element={<NewConferencePage />} />
              <Route path="recordings/new" element={<NewProcessRecordingPage />} />
              <Route path="reports/generate" element={<GenerateReportPage />} />
              <Route path="social" element={<SocialMediaInsightsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
