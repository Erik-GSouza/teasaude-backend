
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

async function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;

    const correspondencia = /^Bearer\s+(\S+)$/i.exec(
        authorization || ""
    );

    if (!correspondencia) {
        return res.status(401).json({
            message: "Token de autenticação ausente ou inválido."
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET não está configurado.");

        return res.status(500).json({
            message: "Erro interno de configuração do servidor."
        });
    }

    const token = correspondencia[1];
    let payload;

    try {
        payload = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );
    } catch (erro) {
        return res.status(401).json({
            message: "Token inválido ou expirado."
        });
    }

    if (
        !payload ||
        typeof payload.id !== "string" ||
        !/^[a-f\d]{24}$/i.test(payload.id)
    ) {
        return res.status(401).json({
            message: "Token inválido ou expirado."
        });
    }

    let usuario;

    try {
        usuario = await Usuario.findById(payload.id)
            .select(
                "_id nomeUsuario perfil instituicaoId ativo createdAt updatedAt"
            )
            .lean();
    } catch (erro) {
        console.error(
            "Erro ao consultar o usuário durante a autenticação."
        );

        return res.status(500).json({
            message: "Não foi possível verificar a autenticação."
        });
    }

    if (!usuario || usuario.ativo !== true) {
        return res.status(401).json({
            message: "Usuário não autenticado ou conta inativa."
        });
    }

    req.usuario = {
        _id: usuario._id.toString(),
        nomeUsuario: usuario.nomeUsuario,
        perfil: usuario.perfil,
        instituicaoId: usuario.instituicaoId,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
    };


    return next();
}

module.exports = authMiddleware;
