require("dotenv").config();

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const conectarBanco = require("../src/config/database");
const Usuario = require("../src/models/Usuario");

const {
  prepararDadosGestor
} = require("../src/services/usuarioService");

const ID_INSTITUICAO = "6acc1e0db714754d0d7a6af6";

async function executarTeste() {
  let conectado = false;

  try {
    await conectarBanco();
    conectado = true;

    const senhaOriginal = "Senha-de-teste-2026";

    const dados = await prepararDadosGestor({
      nomeUsuario: "Gestor.Teste",
      senha: senhaOriginal,
      instituicaoId: ID_INSTITUICAO
    });

  
    const usuario = new Usuario(dados);
    await usuario.validate();

    assert.equal(usuario.nomeUsuario, "gestor.teste");
    assert.equal(usuario.perfil, "gestor");
    assert.equal(usuario.ativo, true);

    assert.equal(
      usuario.instituicaoId.toString(),
      ID_INSTITUICAO
    );

    assert.equal("senha" in dados, false);

    const senhaConfere = await bcrypt.compare(
      senhaOriginal,
      dados.senhaHash
    );

    assert.equal(senhaConfere, true);

    console.log("✅ Nome de usuário normalizado");
    console.log("✅ Perfil definido como gestor");
    console.log("✅ Instituição vinculada corretamente");
    console.log("✅ Conta preparada como ativa");
    console.log("✅ Senha original não incluída; hash confirmado");
    console.log("\nResultado: 5/5 verificações aprovadas.");

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

executarTeste();