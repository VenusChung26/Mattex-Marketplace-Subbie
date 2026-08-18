import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import GreenPage from "./pages/GreenPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DetailsPage from "./pages/DetailsPage";
import RfqPage from "./pages/RfqPage";
import RfqsPage from "./pages/RfqsPage";
import WhatsappPage from "./pages/WhatsappPage";
import WhatsappChatPage from "./pages/WhatsappChatPage";
import SupplierPage from "./pages/SupplierPage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/green" element={<GreenPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/details/:id" element={<DetailsPage />} />
        <Route path="/supplier/:slug" element={<SupplierPage />} />
        <Route path="/rfq" element={<RfqPage />} />
        <Route path="/rfqs" element={<RfqsPage />} />
        <Route path="/whatsapp" element={<WhatsappPage />} />
        <Route path="/whatsapp/:id" element={<WhatsappPage />} />
        <Route path="/whatsapp-chat" element={<WhatsappChatPage />} />
        <Route path="/whatsapp-chat/:rfqId" element={<WhatsappChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
