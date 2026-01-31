require("ts-node/register");

const { runAdminSeed } = require("./src/services/admin-seed");

runAdminSeed().catch((error) => {
  console.error("Admin seed failed:", error);
  process.exit(1);
});
