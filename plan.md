# Chord Chart

A tool to quickly create chord chart diagrams for guitar.

It has a simple text based interface and outputs a PDF for 8.5x11 paper.

## Interface

There should be 2 inputs, a chord name input and the strings input. The chord name is user defined.

- The strings input is a simple text input. A muted string is represented by an 'X' and an open string is represented by a 'O'.
- The fret the shape starts on gets a number.
- I want it to feel snappy and responsive. Simple and developer friendly similar to how a developer values a CLI interface for speed and simplicity.

## Examples
I've included some examples to look at before building and planning this project.

## Design

Very simple single index.html. No framework. Just tailwind CSS for the styling. It can use web components if they help for abstracting re-usable parts.

## Output

The output is a PDF for 8.5x11 paper. It can use any PDF library (whichever is best for drawing simple lines or shapes).

There should be a PDF preview that renders the output.