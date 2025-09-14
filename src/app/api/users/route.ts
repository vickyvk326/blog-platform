import { NextResponse } from "next/server";
import { getUsers } from "@/app/service/user.service";
import { handleApiError, withErrorHandling } from "@/lib/next/errors";

export async function GET() {
  try {
    const users = withErrorHandling(getUsers);
    return NextResponse.json(users);
  } catch (error) {
    handleApiError(error);
  }
}
