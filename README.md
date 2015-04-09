# Vandyke

## Template markup

### Component

#### Element

`<element/>` Native self closing HTML element or React component without attributes

`<element attribute attributeN/>` Native self closing HTML element or React component with one or more attributes

`<element> content </element>` Native HTML element or React component with element body and without attributes

* `content` can be multiple items of `Content`

`<element attribute attributeN> content </element>` Native self closing HTML element or React component with element body and with one or more attributes

* `content` can be multiple items of `Content`


#### Attributes

`attribute` Simple attribute without given value, value will be interpreted as `true`

`attribute="simple string"` Simple string attribute as known in HTML

`attribute=value` Pass an advanced value to this attribute

* `value` can be an `Expression`, `Chain` or `Helper`

### Content

Content can be a mix of `expressions`, `elements`, `helpers` and `text`. The template whole needs to return a single root `element`.

### Expression

`{expression}` Simple expression to provide advanced content

* `expression` can be `Boolean`, `Number`, `Variable` or `String`

#### String

`"foo"` Native JavaScript string with double quotes

#### Number

`1.234` Native Javascript number positive

`-1.1234` Native Javascript number negative

#### Boolean

`true` Native Javascript boolean true

`false` Native Javascript boolean false

#### Variable

`name` In scope variable access

`@name` Contextual variable access (e.g. `@index` in each helper)

`../name` Parent scope variable access

`../../sub.object.name` Path variable access

### Helper

`{#helper/}` Simple helper without any arguments and body

`{#helper argument/}` Simple helper with argument

* `argument` can be an `Boolean`, `Number`, `Variable` or `String` 

**In element body:**

`{#helper} content {/helper}` Block helper containing content

* `content` can be multiple items of `Content`

`{#helper argument} content {/helper}` Block helper with argument and containing content

* `argument` can be an `Boolean`, `Number`, `Variable` or `String`
* `content` can be multiple items of `Content`

`{#helper argument} content {:else} content {/helper}` Block helper with argument, containing content and alternate content

* `argument` can be an `Boolean`, `Number`, `Variable` or `String`
* `content` can be multiple items of `Content`

**In attribute value:**

`{#helper} content {/helper}` Block helper containing content

* `content` can be `Boolean`, `Chain`, `Helper`, `Number`, `Variable` or `String`

`{#helper argument} content {/helper}` Block helper with argument and containing content

* `argument` can be an `Boolean`, `Number`, `Variable` or `String`
* `content` can be `Boolean`, `Chain`, `Helper`, `Number`, `Variable` or `String`

`{#helper argument} content {:else} content {/helper}` Block helper with argument, containing content and alternate content

* `argument` can be an `Boolean`, `Number`, `Variable` or `String`
* `content` can be `Boolean`, `Chain`, `Helper`, `Number`, `Variable` or `String`

### Chain

Concat multiple items of `Boolean`, `Helper`, `Number`, `Variable` and `String` to a single String.

Example: `{foo + ' bar ' + bar}`
