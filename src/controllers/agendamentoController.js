
const Agendamento = require("../models/Agendamento");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const Instituicao = require("../models/Instituicao");

function dataHoraValida(valor) {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(valor)
    ) {
        return false;
    }

    const data = new Date(valor);
    return !Number.isNaN(data.getTime());
}

async function criarAgendamento(req, res) {
    const dados = req.body ?? {};

    if (
        typeof dados !== "object" ||
        dados === null ||
        Array.isArray(dados)
    ) {
        return res.status(400).json({
            message: "Envie um objeto JSON válido."
        });
    }

    const camposPermitidos = ["medicoId", "dataHora"];
    const camposRecebidos = Object.keys(dados);

    if (camposRecebidos.length === 0) {
        return res.status(400).json({
            message: "Informe o médico e a data e hora da consulta."
        });
    }

    if (
        camposRecebidos.some(
            campo => !camposPermitidos.includes(campo)
        )
    ) {
        return res.status(400).json({
            message: "O agendamento contém campos não permitidos."
        });
    }

    if (
        typeof dados.medicoId !== "string" ||
        !/^[a-f\d]{24}$/i.test(dados.medicoId)
    ) {
        return res.status(400).json({
            message: "ID do médico inválido."
        });
    }

    if (!dataHoraValida(dados.dataHora)) {
        return res.status(400).json({
            message:
                "Informe uma data e hora válidas, incluindo o fuso horário."
        });
    }

    const dataHora = new Date(dados.dataHora);

    if (dataHora <= new Date()) {
        return res.status(400).json({
            message: "A consulta deve ser marcada para uma data futura."
        });
    }

    try {
        const paciente = await Paciente.findOne({
            usuarioId: req.usuario._id
        });

        if (!paciente) {
            return res.status(404).json({
                message:
                    "Não existe cadastro de paciente vinculado a esta conta."
            });
        }


        const medico = await Medico.findById(dados.medicoId);

        if (!medico) {
            return res.status(404).json({
                message: "Médico não encontrado."
            });
        }

        if (!medico.ativo) {
            return res.status(409).json({
                message: "O médico está inativo."
            });
        }

       
        const instituicao = await Instituicao.findById(
            medico.instituicaoId
        );

        if (!instituicao) {
            return res.status(404).json({
                message: "A instituição do médico não foi encontrada."
            });
        }

        if (!instituicao.ativo) {
            return res.status(409).json({
                message: "A instituição do médico está inativa."
            });
        }

        const agendamento = await Agendamento.create({
            pacienteId: paciente._id,
            medicoId: medico._id,
            instituicaoId: instituicao._id,
            dataHora,
            status: "agendada"
        });

        return res.status(201).json({
            message: "Consulta agendada com sucesso.",
            agendamento
        });

    } catch (erro) {

        if (erro.code === 11000) {
            return res.status(409).json({
                message:
                    "O médico ou o paciente já possui uma consulta agendada nesse horário."
            });
        }

        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError"
        ) {
            return res.status(400).json({
                message: "Os dados do agendamento são inválidos."
            });
        }

        console.error("Erro ao criar agendamento.");

        return res.status(500).json({
            message: "Não foi possível agendar a consulta."
        });
    }
}

async function listarMeusAgendamentos(req, res) {
    try {
        const paciente = await Paciente.findOne({
            usuarioId: req.usuario._id
        }).select("_id");

        if (!paciente) {
            return res.status(404).json({
                message:
                    "Não existe cadastro de paciente vinculado a esta conta."
            });
        }

        const agendamentos = await Agendamento.find({
            pacienteId: paciente._id
        })
            .populate({
                path: "medicoId",
                select: "nomeCompleto especialidade instituicaoId"
            })
            .populate({
                path: "instituicaoId",
                select: "nomePublico"
            })
            .sort({ dataHora: 1 })
            .lean();

        return res.status(200).json({
            quantidade: agendamentos.length,
            agendamentos
        });

    } catch (erro) {
        console.error("Erro ao listar agendamentos do paciente.");

        return res.status(500).json({
            message: "Não foi possível listar os agendamentos."
        });
    }
}

module.exports = {
    criarAgendamento,
    listarMeusAgendamentos
};
