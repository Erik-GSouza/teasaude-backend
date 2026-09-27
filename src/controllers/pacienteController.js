const Paciente = require("../models/Paciente");

async function criarPaciente(req, res) {

  try {

    const paciente = await Paciente.create(req.body);

    return res.status(201).json({
      success: true,
      mensagem: "Paciente cadastrado com sucesso!",
      data: paciente
    });

  } catch (erro) {

    return res.status(400).json({
      success: false,
      message: erro.message
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
    return res.status(400).json({
      success: false,
      message: "ID inválido."
    });
  }
}

async function atualizarPaciente(req, res) {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
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
    return res.status(400).json({
      success: false,
      message: erro.message
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

    return res.status(200).json({
      success: true,
      message: "Paciente removido com sucesso."
    });

  } catch (erro) {
    return res.status(400).json({
      success: false,
      message: "ID inválido."
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
