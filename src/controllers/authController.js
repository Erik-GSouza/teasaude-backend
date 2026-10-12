
const { autenticarUsuario } = require("../services/authService");

async function login(req, res) {
    const { nomeUsuario, senha } = req.body ?? {};

    if (
        typeof nomeUsuario !== "string" ||
        nomeUsuario.trim() === "" ||
        typeof senha !== "string" ||
        senha === ""
    ) {
        return res.status(400).json({
            message: "Informe o nome de usuário e a senha."
        });
    }

    try {
        const resultado = await autenticarUsuario(
            nomeUsuario,
            senha
        );

        return res.status(200).json({
            message: "Login realizado com sucesso.",
            token: resultado.token,
            usuario: resultado.usuario
        });
    } catch (erro) {
    
        if (
            erro.message === "Credenciais inválidas." ||
            erro.message === "Conta inativa."
        ) {
            return res.status(401).json({
                message: "Nome de usuário ou senha inválidos."
            });
        }

        console.error("Erro ao autenticar usuário:", erro);

        return res.status(500).json({
            message: "Não foi possível realizar o login."
        });
    }
}


function obterUsuarioAutenticado(req, res) {
    return res.status(200).json({
        message: "Usuário autenticado.",
        usuario: req.usuario
    });
}


module.exports = {
    login,
    obterUsuarioAutenticado
};

