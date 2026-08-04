import type { MaybeRef } from "vue";

type TBreadcrumbSchemaItem = {
  name: string;
  path?: string;
};

export const useBreadcrumbSchema = (items: MaybeRef<TBreadcrumbSchemaItem[]>) => {
  const requestUrl = useRequestURL();

  useHead(() => {
    const resolvedItems = unref(items).filter((item) => item?.name);
    if (!resolvedItems.length) return {};

    return {
      script: [
        {
          key: "breadcrumb-schema",
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: resolvedItems.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: `${requestUrl.origin}${item.path || "/"}`,
            })),
          }),
        },
      ],
    };
  });
};
