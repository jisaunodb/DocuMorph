import { Request, Response } from 'express';
import { config } from '../config/env';

const TOOL_SLUGS = [
  'image-to-pdf',
  'jpg-to-pdf',
  'png-to-pdf',
  'webp-to-pdf',
  'pdf-to-jpg',
  'pdf-to-png',
  'pdf-to-word',
  'word-to-pdf',
  'pdf-to-excel',
  'excel-to-pdf',
  'pdf-to-powerpoint',
  'powerpoint-to-pdf',
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'rotate-pdf',
  'delete-pdf-pages',
  'extract-pdf-pages',
  'watermark-pdf',
  'add-page-numbers',
  'pdf-metadata',
  'text-to-pdf',
  'ocr',
];

const BLOG_SLUGS = [
  'how-to-convert-jpg-to-pdf',
  'how-to-merge-pdf',
  'how-to-compress-pdf',
  'how-to-extract-text-ocr-from-scanned-pdf',
  'complete-guide-to-pdf-security-passwords',
];

export const seoController = {
  getRobotsTxt(req: Request, res: Response) {
    const baseUrl = config.clientUrl.replace(/\/$/, '');
    const content = `# DocuMorph Search Engine Directives
User-agent: *
Allow: /
Allow: /tools/
Allow: /blog/
Allow: /pricing
Allow: /privacy
Allow: /terms
Allow: /faq

# Disallow private user authenticated workspaces
Disallow: /dashboard
Disallow: /admin
Disallow: /files
Disallow: /history
Disallow: /profile
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

    res.setHeader('Content-Type', 'text/plain');
    return res.send(content);
  },

  getSitemapXml(req: Request, res: Response) {
    const baseUrl = config.clientUrl.replace(/\/$/, '');
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/tools`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/pricing`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/faq`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${baseUrl}/privacy`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/terms`, priority: '0.5', changefreq: 'monthly' },
    ];

    const toolPages = TOOL_SLUGS.map((slug) => ({
      loc: `${baseUrl}/tools/${slug}`,
      priority: '0.9',
      changefreq: 'weekly',
    }));

    const blogPages = BLOG_SLUGS.map((slug) => ({
      loc: `${baseUrl}/blog/${slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    }));

    const allPages = [...staticPages, ...toolPages, ...blogPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    return res.send(xml);
  },
};
