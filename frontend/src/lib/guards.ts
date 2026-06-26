import { redirect } from "@tanstack/react-router";
import { getAccessToken } from "./api";

export function requireAuth() {
  if (!getAccessToken()) {
    throw redirect({ to: "/login" });
  }
}

export function requireGuest() {
  if (getAccessToken()) {
    throw redirect({ to: "/dashboard" });
  }
}
