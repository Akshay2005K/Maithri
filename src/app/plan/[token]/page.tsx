import type { Metadata } from "next";
import PlanClient from "./PlanClient";

export const metadata: Metadata = {
  title: "Shared Meetup Plan | pHavelength",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PlanClient token={token} />;
}
