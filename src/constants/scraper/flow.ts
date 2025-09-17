export const ACTIONS = [
  "navigateTo",
  "getElementByXpath",
  "getElementsByXpath",
  "getElementByCss",
  "getElementsByCss",
  "clickElement",
  "extractText",
  "extractTable",
  "extractAttribute",
  "waitForPageLoad",
  "waitForFullLoad",
  "screenshot",
  "executeJavaScript",
  "inputText",
  "waitForXpathToDisappear",
  "waitForCssToDisappear",
  "scrollToBottom",
  "scrollIntoElement",
  "getRequest",
  "postRequest",
] as const;

export type Action = (typeof ACTIONS)[number];

// rules: which previous actions allow this action
export const ACTION_RULES: Record<Action, Action[]> = {
  navigateTo: [],
  getElementByXpath: [],
  getElementsByXpath: [],
  getElementByCss: [],
  getElementsByCss: [],
  clickElement: ["getElementByCss", "getElementsByCss"],
  inputText: ["getElementByXpath", "getElementByCss"],
  extractText: [
    "getElementByXpath",
    "getElementsByXpath",
    "getElementByCss",
    "getElementsByCss",
    "extractText",
    "extractAttribute",
    "extractTable",
  ],
  extractTable: [
    "getElementByXpath",
    "getElementsByXpath",
    "getElementByCss",
    "getElementsByCss",
    "extractText",
    "extractAttribute",
    "extractTable",
  ],
  extractAttribute: [
    "getElementByXpath",
    "getElementsByXpath",
    "getElementByCss",
    "getElementsByCss",
    "extractText",
    "extractAttribute",
    "extractTable",
  ],
  waitForPageLoad: ["navigateTo"],
  waitForFullLoad: ["navigateTo"],
  screenshot: [],
  executeJavaScript: [],
  waitForXpathToDisappear: [],
  waitForCssToDisappear: [],
  scrollToBottom: [],
  scrollIntoElement: ["getElementByXpath", "getElementByCss"],
  getRequest: [],
  postRequest: [],
};

export const defaultSteps = [
  {
    navigateTo: {
      url: "https://www.iomfsa.im/register-results/?entity-name=&entity-current=on&BusinessType=1&BusinessType=2&BusinessType=3&BusinessType=4&BusinessType=5&BusinessType=6&BusinessType=7&BusinessType=8&BusinessType=9&BusinessType=10&BusinessType=11&BusinessType=12&BusinessType=13&BusinessType=14&BusinessType=15&BusinessType=16&BusinessType=17&BusinessType=18&BusinessType=19&BusinessType=20",
      waitUntil: "load",
    },
  },
  {
    getElementsByCss: "table",
  },

  {
    extractTable: null,
  },
];
