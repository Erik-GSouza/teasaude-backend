
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const {
    validarSenha,
    gerarSenhaHash,
    prepararDadosUsuario
} = require("../src/services/usuarioService");

async function executarTestes() {
    let aprovados = 0;
    const totalTestes = 6;

    function verificar(nome, funcao) {
        try {
            funcao();
            aprovados++;
            console.log(`✅ ${nome}`);
        } catch (erro) {
            console.error(`❌ ${nome}: ${erro.message}`);
        }
    }


    verificar("Rejeita senha com 7 caracteres", () => {
        assert.throws(
            () => validarSenha("abc1234"),
            /pelo menos 8 caracteres/
        );
    });


    verificar("Aceita senha com 8 caracteres", () => {
        assert.equal(validarSenha("abc12345"), true);
    });


    verificar("Rejeita senha acima de 72 bytes", () => {
        assert.throws(
            () => validarSenha("A".repeat(73)),
            /72 bytes/
        );
    });


    verificar("Conta caracteres Unicode corretamente", () => {
        assert.equal(validarSenha("á".repeat(8)), true);
    });


    try {
        const senhaTeste = "senhaExemploSegura2026!";
        const hash = await gerarSenhaHash(senhaTeste);

        const corresponde = await bcrypt.compare(
            senhaTeste,
            hash
        );

        assert.notEqual(hash, senhaTeste);
        assert.equal(corresponde, true);

        aprovados++;
        console.log("✅ Gera hash e confirma a senha original");
    } catch (erro) {
        console.error("❌ Teste de hash:", erro.message);
    }


    try {
        const dados = await prepararDadosUsuario({
            nomeUsuario: " Gestor.Exemplo ",
            senha: "Senha-de-teste-2026"
        });

        assert.equal(dados.nomeUsuario, "gestor.exemplo");
        assert.ok(dados.senhaHash);
        assert.equal("senha" in dados, false);

        const corresponde = await bcrypt.compare(
            "Senha-de-teste-2026",
            dados.senhaHash
        );

        assert.equal(corresponde, true);

        aprovados++;
        console.log("✅ Prepara dados sem incluir a senha original");
    } catch (erro) {
        console.error("❌ Preparação dos dados:", erro.message);
    }

    console.log(
        `\nResultado: ${aprovados}/${totalTestes} testes aprovados.`
    );

    if (aprovados !== totalTestes) {
        process.exitCode = 1;
    }
}

executarTestes().catch((erro) => {
    console.error("Falha inesperada nos testes:", erro);
    process.exitCode = 1;
});

