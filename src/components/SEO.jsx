import { useEffect, useMemo } from "react";

const SITE_URL = "https://assigncraft.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/assigncraft-logo.png`;

const EMPTY_ARRAY = [];

function removeExistingSeoElements() {
  document
    .querySelectorAll(
      '[data-assigncraft-meta="true"], [data-assigncraft-seo="true"]',
    )
    .forEach((element) => element.remove());
}

export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  keywords = "",
  breadcrumbs = EMPTY_ARRAY,
  schema = EMPTY_ARRAY,
}) {
  const breadcrumbsKey = useMemo(
    () => JSON.stringify(breadcrumbs),
    [breadcrumbs],
  );

  const schemaKey = useMemo(() => JSON.stringify(schema), [schema]);

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;

    // =========================
    // PAGE TITLE
    // =========================

    document.title = title;

    // =========================
    // META HELPERS
    // =========================

    const setMeta = (attribute, value, content) => {
      if (!content) return;

      let element = document.head.querySelector(
        `meta[data-assigncraft-meta="true"][${attribute}="${value}"]`,
      );

      if (!element) {
        element = document.createElement("meta");

        element.setAttribute("data-assigncraft-meta", "true");

        element.setAttribute(attribute, value);

        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    const setLink = (rel, href) => {
      let element = document.head.querySelector(
        `link[data-assigncraft-meta="true"][rel="${rel}"]`,
      );

      if (!element) {
        element = document.createElement("link");

        element.setAttribute("data-assigncraft-meta", "true");

        element.setAttribute("rel", rel);

        document.head.appendChild(element);
      }

      element.setAttribute("href", href);
    };

    // =========================
    // BASIC SEO
    // =========================

    setMeta("name", "description", description);

    setMeta("name", "author", "Manav Rabadiya");

    setMeta("name", "robots", "index, follow");

    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // =========================
    // CANONICAL
    // =========================

    setLink("canonical", canonicalUrl);

    // =========================
    // OPEN GRAPH
    // =========================

    setMeta("property", "og:type", type);

    setMeta("property", "og:title", title);

    setMeta("property", "og:description", description);

    setMeta("property", "og:url", canonicalUrl);

    setMeta("property", "og:site_name", "AssignCraft");

    setMeta("property", "og:image", image);

    setMeta("property", "og:image:alt", "AssignCraft logo");

    // =========================
    // TWITTER / X
    // =========================

    setMeta("name", "twitter:card", "summary_large_image");

    setMeta("name", "twitter:title", title);

    setMeta("name", "twitter:description", description);

    setMeta("name", "twitter:image", image);

    setMeta("name", "twitter:image:alt", "AssignCraft logo");

    // =========================
    // PAGE JSON-LD
    // =========================

    document
      .querySelectorAll('script[data-assigncraft-seo="true"]')
      .forEach((element) => element.remove());

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
        url: "https://rabadiya-manav.vercel.app/",
      },

      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    };

    // =========================
    // BREADCRUMB SCHEMA
    // =========================

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

    // =========================
    // CUSTOM SCHEMA
    // =========================

    const allSchemas = [pageSchema, breadcrumbSchema, ...schema].filter(
      Boolean,
    );

    allSchemas.forEach((schemaObject) => {
      const script = document.createElement("script");

      script.type = "application/ld+json";

      script.setAttribute("data-assigncraft-seo", "true");

      script.textContent = JSON.stringify(schemaObject);

      document.head.appendChild(script);
    });

    // =========================
    // CLEANUP
    // =========================

    return () => {
      document
        .querySelectorAll(
          'meta[data-assigncraft-meta="true"], link[data-assigncraft-meta="true"], script[data-assigncraft-seo="true"]',
        )
        .forEach((element) => element.remove());
    };
  }, [
    title,
    description,
    path,
    image,
    type,
    keywords,
    breadcrumbsKey,
    schemaKey,
  ]);

  return null;
}
