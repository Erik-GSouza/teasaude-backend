const mongoose = require("mongoose");

function dataNascimentoValida(dataNascimento) {
  if (
    !(dataNascimento instanceof Date) ||
    Number.isNaN(dataNascimento.getTime())
  ) {
    return false;
  }

  const nascimento = new Date(
    dataNascimento.getUTCFullYear(),
    dataNascimento.getUTCMonth(),
    dataNascimento.getUTCDate()
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (nascimento > hoje) {
    return false;
  }

  let idade =
    hoje.getFullYear() - nascimento.getFullYear();

  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (
      hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() < nascimento.getDate()
    );

  if (aindaNaoFezAniversario) {
    idade--;
  }

  return idade < 18;
}

function normalizarTelefone(telefone) {
  if (typeof telefone !== "string") {
    return telefone;
  }

  const valor = telefone.trim();

  if (!/^[\d\s().-]+$/.test(valor)) {
    return valor;
  }

  return valor.replace(/\D/g, "");
}

const pacienteSchema = new mongoose.Schema(
  {
    nomeCompleto: {
      type: String,
      required: [
        true,
        "O nome é obrigatório."
      ],
      trim: true,
      minlength: [
        3,
        "O nome deve ter pelo menos 3 caracteres."
      ]
    },

    dataNascimento: {
      type: Date,
      required: [
        true,
        "A data de nascimento é obrigatória."
      ],
      validate: {
        validator: dataNascimentoValida,
        message:
          "A data de nascimento deve ser válida, e o paciente deve ter menos de 18 anos."
      }
    },

    nomeContato: {
      type: String,
      required: [
        true,
        "O nome do responsável é obrigatório."
      ],
      trim: true
    },

    telefoneContato: {
      type: String,
      required: [
        true,
        "O telefone é obrigatório."
      ],
      set: normalizarTelefone,
      validate: {
        validator: function (telefone) {
          return /^\d{10,11}$/.test(telefone);
        },
        message:
          "O telefone deve conter DDD e 10 ou 11 dígitos numéricos."
      }
    },

    emailContato: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          if (
            email === undefined ||
            email === null ||
            email === ""
          ) {
            return true;
          }

          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message:
          "O e-mail informado possui formato inválido."
      }
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Paciente",
  pacienteSchema
);