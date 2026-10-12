
const Instituicao = require("../src/models/Instituicao");

async function executarTestes() {
  let aprovados = 0;
  const totalTestes = 3;

  async function verificar(nome, dados, esperadoValido) {
    const instituicao = new Instituicao(dados);
    let valido = true;

    try {
      await instituicao.validate();
    } catch (erro) {
      valido = false;
      console.log("   Motivo:", erro.message);
    }

    if (valido === esperadoValido) {
      aprovados++;
      console.log(`✅ ${nome}`);
    } else {
      console.log(`❌ ${nome}`);
    }

    return instituicao;
  }

  const instituicaoValida = await verificar(
    "Aceita instituição com nome público",
    { nomePublico: "Clínica Exemplo" },
    true
  );

  if (instituicaoValida?.ativo === true) {
    aprovados++;
    console.log("✅ Instituição começa ativa por padrão");
  } else {
    console.log("❌ Valor padrão de ativo");
  }

  const instituicaoVazia = await verificar(
    "Rejeita nome público vazio",
    { nomePublico: "   " },
    false
  );

  console.log(`\nResultado: ${aprovados}/${totalTestes} testes aprovados.`);

  if (aprovados !== totalTestes) {
    process.exitCode = 1;
  }
}

executarTestes().catch((erro) => {
  console.error("Falha inesperada nos testes:", erro);
  process.exitCode = 1;
});
