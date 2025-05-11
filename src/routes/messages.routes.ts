import { Router } from 'express';
import messageService from '../controllers/messages.controller';

const router: Router = Router();

// Define message routes
router.post('/add/message', messageService.addMessage);
router.get('/', messageService.getMessages);
router.put('/edit/:messageId', messageService.editMessage);
router.delete('/delete/:messageId', messageService.deleteMessage);
router.get('/:messageId', messageService.getMessageById);

export default router;
