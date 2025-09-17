// app/automation/page.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import ExtractedTable from '@/components/scraper/ExtractedTable';
import { ACTIONS, ACTIONS_LABELS, ACTION_RULES, Action, defaultSteps, labelledAction } from '@/constants/scraper/flow';
import { SavedFlow, deleteFlow, getSavedFlows, saveFlow } from '@/lib/storage';
import { bufferToImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AutomationPage() {
  const [steps, setSteps] = useState<labelledAction[]>(defaultSteps);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ step: labelledAction; result?: unknown }[]>([]);

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      {
        label: 'Naviagte to a site',
        description: 'Go to a specific URL to start scraping data from there.',
        action: 'navigateTo' as Action,
        data: {
          url: '',
          waitUntil: 'load',
        },
        placeholder: { url: 'https://example.com', waitUntil: 'load' },
      },
    ]);

  const removeStep = (i: number) => {
    setResults([]);

    const validSteps: labelledAction[] = [];
    for (let j = 0; j < steps.length; j++) {
      if (j === i) continue; // skip the removed step

      const step = steps[j];
      const action = step.action as Action;

      const prevStep = validSteps[validSteps.length - 1];
      const prevAction = prevStep ? prevStep.action : null;

      // If this action has rules and prevAction is not allowed, skip it
      if (ACTION_RULES[action].length > 0 && (!prevAction || !ACTION_RULES[action].includes(prevAction))) {
        continue;
      }

      validSteps.push(step);
    }

    setSteps(validSteps);
  };

  const updateStep = (i: number, action: Action, value: unknown) =>
    setSteps((prev: labelledAction[]) =>
      prev.map((s, idx) =>
        idx === i
          ? {
              action,
              ...ACTIONS_LABELS[action],
              data: value,
            }
          : s,
      ),
    );

  const [error, setError] = useState<string | null>(null);

  const erroRef = useRef<HTMLParagraphElement>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const runAutomation = async () => {
    setResults([]);
    if (steps.length === 0) return;

    try {
      if (steps[0].action !== 'navigateTo') throw new Error('First step must be navigateTo');

      setLoading(true);

      toast('Task created', {
        description: 'Automation started successfully',
        style: {
          background: '#333',
          color: '#fff',
        },
      });

      const res = await fetch('/api/scrape/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || 'Something went wrong');
      }

      const data = await res.json();

      setResults(data.results || []);
      setError(null);
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      toast('Task completed', {
        description: 'Automation completed successfully',
        style: {
          background: '#333',
          color: '#fff',
        },
      });
    } catch (err) {
      setError(String(err));
      console.error(err);
      erroRef.current?.scrollIntoView({ behavior: 'smooth' });
      toast('Task completed', {
        description: 'Automation failed with error',
        style: {
          background: '#333',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const [name, setName] = useState('');

  const [saved, setSaved] = useState<SavedFlow[]>([]);

  useEffect(() => {
    setSaved(getSavedFlows());
  }, []);

  const handleSave = () => {
    if (!name) return alert('Enter a name');
    saveFlow({ name, steps });
    setSaved(getSavedFlows());
    setName('');
  };

  const handleLoad = (flow: SavedFlow) => {
    setSteps(flow.steps);
  };

  const handleDelete = (flowName: string) => {
    deleteFlow(flowName);
    setSaved(getSavedFlows());
  };

  return (
    <div className='container mx-auto py-10 max-w-4xl space-y-6'>
      {/* Saved flows */}
      <Card>
        <CardContent>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='item-1'>
              <AccordionTrigger>Saved Flows</AccordionTrigger>
              <AccordionContent>
                {saved.length === 0 && <p className='text-sm text-muted-foreground'>No saved flows</p>}
                {saved.map((flow) => (
                  <div key={flow.name} className='flex items-center justify-between border rounded p-2 my-2'>
                    <span className='font-medium'>{flow.name}</span>
                    <div className='flex gap-2'>
                      <Button variant='secondary' size='sm' onClick={() => handleLoad(flow)}>
                        Load
                      </Button>
                      <ConfirmationModal text='Delete' onConfirm={handleDelete} params={[flow.name]} />
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Create a new flow */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl'>Create a new automation flow</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex justify-between mb-2'>
            <Label className='text-lg'>Define Steps</Label>
            <Button
              variant={'destructive'}
              onClick={() => {
                setSteps(defaultSteps);
                setResults([]);
                setError(null);
                setName('');
              }}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const prevAction = idx > 0 ? (steps[idx - 1].action as Action) : null;

            // filter valid actions based on rules
            const allowedActions = ACTIONS.filter((a) => {
              if (ACTION_RULES[a].length === 0) return true;
              return prevAction && ACTION_RULES[a].includes(prevAction);
            });

            return (
              <div key={idx} className='border rounded-lg p-4 space-y-4 bg-muted/30'>
                {/* Action Selector */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Label>Step {idx + 1}.</Label>
                    <Select value={step.action} onValueChange={(val) => updateStep(idx, val as Action, '')}>
                      <SelectTrigger className='w-96'>
                        <SelectValue placeholder='Select action' />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedActions.map((a) => (
                          <SelectItem key={a} value={a}>
                            {ACTIONS_LABELS[a].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remove the step */}
                  <Button size='icon' variant='destructive' onClick={() => removeStep(idx)}>
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>

                {/* Actions input handler */}
                <ActionInputHandler
                  action={step.action}
                  value={step.data}
                  placeholder={step.placeholder}
                  description={step.description}
                  idx={idx}
                  updateStep={updateStep}
                />
                {/* Description */}
                <p className='text-sm text-muted-foreground'>{step.description}</p>
              </div>
            );
          })}

          {/* Add more step button */}
          <Button variant='outline' onClick={addStep} className='w-full flex items-center gap-2'>
            <Plus className='w-4 h-4' /> Add Step
          </Button>

          {error && (
            <Card className='border border-red-600'>
              <CardContent>
                <p className='text-red-600 font-medium' ref={erroRef}>
                  {error}
                </p>
              </CardContent>
            </Card>
          )}

          <Button onClick={runAutomation} disabled={loading} className='w-full'>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Run Automation
          </Button>

          {/* Save flow in local storage */}
          <div className='container py-5 space-y-6' ref={resultRef} autoFocus>
            <Card>
              <CardHeader>
                <CardTitle>Save Flow</CardTitle>
              </CardHeader>
              <CardContent className='flex gap-2'>
                <Input placeholder='Flow name' value={name} onChange={(e) => setName(e.target.value)} />
                <Button onClick={handleSave}>Save</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className='container py-10 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              {results.map((res, idx) => {
                const action = res.step.action;
                const input = res.step.data;
                const hasResult = res.result !== undefined;
                return (
                  <div key={idx} className='flex items-start gap-4 border-b pb-4 last:border-b-0'>
                    <div className='flex flex-col items-center'>
                      <div className='w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white font-bold'>
                        {idx + 1}
                      </div>
                      {idx !== results.length - 1 && <div className='w-px flex-1 bg-muted' />}
                    </div>

                    <div className='flex-1 space-y-2 overflow-auto'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-lg'>{res.step.label.toUpperCase()}</span>
                        <CheckCircle2 className='h-5 w-5 text-green-600' />
                      </div>

                      {!!input && (
                        <div className='text-sm text-muted-foreground'>
                          <strong>Value:</strong> <code>{JSON.stringify(input)}</code>
                        </div>
                      )}

                      {hasResult && (
                        <div className='p-2 bg-muted rounded-md text-sm font-mono space-y-2 overflow-x-auto'>
                          {action === 'screenshot' && res.result?.type === 'Buffer' ? (
                            <Image
                              src={bufferToImageUrl(res.result) || ''}
                              width={700}
                              height={500}
                              alt={`screenshot step ${idx + 1}`}
                              className='rounded-lg border shadow-md max-w-full h-auto'
                            />
                          ) : action === 'extractTable' ? (
                            <ExtractedTable data={res.result?.[0] || []} />
                          ) : typeof res.result === 'object' ? (
                            <div className='flex flex-col gap-2'>
                              <strong>Result:</strong> <pre>{JSON.stringify(res.result, null, 2)}</pre>
                            </div>
                          ) : (
                            String(res.result)
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ConfirmationModal({ text = 'delete', onConfirm, params = [] }: any) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={'destructive'}>{text}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure you want to delete this step?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our
            servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(...params)}>Proceed</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActionInputHandler({ action, value, placeholder, updateStep, idx }: any) {
  // Navigate to
  if (action === 'navigateTo') {
    return (
      <div className='space-y-2'>
          <Input
            placeholder={placeholder.url || 'https://example.com'}
            className='w-full'
            value={value?.url || ''}
            onChange={(e) =>
              updateStep(idx, 'navigateTo', {
                ...value,
                url: e.target.value,
              })
            }
          />

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
      </div>
    );
  }

  // Get elements
  if (['getElementByCss', 'getElementByXpath', 'getElementsByCss', 'getElementsByXpath'].includes(action)) {
    return (
      <div className='flex items-center gap-2'>
        <Input
          placeholder={placeholder.locator || 'CSS selector'}
          value={value.locator || ''}
          onChange={(e) => updateStep(idx, 'getElementByCss', { ...value, locator: e.target.value })}
          className='w-72'
        />
        <span>upto</span>
        <Input
          placeholder={placeholder.timeout || 'Timeout in seconds'}
          type='number'
          value={value.timeout || 0}
          onChange={(e) => updateStep(idx, 'getElementByCss', { ...value, timeout: parseInt(e.target.value) })}
          className='w-32'
        />
        <span>seconds</span>
      </div>
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

  if (action === 'waitForPageLoad') {
    return (
      <>
        <Input
          type='number'
          placeholder='Timeout (ms)'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'waitForPageLoad', Number(e.target.value))}
        />
      </>
    );
  }

  if (action === 'waitForFullLoad') {
    return (
      <>
        <Input
          type='number'
          placeholder='Timeout (ms)'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'waitForFullLoad', Number(e.target.value))}
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

  if (action === 'waitForXpathToDisappear') {
    return (
      <>
        <Input
          placeholder='Xpath selector'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'waitForXpathToDisappear', e.target.value)}
        />
      </>
    );
  }

  if (action === 'waitForCssToDisappear') {
    return (
      <>
        <Input
          placeholder='CSS selector'
          value={value || ''}
          onChange={(e) => updateStep(idx, 'waitForCssToDisappear', e.target.value)}
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
        <Input
          placeholder='Options JSON'
          value={JSON.stringify(value?.options || {})}
          onChange={(e) => {
            try {
              updateStep(idx, 'getRequest', {
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
  return null;
}
