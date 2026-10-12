
const assert = require("node:assert/strict");

const autorizarPerfis = require("../src/middlewares/perfilMiddleware");

function executarMiddleware(usuario, ...perfisPermitidos) {
    let statusCode = null;
    let resposta = null;
    let proximoChamado = false;

    const req = { usuario };

    const res = {
        status(codigo) {
            statusCode = codigo;
            return this;
        },

        json(dados) {
            resposta = dados;
            return this;
        }
    };

    const next = () => {
        proximoChamado = true;
    };

    autorizarPerfis(...perfisPermitidos)(req, res, next);

    return { statusCode, resposta, proximoChamado };
}


const adminPermitido = executarMiddleware(
    { perfil: "admin" },
    "admin"
);
assert.equal(adminPermitido.proximoChamado, true);
console.log("✅ Admin autorizado");


const pacienteBloqueado = executarMiddleware(
    { perfil: "paciente" },
    "admin"
);
assert.equal(pacienteBloqueado.statusCode, 403);
assert.equal(pacienteBloqueado.proximoChamado, false);
console.log("✅ Paciente bloqueado de rota administrativa");


const gestorPermitido = executarMiddleware(
    { perfil: "gestor" },
    "gestor"
);
assert.equal(gestorPermitido.proximoChamado, true);
console.log("✅ Gestor autorizado em rota permitida");


const semUsuario = executarMiddleware(
    undefined,
    "admin"
);
assert.equal(semUsuario.statusCode, 401);
assert.equal(semUsuario.proximoChamado, false);
console.log("✅ Requisição sem autenticação bloqueada");

console.log("\nResultado: 4 testes aprovados.");
