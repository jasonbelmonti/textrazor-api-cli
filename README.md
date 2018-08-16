# TextRazor API CLI
A [nodejs](https://nodejs.org/)-powered command-line interface for [TextRazor](https://www.textrazor.com/).

+ [`sources`](#sources) :arrow_right: [/sources](https://newsapi.org/docs/endpoints/sources)
+ [`everything`](#everything) :arrow_right: [/everything](https://newsapi.org/docs/endpoints/everything)
+ [`top-headlines`](#topHeadlines) :arrow_right: [/top-headlines](https://newsapi.org/docs/endpoints/top-headlines)

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

### [Sources](https://newsapi.org/docs/endpoints/sources)

#### Usage

`sources [options]`

#### Options
```
-l, --language [language]  Only return articles written in this language
-v, --verbose              If enabled, show description, url, category, language, country
-c, --category [category]  Only return articles relevant to this category
-w, --write [path]         Save the result to [path] (utf-8 encoding)
-h, --help                 output usage information
```
#### Examples

##### Retreive all english language sources and write them to `sources.json`:
```
./news.js sources -l en -w sources.json
```

##### Retreive all "business" sources and save to `sources/business.json`:
```
./news.js sources -c business -w sources/business.json
```

##### Retreive all sources and print all information:
```
./news.js sources -v
```
