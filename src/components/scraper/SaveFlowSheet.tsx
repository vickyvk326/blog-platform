import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { SaveIcon } from 'lucide-react';
export default function SaveFlowSheet({
  showSheet,
  setShowSheet,
  name,
  setName,
  handleSave,
}: {
  showSheet: boolean;
  setShowSheet(arg: boolean): void;
  name: string;
  setName: (name: string) => void;
  handleSave: () => void;
}) {
  return (
    <Sheet open={showSheet} onOpenChange={setShowSheet}>
      <SheetTrigger asChild onClick={() => setShowSheet(true)}>
        <Button variant='outline'>
          <SaveIcon size='icon' />
          Save
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Save flow</SheetTitle>
          <SheetDescription>Save flow once and load it again from the saved flows.</SheetDescription>
        </SheetHeader>
        <div className='grid flex-1 auto-rows-min gap-6 px-4'>
          <div className='grid gap-3'>
            <Label htmlFor='flow-name-input'>Name</Label>
            <Input id='flow-name-input' placeholder='Flow name' value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <SheetFooter>
          <Button type='submit' onClick={handleSave}>
            Create new flow
          </Button>
          <SheetClose asChild>
            <Button variant='outline' onClick={() => setShowSheet(true)}>
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
