import { IntervalTree } from '../../../../src/streaming/text/IntervalTree.js';
import chai from 'chai';
const expect = chai.expect;

describe('IntervalTree', function () {

    let intervalTree;

    beforeEach(function () {
        intervalTree = new IntervalTree();
    });

    afterEach(function () {
        intervalTree.clear();
    });

    describe('Constructor', function () {
        it('should create an empty interval tree', function () {
            expect(intervalTree.getSize()).to.equal(0);
            expect(intervalTree.getAllCues()).to.deep.equal([]);
        });
    });

    describe('Method addCue', function () {
        it('should add a single cue to the tree', function () {
            const cue = {
                startTime: 0,
                endTime: 2,
                text: 'Test cue'
            };

            intervalTree.addCue(cue);

            expect(intervalTree.getSize()).to.equal(1);
            const allCues = intervalTree.getAllCues();
            expect(allCues).to.have.length(1);
            expect(allCues[0]).to.equal(cue);
        });

        it('should add multiple cues in order', function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' },
                { startTime: 4, endTime: 6, text: 'Third cue' }
            ];

            cues.forEach(cue => intervalTree.addCue(cue));

            expect(intervalTree.getSize()).to.equal(3);
            const allCues = intervalTree.getAllCues();
            expect(allCues).to.have.length(3);
            expect(allCues[0].text).to.equal('First cue');
            expect(allCues[1].text).to.equal('Second cue');
            expect(allCues[2].text).to.equal('Third cue');
        });

        it('should add multiple cues out of order', function () {
            const cues = [
                { startTime: 4, endTime: 6, text: 'Third cue' },
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' }
            ];

            cues.forEach(cue => intervalTree.addCue(cue));

            expect(intervalTree.getSize()).to.equal(3);
            const allCues = intervalTree.getAllCues();
            expect(allCues).to.have.length(3);
            // Should be sorted by start time
            expect(allCues[0].text).to.equal('First cue');
            expect(allCues[1].text).to.equal('Second cue');
            expect(allCues[2].text).to.equal('Third cue');
        });

        it('should handle overlapping cues', function () {
            const cues = [
                { startTime: 0, endTime: 4, text: 'Long cue' },
                { startTime: 2, endTime: 3, text: 'Overlapping cue' },
                { startTime: 1, endTime: 5, text: 'Another overlapping cue' }
            ];

            cues.forEach(cue => intervalTree.addCue(cue));

            expect(intervalTree.getSize()).to.equal(3);
        });

        it('should handle cues with same start time but different end times', function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'Short cue' },
                { startTime: 0, endTime: 4, text: 'Long cue' }
            ];

            cues.forEach(cue => intervalTree.addCue(cue));

            expect(intervalTree.getSize()).to.equal(2);
            const allCues = intervalTree.getAllCues();
            expect(allCues[0].text).to.equal('Short cue'); // Should come first (shorter end time)
            expect(allCues[1].text).to.equal('Long cue');
        });

        it('should handle cues with same timing but different text', function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 0, endTime: 2, text: 'Second cue' }
            ];

            cues.forEach(cue => intervalTree.addCue(cue));

            expect(intervalTree.getSize()).to.equal(2);
            const allCues = intervalTree.getAllCues();
            expect(allCues[0].text).to.equal('First cue'); // Alphabetical order
            expect(allCues[1].text).to.equal('Second cue');
        });

        it('should skip duplicate cues with identical timing and text', function () {
            const cue = { startTime: 0, endTime: 2, text: 'Test cue' };

            intervalTree.addCue(cue);
            intervalTree.addCue(cue);

            expect(intervalTree.getSize()).to.equal(1);
        });
    });

    describe('Method hasCue', function () {
        it('should return false for non-existent cue', function () {
            const cue = { startTime: 0, endTime: 2, text: 'Test cue' };
            expect(intervalTree.hasCue(cue)).to.be.false;
        });

        it('should return true for existing cue', function () {
            const cue = { startTime: 0, endTime: 2, text: 'Test cue' };
            intervalTree.addCue(cue);
            expect(intervalTree.hasCue(cue)).to.be.true;
        });

        it('should return false for cue with same timing but different text', function () {
            const cue1 = { startTime: 0, endTime: 2, text: 'First cue' };
            const cue2 = { startTime: 0, endTime: 2, text: 'Second cue' };

            intervalTree.addCue(cue1);
            expect(intervalTree.hasCue(cue2)).to.be.false;
        });

        it('should return true for identical cues', function () {
            const cue1 = { startTime: 0, endTime: 2, text: 'Test cue' };
            const cue2 = { startTime: 0, endTime: 2, text: 'Test cue' };

            intervalTree.addCue(cue1);
            expect(intervalTree.hasCue(cue2)).to.be.true;
        });

        it('should return false for cue with same start time but different end time', function () {
            const cue1 = { startTime: 0, endTime: 2, text: 'Short cue' };
            const cue2 = { startTime: 0, endTime: 4, text: 'Long cue' };

            intervalTree.addCue(cue1);
            expect(intervalTree.hasCue(cue2)).to.be.false;
        });
    });

    describe('Method findCuesInRange', function () {
        beforeEach(function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' },
                { startTime: 4, endTime: 6, text: 'Third cue' },
                { startTime: 6, endTime: 8, text: 'Fourth cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));
        });

        it('should find cues in exact range', function () {
            const cues = intervalTree.findCuesInRange(2, 4);
            expect(cues).to.have.length(1);
            expect(cues[0].text).to.equal('Second cue');
        });

        it('should find overlapping cues', function () {
            const cues = intervalTree.findCuesInRange(1, 3);
            expect(cues).to.have.length(2);
            expect(cues.some(c => c.text === 'First cue')).to.be.true;
            expect(cues.some(c => c.text === 'Second cue')).to.be.true;
        });

        it('should find multiple overlapping cues', function () {
            const cues = intervalTree.findCuesInRange(1, 5);
            expect(cues).to.have.length(3);
            expect(cues.some(c => c.text === 'First cue')).to.be.true;
            expect(cues.some(c => c.text === 'Second cue')).to.be.true;
            expect(cues.some(c => c.text === 'Third cue')).to.be.true;
        });

        it('should return empty array for non-overlapping range', function () {
            const cues = intervalTree.findCuesInRange(10, 12);
            expect(cues).to.deep.equal([]);
        });

        it('should handle point queries', function () {
            const cues = intervalTree.findCuesInRange(2, 2);
            expect(cues).to.have.length(2);
            expect(cues.some(c => c.text === 'First cue')).to.be.true;
            expect(cues.some(c => c.text === 'Second cue')).to.be.true;
        });

        it('should handle overlapping cues with same start time', function () {
            // Add overlapping cues
            intervalTree.addCue({ startTime: 2, endTime: 5, text: 'Overlapping cue' });

            const cues = intervalTree.findCuesInRange(2, 4);
            expect(cues).to.have.length(2);
            expect(cues.some(c => c.text === 'Second cue')).to.be.true;
            expect(cues.some(c => c.text === 'Overlapping cue')).to.be.true;
        });
    });

    describe('Method findCuesAtTime', function () {
        beforeEach(function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' },
                { startTime: 4, endTime: 6, text: 'Third cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));
        });

        it('should find cue at exact start time', function () {
            const cues = intervalTree.findCuesAtTime(2);
            expect(cues).to.have.length(2);
            expect(cues.some(c => c.text === 'First cue')).to.be.true;
            expect(cues.some(c => c.text === 'Second cue')).to.be.true;
        });

        it('should find cue at middle time', function () {
            const cues = intervalTree.findCuesAtTime(3);
            expect(cues).to.have.length(1);
            expect(cues[0].text).to.equal('Second cue');
        });

        it('should return empty array for time outside all cues', function () {
            const cues = intervalTree.findCuesAtTime(10);
            expect(cues).to.deep.equal([]);
        });
    });

    describe('Method findCuesInWindow', function () {
        beforeEach(function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' },
                { startTime: 4, endTime: 6, text: 'Third cue' },
                { startTime: 6, endTime: 8, text: 'Fourth cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));
        });

        it('should find cues in window around current time', function () {
            const cues = intervalTree.findCuesInWindow(4, 1);
            expect(cues).to.have.length(2);
            expect(cues.some(c => c.text === 'Second cue')).to.be.true;
            expect(cues.some(c => c.text === 'Third cue')).to.be.true;
        });

        it('should handle window at start of timeline', function () {
            const cues = intervalTree.findCuesInWindow(1, 1);
            expect(cues).to.have.length(1);
            expect(cues[0].text).to.equal('First cue');
        });

        it('should handle window at end of timeline', function () {
            const cues = intervalTree.findCuesInWindow(7, 1);
            expect(cues).to.have.length(1);
            expect(cues[0].text).to.equal('Fourth cue');
        });

        it('should handle negative current time', function () {
            const cues = intervalTree.findCuesInWindow(-1, 1);
            expect(cues).to.have.length(1);
            expect(cues[0].text).to.equal('First cue');
        });
    });

    describe('Method getAllCues', function () {
        it('should return empty array for empty tree', function () {
            const cues = intervalTree.getAllCues();
            expect(cues).to.deep.equal([]);
        });

        it('should return all cues in sorted order', function () {
            const cues = [
                { startTime: 4, endTime: 6, text: 'Third cue' },
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));

            const allCues = intervalTree.getAllCues();
            expect(allCues).to.have.length(3);
            expect(allCues[0].text).to.equal('First cue');
            expect(allCues[1].text).to.equal('Second cue');
            expect(allCues[2].text).to.equal('Third cue');
        });

        it('should handle cues with same start time in correct order', function () {
            const cues = [
                { startTime: 0, endTime: 4, text: 'Long cue' },
                { startTime: 0, endTime: 2, text: 'Short cue' },
                { startTime: 0, endTime: 3, text: 'Medium cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));

            const allCues = intervalTree.getAllCues();
            expect(allCues).to.have.length(3);
            expect(allCues[0].text).to.equal('Short cue'); // Shortest end time first
            expect(allCues[1].text).to.equal('Medium cue');
            expect(allCues[2].text).to.equal('Long cue');
        });
    });

    describe('Method getSize', function () {
        it('should return 0 for empty tree', function () {
            expect(intervalTree.getSize()).to.equal(0);
        });

        it('should return correct size after adding cues', function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));

            expect(intervalTree.getSize()).to.equal(2);
        });

        it('should update size after removing cues', function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' },
                { startTime: 4, endTime: 6, text: 'Third cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));

            intervalTree.clear();
            expect(intervalTree.getSize()).to.equal(0);
        });
    });

    describe('Method clear', function () {
        it('should clear all cues from tree', function () {
            const cues = [
                { startTime: 0, endTime: 2, text: 'First cue' },
                { startTime: 2, endTime: 4, text: 'Second cue' }
            ];
            cues.forEach(cue => intervalTree.addCue(cue));

            intervalTree.clear();

            expect(intervalTree.getSize()).to.equal(0);
            expect(intervalTree.getAllCues()).to.deep.equal([]);
        });
    });

    describe('Performance tests', function () {
        it('should handle large number of cues efficiently', function () {
            const numCues = 1000;
            const cues = [];

            for (let i = 0; i < numCues; i++) {
                cues.push({
                    startTime: i * 2,
                    endTime: i * 2 + 1,
                    text: `Cue ${i}`
                });
            }

            // Add cues
            const startTime = Date.now();
            cues.forEach(cue => intervalTree.addCue(cue));
            const addTime = Date.now() - startTime;

            expect(intervalTree.getSize()).to.equal(numCues);
            expect(addTime).to.be.lessThan(1000); // Should complete in under 1 second

            // Find cues in range
            const searchStartTime = Date.now();
            const foundCues = intervalTree.findCuesInRange(100, 200);
            const searchTime = Date.now() - searchStartTime;

            expect(searchTime).to.be.lessThan(100); // Should complete in under 100ms
            expect(foundCues.length).to.be.greaterThan(0);
        });

        it('should handle overlapping cues efficiently', function () {
            const numCues = 100;
            const cues = [];

            // Create overlapping cues
            for (let i = 0; i < numCues; i++) {
                cues.push({
                    startTime: i,
                    endTime: i + 5,
                    text: `Overlapping cue ${i}`
                });
            }

            cues.forEach(cue => intervalTree.addCue(cue));

            // Search for overlapping cues
            const foundCues = intervalTree.findCuesInRange(50, 55);
            expect(foundCues.length).to.be.greaterThan(5); // Should find multiple overlapping cues
        });

        it('should handle cues with same start time efficiently', function () {
            const numCues = 100;
            const cues = [];

            // Create cues with same start time but different end times
            for (let i = 0; i < numCues; i++) {
                cues.push({
                    startTime: 0,
                    endTime: i + 1,
                    text: `Cue ${i}`
                });
            }

            cues.forEach(cue => intervalTree.addCue(cue));

            // Search for cues at start time
            const foundCues = intervalTree.findCuesAtTime(0);
            expect(foundCues.length).to.equal(numCues);
        });
    });
});
