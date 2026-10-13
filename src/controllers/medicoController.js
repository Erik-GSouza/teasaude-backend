
const Medico = require("../models/Medico");
const Instituicao = require("../models/Instituicao");

async function listarMedicos(req, res) {
    try {

        const instituicoesAtivas = await Instituicao.find({
            ativo: true
        })
            .select("_id")
            .lean();

        const idsInstituicoesAtivas = instituicoesAtivas.map(
            instituicao => instituicao._id
        );

        const filtro = {
            ativo: true,
            instituicaoId: {
                $in: idsInstituicoesAtivas
            }
        };


        if (req.usuario.perfil === "gestor") {
            const instituicaoId = req.usuario.instituicaoId;

            if (
                !instituicaoId ||
                !idsInstituicoesAtivas.some(
                    id => String(id) === String(instituicaoId)
                )
            ) {
                return res.status(409).json({
                    message:
                        "A conta Gestor não possui uma instituição ativa vinculada."
                });
            }

            filtro.instituicaoId = instituicaoId;
        }

        const medicos = await Medico.find(filtro)
            .select(
                "_id nomeCompleto especialidade instituicaoId ativo createdAt updatedAt"
            )
            .populate({
                path: "instituicaoId",
                select: "nomePublico"
            })
            .sort({ nomeCompleto: 1 })
            .lean();

        return res.status(200).json({
            quantidade: medicos.length,
            medicos
        });

    } catch (erro) {
        console.error("Erro ao listar médicos.");

        return res.status(500).json({
            message: "Não foi possível listar os médicos."
        });
    }
}

module.exports = {
    listarMedicos
};
