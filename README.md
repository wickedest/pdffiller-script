# pdffiller-map

Simple yet powerful PDF form filling.

## Install

```bash
$ npm install pdffiller-map
```

## CLI usage

### Generate map file and examples

Parse the PDF and generate example files:

```bash
$ npx pdffiller-map map mypdf.pdf
```

The following files are generated:

* `mypdf-filled.pdf`: The `mypdf.pdf` with each field given an incremental index value.  Useful because it usually necessary to visually identify input fields directly from the form.
* `mypdf-filler.yaml`: An example form filler script that allows you to dynamically assign values to the PDF form input fields.
* `mypdf-inputs`: An example inputs file that is accessible via the form filler script as `ctx`.
* `mypdf-map.yaml`: 

## Example filled PDF

Each input field in the example filled PDF file has been assigned an incremental index value in the order in which fields are discovered.  The first field my have the unique ID, "topmostForm[0].UserDetails.f1_01[0]".  This field ID would be mapped to `0`, and the `"0"` value will be filled in the PDF.

## API

The [Quick Start](docs/README.md) and API can be found in [docs](docs/API.md).
