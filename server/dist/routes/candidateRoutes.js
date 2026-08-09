"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const candidateController_1 = require("../controllers/candidateController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateUser);
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Candidate name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid candidate email is required'),
], validate_1.validate, candidateController_1.createCandidate);
router.get('/my-interviews', candidateController_1.getMyInterviews);
router.get('/', candidateController_1.getCandidates);
router.get('/:id', candidateController_1.getCandidateById);
exports.default = router;
