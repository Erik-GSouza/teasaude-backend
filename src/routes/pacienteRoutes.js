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
 *                 example: Maria Eduarda Silva
 *               dataNascimento:
 *                 type: string
 *                 example: "2012-08-15"
 *               nomeContato:
 *                 type: string
 *                 example: Ana Paula Silva
 *               telefoneContato:
 *                 type: string
 *                 example: "81999998888"
 *               emailContato:
 *                 type: string
 *                 example: ana@email.com
 *     responses:
 *       201:
 *         description: Paciente cadastrado com sucesso.
 *       400:
 *         description: Dados inválidos.
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
 *       404:
 *         description: Paciente não encontrado.
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
 *     responses:
 *       200:
 *         description: Paciente atualizado.
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
 *       200:
 *         description: Paciente removido.
 *       404:
 *         description: Paciente não encontrado.
 */
router.delete("/:id", pacienteController.deletarPaciente);

module.exports = router;