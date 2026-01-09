#!/usr/bin/env tsx
/**
 * Master seed script for all pSEO content
 * Runs situations, professions, and names seeds
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runScript(name: string, path: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log('='.repeat(60));

  try {
    const { stdout, stderr } = await execAsync(`npx tsx ${path}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error running ${name}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting pSEO Content Seeding\n');

  const scripts = [
    { name: 'Situations', path: 'scripts/seed-situations.ts' },
    { name: 'Professions', path: 'scripts/seed-professions.ts' },
    { name: 'Names', path: 'scripts/seed-names.ts' },
  ];

  const results = [];

  for (const script of scripts) {
    const success = await runScript(script.name, script.path);
    results.push({ name: script.name, success });
  }

  console.log('\n' + '='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });

  const allSuccess = results.every((r) => r.success);

  if (allSuccess) {
    console.log('\n🎉 All pSEO content seeded successfully!');
    console.log('\n📱 Your site now has:');
    console.log('   - 10 Situations (anxiety, fear, hope, etc.)');
    console.log('   - 15 Professions (teachers, nurses, engineers, etc.)');
    console.log('   - 11 Names (John, Mary, David, etc.)');
    console.log('   - 1 Place (Jerusalem)');
    console.log('\n🌐 All home page links should now work!');
  } else {
    console.log('\n⚠️  Some seeds failed. Check errors above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
