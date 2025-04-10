import { exec } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Using sudo requires NOPASSWD configuration in sudoers
    exec('sudo shutdown -h now', (error, stdout, stderr) => {
      if (error) {
        console.error(`Shutdown error: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`Shutdown stderr: ${stderr}`);
        return;
      }
      console.log(`Shutdown stdout: ${stdout}`);
    });

    return NextResponse.json({ message: 'Shutdown initiated' });
  } catch (error) {
    console.error('Shutdown failed:', error);
    return NextResponse.json({ error: 'Failed to initiate shutdown' }, { status: 500 });
  }
}
