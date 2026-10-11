const express = require("express");
const router = express.Router();

const pacienteController = require("../controllers/pacienteController");


/**
 * @swagger
 * /api/pacientes:
 *   post:
 *     summary: Cadastra um novo paciente.
 *     tags:
 *       - Pacientes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeCompleto
 *               - dataNascimento
 *               - nomeContato
 *               - telefoneContato
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 description: Nome completo do paciente.
 *                 example: Maria Eduarda Silva
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 description: Data completa no formato AAAA-MM-DD. O paciente deve ter menos de 18 anos no cadastro inicial.
 *                 example: "2013-05-12"
 *               nomeContato:
 *                 type: string
 *                 description: Nome do contato responsável.
 *                 example: Ana Paula Silva
 *               telefoneContato:
 *                 type: string
 *                 description: Telefone brasileiro com DDD, contendo 10 ou 11 dígitos após a normalização.
 *                 example: "81999998888"
 *               emailContato:
 *                 type: string
 *                 description: E-mail do contato. Campo opcional.
 *                 example: ana@email.com
 *     responses:
 *       201:
 *         description: Paciente cadastrado com sucesso.
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
 *                   example: Paciente cadastrado com sucesso!
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6acbec44715662f2e855ac84
 *                     nomeCompleto:
 *                       type: string
 *                       example: Maria Eduarda Silva
 *                     dataNascimento:
 *                       type: string
 *                       format: date-time
 *                       example: "2013-05-12T00:00:00.000Z"
 *                     nomeContato:
 *                       type: string
 *                       example: Ana Paula Silva
 *                     telefoneContato:
 *                       type: string
 *                       example: "81999998888"
 *                     emailContato:
 *                       type: string
 *                       example: ana@email.com
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-10-11T20:06:28.243Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-10-11T20:06:28.243Z"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *       400:
 *         description: Dados enviados inválidos, incluindo data de nascimento inválida ou campos que não passam pelas validações.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: A data de nascimento deve estar no formato AAAA-MM-DD e representar uma data válida.
 *       500:
 *         description: Erro interno inesperado ao cadastrar paciente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Erro interno ao cadastrar paciente.
 */

router.post("/", pacienteController.criarPaciente);


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

router.get("/", pacienteController.listarPacientes);

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

router.get("/:id", pacienteController.buscarPacientePorId);



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
router.patch("/:id", pacienteController.atualizarPaciente);

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
router.delete("/:id", pacienteController.deletarPaciente);

module.exports = router;