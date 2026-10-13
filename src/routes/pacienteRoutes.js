const express = require("express");

const router = express.Router();

const pacienteController = require("../controllers/pacienteController");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");


/**
 * @swagger
 * /api/pacientes:
 *   get:
 *     summary: Lista todos os pacientes cadastrados.
 *     tags:
 *       - Pacientes
 *     responses:
 *       200:
 *         description: Lista de pacientes retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pacientes encontrados com sucesso.
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 6acbb89bc808f95673ceed7f
 *                       nomeCompleto:
 *                         type: string
 *                         example: Maria Eduarda Silva
 *                       dataNascimento:
 *                         type: string
 *                         format: date-time
 *                         example: "2013-05-12T00:00:00.000Z"
 *                       nomeContato:
 *                         type: string
 *                         example: Ana Paula Silva
 *                       telefoneContato:
 *                         type: string
 *                         example: "81999998888"
 *                       emailContato:
 *                         type: string
 *                         example: ana@email.com
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-10-11T16:26:03.709Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-10-11T18:56:23.311Z"
 *                       __v:
 *                         type: integer
 *                         example: 0
 *       500:
 *         description: Erro ao listar pacientes.
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
 *     summary: Busca um paciente pelo ID.
 *     tags:
 *       - Pacientes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente no MongoDB.
 *     responses:
 *       200:
 *         description: Paciente encontrado.
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Paciente não encontrado
 *       500:
 *         description: Erro interno ao buscar paciente.
 *      
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
 *     summary: Atualiza um paciente.
 *     tags:
 *       - Pacientes
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
 *               telefoneContato:
 *                 type: string
 *               emailContato:
 *                 type: string
 *               nomeContato:
 *                 type: string
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento completa no formato AAAA-MM-DD.
 *                 example: "2013-06-15"
 *     responses:
 *       200:
 *         description: Paciente atualizado.
 *       400:
 *         description: ID inválido ou dados inválidos.
 *       404:
 *         description: Paciente não encontrado.
 *       500:
 *         description: Erro interno ao atualizar paciente.
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
 *     summary: Remove um paciente.
 *     tags:
 *       - Pacientes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Paciente removido com sucesso. Sem corpo na resposta.
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Paciente não encontrado.
 *       500:
 *         description: Erro interno ao remover paciente.
 */
router.delete(
  "/:id",
  authMiddleware,
  autorizarPerfis("admin"),
  pacienteController.deletarPaciente
);

module.exports = router;