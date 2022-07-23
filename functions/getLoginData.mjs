import fs from 'fs';
import login from './mocks/logins.json' assert {type: "json"};

export default function getLoginData(cnpj = null) {
    if (cnpj.length !== 14) return { status: 'error', message: "Não foi passado um CNPJ válido!" }
    console.log("Verificando o CNPJ, e pegando a data necessária")

    try {
        const data = JSON.parse(JSON.stringify(login));
        let returnData;
        for (let i = 0; i < data.length; i++) {
            if (data[i].cnpj.toString() === cnpj) returnData = data[i];
        }
        return returnData;

    } catch (err) {
        return { status: 'error', message: err.message }
    }
}
