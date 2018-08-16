#!/usr/bin/env node
const configed = require('dotenv').config();

// output colors
// https://www.npmjs.com/package/colors
const colors = require('colors/safe');

// file system
const fs = require('fs');

// https://github.com/request/request-promise-native
const rp = require('request-promise-native');

// node.js command-line interfaces made easy
// https://www.npmjs.com/package/commander
const program = require('commander');

const QueueProcessor = require('./queue-processor');

// static configuration
const TEXTRAZOR_URL = 'https://api.textrazor.com/'

// user configuration
const { TEXTRAZOR_API_KEY, TEXTRAZOR_NUM_PROCESSORS } = process.env;

if(TEXTRAZOR_API_KEY === undefined) {
  console.error(colors.red('no TextRazor API key defined in environment variable TEXTRAZOR_API_KEY'));
  process.exit(1);
}

function writeJSONToFile(jsonData, path) {
  fs.writeFileSync(path, jsonData, 'utf8');
}

class TextRazor {
  constructor(program) {
    // https://www.textrazor.com/docs/rest#analysis
    this._registerAnalyze(program);
  }

  analyze(params) {
    const {
      text,
      url,
      extractors,
    } = params;

    let form = { extractors };

    if(text) {
      form.text = text;
    } else if (url) {
      form.url = url;
      form['cleanup.mode'] = 'cleanHTML';
      form['cleanup.returnCleaned'] = true;
    }

    return rp.post({
      url: TEXTRAZOR_URL,
      headers: { 'x-textrazor-key': TEXTRAZOR_API_KEY },
      form
    });
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

      const analyze = (analysisOptions) => {
        const promise = new Promise((resolve, reject) => {
          this.analyze(analysisOptions)
          .then((rawResponse) => {

            if(path) {
              if (!fs.existsSync(path)){
                  fs.mkdirSync(path);
              }

              const filename = analysisOptions.text ? analysisOptions.text : analysisOptions.url;
              writeJSONToFile(rawResponse, `${path}/${encodeURIComponent(filename)}.json`);
            }

            resolve(rawResponse);
          })
          .catch((e) => {
            console.log(colors.red(e));
            reject(e);
          })
        });

        return promise;
      };

      if (text === undefined && urls === undefined) {
        console.error(colors.red('Missing required parameters! Supply either content or urls'));
        process.exit(1);
      }

      if (text) {
        analyze({ extractors, text });
      } else if(urls && urls.length > 0) {

        if(urls.length === 1) {
          analyze({ extractors, url: urls[0] });
        } else {
          for(let i = 0; i < TEXTRAZOR_NUM_PROCESSORS; i ++) {
            const processor = new QueueProcessor(urls, `textrazor_${i}`);
            processor.process(
              (url) => {
                return analyze({ extractors, url });
              },
              this._onQueueSuccess.bind(this),
              this._onQueueError.bind(this),
              this._onQueueComplete.bind(this)
            );
          }
        }
      }
    });
  }

  _onQueueSuccess(result, url) {
    console.log(colors.green(`✅ ${url}`));
  }

  _onQueueError(error) {
    console.log(colors.red.bold('⚠︎ fail ⚠︎'));
    console.log(colors.red(error));
  }

  _onQueueComplete(queue) {
    console.log(colors.green.bold(`${queue.name} done!`));
  }
}

// configuration
const { version } = require('./package.json');
program.version(version);

const textrazor = new TextRazor(program);
program.parse(process.argv);

// export an instantiated singleton
module.exports = textrazor;