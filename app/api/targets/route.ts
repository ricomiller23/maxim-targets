import { NextRequest, NextResponse } from "next/server";
import { maximStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const sector = url.searchParams.get("sector") || undefined;
    const urgency = url.searchParams.get("urgency") || undefined;
    const workingCapital = (url.searchParams.get("workingCapital") as any) || undefined;
    const status = (url.searchParams.get("status") as any) || undefined;
    const panelist = (url.searchParams.get("panelist") as any) || undefined;
    const stage = url.searchParams.get("stage") || undefined;

    const targets = maximStore.getTargets({
      search,
      sector,
      urgency,
      workingCapital,
      status,
      panelist,
      stage
    });

    const metadata = maximStore.getMetadata();

    return NextResponse.json({
      success: true,
      metadata,
      totalReturned: targets.length,
      targets
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetId, stage, noteText, activity } = body;

    if (!targetId) {
      return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
    }

    if (stage) {
      maximStore.updateTargetCrm(targetId, { stage });
    }

    if (noteText) {
      const target = maximStore.getTarget(targetId);
      if (target) {
        target.crm.notes = target.crm.notes || [];
        target.crm.notes.unshift({
          id: `note-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          author: "Eric Miller <ricomiller@gmail.com>",
          text: noteText
        });
        maximStore.updateTargetCrm(targetId, { notes: target.crm.notes });
      }
    }

    if (activity) {
      maximStore.logActivity(targetId, activity);
    }

    const updated = maximStore.getTarget(targetId);
    return NextResponse.json({ success: true, target: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
