import { Plugin, MarkdownPostProcessorContext, MarkdownView, Modal, App, Notice } from 'obsidian';
import * as math from 'mathjs';
import functionPlot from 'function-plot';

export default class EnhancedMathPlugin extends Plugin {
  private variables: { [key: string]: any } = {};
  private history: string[] = [];
  private mathInstance: math.MathJsStatic;

  async onload() {
    console.log('Loading Enhanced Math Plugin');

    this.mathInstance = math.create(math.all);

    // Add custom functions
    this.mathInstance.import({
      hello: function (name: string) {
        return `Hello, ${name}!`;
      }
    }, {override: true});

    this.registerMarkdownCodeBlockProcessor("math", this.mathProcessor.bind(this));
    this.registerMarkdownCodeBlockProcessor("graph", this.graphProcessor.bind(this));
    this.registerMarkdownPostProcessor(this.inlineProcessor.bind(this));

    this.addRibbonIcon('calculator', 'Math Plugin', (evt: MouseEvent) => {
      this.showHistory();
    });

    this.addCommand({
      id: 'insert-math-block',
      name: 'Insert Math Block',
      editorCallback: (editor, view) => {
        const cursor = editor.getCursor();
        editor.replaceRange("```math\n\n```", cursor);
        editor.setCursor({ line: cursor.line + 1, ch: 0 });
        new Notice('Math block inserted');
      }
    });

    this.addCommand({
      id: 'insert-graph-block',
      name: 'Insert Graph Block',
      editorCallback: (editor, view) => {
        const cursor = editor.getCursor();
        editor.replaceRange("```graph\nf(x) = x^2\nxRange: [-5, 5]\nyRange: [0, 25]\n```", cursor);
        editor.setCursor({ line: cursor.line + 1, ch: 0 });
        new Notice('Graph block inserted');
      }
    });

    this.addCommand({
      id: 'insert-equation-block',
      name: 'Insert Equation Solving Block',
      editorCallback: (editor, view) => {
        const cursor = editor.getCursor();
        editor.replaceRange("```math\nsolve(x + 5 = 10)\n```", cursor);
        editor.setCursor({ line: cursor.line + 1, ch: 0 });
        new Notice('Equation solving block inserted');
      }
    });

    this.addCommand({
      id: 'show-calculation-history',
      name: 'Show Calculation History',
      callback: () => {
        this.showHistory();
        new Notice('Showing calculation history');
      }
    });

    this.addCommand({
      id: 'clear-variables',
      name: 'Clear Stored Variables',
      callback: () => {
        this.variables = {};
        new Notice('Cleared all stored variables');
      }
    });

    this.addCommand({
      id: 'insert-inline-calculation',
      name: 'Insert Inline Calculation',
      editorCallback: (editor, view) => {
        const cursor = editor.getCursor();
        editor.replaceRange("((  ))", cursor);
        editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
        new Notice('Inline calculation inserted');
      }
    });
  }

  onunload() {
    console.log('Unloading Enhanced Math Plugin');
  }

  mathProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const mathExpressions = source.split('\n').filter(line => line.trim() !== '');
    
    const resultElement = document.createElement('div');
    resultElement.classList.add('math-result');
    
    mathExpressions.forEach((expr, index) => {
      const lineElement = document.createElement('div');
      lineElement.classList.add('math-line');
      
      const exprElement = document.createElement('span');
      exprElement.textContent = expr;
      lineElement.appendChild(exprElement);

      if (expr.trim() !== '') {
        try {
          let result;
          if (expr.startsWith('solve(') && expr.endsWith(')')) {
            result = this.solveEquation(expr);
          } else {
            result = this.mathInstance.evaluate(expr, this.variables);
          }
          if (expr.includes('=') && !expr.startsWith('solve(')) {
            const [varName, ] = expr.split('=');
            this.variables[varName.trim()] = result;
          }
          const resultSpan = document.createElement('span');
          resultSpan.textContent = ` ${this.formatResult(result)}`;
          resultSpan.style.color = 'green';
          lineElement.appendChild(resultSpan);
          this.history.push(`${expr} = ${this.formatResult(result)}`);
        } catch (error) {
          const errorSpan = document.createElement('span');
          errorSpan.textContent = ` Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errorSpan.style.color = 'red';
          lineElement.appendChild(errorSpan);
        }
      }

      resultElement.appendChild(lineElement);
    });

    el.appendChild(resultElement);
  }

  graphProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const graphData = source.split('\n');
    
    const graphElement = document.createElement('div');
    graphElement.classList.add('math-graph');
    graphElement.style.width = '100%';
    graphElement.style.height = '400px';

    try {
      const funcLine = graphData.find(line => line.startsWith('f(x)'));
      const xRangeLine = graphData.find(line => line.startsWith('xRange'));
      const yRangeLine = graphData.find(line => line.startsWith('yRange'));

      if (!funcLine || !xRangeLine || !yRangeLine) {
        throw new Error('Missing required graph parameters');
      }

      const func = funcLine.split('=')[1].trim();
      const xRange = JSON.parse(xRangeLine.split(':')[1].trim());
      const yRange = JSON.parse(yRangeLine.split(':')[1].trim());

      functionPlot({
        target: graphElement,
        width: graphElement.clientWidth,
        height: graphElement.clientHeight,
        yAxis: { domain: yRange },
        xAxis: { domain: xRange },
        data: [{
          fn: func,
          graphType: 'polyline'
        }]
      });

    } catch (error) {
      graphElement.textContent = `Error creating graph: ${error instanceof Error ? error.message : 'Unknown error'}`;
      graphElement.style.color = 'red';
    }

    el.appendChild(graphElement);
  }

  inlineProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const textNodes = this.getTextNodes(el);
    textNodes.forEach((node) => {
      const text = node.textContent;
      if (text) {
        const regex = /\(\((.*?)\)\)/g;
        let match;
        let lastIndex = 0;
        const fragments = [];

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          
          const expression = match[1].trim();
          try {
            const result = this.mathInstance.evaluate(expression, this.variables);
            const resultNode = document.createElement('span');
            resultNode.addClass('math-inline-result');
            resultNode.textContent = `${expression} = ${this.formatResult(result)}`;
            fragments.push(resultNode);
            this.history.push(`${expression} = ${this.formatResult(result)}`);
          } catch (error) {
            const errorNode = document.createElement('span');
            errorNode.addClass('math-inline-error');
            errorNode.textContent = `Error in "${expression}": ${error instanceof Error ? error.message : 'Unknown error'}`;
            fragments.push(errorNode);
          }

          lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
          fragments.push(document.createTextNode(text.slice(lastIndex)));
        }

        if (fragments.length > 0) {
          const parent = node.parentNode;
          if (parent) {
            fragments.forEach(fragment => parent.insertBefore(fragment, node));
            parent.removeChild(node);
          } else {
            console.error('Parent node is null, cannot replace inline calculation');
          }
        }
      }
    });
  }

  getTextNodes(node: Node): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    let currentNode;
    while (currentNode = walker.nextNode()) {
      textNodes.push(currentNode as Text);
    }
    return textNodes;
  }

  solveEquation(expr: string): string {
    // Remove 'solve(' prefix and ')' suffix
    const equation = expr.slice(6, -1);
    
    try {
      // Split the equation into left and right sides
      const [left, right] = equation.split('=').map(side => side.trim());
      
      // Rearrange the equation to have all terms on the left side
      const rearrangedEquation = this.mathInstance.parse(`(${left}) - (${right})`);
      
      // Simplify the equation
      const simplifiedEquation = this.mathInstance.simplify(rearrangedEquation);
      
      // Extract coefficients
      const coefficients = this.extractCoefficients(simplifiedEquation);
      
      // Solve the equation
      const solution = this.solveLinearEquation(coefficients.a, coefficients.b);
      
      // Format the solution
      if (Array.isArray(solution)) {
        return `x = ${solution.map(sol => this.formatResult(sol)).join(' or ')}`;
      } else {
        return `x = ${this.formatResult(solution)}`;
      }
    } catch (error) {
      throw new Error(`Failed to solve equation: ${error.message}`);
    }
  }

  extractCoefficients(expr: math.MathNode): { a: number, b: number } {
    let a = 0;
    let b = 0;

    const extractFromNode = (node: math.MathNode) => {
      if (math.isOperatorNode(node)) {
        if (node.fn === 'add') {
          node.args.forEach(extractFromNode);
        } else if (node.fn === 'multiply') {
          if (node.args.length === 2 && math.isSymbolNode(node.args[1]) && node.args[1].name === 'x') {
            a += this.mathInstance.evaluate(node.args[0].toString());
          } else {
            b += this.mathInstance.evaluate(node.toString());
          }
        } else if (node.fn === 'unaryMinus') {
          if (math.isSymbolNode(node.args[0]) && node.args[0].name === 'x') {
            a -= 1;
          } else {
            b -= this.mathInstance.evaluate(node.args[0].toString());
          }
        } else {
          b += this.mathInstance.evaluate(node.toString());
        }
      } else if (math.isSymbolNode(node) && node.name === 'x') {
        a += 1;
      } else if (math.isConstantNode(node)) {
        b += node.value;
      } else {
        b += this.mathInstance.evaluate(node.toString());
      }
    };

    extractFromNode(expr);

    return { a, b: -b }; // Note: we negate b because we moved everything to the left side
  }

  solveLinearEquation(a: number, b: number): number | number[] {
    if (a === 0) {
      if (b === 0) {
        return []; // Infinite solutions
      } else {
        throw new Error('No solution');
      }
    } else {
      return b / a;
    }
  }

  formatResult(result: any): string {
    if (typeof result === 'number') {
      return result.toPrecision(6);
    } else if (math.isMatrix(result)) {
      return math.format(result, { precision: 6 });
    } else if (math.isUnit(result)) {
      return result.format({ precision: 6 });
    } else {
      return this.mathInstance.format(result, { precision: 6 });
    }
  }

  showHistory() {
    const historyModal = new HistoryModal(this.app, this.history);
    historyModal.open();
  }
}

class HistoryModal extends Modal {
  constructor(app: App, private history: string[]) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Calculation History' });
    const historyList = contentEl.createEl('ul');
    this.history.slice().reverse().forEach(item => {
      historyList.createEl('li', { text: item });
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}