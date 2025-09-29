'use client';

import { flowReqBody, flowResult } from '@/app/api/scrape/flow/route';
import ActionInput from '@/components/scraper/ActionInput';
import DeleteConfirmationModal from '@/components/scraper/DeleteConfirmationModal';
import ExtractedTable from '@/components/scraper/ExtractedTable';
import SaveFlowSheet from '@/components/scraper/SaveFlowSheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import {
  ACTIONS,
  ACTIONS_LABELS,
  ACTION_RULES,
  Action,
  EXAMPLE_FLOWS,
  defaultSteps,
  labelledAction,
} from '@/constants/scraper/flow';
import { SavedFlow, deleteFlow, getSavedFlows, saveFlow } from '@/lib/storage';
import { bufferObj, bufferToImageUrl } from '@/lib/utils';
import { CircleCheckIcon, CircleXIcon, Loader2, Plus, RotateCcw, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function FlowScraper({ user, initialData }) {
  console.log('FlowScraper initialData', initialData);

  const [steps, setSteps] = useState<labelledAction[]>(initialData?.result?.flow?.steps || defaultSteps);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<flowResult[]>(initialData?.result?.result?.result || []);

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
          timeout: 30,
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
              ...(!!value && { data: value }),
            }
          : s,
      ),
    );

  const [error, setError] = useState<string | null>(null);

  const erroRef = useRef<HTMLParagraphElement>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  const runAutomation = async () => {
    setResults([]);
    if (steps.length === 0) return;

    try {
      setLoading(true);

      toast.success('Task created', {
        description: 'Automation started successfully',
        style: {
          background: '#333',
          color: '#fff',
        },
      });

      const res = await fetch('/api/scrape/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, user } as flowReqBody),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || 'Something went wrong');
      }

      const data = await res.json();

      setResults(data.results || []);
      setError(null);
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      toast.success('Task completed', {
        description: 'Automation completed successfully',
      });
    } catch (err) {
      setError(String(err));
      console.error(err);
      erroRef.current?.scrollIntoView({ behavior: 'smooth' });
      toast.error('Task completed', {
        description: 'Automation failed with error',
      });
    } finally {
      setLoading(false);
    }
  };

  const [name, setName] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [saved, setSaved] = useState<SavedFlow[]>([]);

  useEffect(() => {
    setSaved(getSavedFlows());
  }, []);

  const handleReset = () => {
    setSteps(defaultSteps);
    setResults([]);
    setError(null);
    setName('');
  };

  const handleSave = () => {
    if (!name || name.trim().length === 0 || steps.length === 0) return;
    saveFlow({ name, steps });
    setSaved(getSavedFlows());
    setName('');
    setShowSheet(false);
    toast.success('Task completed', {
      description: 'Flow saved successfully',
    });
  };

  const handleLoad = (flow: SavedFlow) => {
    setSteps(flow.steps);
    stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast.success('Task completed', {
      description: 'Flow loaded successfully',
    });
  };

  const handleDelete = (flowName: string, isPromoted?: boolean) => {
    if (isPromoted) return;
    deleteFlow(flowName);
    setSaved(getSavedFlows());
  };

  const displayFlows = [...EXAMPLE_FLOWS, ...saved];

  return (
    <div className='container mx-auto py-10 max-w-4xl space-y-6'>
      {/* Saved flows */}
      <Card className='py-2'>
        <CardContent>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='item-1'>
              <AccordionTrigger>Saved Flows</AccordionTrigger>
              <AccordionContent>
                {displayFlows.length === 0 && <p className='text-sm text-muted-foreground'>No saved flows</p>}
                {displayFlows.map((flow) => (
                  <div key={flow.name} className='flex items-center justify-between border rounded-xl p-2 my-2'>
                    <span className='font-medium'>{flow.name}</span>
                    <div className='flex items-center gap-3'>
                      <Button variant='secondary' onClick={() => handleLoad(flow)}>
                        Load
                      </Button>
                      <DeleteConfirmationModal
                        text='Delete'
                        onConfirm={handleDelete}
                        params={[flow.name, flow.isPromoted]}
                        isDisabled={flow.isPromoted}
                      />
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
          <CardTitle className='text-xl'>
            <h1>Create a new automation flow</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex justify-between mb-2' ref={stepsRef}>
            <Label className='text-lg'>Define Steps</Label>
            <div className='flex items-center gap-2'>
              <SaveFlowSheet
                showSheet={showSheet}
                setShowSheet={setShowSheet}
                name={name}
                setName={setName}
                handleSave={handleSave}
              />
              <Button variant={'destructive'} onClick={handleReset}>
                <RotateCcw />
                Reset
              </Button>
            </div>
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
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col md:flex-row items-center gap-2'>
                    <Label>Step {idx + 1}.</Label>
                    <Select value={step.action} onValueChange={(val) => updateStep(idx, val as Action, null)}>
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
                  <Button
                    size='icon'
                    variant={'ghost'}
                    className='text-red-500 hover:text-red-600'
                    onClick={() => removeStep(idx)}
                  >
                    <XIcon className='w-6 h-6' />
                  </Button>
                </div>

                {/* Actions input handler */}
                <ActionInput
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
              {/* Individual results */}
              {results.map((res, idx) => {
                const hasResult = res.result !== undefined;
                const hasError = res.error !== undefined;
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
                        <span className='font-semibold text-lg'>{res.step?.label?.toUpperCase()}</span>
                        <span className='text-muted-foreground text-xs'>{res.timeTaken.toFixed(2)}s</span>
                        <Badge
                          variant='secondary'
                          className={`text-white ${
                            hasError ? 'bg-red-500 dark:bg-red-600' : 'bg-green-500 dark:bg-green-600'
                          }`}
                        >
                          {hasError ? <CircleXIcon /> : <CircleCheckIcon />}
                          {hasError ? 'failed' : 'success'}
                        </Badge>
                      </div>

                      {!!res.step?.data && (
                        <div className='text-sm text-muted-foreground'>
                          <strong>Value:</strong> <code>{JSON.stringify(res.step?.data)}</code>
                        </div>
                      )}

                      {hasResult && (
                        <div className='rounded-md border p-4 overflow-auto'>
                          {res.step?.action === 'screenshot' && res.result?.[0]?.type === 'Buffer' ? (
                            res.result?.map((screenshot, idx) => (
                              <Image
                                key={idx}
                                src={bufferToImageUrl(screenshot as bufferObj) || ''}
                                width={700}
                                height={300}
                                alt={`screenshot step ${idx + 1}`}
                                className='rounded-lg border shadow-md max-w-full mx-auto'
                              />
                            ))
                          ) : Array.isArray(res.result) && res.result.length ? (
                            Array.isArray(res.result[0]) ? (
                              res.result.map((table, tableIndex) => (
                                <div key={tableIndex} className='my-4 flex flex-col'>
                                  <strong>Table {tableIndex + 1}:</strong>
                                  <ExtractedTable data={table || []} />
                                  {Array.isArray(res.result) && res.result?.length > tableIndex + 1 && (
                                    <Separator className='mt-5' />
                                  )}
                                </div>
                              ))
                            ) : (
                              <ExtractedTable
                                data={res.result || []}
                              />
                            )
                          ) : typeof res.result === 'object' ? (
                            <div className='flex flex-col gap-2'>
                              <strong>Result:</strong>
                              <pre>{JSON.stringify(res.result, null, 2)}</pre>
                            </div>
                          ) : (
                            String(res.result)
                          )}
                        </div>
                      )}

                      {hasError && (
                        <div className='p-2 bg-muted rounded-md text-sm font-mono space-y-2 overflow-x-auto border border-red-600'>
                          {String(res.error)}
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

export default FlowScraper;
