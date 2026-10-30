import { Router } from 'express';
import { seoController } from '../controllers/seoController';

const router = Router();

router.get('/robots.txt', seoController.getRobotsTxt);
router.get('/sitemap.xml', seoController.getSitemapXml);

export default router;
