#!/usr/bin/env node

// Enable garbage collection for memory measurements
if (process.argv.includes('--expose-gc')) {
    console.log('Garbage collection enabled for memory measurements');
}

// Run the performance test
import('./test/performance/interval-tree-performance.js').catch(console.error); 