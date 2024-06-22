# Mathsidian for Obsidian

## Overview

Love the new Apple Math Notes? Mathsidian is a plugin that brings advanced mathematical capabilities to your Obsidian notes. Perform calculations, solve linear equations, create graphs, and more, all within your Obsidian environment.

## Features

1. **Math Block Calculations**: Perform multi-line calculations with variable storage.
2. **Equation Solving**: Solve linear equations easily.
3. **Graphing**: Create 2D graphs of mathematical functions.
4. **Inline Calculations**: Quick calculations within your text.
5. **Calculation History**: Keep track of your calculations.
6. **Custom Functions**: Extend the plugin's capabilities with custom functions.

## Usage

### Math Blocks

Use math blocks for multi-line calculations, variables and equation solving:

```math
2 + 2 \\
x = 5 \\
y = 10 \\
x + y \\
solve(2x - 7 = 3)
```

### Graphing

Create graphs using the graph block:

```graph
\```graph
f(x) = x^2
xRange: [-5, 5]
yRange: [0, 25]
\```
```

### Inline Calculations

For quick calculations in your text, use double parentheses:

```
The result of 2 + 2 is ((2 + 2)).
```

## Commands

Access these commands via the command palette (Ctrl/Cmd + P):

- **Insert Math Block**: Inserts a new math block.
- **Insert Graph Block**: Inserts a new graph block.
- **Insert Equation Solving Block**: Inserts a block for solving equations.
- **Insert Inline Calculation**: Inserts inline calculation syntax.
- **Show Calculation History**: Opens a modal with your calculation history.
- **Clear Stored Variables**: Resets all stored variables.

## Ribbon Icon

The plugin adds a calculator icon to the left sidebar ribbon. Click this to view your calculation history.

## Tips and Tricks

- Variables defined in math blocks persist across calculations until cleared.
- Use the `solve()` function for linear equations, e.g., `solve(x + 5 = 10)`.
- Customize graph appearance by adjusting the x and y range values.

## Limitations

- The equation solver currently handles only linear equations.
- Graphs are limited to 2D representations.

## Feedback and Support

If you encounter any issues or have suggestions for improvements, please visit the plugin's GitHub repository to submit an issue or contribute to the project.

Thank you for using Mathsidian!