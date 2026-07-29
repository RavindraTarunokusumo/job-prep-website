import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least 8 characters. Your reset link must still be valid in this browser."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
