import { TopNav } from "../top-nav";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <section className="panelBlock authPanel">
        <p className="eyebrow">Account</p>
        <h1>Log In</h1>
        <LoginForm mode="login" />
        <a className="backLink" href="/register">
          Create account
        </a>
      </section>
    </main>
  );
}
