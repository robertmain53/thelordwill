import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const scope = "prayerPointCategory";

  const rows = [
    { key: "breakthrough", label: "Breakthrough", sortOrder: 10 },
    { key: "healing", label: "Healing", sortOrder: 20 },
    { key: "protection", label: "Protection", sortOrder: 30 },
    { key: "peace-over-fear", label: "Peace Over Fear", sortOrder: 40 },
    { key: "deliverance", label: "Deliverance", sortOrder: 50 },
    { key: "provision", label: "Provision", sortOrder: 60 },
    { key: "family", label: "Family", sortOrder: 70 },
    { key: "encouragement", label: "Encouragement", sortOrder: 80 },
    { key: "other", label: "Other", sortOrder: 999 },
  ];

  for (const r of rows) {
    await prisma.taxonomyLabel.upsert({
      where: { scope_key: { scope, key: r.key } },
      update: { label: r.label, sortOrder: r.sortOrder, isActive: true },
      create: { scope, key: r.key, label: r.label, sortOrder: r.sortOrder, isActive: true },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
