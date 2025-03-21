
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
    const { uid, email, role } = req.body;

    if ((!uid && !email) || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let userUid = uid;
    
    // If email is provided but no uid, get the uid from email
    if (!uid && email) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        userUid = userRecord.uid;
      } catch (error) {
        console.error("Error getting user by email:", error);
        return res.status(404).json({ error: "User not found" });
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(userUid, { role });

    // Force token refresh
    await auth.revokeRefreshTokens(userUid);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return res.status(500).json({ error: "Failed to set custom claims" });
  }
}
