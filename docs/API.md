## Classes

<dl>
<dt><a href="#Form">Form</a></dt>
<dd><p>Creates a fillable form from a PDF.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#map">map(pdfFile, [options])</a> ⇒ <code>object</code></dt>
<dd><p>Generates a map from a PDF file and saves as YAML.</p>
</dd>
<dt><a href="#open">open(fileName)</a> ⇒ <code>PDF</code></dt>
<dd><p>Opens a PDF form.</p>
</dd>
<dt><a href="#getTemplate">getTemplate()</a> ⇒ <code>object</code></dt>
<dd><p>Gets the form template.</p>
</dd>
<dt><a href="#fillForm">fillForm(filledTemplate)</a></dt>
<dd><p>Fills out a form using <code>filledTemplate</code>.</p>
</dd>
<dt><a href="#slice">slice(begin, end)</a> ⇒ <code>PDF</code></dt>
<dd><p>Slice pages from <code>begin</code> (0-based, inclusive) to <code>end</code> (exclusive).</p>
</dd>
<dt><a href="#append">append(pdf)</a></dt>
<dd><p>Appends PDF to the current PDF.</p>
</dd>
<dt><a href="#save">save(dest, [flatten])</a> ⇒ <code>Promise</code></dt>
<dd><p>Saves the PDF to file.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HelperFunction">HelperFunction</a> ⇒ <code>number</code> | <code>string</code></dt>
<dd><p>HelperFunction definition</p>
</dd>
</dl>

<a name="Form"></a>

## Form
Creates a fillable form from a PDF.

**Kind**: global class  

* [Form](#Form)
    * [.init(config)](#Form+init)
    * [.load(source, map)](#Form+load)
    * [.setFormName(name)](#Form+setFormName)
    * [.setSourcePDF(source)](#Form+setSourcePDF)
    * [.registerFriendlyKeyHelpers(funcs)](#Form+registerFriendlyKeyHelpers)
    * [.fill(filler, [options])](#Form+fill)
    * [.save(source, dest)](#Form+save)
    * [.slice(begin, end, dest)](#Form+slice)
    * [.join(dest, parts)](#Form+join)

<a name="Form+init"></a>

### form.init(config)
Initialize the form.  The `config` be a string or an object.  If it is
a string, it is a path to a YAML file.

**Kind**: instance method of [<code>Form</code>](#Form)  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>string</code> \| <code>object</code> | The config file to use when filling forms. |

<a name="Form+load"></a>

### form.load(source, map)
Loads a PDF source and map file.  The `source` is a path to a PDF file
that will be used to fill.  The `map` can be a string or an object.  If
it is a string, it is a path to a YAML file.  The `map` was previously
generated from a PDF document using the [map](#map) function.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> | The PDF source. |
| map | <code>string</code> \| <code>object</code> | The map generated from [map](#map). |

<a name="Form+setFormName"></a>

### form.setFormName(name)
Change the context reference name for the form.  By default is is the
`path.basename` of the `source` PDF provided in [load](load) function.
When evaluating form fields, inputs will be saved under this new name,
and can be referenced from the scripts.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | A friendly form name. |

**Example**  
```js
await form.load(path.join('forms', 'banana-order-form.pdf'));
form.setFormName('banana');
// reference in scripts: ctx.forms["banana"]
```
<a name="Form+setSourcePDF"></a>

### form.setSourcePDF(source)
Change the source PDF name.  By default, this is the the `source` PDF
path provided in [load](load) function.  It allows the source PDF to be
changed prior to calling [slice](#slice) or [save](#save).

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> | The PDF source. |

**Example**  
```js
await form.load(path.join('forms', 'A.pdf'));
await form.fill(script); // fill A
form.setSourcePDF('A-part2.pdf'); // change source PDF
await form.slice(3, 4', 'A2.pdf'); // slice pages 3-4 into A2.pdf
form.setFormName('A2');
await form.fill(script2); // fill A2
form.setSourcePDF('A.pdf'); // change source PDF back to A.pdf
await form.join([ 'A2.pdf' ], 'A.pdf');
```
<a name="Form+registerFriendlyKeyHelpers"></a>

### form.registerFriendlyKeyHelpers(funcs)
Registers friendly key helpers for use with the script.  By default, the
following key helpers are registered:

- **.currency**: The value is a currency, meaning that it will be
parsed as a decimal and written to the form as a declimal with two
decimal places.
- **.dec**: Returns the decimal part of a currency.
- **.whole**: Returns the whole integer part of a currency.
- **.nodash**: Strips dashes from a string.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| funcs | <code>object</code> | A map of function suffix to [HelperFunction](#HelperFunction). |

**Example**  
```js
form.registerFriendlyKeyHelpers({
  '.lowercase': (value) => value !== undefined ? value.toLowerCase() : ''
});
```
<a name="Form+fill"></a>

### form.fill(filler, [options])
Fills a form.  The `filler` can be a string or an object.  If it is a
string, then it will be read in as a YAML file.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filler | <code>string</code> \| <code>object</code> |  | The form filler script. |
| [options] | <code>object</code> | <code>{}</code> | Fill options. |
| [options.debug] | <code>string</code> |  | Enables a `debugger` breakpoint when the specified field name is being filled.  Useful for debugging a problematic input field. |

<a name="Form+save"></a>

### form.save(source, dest)
Opens the PDF `source` form, fills out the form and writes it to `dest`.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> | The source PDF document. |
| dest | <code>string</code> | The dest PDF document. |

<a name="Form+slice"></a>

### form.slice(begin, end, dest)
Copy pages out of the PDF and saves it to `dest`.  Can be used in
conjunction with [setSourcePDF](setSourcePDF) to change the source PDF used
for slicing pages.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| begin | <code>integer</code> | The page number to slice from, inclusive. |
| end | <code>integer</code> | The page number to slice to, inclusive. |
| dest | <code>string</code> | The destination PDF file to write. |

<a name="Form+join"></a>

### form.join(dest, parts)
Join multiple PDF `parts` into a new PDF `dest`.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| dest | <code>PDF</code> | - |
| parts | <code>Array.&lt;string&gt;</code> | - |

<a name="map"></a>

## map(pdfFile, [options]) ⇒ <code>object</code>
Generates a map from a PDF file and saves as YAML.

**Kind**: global function  
**Returns**: <code>object</code> - An object with `{ map }` that defines the path to the
	map file name.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pdfFile | <code>string</code> |  | The PDF file containing a form. |
| [options] | <code>object</code> | <code>{}</code> | Options. |

<a name="open"></a>

## open(fileName) ⇒ <code>PDF</code>
Opens a PDF form.

**Kind**: global function  
**Returns**: <code>PDF</code> - A PDF for filling.  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | The path to the PDF file to open. |

<a name="getTemplate"></a>

## getTemplate() ⇒ <code>object</code>
Gets the form template.

**Kind**: global function  
**Returns**: <code>object</code> - A PDF form template.  
<a name="fillForm"></a>

## fillForm(filledTemplate)
Fills out a form using `filledTemplate`.

**Kind**: global function  

| Param | Type |
| --- | --- |
| filledTemplate | <code>object</code> | 

<a name="slice"></a>

## slice(begin, end) ⇒ <code>PDF</code>
Slice pages from `begin` (0-based, inclusive) to `end` (exclusive).

**Kind**: global function  
**Returns**: <code>PDF</code> - The new PDF.  

| Param | Type | Description |
| --- | --- | --- |
| begin | <code>int</code> | The index of the page to slice from. |
| end | <code>int</code> | The index of the page to slice to. |

<a name="append"></a>

## append(pdf)
Appends PDF to the current PDF.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pdf | <code>PDF</code> | The PDF to append. |

<a name="save"></a>

## save(dest, [flatten]) ⇒ <code>Promise</code>
Saves the PDF to file.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| dest | <code>str</code> |  | The destination file name. |
| [flatten] | <code>bool</code> | <code>true</code> | Flattens the PDF form before saving. |

<a name="HelperFunction"></a>

## HelperFunction ⇒ <code>number</code> \| <code>string</code>
HelperFunction definition

**Kind**: global typedef  
**Returns**: <code>number</code> \| <code>string</code> - The converted `val`.  

| Param | Type |
| --- | --- |
| val | <code>number</code> \| <code>string</code> | 

