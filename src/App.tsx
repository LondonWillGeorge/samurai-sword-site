import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Lineage from "./pages/Lineage";
import OgawaKinnosuke from "./pages/masters/OgawaKinnosuke";
import AbbeKenshiro from "./pages/masters/AbbeKenshiro";
import OtaniTomio from "./pages/masters/OtaniTomio";
import Instructors from "./pages/Instructors";
import ShihanSelvey from "./pages/instructors/ShihanSelvey";
import RenshiNikandrovs from "./pages/instructors/RenshiNikandrovs";
import Gallery from "./pages/Gallery";
import Videos from "./pages/Videos";
import Schools from "./pages/Schools";
import Events from "./pages/Events";
import FreeTrial from "./pages/FreeTrial";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import ThreadDetail from "./pages/ThreadDetail";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/lineage" element={<Lineage />} />
            <Route path="/lineage/ogawa-kinnosuke" element={<OgawaKinnosuke />} />
            <Route path="/lineage/abbe-kenshiro" element={<AbbeKenshiro />} />
            <Route path="/lineage/otani-tomio" element={<OtaniTomio />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/instructors/shihan-selvey" element={<ShihanSelvey />} />
            <Route path="/instructors/renshi-nikandrovs" element={<RenshiNikandrovs />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/events" element={<Events />} />
            <Route path="/free-trial" element={<FreeTrial />} />
            <Route path="/login" element={<Login />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<ThreadDetail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/change-password" element={<ChangePassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
