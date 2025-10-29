import { Outlet } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />
      <main className="flex-1 p-4 pb-24">{/* espacio para BottomNav fijo */}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
