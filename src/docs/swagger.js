const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "API - Projeto Integrador Saúde Mental (TEA)",
      version: "1.0.0",
      description:
        "Backend desenvolvido em Node.js para o Projeto Integrador do curso de Análise e Desenvolvimento de Sistemas (SENAC)."
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor Local"
      }
    ],

    tags: [
      {
        name: "Pacientes",
        description: "Operações relacionadas ao cadastro de pacientes."
      },
     
    ]
  },

  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);