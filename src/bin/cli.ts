#!/usr/bin/env node
// Copyright 2024 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
import { run } from '@stricli/core';

import { app } from '../app';
import { buildContext } from '../context';

await run(app, process.argv.slice(2), buildContext(process));
