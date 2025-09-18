export const ACTIONS = [
  'navigateTo',
  'findElement',
  'clickElement',
  'extractText',
  'extractTable',
  'extractAttribute',
  'waitForPageLoad',
  'waitForFullLoad',
  'screenshot',
  'executeJavaScript',
  'inputText',
  'waitForElementToDisappear',
  'scrollToTop',
  'scrollToBottom',
  'scrollIntoElement',
  'getRequest',
  'postRequest',
  'extractPDF',
] as const;

export type Action = (typeof ACTIONS)[number];

// rules: which previous actions allow this action
export const ACTION_RULES: Record<Action, Action[]> = {
  navigateTo: [],
  findElement: [],
  // getElementByXpath: [],
  // getElementsByXpath: [],
  // getElementByCss: [],
  // getElementsByCss: [],
  clickElement: ['findElement'],
  inputText: ['findElement'],
  extractText: ['findElement', 'extractText', 'extractAttribute', 'extractTable'],
  extractTable: ['findElement', 'extractText', 'extractAttribute', 'extractTable'],
  extractAttribute: ['findElement', 'extractText', 'extractAttribute', 'extractTable'],
  waitForPageLoad: ['navigateTo'],
  waitForFullLoad: ['navigateTo'],
  screenshot: [],
  executeJavaScript: [],
  waitForElementToDisappear: [],
  scrollToTop: [],
  scrollToBottom: [],
  scrollIntoElement: ['findElement'],
  getRequest: [],
  postRequest: [],
  extractPDF: [],
};

export interface labelledAction {
  label: string;
  description: string;
  action: Action;
  data?: unknown;
  placeholder?: unknown;
}

export const ACTIONS_LABELS: Record<
  Action,
  { label: string; description: string; placeholder?: unknown; data?: unknown }
> = {
  navigateTo: {
    label: 'Navigate to site',
    description: 'Go to a specific URL to start scraping data from there.',
    placeholder: { url: 'https://example.com', waitUntil: 'load', waitForFullLoad: true, timeout: 30 },
    data: { url: 'https://example.com', waitUntil: 'load', waitForFullLoad: true, timeout: 30 },
  },
  findElement: {
    label: 'Find element',
    description: 'Find element using XPath, CSS selector, or ID.',
    placeholder: { by: 'xpath', locator: '//*[@id="main"]', timeout: 30, multiple: false },
    data: { by: 'xpath', locator: '//*[@id="main"]', timeout: 30, multiple: false },
  },
  clickElement: {
    label: 'Click an element',
    description: 'Simulate a click action on a selected element.',
  },
  extractText: {
    label: 'Extract text from one or more elements',
    description: 'Extract text content from a single element or list selected elements.',
  },
  extractTable: {
    label: 'Download table as Excel',
    description: 'Extract structured data from an HTML table and save it as excel.',
  },
  extractAttribute: {
    label: 'Extract attribute from one or more elements',
    description: 'Extract the value of a specific attribute from a single element or list selected elements.',
    placeholder: 'href',
    data: 'href',
  },
  waitForPageLoad: {
    label: 'Wait for page load',
    description: 'Wait for the page to load after navigation.',
    placeholder: { milliseconds: 3000 },
    data: { milliseconds: 3000 },
  },
  waitForFullLoad: {
    label: 'Wait for full page load',
    description: 'Wait for a specified duration to ensure the page has fully loaded.',
    placeholder: '5000 (milliseconds)',
    data: '5000 (milliseconds)',
  },
  screenshot: {
    label: 'Take a screenshot',
    description: 'Capture a screenshot of the current page view.',
  },
  executeJavaScript: {
    label: 'Execute custom JavaScript',
    description: 'Run custom JavaScript code within the context of the page.',
    placeholder: "document.body.style.backgroundColor = 'red';",
    data: "document.body.style.backgroundColor = 'red';",
  },
  inputText: {
    label: 'Input text into a field',
    description: 'Type specified text into a selected input field.',
    placeholder: 'Sample text',
    data: 'Sample text',
  },
  waitForElementToDisappear: {
    label: 'Wait for an element to appear',
    description:
      'Pause execution until a specific element, identified by its locator, is no longer present on the page.',
    placeholder: { by: 'xpath', locator: '//*[@id="main"]', options: { timeout: 10, maxRetries: 3 } },
    data: { by: 'xpath', locator: '//*[@id="main"]', options: { timeout: 10, maxRetries: 3 } },
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
  },
  getRequest: {
    label: 'Make a GET request',
    description: 'Fetch data from a specified URL using a GET request.',
    placeholder: {
      url: 'https://api.example.com/data',
      returnJson: true,
      headers: {},
      params: {},
      timeout: 30,
      retries: 3,
    },
    data: {
      url: 'https://api.example.com/data',
      returnJson: true,
      headers: {},
      params: {},
      timeout: 30,
      retries: 3,
    },
  },
  postRequest: {
    label: 'Make a POST request',
    description: 'Send data to a specified URL using a POST request.',
    placeholder: {
      url: 'https://api.example.com/submit',
      options: { data: { key: 'value' } },
    },
    data: {
      url: 'https://api.example.com/submit',
      options: { data: { key: 'value' } },
    },
  },
  extractPDF: {
    label: 'Extract PDF',
    description: 'Extract text, tables, images,etc from a PDF',
    placeholder: {
      usingUrl: true,
      options: {
        url: 'https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf',
        fileUpload: null,
        extract: 'text',
      },
    },
  },
};

export const NSE_DERIVATIVES_STEPS: labelledAction[] = [
  {
    label: 'Naviagte to site',
    description: 'Go to a specific URL to start scraping data from there.',
    action: 'navigateTo' as Action,
    data: {
      url: 'https://www.nseindia.com/market-data/equity-derivatives-watch',
      waitUntil: 'load',
      waitForFullLoad: true,
      timeout: 30,
    },
    placeholder: { url: 'https://example.com', waitUntil: 'load', timeout: 30 },
  },
  {
    label: 'Find element',
    description: 'Find element using XPath, CSS selector, or ID.',
    action: 'findElement' as Action,
    data: { by: 'xpath', locator: "//*[@id='eqderivativesTable']/tbody/tr[2]", timeout: 30, multiple: false },
    placeholder: { by: 'xpath', locator: '//*[@id="eqderivativesTable"]/tbody/tr[2]', timeout: 30, multiple: false },
  },
  {
    label: 'Find element',
    description: 'Find element using XPath, CSS selector, or ID.',
    action: 'findElement' as Action,
    data: { by: 'css', locator: 'table#eqderivativesTable', timeout: 30, multiple: false },
    placeholder: { by: 'css', locator: 'table#eqderivativesTable', timeout: 30, multiple: false },
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

export const defaultSteps: labelledAction[] = [
  {
    action: 'extractPDF',
    label: 'Extract PDF',
    description: 'Extract text, tables, images,etc from a PDF',
    placeholder: {
      usingUrl: true,
      options: {
        url: 'https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf',
        fileUpload: null,
        extract: 'text',
      },
    },
    data: {
      usingUrl: true,
      options: {
        url: 'https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf',
        fileUpload: null,
        extract: 'text',
      },
    },
  },
];
