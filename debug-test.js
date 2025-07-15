import { IntervalTree } from './src/streaming/text/IntervalTree.js';

// Simple test to debug the issue
const tree = new IntervalTree();

// Test 1: Duplicate detection
console.log('=== Testing duplicate detection ===');
const cue1 = { startTime: 0, endTime: 2, text: 'Test cue' };
const cue2 = { startTime: 0, endTime: 2, text: 'Test cue' };

console.log('cue1 === cue2:', cue1 === cue2);
console.log('cue1.startTime === cue2.startTime:', cue1.startTime === cue2.startTime);
console.log('cue1.endTime === cue2.endTime:', cue1.endTime === cue2.endTime);
console.log('cue1.text === cue2.text:', cue1.text === cue2.text);

tree.addCue(cue1);
console.log('After adding first cue, size:', tree.getSize());
console.log('All cues:', tree.getAllCues().map(c => c.text));

tree.addCue(cue2);
console.log('After adding second cue, size:', tree.getSize());
console.log('All cues:', tree.getAllCues().map(c => c.text));

// Test 2: Range queries
console.log('\n=== Testing range queries ===');
tree.clear();

const cues = [
    { startTime: 0, endTime: 2, text: 'First cue' },
    { startTime: 2, endTime: 4, text: 'Second cue' },
    { startTime: 4, endTime: 6, text: 'Third cue' }
];

cues.forEach(cue => tree.addCue(cue));
console.log('Added cues, size:', tree.getSize());

const results = tree.findCuesInRange(2, 4);
console.log('Range query [2,4] returned:', results.length, 'cues');
results.forEach(cue => console.log('  -', cue.text, `(${cue.startTime}-${cue.endTime})`));

const pointResults = tree.findCuesInRange(2, 2);
console.log('Point query [2,2] returned:', pointResults.length, 'cues');
pointResults.forEach(cue => console.log('  -', cue.text, `(${cue.startTime}-${cue.endTime})`));

// Test 3: Check what's actually in the tree
console.log('\n=== Tree contents ===');
const allCues = tree.getAllCues();
console.log('All cues in tree:');
allCues.forEach(cue => console.log('  -', cue.text, `(${cue.startTime}-${cue.endTime})`)); 