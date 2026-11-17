
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    listarDisponibilidades,
    criarDisponibilidade,
    atualizarDisponibilidade
} = require("../controllers/disponibilidadeController");

const router = express.Router();

/**
 * @swagger
 * /api/disponibilidades:
 *   get:
 *     summary: Consulta disponibilidades dos médicos
 *     description: Responsáveis consultam vagas futuras livres por médico. Médico e Gestor consultam somente seu próprio escopo. Admin possui acesso global.
 *     tags:
 *       - Disponibilidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: medicoId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID do médico. Obrigatório para o perfil responsável.
 *       - in: query
 *         name: ativo
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filtro de disponibilidades ativas ou inativas. Não se aplica à consulta do responsável.
 *     responses:
 *       200:
 *         description: Disponibilidades encontradas.
 *       400:
 *         description: Parâmetros inválidos.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Acesso não autorizado ao escopo solicitado.
 *       404:
 *         description: Médico não encontrado.
 *       409:
 *         description: Médico ou instituição inativa.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis(
        "responsavel",
        "medico",
        "gestor",
        "admin"
    ),
    listarDisponibilidades
);


/**
 * @swagger
 * /api/disponibilidades:
 *   post:
 *     summary: Cadastra uma disponibilidade de atendimento
 *     description: Médico cadastra seus próprios horários. Gestor e Admin informam o medicoId. Os horários devem estar no futuro e não podem se sobrepor a outra disponibilidade ativa do médico.
 *     tags:
 *       - Disponibilidades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inicio
 *               - fim
 *             properties:
 *               medicoId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: Obrigatório para Gestor e Admin. Derivado da conta para Médico.
 *               inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-01T08:00:00-03:00"
 *               fim:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-01T08:30:00-03:00"
 *     responses:
 *       201:
 *         description: Disponibilidade cadastrada.
 *       400:
 *         description: Dados ou datas inválidas.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Médico ou instituição fora do escopo permitido.
 *       404:
 *         description: Médico não encontrado ou não vinculado à conta.
 *       409:
 *         description: Médico ou instituição inativa ou conflito de horários.
 *       500:
 *         description: Erro interno.
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("medico", "gestor", "admin"),
    criarDisponibilidade
);


/**
 * @swagger
 * /api/disponibilidades/{id}:
 *   patch:
 *     summary: Atualiza ou desativa uma disponibilidade
 *     description: Permite alterar inicio e fim juntos ou modificar o campo ativo. Disponibilidades com histórico de agendamento não podem ser modificadas.
 *     tags:
 *       - Disponibilidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da disponibilidade.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-01T09:00:00-03:00"
 *               fim:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-01T09:30:00-03:00"
 *               ativo:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Disponibilidade atualizada.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Autenticação necessária.
 *       403:
 *         description: Acesso não autorizado.
 *       404:
 *         description: Disponibilidade ou médico não encontrado.
 *       409:
 *         description: Conflito de horário ou disponibilidade com histórico.
 *       500:
 *         description: Erro interno.
 */
router.patch(
    "/:id",
    authMiddleware,
    autorizarPerfis("medico", "gestor", "admin"),
    atualizarDisponibilidade
);

module.exports = router;
