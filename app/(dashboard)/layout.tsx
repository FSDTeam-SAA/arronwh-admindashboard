import Header from "@/components/ui/common/Header";
import { Sidebar } from "@/components/ui/common/Sidebar";


function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar/>

        <div className="flex-1 overflow-y-auto p-6 mt-[80px] bg-[#F0F3F6]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default layout;