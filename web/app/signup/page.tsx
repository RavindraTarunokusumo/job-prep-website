import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Start free trial"
      description="Create your account and start your 7-day free trial of the complete preparation workflow."
    >
      <SignupForm />
    </AuthShell>
  );
}