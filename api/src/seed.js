import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./utils/db.js";
import { Tenant } from "./models/Tenant.js";
import { User } from "./models/User.js";

dotenv.config();

async function run() {
  await connectToDatabase(process.env.MONGODB_URI);

  await Promise.all([Tenant.deleteMany({}), User.deleteMany({})]);

  const acme = await Tenant.create({ slug: "acme", name: "Acme", plan: "free" });
  const globex = await Tenant.create({ slug: "globex", name: "Globex", plan: "free" });

  const passwordHash = await bcrypt.hash("password", 10);

  await User.create([
    { email: "admin@acme.test", passwordHash, role: "admin", plan: "pro", tenantId: acme._id },
    { email: "user@acme.test", passwordHash, role: "member", plan: "free", tenantId: acme._id },
    { email: "admin@globex.test", passwordHash, role: "admin", plan: "pro", tenantId: globex._id },
    { email: "user@globex.test", passwordHash, role: "member", plan: "free", tenantId: globex._id },
  ]);

  console.log("Seeded tenants and users");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


