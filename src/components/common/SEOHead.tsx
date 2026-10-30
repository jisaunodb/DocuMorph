import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogType?: 'website' | 'article';
  schemaJson?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl,
  noIndex = false,
  ogType = 'website',
  schemaJson,
}) => {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title.includes('DocuMorph') ? title : `${title} | DocuMorph`;
    document.title = formattedTitle;

    // 2. Helper to set or update meta tag
    const setMeta = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Standard Meta
    setMeta('name', 'description', description);

    // 4. Robots Directives (Index vs Noindex)
    if (noIndex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      setMeta('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // 5. Open Graph Meta
    setMeta('property', 'og:title', formattedTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', 'DocuMorph');

    // 6. Twitter Meta
    setMeta('name', 'twitter:title', formattedTitle);
    setMeta('name', 'twitter:description', description);

    // 7. Canonical Link
    const currentCanonical = canonicalUrl || window.location.href.split('?')[0];
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', currentCanonical);

    // 8. Inject Schema JSON-LD if provided
    let scriptTag = document.getElementById('dynamic-schema-ld');
    if (schemaJson) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-schema-ld';
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schemaJson);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, canonicalUrl, noIndex, ogType, schemaJson]);

  return null;
};
