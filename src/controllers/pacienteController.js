const Paciente = require("../models/Paciente");

function formatarErrosValidacao(erro) {
  const erros = {};

  for (const campo in erro.errors) {
    erros[campo] = erro.errors[campo].message;
  }

  return erros;
}

async function criarPaciente(req, res) {

  try {

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
        message: "Dados inválidos",
        errors: formatarErrosValidacao(erro)
      });
    }

    console.error("Erro ao criar paciente:", erro);

    return res.status(500).json({ success: false,
      message: "Erro interno ao cadastrar paciente"
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

    const camposPermitidos = [
      "nomeCompleto",
      "dataNascimento",
      "nomeContato",
      "telefoneContato",
      "emailContato"];

    const camposRecebidos = Object.keys(req.body);

    if (camposRecebidos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo foi informado para atualização"
      });
    }

    const camposInvalidos = camposRecebidos.filter((campo) => !camposPermitidos.includes(campo));

    if (camposInvalidos.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Há campos não permitidos na atualização",
        errors: {
          campos: camposInvalidos
        }
      });
    }

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
    if (erro.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: formatarErrosValidacao(erro)
      });
    }

     if (erro.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }

    console.error("Erro ao atualizar paciente:", erro);
    return res.status(500).json({success: false,
      message: "Erro interno ao atualizar paciente"
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
