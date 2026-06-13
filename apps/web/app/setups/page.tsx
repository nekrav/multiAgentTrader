import { TopNav } from "../top-nav";
import { TradeSetupsClient } from "./trade-setups-client";

export default function TradeSetupsPage() {
  return (
    <main className="shell intelligenceShell" id="main-content">
      <TopNav />
      <TradeSetupsClient />
    </main>
  );
}
