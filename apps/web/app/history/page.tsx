import { TopNav } from "../top-nav";
import { SavedAnalysesClient } from "./saved-analyses-client";

export default function HistoryPage() {
  return (
    <main className="shell intelligenceShell" id="main-content">
      <TopNav />
      <SavedAnalysesClient />
    </main>
  );
}
