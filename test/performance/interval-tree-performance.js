import VTTParser from '../../src/streaming/utils/VTTParser.js';
import { IntervalTree } from '../../src/streaming/text/IntervalTree.js';
import fs from 'fs';
import path from 'path';

const NUM_ITERATIONS = 10000;

function formatTime(ms) {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(3)}μs`;
    } else if (ms < 1000) {
        return `${ms.toFixed(3)}ms`;
    } else {
        return `${(ms / 1000).toFixed(3)}s`;
    }
}

function getTreeHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(getTreeHeight(node.left), getTreeHeight(node.right));
}

function measureMemoryUsage() {
    const used = process.memoryUsage();
    return {
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024)
    };
}

async function runPerformanceTest() {
    console.log('=== Interval Tree Performance Test ===\n');

    // Read the VTT file
    const vttPath = path.join(process.cwd(), 'test/unit/data/subtitles/very-long.vtt');
    console.log(`Reading VTT file: ${vttPath}`);

    if (!fs.existsSync(vttPath)) {
        console.error('❌ VTT file not found. Please place very-long.vtt in test/unit/data/subtitles/');
        return;
    }

    const vttData = fs.readFileSync(vttPath, 'utf8');
    console.log(`File size: ${(vttData.length / 1024).toFixed(2)}KB\n`);

    // Parse VTT
    console.log('1. Parsing VTT file...');
    const startParse = Date.now();
    const vttParser = VTTParser({}).getInstance();
    const parsedCues = vttParser.parse(vttData);
    const parseTime = Date.now() - startParse;

    console.log(`   Parsed ${parsedCues.length} cues in ${formatTime(parseTime)}`);
    console.log(`   Parse rate: ${(parsedCues.length / parseTime * 1000).toFixed(1)} cues/second\n`);

    // Convert to interval tree format
    console.log('2. Converting cues to interval tree format...');
    const startConvert = Date.now();
    const intervalCues = parsedCues.map(cue => ({
        startTime: cue.start,
        endTime: cue.end,
        text: cue.data
    }));
    const convertTime = Date.now() - startConvert;
    console.log(`   Converted in ${formatTime(convertTime)}\n`);

    // Create interval tree and add cues
    console.log('3. Building interval tree...');
    const tree = new IntervalTree();
    const startBuild = Date.now();

    for (const cue of intervalCues) {
        tree.addCue(cue);
    }

    const buildTime = Date.now() - startBuild;
    const treeSize = tree.getSize();
    const treeHeight = getTreeHeight(tree.root);

    console.log(`   Added ${treeSize} cues in ${formatTime(buildTime)}`);
    console.log(`   Tree size: ${treeSize}`);
    console.log(`   Tree height: ${treeHeight}`);
    console.log(`   Build rate: ${(treeSize / buildTime * 1000).toFixed(1)} cues/second`);

    const memory = measureMemoryUsage();
    if (memory) {
        console.log(`   Memory usage: ${memory.heapUsed}MB heap, ${memory.heapTotal}MB total`);
    }
    console.log();

    // Performance tests
    console.log('4. Performance tests...\n');

    // Test 1: Find cues at specific times (with more iterations)
    console.log('   Test 1: Find cues at specific times');
    const testTimes = [0, 30, 60, 120, 300, 600, 1200, 5000];
    for (const time of testTimes) {
        const start = Date.now();
        // Run multiple iterations to get measurable time
        for (let i = 0; i < NUM_ITERATIONS; i++) {
            tree.findCuesAtTime(time);
        }
        const duration = Date.now() - start;
        const cues = tree.findCuesAtTime(time);
        console.log(`     Time ${time}s: ${cues.length} cues in ${formatTime(duration / NUM_ITERATIONS)} per query`);
    }
    console.log();

    // Test 2: Find cues in ranges (with more iterations)
    console.log('   Test 2: Find cues in ranges');
    const testRanges = [
        [0, 30],
        [60, 90],
        [300, 330],
        [600, 630],
        [1200, 1230]
    ];
    for (const [start, end] of testRanges) {
        const startTime = Date.now();
        // Run multiple iterations to get measurable time
        for (let i = 0; i < NUM_ITERATIONS; i++) {
            tree.findCuesInRange(start, end);
        }
        const duration = Date.now() - startTime;
        const cues = tree.findCuesInRange(start, end);
        console.log(`     Range [${start}, ${end}]: ${cues.length} cues in ${formatTime(duration / NUM_ITERATIONS)} per query`);
    }
    console.log();

    // Test 3: Find cues in windows (with more iterations)
    console.log('   Test 3: Find cues in windows');
    const testWindows = [
        [30, 10],
        [60, 15],
        [300, 20],
        [600, 30]
    ];
    for (const [currentTime, windowSize] of testWindows) {
        const startTime = Date.now();
        // Run multiple iterations to get measurable time
        for (let i = 0; i < NUM_ITERATIONS; i++) {
            tree.findCuesInWindow(currentTime, windowSize);
        }
        const duration = Date.now() - startTime;
        const cues = tree.findCuesInWindow(currentTime, windowSize);
        console.log(`     Window at ${currentTime}s ±${windowSize}s: ${cues.length} cues in ${formatTime(duration / NUM_ITERATIONS)} per query`);
    }
    console.log();

    // Test 4: Sequential time queries (simulating playback) - more intensive
    console.log('   Test 4: Sequential time queries (simulating playback)');
    const playbackStart = Date.now();
    let totalCues = 0;
    // Query every second for 20 minutes instead of 5 minutes
    for (let time = 0; time < 1200; time += 1) {
        const cues = tree.findCuesAtTime(time);
        totalCues += cues.length;
    }
    const playbackTime = Date.now() - playbackStart;
    console.log(`     Queried 1200 time points in ${formatTime(playbackTime)}`);
    console.log(`     Average: ${(playbackTime / 1200).toFixed(2)}ms per query`);
    console.log(`     Total cues found: ${totalCues}`);
    console.log();

    // Test 5: Memory usage after operations
    console.log('   Test 5: Memory usage after operations');
    const finalMemory = measureMemoryUsage();
    console.log(`     Final memory: ${finalMemory.heapUsed}MB heap, ${finalMemory.heapTotal}MB total`);

    console.log('\n=== Performance Test Complete ===');
}

// Run the test
runPerformanceTest().catch(console.error);
