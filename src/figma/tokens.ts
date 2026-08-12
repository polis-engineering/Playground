export const designTokens = {
  fontSize: "15px",
  lineHeight: "21.75px",
  letterSpacing: "-0.15px",
  colorPrimary: "#202020",
  colorMuted: "#646464",
  containerMaxWidth: "600px",
  containerGap: "24px",
  gridGap: "16px",
  sectionPaddingX: "24px",
  sectionPaddingYDesktop: "40px",
  sectionPaddingYMobile: "24px",
  nameWeight: "500",
  motionStagger: "0.08",
  motionDuration: "0.6",
} as const;

export const cssVarNames = {
  fontSize: "--polis-font-size",
  lineHeight: "--polis-line-height",
  letterSpacing: "--polis-letter-spacing",
  colorPrimary: "--polis-color-primary",
  colorMuted: "--polis-color-muted",
  containerMaxWidth: "--polis-container-max-width",
  containerGap: "--polis-container-gap",
  gridGap: "--polis-grid-gap",
  sectionPaddingX: "--polis-section-padding-x",
  sectionPaddingY: "--polis-section-padding-y",
  nameWeight: "--polis-name-weight",
  motionEnabled: "--polis-motion-enabled",
  motionStagger: "--polis-motion-stagger",
  motionDuration: "--polis-motion-duration",
} as const;

export type CssVarName = (typeof cssVarNames)[keyof typeof cssVarNames];

export const defaultTokenValues: Record<CssVarName, string> = {
  [cssVarNames.fontSize]: designTokens.fontSize,
  [cssVarNames.lineHeight]: designTokens.lineHeight,
  [cssVarNames.letterSpacing]: designTokens.letterSpacing,
  [cssVarNames.colorPrimary]: designTokens.colorPrimary,
  [cssVarNames.colorMuted]: designTokens.colorMuted,
  [cssVarNames.containerMaxWidth]: designTokens.containerMaxWidth,
  [cssVarNames.containerGap]: designTokens.containerGap,
  [cssVarNames.gridGap]: designTokens.gridGap,
  [cssVarNames.sectionPaddingX]: designTokens.sectionPaddingX,
  [cssVarNames.sectionPaddingY]: designTokens.sectionPaddingYDesktop,
  [cssVarNames.nameWeight]: designTokens.nameWeight,
  [cssVarNames.motionEnabled]: "1",
  [cssVarNames.motionStagger]: designTokens.motionStagger,
  [cssVarNames.motionDuration]: designTokens.motionDuration,
};

export function tokensToJson(values: Record<string, string>): string {
  return JSON.stringify(values, null, 2);
}
