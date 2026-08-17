import { createCounselDraftUser, createCounselUser } from "@/lib/counsel";
import { getAccessCodeConfig } from "@/envConfig";
import { getDb } from "../db";
import { UserDBSchema } from "../schemas/user";
import { dbLogger } from "@/lib/logger";

const demoUser = (id: string, includePhone: boolean) => ({
  id,
  name: "John Doe",
  email: "john.doe@example.com",
  info: {
    dob: "1990-01-01",
    sex: "Male",
    address: {
      line1: "123 Main St",
      line2: "Apt 1",
      city: "San Francisco",
      state: "CA",
      zip: "94101",
    },
    ...(includePhone ? { phone: "+18007006000" } : {}),
    medicalProfile: {
      conditions: ["diabetes", "hypertension"],
      medications: ["metformin", "atenolol"],
    },
  },
});

export async function createUser({
  userId,
  accessCode,
  userType,
}: {
  userId: string;
  accessCode: string;
  userType: "main" | "onboarding";
}) {
  const db = await getDb();
  const config = getAccessCodeConfig(accessCode);
  const includePhone = config?.appContextMode !== "AI";
  const newUser = demoUser(userId, includePhone);
  // Determine if this is a draft user based on userType
  const isDraftUser = userType === "onboarding";
  const user = isDraftUser
    ? await createCounselDraftUser(newUser, accessCode)
    : await createCounselUser(newUser, accessCode);
  const stmt = db.prepare(
    `
    INSERT INTO users (id, counsel_user_id, name, email, info) VALUES (?, ?, ?, ?, ?);
  `
  );
  stmt.run(
    userId,
    user.id,
    newUser.name,
    newUser.email,
    JSON.stringify(newUser.info)
  );
  dbLogger.info({ userId }, "Created user in DB");
  return UserDBSchema.parse({
    id: userId,
    counsel_user_id: user.id,
    name: newUser.name,
    email: newUser.email,
    info: newUser.info,
  });
}
