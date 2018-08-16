# TextRazor API CLI
A [nodejs](https://nodejs.org/)-powered command-line interface for [TextRazor](https://www.textrazor.com/).

## Getting Started

### Make `textrazor.js` executable
```
computer-1:repositories user$ cd textrazor-api-cli
computer-1:textrazor-api-cli user$ chmod +x textrazor.js
```

### Add TextRazor API Key
Get a key [here](https://www.textrazor.com/signup).

Add a file called `.env` in the project root containing your TextRazor API key.

```
// contents of news-api-cli/.env
TEXTRAZOR_API_KEY=YOUR-KEY-HERE
```

## Commands

### [Analyze](https://www.textrazor.com/docs/rest#analysis)

#### Usage

`analyze [options]`

#### Options
```
-t, --text [text]              Content to analyze
-u, --urls [urls]              A list of comma-separated urls to extract and analyze
-e, --extractors <extractors>  A list of comma-separated extractors
-w, --write [path]             Save the result to [path]/[encodeURIComponent(url or text)]
-h, --help                     output usage information
```
#### Examples
Extract entities and topics from the phrase "Donald Trump is a moron" and save it to `donald/Donald%20Trump%20is%20a%20moron.json`:
```
./textrazor.js analyze -t "Donald Trump is a moron" -e entities,topics  -w donald
```

Extract entities and topics from a New York Times article and save it to `nyt/https%3A%2F%2Fwww.nytimes.com%2F2018%2F08%2F25%2Fus%2Fpolitics%2Frobert-mueller-russia-investigation.htm.json`:
```
./textrazor.js analyze -u https://www.nytimes.com/2018/08/25/us/politics/robert-mueller-russia-investigation.html -e entities,topics  -w nyt
```