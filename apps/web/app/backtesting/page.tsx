import { TopNav } from "../top-nav";
import { BacktestingConsole } from "./backtesting-console";

export default function BacktestingPage() {
  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <BacktestingConsole />
    </main>
  );
}
