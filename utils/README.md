# utils

These are utility modules that can be used for any task to use.

For Python modules, they can be imported using the `from <module_name> import <function_name>` syntax. For example, if the file is called `my_module.py` and contains a function named `my_function`, importing it would be

```py
from utils.my_module import my_function
```

.

For JavaScript modules, they can be imported using the `import <module_name> from '<module_path>'` syntax. For example, if the file name is called `my_module.js` and the module has an `export default ...` in it, importing it would be

```js
import my_module from '../../utils/my_module.js';
```

. Notice that the path to the module is relative to the JavaScript file.

import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';

## Making Changes

Adding new functions is as simple as writing them in a new file. However, be aware that making changes to existing utility modules can break backward compatibility. To help ease this, creating a new different file with the updated function would get around breaking the current usage. If it's still necessary to change existing modules, make those changes but also ensure that existing tests are updated as well.
