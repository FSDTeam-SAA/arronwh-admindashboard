import Header from "@/components/ui/common/Header";
import { Sidebar } from "@/components/ui/common/Sidebar";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (!session?.accessToken || role !== "admin") {
    redirect("/login");
  }

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
