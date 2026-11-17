
const express = require("express");

const router = express.Router();

const pacienteController = require("../controllers/pacienteController");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

// =====================================================
// ROTAS DO RESPONSÁVEL
// =====================================================

/**
 * @swagger
 * /api/pacientes:
 *   post:
 *     summary: Cadastra um novo paciente para o responsável autenticado
 *     tags:
 *       - Pacientes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeCompleto
 *               - dataNascimento
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: Maria Silva
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 example: "2017-08-15"
 *     responses:
 *       201:
 *         description: Paciente cadastrado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Usuário não autenticado.
 *       403:
 *         description: Perfil não autorizado.
 *       500:
 *         description: Erro interno.
 */
router.post(
    "/",
    authMiddleware,
    autorizarPerfis("responsavel"),
    pacienteController.criarPaciente
);

/**
 * @swagger
 * /api/pacientes/meus:
 *   get:
 *     summary: Lista os pacientes vinculados ao responsável autenticado
 *     tags:
 *       - Pacientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes retornada.
 *       401:
 *         description: Usuário não autenticado.
 *       403:
 *         description: Perfil não autorizado.
 *       500:
 *         description: Erro interno.
 */
router.get(
    "/meus",
    authMiddleware,
    autorizarPerfis("responsavel"),
    pacienteController.listarMeusPacientes
);

/**
 * @swagger
 * /api/pacientes/meus/{id}:
 *   get:
 *     summary: Consulta um paciente pertencente ao responsável autenticado
 *     tags:
 *       - Pacientes
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
 *         description: Paciente encontrado.
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Paciente não encontrado ou não pertence ao responsável.
 */
router.get(
    "/meus/:id",
    authMiddleware,
    autorizarPerfis("responsavel"),
    pacienteController.buscarMeuPacientePorId
);

/**
 * @swagger
 * /api/pacientes/meus/{id}:
 *   patch:
 *     summary: Atualiza dados de um paciente do responsável autenticado
 *     tags:
 *       - Pacientes
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
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: Pedro Silva
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 example: "2015-04-20"
 *     responses:
 *       200:
 *         description: Paciente atualizado.
 *       400:
 *         description: Dados inválidos.
 *       404:
 *         description: Paciente não encontrado.
 */
router.patch(
    "/meus/:id",
    authMiddleware,
    autorizarPerfis("responsavel"),
    pacienteController.atualizarMeuPaciente
);

// =====================================================
// ROTAS ADMINISTRATIVAS
// =====================================================

/**
 * @swagger
 * /api/pacientes:
 *   get:
 *     summary: Lista todos os pacientes cadastrados
 *     tags:
 *       - Pacientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista administrativa de pacientes.
 *       401:
 *         description: Usuário não autenticado.
 *       403:
 *         description: Acesso permitido somente ao Admin.
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis("admin"),
    pacienteController.listarPacientes
);

/**
 * @swagger
 * /api/pacientes/{id}:
 *   get:
 *     summary: Busca um paciente pelo ID
 *     tags:
 *       - Pacientes
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
 *         description: Paciente encontrado.
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Paciente não encontrado.
 */
router.get(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    pacienteController.buscarPacientePorId
);

/**
 * @swagger
 * /api/pacientes/{id}:
 *   patch:
 *     summary: Atualiza um paciente pela administração
 *     tags:
 *       - Pacientes
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
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Paciente atualizado.
 *       400:
 *         description: Dados inválidos.
 *       404:
 *         description: Paciente não encontrado.
 */
router.patch(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    pacienteController.atualizarPaciente
);

/**
 * @swagger
 * /api/pacientes/{id}:
 *   delete:
 *     summary: Exclui um paciente sem histórico de agendamentos
 *     tags:
 *       - Pacientes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Paciente removido.
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Paciente não encontrado.
 *       409:
 *         description: Paciente possui histórico de agendamentos.
 */
router.delete(
    "/:id",
    authMiddleware,
    autorizarPerfis("admin"),
    pacienteController.deletarPaciente
);

module.exports = router;
