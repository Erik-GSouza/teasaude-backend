
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    criarAgendamento,
    listarMeusAgendamentos,
    listarAgendamentos,
    buscarAgendamentoPorId,
    atualizarStatusAgendamento
} = require("../controllers/agendamentoController");

const router = express.Router();


/**
 * @swagger
 * /api/agendamentos:
 *   post:
 *     summary: Solicita uma consulta para um paciente
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
 *                 example: "Solicitação de acompanhamento psicológico."
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
 *         description: Dados inválidos.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Perfil sem permissão.
 *       404:
 *         description: Paciente ou disponibilidade não encontrada.
 *       409:
 *         description: Vaga indisponível ou conflito de horário.
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
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dos próprios agendamentos.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Perfil sem permissão.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/meus",
    authMiddleware,
    autorizarPerfis("responsavel"),
    listarMeusAgendamentos
);



/**
 * @swagger
 * /api/agendamentos:
 *   get:
 *     summary: Lista agendamentos da instituição ou globalmente
 *     description: Gestor consulta somente os pedidos da sua instituição. Admin possui consulta global.
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pendente
 *             - agendada
 *             - recusada
 *             - cancelada
 *             - concluida
 *         description: Filtra os agendamentos pelo status.
 *       - in: query
 *         name: medicoId
 *         schema:
 *           type: string
 *         description: Filtra os agendamentos de um médico.
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada.
 *       400:
 *         description: Filtro inválido.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Perfil sem permissão.
 *       409:
 *         description: Conta Gestor sem instituição vinculada.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis("gestor", "admin"),
    listarAgendamentos
);



/**
 * @swagger
 * /api/agendamentos/{id}:
 *   get:
 *     summary: Consulta os detalhes de um agendamento
 *     description: Responsável consulta somente pedidos dos próprios pacientes. Gestor consulta apenas sua instituição. Admin possui acesso global.
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agendamento encontrado.
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Perfil sem permissão.
 *       404:
 *         description: Agendamento não encontrado ou fora do escopo do usuário.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/:id",
    authMiddleware,
    autorizarPerfis("responsavel", "gestor", "admin"),
    buscarAgendamentoPorId
);



/**
 * @swagger
 * /api/agendamentos/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um agendamento
 *     description: Gestor ou Admin pode confirmar, recusar, cancelar ou registrar a conclusão. Responsável somente pode cancelar seus próprios agendamentos, respeitando a antecedência mínima.
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             additionalProperties: false
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - agendada
 *                   - recusada
 *                   - cancelada
 *                   - concluida
 *                 example: agendada
 *               motivo:
 *                 type: string
 *                 example: "Indisponibilidade profissional."
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso.
 *       400:
 *         description: Dados ou transição inválidos.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Perfil sem permissão para a operação.
 *       404:
 *         description: Agendamento não encontrado ou fora do escopo.
 *       409:
 *         description: Conflito de estado, prazo ou horário.
 *       500:
 *         description: Erro interno.
 */
router.patch(
    "/:id/status",
    authMiddleware,
    autorizarPerfis("responsavel", "gestor", "admin"),
    atualizarStatusAgendamento
);

module.exports = router;
