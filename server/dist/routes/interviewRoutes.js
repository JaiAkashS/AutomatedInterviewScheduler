"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const interviewController_1 = require("../controllers/interviewController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateUser);
router.post('/', [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Interview title is required'),
    (0, express_validator_1.body)('duration').isNumeric().withMessage('Duration must be a number'),
], validate_1.validate, interviewController_1.createInterview);
router.get('/', interviewController_1.getInterviews);
router.get('/:id', interviewController_1.getInterviewById);
router.post('/:id/cancel', interviewController_1.cancelInterview);
router.post('/:id/reschedule', interviewController_1.rescheduleInterviewRequest);
router.delete('/:id', interviewController_1.deleteInterview);
exports.default = router;
