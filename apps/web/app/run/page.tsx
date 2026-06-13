import { TopNav } from "../top-nav";
import { RunConsole } from "./run-console";

export default function RunPage() {
  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <RunConsole />
    </main>
  );
}
