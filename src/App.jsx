import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PrivateRoute from "@/routes/PrivateRoute";

import AppShell from "@/components/layout/AppShell";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CustomerPicker from "@/pages/CustomerPicker";
import NewCustomer from "@/pages/NewCustomer";
import ProductCatalog from "@/pages/ProductCatalog";
import CartReview from "@/pages/CartReview";
import MyOrders from "@/pages/MyOrders";
import OrderDetail from "@/pages/OrderDetail";
import Confirmation from "@/pages/Confirmation";

const App = () => (
  <AuthProvider>
    <CartProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerPicker />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/catalog" element={<ProductCatalog />} />
          <Route path="/cart" element={<CartReview />} />
          <Route path="/confirmation/:id" element={<Confirmation />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </CartProvider>
  </AuthProvider>
);

export default App;
