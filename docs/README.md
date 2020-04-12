# Quick start

To understand how the mapper works, it is best to show an example.  The PDF in this example is the [USA IRS f1040](https://www.irs.gov/pub/irs-pdf/f1040.pdf) tax form.  If you open the PDF, it has a lot of input fields, but for this example, we will focus on two: the **First name and middle initial**, and **Last name**.

![Image of two PDF fields](./images/f1040-empty-fields.png)

To get started, create a directory, download this file and copy it into the directory.  Then run:

```bash
$ npx formfiller-map map f1040.pdf
```

It will generate the following files:

| File name           | Description                                                  |
| :------------------ | ------------------------------------------------------------ |
| `f1040-map.yaml`    | A file that maps form IDs to integer IDs.  This file is required to fill forms later. |
| `f1040-filled.pdf`  | An example of the PDF input filled with each field given an incremental index value.  Useful in visually identifying input fields directly from the form |
| `f1040-filler.yaml` | An example form filler script that allows you to dynamically assign values to the PDF form input fields. |
| `f1040-inputs`      | An example inputs file that is accessible via the form filler script as `ctx`. |

The two input fields from the form have unique IDs have these keys:

| f1040 PDF inputs                      |
| ------------------------------------- |
| `topmostSubform[0].Page1[0].f1_02[0]` |
| `topmostSubform[0].Page1[0].f1_03[0]` |

This is where `pdffiller-map` aids in form filling.  It will map each unique input key to an incremental integer.  The mapping of input key to integer are stored in `f1040-map.yaml`.  The input will be referred to later by its integer ID.

| f1040 PDF inputs                      | Integer ID |
| ------------------------------------- | ---------- |
| `topmostSubform[0].Page1[0].f1_02[0]` | 6          |
| `topmostSubform[0].Page1[0].f1_03[0]` | 7          |

Then, `pdf-filler-map` fills in the `f1040.pdf` with the values "6" and "7" and generates an example `f1040-filled.pdf`.  This file _greatly_ aids in creating a form-filler because now, you can directly identify the field by visually inspecting the `f1040-filled.pdf` form.

![Image of two PDF fields with values 6 and 7](./images/f1040-filled-fields.png)

In order to fill forms, you write two files, a `f1040-filler.yaml` file, and a `f1040-inputs.yaml` file.  Examples of these files have been generated, but you will ultimately customize them heavily.  To fill fields 6 and 7, you only need to modify the `f1040-inputs.yaml` file, and change these two values:

```yaml
field6: Joe A
field7: Bloggs
```

Then, run the form filler:

```
$ npx pdfform-map fill f1040.pdf -f f1040-filler.yaml -i f1040-inputs.yaml -o output.pdf
```

If you look at `output.pdf`, it will now show:
![Image of two PDF fields with values Joe Bloggs](./images/f1040-filled-fields-joe-bloggs.png)

That is fine, but using `field6` and `field7` as inputs is not very useful.  First of all, those fields are specific to this `f1040.pdf` form, but also that it is also not very memorable.  The `pdffiller-map` allows you to customize the filler file and the input file so that the input file can have keys like `firstName`, `middleName`, and `lastName` that can be used for _any_ input form.  Then, the filler file can just refer to the inputs.

For example, let's create a new input file with user friendly fields called `inputs.yaml`:

```yaml
# inputs.yaml
firstName: Joe
middleName: Andrew
lastName: Bloggs
```

Let's create a new form filler file called `filler.yaml`:

```yaml
# filler.yaml
first.name.and.middle.initial:
  6: ${ctx.firstName}${ctx.middleName ? ` ${ctx.middleName[0]}` : ''}
last.name:
  7: ${ctx.lastName}
```

The keys `6` and `7` correlate back to the 6th and 7th inputs of `f1040.pdf`.  The values are interpreted as [JavaScript template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).  You use any string, number, or JavaScript expression as values.  The `first.name.and.middle.initial` is completely arbitrary.  In this case, it relates to the input field label and helps to correlate the input `6` with the field in the PDF.  The middle initial required more effort.  The input for `middleName` is `"Andrew"`, but we only need the middle initial.  Furthermore, not everyone has a middle name.  So, the expression tests to see if the `middleName` has value, and if it does, writes out a [space], followed by the first character of the `middleName`.

The `inputs.yaml` can now be re-used as inputs to _many_ PDF forms.

With `pdffiller-map`, the **bulk of the work** is writing the `filler.yaml` file.

## Form inputs

The inputs YAML file is intended to be a set of key/values for providing inputs to most any PDF form.  It is YAML, so you can define a flat structure, or a nested structure.  For example:

```yaml
firstName: Joe
lastName: Bloggs
address:
  street: 1 Main Street
  city: Anytown
  country: USA
```

In the above example, the street address would be accessed as: `${ctx.address.street}`.

## Form filler

The form filler are entries are created in the `filer.yaml` file and have the syntax:

> **any.unique.key**:
>
> *integer*: *value* 

The *integer* correlates to the form field's incremental integer ID that you wish to fill.  The *value* is a [JavaScript template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), giving full access to JavaScript.  The _value_ is described below.

### Filler values

The filler value is a [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).  One thing to keep in mind when creating filler values is that ultimately, everything is converted to a string when writing to PDF.

#### Constant values

```js
"string"
1234
1234.56
```

#### Inputs values

The `inputs.yaml` file is parsed and assigned to `ctx`, which is accessible when defining values.

```js
${ctx.firstName}
```

The input can contain additional text.

```js
Hello, ${ctx.firstName} ${ctx.lastName}
```

#### Calculated values

Sometimes values may not be easily transformed from an input value to a form value.  For example, an input might have one value, e.g. `maritalStatus: "single"` , but the input field might require a completely different value, but one that is based on the `${ctx.maritalStatus}`.  For example, some radio buttons might need to return `1` for "single", `2` for "married", etc.  Or perhaps, the field is a calculated sum.  This can be achieved with a transform.  The transform has the syntax:

> **any.unique.key**:
> value :
>  <form-value>
>    calculate: |
>        (ctx, value) => {
>            // JavaScript code
>        }

The `calculate` key is a JavaScript function.  The `ctx` is the user inputs, and the `value` is the value from `form-value`.  The return value of `calculate` is an object:

> {
>  field: '_the field integer ID to fill_',
>  fill: '_the value to fill_'
> }

So, for example, to fill the form field "0" with the value of "1" when "single" or "2" when "married":

```yaml
value:
  ${ctx.maritalStatus}
calculate: |
  (ctx, value) => {
    if (value === 'single') {
      return {
        field: '0',
        fill: '1'
      };
    } else if (value === 'married') {
      return {
        field: '0',
        fill: '2'
      }
    }
  }
```

#### Previous filled fields

It is possible 