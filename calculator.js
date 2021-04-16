const calculator = {
    operator: '',
    num1: 0,
    displayValue: '0',
    add: function(num1, num2) {
        return num1 + num2;
    },
    subtract: function(num1, num2) {
        return num1 - num2;
    },
    multiply: function(num1, num2) {
        return num1 * num2;
    },
    divide: function(num1, num2) {
        if (!num2) {
            alert("Don't divide by 0!");
            return num1;
        }
        return num1 / num2;
    },
    power: function (num1, num2){
        return Math.pow(num1, num2);
    },
    root: function (num1, num2){
        return Math.pow(num1, 1/num2);
    },
    equals: function(num1, num2) {
        return num2 ? num2 : num1;
   },
    operate: function(operator) {
         return this[operator](this.num1,+this.displayValue).toString();
    },
    addToDisplay: function(char) {
        if ((this.displayValue % 1 === 0 && char === '.') || this.displayValue !== '0') {
            this.displayValue = this.displayValue + char;
        } else {
            this.displayValue =  char;
        }
        return this.displayValue.toString();
    },
    clearAll: function() {
        this.num1 = 0;
        this.operator = '';
        return this.displayValue = '0';
    },
    clearEntry: function() {
        return this.displayValue = '0';
    },
    main: function() {
        const BUTTONS = document.querySelectorAll('button');
        const DISPLAY = document.querySelector('#display');
        let self = this;
        BUTTONS.forEach(button => {
            button.addEventListener('click', () => {
                if (button.id) {
                    if (button.id.indexOf('clear') > -1) {
                        DISPLAY.textContent = self[button.id]();
                        return;
                    }
                    if (self.operator) {
                        self.displayValue = calculator.operate(self.operator);
                        DISPLAY.textContent = ((+self.displayValue % 1 === 0) ? self.displayValue :
                            (+self.displayValue).toFixed(2)).toString();
                    }
                    self.num1 = +self.displayValue;
                    self.operator = button.id;
                    self.displayValue = '0';
                } else {
                    DISPLAY.textContent = self.addToDisplay(button.textContent);
                }
            });
        });
    }
}
calculator.main();