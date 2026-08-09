"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const scheduleController_1 = require("../controllers/scheduleController");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Candidate public endpoints (unauthenticated, token-protected)
router.get('/:token', scheduleController_1.getInterviewByToken);
router.get('/:token/slots', scheduleController_1.getSlotsByToken);
router.post('/:token/confirm', [
    (0, express_validator_1.body)('start').notEmpty().withMessage('Start time is required'),
    (0, express_validator_1.body)('end').notEmpty().withMessage('End time is required'),
], validate_1.validate, scheduleController_1.confirmSlotByToken);
router.post('/:token/reschedule', scheduleController_1.rescheduleByToken);
router.post('/:token/cancel', scheduleController_1.cancelByToken);
exports.default = router;
