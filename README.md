# Vandyke

## Template markup

### Content

Content can be a mix of `expressions`, `elements` and `text`. The template whole needs to wraped in a single root `element`.

### DOM

#### Element

`<element/>` Native self closing HTML element or React component without attributes

`<element attribute attributeN/>` Native self closing HTML element or React component with one or more attributes

`<element>` content `</element>` Native HTML element or React component with element body and without attributes

`<element attribute attributeN>` content `</element>` Native self closing HTML element or React component with element body and with one or more attributes


#### Attributes

`attribute` Simple attribute without given value, value will be interpreted as `{true}`

`attribute="simple string"` Simple string attribute as known in HTML

`attribute={expression}` A template expression passed to this attribute

### Expressions

#### JavaScript

`{"foo"}` Native JavaScript string

`{'foo'}` Native JavaScript string

`{true}` Native Javascript boolean true

`{false}` Native Javascript boolean false

#### Variable

`{name}` In scope variable access

`{@name}` Contextual variable access (e.g. `@index` in each helper)

`{../name}` Parent scope variable access

#### Helper

`{#helper/}`

`{#helper argument/}` 

`{#helper}` content `{/helper}` 

`{#helper argument}` content `{/helper}` 

#### Chain

`{foo + ' bar ' + bar}`



