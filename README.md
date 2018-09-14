# mongoose-exists

[![Build Status](https://travis-ci.org/lykmapipo/mongoose-exists.svg?branch=master)](https://travis-ci.org/lykmapipo/mongoose-exists)
[![Dependency Status](https://img.shields.io/david/lykmapipo/mongoose-exists.svg?style=flat)](https://david-dm.org/lykmapipo/mongoose-exists)
[![npm version](https://badge.fury.io/js/mongoose-exists.svg)](https://badge.fury.io/js/mongoose-exists)

mongoose validation to ensure referenced object id exists.

*Note!: Path to be checked for existance must have `ref` and `exists` options*

## Requirements

- NodeJS v6.5+
- mongoose v4.9.0+

## Install
```sh
$ npm install --save mongoose mongoose-exists
```

## Usage

```javascript
const mongoose = require('mongoose');
const exists = require('mongoose-exists');
const Schema = mongoose.Schema;

...

const FriendSchema = new Schema({
  type: { type: String },
  person: { type: ObjectId, ref: 'Person', exists: true }
});

const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', exists: true },
  mother: { type: ObjectId, ref: 'Person', exists: [true, 'NOT EXIST'] },
  sister: {
    type: ObjectId,
    ref: 'Person',
    exists: {
      refresh: true, //will check and set sister
      message: 'NOT EXIST'
    }
  },
  relatives: { type: [ObjectId], ref: 'Person', exists: true },
  referees: [{ type: ObjectId, ref: 'Person', exists: true }],
  friends: { type: [FriendSchema] },
  neighbours: [FriendSchema]
});
PersonSchema.plugin(exists);

...

Person.create({}, function (error) {
  expect(error).to.exist;
  expect(error.errors.father).to.exist;
  expect(error.name).to.be.equal('ValidationError');
  expect(error.errors.father.message)
    .to.be.equal('father with id ' + person.father +
      ' does not exists');
});

...

```

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```
* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence
The MIT License (MIT)

Copyright (c) 2015 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 