import { time } from 'console';

export const ACTIONS = [
  'navigateTo',
  'getElementByXpath',
  'getElementsByXpath',
  'getElementByCss',
  'getElementsByCss',
  'clickElement',
  'extractText',
  'extractTable',
  'extractAttribute',
  'waitForPageLoad',
  'waitForFullLoad',
  'screenshot',
  'executeJavaScript',
  'inputText',
  'waitForXpathToDisappear',
  'waitForCssToDisappear',
  'scrollToTop',
  'scrollToBottom',
  'scrollIntoElement',
  'getRequest',
  'postRequest',
] as const;

export type Action = (typeof ACTIONS)[number];

// rules: which previous actions allow this action
export const ACTION_RULES: Record<Action, Action[]> = {
  navigateTo: [],
  getElementByXpath: [],
  getElementsByXpath: [],
  getElementByCss: [],
  getElementsByCss: [],
  clickElement: ['getElementByCss', 'getElementsByCss'],
  inputText: ['getElementByXpath', 'getElementByCss'],
  extractText: [
    'getElementByXpath',
    'getElementsByXpath',
    'getElementByCss',
    'getElementsByCss',
    'extractText',
    'extractAttribute',
    'extractTable',
  ],
  extractTable: [
    'getElementByXpath',
    'getElementsByXpath',
    'getElementByCss',
    'getElementsByCss',
    'extractText',
    'extractAttribute',
    'extractTable',
  ],
  extractAttribute: [
    'getElementByXpath',
    'getElementsByXpath',
    'getElementByCss',
    'getElementsByCss',
    'extractText',
    'extractAttribute',
    'extractTable',
  ],
  waitForPageLoad: ['navigateTo'],
  waitForFullLoad: ['navigateTo'],
  screenshot: [],
  executeJavaScript: [],
  waitForXpathToDisappear: [],
  waitForCssToDisappear: [],
  scrollToTop: [],
  scrollToBottom: [],
  scrollIntoElement: ['getElementByXpath', 'getElementByCss'],
  getRequest: [],
  postRequest: [],
};

export interface labelledAction {
  label: string;
  description: string;
  action: Action;
  data?: unknown;
  placeholder?: unknown;
}

export const ACTIONS_LABELS: Record<Action, { label: string; description: string; placeholder?: unknown }> = {
  navigateTo: {
    label: 'Navigate to site',
    description: 'Go to a specific URL to start scraping data from there.',
    placeholder: { url: 'https://example.com', waitUntil: 'load' },
  },
  getElementByXpath: {
    label: 'Get element by XPath',
    description: 'Select a single element on the page using an XPath expression.',
    placeholder: { locator: '//*[@id="main"]', timeout: 30 },
  },
  getElementsByXpath: {
    label: 'Get elements by XPath',
    description: 'Select multiple elements on the page using an XPath expression.',
    placeholder: { locator: '//*[@class="item"]', timeout: 30 },
  },
  getElementByCss: {
    label: 'Get element by CSS selector',
    description: 'Select a single element on the page using a CSS selector.',
    placeholder: { locator: 'table', timeout: 30 },
  },
  getElementsByCss: {
    label: 'Get elements by CSS selector',
    description: 'Select multiple elements on the page using a CSS selector.',
    placeholder: { locator: 'table', timeout: 30 },
  },
  clickElement: {
    label: 'Click an element',
    description: 'Simulate a click action on a selected element.',
    placeholder: null,
  },
  extractText: {
    label: 'Extract text from one or more elements',
    description: 'Extract text content from a single element or list selected elements.',
  },
  extractTable: {
    label: 'Extract table data as JSON',
    description: 'Extract structured data from an HTML table and convert it into JSON format.',
  },
  extractAttribute: {
    label: 'Extract attribute from one or more elements',
    description: 'Extract the value of a specific attribute from a single element or list selected elements.',
    placeholder: 'href',
  },
  waitForPageLoad: {
    label: 'Wait for page load',
    description: 'Wait for the page to load after navigation.',
    placeholder: { milliseconds: 3000 },
  },
  waitForFullLoad: {
    label: 'Wait for full page load',
    description: 'Wait for a specified duration to ensure the page has fully loaded.',
    placeholder: '5000 (milliseconds)',
  },
  screenshot: {
    label: 'Take a screenshot',
    description: 'Capture a screenshot of the current page view.',
  },
  executeJavaScript: {
    label: 'Execute custom JavaScript',
    description: 'Run custom JavaScript code within the context of the page.',
    placeholder: "document.body.style.backgroundColor = 'red';",
  },
  inputText: {
    label: 'Input text into a field',
    description: 'Type specified text into a selected input field.',
    placeholder: 'Sample text',
  },
  waitForXpathToDisappear: {
    label: 'Wait for an XPath element to disappear',
    description: 'Pause execution until a specific element, identified by its XPath, is no longer present on the page.',
    placeholder: '//*[@id="loading-indicator"]',
  },
  waitForCssToDisappear: {
    label: 'Wait for a CSS element to disappear',
    description:
      'Pause execution until a specific element, identified by its CSS selector, is no longer present on the page.',
    placeholder: '.loading-indicator',
  },
  scrollToBottom: {
    label: 'Scroll to the bottom of the page',
    description: 'Automatically scroll to the bottom of the current page.',
  },
  scrollToTop: {
    label: 'Scroll to the top of the page',
    description: 'Automatically scroll to the top of the current page.',
  },
  scrollIntoElement: {
    label: 'Scroll into view of an element',
    description: 'Scroll the page to bring a selected element into view.',
    placeholder: null,
  },
  getRequest: {
    label: 'Make a GET request',
    description: 'Fetch data from a specified URL using a GET request.',
    placeholder: { url: 'https://api.example.com/data' },
  },
  postRequest: {
    label: 'Make a POST request',
    description: 'Send data to a specified URL using a POST request.',
    placeholder: {
      url: 'https://api.example.com/submit',
      options: { data: { key: 'value' } },
    },
  },
};

export const defaultSteps: labelledAction[] = [
  {
    label: 'Naviagte to site',
    description: 'Go to a specific URL to start scraping data from there.',
    action: 'navigateTo' as Action,
    data: {
      url: 'https://www.nseindia.com/market-data/equity-derivatives-watch',
      waitUntil: 'load',
      timeout: 30,
    },
    placeholder: { url: 'https://example.com', waitUntil: 'load', timeout: 30 },
  },
  {
    label: 'Wait for an XPath element to disappear',
    description: 'Pause execution until a specific element, identified by its XPath, is no longer present on the page.',
    action: 'waitForXpathToDisappear' as Action,
    data: '//*[@id="eqderivativesTable"]/tbody/tr/td/div/div',
    placeholder: '//*[@id="loading-indicator"]',
  },
  {
    label: 'Get element by CSS selector',
    description: 'Select a single element on the page using a CSS selector.',
    action: 'getElementByCss' as Action,
    data: { locator: 'table#eqderivativesTable', timeout: 30 },
    placeholder: 'table',
  },
  {
    label: 'Extract table data as excel',
    description: 'Extract structured data from an HTML table and download it as excel.',
    action: 'extractTable' as Action,
  },
  {
    label: 'Take a screenshot',
    description: 'Capture a screenshot of the current page view.',
    action: 'screenshot' as Action,
  },
];
