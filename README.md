# cookie-monster [![Build Status](https://travis-ci.org/DigitalInterruption/cookie-monster.svg?branch=master)](https://travis-ci.org/DigitalInterruption/cookie-monster)
A utility for automating the testing and re-signing of Express.js cookie secrets.

Dependencies
------------
* [Node.js](https://nodejs.org/) >= 7.6
* [yarn](https://yarnpkg.com/)

Installation
------------
`cookie-monster` is available on [npm](https://www.npmjs.com/). To install it, type:

```text
$ yarn global add @digital-interruption/cookie-monster
```

Alternatively, to install from source:

```text
$ git clone https://github.com/DigitalInterruption/cookie-monster
$ cd cookie-monster
$ yarn install
$ yarn link
```

Usage
-----
After installation, the `cookie-monster` executable will be available, and accepts the following arguments:

```text
-b, --batch              Enable batch mode.                                                            
-c, --cookie string      The session cookie to use when not using batch mode.                          
-e, --encode             Enable encode mode.                                                           
-h, --help               Print this usage guide.                                                       
-f, --input-file file    The JSON file with the cookie data to analyse in batch mode / the JSON data   
                         to be encoded in encode mode.                                                 
-n, --name string        The cookie name to use when not using batch mode. (default: session)          
-o, --output file        The file to output the results to.                                            
-p, --port number        The port to bind the local test server to. (default: 3000)                    
-k, --secret string      The secret key to use when using encode mode.                                 
-s, --signature string   The value of the session signature cookie to use when not using batch mode.   
-v, --verbose            Output verbose messages on internal operations.                               
-w, --wordlist file      The wordlist to use as a source of possible cookie secrets.                 
```

Input Format for Batch Mode
---------------------------
When testing cookies in batch mode, the input file must follow a specific format. The file must contain a JSON array of objects, each of which should contain the following:

* `name`: the name of the session cookie
* `samples`: an array of cookie samples

The cookie sample objects should consist of the following:

* `ip`: the IP address of the host the cookie was obtained from
* `port`: the port of the service the cookie was obtained from
* `data`: the contents of the session cookie
* `sig`: the contents of the signature cookie.

A sample file can be found below:

```json
[
  {
    "name": "session",
    "samples": [
      {
        "ip": "127.0.0.1",
        "port": 3000,
        "data": "eyJmb28iOiJiYXIifQ==",
        "sig": "LVMVxSNPdU_G8S3mkjlShUD78s4"
      },
      {
        "ip": "127.0.0.1",
        "port": 443,
        "data": "eyJmb28iOiJiYXIifQ==",
        "sig": "LVMVxSNPdU_G8S3mkjlShUD78s4"
      }
    ]
  },
  {
    "name": "cookieName",
    "samples": [
      {
        "ip": "127.0.0.1",
        "port": 3000,
        "data": "eyJmb28iOiJiYXIifQ==",
        "sig": "LVMVxSNPdU_G8S3mkjlShUD78s4"
      },
      {
        "ip": "127.0.0.1",
        "port": 443,
        "data": "eyJmb28iOiJiYXIifQ==",
        "sig": "LVMVxSNPdU_G8S3mkjlShUD78s4"
      }
    ]
  }
]
```

Examples
--------
### Test a single cookie
```text
$ cookie-monster -c eyJmb28iOiJiYXIifQ== -s LVMVxSNPdU_G8S3mkjlShUD78s4
```

### Test a single cookie with a specific name
```text
$ cookie-monster -c eyJmb28iOiJiYXIifQ== -s LVMVxSNPdU_G8S3mkjlShUD78s4 -n session
```

### Test a single cookie with a custom wordlist
```text
$ cookie-monster -c eyJmb28iOiJiYXIifQ== -s LVMVxSNPdU_G8S3mkjlShUD78s4 -w custom.lst
```

### Test multiple cookies using batch mode
```text
$ cookie-monster -b -f cookies.json
```

### Test multiple cookies using batch mode with a custom wordlist
```text
$ cookie-monster -b -f cookies.json -w custom.lst
```

### Test a cookie and save the results to a file
```text
$ cookie-monster -c eyJmb28iOiJiYXIifQ== -s LVMVxSNPdU_G8S3mkjlShUD78s4 -o results.json
```

**Note:** the file created by the `-o` option will be a JSON file, containing an array of all secrets that were successfully identified; along with information to identify their source.

A sample results file can be found below:

```json
[
    {
        "name": "session",
        "data": "eyJmb28iOiJiYXIifQ==",
        "sig": "LVMVxSNPdU_G8S3mkjlShUD78s4",
        "ip": "127.0.0.1",
        "port": 3000,
        "decodedData": "{\"foo\":\"bar\"}",
        "secret": "keyboard cat"
    },
    {
        "name": "session",
        "data": "eyJmb28iOiJiYXIifQ==",
        "sig": "LVMVxSNPdU_G8S3mkjlShUD78s4",
        "ip": "127.0.0.1",
        "port": 443,
        "decodedData": "{\"foo\":\"bar\"}",
        "secret": "keyboard cat"
    }
]
```

### Encode and sign a new cookie
```text
$ cookie-monster -e -f new_cookie.json -k secret
```

**Note:** The input file must contain the raw cookie data, not the base64 data. In this example, `new_cookie.json` would not contain `ewogICJmb28iOiAiYmFyIgp9Cg==`, but would contain:

```json
{
  "foo": "bar"
}
```

The output from `cookie-monster` will then provide both encoded cookies which can be copied directly into a HTTP request:

```text
[+] Data Cookie: session=eyJmb28iOiJiYXIifQ==
[+] Signature Cookie: session.sig=YyeDeoG1AwlyHWZWt1MIMum4dZg
```

More Information
----------------
For more information on this type of attach, see our [blog post](https://www.digitalinterruption.com/single-post/2018/06/04/Are-Your-Cookies-Telling-Your-Fortune) and [whitepaper](https://file.digitalinterruption.com/Are_Your_Cookies_Telling_Your_Fortune.pdf).
