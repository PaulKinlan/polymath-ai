Binary
======

Standalone ingestion tool.

`@polymath/ingest [something]`


Design
======

* The output file format should not be the concern of the ingester. It should be the concern of the consumer of the ingester.


Library
=======

Extend `Importer`
-----------------
```

class MyImporter extends Importer {

  constructor() {

    super();

  }

  async import() {

    // do something

  }

}
```

Embed Importer 
--------------

```
import { Importer } from

```