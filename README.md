# pdffiller-script

Scripted PDF form filling.  This project is inspired by [pdffiller](https://github.com/pdffillerjs/pdffiller), but needed something more powerful and flexible to allow filling out many forms with data from a single input configuration file, but also allowing values to be manipulated / computed before form filling.  For example, to combine first and last names, or to ensure currency values look like currency values. This module now uses [@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) to manipulate PDF forms.

```yaml
your.first.name.and.middle.initial:
  6: ctx.identity.firstName + (ctx.identity.middleName ? ` ${ctx.identity.middleName[0]}`:'')
```

From the API, the engine is extensible.

## Install

To install `pdffiller-script` to use the module API.

```bash
$ npm install pdffiller-script
```

Install `pdftk`

```bash
sudo apt-get install pdftk
```

## CLI usage

### Generate map file and example YAML files

Parse the PDF and generate the map file, and example files to aid in form filling:

```bash
$ npx pdffiller-script map mypdf.pdf
```

This command generates `mypdf-map.yaml` which will later be fed into the CLI for filling out the PDF form.  It also generates a number of example files to aid in form filling.

<a name="map-file"></a>
**`mypdf-map.yaml`**: Maps input fields to integer values.  Referred to as the "map".

<a name="example-script"></a>
**`mypdf-example-script.yaml`**: An example form filler script.  Referred to as the "filler script".  Fills all fields to "todo" (values read from the config file).  :warning: *refer to filler doc*.

<a name="example-config-file"></a>
**`mypdf-example-config.yaml`**: An example configuration that sets every value to "todo".  :warning: *refer to config doc*.

<a name="example-filled-pdf"></a>
**`mypdf-example-filled.pdf`**: The PDF file filled with each field containing an incremental integer value for easier identification of fields to fill.

### Fill a PDF

If you wish, you can modify `mypdf-example-config.yaml` and change a few values.  Ultimately, you will create custom config and [script files](#scripted-pdf-form-filling).  Then, run the filler script and produce a PDF:

```bash
$ npx pdffiller-script fill mypdf.pdf \
 --map mypdf-map.yaml\
 --config mypdf-example-config.yaml\
 --filler mypdf-example-script.yaml\
 --output output.pdf
```

## Scripted PDF form filling

The `pdffiller-script` uses [pdffiller](https://www.npmjs.com/package/pdffiller) to interact with PDF forms, which makes it super easy to fill forms.  However, not all forms have friendly keys.  For example, the [USA IRS f1040](https://www.irs.gov/pub/irs-pdf/f1040.pdf) forms have keys that are not very user friendly, making correlating the field IDs to the form extremely difficult.  Furthermore, they are different on every form, there are lots of forms, and lots of fields.  If you were to use [pdffiller](https://www.npmjs.com/package/pdffiller), you would have quite a job.  The  `pdffiller-script`  simplifies that by employing a mapping system that uniquely identifies fields, and providing a configurable and scriptable interface for filling PDF forms.

For example, take two fields from the [f1040](https://www.irs.gov/pub/irs-pdf/f1040.pdf) form.

<img src="https://github.com/wickedest/pdffiller-script/raw/master/images/f1040-empty-fields.png" alt="Image of two empty fields from f1040 PDF" />


The two fields actually have these IDs:

<img src="https://github.com/wickedest/pdffiller-script/raw/master/images/f1040-field-ids.png" alt="Image of two empty fields from f1040 PDF with IDs" />

These two fields exist on many (if not every) PDF tax form, and they have different keys.  The idea behind `pdffiller-script` will abstract these fields by giving each field in a form a unique integer ID that maps to the actual form fields.  It generates an [example PDF file](#example-filled-pdf) filled with the unique integer IDs so you can visually identify the fields you wish to fill.

<img src="https://github.com/wickedest/pdffiller-script/raw/master/images/f1040-filled-fields.png" alt="Image of two filled fields from f1040 PDF filled" />

Then, it becomes *much* easier to keep track of fields, and build a form filler script that is used to dynamically set values in the form.  For example:

```yaml
# f1040-filler.yaml
fill_first_name:
  6: ${ctx.firstName}
fill_last_name:
  7: ${ctx.lastName}
```

In the script above, the `fill_first_name` key must be unique, but it is almost completely arbitrary (more on that later).  The key helps the script maintainer identify the field by something other than the integer ID.  The `6` indicates that this script will fill field with ID `6` (the *Your first name and middle initial* field).

The `${ctx.firstName}` is a [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).  The `ctx` is from the [config file](#example-config-file) that you customized:

```yaml
# config.yaml
firstName: Joe A
lastName: Bloggs
```
After running the script, it will fill the form, and evaluate `${ctx.firstName}` as "Joe A" and assign it to the input field, `topmostSubform[0].Page1[0].f1_02[0]`.  Then, it will do the same for `${ctx.lastName}`, yielding:

![Image of two empty fields from f1040 PDF](https://github.com/wickedest/pdffiller-script/raw/master/images/f1040-filled-fields-joe-bloggs.png)

## Example

For use with the `./example` provided with the source.

### Generate an f1040 map file

This will re-generate the `example/f1010-map.yaml` file and examples.  If you only want the map, use the option `--no-example`.

```bash
$ npx pdffiller-script map example/f1040.pdf --out "example"
```

### Fill out an f1040 form
```bash
$ npx pdffiller-script fill example/f1040.pdf \
  --map example/f1040-map.yaml \
  --config example/config.yaml \
  --script example/f1040-filler.yaml \
  --output output.pdf
```

### Fill out an f1040 form via the programmatic API
```bash
$ cd example
$ node fill-f1040.js
```

## Filler script API

The form filler script is a YAML file that is generated using the [map](#example-script) CLI.

### Types of inputs

* [Fixed-field inputs](#fixed-field-inputs) are used when there is a 1:1 correlation between the field ID and the config value.
* [Calculated inputs](#calculated-inputs) are used when the either field ID or value to fill depends on the config value.

### Fixed-field inputs

When there is direct correlation between the config value and an input field, then the fixed-field input is the optimal choice.  Fixed-field inputs have the syntax:

```yaml
unique.friendly.key:
  integer: value
```

The key is a unique friendly key, `unique.friendly.key`, is (almost) completely arbitrary (see [Script friendly keys](#script-friendly-keys)).  It is used to help the script maintainer to correlate the value back to the form without having to look at the form.

The `integer` is the unique integer ID assigned to the field.  It can be seen in the example filled PDF that was generated when it built the [map](../README.md#example-script).  It is also in the map file that was generated.  In this way, it is a fixed-field input because the field ID is known in advance.

The `value` is described in [Script values](#script-values).

### Calculated inputs

When either the field ID or the value to fill depends on the config value, then it is necessary to use a field calculated.  Calculated inputs have the syntax:

```yaml
unique.friendly.key:
  value: value
  calculate: |
    (ctx, val) => { field, fill }
```

Sometimes the exact field ID to fill or the ultimate value to input may not be known in advance.  An example of this might be one of *several* check-boxes or radio buttons (these can be very difficult to figure out by the way, see [troubleshooting](#troubleshooting)).  For example, consider a form with radio buttons:

```
Favorite fruit:
  ( ) Apple
  ( ) Banana
```

The config might be:

```yaml
fruit: banana
```

However, the "Apple" and "Banana" radio buttons have *different* input ID.  Depending on the config, there are one of two different inputs to fill.  The solution is to calculate both the ID and the input value to fill, based on the config value.  For example:

```yaml
favorite.fruit:
  value: ${ctx.fruit}
  calculate: |
    (ctx, val) => {
      if (val === 'banana') {
          return { field: 1, fill: '0' };
      } else {
          return { field: 2, fill: '1' };
      }
    }
```

The calculation scripts are by-far the most difficult aspect of form filling.  You need to know your way around JavaScript, and it can be tricky figure out exactly what value will enable/disable a particular check-box or radio (if anyone has insight into this, please let me know).

### Script values

The `value` is computed as a [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).  It can be constant value, e.g. `"Joe Bloggs"` or `1234.00`.  However, JavaScript can the [Javascript Core Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) also be used within the script.  In addition, there is a pre-defined context, `ctx`, that allows the script to access the configuration file.

```yaml
fill.string:
  0: Joe Bloggs
fill.number:
  0: 1234.00
fill.first.last:
  0: ${ctx.firstName} ${ctx.lastName}
fill.js:
  # fill an ISO 8601 string "2020-04-13T12:31:23.799Z"
  0: ${new Date().toISOString()}
```

In addition, there are a number of built-in [helper functions](#script-helper-functions) that can help clean and sanitize data.

## Script friendly-key convention

We said that the friendly keys are *mostly* arbitrary.  There are a number of built-in [helper functions](#script-helper-functions) that can help clean and sanitize data.  However, they are not *too* convenient if used a lot.  For example, imagine filling out a form that required large amounts of monetary input, but that the input be rounded to a whole number (no decimal places).  It would be inconvenient to repeatedly write this every time a whole number was required:

```yaml
total.income:
  0: ${currencyWhole(ctx.totalIncome)}
```

It is more convenient to add a suffix and automatically apply a function, e.g.:

```yaml
total.income.whole:
  0: ${ctx.totalIncome}
```


The shorthand suffixes make repetitive inputs more convenient.  However, using them has an added drawback when referring to [Previously filled fields](#previously-filled-fields).  The [API](API.md) has a way to add additional helper functions and shorthand keys.

#### Suffix .currency

If the friendly key ends with `.currency`, then the value will be automatically converted with the [currency](#currency) helper function.

```yaml
fill.number.currency:
  # fills "1,234.00"
  0: 1234
```

#### Suffix .whole

If the friendly key ends with `.whole`, then the value will be automatically converted with the [currencyWhole](#currencyWhole) helper function.

```yaml
fill.number.whole:
  # fills "1,234"
  0: 1234.00
```

#### Suffix .dec

If the friendly key ends with `.dec`, then the value will be automatically converted with the [currencyDec](#currencyDec) helper function.

```yaml
fill.number.dec:
  # fills "00"
  0: 1234.00
```

#### Suffix .nodash

If the friendly key ends with `.nodash`, then the value will automatically be stripped of any `-` dash characters.

```yaml
fill.number.dec:
  # fills "1234"
  0: 12-34
```

### Script helper functions

#### currency(number)

Converts the value to a currency value with thousand separators and decimal fraction (without any specific currency designator) using the locale of the operating system.  Unexpected string values will return `"NaN"` and  `undefined` and `null` values will return `0`.

#### currencyWhole(number)

Converts the value to a whole currency value with thousands separators, but no decimal fraction (without any specific currency designator) using the local of the operating system.  Unexpected string values will return `"NaN"` and  `undefined` and `null` values will return `0`.

#### currencyDec(number)

Returns the decimal fraction of a currency (without the leading decimal separator) using the local of the operating system.  Unexpected string values will return `"NaN"` and  `undefined` and `null` values will return `00`.

#### parseCurrency(string)

Parses a currency (ignoring thousand separators) and returns a number with decimal fraction (if present).  E.g. `"1,234.56"` will return `"1234.56"`.

#### strCapitalize(string)

Capitalizes the first letter of a string.

#### strNoDash(string)

Removes all dashes from a string, e.g. SSN or phone numbers.

#### strTrim(string)

Removes all leading and trailing whitespace around a string.

### Previous filled fields

It is possible to access previous filled fields through the `ctx` by accessing the `ctx.forms` by name.

```yaml
adjusted.income.currency:
  0: ${ctx.forms['business'].totalIncome - ctx.forms['business'].expenses}
```
