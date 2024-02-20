export function validateCpf(cpf: string): boolean {
    // Verifica se o CPF tem 11 dígitos
    if (cpf.length !== 11) {
        return false;
    }

    // Verifica se todos os dígitos do CPF são iguais
    if (/^(\d)\1*$/.test(cpf)) {
        return false;
    }

    // Converte o CPF para um array de números
    const cpfDigits = cpf.split('').map(Number);

    // Calcula o primeiro dígito verificador
    const calculateFirstDigit = (): number => {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += cpfDigits[i] * (10 - i);
        }
        let remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    // Calcula o segundo dígito verificador
    const calculateSecondDigit = (): number => {
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += cpfDigits[i] * (11 - i);
        }
        let remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    // Verifica se os dígitos verificadores estão corretos
    const firstDigit = calculateFirstDigit();
    const secondDigit = calculateSecondDigit();

    return firstDigit === cpfDigits[9] && secondDigit === cpfDigits[10];
}
