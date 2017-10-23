# safe-read-write

Uses [lockfile](https://www.npmjs.com/package/lockfile) and [mz](https://www.npmjs.com/package/mz) to safely read and write simple text files. 

**Use case:** Needed for a node based http server application that does many small read/write operations. The server accepts requests and returns a `202 - Accepted`. The server contains a worker process that is executed using [spawn]() that does a potenaillay long (up to many minutes) process; during the process, the worker writes status information in JSON to a file. The client then polls for the status could get malformed JSON without safe-read-write. 

**Install, develop, test, use**

```
# install
npm install safe-read-write

# develop
npm run compile
npm run dev # watch

# test
npm test
npm run tdd # watch

# use
const saferw = require('safe-read-write');
import saferw from 'safe-read-write';

...

safeWrite('/path/to/textfile', 'text content', 'utf8');

...

safeRead('/path/to/textfile')
  .then(data => ...);

```

