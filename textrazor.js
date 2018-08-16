#!/usr/bin/env node
const configed = require('dotenv').config();

// output colors
// https://www.npmjs.com/package/colors
const colors = require('colors/safe');

// file system
const fs = require('fs');

// node.js command-line interfaces made easy
// https://www.npmjs.com/package/commander
const program = require('commander');

const QueueProcessor = require('@jasonbelmonti/queue-processor');
const analyze = require('./textrazor-sdk');

const NUM_PROCESSORS = 2;

// wtf
function writeJSONToFile(jsonData, path) {
  fs.writeFileSync(path, jsonData, 'utf8');
}

class TextRazor {
  constructor(program) {
    // https://www.textrazor.com/docs/rest#analysis
    this._registerAnalyze(program);
  }

  _registerAnalyze(program) {
    program
    .command('analyze')
    .option('-t, --text [text]', 'Content to analyze')
    .option('-u, --urls [urls]', 'A list of comma-separated urls to extract and analyze', val => val.split(','))
    .option('-e, --extractors <extractors>', 'A list of comma-separated extractors')
    .option('-w, --write [path]', 'Save the result to [path]')
    .action((options) => {
      const {
        text,
        urls,
        extractors,
        write:path
      } = options;

      if (text === undefined && urls === undefined) {
        console.error(colors.red('Missing required parameters! Supply either content or urls'));
        process.exit(1);
      } else if (text) {
        this._analyzeText(text, extractors, path);
      } else if(urls && urls.length > 0) {
        if(urls.length === 1) {
          this._analyzeUrl(urls[0], extractors, path);
        } else {
          this._analyzeUrlList(urls, extractors, path);
        }
      }
    });
  }

  _analyze(analysisOptions) {
    const promise = new Promise((resolve, reject) => {
      analyze(analysisOptions).then((rawResponse) => {
        resolve(rawResponse);
      })
      .catch((e) => {
        console.log(colors.red(e));
        reject(e);
      });
    });

    return promise;
  }

  _analyzeText(text, extractors, path) {
    this._analyze({ extractors, text }).then((result) => {
      if(path) {
        this._writeToJSON(result, path, text);
      }
    });
  }

  _analyzeUrl(url, extractors, path) {
    this._analyze({ extractors, url }).then((result) => {
      if(path) {
        this._writeToJSON(result, path, url);
      }
    });
  }

  _analyzeUrlList(urls, extractors, path) {
    for(let i = 0; i < NUM_PROCESSORS; i ++) {
      const processor = new QueueProcessor(urls, `textrazor_${i}`, { path });
      processor.process(
        (url) => {
          return this._analyze({ extractors, url });
        },
        this._onQueueSuccess.bind(this),
        this._onQueueError.bind(this),
        this._onQueueComplete.bind(this)
      );
    }
  }

  _writeToJSON(result, path, urlOrText) {
    if(path) {
      // make the directory if it doesn't exist
      if (!fs.existsSync(path)){
        fs.mkdirSync(path);
      }

      writeJSONToFile(result, `${path}/${encodeURIComponent(urlOrText)}.json`);
    }
  }

  _onQueueSuccess(result, url, { path }) {
    console.log(colors.green(`✅ ${url}`));

    if (path) {
      this._writeToJSON(result, path, url);
      console.log(colors.green(`saved analysis to ${path}`));
    }

  }

  _onQueueError(error) {
    console.log(colors.red.bold('⚠︎ fail ⚠︎'));
    console.log(colors.red(error));
  }

  _onQueueComplete(queue) {
    console.log(colors.green(`${queue.name}`))
    console.log(colors.gray(`-------------`))

    // success total
    console.log(colors.green.bold(`✅ ${queue.counts.success}`))

    // error total
    let color = queue.counts.error > 0 ? 'red' : 'gray';
    console.log(colors[color](`❌ ${queue.counts.error}`));
  }
}

// configuration
const { version } = require('./package.json');
program.version(version);

const textrazor = new TextRazor(program);
program.parse(process.argv);

// export an instantiated singleton
module.exports = textrazor;