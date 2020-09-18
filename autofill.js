const containsWord = (text, word) => (text || '').toLowerCase().split(/[\W_]+/).includes(word);

const shouldFill = (input, identifier) => {
  const nameLower = (input.name || '').toLowerCase();
  if (nameLower.endsWith(identifier) || nameLower.endsWith(`[${identifier}]`))
    return true;

  let label = null;
  if (input.id)
    label = document.querySelector(`label[for=${JSON.stringify(input.id)}]`)
  if (!label)
    label = input.closest('label');
  if (!label) {
    let prev = input.previousElementSibling;
    while (prev) {
      if (prev instanceof HTMLLabelElement) {
        label = prev;
        break;
      }
      if (!(prev instanceof HTMLBRElement))
        break;
      prev = prev.previousElementSibling;
    }

  }
  if (label && containsWord(label.innerText, identifier))
    return true;

  if (input.placeholder && containsWord(input.placeholder, identifier))
    return true;

  return false;
};

const shouldFillCPF = input => {
  const digits = (input.value || '').replace(/\D/g, '');
  if (digits.length === 11)
    return false;
  return shouldFill(input, 'cpf');
};

const shouldFillCNPJ = input => {
  const digits = (input.value || '').replace(/\D/g, '');
  if (digits.length === 14)
    return false;
  return shouldFill(input, 'cnpj');
};

const autoFill = (cpf, cnpj) => {
  let filledCount = 0;
  const allInputs = document.querySelectorAll('input[type="text"]');
  for (const input of allInputs) {
    let fillWith = null;
    if (shouldFillCPF(input)) {
      fillWith = cpf;
    } else if (shouldFillCNPJ(input)) {
      fillWith = cnpj;
    }
    if (fillWith !== null) {
      input.dispatchEvent(new FocusEvent('focus'));
      input.value = fillWith;
      input.dispatchEvent(new InputEvent('input', { data: fillWith }));
      input.dispatchEvent(new FocusEvent('blur'));
      filledCount += 1;
    }
  }
  return filledCount;
};
