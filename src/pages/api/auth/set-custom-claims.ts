
import { auth } from "@/lib/firebase-admin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, { role });

    // Force token refresh
    await auth.revokeRefreshTokens(uid);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return res.status(500).json({ error: "Failed to set custom claims" });
  }
}
