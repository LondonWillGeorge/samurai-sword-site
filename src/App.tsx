import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Lineage from "./pages/Lineage";
import OgawaKinnosuke from "./pages/masters/OgawaKinnosuke";
import AbbeKenshiro from "./pages/masters/AbbeKenshiro";
import OtaniTomio from "./pages/masters/OtaniTomio";
import Instructors from "./pages/Instructors";
import Gallery from "./pages/Gallery";
import Schools from "./pages/Schools";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lineage" element={<Lineage />} />
          <Route path="/lineage/ogawa-kinnosuke" element={<OgawaKinnosuke />} />
          <Route path="/lineage/abbe-kenshiro" element={<AbbeKenshiro />} />
          <Route path="/lineage/otani-tomio" element={<OtaniTomio />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/events" element={<Events />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
