module.exports = function (config) {
    config.set({
        basePath: '../../../',
        frameworks: ['mocha', 'chai', 'webpack'],
        plugins: [
            'karma-*',
            '@*/karma-*',
        ],
        files: [
            { pattern: 'test/unit/test/streaming/streaming.text.IntervalTree.js', watched: true },
            { pattern: 'src/**/*.js', watched: false, included: false, nocache: true },
            { pattern: 'test/unit/data/**/*', watched: false, included: false, served: true }
        ],
        exclude: [],
        client: {
            useIframe: false,
            mocha: {
                timeout: 90000,
                grep: 'IntervalTree'
            }
        },
        preprocessors: {
            'test/unit/**/*.js': ['webpack'],
        },
        reporters: ['mocha'],
        webpack: {
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: {
                                    plugins: ['istanbul']
                                }
                            }
                        ]
                    }
                ]
            },
            mode: 'development',
            cache: false,
            resolve: {
                fallback: {
                    stream: require.resolve('stream-browserify'),
                    timers: require.resolve('timers-browserify'),
                },
            },
        },
        port: 9999,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['FirefoxHeadless'],
        singleRun: false,
        concurrency: 1
    })
} 