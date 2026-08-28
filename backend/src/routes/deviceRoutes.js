import { Router } from 'express';
import { registerDevice, getDevices, deleteDevice } from '../controllers/deviceController.js';
import { validateDeviceRegister } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);
router.use(apiRateLimiter);

router.post('/register', validateDeviceRegister, registerDevice);
router.get('/', getDevices);
router.delete('/:deviceId', deleteDevice);

export default router;
