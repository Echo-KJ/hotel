import { redirect } from "next/navigation";

/**
 * Root page - handled by middleware
 * Users will be redirected to either /login or /dashboard
 */
export default function HomePage() {
  // This will be handled by middleware
  // Authenticated users → /dashboard
  // Non-authenticated users → /login
  redirect("/login");
}
