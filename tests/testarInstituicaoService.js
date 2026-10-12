require("dotenv").config();

const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const conectarBanco = require("../src/config/database");
const Instituicao = require("../src/models/Instituicao");

const {
  buscarInstituicaoParaVinculo
} = require("../src/services/instituicaoService");

const ID_INSTITUICAO_ATIVA = "6acc1e0db714754d0d7a6af6";
const ID_INSTITUICAO_INEXISTENTE = "507f1f77bcf86cd799439011";

async function executarTestes() {
  let aprovados = 0;
  const totalTestes = 4;
  let conectado = false;

  try {
    await conectarBanco();
    conectado = true;

    
    try {
      const instituicao = await buscarInstituicaoParaVinculo(
        ID_INSTITUICAO_ATIVA
      );

      assert.equal(
        instituicao._id.toString(),
        ID_INSTITUICAO_ATIVA
      );
      assert.equal(instituicao.ativo, true);

      aprovados++;
      console.log("✅ Encontra instituição existente e ativa");
    } catch (erro) {
      console.error("❌ Instituição ativa:", erro.message);
    }

    
    try {
      await assert.rejects(
        buscarInstituicaoParaVinculo("abc123"),
        (erro) => erro.statusCode === 400
      );

      aprovados++;
      console.log("✅ Rejeita ID de instituição inválido");
    } catch (erro) {
      console.error("❌ ID inválido:", erro.message);
    }

  
    try {
      await assert.rejects(
        buscarInstituicaoParaVinculo(
          ID_INSTITUICAO_INEXISTENTE
        ),
        (erro) => erro.statusCode === 404
      );

      aprovados++;
      console.log("✅ Rejeita instituição inexistente");
    } catch (erro) {
      console.error("❌ Instituição inexistente:", erro.message);
    }

  
    let instituicaoInativa;

    try {
      instituicaoInativa = await Instituicao.create({
        nomePublico: "Instituição Inativa - Teste Automatizado",
        ativo: false
      });

      await assert.rejects(
        buscarInstituicaoParaVinculo(
          instituicaoInativa._id.toString()
        ),
        (erro) => erro.statusCode === 409
      );

      aprovados++;
      console.log("✅ Rejeita instituição inativa");
    } catch (erro) {
      console.error("❌ Instituição inativa:", erro.message);
    } finally {
    
      if (instituicaoInativa) {
        try {
          await Instituicao.deleteOne({
            _id: instituicaoInativa._id
          });
        } catch (erro) {
          console.error(
            "⚠️ Não foi possível remover a instituição de teste:",
            erro.message
          );
          process.exitCode = 1;
        }
      }
    }

    console.log(
      `\nResultado: ${aprovados}/${totalTestes} testes aprovados.`
    );

    if (aprovados !== totalTestes) {
      process.exitCode = 1;
    }
  } catch (erro) {
    console.error(
      "Não foi possível executar os testes:",
      erro.message
    );
    process.exitCode = 1;
  } finally {
    if (conectado) {
      await mongoose.disconnect();
      console.log("Conexão com o banco encerrada.");
    }
  }
}

executarTestes();