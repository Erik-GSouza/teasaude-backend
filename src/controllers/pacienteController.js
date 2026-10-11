const Paciente = require("../models/Paciente");

function dataCivilValida(valor) {

  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
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


async function criarPaciente(req, res) {
  try {
    if (
      req.body.dataNascimento !== undefined &&
      !dataCivilValida(req.body.dataNascimento)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A data de nascimento deve estar no formato AAAA-MM-DD e representar uma data válida."
      });
    }

    const paciente = await Paciente.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Paciente cadastrado com sucesso!",
      data: paciente
    });

  } catch (erro) {
    if (erro.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: erro.message
      });
    }

    if (erro.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Um ou mais campos possuem valores inválidos."
      });
    }

    console.error("Erro ao cadastrar paciente:", erro);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao cadastrar paciente."
    });
  }
}


async function listarPacientes(req, res) {

  try {

    const pacientes = await Paciente.find();

    return res.status(200).json({
      success: true,
      message: "Pacientes encontrados com sucesso.",
      total: pacientes.length,
      data: pacientes
    });

  } catch (erro) {

    res.status(500).json({
      success: false,
      message: "Erro ao listar pacientes."
    });

  }

}

async function buscarPacientePorId(req, res) {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findById(id);

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

    if (erro.name === "CastError" && erro.path === "_id") {
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

    if (
      req.body.dataNascimento !== undefined &&
      !dataCivilValida(req.body.dataNascimento)
    ) {
      return res.status(400).json({
        success: false,
        message: "A data de nascimento deve estar no formato AAAA-MM-DD e representar uma data válida."
      });
    }

    const paciente = await Paciente.findByIdAndUpdate(
      id,
      req.body,
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

    if (erro.name === "CastError" && erro.path === "_id") {
      return res.status(400).json({
        success: false,
        message: "ID inválido."
      });
    }

    if (erro.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: erro.message
      });
    }

    if (erro.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Valor inválido em um dos campos enviados."
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

    const paciente = await Paciente.findByIdAndDelete(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: "Paciente não encontrado."
      });
    }

    return res.status(204).send();

  } catch (erro) {
    if (erro.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro interno ao remover paciente."
    });
  }
}

module.exports = {
  criarPaciente,
  listarPacientes,
  buscarPacientePorId,
  atualizarPaciente,
  deletarPaciente
};
