const CPF_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CNPJ_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6];

// digits are in reverse order
const verificationDigit = (digits, weights) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weights[i];
  }
  const dig = 11 - sum % 11;
  return dig >= 10 ? 0 : dig;
};

const generateCPF = () => {
  const digits = new Array(9);
  for (let i = 0; i < 9; i++)
    digits[i] = Math.floor(Math.random() * 10);
  digits.unshift(verificationDigit(digits, CPF_WEIGHTS));
  digits.unshift(verificationDigit(digits, CPF_WEIGHTS));
  digits.reverse();
  return digits.join('');
};

const generateCNPJ = () => {
  const digits = new Array(12);
  digits[0] = 1;
  digits[1] = 0;
  digits[2] = 0;
  digits[3] = 0;
  for (let i = 4; i < 12; i++)
    digits[i] = Math.floor(Math.random() * 10);

  digits.unshift(verificationDigit(digits, CNPJ_WEIGHTS));
  digits.unshift(verificationDigit(digits, CNPJ_WEIGHTS));
  digits.reverse();
  return digits.join('');
};

const fmtCPF = str => {
  return `${str.slice(0, 3)}.${str.slice(3, 6)}.${str.slice(6, 9)}-${str.slice(9, 11)}`;
};

const fmtCNPJ = str => {
  return `${str.slice(0, 2)}.${str.slice(2, 5)}.${str.slice(5, 8)}/${str.slice(8, 12)}-${str.slice(12, 14)}`;
};

class DocHandler {
  constructor(wrapper, genFunc, fmtFunc) {
    this.genFunc = genFunc;
    this.fmtFunc = fmtFunc;

    this.output = wrapper.querySelector('.doc-output');
    this.newButton = wrapper.querySelector('.doc-new');
    this.copyTooltip = wrapper.querySelector('.tooltip');
    this.copyTooltipContent = wrapper.querySelector('.tooltip-content');

    this.copyFormatted = false;
    this.current = null;
    this.generateNew();

    this.output.addEventListener('click', this.onClickOutput.bind(this));
    this.newButton.addEventListener('click', this.generateNew.bind(this));
    this.copyTooltip.addEventListener('mouseleave', () => this.copyTooltipContent.classList.remove('copied'));
  }

  generateNew() {
    this.current = this.genFunc();
    this.output.innerText = this.fmtFunc(this.current);
  }

  copy() {
    const str = this.copyFormatted ? this.fmtFunc(this.current) : this.current;
    return navigator.clipboard.writeText(str);
  }

  onClickOutput() {
    this.copy();
    this.copyTooltipContent.classList.add('copied');
  }
}

let AUTO_FILL_CODE = null; // loaded from file on init()

const makeAutoFillCode = (cpf, cnpj) => {
  return `
    (() => {
      ${AUTO_FILL_CODE}

      return autoFill(${JSON.stringify(cpf)}, ${JSON.stringify(cnpj)});
    })();
  `;
};

const STORAGE = chrome.storage.local;

class Tooltip {
  constructor() {
    // elements
    this.copyFormattedCheckbox = document.getElementById('copy-formatted');
    this.autoFillButton = document.getElementById('auto-fill');
    this.autoFillMessage = document.getElementById('auto-fill-message');

    this.copyFormatted = false;

    // events
    STORAGE.get('copyFormatted', this.onGetCopyFormatted.bind(this));
    this.copyFormattedCheckbox.addEventListener('change', this.onChangeCopyFormatted.bind(this));
    this.autoFillButton.addEventListener('click', this.autoFill.bind(this));

    this.CNPJHandler = new DocHandler(document.getElementById('doc-wrapper-cnpj'), generateCNPJ, fmtCNPJ);
    this.CPFHandler = new DocHandler(document.getElementById('doc-wrapper-cpf'), generateCPF, fmtCPF);
  }

  onGetCopyFormatted(res) {
    this.copyFormatted = res.copyFormatted;
    this.CNPJHandler.copyFormatted = this.copyFormatted;
    this.CPFHandler.copyFormatted = this.copyFormatted;
    this.copyFormattedCheckbox.checked = this.copyFormatted;
  }

  onChangeCopyFormatted() {
    this.copyFormatted = this.copyFormattedCheckbox.checked;
    this.CNPJHandler.copyFormatted = this.copyFormatted;
    this.CPFHandler.copyFormatted = this.copyFormatted;
    STORAGE.set({ copyFormatted: this.copyFormatted });
  }

  autoFill() {
    chrome.tabs.executeScript({
      code: makeAutoFillCode(this.CPFHandler.current, this.CNPJHandler.current),
      allFrames: true
    }, this.onAutoFillComplete.bind(this));
  }

  onAutoFillComplete(results) {
    const totalFields = results.reduce((a, b) => a + b, 0);
    let message = 'nenhum campo preenchido';
    if (totalFields === 1)
      message = 'um campo preenchido';
    else if (totalFields > 1)
      message = `${totalFields} campos preenchidos`;

    if (totalFields === 0)
      this.autoFillMessage.classList.add('not-found');
    else
      this.autoFillMessage.classList.remove('not-found');

    this.autoFillMessage.style.display = '';
    this.autoFillMessage.innerText = message;
  }
}

const init = async () => {
  AUTO_FILL_CODE = await (await fetch(chrome.runtime.getURL('autofill.js'))).text();
  new Tooltip();
};

if (document.readyState !== 'loading')
  init();
else
  document.addEventListener('DOMContentLoaded', init);
