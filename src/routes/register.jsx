import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/components/auth/RegisterPage";
import { SignupClosedPage } from "@/components/auth/SignupClosedPage";
import { TESTING_MODE } from "@/lib/testing";

export const Route = createFileRoute("/register")({ ssr: false, component: TESTING_MODE ? SignupClosedPage : RegisterPage });
