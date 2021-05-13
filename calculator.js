let calculator = {
    Calculation: function(initialCurrentNumber, initialOperator, initialInput, bracketOpen) {
        this.currentNumber = initialCurrentNumber;
        this.lastOperator = initialOperator;
        this.savedNumber = initialInput;
        this.bracketOpen = bracketOpen;
    },
    operatorPrecedence: {
        '+': 1,
        '-': 1,
        'x': 2,
        '/': 2,
        '^': 3
    },
    setCalculationProtoype: function() {
        this.Calculation.prototype = {
            constructor: this.Calculation,
            '+': function(num1, num2) {
                return num1 + num2;
            },
            '-': function(num1, num2) {
                return num1 - num2;
            },
            'x': function(num1, num2) {
                return num1 * num2;
            },
            '/': function(num1, num2) {
                return num1 / num2;
            },
            '^': function (num1, num2){
                return Math.pow(num1, num2);
            },
            '=': function(num1, num2) {
                return num2 ? num2 : num1;
            },
            operate: function(operator) {
                return this[operator](this.savedNumber,this.currentNumber);
            },
            executeCalculation: function(buttonId) {
                let result = this.currentNumber;
        
                // Execute lastOperator
                if (this.lastOperator) {
                    this.currentNumber = this.operate(this.lastOperator);
                    result = this.currentNumber;
                }
        
                // Update Values
                    this.savedNumber = this.currentNumber;
                    this.lastOperator = buttonId;
                    this.currentNumber = 0;
                return result;
            }
        }
    },
    // take result from finished calculation and use it in previous calculation
    getResultAndDeleteCalculation: function(calculations) {
        let result = calculations[calculations.length -1].savedNumber;
        calculations.pop();
        calculations[calculations.length - 1].currentNumber = result;
    },
    // clear one or two chars, dependent on last 3 chars
    clear: function(equation) {
        let lastChar = equation.charAt(equation.length - 1);
        if (lastChar === ' ') {
            equation = equation.slice(0,-2);
        } else {
            equation = equation.slice(0,-1);
            if (equation.charAt(equation.length - 1) === ' ') {
                equation = equation.slice(0,-1);
            }
        }
        return equation;
    },
    //calculate if possible, if not open a new calculation
    checkPrecedenceAndCalculate: function(newOperator,calculations) {
        let last = calculations.length - 1;
        let calculation = calculations[last];
        if (newOperator === '(') {
            calculations.push(new this.Calculation(0, '', 0, true));
            return
        }

        //check if new Operator takes precedence - if true then add new Calculation to determine precedence first
        if (this.operatorPrecedence[newOperator] > this.operatorPrecedence[calculation.lastOperator]) {
            calculations.push(new this.Calculation(0, newOperator, calculation.currentNumber, false));
            return;
        }

        // execute all calculations where precedence is over
            let operationFinished = this.operatorPrecedence[newOperator] < this.operatorPrecedence[calculation.lastOperator];
            for (let i = last; i >= 0; i--) {
                // Is the Equation finished or is a operation with precedence (without open bracket) finished?
                if ((newOperator === '=' || (!calculations[i].bracketOpen && operationFinished))
                && calculations.length > 1) {
                    calculations[i].executeCalculation(')');
                    this.getResultAndDeleteCalculation(calculations);
                } else {
                    calculations[i].executeCalculation(newOperator);
                    //If clicked button was a closing bracket, get result and delete calculation
                    if (newOperator=== ')') this.getResultAndDeleteCalculation(calculations);
                    return;
                }
            }

    },
    //split equation and parse array into calculations 
    processEquation: function(equation) {
    let equationArray = equation.trim().split(/([+x/)(=^-])/);
        let calculations = [new this.Calculation(0,'',0, false)];
        let calculation;
        equationArray.forEach( el => {
            el = el.trim();
            if(!el) return;
            calculation = calculations[calculations.length -1];
            if (isNaN(el)) {
                this.checkPrecedenceAndCalculate(el, calculations);
            } else {
                calculation.currentNumber = Number(el);
            } 
        });
        return calculations[0].savedNumber;
    },
    // find index, where </sup> has to be inserted
    findClosingPower: function(equation,indexStart) {
        let openBrackets = 0;
        for (let i = indexStart; i < equation.length; i++) {
            if (equation.charAt(i) === '(') {
                openBrackets++;
            // do not use negative lookbehind (not working in safari)
            //} else if ((equation.charAt(i).match(/([+x(?<!<)/)-])/g) || []).length === 1) {
            // check if char is terminating <sup> and all brackets are closed
            } else if ((equation.charAt(i).match(/([+x)-])/g) || []).length === 1
                    || (equation.charAt(i) === '/' && equation.charAt(i-1) !== '<')) {
                if (equation.charAt(i) === ')' && openBrackets) {
                    openBrackets--;
                }
                if (openBrackets === 0) {
                    // if ')' and open Bracket in Power return current index,
                    // else return currentIndex -1 (</sup> has to be inserted before other operator)
                    let equationPart = equation.slice(indexStart,i + 1);
                    let operatorArray = equationPart.match(/([)(])/g) || [];
                    let openBracketsInPower = 0;
                    for (let j = 0; j < operatorArray.length - 1; j++) {
                        if (operatorArray[j] === '(') {
                            openBracketsInPower++;
                        } else if (operatorArray[j] === ')') {
                            openBracketsInPower--;
                        }
                    }
                    return (equation.charAt(i) === ')' && openBracketsInPower >= 1) ? i : i - 1;
                }
            }
        }
        return null;
    },
    // format Equation for displaying
    formatEquation: function(equation){
        //format all power operators
        let powerIndex = equation.indexOf(' ^ ');
        while (powerIndex > -1) {
            let closingIndex = this.findClosingPower(equation, powerIndex + 3) || equation.length - 1;
            equation = this.replaceAt(equation, powerIndex, ' ^ ', '<sup>');
            equation = equation.slice(0,closingIndex + 3) + '</sup>' + equation.slice(closingIndex + 3);
            powerIndex = equation.indexOf(' ^ ');
        }
        // Check Ending for formating
        let lastChar = equation.charAt(equation.length - 1);
        if (equation.indexOf('^</sup>') > -1) {
            equation = equation.slice(0, equation.indexOf('^</sup>') - 1) + '<sup><span id="placeholder">0</span></sup></sup>';
        } else if (lastChar === '^') {
            equation = equation.slice(0,-2) + '<sup><span id="placeholder">0</span></sup>';
        } else if (isNaN(lastChar) && lastChar !== '.' && lastChar !== '>' && lastChar !== ')' && lastChar !== '=') {
            equation += '<span id="placeholder">' + ((lastChar !== '(') ? ' ' : '') + '0</span>';
        }
        return equation;
    },
    // replace term in string
    replaceAt: function(equation, index, search, replacement) {
        let stringPt1 = equation.slice(0,index);
        let stringPt2 = equation.slice(index);
        stringPt2 = stringPt2.replace(search, replacement);
        return stringPt1 + stringPt2;
    },
    //count OpenBrackets to determine if closing Bracket is valid input
    countOpenBrackets: function(equation) {
        const CLOSINGBRACKET = document.querySelector('#closing-bracket');
        let openingBrackets = (equation.match(/\(/g) || []).length;
        let closingBrackets = (equation.match(/\)/g) || []).length;
        let openBrackets = openingBrackets - closingBrackets;
        if (openBrackets > 0) {
            CLOSINGBRACKET.style.opacity = '100%';
        } else {
            CLOSINGBRACKET.style.opacity = '50%';
        }
        return openBrackets
    },
    // handle invalid operator input
    handleOperatorExceptions: function(equation, clickedButton) {
        let lastChar = equation.charAt(equation.length - 1);
        if (equation === '' && clickedButton !== '(') {
            clickedButton = '0 ' + clickedButton;
        } else if (clickedButton === '(' && equation.length > 0 && (!isNaN(lastChar) || lastChar === '.')) {
            clickedButton = ' x ' + clickedButton;
        } else if (isNaN(lastChar) && lastChar !== '.') {
            if (lastChar === '(' && clickedButton === ')') {
                clickedButton = '0' + clickedButton;
            } else if (lastChar === '(' && clickedButton !== '(') {
                clickedButton = '0 ' + clickedButton;
            } else if (lastChar !== ')'  && clickedButton === ')') {
                clickedButton = ' 0' + clickedButton;
            } else if (lastChar !== ')' && clickedButton !== '(') {
                clickedButton = ' 0 ' + clickedButton;
            }
        }
        if (clickedButton.length === 1 && clickedButton !== ')' && lastChar !== '(') {
            clickedButton = ' ' + clickedButton;
        }
        return clickedButton;
    },
    // handle invalid number input
    handleNumberExceptions: function(equation,clickedButton) {
        let lastChar = equation.charAt(equation.length - 1);
        if (equation === '' && clickedButton === '.') {
            clickedButton = '0' + clickedButton;
        } else if (isNaN(lastChar) && lastChar !== '.' && lastChar !== '(') {
            clickedButton = ((lastChar !== ')') ? ' ' : ' x ') + clickedButton;
        }
        return clickedButton;
    },
    //process user input
    processInput: function(clickedButton, equation) {
        const DISPLAY = document.querySelector('#display');
        const EQUATION = document.querySelector('#equation-text');
        let openBrackets;
        if (isNaN(clickedButton) && clickedButton !== '.') {
            if (clickedButton === 'CE') {
                equation = this.clear(equation);
                EQUATION.innerHTML = this.formatEquation((equation === '') ? '<span id="placeholder">0</span>' : equation);
                EQUATION.scrollLeft = EQUATION.scrollWidth;
                DISPLAY.textContent = this.roundNumber(this.processEquation(equation + '='));
                this.countOpenBrackets(equation + clickedButton);
                return equation;
            }

            if (equation.indexOf('=') > -1) equation = DISPLAY.textContent;
            if (clickedButton === '(' || clickedButton === ')') {
                openBrackets = this.countOpenBrackets(equation + clickedButton);
                if (openBrackets < 0) {
                    return equation;
                }
            }
            
            clickedButton = this.handleOperatorExceptions(equation,clickedButton);
            equation += clickedButton;
            EQUATION.innerHTML = this.formatEquation(equation);
            EQUATION.scrollLeft = EQUATION.scrollWidth;
            DISPLAY.textContent = this.roundNumber(this.processEquation((equation.indexOf('=') > -1) ? equation : equation + '='));
        } else {
            if (equation.indexOf('=') > -1) equation = '';
            clickedButton = this.handleNumberExceptions(equation, clickedButton);
            equation += clickedButton;
            EQUATION.innerHTML = this.formatEquation(equation);
            EQUATION.scrollLeft = EQUATION.scrollWidth;
            DISPLAY.textContent = this.roundNumber(this.processEquation(equation + '='));
        }
        return equation;
    }, roundNumber: function(string) {
        let number = +string;
        let result =  ((number % 1 === 0) ? number : number.toFixed(2));
        let i = ''
        while (result.toString().length > 12) {
            if (i && i > -1) {
                result = parseFloat(result).toExponential(i);
                i--;
            } else {
                result = parseFloat(result).toExponential();
                i = 10; 
            }
        }
        return result.toString();
    },
    //start calculator
    main: function() {
        this.setCalculationProtoype();
        this.calculations = [new this.Calculation(0,'',0, false)];
        const BUTTONS = document.querySelectorAll('button');
        let equation = '';
        BUTTONS.forEach(button => {
            button.addEventListener('click', () => {
                let input = (button.id !== 'power') ? button.textContent : '^';
                equation = this.processInput(input, equation);
            });
        });
        window.addEventListener('keydown', (e) => {
            let code;
            let translation = {
                'Dead': '^',
                'Backspace': 'CE'
            }
            let allowedKeys = ['0','1','2','3','4','5','6','7','8','9','(',')','^','CE','/','x','-','+','-','=','.'];
            if (e.key !== undefined) {
                code = e.key;
            } else if (e.keyIdentifier !== undefined) {
                code = e.keyIdentifier;
            } else if (e.keyCode !== undefined) {
                code = e.keyCode;
            }
            code = translation[code] || code;
            if (!allowedKeys.includes(code)) return;
            equation = this.processInput(code, equation);
        });
    }
}
calculator.main();