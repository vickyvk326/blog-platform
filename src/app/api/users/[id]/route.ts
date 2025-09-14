import { getUser } from "@/app/service/user.service";
import { handleApiError } from "@/lib/next/errors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getUser(id);
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
