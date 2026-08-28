import { Router } from 'express';
import {
  syncSms,
  getSms,
  getConversations,
  getConversationMessages,
  searchSms,
  deleteSms,
} from '../controllers/smsController.js';
import { validateSmsSync } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);
router.use(apiRateLimiter);

router.post('/sync', validateSmsSync, syncSms);
router.get('/', getSms);
router.get('/conversations', getConversations);
router.get('/conversations/:sender', getConversationMessages);
router.get('/search', searchSms);
router.delete('/', deleteSms);

export default router;
