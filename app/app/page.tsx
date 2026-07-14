import { redirect } from "next/navigation";

export default function AppHomePage(): never {
  redirect("/app/brands");
}
