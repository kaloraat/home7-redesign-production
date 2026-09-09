/**
 * One-off local dev seed: creates an admin login and a couple of sample
 * records so the site isn't empty on first run. Run with:
 *   npx tsx scripts/seed.ts
 * Requires MONGODB_URI in .env.local (or the environment) and an
 * ADMIN_PASSWORD env var for the seeded admin account.
 */
import { config } from "dotenv";
// Plain dotenv only loads a file literally named ".env" by default — Next.js's
// own ".env.local" auto-loading doesn't apply outside the Next.js runtime, so
// this script has to load it explicitly.
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import dbConnect from "../src/lib/db";
import Admin from "../src/models/Admin";
import Agent from "../src/models/Agent";
import Property from "../src/models/Property";

async function main() {
  await dbConnect();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@home7.com.au";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Set SEED_ADMIN_PASSWORD before running the seed script.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await Admin.findOneAndUpdate(
    { email: adminEmail },
    { name: "Home7 Admin", email: adminEmail, passwordHash, role: "owner" },
    { upsert: true }
  );
  console.log(`Admin ready: ${adminEmail}`);

  // Bio is the export's own team_members.json description for this record,
  // lightly cleaned up (grammar/spacing only — "Mohammed Having built" →
  // "Mohammed has built", place-name capitalization) rather than rewritten;
  // it's distinctive per-agent content, not template boilerplate, so it's
  // treated the same as the homepage brand story: preserved, not rewritten.
  // The trailing "Contact him — redwan@home7.com.au" line from that export
  // is dropped since it's redundant with the phone/email fields below.
  const agent = await Agent.findOneAndUpdate(
    { slug: "mohammed-r-islam" },
    {
      slug: "mohammed-r-islam",
      name: "Mohammed R Islam",
      role: "Principal (Executive Director)",
      phone: "(02) 8729 7753",
      mobile: "0424 955 108",
      email: "admin@home7.com.au",
      photo: "/images/team/mohammed-r-islam.png",
      facebook: "https://www.facebook.com/profile.php?id=100063818245277",
      linkedin: "https://www.linkedin.com/in/mohammed-r-islam-2a9266b7/",
      bio: "Mohammed has built a strong reputation as a highly skilled negotiator and exceptional sales strategist. He is known for providing the highest level of service to all our clients. Mohammed consistently exceeds vendor expectations, including recent record sales in Sydney, Liverpool, Minto, Campbelltown, Glenfield, Oran Park, Bardia, Denham Court, Mittagong, Bankstown and Rockdale. As a Sydney resident, he has a great appreciation for the history of the area and shares a love of the vibrant lifestyle on offer. A proven high achiever, Mohammed's proficiency across a broad range of property — from apartments to multi-million dollar homes — ensures that all our clients receive knowledgeable and genuine advice appropriate to current market conditions. An outstanding communicator with exceptional local knowledge, Mohammed consistently achieves extraordinary results with honesty and tenacity, the building blocks from which he approaches our day-to-day business.",
      order: 0,
    },
    { upsert: true, new: true }
  );
  console.log(`Agent ready: ${agent.name}`);

  await Property.findOneAndUpdate(
    { slug: "example-street-liverpool-nsw-2170" },
    {
      slug: "example-street-liverpool-nsw-2170",
      address: "1 Example Street",
      suburb: "Liverpool",
      postcode: "2170",
      listingType: "sale",
      priceDisplay: "$700,000 - $750,000",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,
      description: "Sample listing created by the seed script — replace via /admin.",
      agent: agent._id,
      featured: true,
    },
    { upsert: true }
  );
  console.log("Sample property ready.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
