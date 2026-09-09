/**
 * One-off: populates photo/bio/socials on the existing Mohammed R Islam
 * agent record. Split out from seed.ts deliberately — seed.ts also upserts
 * the Admin login, which would overwrite real production credentials if run
 * without knowing the existing password. This touches only the Agent
 * collection. Run with: npx tsx scripts/update-mohammed-agent.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import dbConnect from "../src/lib/db";
import Agent from "../src/models/Agent";

async function main() {
  await dbConnect();

  const agent = await Agent.findOneAndUpdate(
    { slug: "mohammed-r-islam" },
    {
      mobile: "0424 955 108",
      photo: "/images/team/mohammed-r-islam.png",
      facebook: "https://www.facebook.com/profile.php?id=100063818245277",
      linkedin: "https://www.linkedin.com/in/mohammed-r-islam-2a9266b7/",
      bio: "Mohammed has built a strong reputation as a highly skilled negotiator and exceptional sales strategist. He is known for providing the highest level of service to all our clients. Mohammed consistently exceeds vendor expectations, including recent record sales in Sydney, Liverpool, Minto, Campbelltown, Glenfield, Oran Park, Bardia, Denham Court, Mittagong, Bankstown and Rockdale. As a Sydney resident, he has a great appreciation for the history of the area and shares a love of the vibrant lifestyle on offer. A proven high achiever, Mohammed's proficiency across a broad range of property — from apartments to multi-million dollar homes — ensures that all our clients receive knowledgeable and genuine advice appropriate to current market conditions. An outstanding communicator with exceptional local knowledge, Mohammed consistently achieves extraordinary results with honesty and tenacity, the building blocks from which he approaches our day-to-day business.",
    },
    { new: true }
  );

  if (!agent) {
    console.log('No agent found with slug "mohammed-r-islam" — nothing updated. Run seed.ts first to create the record.');
  } else {
    console.log(`Updated agent: ${agent.name} (photo, bio, facebook, linkedin, mobile)`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
