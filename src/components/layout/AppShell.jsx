import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";

const AppShell = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
