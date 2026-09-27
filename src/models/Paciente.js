const mongoose = require("mongoose");

const pacienteSchema = new mongoose.Schema(
  {
    nomeCompleto: {
      type: String,
      required: [true, "O nome é obrigatório."],
      trim: true,
      minlength: 3
    },

    dataNascimento: {
      type: Date,
      required: [true, "A data de nascimento é obrigatória."]
    },

    nomeContato: {
      type: String,
      required: [true, "O nome do responsável é obrigatório."],
      trim: true
    },

    telefoneContato: {
      type: String,
      required: [true, "O telefone é obrigatório."],
      trim: true
    },

    emailContato: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Paciente", pacienteSchema);