import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
export default function ActionInput({ action, value, placeholder, updateStep, idx }: any) {
  // Navigate to
  if (action === 'navigateTo') {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <span className='w-12'>URL</span>
          <Textarea
            placeholder={placeholder.url || 'https://example.com'}
            className='flex-1 max-h-30'
            value={value?.url || ''}
            onChange={(e) =>
              updateStep(idx, 'navigateTo', {
                ...value,
                url: e.target.value,
              })
            }
          />
        </div>

        <div className='flex items-center space-x-2'>
          <Switch
            id='airplane-mode'
            checked={value?.waitForFullLoad ?? true}
            className='data-[state=checked]:bg-primary'
            aria-label='Wait for complete page load'
            aria-checked={value?.waitForFullLoad}
            onClick={() =>
              updateStep(idx, 'navigateTo', {
                ...value,
                waitForFullLoad: !value?.waitForFullLoad,
              })
            }
          />
          <Label htmlFor='airplane-mode'>Wait for complete page load</Label>
        </div>

        {!value?.waitForFullLoad && (
          <div className='flex items-center gap-4'>
            <Select
              value={value?.waitUntil || ''}
              onValueChange={(waitUntil) =>
                updateStep(idx, 'navigateTo', {
                  ...value,
                  waitUntil,
                })
              }
            >
              <SelectTrigger className='w-72'>
                <SelectValue placeholder='Select a loading strategy' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='domcontentloaded'>Wait for DOM content load</SelectItem>
                <SelectItem value='load'>Wait until page load</SelectItem>
                <SelectItem value='networkidle'>Wait until network idle</SelectItem>
              </SelectContent>
            </Select>
            <span>upto</span>
            <Input
              placeholder={String(placeholder.timeout) || '30000'}
              type='number'
              value={value?.timeout || ''}
              onChange={(e) =>
                updateStep(idx, 'navigateTo', {
                  ...value,
                  timeout: Number(e.target.value),
                })
              }
              className='w-32'
            />
            <span>seconds</span>
          </div>
        )}
      </div>
    );
  }

  // Get elements
  if (action === 'findElement') {
    return (
      <>
        <div className='flex items-center gap-2'>
          <span className='w-12'>Using</span>
          <Select
            value={value?.by || 'css'}
            onValueChange={(by) =>
              updateStep(idx, action, {
                ...value,
                by,
              })
            }
          >
            <SelectTrigger className='w-72'>
              <SelectValue placeholder='Select a loading strategy' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='xpath'>XPATH</SelectItem>
              <SelectItem value='css'>CSS</SelectItem>
              <SelectItem value='id'>ID</SelectItem>
            </SelectContent>
          </Select>
          <span>=</span>
          <Input
            placeholder={placeholder.locator || 'XPath or CSS selector'}
            value={value?.locator || 'table'}
            onChange={(e) => updateStep(idx, action, { ...value, locator: e.target.value })}
            className='w-72'
          />
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='multiple-elements'
              checked={value?.multiple ?? true}
              className='data-[state=checked]:bg-primary'
              aria-label='Wait for complete page load'
              aria-checked={value?.multiple}
              onClick={() =>
                updateStep(idx, action, {
                  ...value,
                  multiple: !value?.multiple,
                })
              }
            />
            <Label htmlFor='multiple-elements'>Find all matches</Label>
          </div>
          <span>and take upto</span>
          <Input
            placeholder={placeholder.timeout || 'Timeout in seconds'}
            type='number'
            value={value?.timeout || 30}
            onChange={(e) => updateStep(idx, action, { ...value, timeout: parseInt(e.target.value) })}
            className='w-32'
          />
          <span>seconds</span>
        </div>
      </>
    );
  }

  if (action === 'extractAttribute') {
    return (
      <>
        <Input
          placeholder='Attribute name'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'extractAttribute', e.target.value)}
        />
      </>
    );
  }

  if (['waitForPageLoad', 'waitForFullLoad'].includes(action)) {
    return (
      <>
        <Input
          type='number'
          placeholder='Timeout (ms)'
          value={value || ''}
          onChange={(e) => updateStep(idx, action, Number(e.target.value))}
        />
      </>
    );
  }

  if (action === 'executeJavaScript') {
    return (
      <>
        <Input
          placeholder='JS code'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'executeJavaScript', e.target.value)}
        />
      </>
    );
  }

  if (action === 'inputText') {
    return (
      <>
        <Input
          placeholder='Text to input'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'inputText', e.target.value)}
        />
      </>
    );
  }

  if (['waitForXpathToDisappear', 'waitForCssToDisappear'].includes(action)) {
    return (
      <>
        <Input
          placeholder={placeholder || 'CSS selector or XPath'}
          value={value || ''}
          onChange={(e) => updateStep(idx, action, e.target.value)}
        />
      </>
    );
  }

  if (action === 'getRequest') {
    return (
      <div className='space-y-2'>
        <Input
          placeholder='URL'
          value={value?.url || ''}
          onChange={(e) =>
            updateStep(idx, 'getRequest', {
              ...value,
              url: e.target.value,
            })
          }
        />
        <div className='flex items-center space-x-2'>
          <Switch
            id='get-return-json'
            checked={value?.options.returnJson ?? true}
            className='data-[state=checked]:bg-primary'
            aria-label='Wait for complete page load'
            aria-checked={value?.options.returnJson}
            onClick={() =>
              updateStep(idx, action, {
                ...value,
                options: { ...value?.options, returnJson: !value?.options.returnJson },
              })
            }
          />
          <Label htmlFor='get-return-json'>Return JSON</Label>
        </div>
        <div className='grid w-full gap-3'>
          <Label htmlFor='message'>headers</Label>
          <Textarea
            placeholder='Type your message here.'
            id='message'
            value={JSON.stringify(value?.options.headers || {})}
            onChange={(e) => {
              try {
                updateStep(idx, 'getRequest', {
                  ...value,
                  options: { ...value?.options, headers: e.target.value },
                });
              } catch {
                // ignore JSON errors
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (action === 'postRequest') {
    return (
      <div className='space-y-2'>
        <Input
          placeholder='URL'
          value={value?.url || ''}
          onChange={(e) =>
            updateStep(idx, 'postRequest', {
              ...value,
              url: e.target.value,
            })
          }
        />
        <Input
          placeholder='Options JSON'
          value={JSON.stringify(value?.options || {})}
          onChange={(e) => {
            try {
              updateStep(idx, 'postRequest', {
                ...value,
                options: JSON.parse(e.target.value),
              });
            } catch {
              // ignore JSON errors
            }
          }}
        />
      </div>
    );
  }
  if (action === 'extractPDF') {
    return (
      <>
        <div className='flex items-center space-x-2'>
          <Switch
            id={idx}
            checked={value?.usingUrl ?? false}
            className='data-[state=checked]:bg-primary'
            aria-label='Wait for complete page load'
            aria-checked={value?.usingUrl}
            onClick={() =>
              updateStep(idx, action, {
                ...value,
                usingUrl: !value?.usingUrl,
              })
            }
          />
          <Label htmlFor={idx}>Using link</Label>
        </div>
        {!!value?.usingUrl ? (
          <Input
            placeholder={placeholder?.options?.url}
            value={value?.options?.url || ''}
            onChange={(e) => {
              updateStep(idx, action, {
                ...value,
                options: { ...value.options, url: e.target.value },
              });
            }}
          />
        ) : (
          <div className='grid w-full max-w-sm items-center gap-3'>
            <Label htmlFor={`pdf-${idx}`}>Upload PDF</Label>
            <Input id={`pdf-${idx}`} type='file' accept='application/pdf' />
          </div>
        )}
        <Select
          value={value?.options?.extract || 'text'}
          onValueChange={(extract) =>
            updateStep(idx, action, {
              ...value,
              options: { ...(value?.options || {}), extract },
            })
          }
        >
          <SelectTrigger className='w-72'>
            <SelectValue placeholder='Select what to extract' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='text'>Text</SelectItem>
            <SelectItem value='table'>Table</SelectItem>
            <SelectItem value='images'>Images</SelectItem>
          </SelectContent>
        </Select>
      </>
    );
  }
  return null;
}
