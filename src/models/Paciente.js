const mongoose = require("mongoose");

function dataCivilValida(valor) {
  if (typeof valor !== "string") {return false;}

  const formato = /^(\d{4})-(\d{2})-(\d{2})$/;
  const resultado = formato.exec(valor);

  if (!resultado) {return false;}

  const ano = Number(resultado[1]);
  const mes = Number(resultado[2]);
  const dia = Number(resultado[3]);

  const data = new Date(ano, mes - 1, dia);

  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

function dataNaoFutura(valor) {
  if (!dataCivilValida(valor)) {return false;}

  const [ano, mes, dia] = valor.split("-").map(Number);
  const nascimento = new Date(ano, mes - 1, dia);

  const agora = new Date();
  const hoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  return nascimento <= hoje;
}

function menorDe18(valor) {
  if (!dataCivilValida(valor) || !dataNaoFutura(valor)) {return false;}

  const [ano, mes, dia] = valor.split("-").map(Number);
  const hoje = new Date();

  let idade = hoje.getFullYear() - ano;

  const aindaNaoFezAniversario =
    hoje.getMonth() + 1 < mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);

  if (aindaNaoFezAniversario) {dade--;}

  return idade < 18;
}

const pacienteSchema = new mongoose.Schema(
  {
    nomeCompleto: {
      type: String,
      required: [true, "O nome é obrigatório."],
      trim: true,
    },

    dataNascimento: {
      type: String,
      required: [true, "A data de nascimento é obrigatória."],
      validate: [
        {validator: dataCivilValida,
          message: "A data de nascimento deve estar no formato YYYY-MM-DD e ser válida"},

        {validator: dataNaoFutura,
          message: "A data de nascimento não pode estar no futuro"},
          
        {validator: menorDe18,
          message: "O paciente deve ter menos de 18 anos no cadastro inicial"}
      ]
    },

    nomeContato: {
      type: String,
      required: [true, "O nome do responsável é obrigatório."],
      trim: true
    },

    telefoneContato: {
      type: String,
      required: [true, "O telefone é obrigatório."],
      trim: true,
      set: (valor) => {
        if (typeof valor !== "string") {
          return valor;
        }

        return valor.replace(/\D/g, ""); // normalização, pra digitar junto ou separado
      },
      validate: {
        validator: (valor) => /^\d{10,11}$/.test(valor),
        message: "O telefone deve possuir DDD e 10 ou 11 dígitos."
      }
    },

    emailContato: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (valor) => {
          if (!valor) {return true;}

          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
        },
        message: "O e-mail informado é inválido."
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Paciente", pacienteSchema);