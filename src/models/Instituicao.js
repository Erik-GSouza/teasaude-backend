
const mongoose = require("mongoose");

const instituicaoSchema = new mongoose.Schema(
  {
    nomePublico: {
      type: String,
      required: [true, "O nome público da instituição é obrigatório."],
      trim: true
    },

    ativo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Instituicao", instituicaoSchema);
