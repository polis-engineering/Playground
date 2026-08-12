export type FigmaNodeType = "frame" | "text";

export interface CssPropertySnapshot {
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string;
  color?: string;
  gap?: string;
  maxWidth?: string;
  padding?: string;
}

export interface FigmaNodeManifest {
  nodeId: string;
  name: string;
  type: FigmaNodeType;
  componentPath: string;
  cssProperties: CssPropertySnapshot;
  children?: FigmaNodeManifest[];
}

const baseText = {
  fontSize: "15px",
  lineHeight: "21.75px",
  letterSpacing: "-0.15px",
} as const;

export const figmaManifest: FigmaNodeManifest = {
  nodeId: "89:266",
  name: "section",
  type: "frame",
  componentPath: "src/components/polis/PolisHome.tsx",
  cssProperties: {},
  children: [
    {
      nodeId: "88:175",
      name: "site-wrapper",
      type: "frame",
      componentPath: "src/components/polis/SiteWrapper.tsx",
      cssProperties: {},
      children: [
        {
          nodeId: "88:176",
          name: "main",
          type: "frame",
          componentPath: "src/components/polis/Main.tsx",
          cssProperties: {},
          children: [
            {
              nodeId: "88:177",
              name: "section",
              type: "frame",
              componentPath: "src/components/polis/Section.tsx",
              cssProperties: { padding: "40px 24px (desktop), 24px (mobile)" },
              children: [
                {
                  nodeId: "88:178",
                  name: "container",
                  type: "frame",
                  componentPath: "src/components/polis/Container.tsx",
                  cssProperties: {
                    maxWidth: "600px",
                    gap: "24px",
                    padding: "px 24, py 40 (desktop) / p 24 (mobile)",
                  },
                  children: [
                    {
                      nodeId: "88:182",
                      name: "div",
                      type: "frame",
                      componentPath: "src/components/polis/HeaderBlock.tsx",
                      cssProperties: baseText,
                      children: [
                        {
                          nodeId: "88:179",
                          name: "Shivam Bharadwaj",
                          type: "text",
                          componentPath: "src/components/polis/HeaderBlock.tsx",
                          cssProperties: {
                            ...baseText,
                            fontWeight: "500",
                            color: "#202020",
                          },
                        },
                        {
                          nodeId: "88:180",
                          name: "Designer Engineer",
                          type: "text",
                          componentPath: "src/components/polis/HeaderBlock.tsx",
                          cssProperties: {
                            ...baseText,
                            fontWeight: "400",
                            color: "#646464",
                          },
                        },
                      ],
                    },
                    {
                      nodeId: "88:183",
                      name: "div",
                      type: "frame",
                      componentPath: "src/components/polis/IntroBlock.tsx",
                      cssProperties: { ...baseText, gap: "16px", color: "#202020" },
                      children: [
                        {
                          nodeId: "88:185",
                          name: "intro-1",
                          type: "text",
                          componentPath: "src/components/polis/IntroBlock.tsx",
                          cssProperties: { ...baseText, color: "#202020" },
                        },
                        {
                          nodeId: "88:187",
                          name: "intro-2",
                          type: "text",
                          componentPath: "src/components/polis/IntroBlock.tsx",
                          cssProperties: { ...baseText, color: "#202020" },
                        },
                      ],
                    },
                    {
                      nodeId: "88:189",
                      name: "div",
                      type: "frame",
                      componentPath: "src/components/polis/ContentGrid.tsx",
                      cssProperties: { gap: "16px" },
                      children: [
                        {
                          nodeId: "88:193",
                          name: "div",
                          type: "frame",
                          componentPath: "src/components/polis/InfoColumn.tsx",
                          cssProperties: { gap: "16px" },
                          children: [
                            {
                              nodeId: "88:204",
                              name: "div",
                              type: "frame",
                              componentPath: "src/components/polis/InfoColumn.tsx",
                              cssProperties: { gap: "0" },
                              children: [
                                {
                                  nodeId: "88:194",
                                  name: "Writing",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#646464" },
                                },
                                {
                                  nodeId: "88:195",
                                  name: "Anatomy of AI Input",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:197",
                                  name: "AI Glossary",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                              ],
                            },
                            {
                              nodeId: "88:210",
                              name: "div",
                              type: "frame",
                              componentPath: "src/components/polis/InfoColumn.tsx",
                              cssProperties: {},
                              children: [
                                {
                                  nodeId: "88:211",
                                  name: "Selected projects",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#646464" },
                                },
                                {
                                  nodeId: "88:212",
                                  name: "projects-list",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                              ],
                            },
                            {
                              nodeId: "88:214",
                              name: "div",
                              type: "frame",
                              componentPath: "src/components/polis/InfoColumn.tsx",
                              cssProperties: {},
                              children: [
                                {
                                  nodeId: "88:215",
                                  name: "Selected clients",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#646464" },
                                },
                                {
                                  nodeId: "88:216",
                                  name: "clients-list",
                                  type: "text",
                                  componentPath: "src/components/polis/InfoColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          nodeId: "88:217",
                          name: "div",
                          type: "frame",
                          componentPath: "src/components/polis/LinksColumn.tsx",
                          cssProperties: {},
                          children: [
                            {
                              nodeId: "88:218",
                              name: "div",
                              type: "frame",
                              componentPath: "src/components/polis/LinksColumn.tsx",
                              cssProperties: baseText,
                              children: [
                                {
                                  nodeId: "88:219",
                                  name: "Links",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#646464" },
                                },
                                {
                                  nodeId: "88:220",
                                  name: "X",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:221",
                                  name: "GitHub",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:228",
                                  name: "Polis, Works",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:229",
                                  name: "Mail",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:230",
                                  name: "Archived lab",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:231",
                                  name: "Everyday run",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                                {
                                  nodeId: "88:232",
                                  name: "Monthly playlists",
                                  type: "text",
                                  componentPath: "src/components/polis/LinksColumn.tsx",
                                  cssProperties: { ...baseText, color: "#202020" },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export function flattenManifest(
  node: FigmaNodeManifest = figmaManifest,
): Map<string, FigmaNodeManifest> {
  const map = new Map<string, FigmaNodeManifest>();
  const walk = (n: FigmaNodeManifest) => {
    map.set(n.nodeId, n);
    n.children?.forEach(walk);
  };
  walk(node);
  return map;
}

export const manifestByNodeId = flattenManifest();

export function getManifestPath(nodeId: string): string | undefined {
  return manifestByNodeId.get(nodeId)?.componentPath;
}
