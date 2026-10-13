
require("dotenv").config();

const mongoose = require("mongoose");
const conectarBanco = require("../src/config/database");

const Instituicao = require("../src/models/Instituicao");
const Medico = require("../src/models/Medico");

const instituicoesDemo = [
    "Clínica de Desenvolvimento Teste TeaSaúde",
    "Centro Infantojuvenil Viver Bem - DEMO",
    "Instituto Horizonte de Saúde Mental - DEMO"
];

const medicosDemo = [
    {
        nomeCompleto: "Dra. Marina Costa",
        especialidade: "Psiquiatria Infantil",
        instituicaoNome: "Clínica de Desenvolvimento Teste TeaSaúde"
    },
    {
        nomeCompleto: "Dr. Rafael Monteiro",
        especialidade: "Neurologia Pediátrica",
        instituicaoNome: "Clínica de Desenvolvimento Teste TeaSaúde"
    },
    {
        nomeCompleto: "Dra. Juliana Freire",
        especialidade: "Psiquiatria da Adolescência",
        instituicaoNome: "Centro Infantojuvenil Viver Bem - DEMO"
    },
    {
        nomeCompleto: "Dr. Caio Martins",
        especialidade: "Pediatria do Desenvolvimento",
        instituicaoNome: "Centro Infantojuvenil Viver Bem - DEMO"
    },
    {
        nomeCompleto: "Dra. Renata Albuquerque",
        especialidade: "Neurologia Pediátrica",
        instituicaoNome: "Instituto Horizonte de Saúde Mental - DEMO"
    },
    {
        nomeCompleto: "Dr. Bruno Siqueira",
        especialidade: "Psiquiatria Infantil",
        instituicaoNome: "Instituto Horizonte de Saúde Mental - DEMO"
    }
];

async function obterOuCriarInstituicao(nomePublico) {
    let instituicao = await Instituicao.findOne({ nomePublico });

    if (instituicao) {
        if (!instituicao.ativo) {
            throw new Error(
                `A instituição "${nomePublico}" existe, mas está inativa.`
            );
        }

        return instituicao;
    }

    instituicao = await Instituicao.create({
        nomePublico,
        ativo: true
    });

    console.log(`Instituição criada: ${nomePublico}`);

    return instituicao;
}

async function obterOuCriarMedico(dados, instituicao) {
    let medico = await Medico.findOne({
        nomeCompleto: dados.nomeCompleto,
        instituicaoId: instituicao._id
    });

    if (medico) {
        if (!medico.ativo) {
            throw new Error(
                `O médico "${dados.nomeCompleto}" já existe, mas está inativo.`
            );
        }

        return medico;
    }

    medico = await Medico.create({
        nomeCompleto: dados.nomeCompleto,
        especialidade: dados.especialidade,
        instituicaoId: instituicao._id,
        ativo: true
    });

    console.log(`Médico criado: ${dados.nomeCompleto}`);

    return medico;
}

async function popularDadosDemo() {
    try {
        await conectarBanco();

        const instituicoesMap = new Map();

        for (const nomePublico of instituicoesDemo) {
            const instituicao = await obterOuCriarInstituicao(
                nomePublico
            );

            instituicoesMap.set(nomePublico, instituicao);
        }

        const medicosCriados = [];

        for (const dados of medicosDemo) {
            const instituicao = instituicoesMap.get(
                dados.instituicaoNome
            );

            const medico = await obterOuCriarMedico(
                dados,
                instituicao
            );

            medicosCriados.push({
                medico,
                instituicao
            });
        }

        console.log("\n=== INSTITUIÇÕES PARA DEMONSTRAÇÃO ===");

        for (const instituicao of instituicoesMap.values()) {
            console.log({
                nomePublico: instituicao.nomePublico,
                instituicaoId: String(instituicao._id),
                ativo: instituicao.ativo
            });
        }

        console.log("\n=== MÉDICOS PARA DEMONSTRAÇÃO ===");

        for (const item of medicosCriados) {
            console.log({
                nomeCompleto: item.medico.nomeCompleto,
                especialidade: item.medico.especialidade,
                medicoId: String(item.medico._id),
                instituicao: item.instituicao.nomePublico,
                instituicaoId: String(item.instituicao._id),
                ativo: item.medico.ativo
            });
        }

        console.log("\nDados de demonstração preparados com sucesso.");
    } finally {
        await mongoose.disconnect();
    }
}

popularDadosDemo().catch((erro) => {
    console.error("Não foi possível popular os dados de demonstração.");
    console.error(erro.message);
    process.exitCode = 1;
});
