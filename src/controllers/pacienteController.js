const mongoose = require("mongoose");

const Paciente = require("../models/Paciente");
const Agendamento = require("../models/Agendamento");

function dataCivilValida(valor) {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        return false;
    }

    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));

    return (
        data.getUTCFullYear() === ano &&
        data.getUTCMonth() === mes - 1 &&
        data.getUTCDate() === dia
    );
}

function menorDe18Anos(valor) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    const hoje = new Date();

    let idade = hoje.getFullYear() - ano;

    const aindaNaoFezAniversario =
        hoje.getMonth() + 1 < mes ||
        (
            hoje.getMonth() + 1 === mes &&
            hoje.getDate() < dia
        );

    if (aindaNaoFezAniversario) {
        idade--;
    }

    return idade < 18;
}

function converterData(valor) {
    return new Date(`${valor}T00:00:00.000Z`);
}

function corpoValido(dados) {
    return (
        typeof dados === "object" &&
        dados !== null &&
        !Array.isArray(dados)
    );
}

async function criarPaciente(req, res) {
    try {
        const dados = req.body ?? {};

        if (!corpoValido(dados)) {
            return res.status(400).json({
                success: false,
                message: "Envie um objeto JSON válido."
            });
        }

        const camposPermitidos = [
            "nomeCompleto",
            "dataNascimento"
        ];

        if (
            Object.keys(dados).some(
                campo => !camposPermitidos.includes(campo)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "O cadastro contém campos não permitidos."
            });
        }

        if (
            typeof dados.nomeCompleto !== "string" ||
            dados.nomeCompleto.trim().length < 3 ||
            typeof dados.dataNascimento !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Informe o nome completo e a data de nascimento."
            });
        }

        if (!dataCivilValida(dados.dataNascimento)) {
            return res.status(400).json({
                success: false,
                message:
                    "A data de nascimento deve ser válida e estar no formato AAAA-MM-DD."
            });
        }

        if (!menorDe18Anos(dados.dataNascimento)) {
            return res.status(400).json({
                success: false,
                message:
                    "O paciente deve ter menos de 18 anos no cadastro inicial."
            });
        }

        const paciente = await Paciente.create({
            nomeCompleto: dados.nomeCompleto.trim(),
            dataNascimento: converterData(dados.dataNascimento),
            responsavelId: req.usuario._id
        });

        return res.status(201).json({
            success: true,
            message: "Paciente cadastrado com sucesso!",
            data: paciente
        });

    } catch (erro) {
        if (
            erro.name === "ValidationError" ||
            erro.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: erro.message
            });
        }

        console.error("Erro ao cadastrar paciente:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao cadastrar paciente."
        });
    }
}


async function listarMeusPacientes(req, res) {
    try {
        const pacientes = await Paciente.find({
            responsavelId: req.usuario._id
        }).sort({
            nomeCompleto: 1
        });

        return res.status(200).json({
            success: true,
            message: "Seus pacientes foram encontrados com sucesso.",
            total: pacientes.length,
            data: pacientes
        });

    } catch (erro) {
        console.error(
            "Erro ao listar pacientes do responsável:",
            erro
        );

        return res.status(500).json({
            success: false,
            message: "Erro ao listar seus pacientes."
        });
    }
}


async function buscarMeuPacientePorId(req, res) {
    try {
        const { id } = req.params;

        const paciente = await Paciente.findOne({
            _id: id,
            responsavelId: req.usuario._id
        });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: "Paciente não encontrado."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Paciente encontrado.",
            data: paciente
        });

    } catch (erro) {
        if (erro.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "ID inválido."
            });
        }

        console.error("Erro ao buscar paciente do responsável:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao buscar paciente."
        });
    }
}


async function atualizarMeuPaciente(req, res) {
    try {
        const { id } = req.params;
        const dados = req.body ?? {};

        if (!corpoValido(dados)) {
            return res.status(400).json({
                success: false,
                message: "Envie um objeto JSON válido."
            });
        }

        const camposPermitidos = [
            "nomeCompleto",
            "dataNascimento"
        ];

        if (
            Object.keys(dados).length === 0 ||
            Object.keys(dados).some(
                campo => !camposPermitidos.includes(campo)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Informe apenas os campos permitidos."
            });
        }

        const atualizacao = {};

        if (dados.nomeCompleto !== undefined) {
            if (
                typeof dados.nomeCompleto !== "string" ||
                dados.nomeCompleto.trim().length < 3
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "O nome deve ter pelo menos 3 caracteres."
                });
            }

            atualizacao.nomeCompleto = dados.nomeCompleto.trim();
        }

        if (dados.dataNascimento !== undefined) {
            if (!dataCivilValida(dados.dataNascimento)) {
                return res.status(400).json({
                    success: false,
                    message: "Data de nascimento inválida."
                });
            }

            atualizacao.dataNascimento = converterData(
                dados.dataNascimento
            );
        }

        const paciente = await Paciente.findOneAndUpdate(
            {
                _id: id,
                responsavelId: req.usuario._id
            },
            {
                $set: atualizacao
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: "Paciente não encontrado."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Paciente atualizado com sucesso!",
            data: paciente
        });

    } catch (erro) {
        if (
            erro.name === "CastError" ||
            erro.name === "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message: erro.message
            });
        }

        console.error("Erro ao atualizar paciente:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao atualizar paciente."
        });
    }
}


async function listarPacientes(req, res) {
    try {
        const pacientes = await Paciente.find()
            .populate(
                "responsavelId",
                "nomeCompleto telefone email"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            message: "Pacientes encontrados com sucesso.",
            total: pacientes.length,
            data: pacientes
        });

    } catch (erro) {
        console.error("Erro ao listar pacientes:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro ao listar pacientes."
        });
    }
}


async function buscarPacientePorId(req, res) {
    try {
        const { id } = req.params;

        const paciente = await Paciente.findById(id)
            .populate(
                "responsavelId",
                "nomeCompleto telefone email"
            );

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: "Paciente não encontrado."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Paciente encontrado.",
            data: paciente
        });

    } catch (erro) {
        if (erro.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "ID inválido."
            });
        }

        console.error("Erro ao buscar paciente:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao buscar paciente."
        });
    }
}


async function atualizarPaciente(req, res) {
    try {
        const { id } = req.params;
        const dados = req.body ?? {};

        if (!corpoValido(dados)) {
            return res.status(400).json({
                success: false,
                message: "Envie um objeto JSON válido."
            });
        }

        const camposPermitidos = [
            "nomeCompleto",
            "dataNascimento"
        ];

        if (
            Object.keys(dados).length === 0 ||
            Object.keys(dados).some(
                campo => !camposPermitidos.includes(campo)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Informe apenas os campos permitidos."
            });
        }

        const atualizacao = {};

        if (dados.nomeCompleto !== undefined) {
            if (
                typeof dados.nomeCompleto !== "string" ||
                dados.nomeCompleto.trim().length < 3
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "O nome deve ter pelo menos 3 caracteres."
                });
            }

            atualizacao.nomeCompleto = dados.nomeCompleto.trim();
        }

        if (dados.dataNascimento !== undefined) {
            if (!dataCivilValida(dados.dataNascimento)) {
                return res.status(400).json({
                    success: false,
                    message: "Data de nascimento inválida."
                });
            }

            atualizacao.dataNascimento = converterData(
                dados.dataNascimento
            );
        }

        const paciente = await Paciente.findByIdAndUpdate(
            id,
            {
                $set: atualizacao
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: "Paciente não encontrado."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Paciente atualizado com sucesso!",
            data: paciente
        });

    } catch (erro) {
        if (
            erro.name === "CastError" ||
            erro.name === "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message: erro.message
            });
        }

        console.error("Erro ao atualizar paciente:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao atualizar paciente."
        });
    }
}



async function deletarPaciente(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID inválido."
            });
        }

        const paciente = await Paciente.findById(id);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: "Paciente não encontrado."
            });
        }

        const possuiAgendamentos = await Agendamento.exists({
            pacienteId: paciente._id
        });

        if (possuiAgendamentos) {
            return res.status(409).json({
                success: false,
                message:
                    "Não é possível excluir este paciente porque existem agendamentos vinculados ao seu histórico."
            });
        }

        await Paciente.findByIdAndDelete(id);

        return res.status(204).send();

    } catch (erro) {
        if (erro.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "ID inválido."
            });
        }

        console.error("Erro ao remover paciente:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao remover paciente."
        });
    }
}

module.exports = {
    criarPaciente,
    listarMeusPacientes,
    buscarMeuPacientePorId,
    atualizarMeuPaciente,
    listarPacientes,
    buscarPacientePorId,
    atualizarPaciente,
    deletarPaciente
};
