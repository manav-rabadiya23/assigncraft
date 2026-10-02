import { useEffect } from "react";

const SITE_URL = "https://assigncraft.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/assigncraft-logo.png`;

function removeExistingJsonLd() {
  document
    .querySelectorAll('script[data-assigncraft-seo="true"]')
    .forEach((element) => element.remove());
}

export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  keywords = "",
  breadcrumbs = [],
  schema = [],
}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;

    document.title = title;

    const setMeta = (attribute, value, content) => {
      if (!content) return;

      let element = document.head.querySelector(
        `meta[${attribute}="${value}"]`,
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    const setLink = (rel, href) => {
      let element = document.head.querySelector(`link[rel="${rel}"]`);

      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }

      element.setAttribute("href", href);
    };

    // Basic SEO
    setMeta("name", "description", description);
    setMeta("name", "author", "Manav Rabadiya");

    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    setMeta("name", "robots", "index, follow");

    // Canonical
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta("property", "og:type", type);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:site_name", "AssignCraft");
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:alt", "AssignCraft logo");

    // Twitter / X
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", "AssignCraft logo");

    // JSON-LD
    removeExistingJsonLd();

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "AssignCraft",
      alternateName: "AssignCraft",
      url: SITE_URL,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    };

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AssignCraft",
      alternateName: "AssignCraft",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: DEFAULT_IMAGE,
      },
      description:
        "AssignCraft is a web-based assignment generator developed by Manav Rabadiya for creating structured assignments from PDF and Word question files.",
      founder: {
        "@type": "Person",
        name: "Manav Rabadiya",
      },
    };

    const pageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      name: title,
      description,
      url: canonicalUrl,
      isPartOf: {
        "@id": `${SITE_URL}/#website`,
      },
      about: {
        "@id": `${SITE_URL}/#software`,
      },
      author: {
        "@type": "Person",
        name: "Manav Rabadiya",
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    };

    const breadcrumbSchema =
      breadcrumbs.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: `${SITE_URL}${item.path}`,
            })),
          }
        : null;

    const softwareSchema =
      path === "/"
        ? {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": `${SITE_URL}/#software`,
            name: "AssignCraft",
            description:
              "A web-based PDF, Word and assignment generator that detects questions, supports OCR, lets users customize assignment documents and exports assignments to Word or PDF.",
            applicationCategory: "EducationalApplication",
            applicationSubCategory: "Assignment Generator",
            operatingSystem: "Web",
            url: SITE_URL,
            image: DEFAULT_IMAGE,
            author: {
              "@type": "Person",
              name: "Manav Rabadiya",
            },
            publisher: {
              "@id": `${SITE_URL}/#organization`,
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "INR",
            },
          }
        : null;

    const allSchemas = [
      organizationSchema,
      websiteSchema,
      pageSchema,
      softwareSchema,
      breadcrumbSchema,
      ...schema,
    ].filter(Boolean);

    allSchemas.forEach((schemaObject) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-assigncraft-seo", "true");
      script.textContent = JSON.stringify(schemaObject);
      document.head.appendChild(script);
    });

    return () => {
      removeExistingJsonLd();
    };
  }, [title, description, path, image, type, keywords, breadcrumbs, schema]);

  return null;
}
