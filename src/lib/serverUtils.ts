'use server';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PythonShell } from 'python-shell';

export async function runPythonScript(script: string, args: string[]) {
  console.log(`python ${script} ${args.join(' ')}`);
  const result = await PythonShell.run(script, { args });
  console.log(result);
  return result;
}

export async function downloadPDF(url: string, downloadsPath: string) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer', // ensures we get raw binary
  });

  if (response.status !== 200) {
    throw new Error(`Failed to download PDF from ${url} (status: ${response.status})`);
  }

  // Ensure downloads folder exists
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  // Generate a unique file name
  const uniqueName = `pdf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.pdf`;
  const outputPath = path.join(downloadsPath, uniqueName);

  // Save the PDF
  fs.writeFileSync(outputPath, response.data);

  console.log(`PDF saved to ${outputPath}`);
  return outputPath;
}
