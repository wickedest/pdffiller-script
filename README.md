# pdffiller-script

Scripted PDF form filling.  This project is inspired by [pdffiller](https://github.com/pdffillerjs/pdffiller), but needed something more powerful and flexible to allow filling out many forms with data from a single input configuration file, but also allowing values to be manipulated / computed before form filling.  For example, to combine first and last names, or to ensure currency values look like currency values.

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

<img src="docs/images/f1040-empty-fields.png" alt="Image of two empty fields from f1040 PDF" />

The two fields actually have these IDs:

<img src="docs/images/f1040-field-ids.png" alt="Image of two empty fields from f1040 PDF" />

These two fields exist on many (if not every) PDF tax form, and they have different keys.  The idea behind `pdffiller-script` will abstract these fields by giving each field in a form a unique integer ID that maps to the actual form fields.  It generates an [example PDF file](#example-filled-pdf) filled with the unique integer IDs so you can visually identify the fields you wish to fill.

<img src="docs/images/f1040-filled-fields.png" alt="Image of two filled fields from f1040 PDF" />

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

![Image of two empty fields from f1040 PDF](docs/images/f1040-filled-fields-joe-bloggs.png)

It has a dependency on the [PDF Toolkit](http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit). 

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

## API

Documentation on the filler-script is found in the [docs](docs/README.md).  There is a programmatic API that can be found in [docs](docs/API.md).
