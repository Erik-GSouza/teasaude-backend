
require("dotenv").config();

const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const conectarBanco = require("../src/config/database");
const Usuario = require("../src/models/Usuario");

const {
  autenticarUsuario
} = require("../src/services/authService");

async function executarTestes() {
  let conectado = false;

  try {
    await conectarBanco();
    conectado = true;

    const nomeUsuario = process.env.ADMIN_INICIAL_NOME_USUARIO;
    const senha = process.env.ADMIN_INICIAL_SENHA;

    if (!nomeUsuario || !senha) {
      throw new Error(
        "As variáveis locais do Admin inicial não estão configuradas."
      );
    }

    const resultado = await autenticarUsuario(nomeUsuario, senha);

    assert.ok(resultado.token);
    assert.equal(resultado.usuario.perfil, "admin");
    assert.equal(resultado.usuario.ativo, true);
    assert.equal("senha" in resultado.usuario, false);
    assert.equal("senhaHash" in resultado.usuario, false);

    const payload = jwt.verify(
      resultado.token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    assert.equal(payload.id, resultado.usuario._id.toString());

    console.log("✅ Login do Admin válido");
    console.log("✅ Token JWT verificado");
    console.log("✅ Perfil e estado da conta conferidos");
    console.log("✅ Resposta não expõe senha ou hash");

    try {
      await autenticarUsuario(nomeUsuario, "senha-claramente-incorreta");
      throw new Error("Uma senha incorreta foi aceita.");
    } catch (erro) {
      assert.equal(erro.message, "Credenciais inválidas.");
      console.log("✅ Rejeita senha incorreta");
    }

    console.log("\nResultado: 5 verificações aprovadas.");
  } catch (erro) {
    console.error("❌ Falha no teste:", erro.message);
    process.exitCode = 1;
  } finally {
    if (conectado) {
      await mongoose.disconnect();
      console.log("Conexão com o banco encerrada.");
    }
  }
}

executarTestes();
