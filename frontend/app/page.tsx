import { AmericanDreamDashboard } from "@/components/american-dream-dashboard";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function Home() {
  const data = await getDashboardData();

  return <AmericanDreamDashboard data={data} />;
}
