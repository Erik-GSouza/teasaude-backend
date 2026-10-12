
function autorizarPerfis(...perfisPermitidos) {
    return function (req, res, next) {

        if (!req.usuario) {
            return res.status(401).json({
                message: "Autenticação necessária."
            });
        }

        if (!perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({
                message: "Você não tem permissão para realizar esta operação."
            });
        }

        return next();
    };
}

module.exports = autorizarPerfis;
