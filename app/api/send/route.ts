import { NextRequest, NextResponse } from "next/server";
import { maximStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetId, contactEmail, contactName, outreachType, subject } = body;

    if (!targetId) {
      return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
    }

    const target = maximStore.getTarget(targetId);
    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const activity = {
      type: "email" as const,
      summary: `Dispatched ${outreachType || "Management"} outreach to ${contactName || "Executive"} (${contactEmail || "corporate address"}) regarding non-dilutive liquidity and recapitalization.`
    };

    maximStore.logActivity(targetId, activity);
    maximStore.updateTargetCrm(targetId, { stage: "contacted" });

    return NextResponse.json({
      success: true,
      target: maximStore.getTarget(targetId)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
