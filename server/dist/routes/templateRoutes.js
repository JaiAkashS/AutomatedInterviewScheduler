"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const templateController_1 = require("../controllers/templateController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateUser);
router.post('/', [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Template title is required'),
    (0, express_validator_1.body)('duration').isNumeric().withMessage('Duration must be a number'),
], validate_1.validate, templateController_1.createTemplate);
router.get('/', templateController_1.getTemplates);
router.get('/:id', templateController_1.getTemplateById);
router.delete('/:id', templateController_1.deleteTemplate);
exports.default = router;
