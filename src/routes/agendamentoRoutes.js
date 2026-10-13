
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
 *     summary: Agenda uma consulta para o paciente autenticado
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
 *               - medicoId
 *               - dataHora
 *             additionalProperties: false
 *             properties:
 *               medicoId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               dataHora:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-14T14:00:00-03:00"
 *     responses:
 *       201:
 *         description: Consulta agendada com sucesso
 *       400:
 *         description: Médico, data ou horário inválido
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       403:
 *         description: Somente pacientes podem agendar
 *       404:
 *         description: Paciente, médico ou instituição não encontrado
 *       409:
 *         description: Médico inativo, instituição inativa ou conflito de horário
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("paciente"),
    criarAgendamento
);

/**
 * @swagger
 * /api/agendamentos/meus:
 *   get:
 *     summary: Lista as consultas do paciente autenticado
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos do próprio paciente
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       403:
 *         description: Somente pacientes podem consultar esta rota
 *       404:
 *         description: Cadastro de paciente vinculado à conta não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
    "/meus",
    authMiddleware,
    autorizarPerfis("paciente"),
    listarMeusAgendamentos
);

module.exports = router;
