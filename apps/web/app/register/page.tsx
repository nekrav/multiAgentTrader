import { TopNav } from "../top-nav";
import { LoginForm } from "../login/login-form";

export default function RegisterPage() {
  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <section className="panelBlock authPanel">
        <p className="eyebrow">Account</p>
        <h1>Create Account</h1>
        <LoginForm mode="register" />
        <a className="primaryButton authAltButton" href="/login">
          Log In
        </a>
      </section>
    </main>
  );
}
