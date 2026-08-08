import { adminDb } from "./src/lib/firebase/admin";

async function update() {
  const snapshot = await adminDb.collection("admins").where("role", "==", "admin").get();
  console.log(`Found ${snapshot.size} admins to update.`);
  for (const doc of snapshot.docs) {
    await doc.ref.update({ role: "super_admin" });
    console.log(`Updated ${doc.id}`);
  }
}

update().then(() => process.exit(0));
