
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

async function autenticarUsuario(nomeUsuario, senha) {
    if (
        typeof nomeUsuario !== "string" ||
        typeof senha !== "string" ||
        nomeUsuario.trim() === "" ||
        senha === ""
    ) {
        throw new Error("Informe o nome de usuário e a senha.");
    }

    const usuario = await Usuario.findOne({
        nomeUsuario: nomeUsuario.trim().toLowerCase()
    }).select("+senhaHash");


    if (!usuario) {
        throw new Error("Credenciais inválidas.");
    }

    const senhaCorreta = await bcrypt.compare(
        senha,
        usuario.senhaHash
    );

    if (!senhaCorreta) {
        throw new Error("Credenciais inválidas.");
    }

    if (!usuario.ativo) {
        throw new Error("Conta inativa.");
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET não está configurado.");
    }

    const token = jwt.sign(
        { id: String(usuario._id) },
        process.env.JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: "1h"
        }
    );

    return {
        token,
        usuario: {
            _id: usuario._id,
            nomeUsuario: usuario.nomeUsuario,
            perfil: usuario.perfil,
            instituicaoId: usuario.instituicaoId,
            ativo: usuario.ativo,
            createdAt: usuario.createdAt,
            updatedAt: usuario.updatedAt
        }
    };
}

module.exports = {
    autenticarUsuario
};
