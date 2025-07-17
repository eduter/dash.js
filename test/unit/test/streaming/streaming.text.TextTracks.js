import TextTracks from '../../../../src/streaming/text/TextTracks.js';
import EventBus from '../../../../src/core/EventBus.js';
import Events from '../../../../src/core/events/Events.js';
import MediaPlayerEvents from '../../../../src/streaming/MediaPlayerEvents.js';
import VoHelper from '../../helpers/VOHelper.js';
import VideoModelMock from '../../mocks/VideoModelMock.js';
import Settings from '../../../../src/core/Settings.js';

const SUBTITLE_DATA = 'subtitle lign 1';
import chai from 'chai';
import sinon from 'sinon';
const expect = chai.expect;
const context = {};
const eventBus = EventBus(context).getInstance();

describe('TextTracks', function () {

    const voHelper = new VoHelper();
    const streamInfo = voHelper.getDummyStreamInfo();
    const settings = Settings(context).getInstance();
    let textTracks;
    let videoModelMock;

    beforeEach(function () {
    });

    afterEach(function () {
        settings.reset();
    });

    beforeEach(function () {
        videoModelMock = new VideoModelMock();
        textTracks = TextTracks(context).create({
            videoModel: videoModelMock,
            streamInfo,
            settings
        });
        textTracks.initialize();
    });

    afterEach(function () {
        textTracks.deleteAllTextTracks();
    });

    describe('Method getTrackIdxForId', function () {
        it('should return -1 if getTrackIdxForId is called but textTrackQueue is empty', function () {
            const trackId = textTracks.getTrackIdxForId(0);

            expect(trackId).to.equal(-1); // jshint ignore:line
        });
    });

    describe('Method addTextTrackInfo', function () {
        it('should trigger TEXT_TRACK_ADDED and TEXT_TRACKS_QUEUE_INITIALIZED events when a call to addTextTrackInfo function is made', function () {
            const spyTrackAdded = sinon.spy();
            const spyTracksQueueInit = sinon.spy();

            eventBus.on(MediaPlayerEvents.TEXT_TRACK_ADDED, spyTrackAdded);
            eventBus.on(Events.TEXT_TRACKS_QUEUE_INITIALIZED, spyTracksQueueInit);

            textTracks.addTextTrackInfo({
                index: 0,
                kind: 'subtitles',
                label: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            const currrentTrackIdx = textTracks.getCurrentTrackIdx();
            expect(currrentTrackIdx).to.equal(0); // jshint ignore:line
            
            // Check if spies were called
            expect(spyTrackAdded.called).to.be.true;
            expect(spyTracksQueueInit.called).to.be.true;

            eventBus.off(MediaPlayerEvents.TEXT_TRACK_ADDED, spyTrackAdded);
            eventBus.off(Events.TEXT_TRACKS_QUEUE_INITIALIZED, spyTracksQueueInit);
        });
    });

    describe('Method addCaptions', function () {
        it('should call addCue function when a call to addCaptions is made', function () {
            textTracks.addTextTrackInfo({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            textTracks.addCaptions(0, 0, [{type: 'noHtml', data: SUBTITLE_DATA, start: 0, end: 2}]);
            
            // Update the TextTrack window so that the test cue is added to the TextTrack
            textTracks.updateTextTrackWindow(0, 0, 30);

            expect(videoModelMock.getCurrentCue(track).text).to.equal(SUBTITLE_DATA);
        });

        it('should eliminate duplicates', function () {
            textTracks.addTextTrackInfo({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            textTracks.addCaptions(0, 0, [
                {type: 'noHtml', data: 'unique cue', start: 0, end: 2},
                {type: 'noHtml', data: 'duplicated cue', start: 2, end: 4},
                {type: 'noHtml', data: 'duplicated cue', start: 2, end: 4},
            ]);

            textTracks.addCaptions(0, 0, [
                {type: 'noHtml', data: 'duplicated cue', start: 2, end: 4},
                {type: 'noHtml', data: 'another unique cue', start: 4, end: 6},
            ]);

            // Update the TextTrack window so that all test cues are added to the TextTrack
            textTracks.updateTextTrackWindow(0, 0, 30);

            expect(track.cues.length).to.equal(3);
        });

        it('should support multiple cues with same timing, but different text', function () {
            textTracks.addTextTrackInfo({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            const cues = [
                {type: 'noHtml', data: 'First cue', start: 0, end: 2},
                {type: 'noHtml', data: 'Second cue', start: 0, end: 2}
            ];

            textTracks.addCaptions(0, 0, cues);
            
            // Update the TextTrack window so that all test cues are added to the TextTrack
            textTracks.updateTextTrackWindow(0, 0, 30);

            const allCues = track.cues
            expect(allCues.length).to.equal(2);
            expect(allCues[0].text).to.equal('First cue');
            expect(allCues[1].text).to.equal('Second cue');
            expect(allCues[0].cueID).to.not.equal(allCues[1].cueID);
        });

        it('should implement virtual scrolling - only add cues in window to TextTrack', function () {
            textTracks.addTextTrackInfo({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            // Add cues at different times
            const cues = [
                {type: 'noHtml', data: 'Cue at 0s', start: 0, end: 2},
                {type: 'noHtml', data: 'Cue at 10s', start: 10, end: 12},
                {type: 'noHtml', data: 'Cue at 20s', start: 20, end: 22},
                {type: 'noHtml', data: 'Cue at 50s', start: 50, end: 52}
            ];

            textTracks.addCaptions(0, 0, cues);
            
            // Update window at time 0 - should only show cues around 0s
            textTracks.updateTextTrackWindow(0, 0);
            expect(track.cues.length).to.equal(1);
            expect(track.cues[0].text).to.equal('Cue at 0s');
            
            // Update window at time 15 - should only show cues around 15s
            textTracks.updateTextTrackWindow(0, 15);
            expect(track.cues.length).to.equal(1);
            expect(track.cues[0].text).to.equal('Cue at 10s');
            
            // Update window at time 25 - should only show cues around 25s
            textTracks.updateTextTrackWindow(0, 25);
            expect(track.cues.length).to.equal(1);
            expect(track.cues[0].text).to.equal('Cue at 20s');
            
            // Update window at time 55 - should only show cues around 55s
            textTracks.updateTextTrackWindow(0, 55);
            expect(track.cues.length).to.equal(1);
            expect(track.cues[0].text).to.equal('Cue at 50s');
        });

        it('should use interval-based updates to optimize performance', function () {
            textTracks.addTextTrackInfo({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            // Add a cue
            const cues = [
                {type: 'noHtml', data: 'Test cue', start: 0, end: 10}
            ];

            textTracks.addCaptions(0, 0, cues);
            
            // First update should work
            textTracks.updateTextTrackWindow(0, 5);
            expect(track.cues.length).to.equal(1);
            
            // Clear the track for testing
            while (track.cues.length > 0) {
                track.removeCue(track.cues[0]);
            }
            
            // Second update within interval should be skipped (no cues added)
            textTracks.updateTextTrackWindow(0, 5);
            expect(track.cues.length).to.equal(0);
            
            // Force update should work
            textTracks.updateTextTrackWindow(0, 5, true);
            expect(track.cues.length).to.equal(1);
        });
    });
});
