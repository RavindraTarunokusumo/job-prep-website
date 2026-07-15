import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      description="Sign in to your RoleReady account and continue your preparation plan."
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}