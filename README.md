# @edjopato/datastore

[![NPM Version](https://img.shields.io/npm/v/@edjopato/datastore.svg)](https://www.npmjs.com/package/@edjopato/datastore)
[![node](https://img.shields.io/node/v/@edjopato/datastore.svg)](https://www.npmjs.com/package/@edjopato/datastore)
[![Dependency Status](https://david-dm.org/EdJoPaTo/js-datastore/status.svg)](https://david-dm.org/EdJoPaTo/js-datastore)
[![Dev Dependency Status](https://david-dm.org/EdJoPaTo/js-datastore/dev-status.svg)](https://david-dm.org/EdJoPaTo/js-datastore?type=dev)

Handles different ways to store data within NodeJS

All implementation follow their specific interface.
This way its possible to swap implementations without problems.

The implementation should use as less async as possible.
That way implementations can be used in synchronous environments.
Example: `KeyValueInMemoryFiles` uses only `set()` async, everything else is done from memory which is synchronous.


## Install

```
$ npm install @edjopato/datastore
```
