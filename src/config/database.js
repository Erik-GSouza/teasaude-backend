
const mongoose = require("mongoose");

async function conectarBanco() {
  if (!process.env.MONGO_URI) {
    throw new Error("A variável MONGO_URI não foi definida.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("✅ Banco conectado:", mongoose.connection.name);
}

module.exports = conectarBanco;
