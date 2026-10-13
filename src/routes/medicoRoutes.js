
const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfis = require("../middlewares/perfilMiddleware");

const {
    listarMedicos
} = require("../controllers/medicoController");

const router = express.Router();

/**
 * @swagger
 * /api/medicos:
 *   get:
 *     summary: Lista médicos disponíveis
 *     description: Retorna médicos ativos vinculados a instituições ativas. O Gestor consulta os médicos da própria instituição.
 *     tags:
 *       - Médicos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de médicos disponíveis
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       403:
 *         description: Perfil sem permissão
 *       409:
 *         description: Instituição do Gestor inativa ou não vinculada
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
    "/",
    authMiddleware,
    autorizarPerfis("paciente", "gestor", "admin"),
    listarMedicos
);

module.exports = router;
