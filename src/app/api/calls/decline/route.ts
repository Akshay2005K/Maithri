import { handleCallRespondAction } from "@/lib/callsServer";

export async function POST(request: Request) {
  return handleCallRespondAction(request, "decline");
}
