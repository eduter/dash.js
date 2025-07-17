import TextController from '../../../../src/streaming/text/TextController.js';
import VoHelper from '../../helpers/VOHelper.js';
import Constants from '../../../../src/streaming/constants/Constants.js';
import VideoModelMock from '../../mocks/VideoModelMock.js';
import MediaControllerMock from '../../mocks/MediaControllerMock.js';
import BaseURLControllerMock from '../../mocks/BaseURLControllerMock.js';
import AdapterMock from '../../mocks/AdapterMock.js';
import Settings from '../../../../src/core/Settings.js';

import {expect} from 'chai';
import sinon from 'sinon';
const context = {};

describe('TextController', function () {

    let videoModelMock = new VideoModelMock();
    const voHelper = new VoHelper();
    const streamInfo = voHelper.getDummyStreamInfo();
    let mediaControllerMock = new MediaControllerMock();
    let dashAdapterMock = new AdapterMock();
    let baseURLControllerMock = new BaseURLControllerMock();
    const settings = Settings(context).getInstance();
    let textController;

    afterEach(function () {
        settings.reset();
    });

    beforeEach(function () {
        textController = TextController(context).create({
            videoModel: videoModelMock,
            mediaController: mediaControllerMock,
            baseURLController: baseURLControllerMock,
            adapter: dashAdapterMock,
            streamInfo,
            settings
        });

        textController.initialize();

        textController.initializeForStream(streamInfo);

        const mediaInfo = {
            lang: 'ger',
            label: 'ger',
            labels: '',
            roles: ['main'],
            id: 'track1',
            mimeType: 'codecs="stpp',
            isFragmented: true,
            isEmbedded: false
        };
        const mediaInfo2 = {
            lang: 'eng',
            label: 'eng',
            labels: '',
            roles: ['alternate'],
            id: 'track2',
            mimeType: 'codecs="stpp',
            isFragmented: true,
            isEmbedded: false
        };

        textController.addMediaInfosToBuffer(streamInfo, [mediaInfo, mediaInfo2], mediaInfo.mimeType, null);
        textController.createTracks(streamInfo);
    });

    afterEach(function () {
        textController.reset();
    });


    describe('Method enableText', function () {

        it('should not enable text if enable is not a boolean', function () {

            let textEnabled = textController.isTextEnabled();

            expect(textController.enableText.bind(textController, -1)).to.throw(Constants.BAD_ARGUMENT_ERROR);
            expect(textController.isTextEnabled()).to.equal(textEnabled); // jshint ignore:line

            expect(textController.enableText.bind(textController)).to.throw(Constants.BAD_ARGUMENT_ERROR);
            expect(textController.isTextEnabled()).to.equal(textEnabled); // jshint ignore:line

            expect(textController.enableText.bind(textController, 'toto')).to.throw(Constants.BAD_ARGUMENT_ERROR);
            expect(textController.isTextEnabled()).to.equal(textEnabled); // jshint ignore:line
        });

        it('should do nothing trying to enable/disbale text if text is already enabled/disbaled', function () {

            let textEnabled = textController.isTextEnabled();

            textController.enableText(streamInfo.id, textEnabled);
            expect(textController.isTextEnabled()).to.equal(textEnabled); // jshint ignore:line
        });
    });

    describe('Method setTextTrack', function () {

        it('should set text tracks - no track showing', function () {
            videoModelMock.tracks = [{
                id: 'track1'
            }, {
                id: 'track2'
            }];

            textController.setTextTrack(streamInfo.id, -1);
            expect(textController.getAllTracksAreDisabled()).to.be.true; // jshint ignore:line
        });

        it('should set text tracks - one track showing', function () {
            videoModelMock.tracks = [{
                id: 'track1',
                mode: 'showing'
            }, {
                id: 'track2'
            }];

            textController.setTextTrack(streamInfo.id, 0);
            expect(textController.getAllTracksAreDisabled()).to.be.false; // jshint ignore:line
        });
    });

    describe('Virtual Scrolling Integration', function () {
        it('should update text track window during playback time updates', function () {
            // Mock the text tracks to spy on updateTextTrackWindow
            const mockTextTracks = {
                getTextTrackInfos: () => [{ id: 'track1' }, { id: 'track2' }],
                updateTextTrackWindow: sinon.spy(),
                manualCueProcessing: sinon.spy()
            };
            
            // Replace the textTracks with our mock
            textController.textTracks = { [streamInfo.id]: mockTextTracks };
            
            // Simulate playback time update
            const event = {
                streamId: streamInfo.id,
                time: 15.5
            };
            
            textController._onPlaybackTimeUpdated(event);
            
            // Verify that updateTextTrackWindow was called for each track
            expect(mockTextTracks.updateTextTrackWindow.calledTwice).to.be.true;
            expect(mockTextTracks.updateTextTrackWindow.firstCall.args).to.deep.equal([0, 15.5, 30, false]);
            expect(mockTextTracks.updateTextTrackWindow.secondCall.args).to.deep.equal([1, 15.5, 30, false]);
        });

        it('should update text track window during seeking', function () {
            // Mock the text tracks to spy on updateTextTrackWindow
            const mockTextTracks = {
                getTextTrackInfos: () => [{ id: 'track1' }, { id: 'track2' }],
                updateTextTrackWindow: sinon.spy(),
                disableManualTracks: sinon.spy()
            };
            
            // Replace the textTracks with our mock
            textController.textTracks = { [streamInfo.id]: mockTextTracks };
            
            // Simulate seeking event
            const event = {
                streamId: streamInfo.id,
                seekTime: 25.0
            };
            
            textController._onPlaybackSeeking(event);
            
            // Verify that updateTextTrackWindow was called for each track
            expect(mockTextTracks.updateTextTrackWindow.calledTwice).to.be.true;
            expect(mockTextTracks.updateTextTrackWindow.firstCall.args).to.deep.equal([0, 25.0, 30, true]);
            expect(mockTextTracks.updateTextTrackWindow.secondCall.args).to.deep.equal([1, 25.0, 30, true]);
            expect(mockTextTracks.disableManualTracks.calledOnce).to.be.true;
        });
    });

});
