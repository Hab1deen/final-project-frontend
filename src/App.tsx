import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./pages/auth/ProtectedRoute";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Protected Pages
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import QuotationDetailPage from "./pages/quotations/QuotationDetailPage";
import CreateQuotationPage from "./pages/quotations/CreateQuotationPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import InvoiceDetailPage from "./pages/invoices/InvoiceDetailPage";
import ProductsPage from "./components/products/ProductsPage";
import CustomersPage from "./pages/customers/CustomersPage";
import AppointmentsPage from "./pages/appointments/AppointmentsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/quotations" element={<QuotationsPage />} />
                    <Route path="/quotations/new" element={<CreateQuotationPage />} />
                    <Route path="/quotations/:id" element={<QuotationDetailPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/appointments" element={<AppointmentsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;