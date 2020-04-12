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
</dl>

<a name="Form"></a>

## Form
Creates a fillable form from a PDF.

**Kind**: global class  

* [Form](#Form)
    * [.init(formName, map, config)](#Form+init)
    * [.fill(filler)](#Form+fill)
    * [.save(source, dest)](#Form+save)

<a name="Form+init"></a>

### form.init(formName, map, config)
Initialize the form.  The `map` and `config` can be a string or an
object.  If it is a string, then it will be read in as a YAML file.
The `map` was previously generated from a PDF document using the
[map](#map) function.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| formName | <code>string</code> | A unique name for the form. |
| map | <code>string</code> \| <code>object</code> | The map generated from [map](#map). |
| config | <code>string</code> \| <code>object</code> | The config used by the filler script. |

<a name="Form+fill"></a>

### form.fill(filler)
Fills a form.  The `filler` can be a string or an object.  If it is a
string, then it will be read in as a YAML file.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| filler | <code>string</code> \| <code>object</code> | The form filler script. |

<a name="Form+save"></a>

### form.save(source, dest)
Opens the PDF `source` form, fills out the form and writes it to
`dest`.

**Kind**: instance method of [<code>Form</code>](#Form)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> | The source PDF document. |
| dest | <code>string</code> | The dest PDF document. |

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

