
const Usuario = require("../src/models/Usuario");

async function testarValidacao(descricao, dados, esperadoValido) {
  const usuario = new Usuario(dados);

  let valido = true;
  let erro;

  try {
    await usuario.validate();
  } catch (erroValidacao) {
    valido = false;
    erro = erroValidacao;
  }

  const resultadoCorreto = valido === esperadoValido;

  console.log(
    `${resultadoCorreto ? "✅" : "❌"} ${descricao}: ` +
    `${valido ? "documento válido" : "documento inválido"}`
  );

  if (erro) {
    console.log("   Motivo:", erro.message);
  }

  return resultadoCorreto;
}

async function executarTestes() {
  let totalCorretos = 0;
  const totalTestes = 4;

  if (
    await testarValidacao(
      "Gestor sem instituição",
      {
        nomeUsuario: "gestor.teste",
        senhaHash: "hash_de_teste",
        perfil: "gestor"
      },
      false
    )
  ) totalCorretos++;

  if (
    await testarValidacao(
      "Admin sem instituição",
      {
        nomeUsuario: "admin.teste",
        senhaHash: "hash_de_teste",
        perfil: "admin"
      },
      true
    )
  ) totalCorretos++;

  if (
    await testarValidacao(
      "Nome com espaço interno",
      {
        nomeUsuario: "gestor teste",
        senhaHash: "hash_de_teste",
        perfil: "admin"
      },
      false
    )
  ) totalCorretos++;

  const usuario = new Usuario({
    nomeUsuario: " Alison.Rodrigues ",
    senhaHash: "hash_de_teste",
    perfil: "admin"
  });

  await usuario.validate();

  const nomeNormalizado = usuario.nomeUsuario === "alison.rodrigues";

  console.log(
    `${nomeNormalizado ? "✅" : "❌"} Nome normalizado:`,
    usuario.nomeUsuario
  );

  if (nomeNormalizado) totalCorretos++;

  console.log(`\nResultado: ${totalCorretos}/${totalTestes} testes aprovados.`);

  if (totalCorretos !== totalTestes) {
    process.exitCode = 1;
  }
}

executarTestes().catch((erro) => {
  console.error("Falha inesperada durante os testes:", erro);
  process.exitCode = 1;
});
