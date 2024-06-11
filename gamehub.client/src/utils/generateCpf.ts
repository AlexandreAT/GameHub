export const generateCpf = (): string => {
    const cpf: number[] = [];
    for (let i = 0; i < 9; i++) {
      cpf.push(Math.floor(Math.random() * 10));
    }
  
    const calculateFirstDigit = () => {
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += cpf[i] * (10 - i);
      }
      let remainder = sum % 11;
      return remainder < 2? 0 : 11 - remainder;
    };
  
    const calculateSecondDigit = () => {
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += cpf[i] * (11 - i);
      }
      let remainder = sum % 11;
      return remainder < 2? 0 : 11 - remainder;
    };
  
    cpf.push(calculateFirstDigit());
    cpf.push(calculateSecondDigit());
  
    return cpf.join('').padStart(11, '0');
  };