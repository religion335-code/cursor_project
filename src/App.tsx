import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./HomePage";
import { KitchenPage } from "./KitchenPage";
import { MenuPage } from "./MenuPage";
import { OrderPage } from "./OrderPage";
import { Shell } from "./Shell";
import { ShopPage } from "./ShopPage";
import { ShopProvider } from "./ShopContext";

export function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/kitchen" element={<KitchenPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ShopProvider>
  );
}
