const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    criarAgendamento,
    listarMeusAgendamentos
} = require("../controllers/agendamentoController");

const router = express.Router();


/**
 * @swagger
 * /api/agendamentos:
 *   post:
 *     summary: Solicita uma consulta para um paciente
 *     description: O responsável seleciona um paciente vinculado à sua conta e uma disponibilidade publicada por um médico. A solicitação começa como pendente.
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pacienteId
 *               - disponibilidadeId
 *             additionalProperties: false
 *             properties:
 *               pacienteId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               disponibilidadeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               motivo:
 *                 type: string
 *                 example: "Acompanhamento psicológico."
 *               modalidade:
 *                 type: string
 *                 example: "Presencial"
 *               plano:
 *                 type: string
 *                 example: "Particular"
 *     responses:
 *       201:
 *         description: Solicitação criada com status pendente.
 *       400:
 *         description: Dados inválidos ou paciente fora das modalidades aceitas.
 *       401:
 *         description: Token ausente, inválido ou expirado.
 *       403:
 *         description: Somente responsáveis podem solicitar consultas.
 *       404:
 *         description: Paciente, disponibilidade, médico ou instituição não encontrado.
 *       409:
 *         description: Vaga inativa, passada, ocupada ou conflito de horário.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("responsavel"),
    criarAgendamento
);


/**
 * @swagger
 * /api/agendamentos/meus:
 *   get:
 *     summary: Lista os agendamentos dos pacientes do responsável
 *     description: Retorna os agendamentos de todos os pacientes vinculados à conta autenticada.
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada. Uma lista vazia é retornada quando não há consultas.
 *       401:
 *         description: Token ausente, inválido ou expirado.
 *       403:
 *         description: Somente responsáveis podem consultar esta rota.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get(
    "/meus",
    authMiddleware,
    autorizarPerfis("responsavel"),
    listarMeusAgendamentos
);

module.exports = router;